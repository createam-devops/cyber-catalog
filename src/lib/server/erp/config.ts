// Conexión con el ERP (CyberPOS). Todo sale de variables de entorno: las
// pruebas van contra api-dev y en producción solo cambia la URL. Sin URL o sin
// secreto, la integración queda apagada y las tiendas siguen con Firebase.
//
//   ERP_API_BASE_URL       https://api-dev.createam.cloud/api/v1
//   ERP_APP_CLIENT_ID      catalog (por defecto)
//   ERP_APP_CLIENT_SECRET  secreto de la app, lo genera el operador del ERP
//                          en Plataforma › Aplicaciones (se ve una sola vez)
//   ERP_WEBHOOK_SECRET     secreto de la dirección de avisos de la app

export interface ErpConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string | null;
}

export function getErpConfig(): ErpConfig | null {
  const baseUrl = process.env.ERP_API_BASE_URL?.trim().replace(/\/+$/, '');
  const clientSecret = process.env.ERP_APP_CLIENT_SECRET?.trim();
  if (!baseUrl || !clientSecret) return null;
  return {
    baseUrl,
    clientId: process.env.ERP_APP_CLIENT_ID?.trim() || 'catalog',
    clientSecret,
    webhookSecret: process.env.ERP_WEBHOOK_SECRET?.trim() || null,
  };
}

/** Servidor del ERP configurado (p. ej. `api-dev.createam.cloud`). */
export function erpApiHost(): string | null {
  const config = getErpConfig();
  if (!config) return null;
  try {
    return new URL(config.baseUrl).host;
  } catch {
    return null;
  }
}

/**
 * Si el enlace de una tienda vale para el ERP configurado. Las tiendas creadas
 * desde CyberPOS guardan en qué ERP nacieron (`api`): así, al pasar de api-dev
 * a producción, una tienda de prueba del negocio 1 de dev no muestra los
 * productos del negocio 1 de producción. Los enlaces sin `api` (puestos a mano
 * por el superadmin) valen para cualquiera.
 */
export function linkedToCurrentErp(link: { partnerId?: number; api?: string | null } | null | undefined): boolean {
  if (!link?.partnerId) return false;
  return !link.api || link.api === erpApiHost();
}
