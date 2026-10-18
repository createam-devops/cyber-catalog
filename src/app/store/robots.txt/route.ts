import { NextRequest } from 'next/server';
import { findStoreByDomain, storeDomainFromRequest, storefrontAvailability } from '@/lib/server/storefront-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * robots.txt de cada tienda. En su dominio, el middleware manda /robots.txt
 * aquí; el de createam.cloud es src/app/robots.ts.
 *
 * Si no encuentra la tienda (o la búsqueda falla) responde 404 y no
 * «Disallow: /»: para Google un robots.txt que no existe no restringe nada, así
 * que un error pasajero nunca saca de Google a una tienda real.
 */
export async function GET(request: NextRequest) {
  const domain = storeDomainFromRequest(request);
  const tenant = domain ? await findStoreByDomain(domain).catch(() => null) : null;
  if (!tenant || storefrontAvailability(tenant) === 'missing') return new Response('No encontrado', { status: 404 });
  // /store es la ruta interna: con la URL limpia basta.
  const body = `User-agent: *\nAllow: /\nDisallow: /store\n\nSitemap: https://${domain}/sitemap.xml\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
