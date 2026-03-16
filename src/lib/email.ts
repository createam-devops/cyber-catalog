import { Resend } from 'resend';

const FROM_EMAIL = 'Createam <noreply@createam.cloud>';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function getAdminEmail() {
  return process.env.PLATFORM_ADMIN_EMAILS?.split(',')[0]?.trim() || 'timori.dev.ia@gmail.com';
}

// --- Email al admin cuando hay nuevo registro ---
export async function sendNewTenantNotification(tenant: {
  businessName: string;
  email: string;
  phone: string;
  domain?: string;
  subdomain?: string;
}) {
  const domainInfo = tenant.domain
    ? `Dominio personalizado: ${tenant.domain}`
    : `Subdominio: ${tenant.subdomain || 'pendiente'}.createam.cloud`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: getAdminEmail(),
    subject: `🚀 Nueva solicitud: ${tenant.businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 8px;">
        <h2 style="color: #111827; margin-bottom: 4px;">Nueva solicitud de catálogo</h2>
        <p style="color: #6b7280; margin-top: 0;">Alguien acaba de registrarse en Createam.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Negocio</td><td style="padding: 8px 0; font-weight: bold; color: #111827;">${tenant.businessName}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Email</td><td style="padding: 8px 0; color: #111827;">${tenant.email}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">WhatsApp</td><td style="padding: 8px 0; color: #111827;">${tenant.phone}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Dominio</td><td style="padding: 8px 0; color: #111827;">${domainInfo}</td></tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <a href="https://createam.cloud/admin" style="display: inline-block; background: #111827; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">Ver en panel admin →</a>
      </div>
    `,
  });
}

// --- Email al usuario confirmando que recibimos su solicitud ---
export async function sendRegistrationConfirmation(tenant: {
  businessName: string;
  email: string;
}) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: tenant.email,
    subject: `¡Recibimos tu solicitud, ${tenant.businessName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 8px;">
        <h2 style="color: #111827;">¡Gracias por registrarte en Createam! 🎉</h2>
        <p style="color: #374151;">Hola, hemos recibido la solicitud para <strong>${tenant.businessName}</strong>.</p>
        <p style="color: #374151;">Nuestro equipo revisará tu solicitud y te notificaremos por este medio cuando tu catálogo digital esté listo.</p>
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">⏱️ Tiempo estimado de activación: <strong>24-48 horas hábiles</strong></p>
        </div>
        <p style="color: #374151;">Si tienes alguna pregunta, responde a este correo o escríbenos por WhatsApp.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Createam · createam.cloud</p>
      </div>
    `,
  });
}

// --- Email al usuario cuando su cuenta es aprobada ---
export async function sendTenantApprovedEmail(tenant: {
  businessName: string;
  email: string;
  subdomain?: string;
  domain?: string;
}) {
  const storeUrl = tenant.domain
    ? `https://${tenant.domain}`
    : `https://${tenant.subdomain}.createam.cloud`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: tenant.email,
    subject: `¡Tu catálogo está activo! 🚀`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 8px;">
        <h2 style="color: #111827;">¡Tu catálogo digital está listo! 🎉</h2>
        <p style="color: #374151;">Hola <strong>${tenant.businessName}</strong>, tu catálogo ha sido aprobado y ya está disponible en línea.</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 12px; color: #166534; font-weight: bold;">Tu tienda está en:</p>
          <a href="${storeUrl}" style="font-size: 18px; color: #16a34a; font-weight: bold;">${storeUrl}</a>
        </div>
        <p style="color: #374151;">Accede a tu panel de administración para personalizar tu tienda, agregar productos y más:</p>
        <a href="https://createam.cloud/tenant-admin" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; margin-top: 8px;">Ir a mi panel →</a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Createam · createam.cloud</p>
      </div>
    `,
  });
}

// --- Email al usuario cuando su cuenta es rechazada ---
export async function sendTenantRejectedEmail(tenant: {
  businessName: string;
  email: string;
}) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: tenant.email,
    subject: `Actualización sobre tu solicitud en Createam`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 8px;">
        <h2 style="color: #111827;">Actualización de tu solicitud</h2>
        <p style="color: #374151;">Hola <strong>${tenant.businessName}</strong>, lamentamos informarte que no pudimos procesar tu solicitud en este momento.</p>
        <p style="color: #374151;">Si crees que esto es un error o deseas más información, contáctanos directamente por WhatsApp y con gusto te ayudamos.</p>
        <a href="https://wa.me/51945111310" style="display: inline-block; background: #25d366; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; margin-top: 8px;">Contactar por WhatsApp →</a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Createam · createam.cloud</p>
      </div>
    `,
  });
}
