import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { brandColor, pngToIco, storeIcon } from '@/lib/server/store-branding';
import { findStoreByDomain, storefrontAvailability } from '@/lib/server/storefront-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Destino interno de /favicon.ico, /icon.png, /apple-touch-icon.png y /site.webmanifest. */
export async function GET(request: NextRequest) {
  const domain = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
  const isPlatform = domain === platform || domain === `www.${platform}` || domain === 'localhost' || domain === '127.0.0.1';
  // Next conserva la URL pública en los handlers reescritos: el parámetro
  // interno del rewrite puede no aparecer en request.nextUrl.
  const asset = ({
    '/favicon.ico': 'favicon',
    '/icon.png': 'icon',
    '/apple-touch-icon.png': 'apple',
    '/site.webmanifest': 'manifest',
  } as Record<string, string>)[request.nextUrl.pathname] ?? request.nextUrl.searchParams.get('asset');
  if (!['favicon', 'icon', 'apple', 'manifest'].includes(asset ?? '')) return new Response('No encontrado', { status: 404 });

  // El Host, sin un parámetro domain manipulable, determina siempre la tienda.
  const tenant = isPlatform ? null : await findStoreByDomain(domain);
  if (!isPlatform && (!tenant || storefrontAvailability(tenant) === 'missing')) return new Response('No encontrado', { status: 404 });

  let body: Buffer;
  let contentType: string;
  let maxAge = 300;
  if (asset === 'manifest') {
    const name = tenant?.name || 'Createam';
    body = Buffer.from(JSON.stringify({
      id: '/',
      name,
      short_name: Array.from(name).slice(0, 12).join(''),
      start_url: '/',
      scope: '/',
      display: 'standalone',
      theme_color: tenant ? brandColor(tenant) : '#1357ad',
      background_color: '#ffffff',
      icons: [192, 512].map((size) => ({ src: `/icon.png?size=${size}`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })),
    }));
    contentType = 'application/manifest+json; charset=utf-8';
  } else {
    const size = asset === 'favicon' ? 32 : asset === 'apple' ? 180 : Number(request.nextUrl.searchParams.get('size') || 96);
    if (asset === 'icon' && ![96, 192, 512].includes(size)) return new Response('Tamaño no válido', { status: 400 });
    contentType = asset === 'favicon' ? 'image/x-icon' : 'image/png';
    if (tenant) {
      const icon = await storeIcon(tenant, size);
      body = asset === 'favicon' ? pngToIco(icon.png) : icon.png;
      maxAge = icon.maxAge;
    } else {
      const file = asset === 'favicon' ? 'favicon.ico' : size === 180 ? 'apple-touch-icon.png' :
        size === 192 || size === 512 ? `web-app-manifest-${size}x${size}.png` : 'favicon-96x96.png';
      body = await fs.readFile(path.join(process.cwd(), 'public/images/favicon', file));
    }
  }

  const etag = `"${createHash('sha256').update(body).digest('hex')}"`;
  const headers = {
    'Content-Type': contentType,
    'Cache-Control': `public, max-age=${maxAge}, must-revalidate`,
    ETag: etag,
    'X-Content-Type-Options': 'nosniff',
  };
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  return new Response(new Uint8Array(body), { headers });
}
