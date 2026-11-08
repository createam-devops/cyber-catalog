import {
  ArrowLeftRight,
  Ban,
  BarChart3,
  Bell,
  BellRing,
  Calculator,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarOff,
  Camera,
  ChefHat,
  Code2,
  Factory,
  FileCheck,
  Globe,
  HandCoins,
  HeartHandshake,
  LayoutGrid,
  ListOrdered,
  Monitor,
  PackageSearch,
  Printer,
  QrCode,
  Receipt,
  Ruler,
  ScanBarcode,
  Scissors,
  Send,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Split,
  Star,
  Tablet,
  Tags,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wallet,
  WifiOff,
  Wrench,
  Zap,
} from "lucide-react";
import { LINKS, RESTAURANT_PLANS } from "@/components/landing/content";
import type { BrandIconName } from "../brand";
import type { Accent } from "../theme";
import type { Faq, FeatureItem, LandingPlanCard } from "../ui";

// Contenido de las páginas por rubro. Cada función anunciada está verificada en
// el código del producto (no se anuncia lo que solo está planeado). Los textos
// usan las palabras con que la gente lo busca en Google.

export interface RubroData {
  slug: string;
  name: string;
  /** Una línea para el menú */
  navText: string;
  accent: Accent;
  /** Ícono propio del rubro */
  glyph: BrandIconName;
  /** Producto con que se resuelve, en la etiqueta del encabezado */
  product: string;
  meta: { title: string; description: string };
  hero: {
    title: string;
    lead: string;
    points: string[];
    image?: { src: string; alt: string; width: number; height: number; label: string };
  };
  primaryCta: { label: string; href: string; track: string };
  secondaryCta?: { label: string; href: string; track?: string };
  note?: string;
  featuresTitle: string;
  featuresLead?: string;
  features: FeatureItem[];
  extra?: { title: string; lead?: string; items: FeatureItem[]; accent?: Accent };
  plans?: { title: string; lead?: string; items: LandingPlanCard[]; footnote?: string };
  /** Páginas de módulos relacionadas (slugs de data/modules.ts) */
  modules?: string[];
  faqs: Faq[];
  closing: { title: string; text: string };
}

