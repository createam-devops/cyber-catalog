// Qué piezas se acoplan en la animación modular de cada página (ModuleAssembly).
// La idea de la marca: el ERP empieza básico y se vuelve completo sumando piezas.
// Solo datos (texto y nombres de ícono) para poder pasarlos al componente de cliente.

export type PieceIcon =
  | "ventas" | "sunat" | "inventario" | "compras" | "contabilidad" | "crm" | "tienda" | "reservas" | "reportes"
  | "guias" | "caja" | "yape" | "vencimientos" | "reposicion" | "fiado" | "salon" | "comandas" | "cocina" | "qr"
  | "recetas" | "cotizador" | "precio" | "corte" | "ia" | "produccion" | "instalacion" | "garantia" | "agenda"
  | "recordatorio" | "senas" | "espera" | "resenas" | "clientes" | "carrito" | "whatsapp" | "dominio" | "seo"
  | "instagram" | "messenger" | "metaads" | "tiktok" | "embudo" | "chatbot" | "negocio" | "restaurante" | "taller"
  | "farmacia" | "ferreteria" | "barberia" | "minimarket" | "comision";

export interface AssemblySpec {
  /** Nombre del núcleo: «Tu ERP», «Tu tienda», «Tu cartera»… */
  core: string;
  /** Hasta 8 piezas, en el orden en que se acoplan */
  pieces: { label: string; icon: PieceIcon }[];
  /** Cuántas vienen acopladas desde el inicio (el plan básico) */
  base?: number;
  /** Pieza que se destaca (la de la página) */
  highlight?: number;
  /** Nivel según cuántas piezas hay: pocas, medio, todas */
  levels?: [string, string, string];
  /** Qué se cuenta: «módulos», «negocios»… */
  countLabel?: string;
}

const ERP_PIECES: AssemblySpec["pieces"] = [
  { label: "Ventas y caja", icon: "ventas" },
  { label: "Boletas SUNAT", icon: "sunat" },
  { label: "Inventario", icon: "inventario" },
  { label: "CRM omnicanal", icon: "crm" },
  { label: "Contabilidad", icon: "contabilidad" },
  { label: "Tienda online", icon: "tienda" },
  { label: "Compras", icon: "compras" },
  { label: "Reportes", icon: "reportes" },
];

export const ERP_ASSEMBLY: AssemblySpec = { core: "Tu ERP", pieces: ERP_PIECES, base: 2 };

/** El ERP con una pieza destacada al centro de la página de ese módulo. */
function withHighlight(first: { label: string; icon: PieceIcon }, rest: AssemblySpec["pieces"]): AssemblySpec {
  return { core: "Tu ERP", pieces: [first, ...rest.filter((p) => p.icon !== first.icon)].slice(0, 8), base: 1, highlight: 0 };
}

export const MODULE_ASSEMBLY: Record<string, AssemblySpec> = {
  "punto-de-venta": withHighlight({ label: "Punto de venta", icon: "ventas" }, [
    { label: "Caja", icon: "caja" },
    { label: "Yape seguro", icon: "yape" },
    ...ERP_PIECES,
  ]),
  "facturacion-electronica": withHighlight({ label: "Boletas y facturas", icon: "sunat" }, [
    { label: "Guías de remisión", icon: "guias" },
    ...ERP_PIECES,
  ]),
  "guias-de-remision": withHighlight({ label: "Guías de remisión", icon: "guias" }, ERP_PIECES),
  inventario: withHighlight({ label: "Inventario y kárdex", icon: "inventario" }, [
    { label: "Vencimientos", icon: "vencimientos" },
    { label: "Reposición", icon: "reposicion" },
    ...ERP_PIECES,
  ]),
  contabilidad: withHighlight({ label: "Contabilidad", icon: "contabilidad" }, ERP_PIECES),
  crm: {
    core: "Tu CRM",
    pieces: [
      { label: "WhatsApp", icon: "whatsapp" },
      { label: "Instagram", icon: "instagram" },
      { label: "Messenger", icon: "messenger" },
      { label: "Meta Ads", icon: "metaads" },
      { label: "Embudo", icon: "embudo" },
      { label: "Chatbot e IA", icon: "chatbot" },
      { label: "Cotizaciones", icon: "sunat" },
      { label: "TikTok Ads", icon: "tiktok" },
    ],
    base: 1,
    levels: ["Empiezas", "Varios canales", "Omnicanal"],
    countLabel: "conexiones",
  },
  "ordenes-de-servicio": withHighlight({ label: "Órdenes de servicio", icon: "instalacion" }, [
    { label: "Agenda", icon: "agenda" },
    { label: "Garantías", icon: "garantia" },
    ...ERP_PIECES,
  ]),
};

