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
    ],
  },
  // Permitir múltiples dominios
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; base-uri 'self'; frame-ancestors 'self'; object-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com https://*.g.doubleclick.net https://*.firebaseio.com https://firestore.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com wss://*.firebaseio.com; frame-src 'self'; form-action 'self'; upgrade-insecure-requests"
          },
          ...(isProduction
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }]
            : [])
          ,
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-site'
          }
        ],
      },
    ]
  },
};

export default nextConfig;
