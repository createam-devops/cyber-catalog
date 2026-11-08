import {
  Banknote,
  BarChart3,
  Bell,
  Bot,
  BookOpen,
  Boxes,
  Calculator,
  CalendarDays,
  ClipboardList,
  Coins,
  CreditCard,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Facebook,
  Flame,
  Inbox,
  Instagram,
  KeyRound,
  Kanban,
  Landmark,
  Link2,
  ListChecks,
  Lock,
  Megaphone,
  MessageCircle,
  Music2,
  MessageSquareText,
  MessagesSquare,
  Monitor,
  PackageSearch,
  Paintbrush,
  PenLine,
  Printer,
  QrCode,
  Receipt,
  Repeat,
  ScanBarcode,
  Send,
  ShieldCheck,
  Shirt,
  Shuffle,
  Siren,
  Store,
  Tags,
  Truck,
  Undo2,
  UserCheck,
  Users,
  Utensils,
  Warehouse,
  WifiOff,
  Workflow,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Faq, FeatureItem } from "../ui";

// Módulos del ERP: el catálogo completo (MODULE_GROUPS) y las páginas de los
// más buscados (MODULE_PAGES). Cada función está verificada en el código del ERP
// en producción; lo que solo está planeado no se anuncia. Los textos usan las
// palabras con que la gente lo busca en Google.

export interface ModuleSummary {
  name: string;
  text: string;
  /** Página del módulo en /erp/<page> */
  page?: string;
  /** Otra página del sitio (un rubro o un producto) */
  href?: string;
}

export interface ModuleGroup {
  title: string;
  icon: LucideIcon;
  modules: ModuleSummary[];
}

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    title: "Vender y cobrar",
    icon: Zap,
    modules: [
      { name: "Punto de venta", text: "Vende con buscador, lector de código de barras o la cámara del celular.", page: "punto-de-venta" },
      { name: "Control de caja", text: "Apertura, ingresos, retiros, arqueo y cierre por turno." },
      { name: "Cotizaciones", text: "Envíalas por WhatsApp con un enlace y tu cliente responde desde su celular." },
      { name: "Yape, Plin y tarjeta", text: "Con detector de Yape contra las capturas falsas." },
      { name: "Venta sin internet", text: "Sigues vendiendo en efectivo si se cae la conexión." },
      { name: "Pantalla del cliente", text: "Un segundo monitor con la compra, el QR de Yape y el vuelto." },
      { name: "Devoluciones", text: "Con su nota de crédito generada sola." },
    ],
  },
  {
    title: "Facturar a SUNAT",
    icon: FileCheck,
    modules: [
      { name: "Facturación electrónica", text: "Boletas, facturas, notas de crédito y débito, resumen diario y bajas.", page: "facturacion-electronica" },
      { name: "Guías de remisión", text: "Guía de remisión electrónica para tus despachos y traslados.", page: "guias-de-remision" },
      { name: "Consulta de comprobantes", text: "Tus clientes descargan su comprobante en línea." },
      { name: "ICBPER y detracciones", text: "Impuesto a las bolsas y detracción indicada en la factura." },
    ],
  },
  {
    title: "Inventario y compras",
    icon: Boxes,
    modules: [
      { name: "Inventario y kárdex", text: "Varios almacenes, kárdex y costo promedio.", page: "inventario" },
      { name: "Lotes y vencimientos", text: "Sale primero lo que vence antes, con avisos y liquidación." },
      { name: "Tallas y colores", text: "Variantes con su propio stock, también desde Excel." },
      { name: "Compras y proveedores", text: "Órdenes de compra, recepción y cuentas por pagar." },
      { name: "Reposición sugerida", text: "Lo que falta, por proveedor, y la orden en un clic." },
    ],
  },
  {
    title: "Finanzas y contabilidad",
    icon: Landmark,
    modules: [
      { name: "Contabilidad automática", text: "Asientos solos, libro diario, mayor y balance en Excel.", page: "contabilidad" },
      { name: "Cuentas por cobrar", text: "Quién te debe, cuánto y desde cuándo; ventas al crédito con cuotas." },
      { name: "Crédito fiscal de compras", text: "El IGV de tus compras registrado aparte del costo." },
      { name: "Reportes", text: "Ventas por día y medio de pago, margen por producto, stock y cierre." },
    ],
  },
  {
    title: "Clientes y ventas por chat",
    icon: MessagesSquare,
    modules: [
      { name: "CRM omnicanal", text: "WhatsApp, Instagram, Messenger y Meta Ads en una bandeja, con embudo y chatbot.", page: "crm" },
      { name: "Envíos masivos", text: "Campañas por WhatsApp con plantillas oficiales." },
      { name: "Meta Ads y TikTok Ads", text: "Los leads de tus anuncios llegan solos al CRM (TikTok, muy pronto)." },
      { name: "Tienda online", text: "Tu Catálogo Digital con los mismos productos y stock.", href: "/catalogo-digital" },
      { name: "Reservas online", text: "OnTurn: tus clientes reservan su cita a cualquier hora.", href: "/onturn" },
    ],
  },
  {
    title: "Servicios y producción",
    icon: Wrench,
    modules: [
      { name: "Órdenes de servicio", text: "Técnico, diagnóstico, repuestos, fotos y firma.", page: "ordenes-de-servicio" },
      { name: "Agenda y garantías", text: "Calendario del equipo y garantías con constancia en PDF." },
      { name: "Productos a medida", text: "Cotización por m² o metro lineal con el precio calculado solo.", href: "/fabricacion-a-medida" },
      { name: "Optimizador de corte", text: "Planchas y perfiles con menos desperdicio.", href: "/fabricacion-a-medida" },
      { name: "Recetas y producción", text: "Órdenes de producción que descuentan los insumos." },
    ],
  },
  {
    title: "Restaurantes",
    icon: Utensils,
    modules: [
      { name: "Salón y comandas", text: "Mesas en vivo y pedidos desde el celular del mozo.", href: "/restaurantes" },
      { name: "Pantalla de cocina", text: "Cada estación ve sus pedidos en orden.", href: "/restaurantes" },
      { name: "Carta digital con QR", text: "El comensal pide y paga desde su mesa.", href: "/restaurantes" },
    ],
  },
  {
    title: "Equipo, equipos e inteligencia artificial",
    icon: Bot,
    modules: [
      { name: "Usuarios y permisos", text: "Roles propios: cada persona ve solo lo que le toca." },
      { name: "Ticketera e impresión", text: "Imprime en tu ticketera térmica desde la tablet o el celular." },
      { name: "Detector de Yape", text: "App Android que confirma tus Yapes en la caja." },
      { name: "Avisos y notificaciones", text: "La campanita y el celular te avisan lo que requiere atención." },
      { name: "Ayuda con IA", text: "Un asistente que te muestra el botón exacto en cada pantalla." },
      { name: "Medidas con IA", text: "Lee las medidas de una foto o un plano.", href: "/fabricacion-a-medida" },
      { name: "API e integraciones", text: "Conecta el ERP con tus otros sistemas (plan Empresarial)." },
    ],
  },
];

