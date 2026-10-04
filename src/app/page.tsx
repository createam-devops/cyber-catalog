import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";
import { CONTACT, FAQS, LINKS } from "@/components/landing/content";

const SITE_URL = "https://createam.cloud";
const title = "Createam: tienda por WhatsApp, POS con SUNAT y reservas online";
const description =
  "Software en la nube para negocios peruanos: tienda online que vende por WhatsApp, sistema de ventas con facturación SUNAT y reservas online. Empieza gratis.";

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

// Datos estructurados para buscadores: quién es Createam y las preguntas frecuentes
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
      <LandingPage />
    </>
  );
}
