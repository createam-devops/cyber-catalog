// Lo que el sitio lee de las páginas públicas del ERP de Createam, sin sesión.
// Sigue al ERP configurado (api-dev en pruebas, api en producción); sin
// configuración, o si la dirección no es pública, usa la de producción.

const PRODUCTION_API = "https://api.createam.cloud/api/v1";

export function erpPublicApiBase(): string {
  const base = process.env.ERP_API_BASE_URL?.trim().replace(/\/+$/, "");
  return base && base.startsWith("https://") ? base : PRODUCTION_API;
}

/** La consulta de comprobantes del ERP (RS 097-2012): quien compró escribe los datos de su comprobante. */
export function invoiceLookupUrl(): string {
  return `${erpPublicApiBase()}/public/comprobantes`;
}

export interface AllyTermsParams {
  currency?: string;
  share_pct?: { recommender?: number; servicing?: number; accounting?: number; lead?: number };
  activation_bonus?: { amount?: number; hold_days?: number };
  payout?: { frequencies?: string[]; minimum?: number; pay_within_days?: number };
  notice_days?: number;
  opportunity_days?: number;
  own_plan_tiers?: { min_active_clients: number; discount_pct: number }[];
  results_share_pct?: number;
}

export interface AllyTerms {
  programOpen: boolean;
  version: number | null;
  effectiveFrom: string | null;
  params: AllyTermsParams | null;
}

/**
 * Las condiciones vigentes del Programa de Aliados. Se renuevan cada media hora;
 * si el ERP no responde, la página sale sin cifras (nunca con cifras inventadas).
 */
export async function getAllyTerms(): Promise<AllyTerms | null> {
  try {
    const res = await fetch(`${erpPublicApiBase()}/public/allies/terms`, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(2500),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      program_open?: boolean;
      terms?: { version_no?: number; effective_from?: string; params?: AllyTermsParams } | null;
    };
    return {
      programOpen: Boolean(body.program_open),
      version: body.terms?.version_no ?? null,
      effectiveFrom: body.terms?.effective_from?.slice(0, 10) ?? null,
      params: body.terms?.params ?? null,
    };
  } catch {
    return null;
  }
}
