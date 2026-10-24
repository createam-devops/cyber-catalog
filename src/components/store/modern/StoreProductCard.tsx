"use client";

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useStorefront } from '../StorefrontRoot';
import { getStorefrontIcon } from '@/lib/storefront/icons';
import { formatPrice } from '@/lib/storefront/public-store';
import { productPath, type StoreProduct } from '@/lib/storefront/catalog';
import type { CardStyle } from '@/lib/storefront/presets';

// Debe coincidir con images.remotePatterns de next.config.mjs: una URL fuera de
// esa lista hace fallar a next/image, así que se muestra sin optimizar.
const OPTIMIZABLE: Array<(url: URL) => boolean> = [
  (url) => url.hostname === 'firebasestorage.googleapis.com',
  (url) => url.hostname.endsWith('.cloudinary.com'),
  (url) => /^api(-dev)?\.createam\.cloud$/.test(url.hostname) && url.pathname.startsWith('/media/'),
];

/** next/image solo optimiza los orígenes permitidos en next.config; el resto se muestra tal cual. */
export function canOptimizeImage(src: string): boolean {
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && OPTIMIZABLE.some((allowed) => allowed(url));
  } catch {
    return false;
  }
}

const FRAME: Record<CardStyle, string> = {
  soft: 'rounded-sf-card bg-sf-surface shadow-card group-hover:shadow-card-hover',
  flat: 'rounded-sf-card bg-sf-surface',
  outlined: 'rounded-sf-card border border-sf-border',
};

export function ProductImage({ product, sizes, priority = false }: { product: StoreProduct; sizes: string; priority?: boolean }) {
  const { categories } = useStorefront();
  const src = product.imageUrls[0];
  if (!src) {
    const Icon = getStorefrontIcon(categories.find((c) => c.id === product.category)?.icon);
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-sf-primary/10 text-sf-primary">
        <Icon size={40} strokeWidth={1.5} aria-hidden="true" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={product.name}
      fill
      sizes={sizes}
      unoptimized={!canOptimizeImage(src)}
      priority={priority}
      className="object-cover transition-transform duration-700 group-hover:scale-105"
    />
  );
}

/** Enlace a la ficha del producto. En la vista previa del panel nada navega. */
function ProductLink({
  preview,
  href,
  className,
  hidden = false,
  children,
}: {
  preview: boolean;
  href: string;
  className: string;
  hidden?: boolean;
  children: ReactNode;
}) {
  if (preview) return <div className={className}>{children}</div>;
  return (
    <Link href={href} prefetch={false} className={className} tabIndex={hidden ? -1 : undefined} aria-hidden={hidden || undefined}>
      {children}
    </Link>
  );
}

interface StoreProductCardProps {
  product: StoreProduct;
  onAddToCart?: (product: StoreProduct) => void;
  sizes?: string;
  priority?: boolean;
}

export default function StoreProductCard({
  product,
  onAddToCart,
  sizes = '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
  priority = false,
}: StoreProductCardProps) {
  const { theme, categories, preview } = useStorefront();
  const categoryLabel = categories.find((c) => c.id === product.category)?.label;
  const soldOut = theme.layout.showStock && product.stock !== null && product.stock <= 0;
  const fewLeft = theme.layout.showStock && product.stock !== null && product.stock > 0 && product.stock <= 5;

  const href = productPath(product);

  return (
    <div className="group relative">
      <div className={`relative aspect-square overflow-hidden mb-3 transition-all duration-300 ${FRAME[theme.layout.cardStyle]}`}>
        <ProductLink preview={preview} href={href} className="absolute inset-0" hidden>
          <ProductImage product={product} sizes={sizes} priority={priority} />
        </ProductLink>
        {(product.featured || soldOut || fewLeft) && (
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1 pointer-events-none">
            {product.featured && theme.content.featuredBadge && (
              <span className="bg-black/75 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                {theme.content.featuredBadge}
              </span>
            )}
            {soldOut && <span className="bg-white/90 text-gray-900 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Agotado</span>}
            {fewLeft && <span className="bg-white/90 text-gray-900 px-2 py-0.5 rounded text-[10px] font-bold">Quedan {product.stock}</span>}
          </div>
        )}
        {onAddToCart && !soldOut && (
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            aria-label={`${theme.content.addToCart}: ${product.name}`}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-sf-bg text-sf-primary shadow-lg flex items-center justify-center hover:bg-sf-primary hover:text-sf-on-primary active:scale-95 transition-all z-20"
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        )}
      </div>
      <ProductLink preview={preview} href={href} className="block">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-sf-body text-sm font-medium leading-snug line-clamp-2 flex-1 group-hover:text-sf-primary transition-colors">
            {product.name}
          </h3>
          <span className="flex flex-col items-end">
            <span className="font-bold text-sm whitespace-nowrap">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-[11px] text-sf-muted line-through whitespace-nowrap">
                <span className="sr-only">Antes </span>
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </span>
        </div>
        {categoryLabel && <p className="text-[11px] text-sf-muted uppercase tracking-wider mt-1">{categoryLabel}</p>}
      </ProductLink>
    </div>
  );
}
