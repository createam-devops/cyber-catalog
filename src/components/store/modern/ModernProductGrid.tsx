"use client";

import { useStorefront } from '../StorefrontRoot';
import ProductSkeleton from './ProductSkeleton';
import StoreProductCard from './StoreProductCard';
import { CONTAINER, SectionTitle } from './layout';
import type { StoreProduct } from '@/lib/storefront/catalog';

interface ModernProductGridProps {
  products: StoreProduct[];
  loading?: boolean;
  loadingMore?: boolean;
  activeCategory?: string | null;
  searchQuery?: string;
  onAddToCart: (product: StoreProduct) => void;
  /** Título fijo (la página de una categoría ya lleva su nombre en el H1). */
  heading?: string;
}

export default function ModernProductGrid({
  products,
  loading = false,
  loadingMore = false,
  activeCategory = null,
  searchQuery = '',
  onAddToCart,
  heading,
}: ModernProductGridProps) {
  const { theme, categories } = useStorefront();
  const query = searchQuery.trim();
  const categoryLabel = activeCategory ? categories.find((c) => c.id === activeCategory)?.label ?? activeCategory : null;

  const title = query ? `Resultados para “${query}”` : heading ?? categoryLabel ?? theme.content.productsTitle;
  const subtitle = query || categoryLabel || heading ? null : theme.content.productsSubtitle;
  const columns = theme.layout.gridColumns === 4 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-3';

  return (
    <section className={`${CONTAINER} scroll-mt-32 pt-10 md:scroll-mt-24`} id="productos">
      <SectionTitle title={title} subtitle={subtitle} />

      {!loading && products.length === 0 ? (
        <p className="py-16 text-center text-sf-muted">
          {query ? `No encontramos productos para “${query}”.` : 'Pronto verás aquí nuestros productos.'}
        </p>
      ) : (
        <div className={`grid ${columns} gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 items-start`}>
          {loading && products.length === 0
            ? Array.from({ length: 8 }).map((_, idx) => <ProductSkeleton key={`skeleton-${idx}`} />)
            : products.map((product, index) => (
                <StoreProductCard key={product.id} product={product} onAddToCart={onAddToCart} priority={index < 2} />
              ))}
          {loadingMore && Array.from({ length: 4 }).map((_, idx) => <ProductSkeleton key={`skeleton-more-${idx}`} />)}
        </div>
      )}
    </section>
  );
}
