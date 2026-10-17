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
    .replace(/[̀-ͯ]/g, '')
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
