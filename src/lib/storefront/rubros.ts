// Paquetes por rubro. Elegir un rubro llena la vitrina de una vez: estilo
// sugerido, paleta, categorías iniciales con su ícono y todos los textos.
// La tienda después solo ajusta lo que quiera.

import type { StorefrontContent } from './content';
import type { StylePresetId } from './presets';
import type { StorefrontIconName } from './icons';

export const RUBRO_IDS = ['regalos', 'moda-belleza', 'comida-bebidas', 'ferreteria-tecnologia', 'general'] as const;

export type RubroId = (typeof RUBRO_IDS)[number];

export interface RubroPack {
  id: RubroId;
  label: string;
  description: string;
  suggestedStyle: StylePresetId;
  palette: { primary: string; secondary: string; accent: string };
  categories: Array<{ label: string; value: string; icon: StorefrontIconName }>;
  content: StorefrontContent;
  /** Productos de muestra para la vista previa del panel. Nunca se guardan. */
  sampleProducts: Array<{ name: string; price: number; category: string }>;
}

const COMMON_CONTENT = {
  heroButton: 'Ver productos',
  searchPlaceholder: '¿Qué buscas hoy?',
  categoriesTitle: 'Explorar',
  featuredBadge: 'Destacado',
  addToCart: 'Agregar al pedido',
  relatedTitle: 'Te podría gustar',
  cartTitle: 'Tu pedido',
  orderButton: 'Pedir por WhatsApp',
  orderGreeting: '¡Hola! Quiero hacer un pedido:',
} satisfies Partial<StorefrontContent>;

