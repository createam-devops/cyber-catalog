import { NextRequest } from 'next/server';
import { findStoreByDomain, storeDomainFromRequest, getStoreCatalog, storefrontAvailability } from '@/lib/server/storefront-data';
import { categoryPath, productPath, type StoreCatalog } from '@/lib/storefront/catalog';
import { formatPrice, normalizeWhatsapp, socialUrl } from '@/lib/storefront/public-store';
import { resolveStorefront } from '@/lib/storefront/theme';
import { defaultStoreDescription } from '@/lib/storefront/structured-data';
import { withRatings } from '@/lib/server/reviews';
import { formatRating } from '@/lib/storefront/reviews';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const oneLine = (text: string, max: number) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

/**
 * llms.txt de cada tienda (https://llmstxt.org): una guía en Markdown para
 * asistentes y agentes de IA, con lo mismo que muestra la vitrina: qué vende,
 * precios en soles, cómo se pide y sus preguntas frecuentes. En su dominio, el
 * middleware manda /llms.txt aquí.
 */
export async function GET(request: NextRequest) {
  const domain = storeDomainFromRequest(request);
  const tenant = domain ? await findStoreByDomain(domain).catch(() => null) : null;
  if (!domain || !tenant || storefrontAvailability(tenant) !== 'open') return new Response('No encontrado', { status: 404 });

  const origin = `https://${domain}`;
  const theme = resolveStorefront(tenant);
  const catalog = await getStoreCatalog(tenant).catch(() => ({ products: [], categories: [] }) as StoreCatalog);
  const phone = normalizeWhatsapp(tenant.whatsapp);
  const social = (['instagram', 'facebook', 'tiktok'] as const)
    .map((network) => [network, socialUrl(network, tenant.socialMedia?.[network])] as const)
    .filter(([, url]) => url);
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
  const categoryLabel = new Map(catalog.categories.map((c) => [c.id, c.label]));

  const lines = [
    `# ${tenant.name}`,
    '',
    `> ${oneLine(defaultStoreDescription(tenant, theme, catalog.categories), 300)}`,
    '',
    '- Precios en soles (PEN).',
    `- Los pedidos se hacen por WhatsApp: se eligen los productos en la web y el pedido llega al chat de la tienda, donde se confirman la disponibilidad, el pago y la entrega.`,
    ...(phone ? [`- WhatsApp: +${phone} ([abrir chat](https://wa.me/${phone}))`] : []),
    ...social.map(([network, url]) => `- ${network[0].toUpperCase()}${network.slice(1)}: ${url}`),
    ...theme.benefits.map((b) => `- ${b.title}${b.text ? `: ${b.text}` : ''}`),
    '',
    '## Páginas',
    '',
    `- [Catálogo](${origin}/): todos los productos con su precio.`,
    ...catalog.categories.map((c) => {
      const count = catalog.products.filter((p) => p.category === c.id).length;
      return `- [${c.label}](${origin}${categoryPath(c)}): ${count} ${count === 1 ? 'producto' : 'productos'}.`;
    }),
    `- [Catálogo en JSON](https://${platform}/api/storefront/catalog?domain=${encodeURIComponent(domain)}): productos y categorías en formato de datos.`,
    '',
    '## Productos',
    '',
    ...withRatings(tenant.id, catalog.products).map((p) => {
      const category = categoryLabel.get(p.category);
      const about = p.description?.trim() ? `: ${oneLine(p.description, 160)}` : '';
      const stars = p.rating ? ` · ★ ${formatRating(p.rating.average)} (${p.rating.count} ${p.rating.count === 1 ? 'opinión' : 'opiniones'})` : '';
      return `- [${p.name}](${origin}${productPath(p)}) — ${formatPrice(p.price)}${category ? ` · ${category}` : ''}${stars}${about}`;
    }),
    ...(theme.faq.length ? ['', '## Preguntas frecuentes', '', ...theme.faq.flatMap((f) => [`### ${f.q}`, '', f.a, ''])] : ['']),
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
