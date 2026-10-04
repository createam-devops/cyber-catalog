import Image from "next/image";
import Link from "next/link";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { PLANS, TRIAL_DAYS, getYearlyDiscount } from "@/lib/plans";
import { CONTACT, CYBERPOS_PLANS, FAQS, LINKS, RESTAURANT_PLANS, type LandingPlan } from "./content";
import NeedSelector from "./NeedSelector";
import OrderDemo from "./OrderDemo";

const displayFont = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-landing-display", display: "swap" });
const bodyFont = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-landing-body", display: "swap" });

const container = "mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10";
const sectionY = "py-14 sm:py-20 lg:py-24";
const h2 = "font-landing-display text-[clamp(30px,3.6vw,46px)] font-extrabold leading-[1.08] tracking-[-0.015em]";
const tag = "self-start rounded-full px-3 py-1 text-[13px] font-bold";
const btn = "inline-flex min-h-[50px] items-center justify-center rounded-xl px-6 font-bold text-white transition-opacity hover:opacity-90";
const priceBig = "font-landing-display text-4xl font-extrabold leading-none";
const card = "rounded-[18px] border border-[#DDE4F0] bg-white p-6";

const CYBERPOS_MODULES = [
  { title: "Ventas y caja", text: "Vende, cotiza, cobra y cierra caja. Acepta Yape, tarjeta y efectivo." },
  { title: "Facturación electrónica", text: "Boletas, facturas, notas y guías de remisión enviadas directo a SUNAT." },
  { title: "Inventario", text: "Varios almacenes, kardex, transferencias y alertas de vencimiento por lote." },
  { title: "Compras", text: "Órdenes de compra, reposición, proveedores y cuentas por pagar." },
  { title: "Servicios", text: "Órdenes de servicio, agenda de trabajos y garantías." },
  { title: "Producción", text: "Recetas, productos a medida y optimizador de corte de materiales." },
  { title: "Equipo y permisos", text: "Usuarios con roles y permisos por persona: cajero, vendedor, almacenero." },
  { title: "Reportes", text: "Ventas del día, stock actual y cierre de caja." },
];

const perMonth = (yearlyPrice: number) => (yearlyPrice / 12).toFixed(2);

function Bullets({ items, dotClass }: { items: string[]; dotClass: string }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className={`mt-[9px] h-2 w-2 flex-none rounded-full ${dotClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// En celular es una fila que se desliza de lado, dejando asomar la tarjeta
// siguiente; desde `md` se comporta como la grilla o fila que indique className.
function SwipeRow({ label, className, children }: { label: string; className: string; children: React.ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={`-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 md:mx-0 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {children}
    </div>
  );
}

// Tamaño de cada tarjeta dentro de un SwipeRow en celular
const swipeItem = "shrink-0 basis-[80%] snap-start";

function SwipeHint() {
  return <p className="text-sm text-[#5A6885] md:hidden">Desliza para ver más</p>;
}

