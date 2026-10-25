import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { findStoreByDomain, getStoreCatalog, storefrontAvailability } from '@/lib/server/storefront-data';
import { isAppNotEnabled } from '@/lib/server/erp/client';
import { normalizeWhatsapp } from '@/lib/storefront/public-store';
import { productSlug } from '@/lib/storefront/catalog';
import { withRatings } from '@/lib/server/reviews';
import { allowedStoreOrigin as allowedOrigin, requestedStoreDomain, storeCorsHeaders as corsHeaders } from '@/lib/server/storefront-cors';

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

async function storeFor(request: NextRequest) {
  const domain = requestedStoreDomain(request.nextUrl.searchParams);
  if (!domain) return null;
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
    // El slug de cada categoría lo pone getStoreCatalog (la misma regla que la web de la tienda).
    const slugById = new Map(catalog.categories.map((c) => [c.id, c.slug ?? c.id]));
    const categories = catalog.categories.map((c) => ({ id: c.id, value: slugById.get(c.id)!, label: c.label, icon: c.icon ?? null }));

    return NextResponse.json(
      {
        store: { name: tenant.name, domain: tenant.domain ?? null, whatsapp: normalizeWhatsapp(tenant.whatsapp) },
        generatedAt: new Date().toISOString(),
        categories,
        // Sin slug del ERP, el mismo que usan las tiendas de la plataforma (nombre-número).
        products: withRatings(tenant.id, catalog.products).map((p) => ({
          id: p.id,
          slug: productSlug(p),
          name: p.name,
          description: p.description ?? '',
          price: p.price,
          compareAtPrice: p.compareAtPrice ?? null,
          category: slugById.get(p.category) ?? '',
          imageUrls: p.imageUrls,
          featured: p.featured,
          stock: p.stock,
          updatedAt: p.updatedAt ?? null,
          // Promedio de las opiniones aprobadas; null si aún no tiene.
          rating: p.rating ?? null,
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
