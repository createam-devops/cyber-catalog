import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { findStoreByDomain, getStoreCatalog, storefrontAvailability } from '@/lib/server/storefront-data';
import { addReview, isLocalStore } from '@/lib/server/store-db';
import { publicReviews, withRatings } from '@/lib/server/reviews';
import { allowedStoreOrigin, requestedStoreDomain, storeCorsHeaders } from '@/lib/server/storefront-cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const reviewSchema = z.object({
  productId: z.string().trim().min(1, 'Producto no encontrado.').max(64, 'Producto no encontrado.'),
  rating: z.coerce.number({ invalid_type_error: 'Elige de 1 a 5 estrellas.' }).int('Elige de 1 a 5 estrellas.').min(1, 'Elige de 1 a 5 estrellas.').max(5, 'Elige de 1 a 5 estrellas.'),
  name: z.string().trim().min(2, 'Escribe tu nombre.').max(40, 'El nombre es muy largo.'),
  text: z.string().trim().min(10, 'Cuéntanos un poco más (al menos 10 letras).').max(600, 'Tu opinión es muy larga (hasta 600 letras).'),
  /** Campo trampa: una persona no lo ve ni lo llena; un robot sí (y recibe un «gracias» sin que se guarde nada). */
  website: z.string().max(500).optional(),
});

/**
 * La tienda que pide: la del dominio desde el que se llama, o la de `domain` /
 * `_domain` cuando se llama al dominio de la plataforma (la web propia de una
 * tienda, como bellasorpresa.pe) o desde localhost.
 */
function storeDomainOf(request: NextRequest): string | null {
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
  const isDevHost = host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host);
  const isPlatformHost = host === platformDomain || host === `www.${platformDomain}`;
  return isDevHost || isPlatformHost ? requestedStoreDomain(request.nextUrl.searchParams) : host || null;
}

async function openStore(domain: string | null) {
  const tenant = domain ? await findStoreByDomain(domain).catch(() => null) : null;
  return tenant && storefrontAvailability(tenant) === 'open' && isLocalStore(tenant.id) ? tenant : null;
}

/** Cabeceras CORS para la web propia de la tienda (sin ellas, su navegador no ve la respuesta). */
async function corsFor(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return storeCorsHeaders(null);
  const tenant = await openStore(storeDomainOf(request));
  return storeCorsHeaders(allowedStoreOrigin(origin, tenant?.domain), 'GET, POST, OPTIONS');
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: await corsFor(request) });
}

/**
 * Las opiniones aprobadas de un producto y su promedio, para la web propia de
 * la tienda (las tiendas de la plataforma las reciben ya en la página).
 *
 *   GET /api/storefront/reviews?domain=bellasorpresa.pe&product=<id>
 */
export async function GET(request: NextRequest) {
  const cors = await corsFor(request);
  const rateLimit = checkRateLimit(request, 'storefront-reviews-read', 120);
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { ...cors, 'Retry-After': String(rateLimit.retryAfterSeconds) } });
  }
  const productId = (request.nextUrl.searchParams.get('product') || '').trim();
  const tenant = await openStore(storeDomainOf(request));
  if (!tenant || !productId || productId.length > 64) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: cors });
  }
  const summary = reviewSummary(tenant.id, productId);
  return NextResponse.json(
    { rating: summary, reviews: publicReviews(tenant.id, productId) },
    { headers: { ...cors, 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
  );
}

/** El promedio de un producto (null sin opiniones aprobadas). */
function reviewSummary(storeId: string, productId: string) {
  const [rated] = withRatings(storeId, [{ id: productId, name: '', price: 0, category: '', imageUrls: [], featured: false, stock: null }]);
  return rated.rating ?? null;
}

/**
 * Un cliente deja su opinión de un producto. Entra pendiente: la tienda la
 * aprueba (o la rechaza) desde su editor, y recién entonces se publica.
 */
export async function POST(request: NextRequest) {
  const cors = await corsFor(request);
  const rateLimit = checkRateLimit(request, 'storefront-review', 5, 60 * 60 * 1000);
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: 'Ya enviaste varias opiniones. Inténtalo más tarde.' },
      { status: 429, headers: { ...cors, 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  // El robot que llenó el campo trampa recibe un «gracias» y no se guarda nada: así no sabe que lo descubrimos.
  if (body && typeof body === 'object' && typeof (body as { website?: unknown }).website === 'string' && (body as { website: string }).website.trim()) {
    return NextResponse.json({ ok: true }, { status: 201, headers: cors });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Revisa tu opinión.' }, { status: 400, headers: cors });
  }

  const tenant = await openStore(storeDomainOf(request));
  if (!tenant) {
    return NextResponse.json({ error: 'Tienda no encontrada.' }, { status: 404, headers: cors });
  }
  const catalog = await getStoreCatalog(tenant).catch(() => null);
  if (!catalog?.products.some((p) => p.id === parsed.data.productId)) {
    return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404, headers: cors });
  }

  addReview({ storeId: tenant.id, productId: parsed.data.productId, rating: parsed.data.rating, name: parsed.data.name, text: parsed.data.text });
  return NextResponse.json({ ok: true }, { status: 201, headers: cors });
}
