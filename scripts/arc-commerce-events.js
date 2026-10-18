/**
 * BNTS Commerce Starter: B2B action events for AEP and CJA.
 *
 * Adobe's storefront events SDK covers browse, cart, checkout, account and
 * requisition list events. It has no events for negotiable quotes, purchase
 * orders, company administration or Quick Order. This module fills that gap.
 *
 * How it works: the B2B drop-ins call Commerce GraphQL mutations. We watch
 * successful mutations (matched on the root field name, which is stable across
 * drop-in versions), then send one XDM ExperienceEvent per action through the
 * page's AEP Web SDK instance (window.alloy, configured by the collector with
 * this site's datastream).
 *
 * XDM: eventType = "b2b.<action>", details in
 * _hs2solamerptrsd.bntsCommerce (field group "BNTS Commerce Actions").
 * For a client org, change TENANT to the client's AEP tenant id.
 *
 * Loaded from head.html so the fetch hook is in place before drop-ins load.
 */

const TENANT = '_hs2solamerptrsd';

// root mutation field -> [area, action]
const ACTIONS = {
  // Negotiable quotes
  requestNegotiableQuote: ['quote', 'quote.requested'],
  sendNegotiableQuoteForReview: ['quote', 'quote.sentForReview'],
  updateNegotiableQuoteQuantities: ['quote', 'quote.quantitiesUpdated'],
  removeNegotiableQuoteItems: ['quote', 'quote.itemsRemoved'],
  closeNegotiableQuotes: ['quote', 'quote.closed'],
  deleteNegotiableQuotes: ['quote', 'quote.deleted'],
  duplicateNegotiableQuote: ['quote', 'quote.duplicated'],
  placeNegotiableQuoteOrder: ['quote', 'quote.ordered'],
  placeNegotiableQuoteOrderV2: ['quote', 'quote.ordered'],
  requestNegotiableQuoteTemplateFromQuote: ['quote', 'quoteTemplate.requested'],
  acceptNegotiableQuoteTemplate: ['quote', 'quoteTemplate.accepted'],
  generateNegotiableQuoteFromTemplate: ['quote', 'quoteTemplate.quoteGenerated'],
  // Purchase orders
  placePurchaseOrder: ['purchaseOrder', 'purchaseOrder.submitted'],
  approvePurchaseOrders: ['purchaseOrder', 'purchaseOrder.approved'],
  rejectPurchaseOrders: ['purchaseOrder', 'purchaseOrder.rejected'],
  cancelPurchaseOrders: ['purchaseOrder', 'purchaseOrder.canceled'],
  placeOrderForPurchaseOrder: ['purchaseOrder', 'purchaseOrder.ordered'],
  addPurchaseOrderComment: ['purchaseOrder', 'purchaseOrder.commented'],
  createPurchaseOrderApprovalRule: ['purchaseOrder', 'approvalRule.created'],
  updatePurchaseOrderApprovalRule: ['purchaseOrder', 'approvalRule.updated'],
  deletePurchaseOrderApprovalRule: ['purchaseOrder', 'approvalRule.deleted'],
  // Company
  createCompany: ['company', 'company.created'],
  updateCompany: ['company', 'company.updated'],
  createCompanyUser: ['companyUser', 'companyUser.invited'],
  updateCompanyUser: ['companyUser', 'companyUser.updated'],
  deleteCompanyUser: ['companyUser', 'companyUser.removed'],
  createCompanyRole: ['companyUser', 'companyRole.created'],
  updateCompanyRole: ['companyUser', 'companyRole.updated'],
  deleteCompanyRole: ['companyUser', 'companyRole.deleted'],
  createCompanyTeam: ['company', 'companyTeam.created'],
  // Requisition lists (create, delete, add and remove items are already sent by the SDK)
  addRequisitionListItemsToCart: ['requisitionList', 'requisitionList.addedToCart'],
  shareRequisitionList: ['requisitionList', 'requisitionList.shared'],
};

const QUICK_ORDER_PATH = /\/quick-order/;
const QUEUE_KEY = 'bnts-commerce-queue';
const SEEN_KEY = 'bnts-commerce-seen';
let flushing = false;

// Pending events live in sessionStorage so an action that navigates away
// (Quick Order goes straight to the cart) is still sent on the next page.
function readQueue() {
  try { return JSON.parse(window.sessionStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}
function writeQueue(q) {
  try { window.sessionStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-50))); } catch { /* ignore */ }
}
// QA aid: last 20 mutation root fields seen, matched or not
function remember(fields, matched) {
  try {
    const seen = JSON.parse(window.sessionStorage.getItem(SEEN_KEY) || '[]');
    seen.push({ t: new Date().toISOString(), path: window.location.pathname, fields, matched });
    window.sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen.slice(-20)));
  } catch { /* ignore */ }
}

