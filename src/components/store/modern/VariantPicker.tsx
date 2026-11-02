"use client";

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { CartProduct } from '@/contexts/CartContext';
import type { StoreOption, StoreProduct, StoreVariant } from '@/lib/storefront/catalog';
import {
  findVariant,
  hasVariants,
  initialSelection,
  isSoldOut,
  matchingVariants,
  missingOption,
  optionStyle,
  priceRange,
  selectValue,
  selectionImages,
  usedValues,
  valueState,
  variantLineName,
  type Selection,
} from '@/lib/storefront/variants';
import { canOptimizeImage } from './StoreProductCard';

/** Lo que muestra la ficha según lo elegido. Un producto sin variantes se muestra tal cual. */
export interface VariantChoice {
  withVariants: boolean;
  selection: Selection;
  choose: (optionId: string, valueId: string) => void;
  variant: StoreVariant | null;
  price: number;
  /** «Desde»: aún falta elegir y los precios difieren. */
  fromPrice: boolean;
  compareAtPrice: number | null;
  saleEndsAt?: string;
  stock: number | null;
  images: string[];
  soldOut: boolean;
  /** El primer eje que falta elegir. */
  missing: StoreOption | null;
  /** La línea del pedido; null si falta elegir o está agotado. */
  cartLine: CartProduct | null;
  /** Se intentó pedir sin elegir todo: el eje que falta se marca. */
  prompted: boolean;
  setPrompted: (value: boolean) => void;
}

const sumStock = (variants: StoreVariant[]): number | null =>
  variants.some((v) => v.stock === null) ? null : variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);

/**
 * Estado de la elección de variante de un producto. Con `syncUrl`, la variante
 * elegida queda en la dirección (?variant=) para compartirla tal cual.
 */
