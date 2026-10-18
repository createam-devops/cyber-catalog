import { NextRequest } from 'next/server';
import { findStoreByDomain, storefrontAvailability } from '@/lib/server/storefront-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * robots.txt de cada tienda. En su dominio, el middleware manda /robots.txt
 * aquí con `_domain`; el de createam.cloud es src/app/robots.ts.
 */
export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('_domain');
  const tenant = domain ? await findStoreByDomain(domain).catch(() => null) : null;
  const body =
    tenant && storefrontAvailability(tenant) !== 'missing'
      ? // /store es la ruta interna: con la URL limpia basta.
        `User-agent: *\nAllow: /\nDisallow: /store\n\nSitemap: https://${domain}/sitemap.xml\n`
      : 'User-agent: *\nDisallow: /\n';
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
