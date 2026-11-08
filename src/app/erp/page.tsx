import Image from "next/image";
import Link from "next/link";
import { Bot, CalendarCheck, Camera, Handshake, MessagesSquare, Plug, Store } from "lucide-react";
import SwipeRow from "@/components/landing/SwipeRow";
import { CYBERPOS_PLANS, FAQS as HOME_FAQS, LINKS } from "@/components/landing/content";
import { getShowcase } from "@/components/landing/showcase";
import ModuleCatalog from "@/components/site/ModuleCatalog";
import ProductShowcase from "@/components/site/ProductShowcase";
import SiteShell from "@/components/site/SiteShell";
import { ERP_ASSEMBLY } from "@/components/site/visuals";
import { IconTile, BrandIcon } from "@/components/site/brand";
import { MODULE_PAGES } from "@/components/site/data/modules";
import { RUBROS } from "@/components/site/data/rubros";
import { JsonLd, ORGANIZATION_ID, SITE_URL, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/components/site/seo";
import { ACCENTS } from "@/components/site/theme";
import {
  ButtonLink,
  CtaBand,
  FaqSection,
  FeatureCards,
  PageHero,
  PlanCard,
  ScreenFrame,
  SectionHeading,
  container,
  muted,
  sectionY,
  swipeItem,
  type Faq,
} from "@/components/site/ui";

// «Equipos para tu punto de venta» lee la tienda de Createam en cada visita, como la portada.
export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  path: "/erp",
  title: "ERP para negocios peruanos: punto de venta y facturación electrónica SUNAT | Createam",
  description:
    "Sistema de ventas y ERP para negocios peruanos que se arma por módulos: punto de venta, facturación electrónica SUNAT, guías de remisión, inventario, compras, contabilidad y CRM omnicanal con WhatsApp, Instagram y Messenger. Plan gratis hasta por 1 año.",
});

const BREADCRUMBS = [{ name: "Inicio", href: "/" }, { name: "ERP" }];

const FAQS: Faq[] = [
  ...HOME_FAQS.filter((f) => ["¿El ERP emite comprobantes electrónicos?", "¿Puedo tener un plan del ERP a mi medida?"].includes(f.question)),
  {
    question: "¿Qué es un ERP?",
    answer:
      "Un ERP junta en un solo sistema las ventas, el inventario, las compras, las finanzas y la contabilidad. El nuestro empieza como punto de venta y, en la misma cuenta, suma esos módulos cuando tu negocio los necesita.",
  },
  {
    question: "¿Funciona en el celular?",
    answer: "Sí. Funciona en el navegador de la computadora, la tablet o el celular, y se puede instalar como aplicación desde el mismo navegador.",
  },
  {
    question: "¿Puedo migrar mis productos?",
    answer: "Sí. Importas tus productos desde Excel o CSV, con sus precios, stock, tallas y colores.",
  },
  {
    question: "¿Hay contrato de permanencia?",
    answer: "No. Pagas mes a mes desde tu cuenta del ERP y cambias de plan cuando quieras.",
  },
];

