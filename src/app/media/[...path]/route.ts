import { NextRequest } from 'next/server';
import fs from 'node:fs/promises';
import { resolveStoreImage } from '@/lib/server/store-media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Imágenes de las tiendas (/media/stores/<tienda>/<logo|banner>/<archivo>).
 * Responde en cualquier dominio, también el de cada tienda: el middleware no
 * toca las rutas que terminan en .webp, .jpg o .png. El nombre de cada archivo
 * es único, así que se puede guardar en caché para siempre.
 */
export async function GET(_request: NextRequest, { params }: { params: { path: string[] } }) {
  const image = resolveStoreImage(params.path ?? []);
  if (!image) return new Response('No encontrado', { status: 404 });
  try {
    const data = await fs.readFile(image.file);
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': image.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('No encontrado', { status: 404 });
  }
}
