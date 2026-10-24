// Fuente de datos de la vitrina para las tiendas conectadas al ERP
// (`tenant.erp.partnerId`). Lee todo el catálogo publicado del negocio y lo
// deja en la forma de la vitrina. La caché la lleva storefront-data.

import type { TenantConfig } from '@/lib/types';
import type { StoreCatalog, StoreProduct } from '@/lib/storefront/catalog';
import type { StoreCategory } from '@/lib/storefront/public-store';
import { guessCategoryIcon } from '@/lib/storefront/category-icons';
import { erpGet } from './client';

/** Tope de productos por tienda (5 páginas de 100). */
const MAX_PAGES = 5;

interface ErpImage {
  url?: string;
  medium_url?: string;
  thumb_url?: string;
  is_primary?: boolean;
  sort_order?: number;
}

interface ErpProduct {
  id: number;
  name?: string;
  description?: string;
  category?: { id: number; name: string } | null;
  sale_price?: number;
  compare_at_price?: number | null;
  track_stock?: boolean;
  stock_available?: number | null;
  images?: ErpImage[];
  active?: boolean;
  published?: boolean;
  featured?: boolean;
  sort_order?: number;
  slug?: string | null;
  updated_at?: string | null;
  /** Fin de la oferta (pedido E-9 al ERP). */
  sale_ends_at?: string | null;
}

interface ErpCategory {
  id: number;
  name: string;
  product_count?: number;
}

export function toStoreProduct(p: ErpProduct): StoreProduct | null {
  // Al sincronizar por fecha llegan también los que dejaron de verse, sin nombre.
  if (p.active === false || p.published === false || !p.name) return null;
  const images = [...(p.images ?? [])]
    .filter((img): img is ErpImage & { url: string } => typeof img.url === 'string' && img.url.length > 0)
    .sort((a, b) => Number(b.is_primary ?? false) - Number(a.is_primary ?? false) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const price = Number(p.sale_price) || 0;
  // Una oferta con fecha vencida ya no es oferta: sin precio «antes» ni contador.
  const saleEnds = typeof p.sale_ends_at === 'string' ? Date.parse(p.sale_ends_at) : NaN;
  const saleOver = Number.isFinite(saleEnds) && saleEnds <= Date.now();
  const compareAt = !saleOver && typeof p.compare_at_price === 'number' && p.compare_at_price > price ? p.compare_at_price : null;
  return {
    id: String(p.id),
    name: p.name,
    description: p.description?.trim() || undefined,
    price,
    compareAtPrice: compareAt,
    category: p.category ? String(p.category.id) : '',
    imageUrls: images.map((img) => img.url),
    featured: p.featured === true,
    stock: p.track_stock && typeof p.stock_available === 'number' ? p.stock_available : null,
    ...(p.slug ? { slug: p.slug } : {}),
    ...(p.updated_at ? { updatedAt: p.updated_at } : {}),
    ...(compareAt && Number.isFinite(saleEnds) ? { saleEndsAt: new Date(saleEnds).toISOString() } : {}),
  };
}

export function toStoreCategories(
  categories: ErpCategory[],
  products: StoreProduct[],
  icons: Record<string, string> = {},
  order: string[] = []
): StoreCategory[] {
  const used = new Set(products.map((p) => p.category).filter(Boolean));
  // Las que la tienda ordenó van primero, en su orden; el resto, como las da el ERP.
  const rank = (id: string) => {
    const at = order.indexOf(id);
    return at === -1 ? order.length : at;
  };
  return categories
    .filter((c) => used.has(String(c.id)))
    .map((c, at) => ({ c, at }))
    .sort((a, b) => rank(String(a.c.id)) - rank(String(b.c.id)) || a.at - b.at)
    .map(({ c }) => ({ id: String(c.id), label: c.name, icon: icons[String(c.id)] ?? guessCategoryIcon(c.name) }));
}

export async function loadErpCatalog(store: TenantConfig): Promise<StoreCatalog> {
  const partnerId = store.erp?.partnerId;
  if (!partnerId) return { products: [], categories: [] };

  const loadProducts = async () => {
    const items: ErpProduct[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await erpGet<{ items?: ErpProduct[]; next_cursor?: string }>(partnerId, '/integrations/catalog/products', {
        page_size: 100,
        cursor,
      });
      items.push(...(res.items ?? []));
      if (!res.next_cursor) break;
      cursor = res.next_cursor;
    }
    return items;
  };

  const [rawProducts, rawCategories] = await Promise.all([
    loadProducts(),
    erpGet<{ categories?: ErpCategory[] }>(partnerId, '/integrations/catalog/categories'),
  ]);

  const products = rawProducts.map(toStoreProduct).filter((p): p is StoreProduct => p !== null);
  const categories = toStoreCategories(
    rawCategories.categories ?? [],
    products,
    store.storefront?.categoryIcons,
    store.storefront?.categoryOrder
  );
  return { products, categories };
}
