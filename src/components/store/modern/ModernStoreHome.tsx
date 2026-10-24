"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ModernNavbar from './ModernNavbar';
import ModernHero, { heroToneFor } from './ModernHero';
import ModernCategories from './ModernCategories';
import ModernProductGrid from './ModernProductGrid';
import ModernCart from './ModernCart';
import ModernFooter from './ModernFooter';
import StoreBenefits from './StoreBenefits';
import StoreFaq from './StoreFaq';
import StorePromo from './StorePromo';
import SpotlightHero from './SpotlightHero';
import HowToOrder from './HowToOrder';
import StickyOrderBar from './StickyOrderBar';
import { CONTAINER } from './layout';
import Link from 'next/link';
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
  /** Página de una categoría (/categoria/<slug>): su título reemplaza la portada. */
  category?: { id: string; label: string };
}

const PAGE_SIZE = 24;

export default function ModernStoreHome({ initialProducts, total, domain, initialQuery = '', category }: ModernStoreHomeProps) {
  const { store, theme, preview } = useStorefront();
  const { cart, addToCart, removeFromCart, updateQuantity, getCartCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(category?.id ?? null);
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

  // Portada «producto estrella»: el elegido, o el primero destacado, o el primero.
  const star =
    theme.layout.home === 'spotlight' && !category && !searchQuery.trim()
      ? initialProducts.find((p) => p.id === theme.layout.spotlightProductId) ?? initialProducts.find((p) => p.featured) ?? initialProducts[0]
      : undefined;
  const starSoldOut = Boolean(star && theme.layout.showStock && star.stock !== null && star.stock <= 0);
  const plain = Boolean(category || star);

  return (
    <>
      <ModernNavbar
        cartCount={getCartCount()}
        onOpenCart={() => setIsCartOpen(true)}
        // Sin banner (categoría o producto estrella) la barra va con fondo desde arriba, como en la ficha.
        isScrolled={plain ? true : isScrolled}
        heroTone={plain ? 'none' : heroToneFor(store, theme)}
        onGoHome={() => (category ? window.location.assign('/') : window.scrollTo({ top: 0, behavior: 'smooth' }))}
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          if (value.trim()) scrollToProducts();
        }}
      />

      {category ? (
        <header className={`${CONTAINER} pt-36 md:pt-32`}>
          <nav aria-label="Ruta" className="mb-3 text-sm text-sf-muted">
            <Link href="/" className="hover:text-sf-primary">
              {store.name}
            </Link>
            <span aria-hidden="true"> › </span>
            <span aria-current="page">{category.label}</span>
          </nav>
          <h1 className="text-3xl md:text-5xl leading-tight">{category.label}</h1>
          <p className="mt-3 max-w-2xl text-sf-muted">
            {`${total} ${total === 1 ? 'producto' : 'productos'} de ${category.label.toLowerCase()} en ${store.name}. Elige, agrégalos al carrito y haz tu pedido por WhatsApp.`}
          </p>
        </header>
      ) : star ? (
        <SpotlightHero product={star} onAddToCart={handleAddProduct} />
      ) : (
        <>
          {theme.layout.hero === 'none' && <div className="h-32 md:h-28" />}
          <ModernHero />
        </>
      )}

      {!star && <StorePromo />}
      {!star && <StoreBenefits />}
      {star && <HowToOrder />}

      {!star && (
        <ModernCategories
          activeCategory={activeCategory}
          onCategoryChange={(category) => {
            setActiveCategory(category);
            setSearchQuery('');
            scrollToProducts();
          }}
        />
      )}

      {(!star || products.length > 1) && (
        <ModernProductGrid
          products={star ? products.filter((p) => p.id !== star.id) : products}
          loading={loading}
          loadingMore={loadingMore}
          activeCategory={activeCategory}
          searchQuery={searchQuery}
          onAddToCart={handleAddProduct}
          heading={category ? 'Productos' : star ? theme.content.relatedTitle : undefined}
        />
      )}

      {!complete && remote.nextOffset !== null && <div ref={loadMoreRef} className="h-20" />}

      <ModernCart
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateQuantity}
      />

      {!category && <StoreFaq />}

      <ModernFooter />

      {star && !isCartOpen && (
        <StickyOrderBar
          name={star.name}
          price={star.price}
          label={starSoldOut ? 'Agotado' : theme.content.addToCart}
          disabled={starSoldOut}
          onClick={() => handleAddProduct(star)}
        />
      )}
    </>
  );
}