export const RUBROS: Record<RubroId, RubroPack> = {
  regalos: {
    id: 'regalos',
    label: 'Regalos y detalles',
    description: 'Ramos, cajas sorpresa, desayunos, peluches y personalizados.',
    suggestedStyle: 'moderno',
    palette: { primary: '#c2185b', secondary: '#fce4ec', accent: '#f59e0b' },
    categories: [
      { label: 'Ramos', value: 'ramos', icon: 'Flower2' },
      { label: 'Cajas sorpresa', value: 'cajas-sorpresa', icon: 'Gift' },
      { label: 'Desayunos', value: 'desayunos', icon: 'Coffee' },
      { label: 'Peluches', value: 'peluches', icon: 'Heart' },
      { label: 'Personalizados', value: 'personalizados', icon: 'Palette' },
    ],
    content: {
      ...COMMON_CONTENT,
      heroEyebrow: 'Detalles que enamoran',
      heroTitle: 'Regala emociones',
      heroButton: 'Ver regalos',
      searchPlaceholder: '¿Qué quieres regalar hoy?',
      productsTitle: 'Populares ahora',
      productsSubtitle: 'Los más pedidos',
      deliveryNote: 'Delivery a domicilio',
      footerTagline: 'Creando momentos inolvidables.',
    },
    sampleProducts: [
      { name: 'Ramo de rosas', price: 45, category: 'ramos' },
      { name: 'Caja sorpresa corazón', price: 48, category: 'cajas-sorpresa' },
      { name: 'Desayuno de cumpleaños', price: 85, category: 'desayunos' },
      { name: 'Peluche con globo', price: 55, category: 'peluches' },
    ],
  },
  'moda-belleza': {
    id: 'moda-belleza',
    label: 'Moda y belleza',
    description: 'Ropa, calzado, accesorios y cosméticos.',
    suggestedStyle: 'clasico',
    palette: { primary: '#1f2937', secondary: '#f5f0eb', accent: '#b45309' },
    categories: [
      { label: 'Mujer', value: 'mujer', icon: 'Shirt' },
      { label: 'Hombre', value: 'hombre', icon: 'Shirt' },
      { label: 'Calzado', value: 'calzado', icon: 'Footprints' },
      { label: 'Accesorios', value: 'accesorios', icon: 'Watch' },
      { label: 'Belleza', value: 'belleza', icon: 'Sparkles' },
    ],
    content: {
      ...COMMON_CONTENT,
      heroEyebrow: 'Nueva temporada',
      heroTitle: 'Tu estilo, tu momento',
      heroButton: 'Ver colección',
      searchPlaceholder: 'Busca prendas, tallas o marcas',
      productsTitle: 'Lo más nuevo',
      productsSubtitle: 'Recién llegados a la tienda',
      featuredBadge: 'Tendencia',
      addToCart: 'Agregar a la bolsa',
      relatedTitle: 'Combínalo con',
      cartTitle: 'Tu bolsa',
      deliveryNote: 'Envíos a todo el Perú',
      footerTagline: 'Moda que te acompaña.',
    },
    sampleProducts: [
      { name: 'Vestido midi lino', price: 129, category: 'mujer' },
      { name: 'Camisa oxford', price: 99, category: 'hombre' },
      { name: 'Zapatillas urbanas', price: 189, category: 'calzado' },
      { name: 'Set de maquillaje', price: 75, category: 'belleza' },
    ],
  },
  'comida-bebidas': {
    id: 'comida-bebidas',
    label: 'Comida y bebidas',
    description: 'Restaurantes, cafeterías, pastelerías y bebidas.',
    suggestedStyle: 'vibrante',
    palette: { primary: '#c2410c', secondary: '#fff7ed', accent: '#15803d' },
    categories: [
      { label: 'Platos', value: 'platos', icon: 'UtensilsCrossed' },
      { label: 'Postres', value: 'postres', icon: 'Cake' },
      { label: 'Cafetería', value: 'cafeteria', icon: 'Coffee' },
      { label: 'Bebidas', value: 'bebidas', icon: 'CupSoda' },
      { label: 'Para compartir', value: 'para-compartir', icon: 'Pizza' },
    ],
    content: {
      ...COMMON_CONTENT,
      heroEyebrow: 'Hecho hoy',
      heroTitle: 'Antojos a un mensaje',
      heroButton: 'Ver la carta',
      searchPlaceholder: '¿Qué se te antoja?',
      categoriesTitle: 'La carta',
      productsTitle: 'Los favoritos',
      productsSubtitle: 'Lo que más piden nuestros clientes',
      featuredBadge: 'Recomendado',
      addToCart: 'Agregar',
      relatedTitle: 'Acompáñalo con',
      deliveryNote: 'Delivery y recojo en tienda',
      footerTagline: 'Sabor que llega a tu puerta.',
    },
    sampleProducts: [
      { name: 'Lomo saltado', price: 32, category: 'platos' },
      { name: 'Torta de chocolate', price: 12, category: 'postres' },
      { name: 'Café americano', price: 8, category: 'cafeteria' },
      { name: 'Chicha morada 1 L', price: 10, category: 'bebidas' },
    ],
  },
  'ferreteria-tecnologia': {
    id: 'ferreteria-tecnologia',
    label: 'Ferretería y tecnología',
    description: 'Herramientas, materiales, electricidad, repuestos y electrónica.',
    suggestedStyle: 'minimal',
    palette: { primary: '#1d4ed8', secondary: '#eff6ff', accent: '#f59e0b' },
    categories: [
      { label: 'Herramientas', value: 'herramientas', icon: 'Wrench' },
      { label: 'Electricidad', value: 'electricidad', icon: 'Zap' },
      { label: 'Gasfitería', value: 'gasfiteria', icon: 'Droplet' },
      { label: 'Pinturas', value: 'pinturas', icon: 'PaintBucket' },
      { label: 'Tecnología', value: 'tecnologia', icon: 'Cpu' },
    ],
    content: {
      ...COMMON_CONTENT,
      heroEyebrow: 'Para tu obra y tu hogar',
      heroTitle: 'Herramientas y tecnología',
      searchPlaceholder: 'Busca por producto, marca o código',
      categoriesTitle: 'Categorías',
      productsTitle: 'Más buscados',
      productsSubtitle: 'Lo que más consultan nuestros clientes',
      addToCart: 'Agregar a la cotización',
      relatedTitle: 'Productos relacionados',
      cartTitle: 'Tu cotización',
      orderButton: 'Cotizar por WhatsApp',
      orderGreeting: '¡Hola! Quiero cotizar estos productos:',
      deliveryNote: '',
      footerTagline: 'Lo que necesitas para construir y reparar.',
    },
    sampleProducts: [
      { name: 'Taladro percutor 650 W', price: 289, category: 'herramientas' },
      { name: 'Cable mellizo 2×14 (rollo)', price: 95, category: 'electricidad' },
      { name: 'Pintura látex blanco 4 L', price: 68, category: 'pinturas' },
      { name: 'Router wifi doble banda', price: 159, category: 'tecnologia' },
    ],
  },
  general: {
    id: 'general',
    label: 'Otro rubro',
    description: 'Textos neutros para cualquier tipo de negocio.',
    suggestedStyle: 'moderno',
    palette: { primary: '#2563eb', secondary: '#eff6ff', accent: '#f59e0b' },
    categories: [],
    content: {
      ...COMMON_CONTENT,
      heroEyebrow: '',
      heroTitle: 'Bienvenido a nuestra tienda',
      productsTitle: 'Nuestros productos',
      productsSubtitle: '',
      deliveryNote: '',
      footerTagline: '',
    },
    sampleProducts: [
      { name: 'Producto destacado', price: 49.9, category: 'general' },
      { name: 'Producto nuevo', price: 29.9, category: 'general' },
      { name: 'Producto clásico', price: 39.9, category: 'general' },
      { name: 'Producto de temporada', price: 59.9, category: 'general' },
    ],
  },
};

export function isRubroId(value: unknown): value is RubroId {
  return typeof value === 'string' && (RUBRO_IDS as readonly string[]).includes(value);
}
