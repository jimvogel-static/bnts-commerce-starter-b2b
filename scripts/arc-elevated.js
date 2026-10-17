/*
 * Bounteous Pulse: "Elevated" look, custom touches.
 * Loaded only when the Elevated look is on. These are the pieces that go
 * beyond restyling the boilerplate, and each is tagged data-pulse-custom so
 * X-ray can label it:
 *  1. Header tightens with a shadow once you scroll.
 *  2. Sections fade up as they enter the viewport.
 *  3. Product pages get a floating "buy bar" when the main Add to Cart button
 *     scrolls out of view. It clicks the real drop-in button, so the cart
 *     behavior is still 100% boilerplate.
 */

function headerOnScroll() {
  const root = document.documentElement;
  const onScroll = () => root.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  document.querySelector('header .nav-wrapper')?.setAttribute('data-pulse-custom', 'Header tightens on scroll');
}

function revealSections() {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('main > .section').forEach((s, i) => {
    if (i === 0 || s.getBoundingClientRect().top < window.innerHeight) return; // never hide what's already on screen
    s.classList.add('pulse-reveal');
    io.observe(s);
  });
}

function buyBar() {
  const pd = document.querySelector('.product-details');
  if (!pd) return;
  const tryInit = () => {
    const btn = pd.querySelector('.product-details__buttons__add-to-cart button');
    const title = pd.querySelector('.pdp-header__title');
    if (!btn || !title) return false;

    const bar = document.createElement('div');
    bar.className = 'pulse-buybar';
    bar.setAttribute('data-pulse-custom', 'Sticky buy bar (clicks the real Add to Cart)');
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Quick add to cart');
    const thumb = document.createElement('img');
    thumb.alt = '';
    const name = document.createElement('span');
    name.className = 'pulse-buybar__name';
    const price = document.createElement('span');
    price.className = 'pulse-buybar__price';
    const cta = document.createElement('button');
    cta.type = 'button';
    cta.textContent = 'Add to Cart';
    cta.addEventListener('click', () => {
      const real = pd.querySelector('.product-details__buttons__add-to-cart button');
      if (real?.disabled) { real.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      real?.click();
    });
    bar.append(thumb, name, price, cta);
    document.body.append(bar);

    const sync = () => {
      name.textContent = title.textContent.trim();
      price.textContent = pd.querySelector('.product-details__price')?.textContent.trim() || '';
      const im = pd.querySelector('.product-details__left-column img, .product-details__gallery img');
      const src = im?.currentSrc || im?.src;
      if (src) thumb.src = src;
      const real = pd.querySelector('.product-details__buttons__add-to-cart button');
      cta.textContent = real?.disabled ? 'Choose options' : 'Add to Cart';
    };
    sync();
    new MutationObserver(sync).observe(pd, { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled', 'src'] });

    new IntersectionObserver(([e]) => {
      bar.classList.toggle('is-visible', !e.isIntersecting && e.boundingClientRect.top < 0);
    }).observe(btn);
    return true;
  };
  if (tryInit()) return;
  const mo = new MutationObserver(() => { if (tryInit()) mo.disconnect(); });
  mo.observe(pd, { childList: true, subtree: true });
}

function footerLabel() {
  // The footer link reads "Elevated look"; while it's on, offer the way back.
  const relabel = () => {
    const a = document.querySelector('footer a[href*="look="]');
    if (a) { a.textContent = 'Boilerplate look'; return true; }
    return false;
  };
  if (!relabel()) {
    const mo = new MutationObserver(() => { if (relabel()) mo.disconnect(); });
    mo.observe(document.body, { childList: true, subtree: true });
  }
}

export default function startElevated() {
  headerOnScroll();
  revealSections();
  buyBar();
  footerLabel();
}
