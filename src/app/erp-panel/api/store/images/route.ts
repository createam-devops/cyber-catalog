import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { panelError, panelJson, STORE_NOT_CREATED, verifyPanelRequest } from '@/lib/server/erp/panel-auth';
import { getCentralAdminBucket } from '@/lib/server/central-admin';
import { checkRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
const KINDS = new Set(['banner', 'logo']);

/**
 * Sube el logo o un banner de la tienda. El paquete ya la reduce en el
 * navegador; aquí se guarda en el Storage central con un token de descarga,
 * así la URL es pública e inmutable. La foto viaja por esta misma API, con la
 * sesión del ERP (contrato §4).
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
  if (!(file instanceof Blob) || !KINDS.has(kind)) return panelError(400, 'INVALID', 'Falta la imagen.');
  const extension = TYPES[file.type];
  if (!extension) return panelError(400, 'INVALID', 'Usa una imagen JPG, PNG o WebP.');
  if (file.size > MAX_BYTES) return panelError(400, 'INVALID', 'La imagen pesa más de 5 MB.');

  try {
    const bucket = getCentralAdminBucket();
    const path = `stores/${auth.tenantId}/${kind}/${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
    const token = randomUUID();
    await bucket.file(path).save(Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=31536000, immutable',
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
    return panelJson({ url }, 201);
  } catch (error) {
    console.error('[erp-panel/images] No se pudo subir la imagen:', error);
    return panelError(500, 'UPLOAD_FAILED', 'No se pudo subir la imagen. Inténtalo de nuevo.');
  }
}
