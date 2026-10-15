import type { Metadata } from "next";
import { Days_One, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-body",
});

// Fuente de títulos servida desde el propio sitio: evita la petición a Google Fonts que bloqueaba el renderizado
const daysOne = Days_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-days-one",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Createam - Ideas Creativas en la Nube",
  description: "Plataformas SaaS diseñadas para convertir la tecnología en rentabilidad. Gestión de Turnos, Catálogo Digital y POS Integral.",
  icons: {
    icon: [
      { url: '/images/favicon/favicon.ico' },
      { url: '/images/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/images/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/images/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'manifest', url: '/images/favicon/site.webmanifest' },
    ],
  },
  manifest: '/images/favicon/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={daysOne.variable}>
      <head>
        <link rel="icon" href="/images/favicon/favicon.ico" sizes="any" />
        <link rel="icon" href="/images/favicon/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/images/favicon/apple-touch-icon.png" />
        <link rel="manifest" href="/images/favicon/site.webmanifest" />
      </head>
      <body className={`${outfit.variable} font-body`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
