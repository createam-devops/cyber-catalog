// Textos de la vitrina. Cada rubro trae los suyos (ver rubros.ts) y la tienda
// solo guarda los que cambió; el resto sale del rubro. Así, si la tienda cambia
// de rubro, los textos que no tocó se adaptan solos.

export interface StorefrontContent {
  /** Texto pequeño sobre el título de la portada. Vacío lo oculta. */
  heroEyebrow: string;
  heroTitle: string;
  heroButton: string;
  searchPlaceholder: string;
  categoriesTitle: string;
  productsTitle: string;
  productsSubtitle: string;
  featuredBadge: string;
  addToCart: string;
  relatedTitle: string;
  cartTitle: string;
  orderButton: string;
  /** Primera línea del mensaje de WhatsApp con el pedido. */
  orderGreeting: string;
  /** Aviso de entrega en la ficha del producto ("Delivery en Lima"). Vacío lo oculta. */
  deliveryNote: string;
  footerTagline: string;
}

export const CONTENT_KEYS = [
  'heroEyebrow',
  'heroTitle',
  'heroButton',
  'searchPlaceholder',
  'categoriesTitle',
  'productsTitle',
  'productsSubtitle',
  'featuredBadge',
  'addToCart',
  'relatedTitle',
  'cartTitle',
  'orderButton',
  'orderGreeting',
  'deliveryNote',
  'footerTagline',
] as const satisfies readonly (keyof StorefrontContent)[];

/** Etiqueta y límite de largo de cada texto, para el panel y la validación. */
export const CONTENT_FIELDS: Record<keyof StorefrontContent, { label: string; max: number; hint?: string }> = {
  heroEyebrow: { label: 'Frase pequeña de la portada', max: 60, hint: 'Déjala vacía para ocultarla' },
  heroTitle: { label: 'Título de la portada', max: 70 },
  heroButton: { label: 'Botón de la portada', max: 30 },
  searchPlaceholder: { label: 'Texto del buscador', max: 60 },
  categoriesTitle: { label: 'Título de categorías', max: 40 },
  productsTitle: { label: 'Título de productos', max: 50 },
  productsSubtitle: { label: 'Subtítulo de productos', max: 80, hint: 'Déjalo vacío para ocultarlo' },
  featuredBadge: { label: 'Etiqueta de destacados', max: 20 },
  addToCart: { label: 'Botón de agregar', max: 30 },
  relatedTitle: { label: 'Título de productos relacionados', max: 50 },
  cartTitle: { label: 'Título del carrito', max: 30 },
  orderButton: { label: 'Botón de enviar pedido', max: 40 },
  orderGreeting: { label: 'Saludo del mensaje de WhatsApp', max: 120 },
  deliveryNote: { label: 'Aviso de entrega', max: 50, hint: 'Ej.: "Delivery en Lima". Vacío lo oculta' },
  footerTagline: { label: 'Frase del pie de página', max: 120, hint: 'Déjala vacía para ocultarla' },
};
