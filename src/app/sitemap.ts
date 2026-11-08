import { MetadataRoute } from 'next';
import { SITE_PAGES } from '@/components/site/nav';

// Solo páginas de la plataforma, sacadas del mapa del sitio (components/site/nav.ts).
// Las tiendas de los tenants viven en su propio dominio: listarlas aquí como
// createam.cloud/store?_domain=... las duplicaba.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://createam.cloud';
  const lastModified = new Date();

  return SITE_PAGES.map((page) => ({
    url: page.path === '/' ? baseUrl : `${baseUrl}${page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
