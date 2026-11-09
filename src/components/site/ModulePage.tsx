import Image from "next/image";
import Link from "next/link";
import { LINKS } from "@/components/landing/content";
import SiteShell from "./SiteShell";
import { MODULE_PAGES, type ModulePageData } from "./data/modules";
import { RUBROS } from "./data/rubros";
import { IconTile } from "./brand";
import { MODULE_ASSEMBLY } from "./visuals";
import { JsonLd, ORGANIZATION_ID, SITE_URL, breadcrumbJsonLd, faqJsonLd } from "./seo";
import { ButtonLink, CtaBand, FaqSection, FeatureCards, PageHero, ScreenFrame, SectionHeading, Steps, container, muted, sectionY } from "./ui";

/** Página de un módulo del ERP: qué resuelve, sus funciones, cómo se usa, con qué se conecta y preguntas. */
export default function ModulePage({ module: m }: { module: ModulePageData }) {
  const breadcrumbs = [{ name: "Inicio", href: "/" }, { name: "ERP", href: "/erp" }, { name: m.name }];
  const related = MODULE_PAGES.filter((other) => m.related.includes(other.slug));
  const rubros = RUBROS.filter((r) => m.rubros?.includes(r.slug));

  return (
    <SiteShell cta={{ label: "Crear cuenta gratis", shortLabel: "Crear cuenta", href: LINKS.cyberposRegister, track: `${m.slug}_cabecera` }}>
      <JsonLd
        graph={[
          breadcrumbJsonLd(breadcrumbs),
          {
            "@type": "SoftwareApplication",
            "@id": `${SITE_URL}/erp/${m.slug}#app`,
            name: `${m.name} · ERP de Createam`,
            applicationCategory: "BusinessApplication",
            applicationSuite: "ERP de Createam",
            operatingSystem: "Web",
            url: `${SITE_URL}/erp/${m.slug}`,
            description: m.meta.description,
            featureList: m.features.map((f) => f.title),
            publisher: { "@id": ORGANIZATION_ID },
          },
          faqJsonLd(m.faqs),
        ]}
      />

      <PageHero
        accent="cyberpos"
        tag={`ERP · ${m.name}`}
        badge={<IconTile accent="cyberpos" variant="solid" size="lg" icon={m.icon} />}
        breadcrumbs={breadcrumbs}
        title={m.hero.title}
        lead={m.hero.lead}
        points={m.hero.points}
        note={m.planNote}
        actions={
          <>
            <ButtonLink href={LINKS.cyberposRegister} accent="cyberpos" track={`${m.slug}_registro`}>
              Crear cuenta gratis
            </ButtonLink>
            <ButtonLink href={m.secondaryCta?.href ?? "/precios#erp"} variant="outline-dark" track={m.secondaryCta?.track}>
              {m.secondaryCta?.label ?? "Ver precios"}
            </ButtonLink>
          </>
        }
        visual={MODULE_ASSEMBLY[m.slug]}
      />

      <section className={`${container} ${sectionY} flex flex-col gap-9`}>
        <SectionHeading title={m.featuresTitle} lead={m.featuresLead} />
        <FeatureCards items={m.features} accent="cyberpos" label={`Funciones de ${m.name}`} />
      </section>

      {m.hero.image && (
        <section className="border-y border-site-line bg-white">
          <div className={`${container} ${sectionY} flex flex-wrap items-center gap-x-14 gap-y-9`}>
            <SectionHeading className="flex-[1_1_320px]" title="Así se ve en tu pantalla" lead="Funciona en la computadora, la tablet o el celular, sin instalar nada." />
            <div className="min-w-0 flex-[1_1_520px]">
              <ScreenFrame label={m.hero.image.label}>
                <Image
                  src={m.hero.image.src}
                  alt={m.hero.image.alt}
                  width={m.hero.image.width}
                  height={m.hero.image.height}
                  sizes="(min-width: 1024px) 620px, 92vw"
                  className="block h-auto w-full"
                />
              </ScreenFrame>
            </div>
          </div>
        </section>
      )}

      {m.extras?.map((extra, i) => (
        <section key={extra.title} className={i % 2 === 0 ? "border-y border-site-line bg-white" : ""}>
          <div className={`${container} ${sectionY} flex flex-col gap-9`}>
            <SectionHeading title={extra.title} lead={extra.lead} />
            <FeatureCards items={extra.items} accent="cyberpos" label={extra.title} tone={i % 2 === 0 ? "tinted" : "white"} />
          </div>
        </section>
      ))}

      {m.steps && (
        <section className={`${container} ${sectionY} flex flex-col gap-9`}>
          <SectionHeading title={m.steps.title} />
          <Steps steps={m.steps.items} accent="cyberpos" />
        </section>
      )}

      <section className="border-y border-site-line bg-white">
        <div className={`${container} ${sectionY} flex flex-col gap-8`}>
          <SectionHeading
            title="Todo en el mismo sistema"
            lead="El ERP se arma por módulos que comparten los mismos productos, clientes y ventas. Activas lo que usas y sumas más cuando creces."
          />
          {related.length > 0 && (
            <FeatureCards
              columns={3}
              accent="cyberpos"
              label="Módulos relacionados"
              items={related.map((r) => ({ icon: r.icon, title: r.name, text: r.navText, href: `/erp/${r.slug}` }))}
            />
          )}
          <p className={muted}>
            <Link href="/erp#modulos" className="font-bold text-site-ink underline">
              Ver todos los módulos del ERP
            </Link>
            {rubros.length > 0 && (
              <>
                {" "}
                · Soluciones para{" "}
                {rubros.map((r, i) => (
                  <span key={r.slug}>
                    {i > 0 && (i === rubros.length - 1 ? " y " : ", ")}
                    <Link href={`/${r.slug}`} className="font-bold text-site-ink underline">
                      {r.name.toLowerCase()}
                    </Link>
                  </span>
                ))}
              </>
            )}
          </p>
        </div>
      </section>

      <FaqSection faqs={m.faqs} accent="cyberpos" />

      <div className={`${container} pb-14 sm:pb-20`}>
        <CtaBand
          title={m.closing.title}
          text={m.closing.text}
          actions={
            <>
              <ButtonLink href={LINKS.cyberposRegister} accent="cyberpos" track={`${m.slug}_registro_final`}>
                Crear cuenta gratis
              </ButtonLink>
              <ButtonLink href={LINKS.whatsapp} variant="outline-dark" track={`whatsapp_${m.slug}`}>
                Pedir una demostración
              </ButtonLink>
            </>
          }
        />
      </div>
    </SiteShell>
  );
}
