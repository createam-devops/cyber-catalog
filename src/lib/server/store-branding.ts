// Iconos de cada tienda a partir de su logo actual (incluido el del ERP).
// Se encajan completos en un cuadrado; las URLs públicas permanecen estables
// cuando cambia el logo. Sin logo usable, se usa una bolsa con sus colores.

import fs from 'node:fs/promises';
import sharp from 'sharp';
import type { TenantConfig } from '@/lib/types';
import { normalizeHex, readableTextOn } from '@/lib/storefront/color';
import { erpApiHost } from './erp/config';
import { resolveStoreImage } from './store-media';

const MAX_BYTES = 5 * 1024 * 1024;
const TTL_MS = 5 * 60 * 1000;
const RETRY_MS = 60 * 1000;
const MAX_ENTRIES = 128;
const TRANSPARENT = { r: 255, g: 255, b: 255, alpha: 0 };

interface IconSource {
  png: Buffer;
  maxAge: number;
}

// La clave incluye identidad y logo; el cambio de marca invalida su copia.
const sources = new Map<string, { expiresAt: number; pending: Promise<IconSource> }>();

export function brandColor(tenant: Pick<TenantConfig, 'colors' | 'primaryColor'>): string {
  return normalizeHex(tenant.colors?.primary ?? tenant.primaryColor, '#2563eb');
}

/** Solo se descargan logos de los mismos proveedores de imágenes del catálogo. */
function allowedLogoUrl(url: URL): boolean {
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return false;
  if (url.hostname === 'firebasestorage.googleapis.com' || url.hostname.endsWith('.cloudinary.com')) return true;
  return [erpApiHost(), 'api.createam.cloud', 'api-dev.createam.cloud'].includes(url.host) && url.pathname.startsWith('/media/');
}

async function readLogo(tenant: TenantConfig): Promise<Buffer | null> {
  if (!tenant.logo?.trim()) return null;
  const url = new URL(tenant.logo, 'https://store.invalid');
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
  const localHost = url.hostname === 'store.invalid' || url.hostname === platform || url.hostname === `www.${platform}` ||
    url.hostname === tenant.domain || url.hostname === `${tenant.subdomain}.${platform}`;
  if (localHost && url.pathname.startsWith('/media/')) {
    const image = resolveStoreImage(url.pathname.slice('/media/'.length).split('/'));
    if (!image) return null;
    const stat = await fs.stat(image.file);
    return stat.size <= MAX_BYTES ? fs.readFile(image.file) : null;
  }
  if (!allowedLogoUrl(url)) return null;

  // Sin redirecciones hacia otros servidores, con límites de tiempo, bytes y
  // píxeles: una imagen de configuración no puede provocar lecturas arbitrarias.
  const response = await fetch(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5000) });
  if (!response.ok || !response.body || !response.headers.get('content-type')?.startsWith('image/')) {
    await response.body?.cancel();
    return null;
  }
  if (Number(response.headers.get('content-length')) > MAX_BYTES) {
    await response.body.cancel();
    return null;
  }
  const chunks: Uint8Array[] = [];
  let length = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > MAX_BYTES) throw new Error('Logo demasiado grande');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

function fallbackSvg(tenant: TenantConfig): Buffer {
  const color = brandColor(tenant);
  // Formas vectoriales sin fuentes: también funciona en el Docker de Alpine.
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="${color}"/><g fill="none" stroke="${readableTextOn(color)}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"><path d="M152 196h208l24 208H128z"/><path d="M204 212v-60a52 52 0 0 1 104 0v60"/></g></svg>`);
}

async function renderSource(tenant: TenantConfig): Promise<IconSource> {
  try {
    const logo = await readLogo(tenant);
    if (logo) {
      const png = await sharp(logo, { limitInputPixels: 16_777_216 })
        .rotate()
        .resize(512, 512, { fit: 'contain', background: TRANSPARENT })
        .png()
        .toBuffer();
      return { png, maxAge: TTL_MS / 1000 };
    }
  } catch {
    // El favicon no deja de funcionar si el servidor del logo no responde.
    console.warn('[store-branding] No se pudo adaptar el logo de la tienda', tenant.id);
  }
  return { png: await sharp(fallbackSvg(tenant)).png().toBuffer(), maxAge: (tenant.logo ? RETRY_MS : TTL_MS) / 1000 };
}

async function iconSource(tenant: TenantConfig): Promise<IconSource> {
  const key = JSON.stringify([tenant.id, tenant.logo, brandColor(tenant)]);
  const cached = sources.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.pending;
  const entry = { expiresAt: Date.now() + TTL_MS, pending: renderSource(tenant) };
  sources.delete(key);
  sources.set(key, entry);
  while (sources.size > MAX_ENTRIES) sources.delete(sources.keys().next().value!);
  try {
    const source = await entry.pending;
    entry.expiresAt = Date.now() + source.maxAge * 1000;
    return source;
  } catch (error) {
    if (sources.get(key) === entry) sources.delete(key);
    throw error;
  }
}

export async function storeIcon(tenant: TenantConfig, size: number): Promise<IconSource> {
  const source = await iconSource(tenant);
  return { png: await sharp(source.png).resize(size, size).png().toBuffer(), maxAge: source.maxAge };
}

/** ICO con una imagen PNG de 32 px, para navegadores que piden /favicon.ico. */
export function pngToIco(png: Buffer): Buffer {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header[6] = 32;
  header[7] = 32;
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, png]);
}
