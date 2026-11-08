import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarCheck,
  CalendarDays,
  CalendarOff,
  Clock,
  Code2,
  History,
  ListOrdered,
  Receipt,
  Search,
  Star,
  UserPlus,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { LINKS } from "@/components/landing/content";
import SiteShell from "@/components/site/SiteShell";
import { ONTURN_ASSEMBLY } from "@/components/site/visuals";
import { IconTile, BrandIcon } from "@/components/site/brand";
import { JsonLd, ORGANIZATION_ID, SITE_URL, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/components/site/seo";
import {
  ButtonLink,
  CtaBand,
  FaqSection,
  FeatureCards,
  PageHero,
  ScreenFrame,
  SectionHeading,
  Tag,
  container,
  muted,
  sectionY,
  type Faq,
} from "@/components/site/ui";

export const metadata = pageMetadata({
  path: "/onturn",
  title: "OnTurn: sistema de reservas y agenda online para negocios con citas | Createam",
  description:
    "Agenda y reservas online para barberías, spas, centros de estética y consultorios dentales: recordatorios de citas, lista de espera, seña por Yape o Plin y reseñas verificadas. Gratis hasta por 1 año.",
});

const BREADCRUMBS = [{ name: "Inicio", href: "/" }, { name: "OnTurn" }];

const BUSINESS_FEATURES = [
  { icon: CalendarDays, title: "Agenda online en vivo", text: "Vista del día con una columna por profesional, vista semanal y lista. Las reservas nuevas aparecen solas." },
  { icon: Bell, title: "Recordatorios de citas", text: "Aviso 12, 24 o 48 horas antes y otro opcional el mismo día, por correo y notificación, con botón para confirmar o cancelar." },
  { icon: Wallet, title: "Seña por Yape o Plin", text: "Monto fijo, porcentaje o pago completo, directo a tu número. Si el cliente no paga a tiempo, el horario se libera solo." },
  { icon: ListOrdered, title: "Lista de espera", text: "Cuando alguien cancela, el horario se ofrece al primero de la lista." },
  { icon: UserPlus, title: "Turnos manuales", text: "Anota a quien llega o llama con cualquier profesional disponible. Nunca se cruzan dos citas del mismo profesional." },
  { icon: CalendarOff, title: "Horarios y bloqueos", text: "Horario por profesional, vacaciones, permisos y feriados del país." },
  { icon: Clock, title: "Tus reglas de reserva", text: "Hasta cuándo se puede cancelar o cambiar una cita, con cuánta anticipación se reserva y tu plazo para confirmar." },
  { icon: Star, title: "Reseñas verificadas", text: "Solo opinan clientes atendidos, y puedes responderles." },
  { icon: Users, title: "Cartera de clientes", text: "Historial y notas de cada cliente, y un aviso automático a quien no vuelve hace más de dos meses." },
  { icon: BarChart3, title: "Estadísticas", text: "Reservas que te trajo OnTurn, citas e ingresos del mes, clientes nuevos y servicios más pedidos." },
  { icon: Code2, title: "Botón de reservas para tu web", text: "Agrega «Reservar» a tu página web. También hay API para integraciones." },
  { icon: CalendarCheck, title: "Accesos para tu equipo", text: "Cada profesional ve su agenda; recepción ve la de todos. Un mismo usuario puede manejar varios locales." },
];

const CLIENT_FEATURES = [
  { icon: Search, title: "Te encuentran en el buscador", text: "Por ciudad, rubro, día, horario, precio y calificación." },
  { icon: UserRound, title: "Reservan sin crear cuenta", text: "Basta su nombre y su correo. También pueden reservar para otra persona." },
  { icon: History, title: "Cambian o cancelan solos", text: "Desde «Mis reservas», dentro del plazo que tú fijas, sin llamarte." },
  { icon: Clock, title: "Hoy a última hora", text: "Los horarios que se liberan hoy se muestran en la portada de OnTurn." },
];

const FAQS: Faq[] = [
  {
    question: "¿Qué negocios pueden usar OnTurn?",
    answer:
      "Los que atienden con cita: barberías, spas y centros de estética, y consultorios dentales. Si tu rubro trabaja con horarios y profesionales, escríbenos y lo vemos.",
  },
  {
    question: "¿Cómo me encuentran mis clientes?",
    answer:
      "Con el enlace de tu página en OnTurn, que compartes por Instagram, WhatsApp o tu web, y desde el buscador de OnTurn, que filtra por ciudad y rubro.",
  },
  {
    question: "¿Tengo que instalar algo?",
    answer: "No. Funciona en el navegador, y el panel del negocio se puede instalar en el celular como una aplicación.",
  },
  {
    question: "¿Cómo funciona la seña?",
    answer:
      "Eliges cuánto cobrar y a quién. El cliente paga por Yape o Plin a tu número, escribe el número de operación y tú lo verificas en la agenda. OnTurn no cobra comisión por la seña.",
  },
  {
    question: "¿Cuánto cuesta?",
    answer: "Es gratis hasta por un año. Después, OnTurn cobrará una comisión por reserva y te avisaremos antes de activarla.",
  },
  {
    question: "¿OnTurn se conecta con el ERP?",
    answer:
      "Sí. Entras a los dos con la misma cuenta, cada reserva confirmada llega al ERP como orden de servicio, la seña queda registrada como pago y cierras la venta con boleta o factura electrónica.",
  },
];

export default function OnTurnPage() {
  return (
    <SiteShell cta={{ label: "Registrar mi negocio", href: LINKS.onturnRegister, track: "onturn_cabecera" }}>
      <JsonLd
        graph={[
          breadcrumbJsonLd(BREADCRUMBS),
          {
            "@type": "SoftwareApplication",
            "@id": `${SITE_URL}/onturn#app`,
            name: "OnTurn",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: `${SITE_URL}/onturn`,
            description:
              "Reservas y agenda online para negocios que atienden con cita: recordatorios, lista de espera, seña por Yape o Plin, reseñas verificadas y conexión con el ERP.",
            featureList: BUSINESS_FEATURES.map((f) => f.title),
            offers: { "@type": "Offer", price: "0", priceCurrency: "PEN", description: "Gratis hasta por 1 año" },
            publisher: { "@id": ORGANIZATION_ID },
          },
          faqJsonLd(FAQS),
        ]}
      />

      <PageHero
        accent="onturn"
        tag="OnTurn"
        badge={
          <IconTile accent="onturn" variant="solid" size="lg">
            <BrandIcon name="onturn" className="h-[26px] w-[26px]" />
          </IconTile>
        }
        breadcrumbs={BREADCRUMBS}
        title="Sistema de reservas y citas online"
        lead="Tus clientes reservan solos, a cualquier hora, y llegan a tiempo gracias a los recordatorios."
        points={["Agenda online las 24 horas", "Menos clientes que faltan", "Gratis hasta por 1 año"]}
        note="Gratis hasta por 1 año · Sin instalar nada"
        actions={
          <>
            <ButtonLink href={LINKS.onturnRegister} accent="onturn" track="onturn_registro">
              Registrar mi negocio
            </ButtonLink>
            <ButtonLink href={LINKS.onturnLogin} variant="outline-dark">
              Ingresar a mi panel
            </ButtonLink>
          </>
        }
        visual={ONTURN_ASSEMBLY}
      />

      <section id="funciones" className={`${container} ${sectionY} flex flex-col gap-9`}>
        <SectionHeading title="Todo para tu agenda en un solo lugar" lead="Lo que usa tu negocio cada día para recibir reservas y atender a tiempo." />
        <FeatureCards items={BUSINESS_FEATURES} accent="onturn" label="Funciones de OnTurn para el negocio" />
      </section>

      <section className="border-t border-site-line bg-white">
        <div className={`${container} ${sectionY} flex flex-wrap items-center gap-x-14 gap-y-9`}>
          <SectionHeading className="flex-[1_1_320px]" title="Tu página de reservas" lead="Servicios, precios, equipo, horario y reseñas en una sola página que compartes por Instagram y WhatsApp." />
          <div className="min-w-0 flex-[1_1_520px]">
            <ScreenFrame label="OnTurn">
              <Image
                src="/images/landing/onturn-negocio.webp"
                alt="Página de un negocio en OnTurn con horarios, servicios, equipo y reseñas"
                width={1100}
                height={773}
                sizes="(min-width: 1024px) 620px, 92vw"
                className="block h-auto w-full"
              />
            </ScreenFrame>
          </div>
        </div>
      </section>

      <section className="border-y border-site-line bg-white">
        <div className={`${container} ${sectionY} flex flex-wrap items-center gap-x-16 gap-y-10`}>
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-8">
            <SectionHeading title="Y para tus clientes, reservar es facilísimo" lead="Sin descargar nada y sin llamar: reservan en tres pasos desde el celular." />
            <div className="grid gap-4 sm:grid-cols-2">
              {CLIENT_FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex flex-col gap-1.5">
                  <Icon className="h-6 w-6 text-site-ink" aria-hidden />
                  <h3 className="font-landing-body text-lg font-bold">{title}</h3>
                  <p className={`text-[15px] ${muted}`}>{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-auto w-[min(280px,70%)] flex-none overflow-hidden rounded-[28px] border-[6px] border-site-ink shadow-[0_24px_60px_rgba(11,27,58,0.25)]">
            <Image
              src="/images/landing/onturn-inicio.webp"
              alt="Pantalla de inicio de OnTurn con buscador, categorías y servicios"
              width={520}
              height={1067}
              sizes="280px"
              className="block h-auto w-full"
            />
          </div>
        </div>
      </section>

      <section className={`${container} ${sectionY} flex flex-col gap-8`}>
        <SectionHeading title="Pensado para estos negocios" />
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/barberias-salones-y-spas"
            className="flex flex-col gap-2 rounded-[18px] border border-site-line bg-white p-6 transition-shadow hover:shadow-[0_12px_32px_rgba(11,27,58,0.10)]"
          >
            <h3 className="font-landing-body text-lg font-bold">Barberías y salones</h3>
            <p className={`text-[15px] ${muted}`}>Cortes, barba, color y tratamientos, con la agenda de cada profesional.</p>
            <span className="mt-auto pt-1 text-[15px] font-bold text-site-ink">Ver la solución →</span>
          </Link>
          <Link
            href="/barberias-salones-y-spas"
            className="flex flex-col gap-2 rounded-[18px] border border-site-line bg-white p-6 transition-shadow hover:shadow-[0_12px_32px_rgba(11,27,58,0.10)]"
          >
            <h3 className="font-landing-body text-lg font-bold">Spas y centros de estética</h3>
            <p className={`text-[15px] ${muted}`}>Masajes, faciales y paquetes, con seña para asegurar los turnos largos.</p>
            <span className="mt-auto pt-1 text-[15px] font-bold text-site-ink">Ver la solución →</span>
          </Link>
          <div className="flex flex-col gap-2 rounded-[18px] border border-site-line bg-white p-6">
            <h3 className="font-landing-body text-lg font-bold">Consultorios dentales</h3>
            <p className={`text-[15px] ${muted}`}>Citas por especialista, recordatorios y menos pacientes que no llegan.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-site-line bg-white">
        <div className={`${container} ${sectionY} flex flex-col gap-8`}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 font-bold">
              <Tag accent="onturn">OnTurn</Tag>
              <span aria-hidden="true">+</span>
              <Tag accent="cyberpos">ERP</Tag>
            </div>
            <SectionHeading title="Cobra y emite boletas con el ERP" lead="OnTurn se conecta con el ERP, el sistema de ventas de Createam. Usas la misma cuenta en los dos." />
          </div>
          <FeatureCards
            tone="tinted"
            accent="cyberpos"
            label="OnTurn con el ERP"
            items={[
              { icon: CalendarCheck, title: "Cada reserva llega a tu sistema", text: "La reserva confirmada aparece en el ERP como orden de servicio con la fecha de la cita." },
              { icon: Wallet, title: "La seña queda registrada", text: "Lo que el cliente adelantó se registra como pago de esa orden." },
              { icon: Receipt, title: "Boleta electrónica al terminar", text: "Cierras la venta en el ERP con boleta o factura enviada a SUNAT.", href: "/erp/facturacion-electronica" },
            ]}
          />
        </div>
      </section>

      <section className={`${container} ${sectionY}`}>
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4 rounded-[18px] border border-site-line bg-white p-6 sm:p-8">
          <p className="font-landing-display text-4xl font-extrabold leading-none">Gratis hasta por 1 año</p>
          <p className={`min-w-0 flex-[1_1_420px] text-[15px] ${muted}`}>
            Registrar tu negocio y recibir reservas no cuesta nada durante ese tiempo. Después, OnTurn cobrará una comisión por reserva; te avisaremos antes de activarla.
          </p>
        </div>
      </section>

      <FaqSection faqs={FAQS} accent="onturn" />

      <div className={`${container} pb-14 sm:pb-20`}>
        <CtaBand
          title="Llena tu agenda sin contestar mensajes todo el día"
          text="Registra tu negocio gratis y comparte tu enlace de reservas."
          actions={
            <>
              <ButtonLink href={LINKS.onturnRegister} accent="onturn" track="onturn_registro_final">
                Registrar mi negocio
              </ButtonLink>
              <ButtonLink href="https://beta.onturn.app/barberia-don-juan" variant="outline-dark" track="onturn_ejemplo">
                Ver un negocio de ejemplo
              </ButtonLink>
            </>
          }
        />
      </div>
    </SiteShell>
  );
}
