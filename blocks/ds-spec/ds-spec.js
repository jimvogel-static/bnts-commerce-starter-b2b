/*
 * ds-spec: a spec card for the Pulse Design System pages (documentation only,
 * added for the prototype). It names a stock block or Commerce drop-in, lists
 * the facts a designer or developer needs, and shows a live specimen.
 *
 * Authoring (two-column table, first column is the key):
 *   Name | Product List Page
 *   Kind | Commerce drop-in   (or: Content block, Page furniture, Utility)
 *   Block | product-list-page
 *   Drop-ins | product-discovery: SearchResults, Facets ...
 *   What it does | ...
 *   Authors set | ...
 *   Slots used | ...
 *   Events | ...
 *   Lives on | /apparel, /search
 *   Part | Name | block | containers | note     (repeatable, 4 cells)
 *   Design asks | (a list)
 *   Specimen | /apparel        (live page in a frame; omit to show the blocks
 *                                placed after this card in the same section)
 *   Frame | product-list-page  (block to isolate in the frame, optional)
 *   Height | 900
 *   Note | shown above the specimen
 *   Demo | modal               (adds a button that opens the stock modal)
 */

const KIND_CLASS = {
  'content block': 'block',
  'page furniture': 'block',
  utility: 'block',
  'content rule': 'block',
  foundation: 'block',
  'commerce drop-in': 'dropin',
  'block collection': 'collection',
  'drop-in ui kit': 'dropin',
  'added for the prototype': 'arc',
};

const FACT_ORDER = ['block', 'drop-ins', 'authors set', 'slots used', 'events', 'lives on'];
const FACT_LABEL = {
  block: 'Block',
  'drop-ins': 'Drop-ins and containers',
  'authors set': 'Authors set',
  'slots used': 'Slots the boilerplate fills',
  events: 'Events it listens to',
  'lives on': 'Lives on',
};

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function sizeFrame(frame) {
  const fit = () => {
    try {
      const doc = frame.contentDocument;
      if (!doc || !doc.body) return;
      const main = doc.querySelector('main');
      const h = Math.max(main ? main.scrollHeight : 0, 260);
      const max = Number(frame.dataset.max || 1100);
      frame.style.height = `${Math.min(h + 24, max)}px`;
    } catch { /* cross-origin: keep default height */ }
  };
  frame.addEventListener('load', () => {
    fit();
    let n = 0;
    const t = setInterval(() => { fit(); n += 1; if (n > 20) clearInterval(t); }, 700);
  });
}

async function openModalDemo() {
  const { default: createModal } = await import('../modal/modal.js');
  const body = el('div', 'ds-modal-demo', `
    <h2>Stock modal</h2>
    <p>This dialog is the boilerplate's own <code>modal</code> block, opened from code.
    Drop-ins use the same pattern for sign-in, wishlist and address forms.</p>
    <p>Close it with the X, the Escape key, or a click outside.</p>`);
  const { showModal } = await createModal([body]);
  showModal();
}