function rootFields(query) {
  const q = query || '';
  const start = q.search(/\bmutation\b/);
  if (start < 0) return [];
  // skip the operation name and the variable definitions, which can hold
  // default values with braces, e.g. $sort: SortInput = {field: CREATED_AT}
  let i = start + 'mutation'.length;
  while (i < q.length && q[i] !== '(' && q[i] !== '{') i += 1;
  if (q[i] === '(') {
    let paren = 0;
    for (; i < q.length; i += 1) {
      if (q[i] === '(') paren += 1;
      else if (q[i] === ')') { paren -= 1; if (paren === 0) { i += 1; break; } }
    }
    while (i < q.length && q[i] !== '{') i += 1;
  }
  if (q[i] !== '{') return [];
  // top-level field names (optionally aliased) followed by "(" or "{"
  const body = q.slice(i + 1);
  const fields = [];
  let depth = 0; // braces
  let args = 0; // parentheses (field arguments)
  let token = '';
  for (let j = 0; j < body.length; j += 1) {
    const ch = body[j];
    const top = depth === 0 && args === 0;
    if (top && /[A-Za-z0-9_]/.test(ch)) {
      token += ch;
    } else {
      // "alias: field" keeps the field; a bare token followed by "(", "{" or space is a field
      if (top && token && ch !== ':') fields.push(token);
      token = '';
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    else if (ch === '(') args += 1;
    else if (ch === ')') args -= 1;
    if (depth < 0) break;
  }
  return [...new Set(fields.filter(Boolean))];
}

// Walk the mutation result for a readable id, name, status, total and count.
function summarize(result) {
  const out = {};
  const visit = (node, depth) => {
    if (!node || typeof node !== 'object' || depth > 4) return;
    if (Array.isArray(node)) {
      if (out.itemCount === undefined && node.length) out.itemCount = node.length;
      node.slice(0, 1).forEach((n) => visit(n, depth + 1));
      return;
    }
    if (!out.objectId) out.objectId = node.uid || node.number || node.id || node.increment_id;
    if (!out.objectName) out.objectName = node.name || node.number || node.company_name || node.email;
    if (!out.status && typeof node.status === 'string') out.status = node.status;
    const total = node.prices?.grand_total?.value ?? node.totals?.grand_total?.value
      ?? node.grand_total?.value;
    if (out.value === undefined && typeof total === 'number') out.value = total;
    Object.values(node).forEach((v) => visit(v, depth + 1));
  };
  visit(result, 0);
  if (out.objectId !== undefined) out.objectId = String(out.objectId);
  if (out.objectName !== undefined) out.objectName = String(out.objectName);
  return out;
}

async function flush() {
  if (flushing) return;
  flushing = true;
  for (let i = 0; i < 40 && typeof window.alloy !== 'function'; i += 1) {
    // the collector configures alloy in the delayed phase
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => { setTimeout(r, 500); });
  }
  if (typeof window.alloy === 'function') {
    let q = readQueue();
    while (q.length) {
      const xdm = q[0];
      const { bntsId, ...payload } = xdm; // bntsId is queue bookkeeping, not XDM
      try {
        // eslint-disable-next-line no-await-in-loop
        await window.alloy('sendEvent', { xdm: payload });
      } catch (e) {
        console.warn('BNTS commerce events: sendEvent failed', e);
      }
      q = readQueue().filter((x) => x.bntsId !== xdm.bntsId);
      writeQueue(q);
    }
  }
  flushing = false;
}

function track(area, action, details) {
  const bntsCommerce = { area, action, ...details };
  Object.keys(bntsCommerce).forEach((k) => bntsCommerce[k] === undefined && delete bntsCommerce[k]);
  const q = readQueue();
  q.push({
    bntsId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventType: `b2b.${action}`,
    timestamp: new Date().toISOString(),
    web: { webPageDetails: { URL: window.location.href, name: document.title } },
    [TENANT]: { bntsCommerce },
  });
  writeQueue(q);
  window.adobeDataLayer = window.adobeDataLayer || [];
  window.adobeDataLayer.push({ event: 'bnts-commerce-action', eventInfo: { bntsCommerce } });
  flush();
}

function handle(query, variables, json) {
  const fields = rootFields(query);
  const ok = !(json?.errors?.length);
  remember(fields, fields.filter((f) => ACTIONS[f] || (f === 'addProductsToCart' && QUICK_ORDER_PATH.test(window.location.pathname))));
  fields.forEach((field) => {
    let mapping = ACTIONS[field];
    if (!mapping && field === 'addProductsToCart' && QUICK_ORDER_PATH.test(window.location.pathname)) {
      const items = variables?.cartItems || variables?.input?.cartItems || [];
      mapping = ['quickOrder', 'quickOrder.addedToCart'];
      track(mapping[0], mapping[1], {
        itemCount: Array.isArray(items) ? items.length : undefined,
        method: 'quick-order',
        succeeded: ok,
      });
      return;
    }
    if (!mapping) return;
    const summary = summarize(json?.data?.[field]);
    track(mapping[0], mapping[1], { ...summary, succeeded: ok });
  });
}

function parseBody(body) {
  if (typeof body !== 'string') return null;
  try {
    const j = JSON.parse(body);
    return (j && typeof j.query === 'string') ? j : null;
  } catch {
    return null;
  }
}

const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const response = await originalFetch(input, init);
  try {
    // FetchGraphQL may pass the endpoint as a string, a URL object or a Request
    let url = input?.url;
    if (typeof input === 'string') url = input;
    else if (input instanceof URL) url = input.href;
    const method = (init.method || input?.method || 'GET').toUpperCase();
    if (method === 'POST' && url && url.includes('graphql')) {
      const payload = parseBody(init.body);
      if (payload && /^\s*mutation\b/.test(payload.query)) {
        response.clone().json().then((json) => handle(payload.query, payload.variables, json))
          .catch(() => {});
      }
    }
  } catch (e) {
    // never break the storefront over analytics
  }
  return response;
};

// For QA in the console: window.bntsCommerceEvents.test()
window.bntsCommerceEvents = {
  test: () => track('quote', 'qa.test', { objectName: 'console test', succeeded: true }),
  actions: Object.keys(ACTIONS),
  pending: () => readQueue(),
  seen: () => JSON.parse(window.sessionStorage.getItem(SEEN_KEY) || '[]'),
};

// send anything left over from the previous page
if (readQueue().length) flush();
