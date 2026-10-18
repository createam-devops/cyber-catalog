import { NextRequest } from 'next/server';
import { catalogPublicUrl, panelError, panelJson, STORE_NOT_CREATED, verifyPanelRequest } from '@/lib/server/erp/panel-auth';
import { saveStoreImage, toPublicMediaUrl } from '@/lib/server/store-media';
import { checkRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

/**
 * Sube el logo o un banner de la tienda. El paquete ya la reduce en el
 * navegador; aquí se guarda en el disco del servidor (store-media) y se
 * devuelve su URL absoluta, que el editor manda de vuelta al guardar. La foto
 * viaja por esta misma API, con la sesión del ERP (contrato §4).
 */
export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'erp-panel-images', 30);
  if (rateLimit.limited) return panelError(429, 'RATE_LIMITED', 'Demasiadas imágenes seguidas. Espera un momento.');

  const auth = await verifyPanelRequest(request, 'manage');
  if (!auth.ok) return panelError(auth.status, auth.code, auth.error);
  if (!auth.tenantId) return STORE_NOT_CREATED();

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const kind = String(form?.get('kind') ?? '');
  if (!(file instanceof Blob) || (kind !== 'logo' && kind !== 'banner')) return panelError(400, 'INVALID', 'Falta la imagen.');
  const extension = TYPES[file.type];
  if (!extension) return panelError(400, 'INVALID', 'Usa una imagen JPG, PNG o WebP.');
  if (file.size > MAX_BYTES) return panelError(400, 'INVALID', 'La imagen pesa más de 5 MB.');

  try {
    const stored = await saveStoreImage(auth.tenantId, kind, Buffer.from(await file.arrayBuffer()), extension);
    return panelJson({ url: toPublicMediaUrl(stored, catalogPublicUrl(request)) }, 201);
  } catch (error) {
    console.error('[erp-panel/images] No se pudo guardar la imagen:', error);
    return panelError(500, 'UPLOAD_FAILED', 'No se pudo subir la imagen. Inténtalo de nuevo.');
  }
}
