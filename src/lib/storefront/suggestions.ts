// Sugerencias por rubro para la franja de beneficios y las preguntas
// frecuentes. El panel las ofrece para tocar y agregar; nunca se publican
// solas, porque son afirmaciones de cada tienda (delivery, garantía, pagos).

import type { RubroId } from './rubros';
import type { StoreBenefit } from './theme';

/** Íconos que tienen sentido para un beneficio (todos están en STOREFRONT_ICONS). */
export const BENEFIT_ICONS = [
  'Truck', 'WhatsApp', 'MessageCircle', 'ShieldCheck', 'BadgeCheck', 'Clock', 'CreditCard', 'MapPin', 'Award',
  'Gift', 'Palette', 'Leaf', 'Wrench', 'Star', 'Heart', 'Sparkles', 'Tag',
] as const;

export const RUBRO_SUGGESTIONS: Record<RubroId, { benefits: StoreBenefit[]; questions: string[] }> = {
  regalos: {
    benefits: [
      { icon: 'Truck', title: 'Delivery a domicilio', text: 'Coordinamos el día y la hora' },
      { icon: 'Palette', title: 'Personalizado', text: 'Nombres, fotos y dedicatorias' },
      { icon: 'Gift', title: 'Listo para regalar', text: 'Con presentación cuidada' },
      { icon: 'Clock', title: 'Entregas el mismo día', text: 'Según zona y disponibilidad' },
    ],
    questions: ['¿Hacen delivery? ¿A qué zonas?', '¿Con cuánta anticipación debo pedir?', '¿Puedo personalizar mi regalo?', '¿Cómo puedo pagar?'],
  },
  'moda-belleza': {
    benefits: [
      { icon: 'Truck', title: 'Envíos a todo el Perú', text: '' },
      { icon: 'ShieldCheck', title: 'Productos originales', text: '' },
      { icon: 'BadgeCheck', title: 'Cambios de talla', text: 'Consulta las condiciones' },
      { icon: 'CreditCard', title: 'Pagos con Yape y Plin', text: '' },
    ],
    questions: ['¿Cómo sé cuál es mi talla?', '¿Hacen envíos a provincia?', '¿Aceptan cambios?', '¿Cómo puedo pagar?'],
  },
  'comida-bebidas': {
    benefits: [
      { icon: 'Truck', title: 'Delivery', text: 'En nuestra zona' },
      { icon: 'Clock', title: 'Pedidos para hoy', text: '' },
      { icon: 'Leaf', title: 'Ingredientes frescos', text: '' },
      { icon: 'CreditCard', title: 'Yape, Plin y efectivo', text: '' },
    ],
    questions: ['¿Hasta qué hora reciben pedidos?', '¿A qué zonas hacen delivery?', '¿Cuánto cuesta el delivery?', '¿Cómo puedo pagar?'],
  },
  'ferreteria-tecnologia': {
    benefits: [
      { icon: 'ShieldCheck', title: 'Garantía', text: '' },
      { icon: 'Truck', title: 'Envíos a todo el Perú', text: '' },
      { icon: 'BadgeCheck', title: 'Factura electrónica', text: '' },
      { icon: 'Wrench', title: 'Asesoría técnica', text: 'Te ayudamos a elegir' },
    ],
    questions: ['¿Los productos tienen garantía?', '¿Emiten boleta o factura?', '¿Hacen envíos a provincia?', '¿Cómo puedo pagar?'],
  },
  general: {
    benefits: [
      { icon: 'Truck', title: 'Delivery', text: '' },
      { icon: 'CreditCard', title: 'Pagos con Yape y Plin', text: '' },
      { icon: 'ShieldCheck', title: 'Compra segura', text: '' },
      { icon: 'MapPin', title: 'Recojo en tienda', text: '' },
    ],
    questions: ['¿Hacen envíos?', '¿Cómo puedo pagar?', '¿Tienen tienda física?', '¿Cuánto demora la entrega?'],
  },
};
