/*
 * Pulse X-ray: a presenter overlay that labels what each part of the page is.
 * Turn on with ?xray (it stays on as you browse), turn off with ?xray=off.
 * Purely visual: draws outlines in a fixed layer above the page and changes
 * nothing about the boilerplate's own markup or behavior.
 */

// Which build this is, shown in the X-ray panel.
const SITE = { label: 'BNTS Commerce Starter B2B: Adobe boilerplate (b2b) + 6 Block Collection blocks', color: '#26DFEC' };
const COLORS = {
  boilerplate: '#34B3FF', // Electric Blue: stock boilerplate block
  arc: '#FF4F59', // Coral: added for this prototype (blocks and custom touches)
  dropin: '#C7B1FF', // Purple Rain 300: readable on Midnight; Commerce drop-ins used by the block
  collection: '#26DFEC', // Aqua: AEM Block Collection blocks added in the BNTS Commerce Starter
};

// Block → what it is. "dropins" lists the @dropins/* packages the block's JS imports.
const BLOCKS = {
  header: { kind: 'boilerplate', label: 'Header', note: 'Content from the /nav document', dropins: ['cart (mini-cart)', 'product-discovery (search)', 'auth (sign-in menu)', 'wishlist'] },
  footer: { kind: 'boilerplate', label: 'Footer', note: 'Content from the /footer document' },
  'arc-hero': { kind: 'arc', label: 'Prototype Hero', note: 'Added for the prototype: simple content block' },
  'arc-tiles': { kind: 'arc', label: 'Prototype Category Tiles', note: 'Added for the prototype: simple content block' },
  'ds-spec': { kind: 'arc', label: 'Design System Spec Card', note: 'Added for the prototype: documentation only' },
  'ds-tokens': { kind: 'arc', label: 'Design System Token Sheet', note: 'Added for the prototype: reads tokens live from the theme', dropins: ['tools (UI kit components)'] },
  tabs: { kind: 'collection', label: 'Tabs', note: 'AEM Block Collection, added in the BNTS Commerce Starter' },
  quote: { kind: 'collection', label: 'Quote', note: 'AEM Block Collection, added in the BNTS Commerce Starter' },
  table: { kind: 'collection', label: 'Table', note: 'AEM Block Collection, added in the BNTS Commerce Starter' },
  embed: { kind: 'collection', label: 'Embed', note: 'AEM Block Collection, added in the BNTS Commerce Starter' },
  video: { kind: 'collection', label: 'Video', note: 'AEM Block Collection, added in the BNTS Commerce Starter' },
  search: { kind: 'collection', label: 'Search (site content)', note: 'AEM Block Collection, added in the BNTS Commerce Starter' },
  hero: { kind: 'boilerplate', label: 'Hero' },
  cards: { kind: 'boilerplate', label: 'Cards' },
  columns: { kind: 'boilerplate', label: 'Columns' },
  carousel: { kind: 'boilerplate', label: 'Carousel' },
  accordion: { kind: 'boilerplate', label: 'Accordion' },
  fragment: { kind: 'boilerplate', label: 'Fragment' },
  modal: { kind: 'boilerplate', label: 'Modal' },
  enrichment: { kind: 'boilerplate', label: 'Enrichment', note: 'Merchandising content for a category or product' },
  'targeted-block': { kind: 'boilerplate', label: 'Targeted Block', dropins: ['personalization'] },
  'product-list-page': { kind: 'boilerplate', label: 'Product List Page', dropins: ['product-discovery (results, facets, sort, pagination)', 'cart', 'wishlist'] },
  'product-details': { kind: 'boilerplate', label: 'Product Details', dropins: ['pdp (gallery, options, price, quantity, attributes)', 'cart', 'wishlist'] },
  'product-recommendations': { kind: 'boilerplate', label: 'Product Recommendations', dropins: ['recommendations', 'cart', 'wishlist'] },
  'commerce-cart': { kind: 'boilerplate', label: 'Cart', dropins: ['cart (items, summary, coupons, gift cards, shipping estimate)', 'wishlist'] },
  'commerce-mini-cart': { kind: 'boilerplate', label: 'Mini Cart', dropins: ['cart'] },
  'commerce-checkout': { kind: 'boilerplate', label: 'Checkout', dropins: ['checkout', 'account (address forms)', 'auth', 'cart (order summary)', 'order', 'payment-services'] },
  'commerce-checkout-success': { kind: 'boilerplate', label: 'Checkout Success', dropins: ['order'] },
  'commerce-login': { kind: 'boilerplate', label: 'Sign In', dropins: ['auth'] },
  'commerce-create-account': { kind: 'boilerplate', label: 'Create Account', dropins: ['auth'] },
  'commerce-forgot-password': { kind: 'boilerplate', label: 'Forgot Password', dropins: ['auth'] },
  'commerce-create-password': { kind: 'boilerplate', label: 'Create Password', dropins: ['auth'] },
  'commerce-confirm-account': { kind: 'boilerplate', label: 'Confirm Account', dropins: ['auth'] },
  'commerce-account-sidebar': { kind: 'boilerplate', label: 'Account Sidebar', note: 'Links from /customer/sidebar-fragment', dropins: ['account'] },
  'commerce-account-header': { kind: 'boilerplate', label: 'Account Header', dropins: ['account'] },
  'commerce-customer-information': { kind: 'boilerplate', label: 'Customer Information', dropins: ['account'] },
  'commerce-addresses': { kind: 'boilerplate', label: 'Addresses', dropins: ['account'] },
  'commerce-orders-list': { kind: 'boilerplate', label: 'Orders List', dropins: ['account'] },
  'commerce-returns-list': { kind: 'boilerplate', label: 'Returns List', dropins: ['order'] },
  'commerce-order-header': { kind: 'boilerplate', label: 'Order Header', dropins: ['order'] },
  'commerce-order-status': { kind: 'boilerplate', label: 'Order Status', dropins: ['order'] },
  'commerce-shipping-status': { kind: 'boilerplate', label: 'Shipping Status', dropins: ['order'] },
  'commerce-customer-details': { kind: 'boilerplate', label: 'Customer Details', dropins: ['order'] },
  'commerce-order-cost-summary': { kind: 'boilerplate', label: 'Order Cost Summary', dropins: ['order'] },
  'commerce-order-product-list': { kind: 'boilerplate', label: 'Order Product List', dropins: ['order'] },
  'commerce-order-returns': { kind: 'boilerplate', label: 'Order Returns', dropins: ['order'] },
  'commerce-order-comments': { kind: 'boilerplate', label: 'Order Comments', dropins: ['order'] },
  'commerce-gift-options': { kind: 'boilerplate', label: 'Gift Options', dropins: ['cart'] },
  'commerce-search-order': { kind: 'boilerplate', label: 'Order Lookup', dropins: ['order', 'auth'] },
  'commerce-create-return': { kind: 'boilerplate', label: 'Create Return', dropins: ['order'] },
  'commerce-return-header': { kind: 'boilerplate', label: 'Return Header', dropins: ['order'] },
  'commerce-wishlist': { kind: 'boilerplate', label: 'Wishlist', dropins: ['wishlist'] },
  'commerce-empty-cart': { kind: 'boilerplate', label: 'Empty Cart' },
};

