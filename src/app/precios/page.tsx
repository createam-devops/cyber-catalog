import Link from "next/link";
import SwipeRow from "@/components/landing/SwipeRow";
import { CYBERPOS_PLANS, FAQS as HOME_FAQS, LINKS, RESTAURANT_PLANS } from "@/components/landing/content";
import SiteShell from "@/components/site/SiteShell";
import { HeroSky } from "@/components/site/motion";
import { JsonLd, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/components/site/seo";
import { ButtonLink, FaqSection, PlanCard, SectionHeading, container, muted, sectionY, swipeItem } from "@/components/site/ui";
import { PLANS, getYearlyDiscount } from "@/lib/plans";

export const metadata = pageMetadata({
  path: "/precios",
  title: "Precios del ERP, Catálogo Digital y OnTurn en soles | Createam",
  description:
    "Planes en soles y sin permanencia: sistema de ventas con facturación electrónica SUNAT desde S/ 19.90 al mes con plan gratis hasta por 1 año, tienda online con pedidos por WhatsApp y reservas online gratis.",
});

const BREADCRUMBS = [{ name: "Inicio", href: "/" }, { name: "Precios" }];

// Las preguntas de precios de la portada, más las propias de esta página.
const PRICE_FAQS = HOME_FAQS.filter((f) =>
  ["¿Cobran comisión por mis ventas?", "¿Qué pasa cuando termina el periodo gratis?", "¿Cómo se paga?", "¿Puedo tener un plan del ERP a mi medida?"].includes(f.question),
);

const perMonth = (yearlyPrice: number) => (yearlyPrice / 12).toFixed(2);
const card = "rounded-[18px] border border-site-line bg-white p-6";
const priceBig = "font-landing-display text-4xl font-extrabold leading-none";

function ProductHeading({ title, href, note, color }: { title: string; href: string; note: string; color: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
      <h2 className="font-landing-display text-[clamp(24px,2.6vw,30px)] font-extrabold">
        <Link href={href} className={`hover:underline ${color}`}>
          {title}
        </Link>
      </h2>
      <span className={`text-[15px] ${muted}`}>{note}</span>
    </div>
  );
}

export default function PreciosPage() {
  const starter = PLANS.starter;
  const pro = PLANS.pro;
  const maxYearlyDiscount = Math.max(getYearlyDiscount("starter"), getYearlyDiscount("pro"));

  return (
    <SiteShell>
      <JsonLd graph={[breadcrumbJsonLd(BREADCRUMBS), faqJsonLd(PRICE_FAQS)]} />

      <section className="relative isolate overflow-hidden bg-site-ink text-white">
        <HeroSky />
        <div className={`${container} relative flex flex-col gap-4 py-12 sm:py-16`}>
          <h1 className="font-landing-display text-[clamp(36px,5vw,60px)] font-bold leading-[1.04] tracking-[-0.01em] text-site-on-ink">Precios del ERP, Catálogo Digital y OnTurn</h1>
          <p className="max-w-[40em] text-[clamp(17px,1.6vw,20px)] text-site-on-ink-muted">
            En soles, sin permanencia y con plan gratis para empezar. Cambias de plan cuando quieras.
          </p>
        </div>
      </section>

      <div className={`${container} ${sectionY} flex flex-col gap-16`}>
        <section id="erp" className="flex flex-col gap-4">
          <ProductHeading title="ERP" href="/erp" note="Plan gratis hasta por 1 año · Sin tarjeta y sin permanencia" color="text-site-ink" />
          <p className="text-sm text-site-text-faint md:hidden">Desliza para ver más</p>
          <SwipeRow label="Planes del ERP" className="md:flex-wrap md:gap-4">
            {CYBERPOS_PLANS.map((plan) => (
              <PlanCard key={plan.name} plan={plan} accent="cyberpos" className={`${swipeItem} md:flex-[1_1_230px]`} />
            ))}
          </SwipeRow>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={LINKS.cyberposRegister} accent="cyberpos" track="precios_cyberpos_registro">
              Crear cuenta gratis
            </ButtonLink>
            <ButtonLink href="/erp#modulos" variant="outline">
              Ver todos los módulos
            </ButtonLink>
          </div>
        </section>

        <section id="restaurantes" className="flex flex-col gap-4">
          <ProductHeading title="ERP para restaurantes" href="/restaurantes" note="Salón, comandas, cocina y caja" color="text-site-ink" />
          <SwipeRow label="Planes del ERP para restaurantes" className="md:flex-wrap md:gap-4">
            {RESTAURANT_PLANS.map((plan) => (
              <PlanCard key={plan.name} plan={plan} accent="cyberpos" className={`${swipeItem} md:flex-[1_1_300px]`} />
            ))}
          </SwipeRow>
          <p className={`text-[15px] ${muted}`}>
            ¿Quieres verlo funcionando?{" "}
            <a href={LINKS.whatsapp} data-track="whatsapp_restaurante" className="font-bold text-site-ink underline">
              Pide una demostración
            </a>
            .
          </p>
        </section>

        <section id="a-tu-medida" className="flex flex-wrap items-center gap-x-8 gap-y-3.5 rounded-[18px] border border-site-soft-line bg-site-soft px-6 py-[22px]">
          <div className="min-w-0 flex-[1_1_420px]">
            <h2 className="font-landing-body text-xl font-bold text-site-ink">Plan a tu medida</h2>
            <p className="mt-1 text-[15px] text-site-text-muted">
              ¿Vendes productos y servicios, fabricas a medida o quieres sumar inteligencia artificial? Armamos un plan del ERP solo con los módulos que usa tu negocio.
            </p>
          </div>
          <ButtonLink href={LINKS.whatsapp} accent="cyberpos" track="whatsapp_plan_a_medida" className="min-h-[48px]">
            Armar mi plan
          </ButtonLink>
        </section>

        <section id="catalogo" className="flex flex-col gap-4">
          <ProductHeading
            title="Catálogo Digital"
            href="/catalogo-digital"
            note={`Pruébalo gratis · Ahorra hasta ${maxYearlyDiscount}% pagando el año`}
            color="text-site-ink"
          />
          <SwipeRow label="Planes de Catálogo Digital" className="md:grid md:grid-cols-2 md:gap-4">
            <div className={`${card} ${swipeItem} flex flex-col gap-3`}>
              <h3 className="font-landing-body text-lg font-bold">{starter.name}</h3>
              <div>
                <p className={priceBig}>
                  S/ {perMonth(starter.yearlyPrice)}
                  <span className="font-landing-body text-[15px] font-semibold text-site-text-muted"> al mes, pagando el año</span>
                </p>
                <p className="mt-1.5 text-sm text-site-text-muted">
                  S/ {starter.yearlyPrice.toFixed(2)} al año · o S/ {starter.monthlyPrice.toFixed(2)} mes a mes
                </p>
              </div>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] text-site-text-muted">
                <li>
                  Hasta {starter.limits.products} productos y {starter.limits.categories} categorías
                </li>
                <li>{starter.limits.heroSlides} banner de portada</li>
                <li>Dirección tunegocio.createam.cloud</li>
                <li>Pedidos por WhatsApp</li>
              </ul>
            </div>
            <div className={`${swipeItem} flex flex-col gap-3 rounded-[18px] border-2 border-site-ink bg-white p-6`}>
              <h3 className="font-landing-body text-lg font-bold">{pro.name}</h3>
              <div>
                <p className={priceBig}>
                  S/ {perMonth(pro.yearlyPrice)}
                  <span className="font-landing-body text-[15px] font-semibold text-site-text-muted"> al mes, pagando el año</span>
                </p>
                <p className="mt-1.5 text-sm text-site-text-muted">
                  S/ {pro.yearlyPrice.toFixed(2)} al año · o S/ {pro.monthlyPrice.toFixed(2)} mes a mes
                </p>
              </div>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] text-site-text-muted">
                <li>Productos y categorías ilimitados</li>
                <li>Tu propio dominio</li>
                <li>Control de stock</li>
                <li>Redes sociales, SEO y estadísticas</li>
                <li>Hasta {pro.limits.heroSlides} banners de portada</li>
              </ul>
            </div>
          </SwipeRow>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={LINKS.catalogRegister} accent="catalogo" track="precios_catalogo_registro">
              Pruébalo gratis
            </ButtonLink>
          </div>
        </section>

        <section id="onturn" className="flex flex-col gap-4">
          <ProductHeading title="OnTurn" href="/onturn" note="Reservas online para negocios con cita" color="text-site-ink" />
          <div className={`${card} flex flex-wrap items-center gap-x-10 gap-y-4`}>
            <p className={priceBig}>Gratis hasta por 1 año</p>
            <p className={`min-w-0 flex-[1_1_420px] text-[15px] ${muted}`}>
              Registrar tu negocio y recibir reservas no cuesta nada durante ese tiempo. Después, OnTurn cobrará una comisión por reserva; te avisaremos antes de activarla.
            </p>
            <ButtonLink href={LINKS.onturnRegister} accent="onturn" track="precios_onturn_registro">
              Registrar mi negocio
            </ButtonLink>
          </div>
        </section>
      </div>

      <section className="border-y border-site-line bg-white">
        <div className={`${container} py-12 sm:py-16`}>
          <SectionHeading
            title="¿Quieres ganar con el ERP?"
            lead={
              <>
                Si recomiendas el sistema, lo instalas o llevas la contabilidad de tus clientes, puedes cobrar una parte de lo que pagan cada mes.{" "}
                <Link href="/aliados" className="font-bold text-site-ink underline">
                  Conoce el Programa de Aliados
                </Link>
                .
              </>
            }
          />
        </div>
      </section>

      <FaqSection faqs={PRICE_FAQS} />
    </SiteShell>
  );
}
