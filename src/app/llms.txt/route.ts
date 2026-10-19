import { PLANS } from '@/lib/plans';
import { CATALOG_GROWTH, CONTACT, CYBERPOS_PLANS, FAQS, LINKS, RESTAURANT_PLANS } from '@/components/landing/content';

// Resumen del sitio para modelos de lenguaje y agentes de IA (formato de llmstxt.org).
// Se arma con los mismos datos de la landing para que precios y enlaces no se desfasen.
export const dynamic = 'force-static';

const SITE_URL = 'https://createam.cloud';
const money = (n: number) => `S/ ${n.toFixed(2)}`;

function buildLlmsTxt(): string {
  const { starter, pro } = PLANS;
  const cyberposPlans = [...CYBERPOS_PLANS, ...RESTAURANT_PLANS]
    .map((plan) => `- ${plan.name}: ${plan.price === 'S/ 0' ? 'gratis hasta por 1 año' : `${plan.price} al mes`}. ${plan.features.join('; ')}.`)
    .join('\n');
  const faqs = FAQS.map((faq) => `- ${faq.question} ${faq.answer}`).join('\n');
  const growth = CATALOG_GROWTH.map((m) => `- ${m.title}: ${m.text}`).join('\n');

  return `# Createam

> Software en la nube para negocios peruanos: Catálogo Digital (tienda online que recibe pedidos por WhatsApp), CyberPOS (sistema de ventas con facturación electrónica SUNAT, contabilidad y CRM) y OnTurn (reservas online para negocios que atienden con cita). Catálogo Digital vive dentro de CyberPOS, así que una tienda online puede crecer a sistema de ventas completo en la misma cuenta. Equipo en Lima, Perú, desde 2017. Precios en soles (PEN).

Las tres herramientas funcionan en el navegador, sin instalar nada y sin contratos de permanencia. Las tres se prueban gratis.

## Productos

- [Catálogo Digital](${SITE_URL}/catalogo-digital): tienda online con catálogo, buscador y categorías; el carrito envía el pedido con el total al WhatsApp del negocio. Sin comisión por venta. Diseños por rubro (regalos, moda, comida, ferretería), dirección en createam.cloud o dominio propio, una página por producto y mapa del sitio para Google. Los productos, fotos, precios y stock se administran en CyberPOS (Venta online).
- [CyberPOS](${SITE_URL}/#cyberpos): sistema de ventas modular para bodegas, tiendas, talleres, restaurantes y negocios que fabrican a medida. Ventas y caja (punto de venta), facturación electrónica y guías de remisión directo a SUNAT, inventario con varios almacenes, compras, contabilidad, CRM con WhatsApp, servicios, producción, tienda online y reportes.
- [OnTurn](${SITE_URL}/#onturn): reservas online las 24 horas para barberías, salones, spas y consultorios dentales, con agenda, recordatorios, reseñas verificadas y seña por Yape o Plin. Incluye un CyberPOS básico.

## Catálogo Digital y CyberPOS: una sola plataforma

Una tienda de Catálogo Digital no es un sistema aparte: vive dentro de CyberPOS. El negocio carga sus productos una sola vez y, cuando crece, activa en la misma cuenta, sin cambiar de sistema ni migrar nada:

${growth}

Al registrarse en ${SITE_URL}/catalogo-digital, el negocio recibe su cuenta de CyberPOS con el plan Catálogo Digital y crea su tienda desde Venta online › Tienda.

## Precios

Catálogo Digital (prueba gratis; se paga desde CyberPOS):
- ${starter.name}: ${money(starter.monthlyPrice)} al mes, o ${money(starter.yearlyPrice)} al año (${money(starter.yearlyPrice / 12)} al mes). Hasta ${starter.limits.products} productos y ${starter.limits.categories} categorías.
- ${pro.name}: ${money(pro.monthlyPrice)} al mes, o ${money(pro.yearlyPrice)} al año (${money(pro.yearlyPrice / 12)} al mes). Productos ilimitados, dominio propio, control de stock, SEO y estadísticas.

CyberPOS (también hay planes a medida):
${cyberposPlans}

OnTurn: gratis hasta por 1 año; después, comisión por reserva.

## Empezar

- [Crear una tienda en Catálogo Digital](${SITE_URL}${LINKS.catalogRegister})
- [Crear una cuenta en CyberPOS](${LINKS.cyberposRegister})
- [Registrar un negocio en OnTurn](${LINKS.onturnRegister})

## Preguntas frecuentes

${faqs}

## Legal y contacto

- [Términos del servicio](${SITE_URL}/terminos)
- [Política de privacidad](${SITE_URL}/privacidad)
- Correo: ${CONTACT.email}. WhatsApp: ${CONTACT.phone}.

## Optional

- [createam.io](${LINKS.custom}): desarrollo de software a medida del mismo equipo.
`;
}

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
