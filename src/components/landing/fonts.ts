import localFont from "next/font/local";

// Tipografías del sitio de Createam: Inter Tight para títulos (compacta y
// firme) e Inter para el texto. Van en el repositorio (variables, solo latín:
// cubre tildes, ñ, ¿ y ¡) para no depender de Google Fonts al compilar: el CI
// fallaba de vez en cuando porque Google respondía direcciones sin extensión.
export const displayFont = localFont({
  src: "./font-files/inter-tight-latin.woff2",
  weight: "100 900",
  variable: "--font-landing-display",
  display: "swap",
});

export const bodyFont = localFont({
  src: "./font-files/inter-latin.woff2",
  weight: "100 900",
  variable: "--font-landing-body",
  display: "swap",
});
