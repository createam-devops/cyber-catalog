import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { findStoreByDomain, getStoreCatalog, storefrontAvailability } from '@/lib/server/storefront-data';
import { isAppNotEnabled } from '@/lib/server/erp/client';
import { normalizeWhatsapp } from '@/lib/storefront/public-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * El catálogo completo de una tienda con web propia (p. ej. bellasorpresa.pe,
 * que se publica aparte): productos con su slug, categorías con el suyo y el
 * WhatsApp de la tienda. Es pública: devuelve lo mismo que muestra la vitrina.
 *
 *   GET /api/storefront/catalog?domain=bellasorpresa.pe
 *
 * Su navegador la puede leer (CORS) solo desde el dominio guardado de la
 * tienda, con o sin www, y desde localhost para probar. Al compilar la web se
 * pide desde el servidor, sin Origin.
 */

/** Igual que la web de la tienda: minúsculas, sin tildes, espacios a guiones. */
function categorySlug(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

function allowedOrigin(origin: string | null, storeDomain: string | undefined): string | null {
  if (!origin) return null;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if ((host === 'localhost' || host === '127.0.0.1') && (url.protocol === 'http:' || url.protocol === 'https:')) return origin;
  const domain = storeDomain?.toLowerCase().replace(/^www\./, '');
  if (domain && url.protocol === 'https:' && (host === domain || host === `www.${domain}`)) return origin;
  return null;
}

function corsHeaders(origin: string | null): Record<string, string> {
  return origin
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400', Vary: 'Origin' }
    : { Vary: 'Origin' };
}

async function storeFor(request: NextRequest) {
  const domain = (request.nextUrl.searchParams.get('domain') || '').trim().toLowerCase();
  if (!/^[a-z0-9.-]{3,253}$/.test(domain)) return null;
  const tenant = await findStoreByDomain(domain);
  return tenant && storefrontAvailability(tenant) === 'open' ? tenant : null;
}

export async function OPTIONS(request: NextRequest) {
  const tenant = await storeFor(request).catch(() => null);
  return new NextResponse(null, { status: 204, headers: corsHeaders(allowedOrigin(request.headers.get('origin'), tenant?.domain)) });
}

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'storefront-catalog', 120);
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  let storeDomain: string | undefined;
  try {
    const tenant = await storeFor(request);
    storeDomain = tenant?.domain;
    const cors = corsHeaders(allowedOrigin(request.headers.get('origin'), storeDomain));
    if (!tenant) return NextResponse.json({ error: 'Store not found' }, { status: 404, headers: cors });

    const catalog = await getStoreCatalog(tenant);
    const slugById = new Map<string, string>();
    const categories = catalog.categories.map((c) => {
      let value = categorySlug(c.label) || `categoria-${c.id}`;
      if ([...slugById.values()].includes(value)) value = `${value}-${c.id}`;
      slugById.set(c.id, value);
      return { id: c.id, value, label: c.label, icon: c.icon ?? null };
    });

    return NextResponse.json(
      {
        store: { name: tenant.name, domain: tenant.domain ?? null, whatsapp: normalizeWhatsapp(tenant.whatsapp) },
        generatedAt: new Date().toISOString(),
        categories,
        products: catalog.products.map((p) => ({
          id: p.id,
          slug: p.slug ?? null,
          name: p.name,
          description: p.description ?? '',
          price: p.price,
          compareAtPrice: p.compareAtPrice ?? null,
          category: slugById.get(p.category) ?? '',
          imageUrls: p.imageUrls,
          featured: p.featured,
          stock: p.stock,
          updatedAt: p.updatedAt ?? null,
        })),
      },
      { headers: { ...cors, 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
    );
  } catch (error) {
    const cors = corsHeaders(allowedOrigin(request.headers.get('origin'), storeDomain));
    if (isAppNotEnabled(error)) return NextResponse.json({ error: 'Store not found' }, { status: 404, headers: cors });
    console.error('[storefront/catalog] No se pudo leer el catálogo:', error);
    return NextResponse.json({ error: 'Catalog unavailable' }, { status: 503, headers: cors });
  }
}
