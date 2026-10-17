/**
 * ARC Tiles — category / promo tiles.
 * Authoring: one row per tile, three cells:
 *   | art name (e.g. tile-apparel) | Title | link |
 * @param {Element} block
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    const [artCell, titleCell, linkCell] = [...row.children];
    const art = (artCell?.textContent || '').trim().replace(/[^a-z0-9-]/gi, '');
    const link = linkCell?.querySelector('a') || titleCell?.querySelector('a');
    const title = (titleCell?.textContent || '').trim();

    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = link?.href || '#';
    a.className = 'arc-tile';
    a.setAttribute('aria-label', title);

    const img = document.createElement('img');
    img.src = `${window.hlx?.codeBasePath || ''}/images/arc/${art}.svg`;
    img.alt = '';
    img.loading = 'lazy';
    img.width = 800;
    img.height = 800;

    const label = document.createElement('span');
    label.className = 'arc-tile-label';
    const t = document.createElement('span');
    t.textContent = title;
    const cta = document.createElement('span');
    cta.className = 'arc-tile-cta';
    cta.textContent = link?.textContent?.trim() || 'Shop';
    label.append(t, cta);

    a.append(img, label);
    li.append(a);
    list.append(li);
  });
  block.replaceChildren(list);
}
