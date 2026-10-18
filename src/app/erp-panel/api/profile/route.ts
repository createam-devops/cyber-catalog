import { NextRequest } from 'next/server';
import { panelError, panelJson, verifyPanelRequest } from '@/lib/server/erp/panel-auth';
import { getPartnerProfile } from '@/lib/server/erp/partner-profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Nombre comercial, logo y WhatsApp del negocio en el ERP, para no volver a
 * pedirlos al crear la tienda (sección Bienvenida). Vacíos si el ERP no los entrega.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyPanelRequest(request, 'view');
  if (!auth.ok) return panelError(auth.status, auth.code, auth.error);
  const profile = await getPartnerProfile(auth.claims.partnerId);
  return panelJson({ name: profile?.name ?? null, logo: profile?.logo ?? null, whatsapp: profile?.whatsapp ?? null });
}
