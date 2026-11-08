import { NextResponse } from "next/server";
import { invoiceLookupUrl } from "@/components/site/erp-public";

// createam.cloud/comprobantes: dirección corta y fácil de dictar para quien
// compró en un negocio que usa ERP. La consulta vive en el ERP; aquí solo
// se redirige (temporal, por si algún día la página pasa a este sitio).
// Se resuelve en cada pedido: la dirección del ERP es configuración del servidor, no del build.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.redirect(invoiceLookupUrl(), 307);
}
