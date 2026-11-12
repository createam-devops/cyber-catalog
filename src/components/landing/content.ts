// Enlaces, planes y preguntas de la landing de createam.cloud.
// Los precios de Catálogo Digital salen de src/lib/plans.ts; los del ERP y
// OnTurn se cobran en sus propias plataformas, así que aquí solo se muestran.

export const LINKS = {
  catalogRegister: '/catalogo-digital',
  // Las tiendas se administran en el ERP: /ingresar lleva a su ingreso.
  catalogLogin: '/ingresar',
  // La app del ERP vive en cyberposapp.createam.cloud aunque el sitio ya no diga
  // «CyberPOS»: no cambiar el dominio al renombrar (erpapp… no existe y da 404).
  cyberposRegister: 'https://cyberposapp.createam.cloud/auth/register',
  cyberposLogin: 'https://cyberposapp.createam.cloud/auth/login',
  onturnRegister: 'https://beta.onturn.app/registrar-negocio',
  onturnLogin: 'https://beta.onturn.app/panel',
  // Programa de Aliados: la solicitud y el portal del aliado viven en el ERP.
  allyJoin: 'https://cyberposapp.createam.cloud/aliados/unete',
  allyHome: 'https://cyberposapp.createam.cloud/app/aliado',
  // Consulta de comprobantes para quien compró en un negocio que usa el ERP de Createam:
  // /comprobantes redirige a la página del ERP.
  invoiceLookup: '/comprobantes',
  whatsapp: 'https://wa.me/51945111310',
  email: 'mailto:hola@createam.io',
  custom: 'https://createam.io',
};

export const CONTACT = {
  phone: '+51 945 111 310',
  email: 'hola@createam.io',
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

/**
 * Lo que un negocio que empezó con Catálogo Digital puede sumar después, en la
 * misma cuenta del ERP: su tienda vive dentro del ERP, así que crece sin
 * cambiar de sistema ni migrar sus productos. Lo usan la landing, la página de
 * Catálogo Digital y llms.txt.
 */
export const CATALOG_GROWTH: { title: string; text: string }[] = [
  { title: 'Punto de venta y caja', text: 'Vende también en tu local, con Yape, tarjeta y efectivo, y cierra caja cada día.' },
  { title: 'Facturación electrónica SUNAT', text: 'Boletas, facturas y notas de crédito y débito enviadas directo a SUNAT.' },
  { title: 'Guías de remisión', text: 'Guías electrónicas para tus despachos, también directo a SUNAT.' },
  { title: 'Inventario y almacenes', text: 'Un solo stock para tu tienda online y tu local, con varios almacenes y kárdex.' },
  { title: 'Compras y proveedores', text: 'Órdenes de compra, proveedores y cuentas por pagar.' },
  { title: 'Contabilidad', text: 'Asientos automáticos de cada venta y compra, libro diario, libro mayor y balance de comprobación.' },
  { title: 'CRM omnicanal', text: 'Atiende WhatsApp, Instagram y Messenger desde una bandeja, sigue a tus clientes en tu embudo y cotiza desde el chat.' },
];

export const FAQS: { question: string; answer: string }[] = [
  {
    question: '¿Tengo que instalar algo?',
    answer:
      'No. Las tres herramientas funcionan en el navegador del celular o de la computadora. El ERP y OnTurn además se pueden instalar como aplicación desde el mismo navegador.',
  },
  {
    question: '¿El ERP emite comprobantes electrónicos?',
    answer:
      'Sí. Emite boletas, facturas, notas de crédito y débito y guías de remisión, y las envía directamente a SUNAT con el certificado digital de tu negocio. La facturación electrónica está incluida desde el plan Emprendedor.',
  },
  {
    question: '¿Cobran comisión por mis ventas?',
    answer:
      'En Catálogo Digital y el ERP no: pagas una mensualidad fija. OnTurn es gratis hasta por un año; después tendrá una comisión por reserva y te avisaremos antes de activarla.',
  },
  {
    question: '¿El Catálogo Digital se conecta con un sistema de ventas?',
    answer:
      'Sí. Tu tienda vive dentro del ERP: los productos, fotos, precios y stock se cargan una sola vez y se administran desde Venta online. Cuando tu negocio crece, activas en la misma cuenta punto de venta, facturación electrónica SUNAT, guías de remisión, compras, contabilidad y CRM omnicanal con WhatsApp, Instagram y Messenger, sin cambiar de sistema ni migrar nada.',
  },
  {
    question: '¿Puedo usar mi propio dominio?',
    answer:
      'Sí, en el plan Pro de Catálogo Digital. En el plan Starter tu tienda queda en una dirección como tunegocio.createam.cloud.',
  },
  {
    question: '¿Qué pasa cuando termina el periodo gratis?',
    answer: `En Catálogo Digital la prueba es gratis y después eliges tu plan desde el ERP. En el ERP el plan gratis dura hasta un año y después eliges un plan de pago. En OnTurn, pasado el año gratis, se cobra una comisión por reserva.`,
  },
  {
    question: '¿Puedo tener un plan del ERP a mi medida?',
    answer:
      'Sí. El ERP se arma por módulos: si vendes productos y servicios, fabricas a medida o necesitas inteligencia artificial, configuramos un plan con lo que usa tu negocio.',
  },
  {
    question: '¿Cómo se paga?',
    answer:
      'Catálogo Digital y el ERP se pagan desde tu cuenta del ERP, en Ajustes › Mi plan.',
  },
  {
    question: '¿Y si necesito algo que no está aquí?',
    answer:
      'Createam también desarrolla software a medida. Cuéntanos tu caso por WhatsApp y vemos si alguno de los productos lo cubre o si conviene un desarrollo propio.',
  },
];