export default function decorate(block) {
  const facts = {};
  const parts = [];
  let partHeads = ['Name', 'Block', 'Drop-in containers', 'Notes'];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const key = (cells[0]?.textContent || '').trim().toLowerCase();
    if (!key) return;
    if (key === 'part') {
      parts.push(cells.slice(1).map((c) => c.innerHTML.trim()));
      return;
    }
    if (key === 'columns') {
      partHeads = cells.slice(1).map((c) => c.textContent.trim());
      return;
    }
    facts[key] = cells[1] || el('div');
  });

  const text = (k) => (facts[k]?.textContent || '').trim();
  const name = text('name') || 'Component';
  const kind = text('kind') || 'Content block';
  const kindClass = KIND_CLASS[kind.toLowerCase()] || 'block';
  const blockName = text('block');

  block.textContent = '';
  block.id = `ds-${slug(name)}`;
  block.dataset.kind = kindClass;

  // Header: kind chip, name, block id.
  const head = el('div', 'ds-spec-head');
  head.append(el('span', `ds-chip ds-chip-${kindClass}`, kind));
  const h = el('h3', 'ds-spec-name');
  h.textContent = name;
  head.append(h);
  if (blockName) head.append(el('code', 'ds-spec-code', blockName));
  block.append(head);

  if (facts['what it does']) {
    const what = el('div', 'ds-spec-what');
    what.innerHTML = facts['what it does'].innerHTML;
    block.append(what);
  }

  const body = el('div', 'ds-spec-body');
  const dl = el('dl', 'ds-spec-facts');
  FACT_ORDER.forEach((k) => {
    if (!facts[k] || !text(k)) return;
    dl.append(el('dt', '', FACT_LABEL[k]));
    const dd = el('dd', '');
    dd.innerHTML = facts[k].innerHTML;
    dl.append(dd);
  });
  if (dl.children.length) body.append(dl);

  if (facts['design asks'] && text('design asks')) {
    const asks = el('div', 'ds-spec-asks');
    asks.append(el('h4', '', 'What we need from design'));
    const src = facts['design asks'];
    const list = src.querySelector('ul, ol');
    if (list) asks.append(list.cloneNode(true));
    else {
      const ul = el('ul');
      src.textContent.split(/;\s*/).filter(Boolean).forEach((t) => ul.append(el('li', '', t)));
      asks.append(ul);
    }
    body.append(asks);
  }
  if (body.children.length) block.append(body);

  if (parts.length) {
    const wrap = el('div', 'ds-spec-parts');
    wrap.append(el('h4', '', text('parts title') || 'Parts'));
    const table = el('table');
    table.innerHTML = `<thead><tr>${partHeads.map((t) => `<th>${t}</th>`).join('')}</tr></thead>`;
    const tb = el('tbody');
    parts.forEach((p) => {
      const tr = el('tr');
      for (let i = 0; i < partHeads.length; i += 1) {
        const td = el('td', i === 1 && partHeads[1] === 'Block' ? 'ds-mono' : '', p[i] || '');
        if (i === 0) td.innerHTML = `<strong>${p[0] || ''}</strong>`;
        tr.append(td);
      }
      tb.append(tr);
    });
    table.append(tb);
    wrap.append(table);
    block.append(wrap);
  }

  if (text('demo') === 'modal') {
    const btnWrap = el('p', 'ds-spec-demo');
    const btn = el('button', 'button primary', 'Open the stock modal');
    btn.type = 'button';
    btn.addEventListener('click', openModalDemo);
    btnWrap.append(btn);
    block.append(btnWrap);
  }

  if (text('demo') === 'session') {
    // Prepare the demo: real drop-in APIs against the ACCS sandbox.
    const wrap = el('p', 'ds-spec-demo');
    const status = el('span', 'ds-spec-status');
    const reloadFrames = () => document.querySelectorAll('.ds-stage iframe').forEach((f) => {
      const path = new URL(f.getAttribute('src'), window.location.origin);
      f.src = path.pathname + path.search;
    });
    const signedIn = () => /auth_dropin_user_token=/.test(document.cookie);
    const setStatus = () => {
      status.textContent = signedIn() ? 'Signed in.' : 'Signed out.';
    };
    const signBtn = el('a', 'button primary', signedIn() ? 'My account' : 'Sign in or create an account');
    signBtn.href = signedIn() ? '/customer/account' : '/customer/login';
    const cartBtn = el('button', 'button secondary', 'Add sample items to the cart');
    cartBtn.type = 'button';
    cartBtn.addEventListener('click', async () => {
      const cart = await import('@dropins/storefront-cart/api.js');
      await cart.addProductsToCart([{ sku: 'PLS-BT-010', quantity: 1 }, { sku: 'PLS-MG-011', quantity: 2 }]);
      status.textContent = 'Added a bottle and two mugs to the cart.';
      reloadFrames();
    });
    wrap.append(signBtn, cartBtn, status);
    block.append(wrap);
    setStatus();
  }

  const section = block.closest('.section');
  section?.classList.add('ds-section');

  const specimenLink = facts.specimen?.querySelector('a');
  const specimen = specimenLink ? specimenLink.getAttribute('href') : text('specimen');
  const note = text('note');

  if (specimen) {
    const stage = el('div', 'ds-stage');
    const bar = el('div', 'ds-stage-bar');
    const path = new URL(specimen, window.location.origin);
    bar.innerHTML = `<span class="ds-stage-label">Live specimen</span><span class="ds-stage-path">${path.pathname}${path.search}</span>`;
    const open = el('a', 'ds-stage-open', 'Open page');
    open.href = path.pathname + path.search;
    open.target = '_blank';
    open.rel = 'noopener';
    bar.append(open);
    stage.append(bar);
    if (note) stage.append(el('p', 'ds-stage-note', note));
    const frame = document.createElement('iframe');
    frame.loading = 'lazy';
    frame.title = `Live specimen: ${name}`;
    frame.name = `ds-embed:${text('frame') || ''}`;
    frame.dataset.max = text('height') || '1100';
    frame.src = path.pathname + path.search;
    sizeFrame(frame);
    stage.append(frame);
    block.append(stage);
  } else if (section) {
    // Inline specimen: label every block placed after this card in the section.
    if (note) block.append(el('p', 'ds-stage-note', note));
    const wrapper = block.closest('[class$="-wrapper"]');
    let next = wrapper?.nextElementSibling;
    while (next && !next.classList.contains('ds-spec-wrapper')) {
      const b = next.querySelector(':scope > .block');
      if (b) {
        const bn = b.dataset.blockName || b.classList[0];
        next.classList.add('ds-inline-stage');
        next.dataset.dsLabel = `Live specimen · ${bn} block`;
      }
      next = next.nextElementSibling;
    }
  }
}
