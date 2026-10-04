"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS, TRIAL_DAYS } from "@/lib/plans";
import { LINKS } from "./content";

interface Need {
  id: string;
  label: string;
  tag: string;
  tagClass: string;
  title: string;
  text: string;
  price: string;
  priceNote: string;
  cta: { label: string; href: string; className: string };
  more: { label: string; href: string };
}

const starterYearlyPerMonth = (PLANS.starter.yearlyPrice / 12).toFixed(2);

const NEEDS: Need[] = [
  {
    id: "redes",
    label: "Vendo por redes sociales",
    tag: "Catálogo Digital",
    tagClass: "bg-[#F7E3F9] text-[#7A1485]",
    title: "Una tienda propia que cierra la venta por WhatsApp",
    text: "Tu cliente llega desde Instagram, TikTok o Facebook, arma su pedido y te lo envía por WhatsApp listo para cobrar. Sin comisión por venta.",
    price: `Desde S/ ${starterYearlyPerMonth} al mes`,
    priceNote: `Pagando el año · ${TRIAL_DAYS} días gratis para probar`,
    cta: { label: "Crear mi tienda", href: LINKS.catalogRegister, className: "bg-[#A21CAF]" },
    more: { label: "Ver cómo funciona", href: "#catalogo" },
  },
  {
    id: "tienda",
    label: "Tengo bodega o tienda",
    tag: "CyberPOS",
    tagClass: "bg-[#DDF3EA] text-[#065F46]",
    title: "Ventas, caja, inventario y comprobantes SUNAT en un solo sistema",
    text: "Empiezas con el plan gratis y activas más módulos cuando tu negocio los necesita: compras, almacenes, servicios o producción.",
    price: "Gratis hasta por 1 año",
    priceNote: "Planes de pago desde S/ 19.90 al mes",
    cta: { label: "Crear cuenta gratis", href: LINKS.cyberposRegister, className: "bg-[#047857]" },
    more: { label: "Ver qué incluye", href: "#cyberpos" },
  },
  {
    id: "restaurante",
    label: "Tengo restaurante",
    tag: "CyberPOS Restaurante",
    tagClass: "bg-[#DDF3EA] text-[#065F46]",
    title: "Del salón a la cocina sin papelitos",
    text: "El plan Restaurante cubre mesas, comandas impresas en cocina, caja y comprobantes. El plan Restaurante Inteligente cambia el papel por pantallas: una en la cocina y una en cada mesa.",
    price: "Desde S/ 24.90 al mes",
    priceNote: "Restaurante Inteligente: S/ 49.90 al mes",
    cta: { label: "Pedir una demostración", href: LINKS.whatsapp, className: "bg-[#047857]" },
    more: { label: "Ver los dos planes", href: "#cyberpos" },
  },
  {
    id: "citas",
    label: "Atiendo con cita",
    tag: "OnTurn",
    tagClass: "bg-[#D9F0ED] text-[#00574F]",
    title: "Tu agenda llena sin contestar mensajes todo el día",
    text: "Tus clientes reservan a cualquier hora eligiendo servicio, profesional y horario. Tú ves la agenda del día y ellos reciben recordatorios.",
    price: "Gratis hasta por 1 año",
    priceNote: "Incluye un CyberPOS básico",
    cta: { label: "Registrar mi negocio", href: LINKS.onturnRegister, className: "bg-[#007A70]" },
    more: { label: "Ver cómo funciona", href: "#onturn" },
  },
  {
    id: "medida",
    label: "Necesito algo a medida",
    tag: "Desarrollo a medida",
    tagClass: "bg-[#E1ECFA] text-[#0F3281]",
    title: "Si tu proceso no cabe en un producto, lo construimos",
    text: "El mismo equipo desarrolla software a medida desde 2017: aplicaciones web, aplicaciones móviles e integraciones entre sistemas.",
    price: "Cotización por proyecto",
    priceNote: "Cuéntanos qué necesitas",
    cta: { label: "Conversar por WhatsApp", href: LINKS.whatsapp, className: "bg-[#1357AD]" },
    more: { label: "Conocer createam.io", href: LINKS.custom },
  },
];

export default function NeedSelector() {
  const [selected, setSelected] = useState(NEEDS[0].id);
  const need = NEEDS.find((n) => n.id === selected) ?? NEEDS[0];
  const ctaClass = `inline-flex min-h-[50px] items-center justify-center rounded-xl px-6 font-bold text-white transition-opacity hover:opacity-90 ${need.cta.className}`;

  return (
    <div>
      <div role="group" aria-label="Tipo de negocio" className="mt-7 flex flex-wrap gap-2.5">
        {NEEDS.map((n) => (
          <button
            key={n.id}
            type="button"
            aria-pressed={n.id === selected}
            onClick={() => setSelected(n.id)}
            className={`min-h-[48px] rounded-full border-[1.5px] px-5 text-base font-bold transition-colors ${
              n.id === selected
                ? "border-[#0B1B3A] bg-[#0B1B3A] text-white"
                : "border-[#C5D0E3] bg-white text-[#0B1B3A] hover:border-[#0B1B3A]"
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-12 gap-y-7 rounded-[22px] border border-[#DDE4F0] bg-white p-6 sm:p-9">
        <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-3">
          <span className={`self-start rounded-full px-3 py-1 text-[13px] font-bold ${need.tagClass}`}>{need.tag}</span>
          <h3 className="font-landing-display text-[clamp(24px,2.6vw,32px)] font-bold leading-[1.15]">{need.title}</h3>
          <p className="text-[#3D4B66]">{need.text}</p>
        </div>
        <div className="flex flex-[1_1_250px] flex-col gap-3">
          <div>
            <p className="font-landing-display text-[30px] font-extrabold leading-[1.1]">{need.price}</p>
            <p className="text-[15px] text-[#3D4B66]">{need.priceNote}</p>
          </div>
          {need.cta.href.startsWith("/") ? (
            <Link href={need.cta.href} className={ctaClass}>
              {need.cta.label}
            </Link>
          ) : (
            <a href={need.cta.href} className={ctaClass}>
              {need.cta.label}
            </a>
          )}
          <a href={need.more.href} className="text-[15px] font-semibold text-[#1357AD] underline hover:text-[#0F3281]">
            {need.more.label}
          </a>
        </div>
      </div>
    </div>
  );
}
