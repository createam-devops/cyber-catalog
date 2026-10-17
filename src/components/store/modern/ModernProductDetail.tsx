"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Minus, ShoppingBag, Share2, Check, Truck, ArrowLeft, XCircle } from 'lucide-react';
import ModernNavbar from './ModernNavbar';
import ModernFooter from './ModernFooter';
import ModernCart from './ModernCart';
import StoreProductCard, { ProductImage, canOptimizeImage } from './StoreProductCard';
import { useStorefront } from '../StorefrontRoot';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/storefront/public-store';
import type { StoreProduct } from '@/lib/storefront/catalog';

interface ModernProductDetailProps {
  product: StoreProduct;
  relatedProducts: StoreProduct[];
}

export default function ModernProductDetail({ product, relatedProducts }: ModernProductDetailProps) {
  const router = useRouter();
  const { store, theme, categories } = useStorefront();
  const { cart, addToCart, removeFromCart, updateQuantity, getCartCount } = useCart();
  const [activeImage, setActiveImage] = useState(0);
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
  const categoryLabel = categories.find((c) => c.id === product.category)?.label;
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

      <main className="pt-32 md:pt-28 pb-12 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sf-muted hover:text-sf-primary mb-8 transition-colors group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">Volver a la tienda</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-14 items-start">
          {/* Galería */}
          <div className="flex flex-col-reverse lg:flex-row gap-4">
            {images.length > 1 && (
              <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto p-1 lg:w-24 shrink-0 scrollbar-hide">
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

            <p className="text-3xl font-black mb-6">{formatPrice(product.price)}</p>

            {product.description && (
              <p className="text-sf-text/80 text-sm sm:text-base leading-relaxed mb-8 max-w-xl whitespace-pre-line">{product.description}</p>
            )}

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

            {(tracksStock || content.deliveryNote) && (
              <div className="flex flex-wrap gap-3 pt-6 border-t border-sf-border">
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
                {content.deliveryNote && (
                  <span className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-sf-surface">
                    <Truck size={16} />
                    {content.deliveryNote}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="bg-sf-surface rounded-sf-hero p-6 sm:p-10">
            <h2 className="text-2xl md:text-3xl mb-8">{content.relatedTitle}</h2>
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
    </>
  );
}