const RESTAURANTES: RubroData = {
  slug: "restaurantes",
  name: "Restaurantes",
  navText: "Mesas, comandas, cocina y carta con QR",
  accent: "cyberpos",
  glyph: "restaurantes",
  product: "ERP para restaurantes",
  meta: {
    title: "Sistema para restaurantes con comandas, carta QR y pantalla de cocina | Createam",
    description:
      "Software para restaurantes en Perú: mesas en vivo, comandas desde el celular, carta digital con QR, pantalla de cocina (KDS), dividir la cuenta, propinas y boletas o facturas SUNAT. Desde S/ 24.90 al mes.",
  },
  hero: {
    title: "Sistema para restaurantes",
    lead: "Atiende más mesas, sin comandas perdidas y con la cuenta lista en un toque.",
    points: ["Del celular del mozo a la cocina", "Carta digital con QR", "Cuenta dividida sin calculadora"],
  },
  primaryCta: { label: "Pedir una demostración", href: LINKS.whatsapp, track: "restaurantes_demo" },
  secondaryCta: { label: "Ver los planes", href: "#precios", track: "restaurantes_planes" },
  note: "Desde S/ 24.90 al mes",
  featuresTitle: "Más mesas atendidas, menos errores",
  featuresLead: "Del pedido al comprobante, sin papelitos ni sumas a mano.",
  features: [
    {
      icon: LayoutGrid,
      title: "Mesas en vivo",
      text: "Ve tu salón por zonas: mesas libres, atendiendo o con cuenta pedida, el total de cada una y cuántos minutos lleva.",
    },
    {
      icon: Smartphone,
      title: "Comandas desde el celular",
      text: "El mozo toma el pedido en el celular o la tablet: carta con buscador, opciones con recargo y nota para cocina.",
    },
    {
      icon: Printer,
      title: "Comanda impresa en cocina y barra",
      text: "Cada plato se imprime en su estación, sin precios y solo lo nuevo de cada ronda.",
    },
    {
      icon: ChefHat,
      title: "Pantalla de cocina (KDS)",
      text: "Los pedidos entran solos, con sonido y colores según cuánto esperan: en cola, preparando y listo.",
    },
    {
      icon: Users,
      title: "Comensales y mozo por mesa",
      text: "Abre la mesa con el número de comensales y su mozo responsable. Si el cliente se cambia, mueves la comanda a otra mesa.",
    },
    {
      icon: ShoppingBag,
      title: "Para llevar y delivery",
      text: "Marca la atención como para llevar o delivery, o un solo plato para llevar, y la cocina lo ve en la comanda.",
    },
    {
      icon: Receipt,
      title: "Cuenta a caja con un toque",
      text: "La cuenta pasa a caja, se cobra con boleta o factura electrónica SUNAT y la mesa se libera sola.",
    },
    {
      icon: Split,
      title: "Dividir la cuenta y propinas",
      text: "En caja divides el pago por platos o por porcentaje, agregas propina o descuento y cobras con efectivo, tarjeta, Yape o Plin.",
    },
    {
      icon: UtensilsCrossed,
      title: "Recetas y platos agotados",
      text: "Cada plato descuenta sus insumos al venderse, sabes cuántos te alcanzan y marcas lo agotado del día.",
    },
    {
      icon: Ban,
      title: "Anulaciones con control",
      text: "Anular un plato pide un motivo y solo lo hace quien tiene permiso.",
    },
  ],
  extra: {
    title: "Tus clientes piden y pagan desde la mesa",
    lead: "Con la carta digital, el comensal escanea el QR de su mesa y no necesita descargar nada ni crear una cuenta.",
    items: [
      {
        icon: QrCode,
        title: "Carta digital con QR en cada mesa",
        text: "El comensal ve la carta con fotos y lo agotado, elige sus opciones y envía el pedido a cocina. Después sigue sus platos en vivo.",
      },
      {
        icon: BellRing,
        title: "Llamar al mozo y pedir la cuenta",
        text: "Con un toque desde el celular, y el aviso le llega al personal.",
      },
      {
        icon: Users,
        title: "Mesa compartida",
        text: "Varios celulares en la misma mesa con un código de cuatro dígitos: todos piden a la misma cuenta.",
      },
      {
        icon: Split,
        title: "Dividir la cuenta desde el celular",
        text: "Cada uno paga lo suyo, eligiendo sus platos o en partes iguales, y puede pagar con Yape desde la mesa.",
      },
      {
        icon: Tablet,
        title: "Pantallas interactivas en las mesas",
        text: "Una tablet fija en la mesa con tu bienvenida, los platos destacados y el pedido en curso.",
      },
      {
        icon: Receipt,
        title: "Su pago en el celular",
        text: "El comensal ve en su celular el detalle de lo que pagó y lo descarga en PDF.",
      },
    ],
  },
  plans: {
    title: "Dos planes para tu restaurante",
    lead: "Precio fijo al mes, sin comisión por pedido.",
    items: RESTAURANT_PLANS,
  },
  modules: ["punto-de-venta", "facturacion-electronica", "inventario"],
  faqs: [
    {
      question: "¿Qué equipos necesito?",
      answer:
        "Un celular o una tablet para cada mozo, una televisión o tablet en la cocina para la pantalla de pedidos y la computadora de caja. Si quieres comanda impresa, una ticketera térmica por estación conectada a una PC con Windows.",
    },
    {
      question: "¿Necesito impresora en la cocina?",
      answer: "No es obligatorio: puedes trabajar solo con la pantalla de cocina. Si prefieres papel, cada estación imprime solo sus platos.",
    },
    {
      question: "¿Mis clientes tienen que descargar una aplicación para pedir?",
      answer:
        "No. Escanean el QR de su mesa con la cámara del celular y la carta se abre en el navegador. ERP confirma que están en tu local antes de aceptar el pedido.",
    },
    {
      question: "¿Emite boletas y facturas electrónicas?",
      answer: "Sí. La cuenta se cobra con boleta o factura electrónica enviada a SUNAT, igual que cualquier venta del ERP.",
    },
    {
      question: "¿Puedo dividir la cuenta entre varias personas?",
      answer:
        "Sí. En caja divides el pago por platos o por porcentaje, y con la carta digital cada comensal puede pagar su parte desde su celular.",
    },
    {
      question: "¿Qué diferencia hay entre los dos planes?",
      answer:
        "El plan Restaurante cubre el salón, las comandas, la impresión en cocina y barra, la caja y los comprobantes. Restaurante Inteligente suma la pantalla de cocina por estación y las pantallas interactivas en las mesas.",
    },
  ],
  closing: {
    title: "Mira cómo funcionaría en tu restaurante",
    text: "Te mostramos el salón, las comandas, la carta digital y la pantalla de cocina con tu propia carta.",
  },
};

