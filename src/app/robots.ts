export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/tenant-admin/', '/api/', '/login', '/store'],
      },
    ],
    sitemap: 'https://createam.cloud/sitemap.xml',
  };
}