export const RUBRO_ASSEMBLY: Record<string, AssemblySpec> = {
  restaurantes: {
    core: "Tu restaurante",
    pieces: [
      { label: "Salón", icon: "salon" },
      { label: "Comandas", icon: "comandas" },
      { label: "Cocina", icon: "cocina" },
      { label: "Caja", icon: "caja" },
      { label: "Carta con QR", icon: "qr" },
      { label: "Boletas SUNAT", icon: "sunat" },
      { label: "Recetas", icon: "recetas" },
      { label: "Reportes", icon: "reportes" },
    ],
    base: 2,
  },
  "bodegas-y-minimarkets": {
    core: "Tu bodega",
    pieces: [
      { label: "Ventas rápidas", icon: "ventas" },
      { label: "Caja", icon: "caja" },
      { label: "Yape seguro", icon: "yape" },
      { label: "Boletas SUNAT", icon: "sunat" },
      { label: "Vencimientos", icon: "vencimientos" },
      { label: "Reposición", icon: "reposicion" },
      { label: "Fiado", icon: "fiado" },
      { label: "Reportes", icon: "reportes" },
    ],
    base: 2,
  },
  "fabricacion-a-medida": {
    core: "Tu taller",
    pieces: [
      { label: "Cotizador", icon: "cotizador" },
      { label: "Precio por m²", icon: "precio" },
      { label: "Corte", icon: "corte" },
      { label: "Medidas con IA", icon: "ia" },
      { label: "Producción", icon: "produccion" },
      { label: "Instalación", icon: "instalacion" },
      { label: "Garantías", icon: "garantia" },
      { label: "Boletas SUNAT", icon: "sunat" },
    ],
    base: 2,
  },
  "barberias-salones-y-spas": {
    core: "Tu agenda",
    pieces: [
      { label: "Reservas 24 h", icon: "reservas" },
      { label: "Agenda", icon: "agenda" },
      { label: "Recordatorios", icon: "recordatorio" },
      { label: "Señas Yape", icon: "senas" },
      { label: "Lista de espera", icon: "espera" },
      { label: "Reseñas", icon: "resenas" },
      { label: "Clientes", icon: "clientes" },
      { label: "Boletas SUNAT", icon: "sunat" },
    ],
    base: 2,
  },
};

export const ONTURN_ASSEMBLY: AssemblySpec = { ...RUBRO_ASSEMBLY["barberias-salones-y-spas"], core: "OnTurn" };

export const CATALOG_ASSEMBLY: AssemblySpec = {
  core: "Tu tienda",
  pieces: [
    { label: "Catálogo", icon: "tienda" },
    { label: "Pedido por WhatsApp", icon: "whatsapp" },
    { label: "Carrito", icon: "carrito" },
    { label: "Tu dominio", icon: "dominio" },
    { label: "Google", icon: "seo" },
    { label: "Stock", icon: "inventario" },
    { label: "Boletas SUNAT", icon: "sunat" },
    { label: "CRM omnicanal", icon: "crm" },
  ],
  base: 2,
};

export const ALLY_ASSEMBLY: AssemblySpec = {
  core: "Tu cartera",
  pieces: [
    { label: "Bodega", icon: "minimarket" },
    { label: "Restaurante", icon: "restaurante" },
    { label: "Taller", icon: "taller" },
    { label: "Ferretería", icon: "ferreteria" },
    { label: "Barbería", icon: "barberia" },
    { label: "Farmacia", icon: "farmacia" },
    { label: "Tienda", icon: "negocio" },
    { label: "Vidriería", icon: "cotizador" },
  ],
  base: 1,
  levels: ["Empiezas", "Creciendo", "Tu patrimonio"],
  countLabel: "clientes",
};

export const PRICING_ASSEMBLY: AssemblySpec = ERP_ASSEMBLY;