const BODEGAS: RubroData = {
  slug: "bodegas-y-minimarkets",
  name: "Bodegas y minimarkets",
  navText: "Venta rápida, Yape, vencimientos y boletas",
  accent: "cyberpos",
  glyph: "bodegas",
  product: "ERP",
  meta: {
    title: "Sistema de ventas para bodegas y minimarkets con boletas SUNAT | Createam",
    description:
      "Punto de venta para bodegas y minimarkets: lector de código de barras, boletas electrónicas SUNAT, Yape con detector de pagos, control de vencimientos, fiado y cierre de caja. Plan gratis hasta por 1 año.",
  },
  hero: {
    title: "Sistema de ventas para bodegas y minimarkets",
    lead: "Cobra rápido, evita los Yapes falsos y deja de perder productos vencidos.",
    points: ["Venta con código de barras", "Yape verificado", "Alertas de vencimiento"],
    image: {
      src: "/images/landing/erp-vender.webp",
      alt: "Pantalla de venta del ERP con productos de abarrotes y la orden en curso",
      width: 1200,
      height: 750,
      label: "ERP · Vender",
    },
  },
  primaryCta: { label: "Crear cuenta gratis", href: LINKS.cyberposRegister, track: "bodegas_registro" },
  secondaryCta: { label: "Ver precios", href: "/precios#erp", track: "bodegas_precios" },
  note: "Plan gratis hasta por 1 año · Sin tarjeta y sin permanencia",
  featuresTitle: "Vende rápido y cobra seguro",
  featuresLead: "Una pantalla pensada para la cola de clientes.",
  features: [
    {
      icon: ScanBarcode,
      title: "Lector de código de barras",
      text: "Escanea con un lector USB o con la cámara del celular. Si el producto no existe, lo creas ahí mismo.",
    },
    {
      icon: Zap,
      title: "Ventas rápidas",
      text: "Botones con tus productos más vendidos, buscador y categorías para cobrar en segundos.",
    },
    {
      icon: WifiOff,
      title: "Venta sin internet",
      text: "Si se cae el internet sigues vendiendo en efectivo, y las ventas se sincronizan solas al volver.",
    },
    {
      icon: FileCheck,
      title: "Boletas y facturas SUNAT",
      text: "Boletas y facturas electrónicas, resumen diario y notas de crédito por devoluciones.",
    },
    {
      icon: ShoppingBag,
      title: "Impuesto a las bolsas (ICBPER)",
      text: "El impuesto de la bolsa plástica se cobra aparte y sale en el ticket.",
    },
    {
      icon: ShieldCheck,
      title: "Detector de Yape",
      text: "Una app en tu celular Android lee los Yapes que recibes y confirma la venta. Tus vendedores lo ven y lo escuchan con el código de seguridad: adiós a las capturas falsas.",
    },
    {
      icon: Calculator,
      title: "Cierre de caja",
      text: "Apertura, ingresos, retiros, arqueo y cierre por turno, separando lo vendido, lo cobrado y lo fiado.",
    },
    {
      icon: HandCoins,
      title: "Fiado con control",
      text: "Deja lo que falta como deuda del cliente, con tope y plazo, y cóbralo después en Cobranzas.",
    },
    {
      icon: Monitor,
      title: "Pantalla del cliente",
      text: "En un segundo monitor tu cliente ve su compra, el QR de Yape y su vuelto.",
    },
    {
      icon: Printer,
      title: "Ticketera térmica",
      text: "Tickets de 58 u 80 mm con tu logo y el QR del comprobante, corte de papel y apertura del cajón.",
    },
    {
      icon: Users,
      title: "Varios cajeros",
      text: "Cada usuario con su rol y sus permisos: cajero, vendedor o almacenero.",
    },
  ],
  extra: {
    title: "Tu inventario, sin pérdidas",
    lead: "Lo que vence y lo que se acaba, a la vista antes de que te cueste plata.",
    items: [
      {
        icon: CalendarClock,
        title: "Control de vencimientos por lote",
        text: "Registras la fecha al recibir la compra, sale primero lo que vence antes y cada día te llega el aviso de lo que está por vencer, en soles.",
      },
      {
        icon: Tags,
        title: "Liquida antes de perder",
        text: "Pon un precio de liquidación al lote por vencer y la caja lo aplica sola. Lo vencido se da de baja y queda en el reporte de mermas.",
      },
      {
        icon: PackageSearch,
        title: "Reposición sugerida",
        text: "Lo que está bajo el mínimo, agrupado por proveedor con la cantidad sugerida, y la orden de compra en un clic.",
      },
      {
        icon: Bell,
        title: "Aviso de stock bajo",
        text: "Cada día sabes qué productos se están acabando.",
      },
    ],
  },
  modules: ["punto-de-venta", "facturacion-electronica", "inventario"],
  faqs: [
    {
      question: "¿Cuánto cuesta?",
      answer:
        "Empiezas con el plan gratis, hasta por un año, con punto de venta e inventario. Para emitir boletas y facturas electrónicas, el plan Emprendedor cuesta S/ 19.90 al mes.",
    },
    {
      question: "¿Funciona con mi lector de código de barras?",
      answer: "Sí, con cualquier lector USB que escriba el código y dé Enter. En un celular Android también puedes escanear con la cámara.",
    },
    {
      question: "¿Qué pasa si se va el internet?",
      answer:
        "Sigues vendiendo en efectivo con una nota provisional y las ventas se sincronizan solas cuando vuelve la conexión. La caja debe estar abierta antes del corte; las boletas y los pagos con Yape esperan a que vuelva el internet.",
    },
    {
      question: "¿Cómo funciona el detector de Yape?",
      answer:
        "Instalas la app en el celular Android donde recibes tus Yapes. Cuando llega un pago, ERP lo relaciona con la venta y tus vendedores lo ven en pantalla y lo escuchan con el código de seguridad.",
    },
    {
      question: "¿Qué equipos necesito?",
      answer:
        "Una computadora con Chrome o Edge. Opcionalmente, un lector de código de barras USB, una ticketera térmica conectada a una PC con Windows y un celular Android para el detector de Yape.",
    },
    {
      question: "¿Puedo dar fiado?",
      answer: "Sí. Al cobrar dejas lo que falta como deuda del cliente, con tope y plazo, y lo cobras después desde Cobranzas.",
    },
  ],
  closing: {
    title: "Empieza hoy a vender con el ERP",
    text: "Crea tu cuenta gratis, carga tus productos y haz tu primera venta en minutos.",
  },
};

