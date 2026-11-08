import { BadgePercent, Calculator, CalendarClock, Handshake, Megaphone, Printer, ShieldCheck, Users, Wallet, Wrench } from "lucide-react";
import { LINKS } from "@/components/landing/content";
import SiteShell from "@/components/site/SiteShell";
import { ALLY_ASSEMBLY } from "@/components/site/visuals";
import { IconTile, BrandIcon } from "@/components/site/brand";
import { getAllyTerms, type AllyTermsParams } from "@/components/site/erp-public";
import { JsonLd, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/components/site/seo";
import {
  ButtonLink,
  CtaBand,
  FaqSection,
  FeatureCards,
  PageHero,
  SectionHeading,
  Steps,
  container,
  muted,
  sectionY,
  type Faq,
} from "@/components/site/ui";

// Las condiciones salen del ERP y se renuevan cada media hora (ver getAllyTerms).
export const revalidate = 1800;

export const metadata = pageMetadata({
  path: "/aliados",
  title: "Programa de Aliados del ERP: gana comisiones cada mes | Createam",
  description:
    "Programa de aliados y referidos del ERP: recomienda el sistema, instálalo o lleva la contabilidad de tus clientes y cobra una participación mensual. Para técnicos, contadores y vendedores de equipos en Perú.",
});

const BREADCRUMBS = [{ name: "Inicio", href: "/" }, { name: "Aliados" }];

const money = (amount: number, currency = "PEN") => {
  try {
    return new Intl.NumberFormat("es-PE", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `S/ ${amount.toFixed(2)}`;
  }
};
const pct = (n?: number) => (n === undefined || n === null ? null : `${Number.isInteger(n) ? n : n.toFixed(1)}\u00a0%`);
const days = (n: number) => `${n} día${n === 1 ? "" : "s"}`;
const FREQUENCIES: Record<string, string> = { weekly: "semanal", biweekly: "quincenal", monthly: "mensual" };

function formatDate(isoDay: string) {
  const [y, m, d] = isoDay.split("-");
  return y && m && d ? `${d}/${m}/${y}` : isoDay;
}

/** Las cifras principales de las condiciones vigentes. Un número que falta no se muestra. */
function termFigures(p: AllyTermsParams) {
  const figures: { label: string; value: string; detail?: string }[] = [];
  const share = p.share_pct;
  if (share?.servicing !== undefined) {
    const others = [
      pct(share.recommender) && `${pct(share.recommender)} si solo recomiendas`,
      pct(share.accounting) && `${pct(share.accounting)} si eres estudio contable`,
    ].filter(Boolean);
    figures.push({ label: "Participación mensual", value: `${pct(share.servicing)} si atiendes`, detail: others.join(" · ") || undefined });
  }
  const bonus = p.activation_bonus;
  if (bonus?.amount && bonus.amount > 0) {
    figures.push({
      label: "Bono por cliente que empieza a usarlo",
      value: money(bonus.amount, p.currency),
      detail: bonus.hold_days ? `Se libera a los ${days(bonus.hold_days)} si sigue activo` : undefined,
    });
  }
  const payout = p.payout;
  if (payout?.frequencies?.length) {
    const freqs = payout.frequencies.map((f) => FREQUENCIES[f] ?? f).join(" o ");
    figures.push({
      label: "Cobras",
      value: freqs.charAt(0).toUpperCase() + freqs.slice(1),
      detail: payout.minimum && payout.minimum > 0 ? `Desde ${money(payout.minimum, p.currency)}; lo que no llega pasa al siguiente pago` : "Sin monto mínimo",
    });
  }
  if (p.notice_days) {
    figures.push({ label: "Si algo cambia en tu contra", value: `${days(p.notice_days)} de aviso`, detail: "Y solo para los clientes que traigas después" });
  }
  const tiers = (p.own_plan_tiers ?? []).filter((t) => t.discount_pct > 0).sort((a, b) => a.min_active_clients - b.min_active_clients);
  const top = tiers[tiers.length - 1];
  if (top) {
    figures.push({
      label: "Tu propio ERP",
      value: top.discount_pct >= 100 ? `Gratis con ${top.min_active_clients} clientes` : `${pct(top.discount_pct)} menos con ${top.min_active_clients} clientes`,
    });
  }
  return figures;
}

export default async function AliadosPage() {
  const terms = await getAllyTerms();
  const p = terms?.params ?? null;
  const figures = p ? termFigures(p) : [];
  const share = p?.share_pct;
  const closed = terms !== null && !terms.programOpen;

  const ways = [
    {
      icon: Megaphone,
      title: "Recomiendas",
      text: `Traes negocios con tu enlace o tu código y quedan en tu cartera.${share?.recommender ? ` Ganas ${pct(share.recommender)} de lo que pagan cada mes.` : ""}`,
    },
    {
      icon: Wrench,
      title: "Atiendes",
      text: `Los instalas, los capacitas y les das soporte.${share?.servicing ? ` Ganas ${pct(share.servicing)} de lo que pagan cada mes, mientras los atiendas.` : ""}`,
    },
    {
      icon: Calculator,
      title: "Llevas su contabilidad",
      text: `Tu estudio contable entra a cada empresa con su propio usuario y trabaja con sus ventas y compras ya registradas.${share?.accounting ? ` Ganas ${pct(share.accounting)} cada mes.` : ""}`,
    },
  ];

  const faqs: Faq[] = [
    { question: "¿Cuánto cuesta ser aliado?", answer: "Nada. Creas tu cuenta gratis del ERP y desde ahí pides ser aliado. Te avisamos cuando revisemos tu solicitud." },
    {
      question: "¿Cómo sé que un cliente quedó a mi nombre?",
      answer: `Quien se registra con tu enlace o escribe tu código queda en tu cartera, y la ves en tu portal de aliado.${
        p?.opportunity_days ? ` También puedes registrar a un negocio con el que estás conversando: queda reservado para ti por ${days(p.opportunity_days)}.` : ""
      }`,
    },
    {
      question: "¿Cuánto gano?",
      answer: share?.servicing
        ? `Una parte de lo que tu cliente paga cada mes por el ERP: ${[
            share.recommender && `${pct(share.recommender)} si solo lo recomiendas`,
            `${pct(share.servicing)} si lo atiendes`,
            share.accounting && `${pct(share.accounting)} si llevas su contabilidad`,
          ]
            .filter(Boolean)
            .join(", ")}. Lo que cobres por instalar, capacitar o llevar la contabilidad es tuyo y lo fijas tú.`
        : "Una parte de lo que tu cliente paga cada mes por el ERP, según lo que hagas por él. Las cifras vigentes las ves al pedir ser aliado. Lo que cobres por instalar, capacitar o llevar la contabilidad es tuyo y lo fijas tú.",
    },
    {
      question: "¿Cada cuánto me pagan?",
      answer: p?.payout?.frequencies?.length
        ? `Eliges cobrar en forma ${p.payout.frequencies.map((f) => FREQUENCIES[f] ?? f).join(" o ")}.${
            p.payout.minimum ? ` El pago mínimo es ${money(p.payout.minimum, p.currency)}; si no llegas, se suma al siguiente.` : ""
          }`
        : "Las fechas y el monto mínimo de pago están en las condiciones que aceptas al pedir ser aliado.",
    },
    {
      question: "¿Pueden cambiar las condiciones?",
      answer: `Las condiciones tienen versión y fecha. Si algo cambia en tu contra, se avisa antes${
        p?.notice_days ? ` (${days(p.notice_days)})` : ""
      } y solo vale para los clientes que traigas después.`,
    },
    {
      question: "Soy contador, ¿me sirve?",
      answer:
        "Sí. Tu estudio entra a cada empresa que usa ERP con su propio usuario: las ventas, compras y comprobantes ya están registrados, con sus asientos contables.",
    },
  ];

  return (
    <SiteShell cta={{ label: "Quiero ser aliado", href: LINKS.allyJoin, track: "aliados_cabecera" }}>
      <JsonLd graph={[breadcrumbJsonLd(BREADCRUMBS), faqJsonLd(faqs)]} />

      <PageHero
        accent="createam"
        tag="Programa de Aliados"
        badge={
          <IconTile accent="createam" variant="solid" size="lg">
            <BrandIcon name="aliados" className="h-[26px] w-[26px]" />
          </IconTile>
        }
        breadcrumbs={BREADCRUMBS}
        title="Programa de aliados: gana comisiones con un ERP"
        lead="Recomienda, instala o lleva la contabilidad de negocios, y cobra cada mes mientras los atiendas."
        points={["Ser aliado es gratis", "Ingreso mensual recurrente", "Tu cartera crece con cada cliente"]}
        actions={
          <>
            <ButtonLink href={LINKS.allyJoin} accent="createam" variant="light" track="aliados_unete">
              Quiero ser aliado
            </ButtonLink>
            <ButtonLink href={LINKS.allyHome} variant="outline-dark" track="aliados_portal">
              Ya soy aliado
            </ButtonLink>
          </>
        }
        note={closed ? "El programa todavía no recibe solicitudes: abre pronto." : undefined}
        visual={ALLY_ASSEMBLY}
      />

      <section className={`${container} ${sectionY} flex flex-col gap-9`}>
        <SectionHeading
          title="Tres formas de ganar"
          lead="Eliges qué haces por cada cliente. Puedes hacer una, dos o las tres, y lo que cobres por tus servicios es tuyo."
        />
        <FeatureCards items={ways} accent="createam" label="Formas de ganar como aliado" />
      </section>

      <section className="border-y border-site-line bg-white">
        <div className={`${container} ${sectionY} flex flex-col gap-9`}>
          <SectionHeading title="¿Quién puede ser aliado?" lead="Personas y empresas que ya trabajan con negocios y quieren un ingreso que se repite cada mes." />
          <FeatureCards
            tone="tinted"
            columns={4}
            accent="createam"
            label="Perfiles de aliado"
            items={[
              { icon: Wrench, title: "Técnicos de sistemas", text: "Instalas computadoras, redes o impresoras y ya visitas negocios de tu zona." },
              { icon: Calculator, title: "Contadores y estudios contables", text: "Llevas la contabilidad de varias empresas y quieres recibir sus datos sin digitarlos." },
              { icon: Printer, title: "Vendedores de equipos", text: "Vendes impresoras de tickets, lectoras de código de barras, gavetas o computadoras." },
              { icon: Users, title: "Clientes y consultores", text: "Ya usas ERP o asesoras negocios y lo recomiendas a quien lo necesita." },
            ]}
          />
        </div>
      </section>

      <section className={`${container} ${sectionY} flex flex-col gap-9`}>
        <SectionHeading title="Cómo funciona" />
        <Steps
          accent="createam"
          steps={[
            { title: "Creas tu cuenta gratis", text: "Tu cuenta del ERP, sin tarjeta." },
            { title: "Pides ser aliado", text: "Nos cuentas qué quieres hacer y cómo te contactamos." },
            { title: "Te aprobamos", text: "Revisamos tu solicitud y aceptas las condiciones vigentes." },
            { title: "Compartes tu enlace", text: "Los negocios que llegan con tu enlace o tu código quedan en tu cartera." },
            { title: "Cobras cada mes", text: "Una parte de lo que pagan tus clientes, mientras los atiendas." },
          ]}
        />
      </section>

      {figures.length > 0 && terms && (
        <section className="border-y border-site-line bg-white">
          <div className={`${container} ${sectionY} flex flex-col gap-8`}>
            <SectionHeading
              title={`Las condiciones vigentes${terms.version ? ` · versión ${terms.version}` : ""}`}
              lead={
                <>
                  {terms.effectiveFrom ? `Vigentes desde el ${formatDate(terms.effectiveFrom)}. ` : ""}
                  Si algo cambia en tu contra, se avisa antes y solo vale para los clientes que traigas después. El texto completo lo lees al pedir ser aliado.
                </>
              }
            />
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))]">
              {figures.map((f, i) => {
                const Icon = [BadgePercent, Handshake, Wallet, ShieldCheck, CalendarClock][i] ?? BadgePercent;
                return (
                  <div key={f.label} className="flex flex-col gap-1.5 rounded-[18px] border border-site-line bg-site-bg p-6">
                    <Icon className="h-7 w-7 text-site-ink" aria-hidden />
                    <span className={`text-[15px] font-semibold ${muted}`}>{f.label}</span>
                    <span className="font-landing-display text-[26px] font-extrabold leading-tight">{f.value}</span>
                    {f.detail && <span className={`text-sm ${muted}`}>{f.detail}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <FaqSection faqs={faqs} accent="createam" />

      <div className={`${container} pb-14 sm:pb-20`}>
        <CtaBand
          title="Empieza tu cartera hoy"
          text="Crea tu cuenta gratis y pide ser aliado. Si tienes dudas, escríbenos por WhatsApp."
          actions={
            <>
              <ButtonLink href={LINKS.allyJoin} variant="light" track="aliados_unete_final">
                Quiero ser aliado
              </ButtonLink>
              <ButtonLink href={LINKS.whatsapp} variant="outline-dark" track="whatsapp_aliados">
                Escribir por WhatsApp
              </ButtonLink>
            </>
          }
        />
      </div>
    </SiteShell>
  );
}
