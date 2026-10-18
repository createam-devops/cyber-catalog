import { NextRequest } from 'next/server';
import { panelError, panelJson, STORE_NOT_CREATED, verifyPanelRequest } from '@/lib/server/erp/panel-auth';
import { getStoreCatalog } from '@/lib/server/storefront-data';
import { getTenantById } from '@/lib/server/tenants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Estadísticas de la tienda para la sección Inicio. */
export async function GET(request: NextRequest) {
  const auth = await verifyPanelRequest(request, 'view');
  if (!auth.ok) return panelError(auth.status, auth.code, auth.error);
  const tenant = auth.tenantId ? await getTenantById(auth.tenantId) : null;
  if (!tenant) return STORE_NOT_CREATED();

  let products: number | null = null;
  try {
    products = (await getStoreCatalog(tenant)).products.length;
  } catch {
    // Sin el conteo, la sección igual funciona.
  }
  return panelJson({
    products,
    views: tenant.analyticsViews ?? 0,
    whatsappClicks: tenant.analyticsWhatsapp ?? 0,
  });
}
