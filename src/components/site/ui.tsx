import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import SwipeRow from "@/components/landing/SwipeRow";
import { IconTile } from "./brand";
import ModuleAssembly from "./ModuleAssembly";
import { ERP_ASSEMBLY, type AssemblySpec } from "./visuals";
import { Float, HeroSky, Reveal } from "./motion";
import { ACCENTS, type Accent } from "./theme";

// Piezas comunes de las páginas del sitio: medidas, títulos, botones, tarjetas,
// preguntas frecuentes y franjas de llamada a la acción.

export const container = "mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10";
export const sectionY = "py-14 sm:py-20 lg:py-24";
export const h2Class = "font-landing-display text-[clamp(30px,3.6vw,46px)] font-bold leading-[1.08] tracking-[-0.006em] text-site-ink";
export const muted = "text-site-text-muted";

// Tamaño de cada tarjeta dentro de una fila deslizable en celular
export const swipeItem = "shrink-0 basis-[80%] snap-start sm:basis-[46%]";

export function Tag({ accent, children, className = "" }: { accent: Accent; children: React.ReactNode; className?: string }) {
  return <span className={`self-start rounded-full px-3 py-1 text-[13px] font-bold ${ACCENTS[accent].tag} ${className}`}>{children}</span>;
}

type ButtonVariant = "solid" | "light" | "outline-dark" | "outline";

const BUTTON_BASE = "inline-flex min-h-[50px] items-center justify-center rounded-full px-6 text-center font-bold transition-[opacity,border-color,background-color] hover:opacity-90";

/** Enlace con forma de botón. Usa <Link> para las páginas del sitio y <a> para el resto. */
export function ButtonLink({
  href,
  variant = "solid",
  track,
  className = "",
  children,
}: {
  href: string;
  /** Ya no cambia el color (el botón principal es siempre amarillo sol); se acepta por compatibilidad. */
  accent?: Accent;
  variant?: ButtonVariant;
  track?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const look = {
    // El botón principal es siempre amarillo sol con texto oscuro, en fondo claro u oscuro.
    solid: "bg-site-accent text-site-on-accent hover:bg-site-accent-hover hover:opacity-100",
    light: "bg-white text-site-ink",
    "outline-dark": "border-[1.5px] border-site-on-ink-faint text-white hover:border-white hover:opacity-100",
    outline: "border-[1.5px] border-site-line-strong bg-white text-site-ink hover:border-site-ink hover:opacity-100",
  }[variant];
  const cls = `${BUTTON_BASE} ${look} ${className}`;
  // /ingresar redirige a otro sitio: va con <a> para que el navegador siga la redirección.
  const internal = href.startsWith("/") && !href.startsWith("/ingresar");
  return internal ? (
    <Link href={href} data-track={track} className={cls}>
      {children}
    </Link>
  ) : (
    <a href={href} data-track={track} className={cls}>
      {children}
    </a>
  );
}

/** Enlace de texto subrayado, interno o externo. */
export function TextLink({ href, className = "", children }: { href: string; className?: string; children: React.ReactNode }) {
  const cls = `font-semibold underline underline-offset-2 ${className}`;
  return href.startsWith("/") && !href.startsWith("/ingresar") ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <a href={href} className={cls}>
      {children}
    </a>
  );
}

export function SectionHeading({
  accent,
  tag,
  title,
  lead,
  id,
  className = "",
}: {
  accent?: Accent;
  tag?: string;
  title: string;
  lead?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <Reveal className={`flex max-w-[760px] flex-col gap-3 ${className}`}>
      {tag && accent && <Tag accent={accent}>{tag}</Tag>}
      <h2 id={id} className={h2Class}>
        {title}
      </h2>
      {lead && <p className={muted}>{lead}</p>}
    </Reveal>
  );
}

