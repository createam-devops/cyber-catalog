import { MetadataRoute } from 'next';

// Solo páginas de la plataforma. Las tiendas de los tenants viven en su propio
// dominio: listarlas aquí como createam.cloud/store?_domain=... las duplicaba.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://createam.cloud';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/registro`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
