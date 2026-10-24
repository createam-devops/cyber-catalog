// Tipos y consultas del catálogo de una vitrina. Sin acceso a datos: sirve en
// el servidor (páginas y API) y en el navegador (filtros locales).

import type { StoreCategory } from './public-store';

/** Producto tal como lo muestra la vitrina. Plano y serializable. */
export interface StoreProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  /** Precio "antes" (tachado). Solo si es mayor que `price`. */
  compareAtPrice?: number | null;
  category: string;
  imageUrls: string[];
  featured: boolean;
  /** null = la tienda no controla stock de este producto. */
  stock: number | null;
  /** Dirección del producto en el ERP (la usan las tiendas con web propia). */
  slug?: string;
  /** Última modificación (ISO), si la fuente la da. */
  updatedAt?: string;
  /** Fin de la oferta (ISO), si el precio «antes» tiene fecha. Pasada la fecha, ya no hay oferta. */
  saleEndsAt?: string;
  /** Promedio de las opiniones aprobadas (lo agrega la página; no viene de la fuente). */
  rating?: { average: number; count: number };
}

export interface StoreCatalog {
  products: StoreProduct[];
  /** Solo las categorías que tienen al menos un producto, en el orden de la tienda. */
  categories: StoreCategory[];
}

export interface CatalogQuery {
  category?: string | null;
  q?: string | null;
  offset?: number;
  limit?: number;
}

export interface CatalogPage {
  items: StoreProduct[];
  total: number;
  nextOffset: number | null;
}

export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

export function filterProducts(products: StoreProduct[], category?: string | null, q?: string | null): StoreProduct[] {
  const needle = q ? normalizeSearch(q) : '';
  return products.filter((product) => {
    if (category && product.category !== category) return false;
    if (!needle) return true;
    return normalizeSearch(`${product.name} ${product.description ?? ''} ${product.category}`).includes(needle);
  });
}

export function queryCatalog(catalog: StoreCatalog, query: CatalogQuery): CatalogPage {
  const matches = filterProducts(catalog.products, query.category, query.q);
  const offset = Math.max(0, query.offset ?? 0);
  const limit = Math.min(Math.max(1, query.limit ?? 24), 100);
  const items = matches.slice(offset, offset + limit);
  const next = offset + items.length;
  return { items, total: matches.length, nextOffset: next < matches.length ? next : null };
}

/** Hasta este tamaño la vitrina manda todo el catálogo de una vez y filtra en el navegador. */
export const FULL_CATALOG_THRESHOLD = 60;

// --- Direcciones públicas (las usan las páginas, el sitemap, los datos para
// Google y las guías para IAs). Con slug, la ficha vive en /product/<slug>;
// sin slug (tiendas viejas de Firebase), en /product/<id>.

/** Slug de una categoría: minúsculas, sin tildes, espacios a guiones. */
export function categorySlug(label: string): string {
  return label
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Le pone a cada categoría un slug único (si dos se llaman igual, la segunda lleva su id). */
export function withCategorySlugs(categories: StoreCategory[]): StoreCategory[] {
  const used = new Set<string>();
  return categories.map((category) => {
    let slug = category.slug || categorySlug(category.label) || categorySlug(category.id) || `categoria-${category.id}`;
    if (used.has(slug)) slug = `${slug}-${categorySlug(category.id) || used.size}`;
    used.add(slug);
    return { ...category, slug };
  });
}

/**
 * La dirección de la ficha: el slug del ERP o, si no lo tiene, el nombre más su
 * número («kit-completo-para-punto-de-venta-648»). El número al final hace que
 * la dirección se siga encontrando aunque cambie el nombre o llegue el slug del ERP.
 */
export function productSlug(product: Pick<StoreProduct, 'id' | 'slug' | 'name'>): string {
  if (product.slug) return product.slug;
  const base = categorySlug(product.name || '').slice(0, 60).replace(/-+$/, '');
  return base ? `${base}-${product.id}` : product.id;
}

export function productPath(product: Pick<StoreProduct, 'id' | 'slug' | 'name'>): string {
  return `/product/${encodeURIComponent(productSlug(product))}`;
}

/**
 * La ficha que corresponde a una dirección: su slug, su número o cualquier
 * dirección vieja que termine en «-<número>». La página redirige (308) a la
 * dirección vigente si no coincide.
 */
export function findProductByParam<T extends Pick<StoreProduct, 'id' | 'slug' | 'name'>>(products: T[], param: string): T | null {
  const trailingId = param.match(/-([A-Za-z0-9]+)$/)?.[1];
  return (
    products.find((p) => productSlug(p) === param) ??
    products.find((p) => p.id === param) ??
    products.find((p) => p.slug === param) ??
    (trailingId ? products.find((p) => p.id === trailingId) : undefined) ??
    null
  );
}

export function categoryPath(category: Pick<StoreCategory, 'id' | 'label' | 'slug'>): string {
  return `/categoria/${encodeURIComponent(category.slug || categorySlug(category.label) || category.id)}`;
}
