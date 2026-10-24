import { NextRequest } from 'next/server';
import { findStoreByDomain, storeDomainFromRequest, getStoreCatalog, storefrontAvailability } from '@/lib/server/storefront-data';
import { productPath, type StoreCatalog } from '@/lib/storefront/catalog';
import { absoluteUrl } from '@/lib/storefront/structured-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]!);

const tag = (name: string, value: string | undefined | null) => (value ? `<g:${name}>${escapeXml(value)}</g:${name}>` : '');
const money = (value: number) => `${value.toFixed(2)} PEN`;

/**
 * Listado de productos para Google Merchant Center (fichas gratuitas en
 * Google Shopping): /feed/google.xml en el dominio de cada tienda. La tienda lo
 * agrega en Merchant Center como «fuente de datos por URL» y Google lo vuelve
 * a leer solo. Mismo catálogo que la vitrina; sin foto, Google no acepta el
 * producto y aquí no se lista.
 */
export async function GET(request: NextRequest) {
  const domain = storeDomainFromRequest(request);
  const tenant = domain ? await findStoreByDomain(domain).catch(() => null) : null;
  if (!domain || !tenant || storefrontAvailability(tenant) !== 'open') return new Response('No encontrado', { status: 404 });

  const origin = `https://${domain}`;
  const catalog = await getStoreCatalog(tenant).catch(() => ({ products: [], categories: [] }) as StoreCatalog);
  const categoryLabel = new Map(catalog.categories.map((c) => [c.id, c.label]));

  const items = catalog.products
    .map((p) => ({ product: p, images: p.imageUrls.map((url) => absoluteUrl(url, origin)).filter((url): url is string => Boolean(url)) }))
    .filter(({ images }) => images.length > 0)
    .map(({ product: p, images }) => {
      const onSale = typeof p.compareAtPrice === 'number' && p.compareAtPrice > p.price;
      const description = p.description?.trim() || `${p.name} en ${tenant.name}. Pide por WhatsApp.`;
      return [
        '<item>',
        tag('id', p.id),
        tag('title', p.name.slice(0, 150)),
        tag('description', description.slice(0, 5000)),
        tag('link', `${origin}${productPath(p)}`),
        tag('image_link', images[0]),
        ...images.slice(1, 11).map((url) => tag('additional_image_link', url)),
        // Sin control de stock la tienda lo vende: disponible. Con stock en cero, agotado.
        tag('availability', p.stock !== null && p.stock <= 0 ? 'out_of_stock' : 'in_stock'),
        tag('price', money(onSale ? p.compareAtPrice! : p.price)),
        onSale ? tag('sale_price', money(p.price)) : '',
        onSale && p.saleEndsAt ? tag('sale_price_effective_date', `${new Date().toISOString().slice(0, 19)}Z/${p.saleEndsAt.slice(0, 19)}Z`) : '',
        tag('condition', 'new'),
        tag('brand', tenant.name),
        tag('identifier_exists', 'no'),
        tag('product_type', categoryLabel.get(p.category)),
        '</item>',
      ].join('');
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${escapeXml(tenant.name)}</title>
<link>${escapeXml(`${origin}/`)}</link>
<description>${escapeXml(`Catálogo de ${tenant.name}`)}</description>
${items.join('\n')}
</channel>
</rss>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