export default async function CyberPosPage() {
  const showcase = await getShowcase();

  return (
    <SiteShell cta={{ label: "Crear cuenta gratis", href: LINKS.cyberposRegister, track: "cyberpos_cabecera" }}>
      <JsonLd
        graph={[
          breadcrumbJsonLd(BREADCRUMBS),
          {
            "@type": "SoftwareApplication",
            "@id": `${SITE_URL}/erp#app`,
            name: "ERP de Createam",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: `${SITE_URL}/erp`,
            description:
              "Sistema de ventas modular para negocios peruanos: punto de venta y caja, facturación electrónica y guías de remisión a SUNAT, inventario, compras, contabilidad, CRM omnicanal con WhatsApp, Instagram y Messenger y tienda online.",
            featureList: MODULE_PAGES.map((m) => m.name),
            offers: { "@type": "Offer", price: "0", priceCurrency: "PEN", description: "Plan gratis hasta por 1 año" },
            publisher: { "@id": ORGANIZATION_ID },
          },
          faqJsonLd(FAQS),
        ]}
      />

      <PageHero
        accent="cyberpos"
        tag="ERP"
        badge={
          <IconTile accent="cyberpos" variant="solid" size="lg">
            <BrandIcon name="cyberpos" className="h-[26px] w-[26px]" />
          </IconTile>
        }
        breadcrumbs={BREADCRUMBS}
        title="Sistema ERP para pymes en Perú"
        lead="Empieza con ventas y boletas. Suma inventario, contabilidad, CRM y más cuando crezcas, sin cambiar de sistema."
        points={["De básico a completo, a tu ritmo", "Plan gratis hasta por 1 año", "Sin tarjeta y sin permanencia"]}
        actions={
          <>
            <ButtonLink href={LINKS.cyberposRegister} accent="cyberpos" track="cyberpos_registro">
              Crear cuenta gratis
            </ButtonLink>
            <ButtonLink href="/precios#erp" variant="outline-dark">
              Ver precios
            </ButtonLink>
          </>
        }
        visual={ERP_ASSEMBLY}
      />

      <section className={`${container} ${sectionY} flex flex-col gap-9`}>
        <SectionHeading title="Los módulos más usados" lead="Cada uno tiene su página con todo lo que hace." />
        <FeatureCards
          accent="cyberpos"
          label="Módulos destacados del ERP"
          columns={4}
          items={MODULE_PAGES.map((m) => ({ icon: m.icon, title: m.name, text: m.navText, href: `/erp/${m.slug}` }))}
        />
      </section>

      <section className="border-t border-site-line bg-white">
        <div className={`${container} ${sectionY} flex flex-wrap items-center gap-x-14 gap-y-9`}>
          <SectionHeading className="flex-[1_1_320px]" title="Así se ve en tu pantalla" lead="Funciona en la computadora, la tablet o el celular, sin instalar nada." />
          <div className="min-w-0 flex-[1_1_520px]">
            <ScreenFrame label="ERP · Productos">
              <Image
                src="/images/landing/erp-productos.webp"
                alt="Lista de productos del ERP con categoría, stock, precio y costo"
                width={1200}
                height={750}
                sizes="(min-width: 1024px) 620px, 92vw"
                className="block h-auto w-full"
              />
            </ScreenFrame>
          </div>
        </div>
      </section>

      <section id="modulos" className="scroll-mt-20 border-y border-site-line bg-white">
        <div className={`${container} ${sectionY} flex flex-col gap-9`}>
          <SectionHeading
            title="Todo lo que puedes sumar"
            lead="Tu plan trae los que usa tu negocio. Los demás los activas cuando los necesites, en la misma cuenta y con los mismos productos."
          />
          <ModuleCatalog />
        </div>
      </section>

      <section id="a-tu-medida" className={`${container} ${sectionY} scroll-mt-20 flex flex-col gap-9`}>
        <SectionHeading
          title="¿Tu negocio es distinto? Lo armamos a tu medida"
          lead="Si vendes productos y servicios, fabricas por encargo o tienes un proceso propio, configuramos un plan solo con los módulos que usas. Y si lo necesitas, le sumamos inteligencia artificial."
        />
        <FeatureCards
          accent="cyberpos"
          label="Inteligencia artificial en el ERP"
          items={[
            { icon: Bot, title: "Ayuda con IA en cada pantalla", text: "Un asistente que sabe dónde estás, te muestra el botón exacto y responde tus dudas." },
            { icon: MessagesSquare, title: "IA que atiende tus chats", text: "Sugiere respuestas, resume conversaciones y atiende fuera de horario en el CRM.", href: "/erp/crm" },
            { icon: Camera, title: "Medidas desde fotos y planos", text: "La IA propone las medidas de una foto o un plano para cotizar más rápido.", href: "/fabricacion-a-medida" },
          ]}
        />
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3.5 rounded-[18px] border border-site-soft-line bg-site-soft px-6 py-[22px]">
          <p className="min-w-0 flex-[1_1_420px] text-site-text-muted">
            <strong className="text-site-ink">Plan a tu medida.</strong> Cuéntanos cómo trabaja tu negocio y te proponemos los módulos y el precio.
          </p>
          <ButtonLink href={LINKS.whatsapp} accent="cyberpos" track="whatsapp_plan_a_medida" className="min-h-[48px]">
            Armar mi plan
          </ButtonLink>
        </div>
      </section>

      <section className="border-y border-site-line bg-white">
        <div className={`${container} ${sectionY} flex flex-col gap-9`}>
          <SectionHeading title="Listo para tu rubro" lead="Lo que más usa cada tipo de negocio, ya armado." />
          <p className="text-sm text-site-text-faint md:hidden">Desliza para ver más</p>
          <SwipeRow label="Soluciones por rubro" className="md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-4">
            {RUBROS.map((r) => (
              <Link
                key={r.slug}
                href={`/${r.slug}`}
                className={`${swipeItem} flex flex-col gap-2 rounded-[18px] border border-site-line bg-site-bg p-6 transition-shadow hover:shadow-[0_12px_32px_rgba(11,27,58,0.10)] md:basis-auto`}
              >
                <span className={`self-start rounded-full px-2.5 py-1 text-xs font-bold ${ACCENTS[r.accent].tag}`}>{r.product}</span>
                <h3 className="font-landing-body text-lg font-bold">{r.name}</h3>
                <p className={`text-[15px] ${muted}`}>{r.navText}</p>
                <span className={`mt-auto pt-1 font-bold ${ACCENTS[r.accent].text}`}>Ver la solución →</span>
              </Link>
            ))}
          </SwipeRow>
        </div>
      </section>

      <section id="planes" className={`${container} ${sectionY} flex flex-col gap-8`}>
        <SectionHeading title="Planes del ERP" lead="Plan gratis hasta por 1 año. Sin tarjeta y sin permanencia." />
        <p className="text-sm text-site-text-faint md:hidden">Desliza para ver más</p>
        <SwipeRow label="Planes del ERP" className="md:flex-wrap md:gap-4">
          {CYBERPOS_PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} accent="cyberpos" className={`${swipeItem} md:flex-[1_1_230px]`} />
          ))}
        </SwipeRow>
        <p className={muted}>
          ¿Tienes un restaurante?{" "}
          <Link href="/restaurantes" className="font-bold text-site-ink underline">
            Mira los planes para restaurantes
          </Link>
          . Todos los precios están en{" "}
          <Link href="/precios" className="font-bold text-site-ink underline">
            Precios
          </Link>
          .
        </p>
      </section>

      <section className="border-y border-site-line bg-white">
        <div className={`${container} ${sectionY} flex flex-col gap-9`}>
          <SectionHeading title="Se conecta con todo Createam" />
          <FeatureCards
            accent="cyberpos"
            columns={4}
            tone="tinted"
            label="Conexiones del ERP"
            items={[
              { icon: Store, title: "Tienda online", kicker: "Catálogo Digital", text: "Tu tienda vive dentro del ERP, con los mismos productos, fotos y stock.", href: "/catalogo-digital" },
              { icon: CalendarCheck, title: "Reservas online", kicker: "OnTurn", text: "Las reservas llegan como órdenes de servicio y las cobras con boleta.", href: "/onturn" },
              { icon: Handshake, title: "Tu contador y tu técnico", kicker: "Aliados", text: "Profesionales que instalan, capacitan o llevan tu contabilidad en el ERP.", href: "/aliados" },
              { icon: Plug, title: "API e integraciones", kicker: "Empresarial", text: "Conecta el ERP con tus otros sistemas con llaves de integración y avisos firmados." },
            ]}
          />
        </div>
      </section>

      {showcase && <ProductShowcase showcase={showcase} />}

      <FaqSection faqs={FAQS} accent="cyberpos" />

      <div className={`${container} pb-14 sm:pb-20`}>
        <CtaBand
          title="Empieza básico. Crece sin cambiar de sistema."
          text="Crea tu cuenta, carga tus productos y activa más módulos cuando los necesites."
          actions={
            <>
              <ButtonLink href={LINKS.cyberposRegister} accent="cyberpos" track="cyberpos_registro_final">
                Crear cuenta gratis
              </ButtonLink>
              <ButtonLink href={LINKS.whatsapp} variant="outline-dark" track="whatsapp_cyberpos">
                Pedir una demostración
              </ButtonLink>
            </>
          }
        />
      </div>
    </SiteShell>
  );
}
