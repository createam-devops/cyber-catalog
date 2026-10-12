import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";

// Tipografías de la landing y de las páginas legales
export const displayFont = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-landing-display", display: "swap" });
export const bodyFont = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-landing-body", display: "swap" });
