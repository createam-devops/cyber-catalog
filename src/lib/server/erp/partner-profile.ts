// Perfil del negocio en el ERP: nombre comercial, logo y WhatsApp. Una tienda
// nace de un negocio que ya los tiene, así que no se duplican: la vitrina y el
// editor usan estos, y los que guardó la tienda quedan solo de respaldo.
//
// Sale de GET /integrations/partner con el token de la app (permiso
// partner.profile.view; pedido 6 de cyberERP/PETICION_ERP_AL_CATALOGO_PANEL.md).
// El ERP tiene un solo teléfono del negocio: sirve de WhatsApp si es un celular.
// Se recuerda 5 minutos y se olvida con el aviso partner.updated. Si el ERP no
// lo entrega (403 sin el permiso), todo sigue con los datos de la tienda.

import type { TenantConfig } from '@/lib/types';
import { normalizeWhatsapp } from '@/lib/storefront/public-store';
import { erpGet, ErpError } from './client';
import { linkedToCurrentErp } from './config';

export interface PartnerProfile {
  name: string | null;
  /** URL pública absoluta del logo (el /media del ERP). */
  logo: string | null;
  /** Listo para wa.me (51…). */
  whatsapp: string | null;
}

const TTL_MS = 5 * 60 * 1000;
const profiles = new Map<number, { at: number; value: PartnerProfile | null }>();

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);

/** Un teléfono sirve de WhatsApp solo si es un celular peruano (9 dígitos que empiezan con 9). */
function mobileFromPhone(phone: string | null): string | null {
  const digits = phone?.replace(/\D/g, '').replace(/^51(?=9\d{8}$)/, '') ?? '';
  return /^9\d{8}$/.test(digits) ? `51${digits}` : null;
}

function toProfile(body: Record<string, unknown>): PartnerProfile | null {
  const logo = text(body.logo_url);
  const profile = {
    name: text(body.name),
    logo: logo && /^https?:\/\//i.test(logo) ? logo : null,
    whatsapp: normalizeWhatsapp(text(body.whatsapp)) ?? mobileFromPhone(text(body.phone)),
  };
  return profile.name || profile.logo || profile.whatsapp ? profile : null;
}

/** Olvida el perfil recordado de un negocio (aviso `partner.updated` del ERP). */
export function forgetPartnerProfile(partnerId: number): void {
  profiles.delete(partnerId);
}

/** El perfil del negocio, o null si el ERP no lo entrega. Se recuerda 5 minutos (también el «no»). */
export async function getPartnerProfile(partnerId: number): Promise<PartnerProfile | null> {
  const cached = profiles.get(partnerId);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  let value: PartnerProfile | null = null;
  try {
    value = toProfile(await erpGet<Record<string, unknown>>(partnerId, '/integrations/partner'));
  } catch (error) {
    // 403/404: el ERP todavía no le da el perfil a la app. Lo demás sí se avisa.
    if (!(error instanceof ErpError && (error.status === 403 || error.status === 404))) {
      console.warn('[erp/partner-profile] No se pudo leer el perfil del negocio', partnerId, error);
    }
  }
  profiles.set(partnerId, { at: Date.now(), value });
  return value;
}

/** Qué datos de la tienda vienen del negocio en el ERP. */
export interface ProfileFields {
  name: boolean;
  logo: boolean;
  whatsapp: boolean;
}

/**
 * La tienda con el nombre, el logo y el WhatsApp de su negocio en el ERP. Si
 * el ERP no los entrega, quedan los de la tienda.
 */
export async function withPartnerProfile(tenant: TenantConfig): Promise<{ tenant: TenantConfig; fromErp: ProfileFields }> {
  const profile = linkedToCurrentErp(tenant.erp) ? await getPartnerProfile(tenant.erp!.partnerId) : null;
  const fromErp = { name: Boolean(profile?.name), logo: Boolean(profile?.logo), whatsapp: Boolean(profile?.whatsapp) };
  if (!profile) return { tenant, fromErp };
  return {
    tenant: {
      ...tenant,
      name: profile.name ?? tenant.name,
      logo: profile.logo ?? tenant.logo,
      whatsapp: profile.whatsapp ?? tenant.whatsapp,
    },
    fromErp,
  };
}
