/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: {
    // El lint se ejecuta en el CI de GitHub Actions, no durante el build de Docker
    ignoreDuringBuilds: true,
  },
  images: {
    // Las fotos de producto no cambian: cada archivo subido tiene su propio
    // nombre y token. Sin esto Next guardaba la versión optimizada solo 60 s y
    // el servidor volvía a bajar y reducir originales de varios MB sin parar.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      // Fotos de producto del ERP (/media). api-dev para las pruebas de la integración.
      {
        protocol: 'https',
        hostname: 'api.createam.cloud',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'api-dev.createam.cloud',
        pathname: '/media/**',
      },
    ],
  },
  // El registro se mudó a /catalogo-digital (lo que la gente busca). La dirección
  // vieja sigue funcionando: redirección permanente, que Google traspasa.
  async redirects() {
    return [{ source: '/registro', destination: '/catalogo-digital', permanent: true }];
  },

  async headers() {
    // Dominios del ERP que pueden encuadrar la vista previa del editor
    // (cyberERP/PETICION_ERP_AL_CATALOGO_PANEL.md §6). En desarrollo, también localhost.
    const erpOrigins = ['https://app-dev.createam.cloud', 'https://cyberposapp.createam.cloud', ...(isProduction ? [] : ['http://localhost:*'])];
    const csp = (frameAncestors) =>
      `default-src 'self'; base-uri 'self'; frame-ancestors ${frameAncestors}; object-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com https://*.g.doubleclick.net https://*.firebaseio.com https://firestore.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com wss://*.firebaseio.com; frame-src 'self'; form-action 'self'; upgrade-insecure-requests`;
    const common = [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      ...(isProduction ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }] : []),
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
    ];
    return [
      {
        // Todo menos la vista previa: no se deja encuadrar por nadie más.
        source: '/((?!vista-previa$).*)',
        headers: [...common, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }, { key: 'Content-Security-Policy', value: csp("'self'") }],
      },
      {
        // La vista previa del editor la encuadra el ERP: manda el CSP, sin X-Frame-Options.
        source: '/vista-previa',
        headers: [...common, { key: 'Content-Security-Policy', value: csp(`'self' ${erpOrigins.join(' ')}`) }],
      },
      {
        // Paquete <catalog-panel>: el ERP lee el manifiesto sin caché y guarda los archivos para siempre.
        source: '/erp-panel/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
      {
        source: '/erp-panel/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
