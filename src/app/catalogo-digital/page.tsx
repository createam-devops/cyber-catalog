import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, MessageCircle, Palette, Search, Smartphone, Store, Boxes, Globe, TrendingUp } from "lucide-react";
import SignupForm from "@/components/registro/SignupForm";
import { bodyFont, displayFont } from "@/components/landing/fonts";
import { CATALOG_GROWTH, CONTACT, LINKS } from "@/components/landing/content";
import { ERP_PASSWORD_RULE, erpLoginBase, erpSignupPlanCode } from "@/lib/server/erp/signup";

// El registro depende de la configuración del servidor (alta en CyberPOS).
export const dynamic = "force-dynamic";

const container = "mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10";
const h2 = "font-landing-display text-[clamp(28px,3.4vw,42px)] font-extrabold leading-[1.1] tracking-[-0.015em]";
const autoGrid = "grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]";

const STEPS = [
  { title: "Crea tu cuenta", text: "Escribe los datos de tu negocio y confirma tu correo con el código que te enviamos." },
  { title: "Arma tu tienda en CyberPOS", text: "Entra a CyberPOS, elige tu rubro y tu tienda queda en línea con su propia dirección." },
  { title: "Publica y comparte", text: "Publica tus productos desde Venta online y comparte el enlace por WhatsApp y redes." },
];

const BENEFITS = [
  { icon: MessageCircle, title: "Pedidos por WhatsApp", text: "Tus clientes arman su carrito y te escriben con el pedido listo: productos, cantidades y total." },
  { icon: Boxes, title: "Tus productos desde CyberPOS", text: "Fotos, precios y stock se cargan una vez en CyberPOS y la tienda se actualiza sola." },
  { icon: Palette, title: "Diseño según tu rubro", text: "Regalos, moda, comida o ferretería: textos, colores y estilo pensados para lo que vendes." },
  { icon: Globe, title: "Tu propia dirección", text: "Tu tienda en tunegocio.createam.cloud, con certificado seguro. Con el plan Pro, en tu propio dominio." },
  { icon: Search, title: "Lista para Google", text: "Cada producto tiene su página con nombre, precio y foto, y la tienda trae su mapa del sitio." },
  { icon: Smartphone, title: "Hecha para el celular", text: "Rápida y cómoda en el teléfono, que es donde compran tus clientes." },
];

const FAQS = [
  {
    question: "¿Cuánto cuesta?",
    answer: "Empiezas con una prueba gratis. Al terminar eliges tu plan y lo pagas desde CyberPOS, en Ajustes › Mi plan.",
  },
  {
    question: "¿Tengo que usar CyberPOS?",
    answer:
      "Al registrarte creamos tu cuenta de CyberPOS con el plan Catálogo Digital. Ahí cargas tus productos y administras tu tienda: no necesitas otro sistema.",
  },
  {
    question: "¿Cobran comisión por mis ventas?",
    answer: "No. Los pedidos te llegan directo por WhatsApp y no cobramos comisión por venta.",
  },
  {
    question: "¿Cómo me pagan mis clientes?",
    answer: "Te escriben por WhatsApp con su pedido y coordinas el pago como ya lo haces: Yape, transferencia o contra entrega.",
  },
  {
    question: "¿Mi tienda se conecta con un sistema de ventas?",
    answer:
      "Sí. Tu tienda vive dentro de CyberPOS, el sistema de ventas de Createam: productos, fotos, precios y stock se cargan una sola vez. Cuando tu negocio crece, activas en la misma cuenta punto de venta, facturación electrónica SUNAT, guías de remisión, compras, contabilidad y CRM con WhatsApp, sin cambiar de sistema ni migrar nada.",
  },
  {
    question: "¿Puedo emitir boletas y facturas?",
    answer:
      "Sí, activando la facturación electrónica en tu plan de CyberPOS: boletas, facturas, notas y guías de remisión enviadas directo a SUNAT, con los mismos productos de tu tienda.",
  },
  {
    question: "¿Puedo usar mi propio dominio?",
    answer: "Sí, con el plan Pro. Mientras tanto tu tienda queda en una dirección como tunegocio.createam.cloud.",
  },
  {
    question: "Ya tengo CyberPOS, ¿cómo activo mi tienda?",
    answer: "Entra a CyberPOS con tu usuario. Si tu plan incluye Catálogo Digital, la encuentras en Venta online › Tienda.",
  },
];

