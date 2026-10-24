"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Minus, ShoppingBag, Share2, Check, XCircle } from 'lucide-react';
import ModernNavbar from './ModernNavbar';
import ModernFooter from './ModernFooter';
import ModernCart from './ModernCart';
import StoreBenefits from './StoreBenefits';
import StorePromo from './StorePromo';
import StickyOrderBar from './StickyOrderBar';
import Countdown from './Countdown';
import { CONTAINER, SectionTitle } from './layout';
import { useEdgeFade } from '@/lib/use-edge-fade';
import ProductReviews from './ProductReviews';
import Stars from './Stars';
import { formatRating, type PublicReview } from '@/lib/storefront/reviews';
import StoreProductCard, { ProductImage, canOptimizeImage } from './StoreProductCard';
import { useStorefront } from '../StorefrontRoot';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/storefront/public-store';
import { categoryPath, type StoreProduct } from '@/lib/storefront/catalog';

interface ModernProductDetailProps {
  product: StoreProduct;
  relatedProducts: StoreProduct[];
  /** Opiniones aprobadas por la tienda. */
  reviews?: PublicReview[];
}

export default function ModernProductDetail({ product, relatedProducts, reviews = [] }: ModernProductDetailProps) {
  const router = useRouter();
  const { store, theme, categories } = useStorefront();
  const { cart, addToCart, removeFromCart, updateQuantity, getCartCount } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const thumbsFade = useEdgeFade<HTMLDivElement>();
  const [quantity, setQuantity] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { content, layout } = theme;

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: store.id, event: 'view' }),
    }).catch(() => {});
  }, [product.id, store.id]);

  const images = product.imageUrls;
  const category = categories.find((c) => c.id === product.category);
  const categoryLabel = category?.label;
  const tracksStock = layout.showStock && product.stock !== null;
  const soldOut = tracksStock && (product.stock ?? 0) <= 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsCartOpen(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: `${product.name} - ${store.name}`, url });
      } catch {
        // El usuario canceló.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  return (
    <>
      <ModernNavbar cartCount={getCartCount()} onOpenCart={() => setIsCartOpen(true)} isScrolled heroTone="none" onGoHome={() => router.push('/')} />

      {/* En el celular el botón de pedir va fijo abajo: espacio para que no tape el pie. */}
      <main className={`${CONTAINER} pt-32 md:pt-28 pb-28 md:pb-12`}>
        <nav aria-label="Ruta" className="mb-8 text-sm text-sf-muted">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="font-bold hover:text-sf-primary">
                {store.name}
              </Link>
            </li>
            {category && (
              <li className="flex items-center gap-1">
                <span aria-hidden="true">›</span>
                <Link href={categoryPath(category)} className="font-bold hover:text-sf-primary">
                  {category.label}
                </Link>
              </li>
            )}
            <li className="flex min-w-0 items-center gap-1">
              <span aria-hidden="true">›</span>
              <span aria-current="page" className="truncate">
                {product.name}
              </span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-14 items-start">
          {/* Galería */}
          <div className="flex flex-col-reverse lg:flex-row gap-4">
            {images.length > 1 && (
              <div ref={thumbsFade.ref} style={thumbsFade.style} className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto p-1 lg:w-24 shrink-0 scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    aria-label={`Ver foto ${idx + 1}`}
                    className={`relative w-20 h-20 lg:w-full lg:aspect-square rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      activeImage === idx ? 'border-sf-primary' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt="" fill sizes="96px" unoptimized={!canOptimizeImage(img)} className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="relative aspect-square flex-1 rounded-sf-card overflow-hidden bg-sf-surface border border-sf-border">
              {images.length > 0 ? (
                <Image
                  src={images[activeImage]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  unoptimized={!canOptimizeImage(images[activeImage])}
                  className="object-cover"
                  priority
                />
              ) : (
                <ProductImage product={product} sizes="(max-width: 1024px) 100vw, 45vw" />
              )}
              {product.featured && content.featuredBadge && (
                <span className="absolute top-4 left-4 bg-sf-primary text-sf-on-primary px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow z-10">
                  {content.featuredBadge}
                </span>
              )}
              <button
                type="button"
                onClick={handleShare}
                aria-label="Compartir"
                className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/90 backdrop-blur-sm text-gray-700 hover:text-black transition-all shadow z-10"
              >
                <Share2 size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Información */}
          <div className="flex flex-col">
            {categoryLabel && (
              <span className="self-start font-bold uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-lg bg-sf-primary/10 text-sf-primary mb-4">
                {categoryLabel}
              </span>
            )}

            <h1 className="text-2xl sm:text-3xl lg:text-4xl leading-tight mb-4">{product.name}</h1>
            {product.rating && product.rating.count > 0 && (
              <a href="#opiniones" className="-mt-2 mb-4 flex items-center gap-2 self-start text-sm hover:text-sf-primary">
                <Stars value={product.rating.average} size={16} />
                <span className="font-bold">{formatRating(product.rating.average)}</span>
                <span className="text-sf-muted">
                  ({product.rating.count} {product.rating.count === 1 ? 'opinión' : 'opiniones'})
                </span>
              </a>
            )}

            <p className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-black">{formatPrice(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-lg text-sf-muted line-through">
                  <span className="sr-only">Antes </span>
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </p>
            {product.compareAtPrice && product.saleEndsAt && (
              <p className="-mt-3 mb-6 text-sm font-bold text-sf-primary">
                La oferta termina en <Countdown endsAt={product.saleEndsAt} />
              </p>
            )}

            {product.description && (
              <p className="text-sf-text/80 text-sm sm:text-base leading-relaxed mb-8 max-w-xl whitespace-pre-line">{product.description}</p>
            )}

            <StorePromo variant="inline" />

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex items-center justify-between bg-sf-bg rounded-sf-btn px-4 py-3 sm:w-36 border border-sf-border">
                <button
                  type="button"
                  aria-label="Quitar uno"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1.5 rounded-lg disabled:opacity-30"
                  disabled={quantity <= 1}
                >
                  <Minus size={16} strokeWidth={3} />
                </button>
                <span className="font-black text-lg w-8 text-center">{quantity}</span>
                <button type="button" aria-label="Agregar uno" onClick={() => setQuantity(quantity + 1)} className="p-1.5 rounded-lg">
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={soldOut}
                className="flex-1 bg-sf-primary text-sf-on-primary rounded-sf-btn py-4 font-bold text-sm hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag size={20} strokeWidth={2.5} />
                {soldOut ? 'Agotado' : content.addToCart}
              </button>
            </div>

            {tracksStock && (
              <div className="flex flex-wrap gap-3 pt-6 border-t border-sf-border mb-6">
                {tracksStock && (
                  <span
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold ${
                      soldOut ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                    }`}
                  >
                    {soldOut ? <XCircle size={16} /> : <Check size={16} strokeWidth={3} />}
                    {soldOut ? 'Sin stock por ahora' : `${product.stock} disponibles`}
                  </span>
                )}
              </div>
            )}
            <StoreBenefits compact />
          </div>
        </div>

        <ProductReviews product={product} reviews={reviews} />

        {relatedProducts.length > 0 && (
          <section className="bg-sf-surface rounded-sf-hero p-6 sm:p-10">
            <SectionTitle title={content.relatedTitle} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <StoreProductCard key={p.id} product={p} sizes="(max-width: 768px) 50vw, 25vw" />
              ))}
            </div>
          </section>
        )}
      </main>

      <ModernCart
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateQuantity}
      />

      <ModernFooter />

      {!isCartOpen && (
        <StickyOrderBar name={product.name} price={product.price} label={soldOut ? 'Agotado' : content.addToCart} disabled={soldOut} onClick={handleAddToCart} />
      )}
    </>
  );
}