const FABRICACION: RubroData = {
  slug: "fabricacion-a-medida",
  name: "Fabricación a medida",
  navText: "Vidrierías y melamina: cotización por medidas y corte",
  accent: "cyberpos",
  glyph: "fabricacion",
  product: "ERP",
  meta: {
    title: "Software para vidrierías y melamina: cotización por medidas y optimizador de corte | Createam",
    description:
      "Sistema para negocios que fabrican a medida: cotiza por m² o metro lineal, calcula el precio con tus costos, optimiza el corte de planchas y perfiles, lee medidas de fotos y planos con IA y controla producción, instalación y garantías.",
  },
  hero: {
    title: "Software para vidrierías y melamina",
    lead: "Cotiza en minutos, corta con menos desperdicio y entrega a tiempo.",
    points: ["Precio por m² automático", "Optimizador de corte", "Medidas desde una foto con IA"],
    image: {
      src: "/images/landing/erp-productos.webp",
      alt: "Lista de productos del ERP con categoría, stock, precio y costo",
      width: 1200,
      height: 750,
      label: "ERP",
    },
  },
  primaryCta: { label: "Pedir una demostración", href: LINKS.whatsapp, track: "fabricacion_demo" },
  secondaryCta: { label: "Ver todos los módulos", href: "/erp#modulos", track: "fabricacion_modulos" },
  note: "Plan a tu medida, con los módulos que usa tu taller",
  featuresTitle: "Del presupuesto a la instalación, sin errores",
  featuresLead: "Para vidrierías, carpinterías de melamina, cortinas, aluminio y cualquier taller que cobra por medidas.",
  features: [
    {
      icon: Ruler,
      title: "Productos a medida",
      text: "Medidas del cliente (ancho, alto, hojas), opciones (tipo de vidrio, color, instalación) y piezas con sus descuentos en milímetros, sin escribir fórmulas.",
    },
    {
      icon: Calculator,
      title: "Precio automático con tus costos",
      text: "Materiales más merma, tu porcentaje de ganancia y la mano de obra, con el costo real de tu inventario. Si prefieres, usas tu propia fórmula.",
    },
    {
      icon: Tags,
      title: "Cotización por m² y metro lineal",
      text: "Cotiza por metro lineal, metro cuadrado, perímetro o volumen, en centímetros o milímetros y con tu porcentaje de desperdicio.",
    },
    {
      icon: Scissors,
      title: "Optimizador de corte",
      text: "Cuántas barras o perfiles y cuántas planchas de melamina o vidrio necesitas, con el grosor del disco, el porcentaje de desperdicio y el dibujo del corte.",
    },
    {
      icon: Camera,
      title: "Medidas con inteligencia artificial",
      text: "Sube la foto o el plano del cliente y la IA te propone las medidas para revisar. Los planos de AutoCAD (.dxf) se leen exactos.",
    },
    {
      icon: Send,
      title: "Cotización que el cliente aprueba",
      text: "Envía la cotización en PDF por WhatsApp o correo. El cliente responde «Acepto» desde su celular y te llega el aviso.",
    },
    {
      icon: Factory,
      title: "Órdenes de producción",
      text: "Registras el adelanto, conviertes la cotización en venta y se genera la orden de producción con materiales y costo.",
    },
    {
      icon: Wrench,
      title: "Instalaciones en la agenda",
      text: "Al vender la instalación se crea su orden de servicio con fecha, responsable, dirección, fotos de evidencia y PDF para el cliente.",
    },
    {
      icon: ShieldCheck,
      title: "Garantías",
      text: "Cada garantía con código, cobertura y fecha de vencimiento, y su constancia en PDF con enlace.",
    },
  ],
  extra: {
    title: "Así trabaja tu taller con el ERP",
    items: [
      { icon: Ruler, kicker: "Paso 1", title: "Cotizas con las medidas", text: "Eliges el producto, escribes las medidas o las sacas de una foto, y el precio sale solo." },
      { icon: ArrowLeftRight, kicker: "Paso 2", title: "El cliente acepta", text: "Le llega el enlace por WhatsApp y responde desde su celular." },
      { icon: Factory, kicker: "Paso 3", title: "Fabricas con orden", text: "Con el adelanto se genera la orden de producción y calculas el corte." },
      { icon: CalendarCheck, kicker: "Paso 4", title: "Instalas y entregas", text: "La instalación queda en la agenda y el cliente recibe su garantía." },
    ],
  },
  modules: ["ordenes-de-servicio", "inventario", "facturacion-electronica"],
  faqs: [
    {
      question: "¿Sirve para vidrierías y carpinterías de melamina?",
      answer:
        "Sí. Calcula perfiles y barras en una dimensión y planchas de vidrio o melamina en dos, con el grosor del disco y piezas que pueden girar, y te muestra el dibujo del corte y el desperdicio.",
    },
    {
      question: "¿Tengo que escribir fórmulas?",
      answer:
        "No. Defines las piezas de cada producto con sus descuentos en milímetros, por ejemplo, el ancho de cada hoja es el ancho total entre el número de hojas más 10 mm. Si ya tienes tu fórmula de precio, también puedes usarla.",
    },
    {
      question: "¿Cómo lee las medidas la inteligencia artificial?",
      answer:
        "Subes la foto o el plano y la IA propone las medidas, que el vendedor revisa antes de cotizar. Los archivos .dxf de AutoCAD se leen exactos, sin IA.",
    },
    {
      question: "¿Mi cliente puede aprobar la cotización?",
      answer:
        "Sí. Recibe un enlace por WhatsApp o correo, ve el PDF y responde «Acepto» o «No». Te llega el aviso y tú decides cuándo convertirla en venta.",
    },
    {
      question: "¿Emite boletas y facturas?",
      answer: "Sí. La venta se cobra con boleta o factura electrónica SUNAT, y el adelanto queda registrado como pago.",
    },
    {
      question: "¿Cuánto cuesta?",
      answer: "Lo armamos con los módulos que usa tu taller. Escríbenos por WhatsApp y te preparamos el plan y una demostración.",
    },
  ],
  closing: {
    title: "Cotiza en minutos y corta con menos desperdicio",
    text: "Te mostramos ERP con tus productos y tus medidas.",
  },
};

