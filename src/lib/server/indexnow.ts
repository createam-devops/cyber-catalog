// IndexNow: avisa a Bing (y a los demás buscadores que lo usan) qué páginas de
// una tienda cambiaron, en cuanto el ERP avisa de un cambio de producto. ChatGPT
// y Copilot buscan con Bing: así un producto nuevo o un precio cambiado llegan
// antes a sus respuestas.
//
// - Se activa con INDEXNOW_KEY (8 a 128 letras, números o guiones) y solo en producción.
// - La llave se publica en https://<tienda>/indexnow.txt (src/app/store/indexnow.txt).
// - Los cambios se juntan un minuto por tienda: una carga masiva es un solo aviso.
// - Antes de avisar se comprueba que el dominio lo sirve esta plataforma (una
//   tienda con web propia, como bellasorpresa.pe, no tiene ese archivo).

import { getTenantById } from './tenants';
import { getStoreCatalog, storefrontAvailability } from './storefront-data';
import { categoryPath, productPath } from '@/lib/storefront/catalog';

const FLUSH_MS = 60_000;
const HOST_CHECK_TTL_MS = 24 * 60 * 60 * 1000;

export function indexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  return key && /^[A-Za-z0-9-]{8,128}$/.test(key) ? key : null;
}

/** tienda → productos cambiados ('' = la tienda en general). */
const queue = new Map<string, Set<string>>();
let timer: ReturnType<typeof setTimeout> | null = null;
const hostChecks = new Map<string, { at: number; ok: boolean }>();

export function queueIndexNow(tenantId: string, productId?: string | number | null): void {
  if (!indexNowKey() || process.env.NODE_ENV !== 'production') return;
  const items = queue.get(tenantId) ?? new Set<string>();
  items.add(productId === undefined || productId === null ? '' : String(productId));
  queue.set(tenantId, items);
  timer ??= setTimeout(() => {
    timer = null;
    void flush().catch((error) => console.warn('[indexnow] No se pudo avisar:', error));
  }, FLUSH_MS);
}

/** ¿Este dominio lo sirve la plataforma? Se mira que publique la llave. */
async function servedHere(host: string, key: string): Promise<boolean> {
  const cached = hostChecks.get(host);
  if (cached && Date.now() - cached.at < HOST_CHECK_TTL_MS) return cached.ok;
  const ok = await fetch(`https://${host}/indexnow.txt`, { signal: AbortSignal.timeout(10_000) })
    .then(async (res) => res.ok && (await res.text()).trim() === key)
    .catch(() => false);
  hostChecks.set(host, { at: Date.now(), ok });
  return ok;
}

async function flush(): Promise<void> {
  const key = indexNowKey();
  if (!key) return;
  const pending = new Map(queue);
  queue.clear();
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';

  for (const [tenantId, productIds] of pending) {
    const tenant = await getTenantById(tenantId).catch(() => null);
    if (!tenant || storefrontAvailability(tenant) !== 'open') continue;
    const host = tenant.domain || (tenant.subdomain ? `${tenant.subdomain}.${platform}` : null);
    if (!host || !(await servedHere(host, key))) continue;

    const origin = `https://${host}`;
    const catalog = await getStoreCatalog(tenant).catch(() => null);
    const urls = new Set<string>([`${origin}/`]);
    for (const id of productIds) {
      const product = id ? catalog?.products.find((p) => p.id === id) : undefined;
      if (!product) continue;
      urls.add(`${origin}${productPath(product)}`);
      const category = catalog?.categories.find((c) => c.id === product.category);
      if (category) urls.add(`${origin}${categoryPath(category)}`);
    }

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation: `${origin}/indexnow.txt`, urlList: [...urls] }),
      signal: AbortSignal.timeout(15_000),
    }).catch((error) => {
      console.warn('[indexnow] Sin respuesta para', host, error);
      return null;
    });
    if (res && res.status !== 200 && res.status !== 202) console.warn('[indexnow] Respuesta', res.status, 'para', host);
  }
}
