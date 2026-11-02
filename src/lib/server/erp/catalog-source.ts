// Fuente de datos de la vitrina para las tiendas conectadas al ERP
// (`tenant.erp.partnerId`). Lee todo el catálogo publicado del negocio y lo
// deja en la forma de la vitrina. La caché la lleva storefront-data.

import type { TenantConfig } from '@/lib/types';
import type { StoreCatalog, StoreOption, StoreProduct, StoreVariant } from '@/lib/storefront/catalog';
import type { StoreCategory } from '@/lib/storefront/public-store';
import { guessCategoryIcon } from '@/lib/storefront/category-icons';
import { labelFromValues } from '@/lib/storefront/variants';
import { ErpError, erpGet } from './client';

/** Tope de entradas por tienda: productos sueltos más fichas. */
const MAX_ENTRIES = 500;
/** Freno por si el ERP devolviera cursores sin fin. */
const MAX_PAGES = 50;

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

/** Fotos en orden: la principal primero, luego por su orden. */
function sortedImageUrls(images: ErpImage[] | undefined): string[] {
  return [...(images ?? [])]
    .filter((img): img is ErpImage & { url: string } => typeof img.url === 'string' && img.url.length > 0)
    .sort((a, b) => Number(b.is_primary ?? false) - Number(a.is_primary ?? false) || (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img) => img.url);
}

/** Precio «antes» y fin de la oferta. Una oferta con fecha vencida ya no es oferta: sin precio «antes» ni contador. */
function offer(price: number, compareAtPrice: number | null | undefined, saleEndsAt: string | null | undefined) {
  const saleEnds = typeof saleEndsAt === 'string' ? Date.parse(saleEndsAt) : NaN;
  const saleOver = Number.isFinite(saleEnds) && saleEnds <= Date.now();
  const compareAt = !saleOver && typeof compareAtPrice === 'number' && compareAtPrice > price ? compareAtPrice : null;
  return { compareAt, saleEndsAt: compareAt && Number.isFinite(saleEnds) ? new Date(saleEnds).toISOString() : undefined };
}

export function toStoreProduct(p: ErpProduct): StoreProduct | null {
  // Al sincronizar por fecha llegan también los que dejaron de verse, sin nombre.
  if (p.active === false || p.published === false || !p.name) return null;
  const price = Number(p.sale_price) || 0;
  const { compareAt, saleEndsAt } = offer(price, p.compare_at_price, p.sale_ends_at);
  return {
    id: String(p.id),
    name: p.name,
    description: p.description?.trim() || undefined,
    price,
    compareAtPrice: compareAt,
    category: p.category ? String(p.category.id) : '',
    imageUrls: sortedImageUrls(p.images),
    featured: p.featured === true,
    stock: p.track_stock && typeof p.stock_available === 'number' ? p.stock_available : null,
    ...(p.slug ? { slug: p.slug } : {}),
    ...(p.updated_at ? { updatedAt: p.updated_at } : {}),
    ...(saleEndsAt ? { saleEndsAt } : {}),
  };
}

// --- API v2 del ERP (F4 de variantes, cyberERP/CONTRATO_VARIANTES_F4.md §5.3).
// Cada producto es un producto simple («p123») o una ficha («f45») con sus ejes
// (options) y sus variantes. Lo que se pide es siempre una variante: su id es
// el del producto en el ERP, el mismo de la v1.

interface ErpOptionValueV2 {
  id: number;
  value: string;
  hex_color?: string | null;
  image_url?: string | null;
  image_thumb_url?: string | null;
  position?: number;
}

interface ErpOptionV2 {
  id: number;
  name: string;
  kind?: string;
  position?: number;
  values?: ErpOptionValueV2[];
}

interface ErpVariantV2 {
  id: number;
  code?: string;
  name?: string;
  variant_label?: string;
  option_values?: Array<{ option_id: number; value_id: number }>;
  sale_price?: number;
  compare_at_price?: number | null;
  sale_ends_at?: string | null;
  track_stock?: boolean;
  stock_available?: number | null;
  images?: ErpImage[];
  published?: boolean;
}

export interface ErpProductV2 extends Omit<ErpProduct, 'id'> {
  id: string;
  type?: 'family' | 'product';
  family_id?: number | null;
  price_min?: number;
  price_max?: number;
  options?: ErpOptionV2[];
  variants?: ErpVariantV2[];
}

const byPosition = <T extends { position?: number }>(a: T, b: T) => (a.position ?? 0) - (b.position ?? 0);

function toStoreVariant(v: ErpVariantV2, options: StoreOption[]): StoreVariant {
  const price = Number(v.sale_price) || 0;
  const { compareAt, saleEndsAt } = offer(price, v.compare_at_price, v.sale_ends_at);
  const values = Object.fromEntries((v.option_values ?? []).map((ov) => [String(ov.option_id), String(ov.value_id)]));
  return {
    id: String(v.id),
    values,
    label: v.variant_label?.trim() || labelFromValues(options, values),
    price,
    compareAtPrice: compareAt,
    ...(saleEndsAt ? { saleEndsAt } : {}),
    stock: v.track_stock && typeof v.stock_available === 'number' ? v.stock_available : null,
    imageUrls: sortedImageUrls(v.images),
    ...(v.code ? { sku: v.code } : {}),
  };
}

