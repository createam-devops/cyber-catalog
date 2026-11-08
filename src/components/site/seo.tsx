import type { Metadata } from "next";
import type { Faq } from "./ui";

// Metadatos y datos estructurados comunes de las páginas del sitio.

export const SITE_URL = "https://createam.cloud";
const OG_IMAGE = `${SITE_URL}/images/landing/og.png`;

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/** Título, descripción, dirección canónica e imagen para compartir de una página. */
export function pageMetadata({ path, title, description }: { path: string; title: string; description: string }): Metadata {
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "Createam",
      locale: "es_PE",
      title,
      description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Createam: ERP, Catálogo Digital y OnTurn" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE] },
  };
}

export function breadcrumbJsonLd(items: { name: string; href?: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.href ? { item: `${SITE_URL}${item.href === "/" ? "" : item.href}` } : {}),
    })),
  };
}

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/** Bloque JSON-LD. Escapa «<» para que el texto no pueda cerrar la etiqueta. */
export function JsonLd({ graph }: { graph: object[] }) {
  const data = { "@context": "https://schema.org", "@graph": graph };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
