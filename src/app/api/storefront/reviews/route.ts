import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { findStoreByDomain, getStoreCatalog, storefrontAvailability } from '@/lib/server/storefront-data';
import { addReview, isLocalStore } from '@/lib/server/store-db';

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
 * Un cliente deja su opinión de un producto. Entra pendiente: la tienda la
 * aprueba (o la rechaza) desde su editor, y recién entonces se publica. La
 * tienda sale del dominio desde el que se pide (o de `_domain` en localhost y
 * en el dominio de la plataforma, como la API de productos).
 */
export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'storefront-review', 5, 60 * 60 * 1000);
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Ya enviaste varias opiniones. Inténtalo más tarde.' }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } });
  }

  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
  const isDevHost = host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host);
  const isPlatformHost = host === platformDomain || host === `www.${platformDomain}`;
  const domain = isDevHost || isPlatformHost ? request.nextUrl.searchParams.get('_domain') || '' : host;

  const body = await request.json().catch(() => null);
  // El robot que llenó el campo trampa recibe un «gracias» y no se guarda nada: así no sabe que lo descubrimos.
  if (body && typeof body === 'object' && typeof (body as { website?: unknown }).website === 'string' && (body as { website: string }).website.trim()) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Revisa tu opinión.' }, { status: 400 });
  }

  const tenant = domain ? await findStoreByDomain(domain).catch(() => null) : null;
  if (!tenant || storefrontAvailability(tenant) !== 'open' || !isLocalStore(tenant.id)) {
    return NextResponse.json({ error: 'Tienda no encontrada.' }, { status: 404 });
  }
  const catalog = await getStoreCatalog(tenant).catch(() => null);
  if (!catalog?.products.some((p) => p.id === parsed.data.productId)) {
    return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
  }

  addReview({ storeId: tenant.id, productId: parsed.data.productId, rating: parsed.data.rating, name: parsed.data.name, text: parsed.data.text });
  return NextResponse.json({ ok: true }, { status: 201 });
}
