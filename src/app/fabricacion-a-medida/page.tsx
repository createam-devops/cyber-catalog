import RubroPage from "@/components/site/RubroPage";
import { getRubro } from "@/components/site/data/rubros";
import { pageMetadata } from "@/components/site/seo";

const rubro = getRubro("fabricacion-a-medida");

export const metadata = pageMetadata({ path: "/fabricacion-a-medida", title: rubro.meta.title, description: rubro.meta.description });

export default function Page() {
  return <RubroPage rubro={rubro} />;
}
