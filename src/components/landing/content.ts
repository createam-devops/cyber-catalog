// Enlaces, planes y preguntas de la landing de createam.cloud.
// Los precios de Catálogo Digital salen de src/lib/plans.ts; los de CyberPOS y
// OnTurn se cobran en sus propias plataformas, así que aquí solo se muestran.
import { TRIAL_DAYS } from '@/lib/plans';

export const LINKS = {
  catalogRegister: '/registro',
  catalogLogin: '/login',
  cyberposRegister: 'https://cyberposapp.createam.cloud/auth/register',
  cyberposLogin: 'https://cyberposapp.createam.cloud/auth/login',
  onturnRegister: 'https://beta.onturn.app/registrar-negocio',
  onturnLogin: 'https://beta.onturn.app/panel',
  whatsapp: 'https://wa.me/51945111310',
  email: 'mailto:hello@createam.io',
  custom: 'https://createam.io',
};

export const CONTACT = {
  phone: '+51 945 111 310',
  email: 'hello@createam.io',
};

export interface LandingPlan {
  name: string;
  price: string;
  highlighted?: boolean;
  features: string[];
}

export const CYBERPOS_PLANS: LandingPlan[] = [
  {
    name: 'Gratis',
    price: 'S/ 0',
    features: [
      'Eliges Productos o Servicios',
      'Punto de venta con ticket',
      'Inventario simple o agenda de servicios',
      '1 usuario · 1 caja',
      'Gratis hasta por 1 año',
    ],
  },
  {
    name: 'Emprendedor',
    price: 'S/ 19.90',
    features: [
      'Punto de venta, ventas e inventario',
      'Facturación electrónica SUNAT',
      '300 comprobantes al mes',
      '1 usuario · 1 caja · 1 almacén',
    ],
  },
  {
    name: 'Mype',
    price: 'S/ 29.90',
    highlighted: true,
    features: [
      'Todo lo de Emprendedor',
      'Compras, proveedores y finanzas',
      'Guías de remisión y contabilidad',
      'Reportes avanzados',
      '2,000 comprobantes al mes',
      '3 usuarios · 5 cajas · 2 almacenes',
    ],
  },
  {
    name: 'Empresarial',
    price: 'S/ 59.90',
    features: [
      'Todo lo de Mype',
      'Órdenes de servicio, agenda y garantías',
      'Acceso por API para integraciones',
      '10,000 comprobantes al mes',
      '10 usuarios · 20 cajas · 10 almacenes',
    ],
  },
];

export const RESTAURANT_PLANS: LandingPlan[] = [
  {
    name: 'Restaurante',
    price: 'S/ 24.90',
    features: [
      'Salón con zonas y mesas en vivo',
      'Comandas desde celular, tablet o caja',
      'Comanda impresa en cocina y barra',
      'Caja y comprobantes SUNAT',
    ],
  },
  {
    name: 'Restaurante Inteligente',
    price: 'S/ 49.90',
    features: [
      'Todo lo del plan Restaurante',
      'Pantalla de cocina por estación',
      'Pantallas interactivas en las mesas',
      'Hasta 20 pantallas de mesa conectadas',
    ],
  },
];

export const FAQS: { question: string; answer: string }[] = [
  {
    question: '¿Tengo que instalar algo?',
    answer:
      'No. Las tres herramientas funcionan en el navegador del celular o de la computadora. CyberPOS y OnTurn además se pueden instalar como aplicación desde el mismo navegador.',
  },
  {
    question: '¿CyberPOS emite comprobantes electrónicos?',
    answer:
      'Sí. Emite boletas, facturas, notas de crédito y débito y guías de remisión, y las envía directamente a SUNAT con el certificado digital de tu negocio. La facturación electrónica está incluida desde el plan Emprendedor.',
  },
  {
    question: '¿Cobran comisión por mis ventas?',
    answer:
      'En Catálogo Digital y CyberPOS no: pagas una mensualidad fija. OnTurn es gratis hasta por un año; después tendrá una comisión por reserva y te avisaremos antes de activarla.',
  },
  {
    question: '¿Puedo usar mi propio dominio?',
    answer:
      'Sí, en el plan Pro de Catálogo Digital. En el plan Starter tu tienda queda en una dirección como tunegocio.createam.cloud.',
  },
  {
    question: '¿Qué pasa cuando termina el periodo gratis?',
    answer: `En Catálogo Digital la prueba dura ${TRIAL_DAYS} días y después eliges Starter o Pro. En CyberPOS el plan gratis dura hasta un año y después eliges un plan de pago. En OnTurn, pasado el año gratis, se cobra una comisión por reserva.`,
  },
  {
    question: '¿Puedo tener un plan de CyberPOS a mi medida?',
    answer:
      'Sí. CyberPOS se arma por módulos: si vendes productos y servicios, fabricas a medida o necesitas inteligencia artificial, configuramos un plan con lo que usa tu negocio.',
  },
  {
    question: '¿Cómo se paga?',
    answer:
      'Catálogo Digital se paga en línea con Mercado Pago. Los planes de CyberPOS se pagan por transferencia, depósito o Yape.',
  },
  {
    question: '¿Y si necesito algo que no está aquí?',
    answer:
      'Createam también desarrolla software a medida. Cuéntanos tu caso por WhatsApp y vemos si alguno de los productos lo cubre o si conviene un desarrollo propio.',
  },
];
