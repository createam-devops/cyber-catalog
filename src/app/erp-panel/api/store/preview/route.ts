import { NextRequest } from 'next/server';
import { panelError, panelJson, STORE_NOT_CREATED, verifyPanelRequest } from '@/lib/server/erp/panel-auth';
import { getStoreCatalog } from '@/lib/server/storefront-data';
import { getTenantById } from '@/lib/server/tenants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Unos pocos productos reales para la vista previa del diseño (vacío si aún no publica nada). */
export async function GET(request: NextRequest) {
  const auth = await verifyPanelRequest(request, 'view');
  if (!auth.ok) return panelError(auth.status, auth.code, auth.error);
  const tenant = auth.tenantId ? await getTenantById(auth.tenantId) : null;
  if (!tenant) return STORE_NOT_CREATED();

  try {
    const catalog = await getStoreCatalog(tenant);
    return panelJson({ products: catalog.products.slice(0, 8), categories: catalog.categories });
  } catch {
    return panelJson({ products: [], categories: [] });
  }
}