function pageTemplate() {
  const p = window.location.pathname;
  const has = (b) => !!document.querySelector(`main .${b}`);
  if (p.startsWith('/design-system')) return ['Design System page', 'Added for the BNTS Commerce Starter demo. Authored in DA.live with two documentation blocks; every specimen on it is a stock block or drop-in running live.'];
  if (p === '/' || p === '/index') return ['Home', 'A content page authored in DA.live. Boilerplate look: two small added blocks. Elevated look: stock Hero, Cards and Columns blocks. Recommendations in both.'];
  if (p.startsWith('/products/')) return ['Product page (PDP)', 'One template document (/products/default) serves every product URL via folder mapping. The SKU comes from the URL.'];
  if (has('product-list-page')) {
    return p.startsWith('/search')
      ? ['Search results', 'Same Product List Page block as a category page, with no category set.']
      : ['Category page (PLP)', 'One document per category. The block config names the category.'];
  }
  if (p.startsWith('/cart')) return ['Cart', 'Boilerplate page, unchanged.'];
  if (p.startsWith('/checkout')) return ['Checkout', 'Boilerplate page, unchanged. One-page checkout.'];
  if (p.startsWith('/order-details') || p.startsWith('/sales/')) return ['Order confirmation / details', 'Boilerplate page, unchanged.'];
  if (p.startsWith('/customer/')) return ['Account area', 'Boilerplate page, unchanged. Part of the starter account and sign-in pages.'];
  if (p.startsWith('/order-status')) return ['Guest order lookup', 'Boilerplate page, unchanged.'];
  if (p.startsWith('/wishlist')) return ['Wishlist', 'Boilerplate page, unchanged.'];
  return ['Content page', 'Authored in DA.live.'];
}

