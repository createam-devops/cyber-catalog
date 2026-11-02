// Elegir una variante (talla, color…) en la vitrina. Funciones puras: sirven en
// la ficha del producto, en la tarjeta y en el servidor (datos para Google).

import type { StoreOption, StoreProduct, StoreVariant } from './catalog';

/** Eje → valor elegido. Un eje sin elegir no aparece. */
export type Selection = Record<string, string>;

/** Estado de un valor según lo elegido en los otros ejes. */
export type ValueState = 'available' | 'soldout' | 'missing';

type WithVariants = Pick<StoreProduct, 'options' | 'variants'>;

export function hasVariants(product: WithVariants): boolean {
  return (product.options?.length ?? 0) > 0 && (product.variants?.length ?? 0) > 0;
}

/** Sin stock y la tienda lo muestra: no se puede pedir. Si la tienda no muestra stock, se pide igual. */
export function isSoldOut(item: Pick<StoreVariant, 'stock'>, showStock: boolean): boolean {
  return showStock && item.stock !== null && item.stock <= 0;
}

function matches(variant: StoreVariant, selection: Selection): boolean {
  return Object.entries(selection).every(([optionId, valueId]) => variant.values[optionId] === valueId);
}

/** Las variantes que calzan con lo elegido hasta ahora. */
export function matchingVariants(product: WithVariants, selection: Selection): StoreVariant[] {
  return (product.variants ?? []).filter((variant) => matches(variant, selection));
}

/** La variante exacta, solo si ya se eligió un valor en cada eje. */
export function findVariant(product: WithVariants, selection: Selection): StoreVariant | null {
  const options = product.options ?? [];
  if (!options.length || options.some((option) => !selection[option.id])) return null;
  return matchingVariants(product, selection)[0] ?? null;
}

/**
 * Un valor está `missing` si esa combinación no existe con lo elegido en los
 * otros ejes, y `soldout` si existe pero todas sus variantes están agotadas.
 */
export function valueState(product: WithVariants, selection: Selection, optionId: string, valueId: string, showStock: boolean): ValueState {
  const others = Object.fromEntries(Object.entries(selection).filter(([id]) => id !== optionId));
  const candidates = matchingVariants(product, { ...others, [optionId]: valueId });
  if (!candidates.length) return 'missing';
  return candidates.some((variant) => !isSoldOut(variant, showStock)) ? 'available' : 'soldout';
}

/** Los valores de un eje que usa alguna variante, en el orden del eje. */
export function usedValues(product: WithVariants, option: StoreOption) {
  const used = new Set((product.variants ?? []).map((variant) => variant.values[option.id]));
  return option.values.filter((value) => used.has(value.id));
}

/**
 * Lo elegido al abrir la ficha: la variante de la dirección (?variant= o una
 * dirección vieja), o si no, solo los ejes que tienen un único valor. La talla
 * o el color no se eligen en lugar del cliente: un pedido con la talla
 * equivocada es peor que un clic más.
 */
export function initialSelection(product: WithVariants, variantId?: string | null): Selection {
  const variant = variantId ? product.variants?.find((v) => v.id === variantId) : undefined;
  if (variant) return { ...variant.values };
  const selection: Selection = {};
  for (const option of product.options ?? []) {
    const values = usedValues(product, option);
    if (values.length === 1) selection[option.id] = values[0].id;
  }
  return selection;
}

/** Elegir un valor. Lo elegido en otros ejes que ya no combina se suelta (del último eje hacia atrás). */
export function selectValue(product: WithVariants, selection: Selection, optionId: string, valueId: string): Selection {
  const next: Selection = { ...selection, [optionId]: valueId };
  const others = (product.options ?? []).filter((option) => option.id !== optionId && next[option.id]);
  while (!matchingVariants(product, next).length && others.length) {
    delete next[others.pop()!.id];
  }
  return next;
}

/** El primer eje que falta elegir. */
export function missingOption(product: WithVariants, selection: Selection): StoreOption | null {
  return (product.options ?? []).find((option) => !selection[option.id]) ?? null;
}

/** Precio más bajo y más alto entre las variantes que calzan. */
export function priceRange(variants: Array<Pick<StoreVariant, 'price'>>): { min: number; max: number } | null {
  if (!variants.length) return null;
  const prices = variants.map((v) => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/**
 * Las fotos para lo elegido: las de la primera variante que calza y tiene
 * fotos. Si ninguna tiene, se suelta lo elegido desde el último eje (primero la
 * talla, luego el color): Azul / L sin foto propia muestra la de Azul / M. Si
 * nada calza con fotos, las de la ficha.
 */
export function selectionImages(product: Pick<StoreProduct, 'imageUrls' | 'options' | 'variants'>, selection: Selection): string[] {
  const partial: Selection = { ...selection };
  const chosen = (product.options ?? []).map((option) => option.id).filter((id) => partial[id]);
  while (Object.keys(partial).length) {
    const withPhotos = matchingVariants(product, partial).find((variant) => variant.imageUrls.length > 0);
    if (withPhotos) return withPhotos.imageUrls;
    const last = chosen.pop();
    if (!last) break;
    delete partial[last];
  }
  return product.imageUrls;
}

/** El eje se dibuja con muestras de color o con fotos si sus valores las tienen. */
export function optionStyle(option: StoreOption): 'color' | 'image' | 'text' {
  if (option.values.some((value) => value.imageUrl)) return 'image';
  if (option.values.some((value) => value.color)) return 'color';
  return 'text';
}

/** El nombre de la línea del pedido: «Polo básico — Rojo / M». */
export function variantLineName(product: Pick<StoreProduct, 'name'>, variant: Pick<StoreVariant, 'label'>): string {
  return variant.label ? `${product.name} — ${variant.label}` : product.name;
}

/** «Rojo / M» a partir de los valores, en el orden de los ejes. */
export function labelFromValues(options: StoreOption[], values: Record<string, string>): string {
  return options
    .map((option) => option.values.find((value) => value.id === values[option.id])?.label)
    .filter(Boolean)
    .join(' / ');
}

export type SchemaAttribute = 'color' | 'size' | 'material' | 'pattern';

/**
 * La propiedad de Google (schema.org y Merchant Center) que corresponde a un
 * eje por su nombre. Los demás ejes (Sabor, Capacidad…) van como propiedad libre.
 */
export function schemaAttribute(optionName: string): SchemaAttribute | null {
  const name = optionName
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
  if (/^(color|colores|colour)$/.test(name)) return 'color';
  if (/^(talla|tallas|size|tamano)$/.test(name)) return 'size';
  if (/^(material|tela)$/.test(name)) return 'material';
  if (/^(estampado|diseno|patron|pattern)$/.test(name)) return 'pattern';
  return null;
}

/** Eje → valor de una variante, en el orden de los ejes, con su propiedad de Google si la hay. */
export function variantAttributes(options: StoreOption[], variant: Pick<StoreVariant, 'values'>) {
  return options.flatMap((option) => {
    const value = option.values.find((v) => v.id === variant.values[option.id]);
    return value ? [{ name: option.name, value: value.label, attribute: schemaAttribute(option.name) }] : [];
  });
}

/** Las muestras de color de la tarjeta (el primer eje de color), hasta `max`. */
export function cardSwatches(product: WithVariants, max = 5): { colors: Array<{ label: string; color?: string; imageUrl?: string }>; more: number } {
  const option = (product.options ?? []).find((o) => optionStyle(o) !== 'text');
  if (!option) return { colors: [], more: 0 };
  const values = usedValues(product, option);
  return { colors: values.slice(0, max), more: Math.max(0, values.length - max) };
}
