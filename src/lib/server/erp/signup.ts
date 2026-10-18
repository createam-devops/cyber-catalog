// Registro de negocios nuevos en el ERP (POST /integrations/partners, con la
// credencial de la app). El negocio nace en el ERP con el plan del catálogo;
// el dueño entra después a CyberPOS y crea su tienda desde «Crea tu tienda
// online». Contrato: cyberERP/RESPUESTA_ADECUACIONES_ERP_CATALOGO.md §A.1/§H.7.
//
//   ERP_SIGNUP_PLAN_CODE  plan del alta (en dev: catalogo_digital). Sin él, el
//                         registro sigue con Firebase. Los planes de dev y de
//                         producción son distintos: va en la configuración.

import { createHash } from 'node:crypto';
import { getErpConfig } from './config';

/** El plan con que se dan de alta los negocios, o null si el registro todavía no va al ERP. */
export function erpSignupPlanCode(): string | null {
  return getErpConfig() ? process.env.ERP_SIGNUP_PLAN_CODE?.trim() || null : null;
}

/** La misma regla que el ERP (auth: 8 caracteres, mayúscula, minúscula y número). */
export const ERP_PASSWORD_RULE = 'Usa al menos 8 caracteres, con una mayúscula, una minúscula y un número.';

export function erpPasswordOk(password: string): boolean {
  return password.length >= 8 && password.length <= 72 && /\p{Lu}/u.test(password) && /\p{Ll}/u.test(password) && /\p{N}/u.test(password);
}

/** Dónde entra el dueño a CyberPOS, con su correo ya escrito. */
export function erpLoginUrl(email: string): string | null {
  const app = process.env.ERP_APP_URL?.trim().replace(/\/+$/, '');
  return app ? `${app}/auth/login?email=${encodeURIComponent(email)}` : null;
}

export type ErpSignupResult =
  | { ok: true; partnerId: number }
  | { ok: false; status: number; code: string; error: string };

/**
 * Da de alta el negocio y su dueño. La referencia sale del correo: si el
 * pedido se repite (doble clic, reintento), el ERP devuelve el mismo negocio.
 */
export async function createErpPartner(input: { businessName: string; ownerName: string; email: string; password: string; phone?: string }): Promise<ErpSignupResult> {
  const config = getErpConfig();
  const planCode = erpSignupPlanCode();
  if (!config || !planCode) return { ok: false, status: 503, code: 'NOT_CONFIGURED', error: 'El registro no está disponible en este momento.' };

  const email = input.email.trim().toLowerCase();
  const externalRef = `catalog-signup-${createHash('sha256').update(email).digest('hex').slice(0, 32)}`;
  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/integrations/partners`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        plan_code: planCode,
        business_name: input.businessName.trim(),
        owner: { name: input.ownerName.trim(), email, password: input.password, ...(input.phone ? { phone: input.phone } : {}) },
        // El correo ya se verificó con el código que mandamos.
        email_verified: true,
        external_ref: externalRef,
      }),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[erp/signup] El ERP no respondió:', error);
    return { ok: false, status: 503, code: 'ERP_UNAVAILABLE', error: 'No pudimos comunicarnos con CyberPOS. Inténtalo en unos minutos.' };
  }

  const body = (await res.json().catch(() => ({}))) as { partner_id?: number; code?: string; error?: string };
  if ((res.status === 200 || res.status === 201) && body.partner_id) return { ok: true, partnerId: body.partner_id };

  switch (body.code) {
    case 'EMAIL_ALREADY_REGISTERED':
      return { ok: false, status: 409, code: body.code, error: 'Ese correo ya tiene una cuenta en CyberPOS. Entra con ella.' };
    case 'WEAK_PASSWORD':
      return { ok: false, status: 400, code: body.code, error: ERP_PASSWORD_RULE };
    case 'PLAN_NOT_FOUND':
    case 'PLAN_NOT_OFFERED_BY_APP':
    case 'APP_CANNOT_PROVISION':
      // Configuración del ERP o de ERP_SIGNUP_PLAN_CODE: no es algo que el dueño pueda arreglar.
      console.error('[erp/signup] El ERP rechazó el alta por configuración:', res.status, body.code);
      return { ok: false, status: 503, code: body.code, error: 'El registro no está disponible en este momento. Escríbenos y te ayudamos.' };
  }
  if (res.status === 429) return { ok: false, status: 429, code: 'RATE_LIMITED', error: 'Demasiados intentos. Espera un momento y vuelve a intentarlo.' };
  if (res.status === 400) return { ok: false, status: 400, code: 'INVALID', error: body.error || 'Revisa los datos del formulario.' };
  console.error('[erp/signup] Respuesta inesperada del ERP:', res.status, body.code);
  return { ok: false, status: 503, code: 'ERP_ERROR', error: 'CyberPOS no pudo crear tu cuenta. Inténtalo en unos minutos.' };
}
