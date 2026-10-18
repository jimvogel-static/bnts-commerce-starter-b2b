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
const queue = [];
let flushing = false;

function rootFields(query) {
  const m = /^\s*mutation\b[^{]*\{([\s\S]*)$/.exec(query || '');
  if (!m) return [];
  // top-level field names (optionally aliased) followed by "(" or "{"
  const body = m[1];
  const fields = [];
  let depth = 0;
  let token = '';
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    if (depth === 0 && /[A-Za-z0-9_:]/.test(ch)) token += ch;
    else {
      if (depth === 0 && token && (ch === '(' || ch === '{' || ch === ' ' || ch === '\n')) {
        fields.push(token.includes(':') ? token.split(':').pop() : token);
      }
      token = '';
    }
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
    while (queue.length) {
      const xdm = queue.shift();
      try {
        // eslint-disable-next-line no-await-in-loop
        await window.alloy('sendEvent', { xdm });
      } catch (e) {
        console.warn('BNTS commerce events: sendEvent failed', e);
      }
    }
  }
  flushing = false;
}

function track(area, action, details) {
  const bntsCommerce = { area, action, ...details };
  Object.keys(bntsCommerce).forEach((k) => bntsCommerce[k] === undefined && delete bntsCommerce[k]);
  queue.push({
    eventType: `b2b.${action}`,
    web: { webPageDetails: { URL: window.location.href, name: document.title } },
    [TENANT]: { bntsCommerce },
  });
  window.adobeDataLayer = window.adobeDataLayer || [];
  window.adobeDataLayer.push({ event: 'bnts-commerce-action', eventInfo: { bntsCommerce } });
  flush();
}

function handle(query, variables, json) {
  const fields = rootFields(query);
  const ok = !(json?.errors?.length);
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
    const url = typeof input === 'string' ? input : input?.url;
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
};
