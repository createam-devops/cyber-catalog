import RubroPage from "@/components/site/RubroPage";
import { getRubro } from "@/components/site/data/rubros";
import { pageMetadata } from "@/components/site/seo";

const rubro = getRubro("bodegas-y-minimarkets");

export const metadata = pageMetadata({ path: "/bodegas-y-minimarkets", title: rubro.meta.title, description: rubro.meta.description });

export default function Page() {
  return <RubroPage rubro={rubro} />;
}
