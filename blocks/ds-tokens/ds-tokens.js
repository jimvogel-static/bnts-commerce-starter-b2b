/*
 * ds-tokens: reads the design tokens and drop-in UI components live from the
 * running site and draws them (documentation only, added for the prototype).
 * Nothing is hard-coded: if a token value changes in the theme, this page changes.
 *
 * Variants (block option): color, type, shape, spacing, icons, ui-kit
 *   | ds-tokens (color) |
 * Each token is tagged "Pulse value" when the Pulse theme sets it, or
 * "Boilerplate default" when it still uses the drop-in default.
 */

const THEME_CSS = '/styles/arc-theme.css';
let themeText;
async function themeVars() {
  if (themeText === undefined) {
    try { themeText = await (await fetch(THEME_CSS)).text(); } catch { themeText = ''; }
  }
  return themeText;
}

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function owner(name, theme) {
  const set = new RegExp(`${name.replace(/[-]/g, '\\-')}\\s*:`).test(theme);
  return set
    ? '<span class="ds-own ds-own-pulse">Pulse value</span>'
    : '<span class="ds-own ds-own-default">Boilerplate default</span>';
}

const COLOR_GROUPS = [
  ['Brand', 'Buttons, links, focus, selected states across every drop-in.', ['300', '500', '600', '700'].map((s) => `--color-brand-${s}`)],
  ['Neutral', 'Surfaces, borders, body text, disabled states.', ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map((s) => `--color-neutral-${s}`)],
  ['Positive', 'Success messages, in-stock, applied coupon.', ['200', '500', '800'].map((s) => `--color-positive-${s}`)],
  ['Informational', 'Info alerts and notices.', ['200', '500', '800'].map((s) => `--color-informational-${s}`)],
  ['Warning', 'Low stock, attention states.', ['200', '500', '800'].map((s) => `--color-warning-${s}`)],
  ['Alert', 'Errors, field validation, out-of-stock.', ['200', '500', '800'].map((s) => `--color-alert-${s}`)],
  ['Button states', 'Shared by stock content buttons and drop-in buttons.', ['--color-button-hover', '--color-button-active', '--color-button-focus']],
];

const TYPE_TOKENS = [
  'display-1', 'display-2', 'display-3', 'headline-1', 'headline-2-default', 'headline-2-strong',
  'body-1-default', 'body-1-strong', 'body-1-emphasized', 'body-2-default', 'body-2-strong',
  'body-2-emphasized', 'button-1', 'button-2', 'details-caption-1', 'details-caption-2', 'details-overline',
];

const SPACING = ['xxsmall', 'xsmall', 'small', 'medium', 'big', 'xbig', 'xxbig', 'huge', 'xhuge', 'xxhuge'];

const ICONS = ['cart', 'search', 'heart', 'close', 'x-lg', 'trash', 'edit', 'chevron-up', 'chevron-down',
  'chevron-left', 'chevron-right', 'caret-up-fill', 'caret-down-fill', 'caret-left-fill', 'caret-right-fill', 'rounded-triangle'];

async function renderColor(block) {
  const theme = await themeVars();
  COLOR_GROUPS.forEach(([title, use, names]) => {
    const g = el('div', 'ds-group');
    g.append(el('h4', '', title), el('p', 'ds-group-use', use));
    const grid = el('div', 'ds-swatches');
    names.forEach((n) => {
      const v = css(n);
      const s = el('div', 'ds-swatch');
      s.innerHTML = `<span class="ds-chipcolor" style="background:var(${n})"></span>
        <code>${n}</code><span class="ds-val">${v || 'not set'}</span>${owner(n, theme)}`;
      grid.append(s);
    });
    g.append(grid);
    block.append(g);
  });
}

async function renderType(block) {
  const theme = await themeVars();
  const t = el('div', 'ds-type');
  TYPE_TOKENS.forEach((k) => {
    const n = `--type-${k}-font`;
    const row = el('div', 'ds-type-row');
    const v = css(n);
    const [, weight, size] = v.match(/normal normal (\d+) ([\d.]+rem\/[\d.]+rem)/) || [];
    row.innerHTML = `<div class="ds-type-meta"><code>${n}</code><span class="ds-val">${weight ? `${weight} · ${size}` : v}</span>${owner(n, theme)}</div>
      <div class="ds-type-sample" style="font:var(${n});letter-spacing:var(--type-${k}-letter-spacing)">Gear built for the work ahead</div>`;
    t.append(row);
  });
  block.append(t);
}

async function renderShape(block) {
  const theme = await themeVars();
  const g = el('div', 'ds-shapes');
  ['--shape-border-radius-1', '--shape-border-radius-2', '--shape-border-radius-3'].forEach((n) => {
    const s = el('div', 'ds-shape');
    s.innerHTML = `<span class="ds-shape-box" style="border-radius:var(${n})"></span><code>${n}</code><span class="ds-val">${css(n)}</span>${owner(n, theme)}`;
    g.append(s);
  });
  ['--shape-shadow-1', '--shape-shadow-2', '--shape-shadow-3'].forEach((n) => {
    const s = el('div', 'ds-shape');
    s.innerHTML = `<span class="ds-shape-box ds-shape-shadow" style="box-shadow:var(${n})"></span><code>${n}</code><span class="ds-val">${css(n)}</span>${owner(n, theme)}`;
    g.append(s);
  });
  block.append(g);
}