export interface ModulePageData {
  slug: string;
  name: string;
  /** Una línea para el menú y las tarjetas */
  navText: string;
  icon: LucideIcon;
  meta: { title: string; description: string };
  hero: {
    title: string;
    lead: string;
    points: string[];
    image?: { src: string; alt: string; width: number; height: number; label: string };
  };
  /** En qué planes viene, bajo los botones del encabezado */
  planNote?: string;
  secondaryCta?: { label: string; href: string; track?: string };
  featuresTitle: string;
  featuresLead?: string;
  features: FeatureItem[];
  /** Secciones adicionales de tarjetas */
  extras?: { title: string; lead?: string; items: FeatureItem[] }[];
  steps?: { title: string; items: { title: string; text: string }[] };
  related: string[];
  rubros?: string[];
  faqs: Faq[];
  closing: { title: string; text: string };
}

const VENDER_IMAGE = {
  src: "/images/landing/erp-vender.webp",
  alt: "Pantalla de venta del ERP con productos y la orden en curso",
  width: 1200,
  height: 750,
  label: "ERP · Vender",
};

const PRODUCTOS_IMAGE = {
  src: "/images/landing/erp-productos.webp",
  alt: "Lista de productos del ERP con categoría, stock, precio y costo",
  width: 1200,
  height: 750,
  label: "ERP · Productos",
};