// Datos estructurados: qué es (una aplicación de la suite CyberPOS), qué hace y sus preguntas frecuentes.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://createam.cloud/catalogo-digital#app",
      name: "Catálogo Digital de Createam",
      applicationCategory: "BusinessApplication",
      applicationSuite: "CyberPOS",
      operatingSystem: "Web",
      inLanguage: "es-PE",
      url: "https://createam.cloud/catalogo-digital",
      description:
        "Tienda online para negocios peruanos que recibe pedidos por WhatsApp. Vive dentro de CyberPOS, así que puede crecer a punto de venta, facturación electrónica SUNAT, guías de remisión, compras, contabilidad y CRM con WhatsApp en la misma cuenta.",
      featureList: [...BENEFITS.map((b) => b.title), ...CATALOG_GROWTH.map((m) => `Crece con CyberPOS: ${m.title}`)],
      offers: { "@type": "Offer", price: "0", priceCurrency: "PEN", description: "Prueba gratis" },
      publisher: { "@type": "Organization", "@id": "https://createam.cloud/#organization", name: "Createam", url: "https://createam.cloud" },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
    },
  ],
};

export default function RegistroPage() {
  const signupOpen = Boolean(erpSignupPlanCode());
  const loginBase = erpLoginBase();

  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} bg-[#F6F8FC] font-landing-body text-[17px] leading-[1.55] text-[#0B1B3A]`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <header className="border-b border-[#DDE4F0] bg-white">
        <div className={`${container} flex items-center justify-between gap-x-3 py-3`}>
          <Link href="/" className="flex min-h-[44px] items-center gap-2 sm:gap-2.5">
            <Image src="/images/createam-cloud-logo.svg" alt="" width={54} height={35} className="h-[30px] w-[46px] object-contain sm:h-[35px] sm:w-[54px]" />
            <span className="font-heading text-xl sm:text-2xl">Createam</span>
          </Link>
          {loginBase && (
            <a
              href={loginBase}
              className="inline-flex min-h-[44px] items-center rounded-xl border-[1.5px] border-[#C5D0E3] px-4 text-[15px] font-bold hover:border-[#0B1B3A]"
            >
              Entrar a CyberPOS
            </a>
          )}
        </div>
      </header>

      <main>
        <section className="bg-[#0B1B3A] text-white">
          <div className={`${container} grid items-start gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:py-20`}>
            <div className="flex flex-col gap-5 lg:pt-6">
              <span className="self-start rounded-full bg-[#F7E3F9] px-3 py-1 text-[13px] font-bold text-[#7A1485]">Catálogo Digital</span>
              <h1 className="font-landing-display text-[clamp(36px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.02em]">
                Crea tu catálogo digital y recibe pedidos por WhatsApp
              </h1>
              <p className="max-w-[560px] text-[19px] text-[#C9D6EE]">
                Muestra tus productos con fotos y precios en tu propia dirección web. Tus clientes eligen, arman su pedido y te escriben por WhatsApp.
              </p>
              <ul className="flex flex-col gap-2.5 text-[16px] font-semibold text-[#E3EAF7]">
                {[
                  "Lista en minutos, sin instalar nada",
                  "Productos, precios y stock desde CyberPOS",
                  "Crece a punto de venta, facturación SUNAT y contabilidad sin cambiar de sistema",
                  "Prueba gratis y sin comisión por venta",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 flex-none text-[#F0ABFC]" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div id="registro" className="scroll-mt-6 rounded-[20px] bg-white p-6 text-[#0B1B3A] shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#F7E3F9] text-[#A21CAF]">
                  <Store className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <h2 className="font-landing-display text-xl font-extrabold leading-tight">Empieza gratis</h2>
                  <p className="text-[15px] text-[#5A6885]">Tu cuenta de CyberPOS con el plan Catálogo Digital</p>
                </div>
              </div>
              {signupOpen ? (
                <SignupForm passwordRule={ERP_PASSWORD_RULE} loginBase={loginBase} />
              ) : (
                <p className="rounded-xl bg-[#F6F8FC] px-4 py-3 text-[#3D4B66]">
                  El registro no está disponible en este momento. Escríbenos por{" "}
                  <a href={LINKS.whatsapp} className="font-bold text-[#7A1485] underline">
                    WhatsApp al {CONTACT.phone}
                  </a>{" "}
                  y te ayudamos a crear tu tienda.
                </p>
              )}
              <p className="mt-4 text-center text-xs text-[#5A6885]">
                Al crear tu cuenta aceptas los{" "}
                <Link href="/terminos" className="underline">
                  Términos
                </Link>{" "}
                y la{" "}
                <Link href="/privacidad" className="underline">
                  Política de privacidad
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className={`${container} flex flex-col gap-8`}>
            <h2 className={h2}>Así de fácil empiezas</h2>
            <ol className={autoGrid}>
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex flex-col gap-2 rounded-[18px] border border-[#DDE4F0] bg-white p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#A21CAF] font-landing-display text-lg font-extrabold text-white">{index + 1}</span>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="text-[#3D4B66]">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-[#DDE4F0] bg-white py-14 sm:py-20">
          <div className={`${container} flex flex-col gap-8`}>
            <h2 className={h2}>Todo lo que trae tu tienda</h2>
            <div className={autoGrid}>
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex flex-col gap-2 rounded-[18px] border border-[#DDE4F0] bg-[#F6F8FC] p-6">
                  <Icon className="h-7 w-7 text-[#A21CAF]" aria-hidden />
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="text-[#3D4B66]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className={`${container} flex flex-col gap-8`}>
            <div className="flex max-w-[760px] flex-col gap-3">
              <span className="self-start rounded-full bg-[#DDF3EA] px-3 py-1 text-[13px] font-bold text-[#065F46]">CyberPOS</span>
              <h2 className={h2}>Empieza con tu tienda y crece con CyberPOS</h2>
              <p className="text-[#3D4B66]">
                Tu Catálogo Digital vive dentro de CyberPOS, el sistema de ventas de Createam. Cuando tu negocio lo necesite, activas más módulos
                en la misma cuenta: con los mismos productos, el mismo stock y sin migrar nada.
              </p>
            </div>
            <div className={autoGrid}>
              {CATALOG_GROWTH.map((module) => (
                <div key={module.title} className="flex flex-col gap-2 rounded-[18px] border border-[#A8DCC6] bg-white p-6">
                  <TrendingUp className="h-6 w-6 text-[#047857]" aria-hidden />
                  <h3 className="text-lg font-bold">{module.title}</h3>
                  <p className="text-[#3D4B66]">{module.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[#DDE4F0] bg-white py-14 sm:py-20">
          <div className={`${container} flex flex-col gap-8`}>
            <h2 className={h2}>Preguntas frecuentes</h2>
            <div className="flex flex-col gap-3">
              {FAQS.map((faq) => (
                <details key={faq.question} className="group rounded-[16px] border border-[#DDE4F0] bg-[#F6F8FC] p-5 open:shadow-sm">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                    {faq.question}
                    <span className="text-2xl leading-none text-[#A21CAF] transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-[#3D4B66]">{faq.answer}</p>
                </details>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 rounded-[20px] bg-[#0B1B3A] p-7 text-white sm:p-9">
              <div className="min-w-0 flex-[1_1_320px]">
                <h2 className="font-landing-display text-2xl font-extrabold sm:text-3xl">Tu tienda puede estar en línea hoy</h2>
                <p className="mt-1.5 text-[#C9D6EE]">Créala gratis y comparte el enlace con tus clientes.</p>
              </div>
              <a href="#registro" className="inline-flex min-h-[52px] items-center justify-center rounded-[14px] bg-[#A21CAF] px-7 text-[17px] font-bold text-white transition-opacity hover:opacity-90">
                Crear mi catálogo
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0B1B3A] text-sm text-[#C9D6EE]">
        <div className={`${container} flex flex-wrap items-center justify-between gap-x-7 gap-y-2 py-6`}>
          <span>© {new Date().getFullYear()} Createam · Lima, Perú</span>
          <div className="flex flex-wrap gap-x-6">
            <Link href="/" className="flex min-h-[44px] items-center underline hover:text-white">
              Inicio
            </Link>
            <Link href="/terminos" className="flex min-h-[44px] items-center underline hover:text-white">
              Términos
            </Link>
            <Link href="/privacidad" className="flex min-h-[44px] items-center underline hover:text-white">
              Privacidad
            </Link>
            <a href={LINKS.whatsapp} className="flex min-h-[44px] items-center underline hover:text-white">
              WhatsApp {CONTACT.phone}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
