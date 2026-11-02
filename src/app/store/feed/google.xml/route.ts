import { NextRequest } from 'next/server';
import { findStoreByDomain, storeDomainFromRequest, getStoreCatalog, storefrontAvailability } from '@/lib/server/storefront-data';
import { productPath, type StoreCatalog, type StoreProduct, type StoreVariant } from '@/lib/storefront/catalog';
import { absoluteUrl } from '@/lib/storefront/structured-data';
import { hasVariants, selectionImages, variantAttributes, variantLineName } from '@/lib/storefront/variants';

/** Un artículo del listado: un producto, o una variante de una ficha. */
interface FeedOffer {
  id: string;
  title: string;
  link: string;
  imageUrls: string[];
  item: Pick<StoreProduct | StoreVariant, 'price' | 'compareAtPrice' | 'saleEndsAt' | 'stock'>;
  product: StoreProduct;
  groupId?: string;
  attributes?: ReturnType<typeof variantAttributes>;
}

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

  // Con variantes, cada una es un artículo propio (su precio, stock, talla y color) unido a su ficha por item_group_id.
  const offers: FeedOffer[] = catalog.products.flatMap((p): FeedOffer[] => {
    const link = `${origin}${productPath(p)}`;
    if (!hasVariants(p)) return [{ id: p.id, title: p.name, link, imageUrls: p.imageUrls, item: p, product: p }];
    return (p.variants ?? []).map((v) => ({
      id: v.id,
      title: variantLineName(p, v),
      link: `${link}?variant=${encodeURIComponent(v.id)}`,
      imageUrls: selectionImages(p, v.values),
      item: v,
      product: p,
      groupId: p.id,
      attributes: variantAttributes(p.options ?? [], v),
    }));
  });

  const items = offers
    .map((offer) => ({ offer, images: offer.imageUrls.map((url) => absoluteUrl(url, origin)).filter((url): url is string => Boolean(url)) }))
    .filter(({ images }) => images.length > 0)
    .map(({ offer, images }) => {
      const { item: v, product: p } = offer;
      const onSale = typeof v.compareAtPrice === 'number' && v.compareAtPrice > v.price;
      const description = p.description?.trim() || `${offer.title} en ${tenant.name}. Pide por WhatsApp.`;
      return [
        '<item>',
        tag('id', offer.id),
        offer.groupId ? tag('item_group_id', offer.groupId) : '',
        tag('title', offer.title.slice(0, 150)),
        tag('description', description.slice(0, 5000)),
        tag('link', offer.link),
        tag('image_link', images[0]),
        ...images.slice(1, 11).map((url) => tag('additional_image_link', url)),
        // Sin control de stock la tienda lo vende: disponible. Con stock en cero, agotado.
        tag('availability', v.stock !== null && v.stock <= 0 ? 'out_of_stock' : 'in_stock'),
        tag('price', money(onSale ? v.compareAtPrice! : v.price)),
        onSale ? tag('sale_price', money(v.price)) : '',
        onSale && v.saleEndsAt ? tag('sale_price_effective_date', `${new Date().toISOString().slice(0, 19)}Z/${v.saleEndsAt.slice(0, 19)}Z`) : '',
        tag('condition', 'new'),
        tag('brand', tenant.name),
        tag('identifier_exists', 'no'),
        tag('product_type', categoryLabel.get(p.category)),
        ...(offer.attributes ?? []).filter((a) => a.attribute).map((a) => tag(a.attribute!, a.value.slice(0, 100))),
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
