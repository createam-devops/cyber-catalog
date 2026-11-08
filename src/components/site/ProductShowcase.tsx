import Image from "next/image";
import Link from "next/link";
import SwipeRow from "@/components/landing/SwipeRow";
import { SHOWCASE_URL, type Showcase } from "@/components/landing/showcase";
import { formatPrice } from "@/lib/storefront/public-store";
import { container, sectionY, h2Class } from "./ui";

const tag = "self-start rounded-full px-3 py-1 text-[13px] font-bold";
const btn = "inline-flex min-h-[50px] items-center justify-center rounded-xl px-6 font-bold text-white transition-opacity hover:opacity-90";
// Tarjetas de «Explora productos»: carrusel en todos los tamaños, dejando asomar la siguiente.
const showcaseItem = "shrink-0 snap-start basis-[72%] sm:basis-[44%] md:basis-[31%] lg:basis-[23%]";

function SwipeHint() {
  return <p className="text-sm text-site-text-faint md:hidden">Desliza para ver más</p>;
}

// «Explora productos»: los equipos de la tienda de Createam, con enlace a cada ficha.
export default function ProductShowcase({ showcase }: { showcase: Showcase }) {
  return (
    <section id="explorar" aria-labelledby="explorar-title" className={`${container} ${sectionY} flex flex-col gap-8`}>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div className="flex min-w-0 max-w-[720px] flex-col gap-3">
          <span className={`${tag} bg-site-soft text-site-ink`}>Tienda Createam</span>
          <h2 id="explorar-title" className={h2Class}>
            Explora productos para tu punto de venta
          </h2>
          <p className="text-site-text-muted">
            Equipos para vender con el ERP. Eliges en nuestra tienda y nos haces el pedido por WhatsApp.
          </p>
        </div>
        <a href={SHOWCASE_URL} data-track="tienda_explorar" className={`${btn} bg-site-ink`}>
          Explorar todos los productos
        </a>
      </div>

      {showcase.categories.length > 1 && (
        // En celular, una fila que se desliza de lado; desde `md`, en filas.
        <SwipeRow label="Categorías de la tienda" className="md:flex-wrap">
          {showcase.categories.map((category) => (
            <a
              key={category.href}
              href={category.href}
              className="inline-flex min-h-[44px] shrink-0 snap-start items-center whitespace-nowrap rounded-full border border-site-line-strong bg-white px-4 text-[15px] font-semibold transition-colors hover:border-site-ink hover:text-site-ink"
            >
              {category.label}
            </a>
          ))}
        </SwipeRow>
      )}

      {/* Una sola fila también en computadora: es una muestra; la tienda completa está en su web. */}
      <div className="flex flex-col gap-2.5">
        <SwipeHint />
        <SwipeRow label="Productos de la tienda Createam" desktopCarousel>
          {showcase.products.map((product) => (
            <a
              key={product.id}
              href={product.href}
              className={`group flex flex-col overflow-hidden rounded-2xl border border-site-line bg-white transition-shadow hover:shadow-[0_12px_32px_rgba(11,27,58,0.10)] ${showcaseItem}`}
            >
              <div className="relative aspect-square bg-site-bg">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 260px, (min-width: 768px) 31vw, 72vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                {product.compareAtPrice && (
                  <span className="absolute left-3 top-3 rounded-full bg-site-ink px-2.5 py-0.5 text-xs font-bold text-white">
                    -{Math.round((1 - product.price / product.compareAtPrice) * 100)}%
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-4">
                {product.category && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-site-text-faint">{product.category}</span>
                )}
                <h3 className="font-landing-body line-clamp-2 text-[15px] font-bold leading-snug">{product.name}</h3>
                <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1.5">
                  {product.fromPrice && <span className="text-sm text-site-text-faint">Desde</span>}
                  <span className="text-lg font-extrabold">{formatPrice(product.price)}</span>
                  {product.compareAtPrice && (
                    <span className="text-sm text-site-text-faint line-through">
                      <span className="sr-only">Antes </span>
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </p>
              </div>
            </a>
          ))}
          <a
            href={SHOWCASE_URL}
            data-track="tienda_explorar_tarjeta"
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-site-soft-line bg-site-soft p-6 text-center font-bold text-site-ink transition-colors hover:bg-site-soft-line ${showcaseItem}`}
          >
            <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full bg-white text-2xl">
              →
            </span>
            Ver todos los productos
          </a>
        </SwipeRow>
      </div>

      <p className="text-[15px] text-site-text-muted">
        Esta tienda está hecha con{" "}
        <Link href="/catalogo-digital" className="font-bold text-site-ink underline-offset-2 hover:underline">
          Catálogo Digital
        </Link>
        : así puede verse la tuya.
      </p>
    </section>
  );
}
