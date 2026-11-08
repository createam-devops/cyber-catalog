import { notFound } from "next/navigation";
import ModulePage from "@/components/site/ModulePage";
import { MODULE_PAGES } from "@/components/site/data/modules";
import { pageMetadata } from "@/components/site/seo";

// Una página por módulo destacado del ERP (data/modules.ts). Las demás
// direcciones bajo /erp responden 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return MODULE_PAGES.map((m) => ({ modulo: m.slug }));
}

export function generateMetadata({ params }: { params: { modulo: string } }) {
  const m = MODULE_PAGES.find((x) => x.slug === params.modulo);
  return m ? pageMetadata({ path: `/erp/${m.slug}`, title: m.meta.title, description: m.meta.description }) : {};
}

export default function ModuloPage({ params }: { params: { modulo: string } }) {
  const m = MODULE_PAGES.find((x) => x.slug === params.modulo);
  if (!m) notFound();
  return <ModulePage module={m} />;
}
