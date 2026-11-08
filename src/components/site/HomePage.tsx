import Link from "next/link";
import NeedSelector from "@/components/landing/NeedSelector";
import SwipeRow from "@/components/landing/SwipeRow";
import { FAQS, LINKS } from "@/components/landing/content";
import { getShowcase } from "@/components/landing/showcase";
import { PLANS } from "@/lib/plans";
import ModuleCatalog from "./ModuleCatalog";
import ProductShowcase from "./ProductShowcase";
import SiteShell from "./SiteShell";
import { RUBROS } from "./data/rubros";
import { IconTile, BrandIcon, type BrandIconName } from "./brand";
import ModuleAssembly from "./ModuleAssembly";
import { ERP_ASSEMBLY } from "./visuals";
import { CountUp, HeroSky, Reveal } from "./motion";
import { ACCENTS } from "./theme";
import { ButtonLink, FaqList, SectionHeading, container, h2Class, muted, sectionY, swipeItem } from "./ui";

const PRODUCTS = [
  {
    accent: "cyberpos" as const,
    glyph: "cyberpos" as BrandIconName,
    name: "ERP",
    kicker: "Ventas, facturación y gestión",
    cta: "Conocer el ERP",
    text: "Punto de venta, facturación electrónica SUNAT, inventario, compras, contabilidad y CRM omnicanal con WhatsApp, Instagram y Messenger. Activas solo los módulos que usas.",
    price: "Plan gratis hasta por 1 año",
    href: "/erp",
  },
  {
    accent: "catalogo" as const,
    glyph: "catalogo" as BrandIconName,
    name: "Catálogo Digital",
    kicker: "Tienda online por WhatsApp",
    cta: "Conocer Catálogo Digital",
    text: "Tu catálogo con fotos, precios y carrito: el cliente arma su pedido y te llega por WhatsApp. Sin comisión por venta.",
    price: `Desde S/ ${(PLANS.starter.yearlyPrice / 12).toFixed(2)} al mes`,
    href: "/catalogo-digital",
  },
  {
    accent: "onturn" as const,
    glyph: "onturn" as BrandIconName,
    name: "OnTurn",
    kicker: "Reservas online con cita",
    cta: "Conocer OnTurn",
    text: "Tus clientes reservan las 24 horas, reciben recordatorios y aseguran la cita con una seña por Yape o Plin.",
    price: "Gratis hasta por 1 año",
    href: "/onturn",
  },
];

