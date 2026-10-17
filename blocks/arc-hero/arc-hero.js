/**
 * ARC Hero
 * Authoring (one cell per row):
 *   | ARC Hero                         |
 *   | eyebrow text                     |
 *   | Heading (h1)                     |
 *   | Supporting copy                  |
 *   | links (first = primary CTA)      |
 *   | art name (optional, default hero)|
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children].map((r) => r.firstElementChild || r);
  const [eyebrowEl, headingEl, copyEl, ctaEl, artEl] = rows;
  const art = (artEl?.textContent || 'hero').trim().replace(/[^a-z0-9-]/gi, '') || 'hero';

  const content = document.createElement('div');
  content.className = 'arc-hero-content';

  if (eyebrowEl?.textContent.trim()) {
    const p = document.createElement('p');
    p.className = 'eyebrow';
    p.textContent = eyebrowEl.textContent.trim();
    content.append(p);
  }
  if (headingEl) {
    const h = headingEl.querySelector('h1, h2') || document.createElement('h1');
    if (!h.textContent) h.innerHTML = headingEl.innerHTML;
    content.append(h);
  }
  if (copyEl) {
    const p = document.createElement('p');
    p.className = 'arc-hero-copy';
    p.innerHTML = copyEl.innerHTML;
    content.append(p);
  }
  if (ctaEl) {
    const ctas = document.createElement('div');
    ctas.className = 'arc-hero-ctas';
    ctaEl.querySelectorAll('a').forEach((a, i) => {
      a.className = i === 0 ? 'button primary' : 'button secondary';
      ctas.append(a);
    });
    content.append(ctas);
  }

  const media = document.createElement('div');
  media.className = 'arc-hero-media';
  const img = document.createElement('img');
  img.src = `${window.hlx?.codeBasePath || ''}/images/arc/${art}.svg`;
  img.alt = '';
  img.width = 1000;
  img.height = 800;
  img.fetchPriority = 'high';
  media.append(img);

  block.replaceChildren(content, media);
}
