import { PLANS } from '@/lib/plans';
import { CATALOG_GROWTH, CONTACT, CYBERPOS_PLANS, FAQS, LINKS, RESTAURANT_PLANS } from '@/components/landing/content';
import { MODULE_GROUPS, MODULE_PAGES } from '@/components/site/data/modules';
import { RUBROS } from '@/components/site/data/rubros';

// Resumen del sitio para modelos de lenguaje y agentes de IA (formato de llmstxt.org).
// Se arma con los mismos datos de las páginas para que precios y enlaces no se desfasen.
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
  const modulePages = MODULE_PAGES.map((m) => `- [${m.name}](${SITE_URL}/erp/${m.slug}): ${m.meta.description}`).join('\n');
  const allModules = MODULE_GROUPS.map((g) => `- ${g.title}: ${g.modules.map((m) => `${m.name} (${m.text.replace(/\.$/, '')})`).join('; ')}.`).join('\n');
  const rubros = RUBROS.map((r) => `- [${r.name}](${SITE_URL}/${r.slug}), con ${r.product}: ${r.meta.description}`).join('\n');

  return `# Createam

> Software en la nube para negocios peruanos: el ERP de Createam (sistema de ventas modular con punto de venta, facturación electrónica SUNAT, inventario, contabilidad y CRM omnicanal con WhatsApp, Instagram y Messenger), Catálogo Digital (tienda online que recibe pedidos por WhatsApp y vive dentro del ERP) y OnTurn (reservas online para negocios que atienden con cita). Equipo en Lima, Perú, desde 2017. Precios en soles (PEN).

Las tres herramientas funcionan en el navegador, sin instalar nada y sin contratos de permanencia. Las tres se empiezan gratis. El ERP se arma por módulos: además de las soluciones por rubro, se configura un plan a la medida de cada negocio.

## Productos

- [ERP de Createam](${SITE_URL}/erp): sistema de ventas para bodegas, tiendas, restaurantes, talleres y negocios que fabrican a medida. Plan gratis hasta por 1 año.
- [Catálogo Digital](${SITE_URL}/catalogo-digital): tienda online con catálogo, buscador y carrito que envía el pedido con el total al WhatsApp del negocio. Sin comisión por venta. Los productos, fotos, precios y stock se administran en el ERP (Venta online).
- [OnTurn](${SITE_URL}/onturn): reservas online las 24 horas para barberías, spas, centros de estética y consultorios dentales, con agenda por profesional, recordatorios por correo y notificación, lista de espera, reseñas verificadas y seña por Yape o Plin. Se conecta con el ERP: cada reserva confirmada llega como orden de servicio.
- [Tienda Createam](https://catalogo.createam.cloud/): equipos para el punto de venta, con precios en soles; se piden por WhatsApp. Está hecha con Catálogo Digital y tiene su propia guía en https://catalogo.createam.cloud/llms.txt.

## Soluciones por rubro

${rubros}

## Módulos del ERP con página propia

${modulePages}

## Todos los módulos del ERP

${allModules}

## Catálogo Digital y el ERP: una sola plataforma

Una tienda de Catálogo Digital no es un sistema aparte: vive dentro del ERP. El negocio carga sus productos una sola vez y, cuando crece, activa en la misma cuenta, sin cambiar de sistema ni migrar nada:

${growth}

Al registrarse en ${SITE_URL}/catalogo-digital, el negocio recibe su cuenta del ERP con el plan Catálogo Digital y crea su tienda desde Venta online › Tienda.

## Precios

Todos los precios están en ${SITE_URL}/precios.

Catálogo Digital (prueba gratis; se paga desde el ERP):
- ${starter.name}: ${money(starter.monthlyPrice)} al mes, o ${money(starter.yearlyPrice)} al año (${money(starter.yearlyPrice / 12)} al mes). Hasta ${starter.limits.products} productos y ${starter.limits.categories} categorías.
- ${pro.name}: ${money(pro.monthlyPrice)} al mes, o ${money(pro.yearlyPrice)} al año (${money(pro.yearlyPrice / 12)} al mes). Productos ilimitados, dominio propio, control de stock, SEO y estadísticas.

ERP (también hay planes a medida):
${cyberposPlans}

OnTurn: gratis hasta por 1 año; después, comisión por reserva.

## Programa de Aliados

- [Programa de Aliados](${SITE_URL}/aliados): técnicos, contadores, vendedores de equipos y consultores que recomiendan ERP, lo instalan o llevan la contabilidad de sus clientes y cobran una participación mensual mientras los atienden. Ser aliado es gratis. Solicitud: ${LINKS.allyJoin}

## Para clientes de negocios que usan ERP

- [Consultar un comprobante electrónico](${SITE_URL}${LINKS.invoiceLookup}): quien compró en un negocio que usa ERP busca su boleta o factura con sus datos y la descarga.

## Empezar

- [Crear una cuenta en el ERP](${LINKS.cyberposRegister})
- [Crear una tienda en Catálogo Digital](${SITE_URL}${LINKS.catalogRegister})
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
