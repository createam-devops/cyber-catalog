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
      { url: '/favicon.ico', type: 'image/x-icon', sizes: '32x32' },
      { url: '/icon.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={daysOne.variable}>
      <body className={`${outfit.variable} font-body`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
