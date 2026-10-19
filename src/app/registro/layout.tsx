import type { Metadata } from "next";
import Analytics from "@/components/Analytics";

const title = "Crea tu catálogo digital gratis y vende por WhatsApp | Createam";
const description =
  "Crea tu tienda online con fotos, precios y pedidos por WhatsApp. Productos y stock desde CyberPOS, diseño según tu rubro y sin comisión por venta. Empieza gratis.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://createam.cloud/registro" },
  openGraph: { type: "website", url: "https://createam.cloud/registro", siteName: "Createam", title, description, locale: "es_PE" },
  twitter: { card: "summary", title, description },
};

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Analytics />
      {children}
    </>
  );
}
