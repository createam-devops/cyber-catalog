import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;
  
  // Extraer dominio limpio (sin puerto)
  const domain = hostname.split(':')[0];
  
  // Dominio de la plataforma principal
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
  
  // Si es localhost o IP, permitir todo para desarrollo/testing
  if (domain === 'localhost' || domain.startsWith('127.0.0.1') || /^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    return NextResponse.next();
  }
  
  // ============================================================
  // RUTAS GLOBALES: Siempre permitidas desde cualquier dominio
  // ============================================================
  // Estas rutas son parte de la plataforma central y deben estar
  // disponibles desde cualquier dominio (subdominios y personalizados)
  // ============================================================
  if (
    url.pathname.startsWith('/tenant-admin') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/registro') ||
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }
  
  // Si es el dominio principal de la plataforma
  if (domain === platformDomain || domain === `www.${platformDomain}`) {
    // Permitir acceso a rutas de plataforma: /, /store (para testing)
    // y los archivos que leen los buscadores
    if (
      url.pathname === '/' ||
      url.pathname.startsWith('/store') ||
      url.pathname === '/robots.txt' ||
      url.pathname === '/sitemap.xml'
    ) {
      return NextResponse.next();
    }
    
    // Redirigir otras rutas a home
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // ============================================================
  // PARA SUBDOMINIOS O DOMINIOS PERSONALIZADOS
  // ============================================================
  // IMPORTANTE: Usamos rewrite() NO redirect()
  // - rewrite() mantiene la URL visible limpia (ej: /product/[id])
  // - Internamente reescribe a /store/product/[id] para usar nuestros componentes
  // - La URL del navegador NO cambia, solo la ruta interna
  // - Esto es mejor para SEO: URLs limpias sin /store visible
  // ============================================================
  
  // Determinar la ruta interna de destino (siempre usa /store internamente)
  let internalPath: string;
  
  if (url.pathname.startsWith('/product/')) {
    // URL visible: /product/[id]  →  Ruta interna: /store/product/[id]
    internalPath = `/store${url.pathname}`;
  } else if (url.pathname === '/') {
    // URL visible: /  →  Ruta interna: /store
    internalPath = '/store';
  } else if (url.pathname.startsWith('/store')) {
    // Si ya viene con /store, mantenerlo (para compatibilidad/testing)
    internalPath = url.pathname;
  } else {
    // Para cualquier otra ruta, agregar /store
    internalPath = `/store${url.pathname}`;
  }
  
  // Crear URL interna para el rewrite usando la URL base correcta
  // Usar la URL original pero cambiar solo el pathname
  const internalUrl = new URL(request.url);
  internalUrl.pathname = internalPath;
  
  // Limpiar query params existentes y agregar los necesarios
  internalUrl.search = '';
  
  // Copiar todos los query params existentes de la URL original
  url.searchParams.forEach((value, key) => {
    internalUrl.searchParams.set(key, value);
  });
  
  // Agregar el parámetro _domain para identificar el tenant
  internalUrl.searchParams.set('_domain', domain);
  
  // Log para depuración (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware] Rewrite:', {
      originalPath: url.pathname,
      internalPath,
      domain,
      finalUrl: internalUrl.toString()
    });
  }
  
  // REWRITE INTERNO: La URL visible NO cambia, solo la ruta interna
  // Ejemplo: 
  //   - URL visible en navegador: bellasorpresa.createam.cloud/product/123
  //   - Ruta interna procesada: /store/product/123?_domain=bellasorpresa.createam.cloud
  //   - El usuario ve URL limpia, pero usamos componentes de /store
  return NextResponse.rewrite(internalUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)',
  ],
};
