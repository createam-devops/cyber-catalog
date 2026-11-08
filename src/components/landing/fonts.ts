import { Inter, Inter_Tight } from "next/font/google";

// Tipografías del sitio de Createam: Inter Tight para títulos (compacta y
// firme) e Inter para el texto.
export const displayFont = Inter_Tight({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-landing-display", display: "swap" });
export const bodyFont = Inter({ subsets: ["latin"], variable: "--font-landing-body", display: "swap" });