function PlanCard({ plan, accentBorder, className }: { plan: LandingPlan; accentBorder: string; className: string }) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-[18px] bg-white p-6 ${className} ${
        plan.highlighted ? `border-2 ${accentBorder}` : "border border-[#DDE4F0]"
      }`}
    >
      <h4 className="text-lg font-bold">{plan.name}</h4>
      <p className={priceBig}>
        {plan.price}
        {plan.price !== "S/ 0" && <span className="font-landing-body text-[15px] font-semibold text-[#3D4B66]"> al mes</span>}
      </p>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] text-[#3D4B66]">
        {plan.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </div>
  );
}

export default function LandingPage() {
  const starter = PLANS.starter;
  const pro = PLANS.pro;
  const maxYearlyDiscount = Math.max(getYearlyDiscount("starter"), getYearlyDiscount("pro"));

  return (
    <div
      className={`${displayFont.variable} ${bodyFont.variable} bg-[#F6F8FC] font-landing-body text-[17px] leading-[1.55] text-[#0B1B3A]`}
    >
      <header className="border-b border-[#DDE4F0] bg-white">
        <div className={`${container} flex items-center justify-between gap-x-3 py-3 md:gap-x-7`}>
          <a href="#inicio" className="flex min-h-[44px] items-center gap-2 sm:gap-2.5">
            <Image
              src="/images/createam-cloud-logo.svg"
              alt=""
              width={54}
              height={35}
              className="h-[30px] w-[46px] object-contain sm:h-[35px] sm:w-[54px]"
            />
            <span className="font-heading text-xl sm:text-2xl">Createam</span>
          </a>
          <nav aria-label="Principal" className="hidden items-center gap-7 text-[15px] font-semibold md:flex">
            <a href="#productos" className="flex min-h-[44px] items-center hover:text-[#1357AD]">Productos</a>
            <a href="#precios" className="flex min-h-[44px] items-center hover:text-[#1357AD]">Precios</a>
            <a href="#preguntas" className="flex min-h-[44px] items-center hover:text-[#1357AD]">Preguntas</a>
            <a href="#contacto" className="flex min-h-[44px] items-center hover:text-[#1357AD]">Contacto</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <a
              href="#ingresar"
              className="hidden min-h-[44px] items-center rounded-xl border-[1.5px] border-[#C5D0E3] px-[18px] text-[15px] font-bold hover:border-[#0B1B3A] sm:inline-flex"
            >
              Ingresar
            </a>
            <a
              href="#empezar"
              className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-xl bg-[#1357AD] px-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90 sm:px-[18px]"
            >
              Empezar gratis
            </a>
          </div>
        </div>
      </header>

      <main>
        <section id="inicio" className="bg-[#0B1B3A] text-white">
          <div className={`${container} flex flex-wrap items-center gap-14 py-12 sm:py-16 lg:py-24`}>
            <div className="flex min-w-0 flex-[1_1_430px] flex-col gap-[22px]">
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#9FC2F2]">
                Software en la nube para negocios peruanos
              </p>
              <h1 className="font-landing-display text-[clamp(42px,6vw,74px)] font-extrabold leading-[1.02] tracking-[-0.02em]">
                Vende, factura y llena tu agenda.
              </h1>
              <p className="max-w-[34em] text-[clamp(17px,1.6vw,20px)] text-[#C9D6EE]">
                Tres herramientas que usas desde el celular o la computadora: una tienda que vende por WhatsApp, un sistema
                de ventas con facturación SUNAT y reservas online. Las tres se empiezan gratis.
              </p>
              <div className="mt-1.5 flex flex-wrap gap-3">
                <a
                  href="#empezar"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-[14px] bg-white px-[26px] text-[17px] font-bold text-[#0B1B3A] transition-opacity hover:opacity-90"
                >
                  Elegir mi herramienta
                </a>
                <a
                  href="#precios"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-[14px] border-[1.5px] border-[#5F78A8] px-[26px] text-[17px] font-bold text-white hover:border-white"
                >
                  Ver precios
                </a>
              </div>
              <ul className="mt-2.5 flex flex-wrap gap-x-[26px] gap-y-2 text-[15px] font-semibold text-[#C9D6EE]">
                {["Sin instalar nada", "Sin contratos de permanencia", "Desarrollado en Lima desde 2017"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-2 w-2 flex-none rounded-full bg-[#9FC2F2]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative aspect-[10/8.2] min-w-0 flex-[1_1_460px]">
              <div className="absolute left-0 top-0 w-[88%] overflow-hidden rounded-[14px] border border-[#2A3D66] bg-[#13264D] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                <div className="flex items-center gap-1.5 px-3 py-2.5">
                  <span className="h-[9px] w-[9px] rounded-full bg-[#3A4F7C]" />
                  <span className="h-[9px] w-[9px] rounded-full bg-[#3A4F7C]" />
                  <span className="h-[9px] w-[9px] rounded-full bg-[#3A4F7C]" />
                  <span className="ml-2 text-xs font-semibold text-[#9FB3D6]">CyberPOS</span>
                </div>
                <Image
                  src="/images/landing/cyberpos-vender.webp"
                  alt="Pantalla de venta de CyberPOS con productos de abarrotes y la orden en curso"
                  width={1200}
                  height={750}
                  priority
                  sizes="(min-width: 1024px) 520px, 88vw"
                  className="block h-auto w-full"
                />
              </div>

              {/* Ilustración de una tienda de Catálogo Digital (no es una captura) */}
              <div
                aria-hidden="true"
                className="absolute bottom-0 left-[5%] flex aspect-[390/800] w-[26%] flex-col overflow-hidden rounded-[20px] border-[5px] border-[#13264D] bg-white text-[clamp(6px,0.85vw,10px)] leading-tight text-[#0B1B3A] shadow-[0_18px_40px_rgba(0,0,0,0.5)]"
              >
                <div className="bg-[#A21CAF] px-[9%] py-[8%] font-bold text-white">Tu tienda</div>
                <div className="grid flex-1 grid-cols-2 content-start gap-[6%] p-[8%]">
                  {["S/ 35.00", "S/ 48.00", "S/ 90.00", "S/ 60.00"].map((price, i) => (
                    <div key={price} className="flex flex-col gap-[6%]">
                      <div className={`aspect-square rounded-[18%] ${i % 2 === 0 ? "bg-[#F7E3F9]" : "bg-[#EADCF7]"}`} />
                      <div className="h-[3px] w-[80%] rounded bg-[#DDE4F0]" />
                      <span className="font-bold text-[#7A1485]">{price}</span>
                    </div>
                  ))}
                </div>
                <div className="m-[8%] rounded-[8px] bg-[#0B7A6E] py-[7%] text-center font-bold text-white">Pedir por WhatsApp</div>
              </div>

              <div className="absolute bottom-[5%] right-0 w-[26%] overflow-hidden rounded-[20px] border-[5px] border-[#13264D] bg-white shadow-[0_18px_40px_rgba(0,0,0,0.5)]">
                <Image
                  src="/images/landing/onturn-inicio.webp"
                  alt="Pantalla de inicio de OnTurn con buscador, categorías y servicios"
                  width={520}
                  height={1067}
                  priority
                  sizes="(min-width: 1024px) 150px, 26vw"
                  className="block aspect-[390/800] h-auto w-full object-cover object-top"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="empezar" className={`${container} pb-10 pt-14 sm:pb-14 sm:pt-20 lg:pt-24`}>
          <div className="flex max-w-[720px] flex-col gap-3">
            <h2 className={h2}>¿Qué necesitas resolver?</h2>
            <p className="text-[#3D4B66]">Elige tu caso y te decimos con cuál empezar y cuánto cuesta.</p>
          </div>
          <NeedSelector />
        </section>

        <div id="productos">
          <section id="catalogo" className="border-y border-[#DDE4F0] bg-white">
            <div className={`${container} ${sectionY} flex flex-wrap items-start gap-x-16 gap-y-11`}>
              <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-[18px]">
                <span className={`${tag} bg-[#F7E3F9] text-[#7A1485]`}>Catálogo Digital</span>
                <h2 className={h2}>Tu tienda online, con el pedido directo a tu WhatsApp</h2>
                <p className="text-[#3D4B66]">
                  Para quienes venden por redes sociales y quieren una tienda con su marca, sin pagar comisión por cada venta.
                </p>
                <Bullets
                  dotClass="bg-[#A21CAF]"
                  items={[
                    "Catálogo con buscador, categorías y fotos de cada producto.",
                    "Carrito que arma el pedido y lo envía a tu WhatsApp con el total.",
                    "Tu logo, tus colores y tus banners de portada.",
                    "Dirección gratis en createam.cloud o tu propio dominio.",
                  ]}
                />
                <div className="mt-1.5 flex flex-wrap items-center gap-x-[22px] gap-y-3.5">
                  <Link href={LINKS.catalogRegister} className={`${btn} bg-[#A21CAF]`}>
                    Crear mi tienda gratis
                  </Link>
                  <span className="font-bold">Desde S/ {perMonth(starter.yearlyPrice)} al mes pagando el año</span>
                </div>
              </div>
              <OrderDemo />
            </div>
          </section>

          <section id="cyberpos" className={`${container} ${sectionY}`}>
            <div className="flex flex-wrap items-center gap-x-16 gap-y-10">
              <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-[18px]">
                <span className={`${tag} bg-[#DDF3EA] text-[#065F46]`}>CyberPOS</span>
                <h2 className={h2}>El sistema de ventas completo que se adapta a tu negocio</h2>
                <p className="text-[#3D4B66]">
                  De la bodega a la planta: activas solo los módulos que necesitas, cuando los necesitas. Para bodegas,
                  minimarkets, tiendas, talleres, restaurantes y negocios que fabrican a medida, como vidrierías y
                  carpinterías de melamina.
                </p>
                <div className="flex flex-wrap items-center gap-x-[22px] gap-y-3.5">
                  <a href={LINKS.cyberposRegister} className={`${btn} bg-[#047857]`}>
                    Crear cuenta gratis
                  </a>
                  <span className="font-bold">Sin tarjeta y sin permanencia</span>
                </div>
              </div>
              <div className="min-w-0 flex-[1_1_420px] overflow-hidden rounded-2xl border border-[#DDE4F0] shadow-[0_16px_40px_rgba(11,27,58,0.12)]">
                <Image
                  src="/images/landing/cyberpos-productos.webp"
                  alt="Lista de productos de CyberPOS con categoría, stock, precio y costo"
                  width={1200}
                  height={750}
                  sizes="(min-width: 1024px) 540px, 92vw"
                  className="block h-auto w-full"
                />
              </div>
            </div>

            <div className="mt-11 flex flex-col gap-2.5">
              <SwipeHint />
              <SwipeRow label="Módulos de CyberPOS" className="md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3">
                {CYBERPOS_MODULES.map((module) => (
                  <div key={module.title} className={`${swipeItem} rounded-2xl border border-[#DDE4F0] bg-white p-5`}>
                    <h3 className="mb-1.5 font-landing-body text-lg font-bold">{module.title}</h3>
                    <p className="text-[15px] text-[#3D4B66]">{module.text}</p>
                  </div>
                ))}
                <div className={`${swipeItem} rounded-2xl border border-[#A8DCC6] bg-[#DDF3EA] p-5`}>
                  <h3 className="mb-1.5 font-landing-body text-lg font-bold text-[#065F46]">Inteligencia artificial</h3>
                  <p className="text-[15px] text-[#1F4D3D]">
                    Integración opcional: propone cortes que desperdician menos material, toma medidas desde fotos y planos
                    y prepara reportes para decidir.
                  </p>
                </div>
              </SwipeRow>
            </div>

            <div className="mt-7 flex flex-col gap-[22px] rounded-[22px] bg-[#0B3B2E] p-6 text-white sm:p-9">
              <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
                <div className="min-w-0 flex-[1_1_380px]">
                  <h3 className="font-landing-display text-[clamp(24px,2.6vw,32px)] font-bold leading-[1.15]">
                    ¿Tienes un restaurante?
                  </h3>
                  <p className="mt-1.5 text-[#CFE6DD]">CyberPOS tiene dos planes pensados para el salón y la cocina.</p>
                </div>
                <a
                  href={LINKS.whatsapp}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-[22px] font-bold text-[#0B3B2E] transition-opacity hover:opacity-90"
                >
                  Pedir una demostración
                </a>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2 rounded-2xl bg-[#124A3B] p-[22px]">
                  <h4 className="text-[19px] font-bold">Restaurante</h4>
                  <p className="text-[15px] text-[#CFE6DD]">
                    Salón con mesas en vivo, comandas desde celular o tablet, comanda impresa en cocina, caja y comprobantes
                    electrónicos.
                  </p>
                  <p className="font-bold">S/ 24.90 al mes</p>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl bg-[#124A3B] p-[22px]">
                  <h4 className="text-[19px] font-bold">Restaurante Inteligente</h4>
                  <p className="text-[15px] text-[#CFE6DD]">
                    Todo lo anterior, más pantalla de cocina por estación y hasta 20 pantallas interactivas en las mesas
                    para que el cliente vea la carta y pida.
                  </p>
                  <p className="font-bold">S/ 49.90 al mes</p>
                </div>
              </div>
            </div>
          </section>

          <section id="onturn" className="border-y border-[#DDE4F0] bg-white">
            <div className={`${container} ${sectionY} flex flex-col gap-9`}>
              <div className="flex flex-wrap items-center gap-x-16 gap-y-10">
                <div className="min-w-0 flex-[1_1_460px] overflow-hidden rounded-2xl border border-[#DDE4F0] shadow-[0_16px_40px_rgba(11,27,58,0.12)]">
                  <Image
                    src="/images/landing/onturn-negocio.webp"
                    alt="Página de un negocio en OnTurn con horarios, servicios, equipo y reseñas"
                    width={1100}
                    height={773}
                    sizes="(min-width: 1024px) 560px, 92vw"
                    className="block h-auto w-full"
                  />
                </div>
                <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-[18px]">
                  <span className={`${tag} bg-[#D9F0ED] text-[#00574F]`}>OnTurn</span>
                  <h2 className={h2}>Reservas online para negocios que atienden con cita</h2>
                  <p className="text-[#3D4B66]">
                    Para barberías, salones, spas y consultorios dentales que quieren llenar su agenda sin depender del
                    teléfono.
                  </p>
                  <Bullets
                    dotClass="bg-[#007A70]"
                    items={[
                      "Reservas las 24 horas: el cliente elige servicio, profesional y horario.",
                      "Agenda por día y por semana, con turnos manuales para quien llega o llama.",
                      "Recordatorios automáticos y lista de espera.",
                      "Reseñas verificadas, solo de clientes atendidos.",
                      "Seña por Yape o Plin para asegurar la cita.",
                    ]}
                  />
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-[22px] gap-y-3.5">
                    <a href={LINKS.onturnRegister} className={`${btn} bg-[#007A70]`}>
                      Registrar mi negocio
                    </a>
                    <span className="font-bold">Gratis hasta por 1 año</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-7 gap-y-3.5 rounded-[18px] border border-[#DDE4F0] bg-[#F6F8FC] p-5 sm:p-7">
                <div className="flex items-center gap-2.5 font-bold">
                  <span className="rounded-full bg-[#D9F0ED] px-3 py-1 text-[13px] text-[#00574F]">OnTurn</span>
                  <span aria-hidden="true">+</span>
                  <span className="rounded-full bg-[#DDF3EA] px-3 py-1 text-[13px] text-[#065F46]">CyberPOS</span>
                </div>
                <p className="min-w-0 flex-[1_1_420px] text-[#3D4B66]">
                  <strong className="text-[#0B1B3A]">Funcionan juntos.</strong> Al registrar tu negocio en OnTurn recibes
                  también un CyberPOS básico, con una sola cuenta para tu agenda y tus ventas.
                </p>
              </div>
            </div>
          </section>
        </div>

        <section id="precios" className={`${container} ${sectionY} flex flex-col gap-10`}>
          <div className="flex max-w-[720px] flex-col gap-3">
            <h2 className={h2}>Precios claros, en soles</h2>
            <p className="text-[#3D4B66]">
              Mensualidad fija por producto. Empiezas gratis en los tres y cambias de plan cuando quieras.
            </p>
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
              <h3 className="font-landing-display text-2xl font-bold">Catálogo Digital</h3>
              <span className="text-[15px] text-[#3D4B66]">
                {TRIAL_DAYS} días gratis · Ahorra hasta {maxYearlyDiscount}% pagando el año
              </span>
            </div>
            <SwipeRow label="Planes de Catálogo Digital" className="md:grid md:grid-cols-2 md:gap-4">
              <div className={`${card} ${swipeItem} flex flex-col gap-3`}>
                <h4 className="text-lg font-bold">{starter.name}</h4>
                <div>
                  <p className={priceBig}>
                    S/ {perMonth(starter.yearlyPrice)}
                    <span className="font-landing-body text-[15px] font-semibold text-[#3D4B66]"> al mes, pagando el año</span>
                  </p>
                  <p className="mt-1.5 text-sm text-[#3D4B66]">
                    S/ {starter.yearlyPrice.toFixed(2)} al año · o S/ {starter.monthlyPrice.toFixed(2)} mes a mes
                  </p>
                </div>
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] text-[#3D4B66]">
                  <li>
                    Hasta {starter.limits.products} productos y {starter.limits.categories} categorías
                  </li>
                  <li>{starter.limits.heroSlides} banner de portada</li>
                  <li>Dirección tunegocio.createam.cloud</li>
                  <li>Pedidos por WhatsApp</li>
                </ul>
              </div>
              <div className={`${swipeItem} flex flex-col gap-3 rounded-[18px] border-2 border-[#A21CAF] bg-white p-6`}>
                <h4 className="text-lg font-bold">{pro.name}</h4>
                <div>
                  <p className={priceBig}>
                    S/ {perMonth(pro.yearlyPrice)}
                    <span className="font-landing-body text-[15px] font-semibold text-[#3D4B66]"> al mes, pagando el año</span>
                  </p>
                  <p className="mt-1.5 text-sm text-[#3D4B66]">
                    S/ {pro.yearlyPrice.toFixed(2)} al año · o S/ {pro.monthlyPrice.toFixed(2)} mes a mes
                  </p>
                </div>
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] text-[#3D4B66]">
                  <li>Productos y categorías ilimitados</li>
                  <li>Tu propio dominio</li>
                  <li>Control de stock</li>
                  <li>Redes sociales, SEO y estadísticas</li>
                  <li>Hasta {pro.limits.heroSlides} banners de portada</li>
                </ul>
              </div>
            </SwipeRow>
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
              <h3 className="font-landing-display text-2xl font-bold">CyberPOS</h3>
              <span className="text-[15px] text-[#3D4B66]">Plan gratis hasta por 1 año · Sin tarjeta y sin permanencia</span>
            </div>
            <SwipeHint />
            <SwipeRow label="Planes de CyberPOS" className="md:flex-wrap md:gap-4">
              {CYBERPOS_PLANS.map((plan) => (
                <PlanCard key={plan.name} plan={plan} accentBorder="border-[#047857]" className={`${swipeItem} md:flex-[1_1_230px]`} />
              ))}
            </SwipeRow>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3.5 rounded-[18px] border border-[#A8DCC6] bg-[#DDF3EA] px-6 py-[22px]">
              <div className="min-w-0 flex-[1_1_420px]">
                <h4 className="text-lg font-bold text-[#065F46]">Plan a tu medida</h4>
                <p className="mt-1 text-[15px] text-[#1F4D3D]">
                  ¿Vendes productos y servicios, fabricas a medida o quieres sumar inteligencia artificial? Armamos un plan
                  solo con los módulos que usa tu negocio.
                </p>
              </div>
              <a href={LINKS.whatsapp} className={`${btn} min-h-[48px] bg-[#047857]`}>
                Armar mi plan
              </a>
            </div>
            <div className="mt-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
              <h4 className="text-lg font-bold">Para restaurantes</h4>
              <a href={LINKS.whatsapp} className="text-[15px] font-bold text-[#1357AD] underline hover:text-[#0F3281]">
                Pide una demostración
              </a>
            </div>
            <SwipeRow label="Planes de CyberPOS para restaurantes" className="md:flex-wrap md:gap-4">
              {RESTAURANT_PLANS.map((plan) => (
                <PlanCard key={plan.name} plan={plan} accentBorder="border-[#047857]" className={`${swipeItem} md:flex-[1_1_300px]`} />
              ))}
            </SwipeRow>
          </div>

          <div className="flex flex-col gap-3.5">
            <h3 className="font-landing-display text-2xl font-bold">OnTurn</h3>
            <div className={`${card} flex flex-wrap items-center gap-x-10 gap-y-4`}>
              <p className={priceBig}>Gratis hasta por 1 año</p>
              <p className="min-w-0 flex-[1_1_420px] text-[15px] text-[#3D4B66]">
                Registrar tu negocio y recibir reservas no cuesta nada durante ese tiempo, e incluye un CyberPOS básico.
                Después, OnTurn cobrará una comisión por reserva; te avisaremos antes de activarla.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-[#DDE4F0] bg-white">
          <div className={`${container} ${sectionY} flex flex-col gap-8`}>
            <div className="flex max-w-[720px] flex-col gap-3">
              <h2 className={h2}>Quién está detrás</h2>
              <p className="text-[#3D4B66]">
                Createam es un equipo de Lima que desarrolla software desde 2017. Estas plataformas nacieron de proyectos
                reales con negocios peruanos.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              {[
                { value: "2017", label: "Año en que empezamos" },
                { value: "150+", label: "Proyectos entregados" },
                { value: "3", label: "Plataformas propias en la nube" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[18px] border border-[#DDE4F0] p-3.5 sm:p-6">
                  <p className="font-landing-display text-[28px] font-extrabold leading-none text-[#1357AD] sm:text-[44px]">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-[13px] leading-snug text-[#3D4B66] sm:text-[15px]">{stat.label}</p>
                </div>
              ))}
            </div>
            <SwipeRow label="Negocios que usan las plataformas" className="md:grid md:grid-cols-3 md:gap-4">
              <div className={`${swipeItem} flex flex-col gap-2 rounded-[18px] bg-[#F6F8FC] p-6`}>
                <span className="self-start rounded-full bg-[#F7E3F9] px-2.5 py-1 text-xs font-bold text-[#7A1485]">Catálogo Digital</span>
                <h3 className="font-landing-body text-[19px] font-bold">Tienda de regalos personalizados</h3>
                <p className="text-[15px] text-[#3D4B66]">
                  Vende por redes sociales con envíos a todo el Perú y recibe por WhatsApp los pedidos de su catálogo.
                </p>
              </div>
              <div className={`${swipeItem} flex flex-col gap-2 rounded-[18px] bg-[#F6F8FC] p-6`}>
                <span className="self-start rounded-full bg-[#DDF3EA] px-2.5 py-1 text-xs font-bold text-[#065F46]">CyberPOS</span>
                <h3 className="font-landing-body text-[19px] font-bold">Vidriería y venta de accesorios</h3>
                <p className="text-[15px] text-[#3D4B66]">Gestiona su operación diaria con CyberPOS.</p>
              </div>
              <div className={`${swipeItem} flex flex-col gap-2 rounded-[18px] bg-[#F6F8FC] p-6`}>
                <span className="self-start rounded-full bg-[#D9F0ED] px-2.5 py-1 text-xs font-bold text-[#00574F]">OnTurn</span>
                <h3 className="font-landing-body text-[19px] font-bold">Barberías, spas y consultorios</h3>
                <p className="text-[15px] text-[#3D4B66]">OnTurn está en beta con sus primeros locales.</p>
              </div>
            </SwipeRow>
          </div>
        </section>

        <section id="preguntas" className={`mx-auto w-full max-w-[860px] px-5 sm:px-8 lg:px-10 ${sectionY}`}>
          <h2 className={`${h2} mb-5`}>Preguntas frecuentes</h2>
          {FAQS.map((faq) => (
            <details key={faq.question} className="group border-b border-[#C5D0E3]">
              <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 py-2 text-lg font-bold [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span aria-hidden="true" className="text-2xl font-normal text-[#1357AD] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-[#3D4B66]">{faq.answer}</p>
            </details>
          ))}
        </section>
      </main>

      <footer className="bg-[#0B1B3A] text-white">
        <div className={`${container} flex flex-col gap-11 pb-9 pt-14 sm:pt-20`}>
          <div id="contacto" className="flex flex-wrap items-center justify-between gap-x-12 gap-y-6">
            <div className="min-w-0 flex-[1_1_420px]">
              <h2 className={h2}>¿No sabes por cuál empezar?</h2>
              <p className="mt-2.5 text-[#C9D6EE]">Escríbenos y te orientamos según tu negocio.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={LINKS.whatsapp}
                className="inline-flex min-h-[52px] items-center justify-center rounded-[14px] bg-white px-[26px] font-bold text-[#0B1B3A] transition-opacity hover:opacity-90"
              >
                WhatsApp {CONTACT.phone}
              </a>
              <a
                href={LINKS.email}
                className="inline-flex min-h-[52px] items-center justify-center rounded-[14px] border-[1.5px] border-[#5F78A8] px-[26px] font-bold text-white hover:border-white"
              >
                {CONTACT.email}
              </a>
            </div>
          </div>

          <div id="ingresar" className="flex flex-wrap items-center gap-x-7 gap-y-2.5 border-t border-[#2A3D66] pt-7">
            <span className="font-bold">¿Ya eres cliente? Ingresa a:</span>
            <Link href={LINKS.catalogLogin} className="flex min-h-[44px] items-center font-semibold text-[#9FC2F2] underline hover:text-white">
              Catálogo Digital
            </Link>
            <a href={LINKS.cyberposLogin} className="flex min-h-[44px] items-center font-semibold text-[#9FC2F2] underline hover:text-white">
              CyberPOS
            </a>
            <a href={LINKS.onturnLogin} className="flex min-h-[44px] items-center font-semibold text-[#9FC2F2] underline hover:text-white">
              OnTurn
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-2.5 border-t border-[#2A3D66] pt-6 text-sm text-[#C9D6EE]">
            <span>© {new Date().getFullYear()} Createam · Lima, Perú</span>
            <a href={LINKS.custom} className="flex min-h-[44px] items-center underline hover:text-white">
              Desarrollo a medida
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
