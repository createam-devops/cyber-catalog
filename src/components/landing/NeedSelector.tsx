"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { LINKS } from "./content";
import { useEdgeFade } from "@/lib/use-edge-fade";
import { FadeSwap } from "@/components/site/motion";

interface Need {
  id: string;
  label: string;
  tag: string;
  tagClass: string;
  title: string;
  text: string;
  price: string;
  priceNote: string;
  cta: { label: string; href: string };
  more: { label: string; href: string };
}

const starterYearlyPerMonth = (PLANS.starter.yearlyPrice / 12).toFixed(2);

const NEEDS: Need[] = [
  {
    id: "redes",
    label: "Vendo por redes sociales",
    tag: "Catálogo Digital",
    tagClass: "bg-site-soft text-site-ink",
    title: "Una tienda propia que cierra la venta por WhatsApp",
    text: "Tu cliente llega desde Instagram, TikTok o Facebook, arma su pedido y te lo envía por WhatsApp listo para cobrar. Sin comisión por venta.",
    price: `Desde S/ ${starterYearlyPerMonth} al mes`,
    priceNote: "Pagando el año · Pruébalo gratis",
    cta: { label: "Crear mi tienda", href: LINKS.catalogRegister },
    more: { label: "Ver cómo funciona", href: "/catalogo-digital" },
  },
  {
    id: "tienda",
    label: "Tengo bodega o tienda",
    tag: "ERP",
    tagClass: "bg-site-soft text-site-ink",
    title: "Ventas, caja, inventario y comprobantes SUNAT en un solo sistema",
    text: "Empiezas con el plan gratis y activas más módulos cuando tu negocio los necesita: compras, almacenes, servicios o producción.",
    price: "Gratis hasta por 1 año",
    priceNote: "Planes de pago desde S/ 19.90 al mes",
    cta: { label: "Crear cuenta gratis", href: LINKS.cyberposRegister },
    more: { label: "Ver la solución para bodegas", href: "/bodegas-y-minimarkets" },
  },
  {
    id: "restaurante",
    label: "Tengo restaurante",
    tag: "ERP para restaurantes",
    tagClass: "bg-site-soft text-site-ink",
    title: "Del salón a la cocina sin papelitos",
    text: "El plan Restaurante cubre mesas, comandas impresas en cocina, caja y comprobantes. El plan Restaurante Inteligente cambia el papel por pantallas: una en la cocina y una en cada mesa.",
    price: "Desde S/ 24.90 al mes",
    priceNote: "Restaurante Inteligente: S/ 49.90 al mes",
    cta: { label: "Pedir una demostración", href: LINKS.whatsapp },
    more: { label: "Ver la solución para restaurantes", href: "/restaurantes" },
  },
  {
    id: "citas",
    label: "Atiendo con cita",
    tag: "OnTurn",
    tagClass: "bg-site-soft text-site-ink",
    title: "Tu agenda llena sin contestar mensajes todo el día",
    text: "Tus clientes reservan a cualquier hora eligiendo servicio, profesional y horario. Tú ves la agenda del día y ellos reciben recordatorios.",
    price: "Gratis hasta por 1 año",
    priceNote: "Se conecta con el ERP para cobrar y emitir boletas",
    cta: { label: "Registrar mi negocio", href: LINKS.onturnRegister },
    more: { label: "Ver cómo funciona", href: "/onturn" },
  },
  {
    id: "fabrico",
    label: "Fabrico a medida",
    tag: "ERP",
    tagClass: "bg-site-soft text-site-ink",
    title: "Cotiza por medidas y corta con menos desperdicio",
    text: "Para vidrierías, carpinterías de melamina y talleres: el precio sale solo con las medidas de cada pedido y el optimizador de corte calcula cuántas planchas y perfiles necesitas.",
    price: "Plan a tu medida",
    priceNote: "Con los módulos que usa tu taller",
    cta: { label: "Pedir una demostración", href: LINKS.whatsapp },
    more: { label: "Ver la solución para fabricación", href: "/fabricacion-a-medida" },
  },
  {
    id: "medida",
    label: "Necesito algo a medida",
    tag: "Desarrollo a medida",
    tagClass: "bg-site-soft text-site-ink-deep",
    title: "Si tu proceso no cabe en un producto, lo construimos",
    text: "El mismo equipo desarrolla software a medida desde 2017: aplicaciones web, aplicaciones móviles e integraciones entre sistemas.",
    price: "Cotización por proyecto",
    priceNote: "Cuéntanos qué necesitas",
    cta: { label: "Conversar por WhatsApp", href: LINKS.whatsapp },
    more: { label: "Conocer createam.io", href: LINKS.custom },
  },
];

export default function NeedSelector() {
  const [selected, setSelected] = useState(NEEDS[0].id);
  const fade = useEdgeFade<HTMLDivElement>("x");
  const need = NEEDS.find((n) => n.id === selected) ?? NEEDS[0];
  // El botón principal es amarillo sol, como en todo el sitio.
  const ctaClass = "inline-flex min-h-[50px] items-center justify-center rounded-full bg-site-accent px-6 font-bold text-site-on-accent transition-colors hover:bg-site-accent-hover";

  return (
    <div>
      {/* En celular los botones van en una sola fila que se desliza de lado, sin salirse del contenedor */}
      <div
        ref={fade.ref}
        style={fade.style}
        role="group"
        aria-label="Tipo de negocio"
        className="mt-7 flex snap-x gap-2.5 overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:none] md:flex-wrap md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {NEEDS.map((n) => (
          <button
            key={n.id}
            type="button"
            aria-pressed={n.id === selected}
            onClick={(event) => {
              setSelected(n.id);
              event.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            }}
            className={`min-h-[48px] shrink-0 snap-start whitespace-nowrap rounded-full border-[1.5px] px-5 text-base font-bold transition-colors ${
              n.id === selected
                ? "border-site-ink bg-site-ink text-white"
                : "border-site-line-strong bg-white text-site-ink hover:border-site-ink"
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      <FadeSwap swapKey={need.id} className="mt-5 flex flex-wrap items-center gap-x-12 gap-y-7 rounded-[22px] border border-site-line bg-white p-6 shadow-[0_12px_32px_rgba(11,27,58,0.06)] sm:p-9">
        <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-3">
          <span className={`self-start rounded-full px-3 py-1 text-[13px] font-bold ${need.tagClass}`}>{need.tag}</span>
          <h3 className="font-landing-display text-[clamp(24px,2.6vw,32px)] font-bold leading-[1.15]">{need.title}</h3>
          <p className="text-site-text-muted">{need.text}</p>
        </div>
        <div className="flex flex-[1_1_250px] flex-col gap-3">
          <div>
            <p className="font-landing-display text-[30px] font-extrabold leading-[1.1]">{need.price}</p>
            <p className="text-[15px] text-site-text-muted">{need.priceNote}</p>
          </div>
          {need.cta.href.startsWith("/") ? (
            <Link href={need.cta.href} data-track={`selector_${need.id}`} className={ctaClass}>
              {need.cta.label}
            </Link>
          ) : (
            <a href={need.cta.href} data-track={`selector_${need.id}`} className={ctaClass}>
              {need.cta.label}
            </a>
          )}
          {need.more.href.startsWith("/") ? (
            <Link href={need.more.href} className="text-[15px] font-semibold text-site-ink underline hover:text-site-ink-deep">
              {need.more.label}
            </Link>
          ) : (
            <a href={need.more.href} className="text-[15px] font-semibold text-site-ink underline hover:text-site-ink-deep">
              {need.more.label}
            </a>
          )}
        </div>
      </FadeSwap>
    </div>
  );
}
