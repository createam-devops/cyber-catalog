import RubroPage from "@/components/site/RubroPage";
import { getRubro } from "@/components/site/data/rubros";
import { pageMetadata } from "@/components/site/seo";

const rubro = getRubro("restaurantes");

export const metadata = pageMetadata({ path: "/restaurantes", title: rubro.meta.title, description: rubro.meta.description });

export default function Page() {
  return <RubroPage rubro={rubro} />;
}
