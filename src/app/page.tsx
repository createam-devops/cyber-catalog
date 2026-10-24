import type { Metadata } from "next";
import Analytics from "@/components/Analytics";
import LandingPage from "@/components/landing/LandingPage";
import { CATALOG_GROWTH, CONTACT, FAQS, LINKS } from "@/components/landing/content";

// La sección «Explora productos» lee la tienda de Createam en cada visita (de la
// copia en memoria del catálogo). No puede ser estática con renovación: el cliente
// del ERP usa fetch sin caché y Next lo rechaza al renovar una página estática.
export const dynamic = "force-dynamic";

const SITE_URL = "https://createam.cloud";
const title = "Createam: tienda por WhatsApp, POS con SUNAT y reservas online";
const description =
  "Software en la nube para negocios peruanos: tienda online que vende por WhatsApp y crece con CyberPOS (punto de venta, facturación SUNAT, contabilidad y CRM) y reservas online. Pruébalo gratis.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Createam",
    locale: "es_PE",
    title,
    description,
    images: [
      {
        url: `${SITE_URL}/images/landing/og.png`,
        width: 1200,
        height: 630,
        alt: "Createam: Catálogo Digital, CyberPOS y OnTurn",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${SITE_URL}/images/landing/og.png`],
  },
};

// Datos estructurados para buscadores: quién es Createam, sus productos (el Catálogo
// es parte de la suite CyberPOS) y las preguntas frecuentes
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Createam",
      url: SITE_URL,
      logo: `${SITE_URL}/images/createam-cloud-logo.svg`,
      email: CONTACT.email,
      telephone: CONTACT.phone,
      address: { "@type": "PostalAddress", addressLocality: "Lima", addressCountry: "PE" },
      sameAs: [LINKS.custom],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Createam",
      inLanguage: "es-PE",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/catalogo-digital#app`,
      name: "Catálogo Digital",
      applicationCategory: "BusinessApplication",
      applicationSuite: "CyberPOS",
      operatingSystem: "Web",
      url: `${SITE_URL}/catalogo-digital`,
      description:
        "Tienda online que recibe pedidos por WhatsApp, sin comisión por venta. Vive dentro de CyberPOS y crece en la misma cuenta a punto de venta, facturación electrónica SUNAT, guías de remisión, compras, contabilidad y CRM.",
      featureList: ["Pedidos por WhatsApp", "Diseños por rubro", "Dirección propia o dominio propio", ...CATALOG_GROWTH.map((m) => `Crece con CyberPOS: ${m.title}`)],
      offers: { "@type": "Offer", price: "0", priceCurrency: "PEN", description: "Prueba gratis" },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#cyberpos`,
      name: "CyberPOS",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: `${SITE_URL}/#cyberpos`,
      description:
        "Sistema de ventas modular para negocios peruanos: punto de venta y caja, facturación electrónica y guías de remisión a SUNAT, inventario, compras, contabilidad, CRM con WhatsApp y tienda online (Catálogo Digital).",
      featureList: ["Punto de venta y caja", "Facturación electrónica SUNAT", "Guías de remisión", "Inventario y almacenes", "Compras y proveedores", "Contabilidad", "CRM con WhatsApp", "Tienda online"],
      offers: { "@type": "Offer", price: "0", priceCurrency: "PEN", description: "Plan gratis" },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Analytics />
      <LandingPage />
    </>
  );
}
