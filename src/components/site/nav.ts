import { LINKS } from "@/components/landing/content";
import { MODULE_PAGES } from "./data/modules";
import { RUBROS } from "./data/rubros";
import type { Accent } from "./theme";

// Mapa del sitio: lo usan el menú, el pie, el sitemap y llms.txt, así que una
// página nueva se agrega aquí una sola vez.

export interface NavLink {
  name: string;
  href: string;
  text?: string;
  accent?: Accent;
}

export const PRODUCT_LINKS: NavLink[] = [
  { name: "ERP", href: "/erp", text: "Ventas, facturación SUNAT, inventario y más", accent: "cyberpos" },
  { name: "Catálogo Digital", href: "/catalogo-digital", text: "Tienda online con pedidos por WhatsApp", accent: "catalogo" },
  { name: "OnTurn", href: "/onturn", text: "Reservas online para negocios con cita", accent: "onturn" },
];

export const MODULE_LINKS: NavLink[] = MODULE_PAGES.map((m) => ({
  name: m.name,
  href: `/erp/${m.slug}`,
  text: m.navText,
  accent: "cyberpos",
}));

export const RUBRO_LINKS: NavLink[] = RUBROS.map((r) => ({
  name: r.name,
  href: `/${r.slug}`,
  text: r.navText,
  accent: r.accent,
}));

/** Ver todos los módulos y armar un plan a medida, en la página del ERP. */
export const ALL_MODULES_HREF = "/erp#modulos";
export const CUSTOM_PLAN_HREF = "/erp#a-tu-medida";

export const LOGIN_LINKS: NavLink[] = [
  { name: "ERP", href: LINKS.cyberposLogin, accent: "cyberpos" },
  // /ingresar lleva al ingreso del ERP, donde se administra la tienda.
  { name: "Catálogo Digital", href: LINKS.catalogLogin, accent: "catalogo" },
  { name: "OnTurn", href: LINKS.onturnLogin, accent: "onturn" },
  { name: "Portal de aliados", href: LINKS.allyHome, accent: "createam" },
];

/** Todas las páginas públicas del sitio, para el sitemap. */
export const SITE_PAGES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  ...PRODUCT_LINKS.map((l) => ({ path: l.href, priority: 0.9, changeFrequency: "monthly" as const })),
  ...RUBRO_LINKS.map((l) => ({ path: l.href, priority: 0.8, changeFrequency: "monthly" as const })),
  ...MODULE_LINKS.map((l) => ({ path: l.href, priority: 0.7, changeFrequency: "monthly" as const })),
  { path: "/precios", priority: 0.8, changeFrequency: "monthly" },
  { path: "/aliados", priority: 0.7, changeFrequency: "monthly" },
  { path: "/terminos", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacidad", priority: 0.3, changeFrequency: "yearly" },
];
