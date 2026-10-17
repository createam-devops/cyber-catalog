import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { findStoreByDomain, getStoreCatalog, storefrontAvailability } from '@/lib/server/storefront-data';
import { queryCatalog } from '@/lib/storefront/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Páginas del catálogo para la vitrina (filtros, búsqueda y scroll infinito de
 * los catálogos grandes). Es pública: devuelve lo mismo que la vitrina ya
 * muestra. La tienda sale del dominio desde el que se pide; el parámetro
 * `_domain` solo se acepta en localhost o desde el dominio de la plataforma,
 * para poder probar una tienda sin su dominio.
 */
export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'storefront-products', 120);
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  const params = request.nextUrl.searchParams;
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
  const isDevHost = host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host);
  const isPlatformHost = host === platformDomain || host === `www.${platformDomain}`;
  const domain = isDevHost || isPlatformHost ? params.get('_domain') || '' : host;

  if (!domain) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  try {
    const tenant = await findStoreByDomain(domain);
    if (!tenant || storefrontAvailability(tenant) !== 'open') {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const catalog = await getStoreCatalog(tenant);
    const offset = Number(params.get('offset')) || 0;
    const page = queryCatalog(catalog, {
      category: params.get('category'),
      q: params.get('q')?.slice(0, 80),
      offset,
      limit: Number(params.get('limit')) || 24,
    });

    // La primera página trae también las categorías (la usa la vista previa del panel).
    return NextResponse.json(offset === 0 ? { ...page, categories: catalog.categories } : page, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('[storefront/products] No se pudo leer el catálogo:', error);
    return NextResponse.json({ error: 'Catalog unavailable' }, { status: 503 });
  }
}