// Drop-ins are read from each block's own JS imports, so labels stay accurate.
const dropinCache = {};
function dropinsFor(name) {
  if (dropinCache[name]) return dropinCache[name].list;
  dropinCache[name] = { list: null };
  fetch(`${window.hlx?.codeBasePath || ''}/blocks/${name}/${name}.js`)
    .then((r) => (r.ok ? r.text() : ''))
    .then((t) => {
      const found = [...t.matchAll(/@dropins\/storefront-([a-z-]+)\//g)].map((m) => m[1]);
      dropinCache[name].list = [...new Set(found)];
    })
    .catch(() => { dropinCache[name].list = []; });
  return null;
}

function el(tag, css, text) {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (text !== undefined) e.textContent = text;
  return e;
}

const layer = el('div', 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;');
layer.setAttribute('aria-hidden', 'true');

function targets() {
  const list = [];
  const header = document.querySelector('header .header');
  const footer = document.querySelector('footer .footer');
  if (header) list.push(['header', header]);
  document.querySelectorAll('main .block[data-block-name]').forEach((b) => {
    const sec = b.closest('.section');
    if (sec && getComputedStyle(sec).display === 'none') return; // belongs to the other look
    list.push([b.dataset.blockName, b]);
  });
  if (footer) list.push(['footer', footer]);
  document.querySelectorAll('[data-pulse-custom]').forEach((n) => list.push([`custom:${n.dataset.pulseCustom}`, n]));
  return list;
}

function draw() {
  layer.replaceChildren();
  targets().forEach(([name, node]) => {
    const r = node.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > window.innerHeight) return;
    const info = name.startsWith('custom:')
      ? { kind: 'arc', custom: true, label: name.slice(7) }
      : (BLOCKS[name] || { kind: 'boilerplate', label: name });
    const color = COLORS[info.kind];
    const box = el('div', `position:absolute;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;`
      + `outline:2px dashed ${color};outline-offset:-2px;border-radius:8px;background:${color}0d;`);
    const side = name === 'header' ? 'right:6px;top:calc(100% + 4px);' : 'left:6px;top:6px;';
    const tag = el('div', `position:absolute;${side}max-width:min(420px, calc(100% - 12px));padding:6px 10px;border-radius:12px;`
      + 'background:#0B111C;color:#fff;font:600 12px/1.35 \'Nunito Sans\',system-ui,sans-serif;box-shadow:0 4px 16px rgb(0 0 0 / 25%);');
    const title = el('div', `color:${color};letter-spacing:.04em;text-transform:uppercase;font-size:10px;`, info.kind === 'arc' ? (info.custom ? 'Custom touch' : 'Added for the prototype') : (info.kind === 'collection' ? 'BNTS Starter addition · Block Collection' : 'Boilerplate block'));
    tag.append(title, el('div', 'font-size:13px;', info.custom ? info.label : `${info.label}  ·  ${name}`));
    if (info.note) tag.append(el('div', 'font-weight:400;opacity:.8;', info.note));
    const live = (name === 'header' || info.custom) ? null : dropinsFor(name);
    const list = live && live.length ? live : (live ? [] : (info.dropins || []));
    if (list.length) {
      const d = el('div', `margin-top:4px;color:${COLORS.dropin};font-weight:600;`, `Drop-ins: ${list.join(', ')}`);
      tag.append(d);
    }
    box.append(tag);
    layer.append(box);
  });
}

function panel() {
  const [tpl, tplNote] = pageTemplate();
  const blocks = targets().map(([n]) => n).filter((n) => !n.startsWith('custom:'));
  const dropins = new Set();
  blocks.forEach((n) => {
    const live = n === 'header' ? null : dropinsFor(n);
    (live && live.length ? live : (BLOCKS[n]?.dropins || [])).forEach((d) => dropins.add(d.split(' ')[0]));
  });
  const arcCount = blocks.filter((n) => BLOCKS[n]?.kind === 'arc').length;
  const colCount = blocks.filter((n) => BLOCKS[n]?.kind === 'collection').length;

  const p = el('div', 'position:fixed;left:16px;bottom:16px;width:340px;z-index:2147483001;padding:16px 18px;border-radius:24px;'
    + 'background:#0B111C;color:#fff;font:400 13px/1.5 \'Nunito Sans\',system-ui,sans-serif;box-shadow:0 12px 40px rgb(0 0 0 / 35%);');
  p.id = 'arc-xray-panel';
  const collapsed = window.sessionStorage.getItem('arc-xray-min') === '1';
  const head = el('div', 'font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#C7B1FF;cursor:pointer;pointer-events:auto;',
    collapsed ? 'B2B Starter X-ray  ▸  show details' : 'B2B Starter X-ray  ▾  hide details');
  head.addEventListener('click', () => {
    window.sessionStorage.setItem('arc-xray-min', collapsed ? '0' : '1');
    const np = panel(); p.replaceWith(np);
  });
  p.append(head);
  if (collapsed) {
    p.style.width = 'auto';
    p.append(el('div', 'font-weight:700;font-size:15px;margin-top:2px;', tpl));
    return p;
  }
  p.append(el('div', 'font-weight:700;font-size:17px;margin:2px 0 4px;', tpl));
  p.append(el('div', 'opacity:.8;', tplNote));
  p.append(el('div', `margin-top:8px;padding:6px 10px;border-radius:10px;background:${SITE.color}22;color:${SITE.color};font-weight:700;`, SITE.label));
  p.append(el('div', 'margin-top:10px;', `Document: ${window.location.pathname.startsWith('/products/') ? '/products/default' : window.location.pathname}`));
  p.append(el('div', '', `Blocks on page: ${blocks.length} (${colCount} from the Block Collection, ${arcCount} added for the prototype)`));
  p.append(el('div', '', `Drop-ins in use: ${[...dropins].join(', ') || 'none'}`));
  p.append(el('div', 'margin-top:10px;opacity:.8;', document.documentElement.classList.contains('look-elevated') ? 'Look: Elevated. Same stock blocks and drop-ins, restyled by one extra stylesheet, plus a few custom touches (coral). Data: Adobe Commerce as a Cloud Service sandbox (Pulse B2B store view).' : 'Look: Boilerplate. Bounteous theme applied to the boilerplate design tokens (one stylesheet). Data: Adobe Commerce as a Cloud Service sandbox (Pulse B2B store view).'));

  const legend = el('div', 'display:flex;gap:12px;flex-wrap:wrap;margin-top:10px;font-size:12px;');
  [['Adobe boilerplate', COLORS.boilerplate], ['BNTS addition', COLORS.collection], ['Added / custom', COLORS.arc], ['Commerce drop-ins', COLORS.dropin]].forEach(([t, c]) => {
    const i = el('span', '');
    i.append(el('span', `display:inline-block;width:10px;height:10px;border-radius:3px;background:${c};margin-right:6px;vertical-align:middle;`), document.createTextNode(t));
    legend.append(i);
  });
  p.append(legend);

  const close = el('a', 'display:inline-block;margin-top:10px;color:#34B3FF;font-weight:600;text-decoration:none;', 'Turn off X-ray');
  close.href = '?xray=off';
  p.append(close);
  return p;
}

export default function startXray() {
  document.body.append(layer);
  document.body.append(panel());
  let raf;
  const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  // Blocks and drop-ins render progressively; keep the overlay in sync.
  const mo = new MutationObserver(schedule);
  ['header', 'main', 'footer'].forEach((sel) => {
    const n = document.querySelector(sel);
    if (n) mo.observe(n, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-block-status'] });
  });
  setInterval(() => {
    const cur = document.getElementById('arc-xray-panel');
    const np = panel();
    if (cur) cur.replaceWith(np); else document.body.append(np);
    schedule();
  }, 3000);
  schedule();
}