export function Bullets({ items, accent, className = "" }: { items: React.ReactNode[]; accent: Accent; className?: string }) {
  return (
    <ul className={`flex flex-col gap-3 ${className}`}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className={`mt-[9px] h-2 w-2 flex-none rounded-full ${ACCENTS[accent].dot}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Ruta de migas visible: Inicio › ERP › Facturación electrónica. */
export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Ruta" className="text-sm font-semibold text-site-on-ink">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => (
          <li key={item.name} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">›</span>}
            {item.href ? (
              <Link href={item.href} className="flex min-h-[32px] items-center hover:text-white hover:underline">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-site-on-ink-muted">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Encabezado azul marino de cada página: etiqueta del producto, título, bajada,
 * puntos clave, botones y, a la derecha, una imagen o un recuadro.
 */
export function PageHero({
  accent,
  tag,
  title,
  lead,
  points,
  actions,
  note,
  aside,
  breadcrumbs,
  badge,
  visual,
}: {
  accent: Accent;
  tag: string;
  title: string;
  lead: React.ReactNode;
  points?: string[];
  actions: React.ReactNode;
  note?: React.ReactNode;
  aside?: React.ReactNode;
  breadcrumbs?: { name: string; href?: string }[];
  /** Ícono de la página (una IconTile) junto a la etiqueta */
  badge?: React.ReactNode;
  /** Piezas de la animación modular de esta página (por defecto, las del ERP) */
  visual?: AssemblySpec;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-site-ink text-white">
      <HeroSky />
      <div className={`${container} relative flex flex-col gap-6 py-10 sm:py-14 lg:py-20`}>
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <div className="flex flex-wrap items-center gap-x-14 gap-y-10">
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
            <div className="flex items-center gap-3">
              {badge}
              <Tag accent={accent}>{tag}</Tag>
            </div>
            <h1 className="font-landing-display text-[clamp(38px,5.4vw,66px)] font-bold leading-[1.02] tracking-[-0.01em] text-site-on-ink">{title}</h1>
            <p className="max-w-[36em] text-[clamp(17px,1.6vw,20px)] text-site-on-ink-muted">{lead}</p>
            {points && points.length > 0 && (
              <ul className="flex flex-col gap-2 text-[16px] font-semibold text-site-on-ink-muted">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <svg viewBox="0 0 20 20" aria-hidden="true" className={`mt-[3px] h-5 w-5 flex-none ${ACCENTS[accent].onDark}`}>
                      <path fill="currentColor" d="M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm4.03 6.28-4.6 5.3a.9.9 0 0 1-1.3.06L5.9 10.98a.9.9 0 1 1 1.26-1.28l1.55 1.53 3.96-4.56a.9.9 0 1 1 1.36 1.11Z" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-3">{actions}</div>
            {note && <p className="text-[15px] font-semibold text-site-on-ink-muted">{note}</p>}
          </div>
          {aside ? (
            <Float className="min-w-0 flex-[1_1_420px]" distance={6} duration={7}>
              {aside}
            </Float>
          ) : (
            // La identidad en movimiento: las piezas de esta página se acoplan a su núcleo.
            <div className="min-w-0 flex-[1_1_360px]">
              <ModuleAssembly spec={visual ?? ERP_ASSEMBLY} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export interface FeatureItem {
  icon?: LucideIcon;
  title: string;
  text: string;
  href?: string;
  /** Texto pequeño sobre el título, por ejemplo el producto o el plan */
  kicker?: string;
}

/**
 * Tarjetas de funciones. En celular, una fila que se desliza de lado (así lo
 * prefiere el dueño); desde `md`, en grilla.
 */
export function FeatureCards({
  items,
  accent,
  label,
  columns = 3,
  tone = "white",
}: {
  items: FeatureItem[];
  accent: Accent;
  label: string;
  columns?: 2 | 3 | 4;
  tone?: "white" | "tinted";
}) {
  const grid = { 2: "md:grid-cols-2", 3: "md:grid-cols-2 lg:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }[columns];
  const bg = tone === "white" ? "bg-white" : "bg-site-bg";
  return (
    <div className="flex flex-col gap-2.5">
      {items.length > 1 && <p className="text-sm text-site-text-faint md:hidden">Desliza para ver más</p>}
      <SwipeRow label={label} className={`md:grid md:gap-4 ${grid}`}>
        {items.map(({ icon: Icon, title, text, href, kicker }, index) => {
          const body = (
            <>
              {Icon && <IconTile accent={accent} icon={Icon} className="mb-1" />}
              {kicker && <span className="text-xs font-bold uppercase tracking-wider text-site-text-faint">{kicker}</span>}
              <h3 className="font-landing-body text-lg font-bold leading-snug">{title}</h3>
              <p className={`text-[15px] ${muted}`}>{text}</p>
              {href && <span className={`mt-auto pt-1 text-[15px] font-bold ${ACCENTS[accent].text}`}>Ver más →</span>}
            </>
          );
          const cls = `group flex h-full flex-col gap-2 rounded-[20px] border border-site-line ${bg} p-6 transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1 hover:border-site-line-strong hover:shadow-[0_16px_36px_rgba(11,27,58,0.10)] motion-reduce:transition-none motion-reduce:hover:translate-y-0`;
          return (
            <Reveal key={title} delay={(index % columns) * 0.07} className={`${swipeItem} md:basis-auto`}>
              {href ? (
                <Link href={href} className={cls}>
                  {body}
                </Link>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </Reveal>
          );
        })}
      </SwipeRow>
    </div>
  );
}

/** Pasos numerados: «Así empiezas». */
export function Steps({ steps, accent }: { steps: { title: string; text: string }[]; accent: Accent }) {
  return (
    <ol className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))]">
      {steps.map((step, index) => (
        <li key={step.title}>
          <Reveal delay={index * 0.08} className="flex h-full flex-col gap-2 rounded-[20px] border border-site-line bg-white p-6">
            <IconTile accent={accent} variant="solid" size="sm">
              <span className="font-landing-display text-sm font-extrabold">{index + 1}</span>
            </IconTile>
            <h3 className="font-landing-body text-lg font-bold">{step.title}</h3>
            <p className={muted}>{step.text}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

export interface Faq {
  question: string;
  answer: string;
}

export function FaqList({ faqs, accent = "createam" }: { faqs: Faq[]; accent?: Accent }) {
  return (
    <div>
      {faqs.map((faq) => (
        <details key={faq.question} className="group border-b border-site-line-strong">
          <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 py-2 text-lg font-bold [&::-webkit-details-marker]:hidden">
            {faq.question}
            <span aria-hidden="true" className={`text-2xl font-normal transition-transform group-open:rotate-45 ${ACCENTS[accent].text}`}>
              +
            </span>
          </summary>
          <p className={`pb-5 ${muted}`}>{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function FaqSection({ faqs, accent, title = "Preguntas frecuentes" }: { faqs: Faq[]; accent?: Accent; title?: string }) {
  return (
    <section id="preguntas" className={`mx-auto w-full max-w-[860px] px-5 sm:px-8 lg:px-10 ${sectionY}`}>
      <h2 className={`${h2Class} mb-5`}>{title}</h2>
      <FaqList faqs={faqs} accent={accent} />
    </section>
  );
}

/** Franja oscura de cierre con una llamada a la acción. */
export function CtaBand({ title, text, actions }: { title: string; text: React.ReactNode; actions: React.ReactNode }) {
  return (
    <Reveal className="relative isolate flex flex-wrap items-center gap-x-10 gap-y-5 overflow-hidden rounded-[24px] bg-site-ink p-7 text-white sm:p-10">
      <HeroSky />
      <div className="relative min-w-0 flex-[1_1_380px]">
        <h2 className="font-landing-display text-[clamp(24px,2.8vw,34px)] font-extrabold leading-[1.12]">{title}</h2>
        <p className="mt-2 text-site-on-ink-muted">{text}</p>
      </div>
      <div className="relative flex flex-wrap gap-3">{actions}</div>
    </Reveal>
  );
}

export interface LandingPlanCard {
  name: string;
  price: string;
  highlighted?: boolean;
  features: string[];
}

export function PlanCard({ plan, accent, className = "" }: { plan: LandingPlanCard; accent: Accent; className?: string }) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-[20px] bg-white p-6 transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(11,27,58,0.10)] motion-reduce:hover:translate-y-0 ${className} ${
        plan.highlighted ? `border-2 ${ACCENTS[accent].strongBorder}` : "border border-site-line"
      }`}
    >
      <h3 className="font-landing-body text-lg font-bold">{plan.name}</h3>
      <p className="font-landing-display text-4xl font-extrabold leading-none">
        {plan.price}
        {plan.price !== "S/ 0" && <span className="font-landing-body text-[15px] font-semibold text-site-text-muted"> al mes</span>}
      </p>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] text-site-text-muted">
        {plan.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </div>
  );
}

/** Captura de pantalla con marco de ventana. */
export function ScreenFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-site-ink-line bg-site-ink-raise shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-1.5 px-3 py-2.5">
        <span className="h-[9px] w-[9px] rounded-full bg-site-ink-line" />
        <span className="h-[9px] w-[9px] rounded-full bg-site-ink-line" />
        <span className="h-[9px] w-[9px] rounded-full bg-site-ink-line" />
        <span className="ml-2 text-xs font-semibold text-site-on-ink">{label}</span>
      </div>
      {children}
    </div>
  );
}