export default async function HomePage() {
  const showcase = await getShowcase();

  return (
    <SiteShell>
      <section id="inicio" className="relative isolate overflow-hidden bg-site-ink text-white">
        <HeroSky />
        <div className={`${container} relative flex flex-wrap items-center gap-x-14 gap-y-12 py-14 sm:py-20 lg:py-24`}>
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-6">
            <p className="inline-flex items-center gap-2 self-start rounded-full border border-site-ink-line bg-site-ink-raise px-3.5 py-1.5 text-[13px] font-semibold text-site-on-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-site-accent" />
              Software en la nube para negocios peruanos
            </p>
            <h1 className="font-landing-display text-[clamp(44px,6.4vw,80px)] font-bold leading-[1.0] tracking-[-0.01em] text-site-on-ink">
              El ERP para pymes que crece con tu negocio
            </h1>
            <p className="max-w-[34em] text-[clamp(17px,1.6vw,20px)] text-site-on-ink-muted">
              Empieza con ventas y boletas SUNAT. Suma inventario, contabilidad, tienda online y CRM cuando lo necesites, sin cambiar
              de sistema.
            </p>
            <div className="mt-1 flex flex-wrap gap-3">
              <ButtonLink href="#empezar" className="min-h-[54px] px-7 text-[17px]">
                Elegir mi herramienta
              </ButtonLink>
              <ButtonLink href="/precios" variant="outline-dark" className="min-h-[54px] px-7 text-[17px]">
                Ver precios
              </ButtonLink>
            </div>
            <ul className="mt-1 flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-medium text-site-on-ink-muted">
              {["Gratis hasta por 1 año", "Sin instalar nada", "Sin permanencia"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-site-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 flex-[1_1_440px]">
            <ModuleAssembly spec={ERP_ASSEMBLY} />
          </div>
        </div>
      </section>

      <section id="empezar" className={`${container} scroll-mt-20 pb-10 pt-14 sm:pb-14 sm:pt-20 lg:pt-24`}>
        <div className="flex max-w-[720px] flex-col gap-3">
          <h2 className={h2Class}>¿Qué necesitas resolver?</h2>
          <p className={muted}>Elige tu caso y te decimos con cuál empezar y cuánto cuesta.</p>
        </div>
        <NeedSelector />
      </section>

      <section id="productos" className="scroll-mt-20 border-y border-site-line bg-white">
        <div className={`${container} ${sectionY} flex flex-col gap-9`}>
          <SectionHeading
            title="Todo tu negocio, conectado"
            lead="Tu tienda online vive dentro del ERP y OnTurn se conecta con él: vendes, facturas y agendas con una sola cuenta."
          />
          <p className="text-sm text-site-text-faint md:hidden">Desliza para ver más</p>
          <SwipeRow label="Productos de Createam" className="md:grid md:grid-cols-3 md:gap-4">
            {PRODUCTS.map(({ accent, glyph, name, kicker, text, price, href, cta }, index) => (
              <Reveal key={name} delay={index * 0.08} className={`${swipeItem} md:basis-auto`}>
                <Link
                  href={href}
                  className="group flex h-full flex-col gap-3 rounded-[22px] border border-site-line bg-site-bg p-6 transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(11,27,58,0.12)] motion-reduce:hover:translate-y-0"
                >
                  <IconTile accent={accent} variant="solid" size="lg">
                    <BrandIcon name={glyph} className="h-[26px] w-[26px]" />
                  </IconTile>
                <span className="text-xs font-bold uppercase tracking-wider text-site-text-faint">{kicker}</span>
                <h3 className="font-landing-display text-[28px] font-extrabold leading-none">{name}</h3>
                <p className={`text-[15px] ${muted}`}>{text}</p>
                <p className="mt-auto pt-2 font-bold">{price}</p>
                <span className={`font-bold ${ACCENTS[accent].text}`}>{cta} →</span>
                </Link>
              </Reveal>
            ))}
          </SwipeRow>
        </div>
      </section>

      <section id="rubros" className={`${container} ${sectionY} scroll-mt-20 flex flex-col gap-9`}>
        <SectionHeading title="Listo para tu tipo de negocio" lead="Lo que más usa cada rubro, ya armado y con su precio." />
        <p className="text-sm text-site-text-faint md:hidden">Desliza para ver más</p>
        <SwipeRow label="Soluciones por rubro" className="md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {RUBROS.map((r, index) => (
            <Reveal key={r.slug} delay={(index % 3) * 0.07} className={`${swipeItem} md:basis-auto`}>
            <Link
              href={`/${r.slug}`}
              className="group flex h-full flex-col gap-2 rounded-[20px] border border-site-line bg-white p-6 transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(11,27,58,0.10)] motion-reduce:hover:translate-y-0"
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <IconTile accent={r.accent}>
                  <BrandIcon name={r.glyph} className="h-5 w-5" />
                </IconTile>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ACCENTS[r.accent].tag}`}>{r.product}</span>
              </div>
              <h3 className="font-landing-body text-[19px] font-bold">{r.name}</h3>
              <p className={`text-[15px] ${muted}`}>{r.navText}</p>
              <span className={`mt-auto pt-1 font-bold ${ACCENTS[r.accent].text}`}>Ver la solución →</span>
            </Link>
            </Reveal>
          ))}
          <Reveal delay={0.14} className={`${swipeItem} md:basis-auto`}>
          <Link
            href="/erp#a-tu-medida"
            className="group flex h-full flex-col gap-2 rounded-[20px] border border-site-soft-line bg-site-soft p-6 transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(4,120,87,0.14)] motion-reduce:hover:translate-y-0"
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <IconTile accent="cyberpos" variant="solid">
                <BrandIcon name="medida" className="h-5 w-5" />
              </IconTile>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-site-ink">A tu medida</span>
            </div>
            <h3 className="font-landing-body text-[19px] font-bold text-site-ink">¿Tu negocio es distinto?</h3>
            <p className="text-[15px] text-site-text-muted">
              Ferreterías, farmacias, talleres, distribuidoras o lo que hagas: armamos el ERP con los módulos que tu negocio busca.
            </p>
            <span className="mt-auto pt-1 font-bold text-site-ink">Armar mi plan →</span>
          </Link>
          </Reveal>
        </SwipeRow>
      </section>

      <section id="modulos" className="scroll-mt-20 border-y border-site-line bg-white">
        <div className={`${container} ${sectionY} flex flex-col gap-9`}>
          <SectionHeading
            accent="cyberpos"
            tag="ERP"
            title="Empieza básico, crece hasta completo"
            lead="Además de los rubros de arriba, el ERP se configura para cualquier negocio: activas los módulos que usas, sumas otros cuando creces y, si necesitas algo especial, armamos un plan a tu medida."
          />
          <ModuleCatalog />
          <Reveal className="flex flex-wrap items-center gap-x-8 gap-y-3.5 rounded-[20px] border border-site-soft-line bg-site-soft px-6 py-[22px]">
            <div className="min-w-0 flex-[1_1_420px]">
              <h3 className="font-landing-body text-lg font-bold text-site-ink">Plan a tu medida</h3>
              <p className="mt-1 text-[15px] text-site-text-muted">
                Cuéntanos cómo trabaja tu negocio y te armamos un plan solo con los módulos que usas, con inteligencia artificial si la necesitas.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={LINKS.whatsapp} accent="cyberpos" track="whatsapp_plan_a_medida" className="min-h-[48px]">
                Armar mi plan
              </ButtonLink>
              <ButtonLink href="/erp" variant="outline" className="min-h-[48px]">
                Conocer el ERP
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      {showcase && <ProductShowcase showcase={showcase} />}

      <section className={`${container} ${showcase ? "pb-14 sm:pb-20 lg:pb-24" : sectionY}`}>
        <Reveal className="relative isolate flex flex-wrap items-center gap-x-10 gap-y-6 overflow-hidden rounded-[24px] bg-site-ink-deep p-7 text-white sm:p-10">
          <HeroSky />
          <IconTile accent="createam" size="lg" className="relative">
            <BrandIcon name="aliados" className="h-[26px] w-[26px]" />
          </IconTile>
          <div className="relative min-w-0 flex-[1_1_380px]">
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-site-on-ink">Programa de Aliados</p>
            <h2 className="mt-1 font-landing-display text-[clamp(24px,2.8vw,34px)] font-extrabold leading-[1.12]">¿Trabajas con negocios? Gana cada mes con el ERP</h2>
            <p className="mt-2 text-site-on-ink-muted">
              Técnicos, contadores y vendedores de equipos: recomienda, instala o lleva la contabilidad de tus clientes y cobra una parte de lo que pagan cada mes.
            </p>
          </div>
          <ButtonLink href="/aliados" track="aliados_portada" className="relative">
            Conocer el programa
          </ButtonLink>
        </Reveal>
      </section>

      <section id="precios" className="scroll-mt-20 border-y border-site-line bg-white">
        <div className={`${container} ${sectionY} flex flex-col gap-9`}>
          <SectionHeading title="Precios claros, en soles" lead="Mensualidad fija por producto, sin permanencia. Empiezas gratis en los tres." />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: "ERP", accent: "cyberpos" as const, price: "Gratis", note: "hasta por 1 año · planes desde S/ 19.90 al mes", href: "/precios#erp" },
              {
                name: "Catálogo Digital",
                accent: "catalogo" as const,
                price: `S/ ${(PLANS.starter.yearlyPrice / 12).toFixed(2)}`,
                note: "al mes pagando el año · pruébalo gratis",
                href: "/precios#catalogo",
              },
              { name: "OnTurn", accent: "onturn" as const, price: "Gratis", note: "hasta por 1 año", href: "/precios#onturn" },
            ].map((p) => (
              <Link key={p.name} href={p.href} className="flex flex-col gap-2 rounded-[18px] border border-site-line bg-site-bg p-6 hover:border-site-line-strong">
                <span className={`font-bold ${ACCENTS[p.accent].text}`}>{p.name}</span>
                <span className="font-landing-display text-4xl font-extrabold leading-none">{p.price}</span>
                <span className={`text-[15px] ${muted}`}>{p.note}</span>
              </Link>
            ))}
          </div>
          <ButtonLink href="/precios" variant="outline" className="self-start">
            Ver todos los planes
          </ButtonLink>
        </div>
      </section>

      <section className={`${container} ${sectionY} flex flex-col gap-8`}>
        <SectionHeading
          title="Hecho en Lima, desde 2017"
          lead="Createam es un equipo de Lima que desarrolla software desde 2017. Estas plataformas nacieron de proyectos reales con negocios peruanos."
        />
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {[
            { value: 2017, suffix: "", label: "Año en que empezamos" },
            { value: 150, suffix: "+", label: "Proyectos entregados" },
            { value: 3, suffix: "", label: "Plataformas propias en la nube" },
          ].map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.08} className="rounded-[20px] border border-site-line bg-white p-3.5 sm:p-6">
              <p className="font-landing-display text-[28px] font-extrabold leading-none text-site-ink sm:text-[44px]">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-[13px] leading-snug text-site-text-muted sm:text-[15px]">{stat.label}</p>
            </Reveal>
          ))}
        </div>
        <SwipeRow label="Negocios que usan las plataformas" className="md:grid md:grid-cols-3 md:gap-4">
          <div className={`${swipeItem} flex flex-col gap-2 rounded-[18px] border border-site-line bg-white p-6 md:basis-auto`}>
            <span className="self-start rounded-full bg-site-soft px-2.5 py-1 text-xs font-bold text-site-ink">Catálogo Digital</span>
            <h3 className="font-landing-body text-[19px] font-bold">Tienda de regalos personalizados</h3>
            <p className={`text-[15px] ${muted}`}>Vende por redes sociales con envíos a todo el Perú y recibe por WhatsApp los pedidos de su catálogo.</p>
          </div>
          <div className={`${swipeItem} flex flex-col gap-2 rounded-[18px] border border-site-line bg-white p-6 md:basis-auto`}>
            <span className="self-start rounded-full bg-site-soft px-2.5 py-1 text-xs font-bold text-site-ink">ERP</span>
            <h3 className="font-landing-body text-[19px] font-bold">Vidriería y venta de accesorios</h3>
            <p className={`text-[15px] ${muted}`}>Gestiona su operación diaria con el ERP.</p>
          </div>
          <div className={`${swipeItem} flex flex-col gap-2 rounded-[18px] border border-site-line bg-white p-6 md:basis-auto`}>
            <span className="self-start rounded-full bg-site-soft px-2.5 py-1 text-xs font-bold text-site-ink">OnTurn</span>
            <h3 className="font-landing-body text-[19px] font-bold">Barberías, spas y consultorios</h3>
            <p className={`text-[15px] ${muted}`}>OnTurn está en beta con sus primeros locales.</p>
          </div>
        </SwipeRow>
      </section>

      <section id="preguntas" className={`mx-auto w-full max-w-[860px] scroll-mt-20 px-5 sm:px-8 lg:px-10 ${sectionY} pt-0 sm:pt-0 lg:pt-0`}>
        <h2 className={`${h2Class} mb-5`}>Preguntas frecuentes</h2>
        <FaqList faqs={FAQS} />
      </section>
    </SiteShell>
  );
}
