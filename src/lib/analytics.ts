// Medición del sitio de Createam (createam.cloud). Los ID son públicos: viajan en el HTML.

/** Google Analytics 4: visitas, páginas, secciones vistas y clics en los botones. */
export const GA_MEASUREMENT_ID = 'G-HQ5BXGHL7P';

/**
 * Microsoft Clarity: mapas de calor y grabaciones anónimas de las visitas, para
 * ver dónde se traba la gente. Vacío = apagado. El ID sale de clarity.microsoft.com
 * (Configuración › Información general › ID del proyecto). Al activarlo, la
 * página de Privacidad lo menciona sola.
 */
export const CLARITY_PROJECT_ID = 'zcqwevc70a';

type Gtag = (...args: unknown[]) => void;
type Clarity = (...args: unknown[]) => void;

/**
 * Envía un evento a Analytics (y lo marca en Clarity, para filtrar grabaciones).
 * No hace nada si la medición no está cargada (desarrollo, paneles, tiendas).
 * `gtag` existe desde que carga la página: lo que pase antes de que llegue la
 * librería de Google queda en cola y se envía igual.
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { gtag?: Gtag; clarity?: Clarity };
  w.gtag?.('event', name, params);
  w.clarity?.('event', name);
  if (process.env.NODE_ENV !== 'production') console.debug('[analytics]', name, JSON.stringify(params ?? {}));
}
