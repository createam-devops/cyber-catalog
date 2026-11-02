import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { findStoreByDomain, getStoreCatalog, storefrontAvailability } from '@/lib/server/storefront-data';
import { isAppNotEnabled } from '@/lib/server/erp/client';
import { normalizeWhatsapp, socialUrl } from '@/lib/storefront/public-store';
import { isPromoActive, resolveStorefront } from '@/lib/storefront/theme';
import { catalogPublicUrl } from '@/lib/server/erp/panel-auth';
import { toPublicMediaUrl } from '@/lib/server/store-media';
import { productSlug } from '@/lib/storefront/catalog';
import { withRatings } from '@/lib/server/reviews';
import { allowedStoreOrigin as allowedOrigin, requestedStoreDomain, storeCorsHeaders as corsHeaders } from '@/lib/server/storefront-cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * El catálogo completo de una tienda con web propia (p. ej. bellasorpresa.pe,
 * que se publica aparte): productos con su slug, categorías con el suyo y lo
 * que la tienda cambia en el editor y esa web muestra (WhatsApp, redes,
 * banners y aviso de oferta). Es pública: devuelve lo mismo que muestra la
 * vitrina. Lo demás del editor (colores, letras, textos…) no viaja: la web
 * propia tiene su diseño, y el editor lo bloquea (TenantConfig.customSite).
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
    const mediaBase = catalogPublicUrl(request);
    const promo = resolveStorefront({ storefront: tenant.storefront }).promo;
    // El slug de cada categoría lo pone getStoreCatalog (la misma regla que la web de la tienda).
    const slugById = new Map(catalog.categories.map((c) => [c.id, c.slug ?? c.id]));
    const categories = catalog.categories.map((c) => ({ id: c.id, value: slugById.get(c.id)!, label: c.label, icon: c.icon ?? null }));

    return NextResponse.json(
      {
        store: {
          // Para contar visitas y pedidos por WhatsApp (POST /api/analytics/track).
          id: tenant.id,
          name: tenant.name,
          domain: tenant.domain ?? null,
          whatsapp: normalizeWhatsapp(tenant.whatsapp),
          // URL completa de cada red, o null si la tienda no la puso.
          socialMedia: {
            instagram: socialUrl('instagram', tenant.socialMedia?.instagram),
            tiktok: socialUrl('tiktok', tenant.socialMedia?.tiktok),
            facebook: socialUrl('facebook', tenant.socialMedia?.facebook),
          },
          // Banners de portada en su orden, con la imagen absoluta (se sirve desde la plataforma).
          heroSlides: [...(tenant.heroSlides ?? [])]
            .filter((slide) => slide.image)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((slide) => ({
              id: slide.id,
              image: toPublicMediaUrl(slide.image, mediaBase),
              title: slide.title ?? '',
              subtitle: slide.subtitle ?? '',
              buttonText: slide.buttonText ?? '',
            })),
          // Aviso de oferta vigente ({ text, endsAt }) o null. Con fecha, se apaga solo al llegar.
          promo: isPromoActive(promo) ? promo : null,
        },
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
          // Fin de la oferta (ISO) si el precio «antes» tiene fecha; pasada, ya no hay oferta.
          saleEndsAt: p.saleEndsAt ?? null,
          category: slugById.get(p.category) ?? '',
          imageUrls: p.imageUrls,
          featured: p.featured,
          stock: p.stock,
          updatedAt: p.updatedAt ?? null,
          // Promedio de las opiniones aprobadas; null si aún no tiene.
          rating: p.rating ?? null,
          // Con variantes (talla, color…): `price` es el más bajo y se pide una variante (su id va al pedido).
          ...(p.options?.length && p.variants?.length
            ? { priceMax: p.priceMax ?? p.price, options: p.options, variants: p.variants }
            : {}),
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