export function useVariantChoice(product: StoreProduct, showStock: boolean, initialVariantId?: string | null, syncUrl = false): VariantChoice {
  const withVariants = hasVariants(product);
  const [selection, setSelection] = useState<Selection>(() => (withVariants ? initialSelection(product, initialVariantId) : {}));
  const [prompted, setPrompted] = useState(false);

  // Otro producto (navegación entre fichas): se vuelve a empezar.
  useEffect(() => {
    setSelection(withVariants ? initialSelection(product, initialVariantId) : {});
    setPrompted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const variant = withVariants ? findVariant(product, selection) : null;

  useEffect(() => {
    if (!syncUrl || !withVariants) return;
    const url = new URL(window.location.href);
    if (variant) url.searchParams.set('variant', variant.id);
    else url.searchParams.delete('variant');
    window.history.replaceState(window.history.state, '', url);
  }, [syncUrl, withVariants, variant]);

  const choose = (optionId: string, valueId: string) => {
    setSelection((current) => selectValue(product, current, optionId, valueId));
  };

  const view = useMemo(() => {
    if (!withVariants) {
      const soldOut = isSoldOut(product, showStock);
      return {
        price: product.price,
        fromPrice: false,
        compareAtPrice: product.compareAtPrice ?? null,
        saleEndsAt: product.saleEndsAt,
        stock: product.stock,
        images: product.imageUrls,
        soldOut,
        cartLine: soldOut ? null : (product as CartProduct),
      };
    }
    const images = selectionImages(product, selection);
    if (variant) {
      const soldOut = isSoldOut(variant, showStock);
      return {
        price: variant.price,
        fromPrice: false,
        compareAtPrice: variant.compareAtPrice ?? null,
        saleEndsAt: variant.saleEndsAt,
        stock: variant.stock,
        images,
        soldOut,
        cartLine: soldOut
          ? null
          : {
              id: variant.id,
              name: variantLineName(product, variant),
              price: variant.price,
              imageUrls: images.slice(0, 1),
            },
      };
    }
    const matching = matchingVariants(product, selection);
    const pool = matching.length ? matching : product.variants ?? [];
    const range = priceRange(pool) ?? { min: product.price, max: product.price };
    // Mismo precio y mismo «antes» en todas: la oferta se muestra antes de elegir.
    const compareAts = new Set(pool.map((v) => v.compareAtPrice ?? null));
    const sharedCompareAt = range.min === range.max && compareAts.size === 1 ? [...compareAts][0] : null;
    return {
      price: range.min,
      fromPrice: range.min !== range.max,
      compareAtPrice: sharedCompareAt && sharedCompareAt > range.min ? sharedCompareAt : null,
      saleEndsAt: sharedCompareAt ? pool[0]?.saleEndsAt : undefined,
      stock: sumStock(pool),
      images,
      soldOut: pool.length > 0 && pool.every((v) => isSoldOut(v, showStock)),
      cartLine: null,
    };
  }, [withVariants, product, selection, variant, showStock]);

  return {
    withVariants,
    selection,
    choose,
    variant,
    ...view,
    missing: withVariants ? missingOption(product, selection) : null,
    prompted,
    setPrompted,
  };
}

/** Lleva la vista al eje que falta elegir. */
export function focusMissingOption(option: StoreOption | null) {
  if (!option) return;
  const group = document.getElementById(`opcion-${option.id}`);
  group?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  group?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus({ preventScroll: true });
}

const STATE_TEXT = { available: '', soldout: ' (agotado)', missing: ' (no viene con lo elegido)' } as const;

/** Botones de talla, color… de un producto con variantes. */
export default function VariantPicker({ product, choice, showStock }: { product: StoreProduct; choice: VariantChoice; showStock: boolean }) {
  if (!choice.withVariants) return null;

  return (
    <div className="mb-6 space-y-5">
      {(product.options ?? []).map((option) => {
        const style = optionStyle(option);
        const values = usedValues(product, option);
        const chosen = option.values.find((value) => value.id === choice.selection[option.id]);
        const flagged = choice.prompted && choice.missing?.id === option.id;
        return (
          <fieldset key={option.id} id={`opcion-${option.id}`} className="scroll-mt-32">
            <legend className="mb-2 text-sm font-bold">
              {option.name}
              {chosen && <span className="font-normal text-sf-muted">: {chosen.label}</span>}
            </legend>
            {flagged && (
              <p role="alert" className="mb-2 text-sm font-bold text-red-600">
                Elige {option.name.toLowerCase()} para continuar
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {values.map((value) => {
                const state = valueState(product, choice.selection, option.id, value.id, showStock);
                const checked = chosen?.id === value.id;
                const dim = state !== 'available' && !checked ? 'opacity-40' : '';
                const ring = 'peer-focus-visible:ring-2 peer-focus-visible:ring-sf-primary peer-focus-visible:ring-offset-2';
                const kind = style === 'color' && value.color ? 'color' : style === 'image' && value.imageUrl ? 'image' : 'text';
                const visual =
                  kind === 'color' ? (
                    <span
                      className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 p-0.5 transition-colors ${ring} ${
                        checked ? 'border-sf-primary' : 'border-transparent hover:border-sf-border'
                      } ${dim}`}
                    >
                      {/* Borde marcado: un blanco o un beige no se pierden sobre el fondo. */}
                      <span className="block h-full w-full rounded-full border border-black/30" style={{ backgroundColor: value.color }} />
                      {state === 'soldout' && <span aria-hidden="true" className="absolute h-0.5 w-12 rotate-45 bg-sf-text/70" />}
                    </span>
                  ) : kind === 'image' && value.imageUrl ? (
                    <span
                      className={`relative block h-14 w-14 overflow-hidden rounded-lg border-2 transition-colors ${ring} ${
                        checked ? 'border-sf-primary' : 'border-sf-border hover:border-sf-primary/60'
                      } ${dim}`}
                    >
                      <Image src={value.imageUrl} alt="" fill sizes="56px" unoptimized={!canOptimizeImage(value.imageUrl)} className="object-cover" />
                      {state === 'soldout' && <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-0.5 w-20 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-sf-text/70" />}
                    </span>
                  ) : (
                    <span
                      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-sf-btn border px-4 text-sm font-bold transition-colors ${ring} ${
                        checked ? 'border-sf-primary bg-sf-primary text-sf-on-primary' : 'border-sf-border hover:border-sf-primary'
                      } ${state === 'soldout' && !checked ? 'line-through' : ''} ${dim}`}
                    >
                      {value.label}
                    </span>
                  );
                return (
                  <label key={value.id} className="cursor-pointer" title={`${value.label}${STATE_TEXT[state]}`}>
                    <input
                      type="radio"
                      name={`opcion-${option.id}`}
                      value={value.id}
                      checked={checked}
                      onChange={() => {
                        choice.choose(option.id, value.id);
                        choice.setPrompted(false);
                      }}
                      className="peer sr-only"
                    />
                    {visual}
                    {/* Las muestras no tienen texto a la vista: el lector de pantalla dice el nombre. */}
                    {(kind !== 'text' || state !== 'available') && (
                      <span className="sr-only">
                        {kind !== 'text' && value.label}
                        {STATE_TEXT[state]}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
