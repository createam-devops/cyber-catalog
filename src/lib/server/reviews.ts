// Opiniones aprobadas en la vitrina: el promedio en las tarjetas y la ficha, y
// las opiniones de cada ficha. Solo tiendas del ERP (base del catálogo).

import type { StoreProduct } from '@/lib/storefront/catalog';
import type { PublicReview } from '@/lib/storefront/reviews';
import { approvedReviews, isLocalStore, reviewSummaries } from './store-db';

/** Los productos con su promedio de estrellas (solo los que tienen opiniones aprobadas). */
export function withRatings(storeId: string, products: StoreProduct[]): StoreProduct[] {
  if (!isLocalStore(storeId)) return products;
  const summaries = reviewSummaries(storeId);
  if (!summaries.size) return products;
  return products.map((p) => (summaries.has(p.id) ? { ...p, rating: summaries.get(p.id) } : p));
}

/** Las opiniones aprobadas de un producto, listas para la página (sin datos internos). */
export function publicReviews(storeId: string, productId: string): PublicReview[] {
  if (!isLocalStore(storeId)) return [];
  return approvedReviews(storeId, productId, 20).map((r) => ({ id: r.id, rating: r.rating, name: r.name, text: r.text, date: r.createdAt.slice(0, 10) }));
}