async function renderSpacing(block) {
  const theme = await themeVars();
  const g = el('div', 'ds-spacing');
  SPACING.forEach((k) => {
    const n = `--spacing-${k}`;
    const r = el('div', 'ds-space-row');
    r.innerHTML = `<code>${n}</code><span class="ds-val">${css(n)}</span><span class="ds-space-bar" style="width:var(${n})"></span>${owner(n, theme)}`;
    g.append(r);
  });
  block.append(g);
}

function renderIcons(block) {
  const g = el('div', 'ds-icons');
  ICONS.forEach((n) => {
    const c = el('div', 'ds-icon');
    c.innerHTML = `<img src="/icons/${n}.svg" alt="" width="24" height="24" loading="lazy"><code>${n}</code>`;
    g.append(c);
  });
  block.append(g);
}

async function renderUiKit(block) {
  const ui = await import('@dropins/tools/components.js');
  const { provider: UI } = ui;
  const items = [
    ['Button', 'primary', () => [ui.Button, { children: 'Add to cart', variant: 'primary' }]],
    ['Button', 'secondary', () => [ui.Button, { children: 'View cart', variant: 'secondary' }]],
    ['Button', 'tertiary', () => [ui.Button, { children: 'Edit', variant: 'tertiary' }]],
    ['Button', 'disabled', () => [ui.Button, { children: 'Out of stock', variant: 'primary', disabled: true }]],
    ['Input', 'floating label', () => [ui.Input, { name: 'ds-email', floatingLabel: 'Email', placeholder: 'Email' }]],
    ['Input', 'error', () => [ui.Input, { name: 'ds-zip', floatingLabel: 'Postal code', value: '12', error: true }]],
    ['Picker', 'select', () => [ui.Picker, { name: 'ds-size', floatingLabel: 'Size', value: 'm', options: [{ value: 's', text: 'Small' }, { value: 'm', text: 'Medium' }, { value: 'l', text: 'Large' }] }]],
    ['Checkbox', '', () => [ui.Checkbox, { name: 'ds-terms', label: 'I agree to the terms', checked: true }]],
    ['RadioButton', '', () => [ui.RadioButton, { name: 'ds-ship', value: 'std', label: 'Standard shipping', checked: true }]],
    ['ToggleButton', '', () => [ui.ToggleButton, { name: 'ds-toggle', value: 'a', label: 'Ship to this address', selected: true }]],
    ['Incrementer', 'quantity', () => [ui.Incrementer, { name: 'ds-qty', value: 2, min: 1, max: 10 }]],
    ['Price', 'regular', () => [ui.Price, { amount: 68, currency: 'USD' }]],
    ['Price', 'sale', () => [[ui.Price, { amount: 68, currency: 'USD', variant: 'strikethrough' }], [ui.Price, { amount: 40, currency: 'USD', sale: true }]]],
    ['TextSwatch', 'size', () => [ui.TextSwatch, { name: 'ds-ts', value: 'L', label: 'L', id: 'ds-ts-l', selected: true }]],
    ['ColorSwatch', 'color', () => [ui.ColorSwatch, { name: 'ds-cs', value: 'midnight', label: 'Midnight', id: 'ds-cs-1', color: '#0b111c', selected: true }]],
    ['Tag', '', () => [ui.Tag, { label: 'New' }]],
    ['InLineAlert', 'success', () => [ui.InLineAlert, { type: 'success', heading: 'Coupon applied', description: 'PULSE20 took 20% off.' }]],
    ['InLineAlert', 'error', () => [ui.InLineAlert, { type: 'error', heading: 'Payment declined', description: 'Try another card.' }]],
    ['ProgressSpinner', '', () => [ui.ProgressSpinner, { size: 'medium' }]],
    ['SkeletonRow', 'loading', () => [[ui.SkeletonRow, { variant: 'heading', size: 'medium', fullWidth: true }], [ui.SkeletonRow, { size: 'small', fullWidth: true, lines: 2 }]]],
  ];
  const grid = el('div', 'ds-uikit');
  items.forEach(([name, variant, make]) => {
    const card = el('div', 'ds-uikit-item');
    card.append(el('div', 'ds-uikit-name', `<strong>${name}</strong>${variant ? `<span>${variant}</span>` : ''}`));
    const stage = el('div', 'ds-uikit-stage');
    card.append(stage);
    grid.append(card);
    try {
      const spec = make();
      const list = Array.isArray(spec[0]) ? spec : [spec];
      list.forEach(([Comp, props]) => {
        if (!Comp) throw new Error('not exported');
        const slot = el('div', 'ds-uikit-slot');
        stage.append(slot);
        UI.render(Comp, props)(slot);
      });
    } catch (e) {
      stage.innerHTML = '<span class="ds-val">Not available in this SDK version</span>';
    }
  });
  block.append(grid);
}

const RENDERERS = {
  color: renderColor,
  type: renderType,
  shape: renderShape,
  spacing: renderSpacing,
  icons: renderIcons,
  'ui-kit': renderUiKit,
};

export default async function decorate(block) {
  const variant = Object.keys(RENDERERS).find((k) => block.classList.contains(k)) || 'color';
  block.textContent = '';
  await RENDERERS[variant](block);
}
