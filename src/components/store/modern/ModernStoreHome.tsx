"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ModernNavbar from './ModernNavbar';
import ModernHero, { heroToneFor } from './ModernHero';
import ModernCategories from './ModernCategories';
import ModernProductGrid from './ModernProductGrid';
import ModernCart from './ModernCart';
import ModernFooter from './ModernFooter';
import { useStorefront } from '../StorefrontRoot';
import { useCart } from '@/contexts/CartContext';
import { filterProducts, type CatalogPage, type StoreProduct } from '@/lib/storefront/catalog';

interface ModernStoreHomeProps {
  /** Primeros productos, ya renderizados en el servidor. */
  initialProducts: StoreProduct[];
  /** Total de productos de la tienda. Si coincide con `initialProducts`, todo se filtra aquí. */
  total: number;
  /** Dominio de la tienda; la API lo necesita cuando se prueba en localhost. */
  domain: string;
  initialQuery?: string;
}

const PAGE_SIZE = 24;

export default function ModernStoreHome({ initialProducts, total, domain, initialQuery = '' }: ModernStoreHomeProps) {
  const { store, theme, preview } = useStorefront();
  const { cart, addToCart, removeFromCart, updateQuantity, getCartCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Catálogo completo en memoria: filtros instantáneos, sin pedir nada al servidor.
  const complete = initialProducts.length >= total;

  // Catálogo grande: páginas que llegan de /api/storefront/products.
  const [remote, setRemote] = useState<{ items: StoreProduct[]; total: number; nextOffset: number | null }>({
    items: initialProducts,
    total,
    nextOffset: initialProducts.length < total ? initialProducts.length : null,
  });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestId = useRef(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isFirstFilter = useRef(true);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchPage = useCallback(
    async (offset: number): Promise<CatalogPage> => {
      const params = new URLSearchParams({ offset: String(offset), limit: String(PAGE_SIZE), _domain: domain });
      if (activeCategory) params.set('category', activeCategory);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      const res = await fetch(`/api/storefront/products?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    [activeCategory, searchQuery, domain]
  );

  // Catálogo grande: al cambiar categoría o búsqueda se pide la primera página.
  useEffect(() => {
    if (complete) return;
    if (isFirstFilter.current) {
      isFirstFilter.current = false;
      if (!activeCategory && !searchQuery.trim()) return;
    }
    const id = ++requestId.current;
    setLoading(true);
    const timer = setTimeout(() => {
      fetchPage(0)
        .then((page) => {
          if (id === requestId.current) setRemote({ items: page.items, total: page.total, nextOffset: page.nextOffset });
        })
        .catch((error) => console.error('[storefront] No se pudo filtrar el catálogo:', error))
        .finally(() => {
          if (id === requestId.current) setLoading(false);
        });
    }, searchQuery ? 250 : 0);
    return () => clearTimeout(timer);
  }, [complete, fetchPage, activeCategory, searchQuery]);

  // Catálogo grande: scroll infinito.
  useEffect(() => {
    if (complete || remote.nextOffset === null || loading || loadingMore || !loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || remote.nextOffset === null) return;
        const id = requestId.current;
        setLoadingMore(true);
        fetchPage(remote.nextOffset)
          .then((page) => {
            if (id !== requestId.current) return;
            setRemote((prev) => ({
              items: [...prev.items, ...page.items.filter((p) => !prev.items.some((q) => q.id === p.id))],
              total: page.total,
              nextOffset: page.nextOffset,
            }));
          })
          .catch((error) => console.error('[storefront] No se pudieron cargar más productos:', error))
          .finally(() => setLoadingMore(false));
      },
      { rootMargin: '400px 0px' }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [complete, remote.nextOffset, loading, loadingMore, fetchPage]);

  const products = useMemo(
    () => (complete ? filterProducts(initialProducts, activeCategory, searchQuery) : remote.items),
    [complete, initialProducts, activeCategory, searchQuery, remote.items]
  );

  const scrollToProducts = () => {
    if (preview) return;
    setTimeout(() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const handleAddProduct = (product: StoreProduct) => {
    addToCart(product, 1);
    setIsCartOpen(true);
  };

  return (
    <>
      <ModernNavbar
        cartCount={getCartCount()}
        onOpenCart={() => setIsCartOpen(true)}
        isScrolled={isScrolled}
        heroTone={heroToneFor(store, theme)}
        onGoHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          if (value.trim()) scrollToProducts();
        }}
      />

      {theme.layout.hero === 'none' && <div className="h-32 md:h-28" />}
      <ModernHero />

      <ModernCategories
        activeCategory={activeCategory}
        onCategoryChange={(category) => {
          setActiveCategory(category);
          setSearchQuery('');
          scrollToProducts();
        }}
      />

      <ModernProductGrid
        products={products}
        loading={loading}
        loadingMore={loadingMore}
        activeCategory={activeCategory}
        searchQuery={searchQuery}
        onAddToCart={handleAddProduct}
      />

      {!complete && remote.nextOffset !== null && <div ref={loadMoreRef} className="h-20" />}

      <ModernCart
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateQuantity}
      />

      <ModernFooter />
    </>
  );
}
