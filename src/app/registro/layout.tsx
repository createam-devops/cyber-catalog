import type { Metadata } from "next";
import { TRIAL_DAYS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Crea tu tienda online | Catálogo Digital de Createam",
  description: `Registra tu negocio y crea tu tienda online conectada a WhatsApp. ${TRIAL_DAYS} días gratis, sin comisión por venta.`,
  alternates: { canonical: "https://createam.cloud/registro" },
};

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return children;
}
