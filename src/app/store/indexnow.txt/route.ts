import { NextRequest } from 'next/server';
import { findStoreByDomain, storeDomainFromRequest } from '@/lib/server/storefront-data';
import { indexNowKey } from '@/lib/server/indexnow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** La llave de IndexNow, publicada en el dominio de cada tienda (ver src/lib/server/indexnow.ts). */
export async function GET(request: NextRequest) {
  const key = indexNowKey();
  const domain = storeDomainFromRequest(request);
  const tenant = key && domain ? await findStoreByDomain(domain).catch(() => null) : null;
  if (!key || !tenant) return new Response('No encontrado', { status: 404 });
  return new Response(key, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } });
}
