// Medición con Google Analytics 4. El ID es público: viaja en el HTML.
export const GA_MEASUREMENT_ID = 'G-HQ5BXGHL7P';

type Gtag = (...args: unknown[]) => void;

// No hace nada si Analytics no está cargado (desarrollo, paneles, tiendas)
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  (window as unknown as { gtag?: Gtag }).gtag?.('event', name, params);
}
