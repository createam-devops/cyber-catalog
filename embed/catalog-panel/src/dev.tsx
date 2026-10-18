/*
 * Página de prueba: monta <catalog-panel> como lo hará el ERP, sin el ERP.
 *
 *   npm run dev:embed  →  http://localhost:4320/?user=admin@demo.pe
 *
 * - La API del editor va por el proxy de Vite (/apps/catalog/api → el catálogo
 *   en CATALOG_DEV_SERVER, por defecto http://localhost:3110), como en el ERP.
 * - El token aud=catalog sale del login de un ERP simulado (/mock-erp → MOCK_ERP_URL)
 *   o, si se pasa ?token=…, de ese token tal cual (por ejemplo, uno real de api-dev).
 * - La navegación usa el hash (#/diseno) para que «atrás» funcione como en el ERP.
 */
import './element';
import type { PanelHost } from './host';

// Estilos del ERP simulado. Van inyectados desde aquí y no en un <style> del
// index.html: Vite pasaría ese CSS por el plugin que lo encierra bajo
// .catalog-panel y el «ERP» se vería sin estilos.
const erpStyles = document.createElement('style');
erpStyles.textContent = `
      /* Variables de CyberPOS (cyberposapp/src/styles.css) para ver el editor como dentro del ERP. */
      :root {
        --font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        --cm-primary: #10b981; --cm-primary-strong: #059669; --cm-primary-deep: #0f766e;
        --cm-primary-bg: rgba(16, 185, 129, 0.1); --cm-primary-line: rgba(16, 185, 129, 0.3);
        --cm-ink: #0f172a; --cm-ink-soft: #334155; --cm-subtle: #475569; --cm-muted: #64748b; --cm-faint: #94a3b8;
        --cm-surface: rgba(255, 255, 255, 0.6); --cm-surface-strong: rgba(255, 255, 255, 0.75); --cm-field: rgba(255, 255, 255, 0.9);
        --cm-line: rgba(148, 163, 184, 0.25);
        --cm-radius-sm: 0.5rem; --cm-radius-md: 0.7rem; --cm-radius-lg: 1.25rem;
        --cm-fs-caption: 0.72rem; --cm-fs-label: 0.78rem; --cm-fs-body: 0.85rem; --cm-fs-title: 1.05rem; --cm-fs-display: 1.35rem;
      }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: var(--font-family); background: linear-gradient(160deg, #ecfdf5, #f8fafc 40%, #eef2ff); color: var(--cm-ink); }
      .erp { display: flex; min-height: 100vh; }
      .erp-menu { width: 230px; flex-shrink: 0; background: rgba(255, 255, 255, 0.7); border-right: 1px solid var(--cm-line); padding: 18px 12px; font-size: 14px; }
      .erp-menu b { display: block; padding: 0 10px 14px; font-size: 16px; }
      .erp-menu a { display: block; padding: 9px 10px; border-radius: 10px; color: var(--cm-ink-soft); text-decoration: none; }
      .erp-menu a.on { background: var(--cm-primary-bg); color: var(--cm-primary-deep); font-weight: 700; }
      .erp-main { flex: 1; min-width: 0; }
      .erp-head { padding: 14px 18px 4px; font-size: 13px; color: var(--cm-muted); }
      .erp-head h1 { margin: 2px 0 0; font-size: 20px; color: var(--cm-ink); }
      @media (max-width: 767px) { .erp-menu { display: none; } }
`;
document.head.append(erpStyles);

const params = new URLSearchParams(window.location.search);
const fixedToken = params.get('token');
const email = params.get('user') ?? 'admin@demo.pe';
let token: string | null = fixedToken;

async function getToken({ force = false }: { force?: boolean } = {}): Promise<string> {
  if (fixedToken) return fixedToken;
  if (!token || force) {
    const res = await fetch('/mock-erp/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'clave123', app: 'catalog' }),
    });
    const data = await res.json();
    token = data?.tokens?.access_token ?? '';
  }
  return token ?? '';
}

const pathFromHash = () => window.location.hash.replace(/^#/, '') || '/';

const el = document.createElement('catalog-panel') as HTMLElement & { host: PanelHost; path: string; channel: string; theme: string };
el.host = {
  appBase: '/apps/catalog/',
  getToken,
  navigate: (to, opts) => {
    if (to.startsWith('/app/')) {
      alert(`El ERP navegaría a ${to}`);
      return;
    }
    if (opts?.replace) window.location.replace(`#${to}`);
    else window.location.hash = to;
  },
  onSessionLost: () => alert('Sesión perdida: el ERP mandaría a entrar de nuevo.'),
};
el.channel = 'catalog';
el.theme = 'light';
el.path = pathFromHash();
window.addEventListener('hashchange', () => {
  el.path = pathFromHash();
});
document.getElementById('slot')!.append(el);