const BARBERIAS: RubroData = {
  slug: "barberias-salones-y-spas",
  name: "Barberías, salones y spas",
  navText: "Reservas online, agenda y recordatorios",
  accent: "onturn",
  glyph: "barberias",
  product: "OnTurn",
  meta: {
    title: "Sistema de reservas y citas online para barberías, salones y spas | OnTurn",
    description:
      "Agenda online para barberías, salones de belleza y spas: tus clientes reservan las 24 horas, reciben recordatorios de su cita y la aseguran con una seña por Yape o Plin. Gratis hasta por 1 año.",
  },
  hero: {
    title: "Sistema de reservas para barberías, salones y spas",
    lead: "Tu agenda se llena sola, con menos clientes que faltan y sin responder mensajes a medianoche.",
    points: ["Reservas online las 24 horas", "Recordatorios automáticos", "Seña por Yape o Plin"],
    image: {
      src: "/images/landing/onturn-negocio.webp",
      alt: "Página de un negocio en OnTurn con horarios, servicios, equipo y reseñas",
      width: 1100,
      height: 773,
      label: "OnTurn",
    },
  },
  primaryCta: { label: "Registrar mi negocio", href: LINKS.onturnRegister, track: "barberias_registro" },
  secondaryCta: { label: "Ver un negocio de ejemplo", href: "https://beta.onturn.app/barberia-don-juan", track: "barberias_ejemplo" },
  note: "Gratis hasta por 1 año · Sin instalar nada",
  featuresTitle: "Agenda llena, menos inasistencias",
  featuresLead: "Todo lo que necesitas para recibir reservas por internet y ordenar el día de tu equipo.",
  features: [
    {
      icon: CalendarDays,
      title: "Agenda online por profesional",
      text: "Vista del día con una columna por barbero, estilista o terapeuta, y vista de la semana. Las reservas nuevas aparecen solas, sin recargar.",
    },
    {
      icon: Globe,
      title: "Reservas por internet las 24 horas",
      text: "Tu página con servicios, precios, equipo, horario y reseñas. El cliente reserva en tres pasos, sin descargar ninguna app.",
    },
    {
      icon: Bell,
      title: "Recordatorios de citas",
      text: "Un aviso 12, 24 o 48 horas antes y otro opcional el mismo día, con botón para confirmar o cancelar.",
    },
    {
      icon: Wallet,
      title: "Seña para asegurar la cita",
      text: "Pide un monto fijo, un porcentaje o el pago completo por Yape o Plin, a todos o solo a quien ya faltó antes. Si no paga a tiempo, el horario se libera solo.",
    },
    {
      icon: ListOrdered,
      title: "Lista de espera",
      text: "Si el día está lleno, el cliente pide que le avisen. Cuando alguien cancela, el horario se ofrece al primero de la lista.",
    },
    {
      icon: UserPlus,
      title: "Citas para quien llega o llama",
      text: "Anota el turno en segundos con cualquier profesional disponible: OnTurn nunca cruza dos citas del mismo profesional.",
    },
    {
      icon: CalendarOff,
      title: "Horarios, vacaciones y feriados",
      text: "Horario semanal por profesional y bloqueos de todo el día o por horas. Los feriados del país ya vienen cargados.",
    },
    {
      icon: Star,
      title: "Reseñas verificadas",
      text: "Solo opinan clientes que fueron atendidos, y puedes responderles desde tu panel.",
    },
    {
      icon: HeartHandshake,
      title: "Clientes que vuelven",
      text: "Ficha de cada cliente con su historial y notas, y un aviso automático a quien no viene hace más de dos meses.",
    },
    {
      icon: BarChart3,
      title: "Estadísticas de tu negocio",
      text: "Cuántas reservas te trajo OnTurn, citas e ingresos del mes, clientes nuevos y servicios más pedidos.",
    },
    {
      icon: Code2,
      title: "Botón de reservas para tu web",
      text: "Si ya tienes página web o Instagram con enlace, agrega el botón «Reservar» de OnTurn.",
    },
    {
      icon: CalendarCheck,
      title: "Tu equipo con su propio acceso",
      text: "Invita a tu equipo: cada profesional ve solo su agenda y recepción ve la de todos.",
    },
  ],
  extra: {
    title: "Cobra y emite boletas con el ERP",
    lead: "OnTurn se conecta con el ERP, el sistema de ventas de Createam, y usas la misma cuenta en los dos.",
    accent: "cyberpos",
    items: [
      {
        icon: CalendarCheck,
        title: "Cada reserva llega a tu sistema",
        text: "La reserva confirmada aparece en el ERP como orden de servicio con la fecha de la cita.",
      },
      {
        icon: Wallet,
        title: "La seña queda registrada",
        text: "Lo que el cliente adelantó se registra como pago de esa orden.",
      },
      {
        icon: Receipt,
        title: "Boleta electrónica al terminar",
        text: "Cierras la venta en el ERP con boleta o factura enviada a SUNAT.",
      },
    ],
  },
  plans: {
    title: "Gratis hasta por 1 año",
    lead: "Registrar tu negocio y recibir reservas no cuesta nada durante ese tiempo.",
    items: [
      {
        name: "OnTurn",
        price: "S/ 0",
        highlighted: true,
        features: [
          "Reservas online las 24 horas",
          "Agenda por profesional",
          "Recordatorios y lista de espera",
          "Seña por Yape o Plin",
          "Reseñas verificadas",
        ],
      },
    ],
    footnote: "Después del periodo gratis, OnTurn cobrará una comisión por reserva; te avisaremos antes de activarla.",
  },
  modules: ["punto-de-venta", "facturacion-electronica", "ordenes-de-servicio"],
  faqs: [
    {
      question: "¿Mis clientes tienen que descargar una aplicación?",
      answer:
        "No. Reservan desde el navegador del celular o la computadora. Tú puedes instalar el panel de OnTurn en tu celular como una aplicación, desde el mismo navegador.",
    },
    {
      question: "¿Cómo me pagan la seña?",
      answer:
        "Por Yape o Plin, directo a tu número y sin comisión. El cliente escribe el número de operación al reservar y tú lo verificas en tu agenda. Si no paga en el plazo que elegiste, el horario se libera solo.",
    },
    {
      question: "¿Qué hago con los clientes que no llegan?",
      answer:
        "Marcas la cita como «No asistió». Puedes pedir seña solo a quien reserva por primera vez o ya faltó antes, y decidir si la seña se retiene cuando no llega o cancela tarde.",
    },
    {
      question: "¿Puedo tener varios profesionales?",
      answer:
        "Sí. Cada profesional tiene su horario y su columna en la agenda. Al invitarlos eliges si son especialistas (ven solo su agenda) o recepción (ven la de todos).",
    },
    {
      question: "¿Las reservas se confirman solas?",
      answer:
        "Las reservas por internet llegan como pendientes y tú las confirmas; si no lo haces en el plazo que fijaste, las que no tienen seña se cancelan solas. Las citas que anotas tú nacen confirmadas.",
    },
    {
      question: "¿Cuánto cuesta?",
      answer: "Es gratis hasta por un año. Después, OnTurn cobrará una comisión por reserva y te avisaremos antes de activarla.",
    },
    {
      question: "¿Puedo emitir boletas y facturas?",
      answer:
        "Sí, con el ERP de Createam: OnTurn se conecta con él, la cita llega como orden de servicio y cierras la venta con boleta o factura electrónica enviada a SUNAT.",
    },
  ],
  closing: {
    title: "Tu próxima cita puede llegar esta noche",
    text: "Registra tu negocio gratis y comparte tu enlace de reservas en Instagram y WhatsApp.",
  },
};

export const RUBROS: RubroData[] = [RESTAURANTES, BODEGAS, FABRICACION, BARBERIAS];

export function getRubro(slug: string): RubroData {
  const rubro = RUBROS.find((r) => r.slug === slug);
  if (!rubro) throw new Error(`Rubro desconocido: ${slug}`);
  return rubro;
}
