import Image from "next/image";
import Link from "next/link";
import SiteShell from "./SiteShell";
import { MODULE_PAGES } from "./data/modules";
import type { RubroData } from "./data/rubros";
import { JsonLd, SITE_URL, ORGANIZATION_ID, breadcrumbJsonLd, faqJsonLd } from "./seo";
import { ACCENTS } from "./theme";
import { RUBRO_ASSEMBLY } from "./visuals";
import { IconTile, BrandIcon } from "./brand";
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
} from "./ui";
import SwipeRow from "@/components/landing/SwipeRow";
import { LINKS } from "@/components/landing/content";

/** Página de un rubro: encabezado, lo que resuelve, planes, módulos relacionados y preguntas. */
export default function RubroPage({ rubro }: { rubro: RubroData }) {
  const breadcrumbs = [{ name: "Inicio", href: "/" }, { name: "Rubros", href: "/#rubros" }, { name: rubro.name }];
  const related = MODULE_PAGES.filter((m) => rubro.modules?.includes(m.slug));
  const a = ACCENTS[rubro.accent];

  return (
    <SiteShell cta={rubro.primaryCta}>
      <JsonLd
        graph={[
          breadcrumbJsonLd(breadcrumbs),
          {
            "@type": "SoftwareApplication",
            name: `${rubro.product} para ${rubro.name.toLowerCase()}`,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: `${SITE_URL}/${rubro.slug}`,
            description: rubro.meta.description,
            featureList: rubro.features.map((f) => f.title),
            publisher: { "@id": ORGANIZATION_ID },
          },
          faqJsonLd(rubro.faqs),
        ]}
      />

      <PageHero
        accent={rubro.accent}
        tag={rubro.product}
        badge={
          <IconTile accent={rubro.accent} variant="solid" size="lg">
            <BrandIcon name={rubro.glyph} className="h-[26px] w-[26px]" />
          </IconTile>
        }
        breadcrumbs={breadcrumbs}
        title={rubro.hero.title}
        lead={rubro.hero.lead}
        points={rubro.hero.points}
        note={rubro.note}
        actions={
          <>
            <ButtonLink href={rubro.primaryCta.href} accent={rubro.accent} track={rubro.primaryCta.track}>
              {rubro.primaryCta.label}
            </ButtonLink>
            {rubro.secondaryCta && (
              <ButtonLink href={rubro.secondaryCta.href} variant="outline-dark" track={rubro.secondaryCta.track}>
                {rubro.secondaryCta.label}
              </ButtonLink>
            )}
          </>
        }
        visual={RUBRO_ASSEMBLY[rubro.slug]}
      />

      <section className={`${container} ${sectionY} flex flex-col gap-9`}>
        <SectionHeading title={rubro.featuresTitle} lead={rubro.featuresLead} />
        <FeatureCards items={rubro.features} accent={rubro.accent} label={`Funciones para ${rubro.name.toLowerCase()}`} />
      </section>

      {rubro.hero.image && (
        <section className="border-y border-site-line bg-white">
          <div className={`${container} ${sectionY} flex flex-wrap items-center gap-x-14 gap-y-9`}>
            <SectionHeading className="flex-[1_1_320px]" title="Así se ve en tu pantalla" lead="Funciona en la computadora, la tablet o el celular, sin instalar nada." />
            <div className="min-w-0 flex-[1_1_520px]">
              <ScreenFrame label={rubro.hero.image.label}>
                <Image
                  src={rubro.hero.image.src}
                  alt={rubro.hero.image.alt}
                  width={rubro.hero.image.width}
                  height={rubro.hero.image.height}
                  sizes="(min-width: 1024px) 620px, 92vw"
                  className="block h-auto w-full"
                />
              </ScreenFrame>
            </div>
          </div>
        </section>
      )}

      {rubro.extra && (
        <section className="border-y border-site-line bg-white">
          <div className={`${container} ${sectionY} flex flex-col gap-9`}>
            <SectionHeading title={rubro.extra.title} lead={rubro.extra.lead} />
            <FeatureCards items={rubro.extra.items} accent={rubro.extra.accent ?? rubro.accent} label={rubro.extra.title} tone="tinted" />
          </div>
        </section>
      )}

      {rubro.plans && (
        <section id="precios" className={`${container} ${sectionY} flex flex-col gap-8`}>
          <SectionHeading title={rubro.plans.title} lead={rubro.plans.lead} />
          <SwipeRow label={rubro.plans.title} className="md:flex-wrap md:gap-4">
            {rubro.plans.items.map((plan) => (
              <PlanCard key={plan.name} plan={plan} accent={rubro.accent} className={`${swipeItem} md:flex-[1_1_280px]`} />
            ))}
          </SwipeRow>
          {rubro.plans.footnote && <p className={`text-[15px] ${muted}`}>{rubro.plans.footnote}</p>}
        </section>
      )}

      {related.length > 0 && (
        <section className={rubro.plans ? "border-y border-site-line bg-white" : ""}>
          <div className={`${container} ${sectionY} flex flex-col gap-8`}>
            <SectionHeading
              title="Suma lo que tu negocio necesite"
              lead="El ERP se arma por módulos: activas solo lo que usas y agregas más cuando creces."
            />
            <FeatureCards
              columns={3}
              accent="cyberpos"
              label="Módulos relacionados"
              items={related.map((m) => ({ icon: m.icon, title: m.name, text: m.navText, href: `/erp/${m.slug}` }))}
            />
            <p className={muted}>
              ¿Tu negocio hace algo distinto?{" "}
              <Link href="/erp#a-tu-medida" className={`font-bold underline ${a.text}`}>
                Armamos un plan a tu medida
              </Link>{" "}
              con los módulos que usas.
            </p>
          </div>
        </section>
      )}

      <FaqSection faqs={rubro.faqs} accent={rubro.accent} />

      <div className={`${container} pb-14 sm:pb-20`}>
        <CtaBand
          title={rubro.closing.title}
          text={rubro.closing.text}
          actions={
            <>
              <ButtonLink href={rubro.primaryCta.href} accent={rubro.accent} track={`${rubro.primaryCta.track}_final`}>
                {rubro.primaryCta.label}
              </ButtonLink>
              <ButtonLink href={LINKS.whatsapp} variant="outline-dark" track={`whatsapp_${rubro.slug}`}>
                Escribir por WhatsApp
              </ButtonLink>
            </>
          }
        />
      </div>
    </SiteShell>
  );
}
