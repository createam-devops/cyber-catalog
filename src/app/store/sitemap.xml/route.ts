import { NextRequest } from 'next/server';
import { findStoreByDomain, storeDomainFromRequest, getStoreCatalog, storefrontAvailability } from '@/lib/server/storefront-data';
import { absoluteUrl } from '@/lib/storefront/structured-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]!);

/**
 * sitemap.xml de cada tienda: la portada y cada producto, con su primera foto
 * (Google Imágenes). En su dominio, el middleware manda /sitemap.xml aquí. El
 * catálogo sale de la caché en memoria de storefront-data.
 */
export async function GET(request: NextRequest) {
  const domain = storeDomainFromRequest(request);
  const tenant = domain ? await findStoreByDomain(domain).catch(() => null) : null;
  if (!domain || !tenant || storefrontAvailability(tenant) !== 'open') return new Response('No encontrado', { status: 404 });

  const origin = `https://${domain}`;
  const products = await getStoreCatalog(tenant)
    .then((catalog) => catalog.products)
    .catch(() => []);

  const entries = [
    `  <url><loc>${escapeXml(`${origin}/`)}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...products.map((product) => {
      const image = absoluteUrl(product.imageUrls[0], origin);
      return [
        '  <url>',
        `<loc>${escapeXml(`${origin}/product/${encodeURIComponent(product.id)}`)}</loc>`,
        image ? `<image:image><image:loc>${escapeXml(image)}</image:loc></image:image>` : '',
        '</url>',
      ].join('');
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
