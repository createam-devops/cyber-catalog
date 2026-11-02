"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useStorefront } from '../StorefrontRoot';
import { canOptimizeImage, ProductImage } from './StoreProductCard';
import StoreBenefits from './StoreBenefits';
import StorePromo from './StorePromo';
import Countdown from './Countdown';
import { CONTAINER } from './layout';
import VariantPicker, { focusMissingOption, useVariantChoice } from './VariantPicker';
import StickyOrderBar from './StickyOrderBar';
import { variantLineName } from '@/lib/storefront/variants';
import type { CartProduct } from '@/contexts/CartContext';
import { useEdgeFade } from '@/lib/use-edge-fade';
import { formatPrice } from '@/lib/storefront/public-store';
import { productPath, type StoreProduct } from '@/lib/storefront/catalog';

/**
 * Portada «producto estrella»: para tiendas de uno a tres productos, el
 * producto ocupa la portada con su foto, precio, oferta, botón y beneficios,
 * como las páginas de un solo producto que convierten bien.
 */
export default function SpotlightHero({
  product,
  onAddToCart,
  stickyBar = false,
}: {
  product: StoreProduct;
  onAddToCart: (product: CartProduct) => void;
  /** El botón fijo de pedir en el celular (se oculta con el carrito abierto). */
  stickyBar?: boolean;
}) {
  const { theme, preview } = useStorefront();
  const { content, layout } = theme;
  const [active, setActive] = useState(0);
  const thumbsFade = useEdgeFade<HTMLDivElement>();
  const choice = useVariantChoice(product, layout.showStock);
  const images = choice.images;
  const imagesKey = images.join('|');
  useEffect(() => setActive(0), [imagesKey]);
  const soldOut = choice.soldOut;
  const discount = choice.compareAtPrice ? Math.round((1 - choice.price / choice.compareAtPrice) * 100) : 0;

  const handleAdd = () => {
    if (choice.cartLine) onAddToCart(choice.cartLine);
    else if (choice.missing) {
      choice.setPrompted(true);
      focusMissingOption(choice.missing);
    }
  };

  return (
    <section className={`${CONTAINER} pt-32 md:pt-28 pb-6`}>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-sf-card border border-sf-border bg-sf-surface">
            {images.length > 0 ? (
              <Image src={images[active] ?? images[0]} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 45vw" unoptimized={!canOptimizeImage(images[active] ?? images[0])} className="object-cover" priority />
            ) : (
              <ProductImage product={product} sizes="(max-width: 1024px) 100vw, 45vw" />
            )}
            {discount > 0 && (
              <span className="absolute left-4 top-4 rounded-lg bg-sf-primary px-3 py-1.5 text-sm font-black text-sf-on-primary shadow">-{discount}%</span>
            )}
          </div>
          {images.length > 1 && (
            <div ref={thumbsFade.ref} style={thumbsFade.style} className="flex gap-3 overflow-x-auto p-1 scrollbar-hide">
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
          <p className="mb-2 flex items-baseline gap-3" aria-live="polite">
            {choice.fromPrice && <span className="text-base font-bold text-sf-muted">Desde</span>}
            <span className="text-3xl font-black">{formatPrice(choice.price)}</span>
            {choice.compareAtPrice && (
              <span className="text-lg text-sf-muted line-through">
                <span className="sr-only">Antes </span>
                {formatPrice(choice.compareAtPrice)}
              </span>
            )}
          </p>
          {choice.compareAtPrice && choice.saleEndsAt && (
            <p className="mb-4 text-sm font-bold text-sf-primary">
              La oferta termina en <Countdown endsAt={choice.saleEndsAt} />
            </p>
          )}
          {product.description && <p className="mb-6 max-w-xl whitespace-pre-line text-sm leading-relaxed text-sf-text/80 sm:text-base">{product.description}</p>}
          <StorePromo variant="inline" />
          <VariantPicker product={product} choice={choice} showStock={layout.showStock} />
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAdd}
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
      {stickyBar && (
        <StickyOrderBar
          name={choice.variant ? variantLineName(product, choice.variant) : product.name}
          price={choice.price}
          fromPrice={choice.fromPrice}
          label={soldOut ? 'Agotado' : content.addToCart}
          disabled={soldOut}
          onClick={handleAdd}
        />
      )}
    </section>
  );
}
