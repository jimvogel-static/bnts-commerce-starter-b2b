/*
 * BNTS Commerce Starter B2B: presenter tools.
 * Top bar, X-ray, look switcher, Reset demo (clears this browser's cart and
 * sign-in only) and the design system embed mode. No data mock: every
 * commerce call goes to the ACCS sandbox configured in /config.json.
 */
// Helpers for presenters.
// - window.arcMock.reset() clears carts, orders, profile and sign-in.
// - Visiting any page with ?arc-reset (e.g. /?arc-reset) does the same, then
//   lands on the home page. The footer carries a low-key "Reset demo" link.
function clearDemoState() {
  Object.keys(window.localStorage)
    .filter((k) => /^DROPIN__/.test(k) || /productViewHistory|purchaseHistory/.test(k))
    .forEach((k) => window.localStorage.removeItem(k));
  // keep presenter preferences (look, X-ray) across a reset
  Object.keys(window.sessionStorage).filter((k) => !/^(pulse-look|arc-xray)/.test(k))
    .forEach((k) => window.sessionStorage.removeItem(k));
  document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => /dropin|cart|auth/i.test(n))
    .forEach((n) => { document.cookie = `${n}=; Max-Age=0; path=/`; });
}

window.arcMock = {
  reset() {
    clearDemoState();
    window.location.replace(`${window.location.origin}/`);
  },
};

// Presenter X-ray overlay: ?xray turns it on (sticky for the session), ?xray=off turns it off.
const xrayParam = new URLSearchParams(window.location.search).get('xray');
if (xrayParam !== null) {
  if (xrayParam === 'off' || xrayParam === '0') window.sessionStorage.removeItem('arc-xray');
  else window.sessionStorage.setItem('arc-xray', '1');
}
if (window.sessionStorage.getItem('arc-xray') === '1' && !document.prerendering) {
  window.addEventListener('load', () => {
    import('./arc-xray.js').then((m) => m.default()).catch((e) => console.warn('[ARC x-ray]', e)); // eslint-disable-line no-console
  });
}

// Look switcher: "Boilerplate" (brand tokens only) vs "Elevated" (design layer).
// ?look=elevated / ?look=boilerplate, or the quiet link in the top bar. Sticky for the session.
const lookParam = new URLSearchParams(window.location.search).get('look');
if (lookParam === 'elevated') window.sessionStorage.setItem('pulse-look', 'elevated');
if (lookParam === 'boilerplate') window.sessionStorage.removeItem('pulse-look');
const isElevated = window.sessionStorage.getItem('pulse-look') === 'elevated';
document.documentElement.classList.toggle('look-elevated', isElevated);
if (isElevated && !document.prerendering) {
  window.addEventListener('load', () => {
    import('./arc-elevated.js').then((m) => m.default()).catch((e) => console.warn('[Pulse elevated]', e)); // eslint-disable-line no-console
  });
}

// Design System specimens: a page loaded in a frame named "ds-embed[:block]"
// (or with ?embed=block) shows only its main content, and only the section
// holding that block when it exists. The frame name survives navigation, so a
// specimen stays clean when you click through it (for example, to sign in).
const embedQuery = new URLSearchParams(window.location.search).get('embed');
const embedName = (window.name || '').startsWith('ds-embed')
  ? window.name
  : (embedQuery !== null ? `ds-embed:${embedQuery}` : '');
if (embedName) {
  document.documentElement.classList.add('ds-embed');
  const target = embedName.split(':')[1];
  if (target && /^[a-z0-9-]+$/.test(target)) {
    const isolate = () => {
      const main = document.querySelector('main');
      if (!main) return;
      const sections = [...main.querySelectorAll(':scope > .section, :scope > div')];
      const hit = sections.filter((s) => s.querySelector(`.${target}`));
      if (!hit.length) return;
      sections.forEach((s) => s.classList.toggle('ds-embed-hide', !hit.includes(s)));
    };
    const start = () => {
      isolate();
      const main = document.querySelector('main');
      if (main) {
        const mo = new MutationObserver(isolate);
        mo.observe(main, { childList: true });
        setTimeout(() => mo.disconnect(), 8000);
      }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
}

// Presenter strip: the top announcement bar carries quiet links for
// Reset demo, X-ray and the look switch (moved up from the footer).
function buildTopbar() {
  if (embedName || document.querySelector('.pulse-topbar')) return;
  const xrayOn = window.sessionStorage.getItem('arc-xray') === '1';
  const bar = document.createElement('div');
  bar.className = 'pulse-topbar';
  const msg = document.createElement('span');
  msg.className = 'pulse-topbar__msg';
  msg.textContent = 'BNTS Commerce Starter B2B: Adobe Commerce boilerplate (b2b) + 6 Block Collection blocks · live ACCS sandbox, Pulse B2B store (test orders only) · try code PULSE20';
  const tools = document.createElement('span');
  tools.className = 'pulse-topbar__tools';
  [
    ['reset', 'Reset demo', '/?arc-reset'],
    ['xray', xrayOn ? 'X-ray off' : 'X-ray', '?xray'],
    ['look', isElevated ? 'Boilerplate look' : 'Elevated look', isElevated ? '?look=boilerplate' : '?look=elevated'],
  ].forEach(([tool, label, href]) => {
    const a = document.createElement('a');
    a.href = href;
    a.dataset.pulseTool = tool;
    a.textContent = label;
    a.rel = 'nofollow';
    tools.append(a);
  });
  bar.append(msg, tools);
  document.body.prepend(bar);
}
if (document.body) buildTopbar();
else document.addEventListener('DOMContentLoaded', buildTopbar, { once: true });

document.addEventListener('click', (e) => {
  const a = e.target.closest?.('a[data-pulse-tool]');
  if (!a) return;
  const tool = a.dataset.pulseTool;
  if (tool === 'reset') return; // plain navigation to /?arc-reset
  e.preventDefault();
  const u = new URL(window.location.href);
  if (tool === 'look') {
    if (isElevated) window.sessionStorage.removeItem('pulse-look');
    else window.sessionStorage.setItem('pulse-look', 'elevated');
    u.searchParams.delete('look');
  } else if (tool === 'xray') {
    if (window.sessionStorage.getItem('arc-xray') === '1') window.sessionStorage.removeItem('arc-xray');
    else window.sessionStorage.setItem('arc-xray', '1');
    u.searchParams.delete('xray');
  }
  window.location.replace(u.toString());
});

if (new URLSearchParams(window.location.search).has('arc-reset')) {
  // The boilerplate prerenders links on hover; only reset on a real visit.
  if (document.prerendering) {
    document.addEventListener('prerenderingchange', () => window.arcMock.reset(), { once: true });
  } else {
    window.arcMock.reset();
  }
}
