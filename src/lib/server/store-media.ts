// Imágenes de las tiendas del ERP (banners y, mientras el ERP no entregue el
// del negocio, el logo). Van al disco del servidor, junto a la base
// (DATA_DIR/media), y se sirven en /media/... desde el dominio de cada tienda:
// mejor para el SEO que una URL de otro dominio.
//
// En la base se guarda la ruta relativa (/media/stores/...). El editor, que
// vive en el dominio del ERP, la recibe absoluta (ver toPublicMediaUrl).

import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { dataDir } from './store-db';

export const MEDIA_PATH = '/media/';

const TYPES: Record<string, string> = { webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png' };
const SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;
const FILE = /^[A-Za-z0-9_-]{1,80}\.(webp|jpg|png)$/;

const mediaRoot = () => path.join(dataDir(), 'media');

/** Guarda la imagen y devuelve su ruta pública relativa. El nombre es único: el archivo nunca cambia. */
export async function saveStoreImage(storeId: string, kind: 'logo' | 'banner', data: Buffer, extension: string): Promise<string> {
  if (!SEGMENT.test(storeId) || !TYPES[extension]) throw new Error('Imagen o tienda no válida');
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const folder = path.join(mediaRoot(), 'stores', storeId, kind);
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(path.join(folder, name), data);
  return `${MEDIA_PATH}stores/${storeId}/${kind}/${name}`;
}

/** El archivo que corresponde a /media/<segmentos>, o null si la ruta no es de una imagen de tienda. */
export function resolveStoreImage(segments: string[]): { file: string; contentType: string } | null {
  if (segments.length !== 4) return null;
  const [scope, storeId, kind, name] = segments;
  if (scope !== 'stores' || !SEGMENT.test(storeId) || (kind !== 'logo' && kind !== 'banner') || !FILE.test(name)) return null;
  const extension = name.slice(name.lastIndexOf('.') + 1);
  return { file: path.join(mediaRoot(), scope, storeId, kind, name), contentType: TYPES[extension] };
}

/** Ruta guardada → URL absoluta del catálogo (para el editor dentro del ERP). */
export function toPublicMediaUrl<T extends string | undefined | null>(url: T, base: string): T {
  return (typeof url === 'string' && url.startsWith(MEDIA_PATH) ? `${base}${url}` : url) as T;
}

/** URL absoluta del catálogo → ruta para guardar. Las demás URLs quedan igual. */
export function toStoredMediaUrl<T extends string | undefined | null>(url: T, base: string): T {
  const prefix = `${base}${MEDIA_PATH}`;
  return (typeof url === 'string' && url.startsWith(prefix) ? url.slice(base.length) : url) as T;
}
