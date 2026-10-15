import { PLANS, TRIAL_DAYS } from '@/lib/plans';
import { CONTACT, CYBERPOS_PLANS, FAQS, LINKS, RESTAURANT_PLANS } from '@/components/landing/content';

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

  return `# Createam

> Software en la nube para negocios peruanos: Catálogo Digital (tienda online que recibe pedidos por WhatsApp), CyberPOS (sistema de ventas con facturación electrónica SUNAT) y OnTurn (reservas online para negocios que atienden con cita). Equipo en Lima, Perú, desde 2017. Precios en soles (PEN).

Las tres herramientas funcionan en el navegador, sin instalar nada y sin contratos de permanencia. Las tres se empiezan gratis.

## Productos

- [Catálogo Digital](${SITE_URL}/#catalogo): tienda online con catálogo, buscador y categorías; el carrito envía el pedido con el total al WhatsApp del negocio. Sin comisión por venta. Dirección en createam.cloud o dominio propio.
- [CyberPOS](${SITE_URL}/#cyberpos): sistema de ventas modular para bodegas, tiendas, talleres, restaurantes y negocios que fabrican a medida. Ventas y caja, facturación electrónica directa a SUNAT, inventario con varios almacenes, compras, servicios, producción y reportes.
- [OnTurn](${SITE_URL}/#onturn): reservas online las 24 horas para barberías, salones, spas y consultorios dentales, con agenda, recordatorios, reseñas verificadas y seña por Yape o Plin. Incluye un CyberPOS básico.

## Precios

Catálogo Digital (${TRIAL_DAYS} días gratis):
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
