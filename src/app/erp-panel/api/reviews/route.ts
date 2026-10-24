import { NextRequest } from 'next/server';
import { z } from 'zod';
import { panelError, panelJson, STORE_NOT_CREATED, verifyPanelRequest } from '@/lib/server/erp/panel-auth';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { getStoreCatalog } from '@/lib/server/storefront-data';
import { getTenantById } from '@/lib/server/tenants';
import { isLocalStore, listReviews, logLocalAudit, setReviewStatus } from '@/lib/server/store-db';
import { productPath } from '@/lib/storefront/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Opiniones de la tienda para su editor (sección Inicio): las pendientes de
 * revisar, las últimas publicadas y los productos con su dirección (para
 * pedirle una opinión a un cliente por WhatsApp).
 */
export async function GET(request: NextRequest) {
  const auth = await verifyPanelRequest(request, 'view');
  if (!auth.ok) return panelError(auth.status, auth.code, auth.error);
  if (!auth.tenantId || !isLocalStore(auth.tenantId)) return STORE_NOT_CREATED();
  const tenant = await getTenantById(auth.tenantId);
  if (!tenant) return STORE_NOT_CREATED();

  const products = await getStoreCatalog(tenant)
    .then((catalog) => catalog.products.map((p) => ({ id: p.id, name: p.name, path: productPath(p) })))
    .catch(() => []);
  const names = new Map(products.map((p) => [p.id, p.name]));
  const withName = <T extends { productId: string }>(review: T) => ({ ...review, productName: names.get(review.productId) ?? 'Producto retirado' });

  return panelJson({
    pending: listReviews(auth.tenantId, 'pending', 100).map(withName),
    approved: listReviews(auth.tenantId, 'approved', 30).map(withName),
    products,
  });
}

const decisionSchema = z.object({ id: z.coerce.number().int().positive(), status: z.enum(['approved', 'rejected']) }).strict();

/** Publicar o rechazar una opinión. */
export async function PATCH(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'erp-panel-reviews', 120);
  if (rateLimit.limited) return panelError(429, 'RATE_LIMITED', 'Demasiados cambios seguidos. Espera un momento.');

  const auth = await verifyPanelRequest(request, 'manage');
  if (!auth.ok) return panelError(auth.status, auth.code, auth.error);
  if (!auth.tenantId || !isLocalStore(auth.tenantId)) return STORE_NOT_CREATED();

  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return panelError(400, 'INVALID', 'Datos no válidos.');
  if (!setReviewStatus(auth.tenantId, parsed.data.id, parsed.data.status)) return panelError(404, 'NOT_FOUND', 'Esa opinión no existe.');

  logLocalAudit({
    storeId: auth.tenantId,
    action: parsed.data.status === 'approved' ? 'review.approved' : 'review.rejected',
    actor: { uid: `erp:${auth.claims.userId}`, email: auth.claims.email, role: auth.claims.role },
    metadata: { reviewId: parsed.data.id },
  });
  return panelJson({ ok: true });
}