export const MODULE_PAGES: ModulePageData[] = [
  {
    slug: "punto-de-venta",
    name: "Punto de venta",
    navText: "Ventas, caja y cobros con Yape",
    icon: Monitor,
    meta: {
      title: "Sistema de punto de venta (POS) con Yape y control de caja | Createam",
      description:
        "Punto de venta en la nube para negocios peruanos: vende con lector de código de barras o el celular, cobra con Yape, Plin, tarjeta o efectivo, detecta Yapes falsos, controla tu caja y sigue vendiendo sin internet. Plan gratis hasta por 1 año.",
    },
    hero: {
      title: "Sistema de punto de venta (POS)",
      lead: "Cobra en segundos, sin miedo a los Yapes falsos y con la caja cuadrada cada noche.",
      points: ["Ventas rápidas con código de barras", "Yape verificado, sin capturas falsas", "Sigues vendiendo sin internet"],
      image: VENDER_IMAGE,
    },
    planNote: "Incluido en todos los planes, también en el gratis",
    featuresTitle: "Más ventas por hora, cero descuadres",
    featuresLead: "Pocos toques por venta, aunque haya cola.",
    features: [
      { icon: Zap, title: "Venta rápida", text: "Buscador, botones con tus productos más vendidos y categorías para cobrar en segundos." },
      { icon: ScanBarcode, title: "Lector de código de barras", text: "Con lector USB o con la cámara del celular. Si el producto no existe, lo creas ahí mismo." },
      { icon: CreditCard, title: "Cobra como te paguen", text: "Efectivo con vuelto, Yape, Plin, tarjeta o transferencia, y varios medios en una misma venta." },
      { icon: ShieldCheck, title: "Detector de Yape", text: "Una app Android lee los Yapes que recibes y confirma la venta. Tus vendedores lo ven y lo escuchan: adiós a las capturas falsas." },
      { icon: Calculator, title: "Control de caja", text: "Apertura, ingresos, retiros, arqueo y cierre por turno, con lo vendido por cada medio de pago." },
      { icon: WifiOff, title: "Venta sin internet", text: "Si se cae la conexión sigues vendiendo en efectivo y todo se sincroniza solo al volver." },
      { icon: Monitor, title: "Pantalla del cliente", text: "En un segundo monitor tu cliente ve su compra, el QR de Yape y su vuelto." },
      { icon: Users, title: "Vendedor y cajero", text: "El vendedor arma el pedido y el cajero lo cobra. Cada uno con su usuario y sus permisos." },
      { icon: Coins, title: "Fiado y crédito", text: "Deja lo que falta como deuda del cliente, con tope y plazo, y cóbralo después." },
      { icon: Undo2, title: "Devoluciones y anulaciones", text: "Con motivo y permiso, y la nota de crédito se genera sola." },
      { icon: UserCheck, title: "Cliente por DNI o RUC", text: "Escribe el documento y los datos del cliente se completan solos." },
      { icon: Printer, title: "Ticketera térmica", text: "Tickets de 58 u 80 mm con tu logo y el QR del comprobante, desde la PC, la tablet o el celular, y el cajón se abre solo." },
    ],
    related: ["facturacion-electronica", "inventario", "crm"],
    rubros: ["bodegas-y-minimarkets", "restaurantes"],
    faqs: [
      { question: "¿Tengo que instalar algo?", answer: "No. El ERP funciona en el navegador de la computadora, la tablet o el celular, y se puede instalar como aplicación desde el mismo navegador." },
      {
        question: "¿Qué equipos necesito?",
        answer:
          "Basta una computadora, tablet o celular con internet. Si quieres, sumas un lector de código de barras USB, una ticketera térmica conectada a una PC con Windows y un celular Android para el detector de Yape.",
      },
      {
        question: "¿Qué pasa si se va el internet?",
        answer:
          "Sigues vendiendo en efectivo con un ticket provisional y las ventas se sincronizan solas al volver la conexión. La caja debe estar abierta antes del corte.",
      },
      { question: "¿Puedo emitir boletas y facturas desde el punto de venta?", answer: "Sí, desde el plan Emprendedor: al cobrar eliges boleta o factura y se envía a SUNAT." },
      {
        question: "¿Cuánto cuesta?",
        answer: "Empiezas con el plan gratis, hasta por un año, con un usuario y una caja. Los planes con facturación electrónica empiezan en S/ 19.90 al mes.",
      },
    ],
    closing: { title: "Haz tu primera venta hoy", text: "Crea tu cuenta gratis, carga tus productos y empieza a vender en minutos." },
  },
  {
    slug: "facturacion-electronica",
    name: "Facturación electrónica",
    navText: "Boletas y facturas SUNAT, notas y bajas",
    icon: FileCheck,
    meta: {
      title: "Sistema de facturación electrónica SUNAT: boletas y facturas | Createam",
      description:
        "Emite boletas y facturas electrónicas válidas ante SUNAT desde tu caja, con notas de crédito y débito, resumen diario y comunicación de baja. Envía el comprobante por correo o WhatsApp. Desde S/ 19.90 al mes.",
    },
    hero: {
      title: "Sistema de facturación electrónica SUNAT",
      lead: "Emite boletas y facturas en segundos, directo a SUNAT y sin papeleo.",
      points: ["Boletas y facturas al vender", "Constancia de SUNAT guardada", "Tu cliente lo recibe por WhatsApp"],
      image: VENDER_IMAGE,
    },
    planNote: "Desde el plan Emprendedor, S/ 19.90 al mes",
    featuresTitle: "Todo en regla con SUNAT, sin papeleo",
    features: [
      { icon: Receipt, title: "Boletas y facturas electrónicas", text: "En soles, dólares o euros, con operaciones gravadas, exoneradas, inafectas, gratuitas y de exportación." },
      { icon: CalendarDays, title: "Factura al crédito con cuotas", text: "Indica las cuotas y sus fechas, como pide SUNAT para las ventas al crédito." },
      { icon: FileText, title: "Notas de crédito y débito", text: "Desde el comprobante original. En una devolución, la nota de crédito se genera sola." },
      { icon: ClipboardList, title: "Resumen diario y bajas", text: "El resumen de boletas y la comunicación de baja, con aviso antes de que venza el plazo." },
      { icon: Send, title: "Envío a SUNAT y constancia", text: "Cada comprobante va a SUNAT y guardas su constancia (CDR). Desde el plan Mype, el envío es automático y con reintentos." },
      { icon: MessageSquareText, title: "Comprobante por correo o WhatsApp", text: "Tu cliente recibe el PDF, el XML y la constancia, o el enlace por WhatsApp." },
      { icon: QrCode, title: "Consulta de comprobantes", text: "Quien perdió su comprobante lo busca con sus datos en createam.cloud/comprobantes." },
      { icon: FileSpreadsheet, title: "Registro de ventas en Excel", text: "El registro del mes listo para cuadrarlo con la propuesta del SIRE." },
      { icon: Tags, title: "ICBPER y detracciones", text: "El impuesto a las bolsas por unidad y la detracción indicada en la factura con su porcentaje y cuenta." },
      { icon: Bell, title: "Aviso del certificado digital", text: "Te avisamos antes de que venza tu certificado para que nunca dejes de facturar." },
    ],
    steps: {
      title: "Así emites tu primer comprobante",
      items: [
        { title: "Configuras tu RUC", text: "Cargas tu certificado digital y tus series de boletas y facturas." },
        { title: "Vendes como siempre", text: "Al cobrar eliges boleta o factura y escribes el DNI o el RUC." },
        { title: "Se envía a SUNAT", text: "El ERP firma el comprobante, lo envía y guarda la constancia." },
        { title: "Tu cliente lo recibe", text: "Impreso en la ticketera, por correo o por WhatsApp." },
      ],
    },
    related: ["punto-de-venta", "guias-de-remision", "contabilidad"],
    rubros: ["bodegas-y-minimarkets", "restaurantes", "fabricacion-a-medida"],
    faqs: [
      { question: "¿Necesito certificado digital?", answer: "Sí. El ERP emite con el certificado digital de tu negocio y te avisa antes de que venza." },
      {
        question: "¿Qué comprobantes puedo emitir?",
        answer: "Boletas y facturas electrónicas, notas de crédito y débito, el resumen diario de boletas y la comunicación de baja. Las guías de remisión están en su propio módulo.",
      },
      { question: "¿Cómo recibe mi cliente su comprobante?", answer: "Impreso en tu ticketera, por correo con el PDF, el XML y la constancia, o por WhatsApp con un enlace. También puede buscarlo en línea con sus datos." },
      { question: "¿Puedo anular una factura?", answer: "Sí, con una nota de crédito o con la comunicación de baja dentro del plazo de SUNAT. El ERP te avisa antes de que el plazo venza." },
      { question: "¿Me sirve para el SIRE?", answer: "Descargas el registro de ventas del mes en Excel para cuadrarlo con la propuesta del SIRE." },
      { question: "¿Desde qué plan puedo facturar?", answer: "Desde el plan Emprendedor, a S/ 19.90 al mes. Mype y Empresarial suman el envío automático con reintentos y las notas de débito." },
    ],
    closing: { title: "Empieza a facturar electrónicamente", text: "Crea tu cuenta y te ayudamos a configurar tu certificado y tus series." },
  },
  {
    slug: "guias-de-remision",
    name: "Guías de remisión",
    navText: "Guía de remisión electrónica (GRE) para SUNAT",
    icon: Truck,
    meta: {
      title: "Guía de remisión electrónica (GRE) SUNAT para tus despachos | Createam",
      description:
        "Emite guías de remisión electrónicas aceptadas por SUNAT antes de despachar, a tus clientes o entre tus almacenes, con vehículos, conductores y transportistas guardados y un enlace para compartir la guía.",
    },
    hero: {
      title: "Guía de remisión electrónica (GRE)",
      lead: "Despacha en regla en minutos, sin volver a escribir los datos de tu transporte.",
      points: ["Aceptada por SUNAT antes de salir", "Transportistas guardados", "Traslados entre almacenes"],
    },
    planNote: "Desde el plan Mype",
    featuresTitle: "Tu mercadería sale en regla",
    features: [
      { icon: Truck, title: "Guía de remisión electrónica", text: "La emites desde el ERP y sigues su estado en SUNAT hasta que queda aceptada." },
      { icon: ListChecks, title: "Datos de transporte guardados", text: "Vehículos, conductores y empresas de transporte quedan guardados y se completan solos la próxima vez." },
      { icon: Link2, title: "Enlace para compartir", text: "Cada guía tiene su enlace con el PDF y el XML para el transportista o tu cliente." },
      { icon: Shuffle, title: "Traslados entre almacenes", text: "Mueve varios productos de un almacén a otro con su guía: el traslado se registra completo o no se registra." },
      { icon: Warehouse, title: "Stock al día", text: "El traslado actualiza el inventario de cada almacén al momento." },
    ],
    related: ["inventario", "facturacion-electronica", "punto-de-venta"],
    rubros: ["fabricacion-a-medida", "bodegas-y-minimarkets"],
    faqs: [
      { question: "¿Qué es la guía de remisión electrónica?", answer: "Es el documento que SUNAT exige para trasladar mercadería. Se emite antes de que empiece el traslado y viaja con la carga." },
      { question: "¿Puedo usarla para mover mercadería entre mis almacenes?", answer: "Sí. El ERP registra el traslado entre tus almacenes y emite su guía." },
      { question: "¿Cómo recibe el transportista la guía?", answer: "Con un enlace al PDF y al XML que puedes enviar por WhatsApp o correo." },
      { question: "¿Desde qué plan?", answer: "Las guías de remisión vienen desde el plan Mype, a S/ 29.90 al mes." },
    ],
    closing: { title: "Despacha hoy con tu guía electrónica", text: "Crea tu cuenta y emite tu primera guía de remisión." },
  },
  {
    slug: "inventario",
    name: "Inventario",
    navText: "Almacenes, kárdex, lotes y vencimientos",
    icon: Boxes,
    meta: {
      title: "Sistema de inventario y kárdex con control de vencimientos | Createam",
      description:
        "Control de inventario en la nube: varios almacenes, kárdex con costo promedio, lotes y fechas de vencimiento, tallas y colores, alertas de stock mínimo, compras a proveedores e importación desde Excel.",
    },
    hero: {
      title: "Sistema de inventario y kárdex",
      lead: "Sabe cuánto tienes y cuánto vale, y deja de perder plata por productos vencidos o agotados.",
      points: ["Stock al día en cada almacén", "Alertas antes de que venza", "Compras sugeridas por proveedor"],
      image: PRODUCTOS_IMAGE,
    },
    planNote: "Incluido en todos los planes · varios almacenes desde Mype",
    featuresTitle: "Stock exacto, sin contar a mano",
    features: [
      { icon: Warehouse, title: "Varios almacenes", text: "Tienda, depósito o sucursal, cada uno con su stock, y transferencias entre ellos." },
      { icon: BookOpen, title: "Kárdex y costo promedio", text: "Cada entrada y salida queda registrada, con el costo promedio ponderado al día." },
      { icon: CalendarDays, title: "Lotes y vencimientos", text: "Sale primero lo que vence antes, con aviso diario de lo que está por vencer en soles." },
      { icon: Tags, title: "Liquidación y mermas", text: "Precio de liquidación por lote que la caja aplica sola, y reporte de mermas por vencimiento." },
      { icon: Shirt, title: "Tallas, colores y variantes", text: "Arma la matriz de combinaciones, cada una con su stock, y cárgala desde Excel." },
      { icon: FileSpreadsheet, title: "Importa desde Excel", text: "Carga tus productos desde Excel o CSV, o regístralos escaneando su código." },
      { icon: Bell, title: "Alertas de stock mínimo", text: "Te avisa qué se está acabando antes de que te quedes sin vender." },
      { icon: Lock, title: "Reserva de stock", text: "Aparta productos para un pedido y la reserva vence sola si no se concreta." },
      { icon: Store, title: "El mismo stock en tu tienda online", text: "Tu Catálogo Digital muestra el stock y las fotos de tu inventario.", href: "/catalogo-digital" },
    ],
    extras: [
      {
        title: "Compras y proveedores",
        lead: "Compra con orden, recibe con control y sabe cuánto le debes a cada proveedor.",
        items: [
          { icon: ClipboardList, title: "Órdenes de compra con aprobación", text: "Quien compra pide y quien aprueba autoriza antes de enviarla al proveedor." },
          { icon: PackageSearch, title: "Reposición sugerida", text: "Lo que está bajo el mínimo, agrupado por proveedor con la cantidad sugerida, y la orden en un clic." },
          { icon: Inbox, title: "Recepción parcial", text: "Recibe lo que llegó, con o sin factura: la factura del proveedor puede llegar después." },
          { icon: Landmark, title: "Crédito fiscal", text: "El IGV de la compra se registra aparte y no infla el costo de tus productos." },
          { icon: Banknote, title: "Cuentas por pagar", text: "Lo que debes a cada proveedor y los pagos que le haces." },
        ],
      },
    ],
    related: ["punto-de-venta", "guias-de-remision", "contabilidad"],
    rubros: ["bodegas-y-minimarkets", "fabricacion-a-medida"],
    faqs: [
      { question: "¿Puedo cargar mis productos desde Excel?", answer: "Sí. Importas tus productos desde Excel o CSV, también con tallas y colores, o los registras escaneando su código de barras." },
      { question: "¿Maneja productos con fecha de vencimiento?", answer: "Sí. Registras el lote y la fecha al recibir la compra, sale primero lo que vence antes y te avisa cada día de lo que está por vencer." },
      { question: "¿Cuántos almacenes puedo tener?", answer: "Uno en los planes gratis y Emprendedor. Desde el plan Mype tienes varios almacenes y transferencias entre ellos." },
      { question: "¿Cómo calcula el costo?", answer: "Con el costo promedio ponderado, que se actualiza con cada compra. El IGV de la compra se registra aparte." },
      { question: "¿Se conecta con mi tienda online?", answer: "Sí. Tu Catálogo Digital vive dentro del ERP y muestra el stock y las fotos de tu inventario." },
    ],
    closing: { title: "Ordena tu inventario esta semana", text: "Crea tu cuenta gratis e importa tus productos desde Excel." },
  },
  {
    slug: "contabilidad",
    name: "Contabilidad",
    navText: "Asientos automáticos, libro diario y mayor",
    icon: BookOpen,
    meta: {
      title: "Sistema contable automático para pymes: libro diario y mayor | Createam",
      description:
        "Contabilidad automática para tu negocio: cada venta, compra, cobro y movimiento de caja genera su asiento. Libro diario, mayor por cuenta, resumen del mes con el impuesto a pagar y exportación a Excel para tu contador.",
    },
    hero: {
      title: "Sistema contable para pymes",
      lead: "Cada venta y compra se contabiliza sola. Tu contador recibe los libros listos, sin digitar.",
      points: ["Asientos automáticos", "El impuesto del mes a la vista", "Libros en Excel para tu contador"],
    },
    planNote: "Desde el plan Mype",
    featuresTitle: "La contabilidad al día, sin digitar",
    features: [
      { icon: Workflow, title: "Asientos automáticos", text: "Ventas, compras, cobros, caja e inventario generan su asiento con reglas que puedes ver." },
      { icon: BarChart3, title: "Resumen del mes", text: "Cómo va tu mes, cuánto impuesto vas a pagar y qué falta para cerrar." },
      { icon: BookOpen, title: "Libro diario", text: "Todos los asientos del periodo, con su origen." },
      { icon: Landmark, title: "Plan de cuentas y mayor", text: "El plan de cuentas con el movimiento y el saldo de cada cuenta." },
      { icon: FileSpreadsheet, title: "Exporta a Excel", text: "El libro diario y el balance de comprobación, juntos o por separado, listos para tu contador." },
      { icon: PenLine, title: "Asientos manuales", text: "Registra un ajuste a mano o revierte un asiento cuando lo necesites." },
      { icon: Lock, title: "Cierre de periodo", text: "Cierra el mes para que nadie modifique lo que ya cuadraste." },
      { icon: Receipt, title: "Crédito fiscal de compras", text: "El IGV de tus compras se registra aparte para descontarlo de tu impuesto." },
    ],
    extras: [
      {
        title: "Hecha para trabajar con tu contador",
        items: [
          { icon: KeyRound, title: "Un usuario para tu contador", text: "Crea un rol con acceso solo a contabilidad y reportes." },
          { icon: Users, title: "¿Eres contador?", text: "Lleva la contabilidad de tus clientes desde el ERP y gana con el Programa de Aliados.", href: "/aliados" },
        ],
      },
    ],
    related: ["facturacion-electronica", "inventario", "punto-de-venta"],
    faqs: [
      { question: "¿Reemplaza a mi contador?", answer: "No: le ahorra la digitación. Tu contador recibe los asientos de cada operación y los libros en Excel, y se dedica a revisar y declarar." },
      { question: "¿De dónde salen los asientos?", answer: "De cada venta, compra, cobro, movimiento de caja e inventario. Las reglas que los arman se pueden ver en el módulo." },
      { question: "¿Qué puedo exportar?", answer: "El libro diario y el balance de comprobación en Excel, juntos o por separado." },
      { question: "¿Desde qué plan?", answer: "La contabilidad viene desde el plan Mype, a S/ 29.90 al mes." },
      { question: "Soy contador, ¿puedo usarlo con mis clientes?", answer: "Sí. Conoce el Programa de Aliados: llevas la contabilidad de tus clientes desde el ERP y ganas cada mes." },
    ],
    closing: { title: "Ten tu contabilidad al día cada mes", text: "Crea tu cuenta y mira cómo cada venta arma su asiento." },
  },
  {
    slug: "crm",
    name: "CRM omnicanal",
    navText: "WhatsApp, Instagram, Messenger y Meta Ads",
    icon: MessagesSquare,
    meta: {
      title: "CRM omnicanal: WhatsApp, Instagram, Messenger y Meta Ads en una bandeja | Createam",
      description:
        "CRM para vender por chat: varias líneas de WhatsApp (API oficial y por QR), Instagram, Messenger y leads de Meta Ads en una bandeja compartida, con chatbot, IA, embudo de ventas y cotizaciones desde el chat.",
    },
    hero: {
      title: "CRM omnicanal para WhatsApp, Instagram y Messenger",
      lead: "Todos tus chats y leads en una sola bandeja. Tu equipo responde rápido y no se escapa ninguna venta.",
      points: ["Varias líneas de WhatsApp", "Leads de Meta Ads al instante", "Chatbot e IA fuera de horario"],
    },
    planNote: "Se activa en tu plan del ERP · Te ayudamos a conectar tus canales",
    secondaryCta: { label: "Pedir una demostración", href: "https://wa.me/51945111310", track: "crm_demo" },
    featuresTitle: "Todos tus canales, una sola bandeja",
    featuresLead: "WhatsApp, Instagram y Messenger en el mismo lugar, en tiempo real y sin compartir el celular.",
    features: [
      { icon: MessageCircle, title: "Varias líneas de WhatsApp", text: "Conecta números con la API oficial de Meta o por código QR. Todos llegan a la misma bandeja." },
      { icon: Instagram, title: "Instagram Direct", text: "Responde los mensajes directos de tu cuenta de Instagram sin salir del CRM." },
      { icon: Facebook, title: "Facebook Messenger", text: "Los mensajes de tu página de Facebook llegan junto a tus chats de WhatsApp." },
      { icon: Inbox, title: "Bandeja compartida", text: "Cada asesor ve sus chats; el supervisor ve todos y los reasigna." },
      { icon: Shuffle, title: "Reparto automático", text: "Los clientes nuevos se reparten por turno o según la carga de cada asesor." },
      { icon: Zap, title: "Respuestas rápidas y plantillas", text: "Contesta en segundos con «/» y usa plantillas aprobadas por Meta." },
      { icon: Workflow, title: "Chatbot sin programar", text: "Flujos con editor visual: saluda, pregunta, etiqueta y asigna solo. Se aparta cuando escribe una persona." },
      { icon: Bot, title: "Asistente con IA", text: "Sugiere respuestas, resume chats y atiende fuera de horario. Pasa el chat a tu equipo cuando el cliente quiere comprar." },
      { icon: Siren, title: "Alerta si nadie contesta", text: "Si un cliente espera demasiado, el chat se marca y puede pasar a otro asesor." },
    ],
    extras: [
      {
        title: "Más leads desde tus anuncios",
        lead: "Cada contacto llega con su origen: sabes qué anuncio o qué enlace te trae ventas.",
        items: [
          { icon: Megaphone, title: "Meta Ads", text: "Los formularios de Facebook e Instagram llegan solos al CRM, y sabes de qué anuncio clic a WhatsApp vino cada cliente." },
          { icon: Music2, kicker: "Próximamente", title: "TikTok Ads", text: "Los leads de tus campañas de TikTok, en la misma bandeja." },
          { icon: QrCode, title: "Enlaces y QR con seguimiento", text: "Para tu Instagram, tu local o tus volantes: sabes cuántos clientes trae cada uno." },
          { icon: Link2, title: "Formulario para tu web", text: "Cada mensaje de tu página web llega al CRM como cliente nuevo." },
          { icon: Send, title: "Envíos masivos por WhatsApp", text: "Campañas con plantillas oficiales, con el costo antes de enviar y resultados de leídos, respuestas y ventas." },
          { icon: Coins, title: "Control de costos de Meta", text: "La ventana de 24 horas en cada chat, el costo de cada plantilla y tu presupuesto del mes." },
        ],
      },
      {
        title: "Del chat a la venta",
        lead: "Sigue a cada cliente hasta que compra, con tus productos y tus precios del ERP.",
        items: [
          { icon: Kanban, title: "Embudo de ventas", text: "Tus oportunidades por etapa, con monto y responsable. Arrastra cada una cuando avanza." },
          { icon: ListChecks, title: "Seguimiento automático", text: "Tareas para escribir, llamar, cotizar o cobrar, con recordatorios para que nadie se olvide." },
          { icon: Flame, title: "Leads calientes primero", text: "Cada contacto tiene una calificación de 0 a 100: sabes a quién atender primero." },
          { icon: Receipt, title: "Cotiza desde el chat", text: "Crea la cotización con tus precios del ERP y envíala sin salir de la conversación." },
          { icon: Repeat, title: "El embudo se actualiza solo", text: "Cuando el cliente paga, la oportunidad pasa a «Ganado»." },
          { icon: UserCheck, title: "Ficha con compras y deuda", text: "En cada chat ves cuánto compró y si tiene deuda pendiente." },
          { icon: FileText, title: "Comprobantes por chat", text: "Cotizaciones, comprobantes, guías y garantías salen por tu número y quedan en el chat." },
          { icon: CalendarDays, title: "Citas con recordatorio", text: "Agenda citas y el cliente confirma desde WhatsApp." },
          { icon: Tags, title: "Etiquetas y notas", text: "Clasifica a tus clientes (la IA también etiqueta) y deja notas en su ficha." },
          { icon: BarChart3, title: "Reportes del equipo", text: "Conversión, motivos de pérdida, canales que venden y desempeño por asesor." },
        ],
      },
    ],
    related: ["punto-de-venta", "facturacion-electronica", "ordenes-de-servicio"],
    rubros: ["fabricacion-a-medida", "barberias-salones-y-spas"],
    faqs: [
      {
        question: "¿Qué canales puedo conectar?",
        answer:
          "WhatsApp con varias líneas (con la API oficial de Meta o por código QR), Instagram Direct, Facebook Messenger y los formularios de Meta Ads. TikTok Ads llega pronto.",
      },
      {
        question: "¿Qué diferencia hay entre una línea oficial y una por QR?",
        answer:
          "La línea oficial usa la API de WhatsApp Business de Meta: es la forma aprobada para empresas y permite plantillas y envíos masivos, pero el número deja de usarse en la app del celular. La línea por QR se vincula como WhatsApp Web, sigue funcionando en tu celular y trae reglas para cuidar el número, como topes diarios.",
      },
      { question: "¿Cuántos asesores pueden atender a la vez?", answer: "Todos los usuarios de tu plan. Cada asesor ve sus chats y el supervisor ve todos y puede reasignarlos." },
      {
        question: "¿Cuánto cobra Meta por los mensajes?",
        answer:
          "Meta cobra por las plantillas que envías, según su tarifa vigente. El CRM te muestra el costo antes de enviar y te deja poner un presupuesto mensual para que no haya sorpresas.",
      },
      { question: "¿Tiene chatbot?", answer: "Sí. Armas flujos con un editor visual y, si tu plan lo incluye, un asistente con IA que responde y pasa el chat a una persona cuando hace falta." },
      { question: "¿Puedo enviar mensajes masivos?", answer: "Sí, con plantillas aprobadas por Meta y solo a quien dio su consentimiento. Ves el costo antes de enviar y los resultados después." },
      { question: "¿Necesito ayuda para conectar mis canales?", answer: "Te acompañamos a crear la app de Meta y a conectar tus números, tu Instagram y tu página de Facebook." },
    ],
    closing: { title: "Vende más por chat, con todo tu equipo", text: "Te mostramos el CRM y te ayudamos a conectar tus canales." },
  },
  {
    slug: "ordenes-de-servicio",
    name: "Órdenes de servicio",
    navText: "Servicio técnico, agenda y garantías",
    icon: Wrench,
    meta: {
      title: "Sistema de órdenes de servicio técnico con agenda y garantías | Createam",
      description:
        "Software para talleres y servicio técnico: órdenes de servicio con técnico asignado, diagnóstico, repuestos, fotos y firma, agenda del equipo, garantías con constancia y enlace para que el cliente vea su orden.",
    },
    hero: {
      title: "Sistema de órdenes de servicio técnico",
      lead: "Controla cada trabajo de la recepción a la garantía, sin papeles perdidos ni clientes llamando para preguntar.",
      points: ["Técnico y repuestos en cada orden", "Agenda del equipo", "Garantías con constancia"],
    },
    planNote: "En el plan gratis de servicios y en Empresarial",
    featuresTitle: "Cada trabajo bajo control",
    features: [
      { icon: ClipboardList, title: "Orden de servicio completa", text: "Técnico asignado, diagnóstico, repuestos usados, fotos y firma del cliente." },
      { icon: CalendarDays, title: "Agenda del equipo", text: "El calendario de visitas y trabajos de cada técnico." },
      { icon: Truck, title: "Visitas e instalaciones", text: "Con fecha, responsable, dirección y fotos de evidencia." },
      { icon: Link2, title: "Enlace para el cliente", text: "Tu cliente ve su orden en PDF desde un enlace, sin llamarte." },
      { icon: ShieldCheck, title: "Garantías", text: "Cada garantía con código, cobertura y fecha de vencimiento, y su constancia en PDF con enlace." },
      { icon: Paintbrush, title: "Catálogo de servicios", text: "Tus servicios con su precio para cotizar y cobrar más rápido." },
      { icon: Receipt, title: "Cobro con comprobante", text: "Cobras el servicio con boleta o factura electrónica." },
      { icon: CalendarDays, title: "Reservas online", text: "Si atiendes con cita, OnTurn recibe las reservas y las convierte en órdenes de servicio.", href: "/onturn" },
    ],
    related: ["punto-de-venta", "facturacion-electronica", "crm"],
    rubros: ["fabricacion-a-medida", "barberias-salones-y-spas"],
    faqs: [
      { question: "¿Para qué negocios sirve?", answer: "Para talleres, servicio técnico, instaladores y cualquier negocio que hace trabajos por encargo y necesita seguir cada orden." },
      { question: "¿El cliente puede ver su orden?", answer: "Sí. Le envías un enlace donde ve la orden en PDF, y lo mismo con su garantía." },
      { question: "¿Puedo registrar los repuestos?", answer: "Sí. Los repuestos usados quedan registrados en cada orden, junto con el diagnóstico y las fotos." },
      { question: "¿Cuánto cuesta?", answer: "Hay un plan gratis de servicios para empezar, y el plan Empresarial incluye órdenes, agenda y garantías junto con todo lo demás." },
    ],
    closing: { title: "Organiza tu servicio técnico", text: "Crea tu cuenta gratis y registra tu primera orden de servicio." },
  },
];
