/*
 * Plugin de PostCSS: encierra TODO el CSS del editor bajo `.catalog-panel`.
 * Mismo criterio que el CRM (cyberERP/cybercrm-web/scripts/scope-css.js): el
 * componente comparte documento con CyberPOS y sus reglas globales (preflight,
 * utilidades de Tailwind) no pueden pisar las del ERP.
 *
 *   :root, html, body   → .catalog-panel
 *   cualquier otro      → .catalog-panel <selector>
 *
 * No toca @keyframes, @font-face ni @property.
 */
const ROOT = '.catalog-panel';
const DOC_ROOT = /^(:root|:host|html|body)(?![\w-])(.*)$/s;

export function scopeSelector(selector) {
  const s = selector.trim();
  if (!s || s.startsWith(ROOT)) return s;
  const doc = s.match(DOC_ROOT);
  if (doc) return ROOT + doc[2];
  return `${ROOT} ${s}`;
}

export default function scopeToStoreRoot() {
  return {
    postcssPlugin: 'catalog-panel-scope',
    Rule(rule) {
      const parent = rule.parent;
      if (parent?.type === 'atrule' && /keyframes$/i.test(parent.name)) return;
      if (parent?.type === 'rule') return;
      rule.selectors = rule.selectors.map(scopeSelector);
    },
  };
}
scopeToStoreRoot.postcss = true;
