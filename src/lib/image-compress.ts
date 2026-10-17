// Reduce las fotos en el navegador antes de subirlas. Una foto de celular pesa
// 3 a 5 MB; ninguna vitrina la muestra a más de 1600 px. Si el navegador no
// puede leer el archivo (por ejemplo HEIC en algunos equipos), se sube tal cual.

export interface ShrunkImage {
  blob: Blob;
  extension: string;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function shrinkImage(file: File, maxSide = 1600, quality = 0.85): Promise<ShrunkImage> {
  const original = { blob: file as Blob, extension: file.name.split('.').pop()?.toLowerCase() || 'jpg' };
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return original;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    // WebP conserva la transparencia de los logos. Los navegadores que no la
    // generan devuelven PNG: en ese caso se prueba JPEG si la foto es opaca.
    let blob = await toBlob(canvas, 'image/webp', quality);
    let extension = 'webp';
    if (!blob || blob.type !== 'image/webp') {
      const keepsAlpha = file.type === 'image/png';
      blob = await toBlob(canvas, keepsAlpha ? 'image/png' : 'image/jpeg', quality);
      extension = keepsAlpha ? 'png' : 'jpg';
    }

    if (!blob || blob.size >= file.size) return original;
    return { blob, extension };
  } catch {
    return original;
  }
}

/** Nombre de archivo seguro: sin espacios ni caracteres raros, con la extensión real. */
export function storageFileName(prefix: string, originalName: string, extension: string): string {
  const base =
    originalName
      .replace(/\.[^.]+$/, '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .slice(0, 60) || 'imagen';
  return `${prefix}${Date.now()}_${base}.${extension}`;
}
