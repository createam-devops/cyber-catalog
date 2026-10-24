"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useStorefront } from '../StorefrontRoot';
import { canOptimizeImage, ProductImage } from './StoreProductCard';
import StoreBenefits from './StoreBenefits';
import StorePromo from './StorePromo';
import Countdown from './Countdown';
import { formatPrice } from '@/lib/storefront/public-store';
import { productPath, type StoreProduct } from '@/lib/storefront/catalog';

/**
 * Portada «producto estrella»: para tiendas de uno a tres productos, el
 * producto ocupa la portada con su foto, precio, oferta, botón y beneficios,
 * como las páginas de un solo producto que convierten bien.
 */
export default function SpotlightHero({ product, onAddToCart }: { product: StoreProduct; onAddToCart: (product: StoreProduct) => void }) {
  const { theme, preview } = useStorefront();
  const { content, layout } = theme;
  const [active, setActive] = useState(0);
  const images = product.imageUrls;
  const soldOut = layout.showStock && product.stock !== null && product.stock <= 0;
  const discount = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  return (
    <section className="container mx-auto max-w-7xl px-4 pt-32 md:pt-28 pb-6">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-sf-card border border-sf-border bg-sf-surface">
            {images.length > 0 ? (
              <Image src={images[active]} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 45vw" unoptimized={!canOptimizeImage(images[active])} className="object-cover" priority />
            ) : (
              <ProductImage product={product} sizes="(max-width: 1024px) 100vw, 45vw" />
            )}
            {discount > 0 && (
              <span className="absolute left-4 top-4 rounded-lg bg-sf-primary px-3 py-1.5 text-sm font-black text-sf-on-primary shadow">-{discount}%</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto p-1 scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActive(idx)}
                  aria-label={`Ver foto ${idx + 1}`}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${active === idx ? 'border-sf-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <Image src={img} alt="" fill sizes="80px" unoptimized={!canOptimizeImage(img)} className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          {content.heroEyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-sf-primary">{content.heroEyebrow}</p>}
          <h1 className="mb-4 text-3xl leading-tight sm:text-4xl lg:text-5xl">{product.name}</h1>
          <p className="mb-2 flex items-baseline gap-3">
            <span className="text-3xl font-black">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-lg text-sf-muted line-through">
                <span className="sr-only">Antes </span>
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </p>
          {product.compareAtPrice && product.saleEndsAt && (
            <p className="mb-4 text-sm font-bold text-sf-primary">
              La oferta termina en <Countdown endsAt={product.saleEndsAt} />
            </p>
          )}
          {product.description && <p className="mb-6 max-w-xl whitespace-pre-line text-sm leading-relaxed text-sf-text/80 sm:text-base">{product.description}</p>}
          <StorePromo variant="inline" />
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={soldOut}
              className="flex flex-1 items-center justify-center gap-3 rounded-sf-btn bg-sf-primary py-4 text-base font-bold text-sf-on-primary shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingBag size={20} strokeWidth={2.5} aria-hidden="true" />
              {soldOut ? 'Agotado' : content.addToCart}
            </button>
            {/* En la vista previa del editor la ficha no existe: no se enlaza ni se precarga. */}
            {preview ? (
              <span className="flex items-center justify-center rounded-sf-btn border border-sf-border px-6 py-4 text-sm font-bold">Ver detalles</span>
            ) : (
              <Link href={productPath(product)} className="flex items-center justify-center rounded-sf-btn border border-sf-border px-6 py-4 text-sm font-bold hover:border-sf-primary hover:text-sf-primary">
                Ver detalles
              </Link>
            )}
          </div>
          <StoreBenefits compact />
        </div>
      </div>
    </section>
  );
}