export function toStoreProductV2(p: ErpProductV2): StoreProduct | null {
  if (p.active === false || p.published === false || !p.name) return null;
  const variants = (p.variants ?? []).filter((v) => v.published !== false);
  if (!variants.length) return null;

  // Producto simple: el mismo id y la misma forma que en la v1 (las direcciones y las opiniones no cambian).
  if (p.type !== 'family' || !(p.options ?? []).length) {
    const [only] = variants;
    return toStoreProduct({
      ...p,
      id: only.id,
      sale_price: only.sale_price,
      compare_at_price: only.compare_at_price,
      sale_ends_at: only.sale_ends_at,
      track_stock: only.track_stock,
      stock_available: only.stock_available,
      images: only.images?.length ? only.images : p.images,
    });
  }

  const options: StoreOption[] = [...(p.options ?? [])].sort(byPosition).map((option) => ({
    id: String(option.id),
    name: option.name,
    values: [...(option.values ?? [])].sort(byPosition).map((value) => {
      const imageUrl = value.image_thumb_url || value.image_url;
      return {
        id: String(value.id),
        label: value.value,
        ...(value.hex_color ? { color: value.hex_color } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      };
    }),
  }));
  const storeVariants = variants.map((v) => toStoreVariant(v, options));
  const prices = storeVariants.map((v) => v.price);
  const price = Math.min(...prices);
  const priceMax = Math.max(...prices);
  // Mismo precio y mismo «antes» en todas: la oferta se ve ya en la tarjeta.
  const compareAts = new Set(storeVariants.map((v) => v.compareAtPrice ?? null));
  const sharedCompareAt = price === priceMax && compareAts.size === 1 ? storeVariants[0].compareAtPrice ?? null : null;
  const images = sortedImageUrls(p.images);
  return {
    id: p.id,
    name: p.name,
    description: p.description?.trim() || undefined,
    price,
    ...(priceMax > price ? { priceMax } : {}),
    compareAtPrice: sharedCompareAt,
    ...(sharedCompareAt && storeVariants[0].saleEndsAt ? { saleEndsAt: storeVariants[0].saleEndsAt } : {}),
    category: p.category ? String(p.category.id) : '',
    imageUrls: images.length ? images : storeVariants.find((v) => v.imageUrls.length)?.imageUrls ?? [],
    featured: p.featured === true,
    stock: storeVariants.some((v) => v.stock === null) ? null : storeVariants.reduce((sum, v) => sum + (v.stock ?? 0), 0),
    options,
    variants: storeVariants,
    ...(p.slug ? { slug: p.slug } : {}),
    ...(p.updated_at ? { updatedAt: p.updated_at } : {}),
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

/**
 * Todas las páginas de productos del ERP, hasta MAX_ENTRIES. Se sigue
 * `next_cursor` hasta que venga vacío: en la v2 una página puede traer menos
 * de page_size entradas aunque haya más, porque el ERP la corta al pasar de
 * 500 variantes.
 */
async function loadAllPages<T>(partnerId: number, version: 1 | 2): Promise<T[]> {
  const items: T[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  let complete = false;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await erpGet<{ items?: T[]; next_cursor?: string }>(
      partnerId,
      '/integrations/catalog/products',
      { page_size: 100, cursor },
      version
    );
    items.push(...(res.items ?? []));
    const next = res.next_cursor;
    if (!next) {
      complete = true;
      break;
    }
    if (items.length >= MAX_ENTRIES || seen.has(next)) break;
    seen.add(next);
    cursor = next;
  }
  if (!complete || items.length > MAX_ENTRIES) {
    console.warn(
      `[erp] catálogo del negocio ${partnerId} incompleto: se muestran ${Math.min(items.length, MAX_ENTRIES)} entradas (API v${version})`
    );
  }
  return items.slice(0, MAX_ENTRIES);
}

// Un ERP sin la v2 (antes de su promoción) responde 404: se usa la v1 y se
// vuelve a probar cada 10 minutos. ERP_CATALOG_API_VERSION=1 obliga a la v1.
const V2_RETRY_MS = 10 * 60_000;
let v2MissingUntil = 0;

async function loadProducts(partnerId: number): Promise<StoreProduct[]> {
  const forceV1 = process.env.ERP_CATALOG_API_VERSION?.trim() === '1';
  if (!forceV1 && Date.now() >= v2MissingUntil) {
    try {
      const items = await loadAllPages<ErpProductV2>(partnerId, 2);
      return items.map(toStoreProductV2).filter((p): p is StoreProduct => p !== null);
    } catch (error) {
      if (!(error instanceof ErpError) || error.status !== 404) throw error;
      v2MissingUntil = Date.now() + V2_RETRY_MS;
    }
  }
  const items = await loadAllPages<ErpProduct>(partnerId, 1);
  return items.map(toStoreProduct).filter((p): p is StoreProduct => p !== null);
}

export async function loadErpCatalog(store: TenantConfig): Promise<StoreCatalog> {
  const partnerId = store.erp?.partnerId;
  if (!partnerId) return { products: [], categories: [] };

  const [products, rawCategories] = await Promise.all([
    loadProducts(partnerId),
    erpGet<{ categories?: ErpCategory[] }>(partnerId, '/integrations/catalog/categories'),
  ]);

  const categories = toStoreCategories(
    rawCategories.categories ?? [],
    products,
    store.storefront?.categoryIcons,
    store.storefront?.categoryOrder
  );
  return { products, categories };
}
