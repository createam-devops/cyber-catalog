/*
 * Hace fallar el build si algún selector del CSS del editor quedó fuera de
 * `.catalog-panel`: una regla global rompería las pantallas del ERP
 * (cyberERP/PETICION_ERP_AL_CATALOGO_PANEL.md §3). Mismo criterio que el
 * check-scope.mjs del CRM.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const ROOT = '.catalog-panel';
const assets = fileURLToPath(new URL('../../public/erp-panel/assets/', import.meta.url));
const files = readdirSync(assets).filter((f) => f.endsWith('.css'));
if (files.length !== 1) {
  console.error(`[check-scope] Se esperaba un solo CSS en public/erp-panel/assets y hay ${files.length}.`);
  process.exit(1);
}

const root = postcss.parse(readFileSync(join(assets, files[0]), 'utf8'));
const leaks = [];
root.walkRules((rule) => {
  const parent = rule.parent;
  if (parent?.type === 'atrule' && /keyframes$/i.test(parent.name)) return;
  for (const selector of rule.selectors) {
    if (!selector.trim().startsWith(ROOT)) leaks.push(selector.trim());
  }
});

if (leaks.length) {
  console.error(`[check-scope] ${leaks.length} selectores fuera de ${ROOT}:`);
  for (const s of leaks.slice(0, 20)) console.error('   ', s);
  process.exit(1);
}
console.log(`[check-scope] OK: todo el CSS (${files[0]}) está bajo ${ROOT}.`);
