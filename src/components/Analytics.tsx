"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { CLARITY_PROJECT_ID, GA_MEASUREMENT_ID, trackEvent } from "@/lib/analytics";

// Se monta solo en las páginas de la plataforma (sitio, registro, legales y la
// página 404 de createam.cloud), no en las tiendas de los clientes, para no
// mezclar sus visitas con las nuestras.
//
// Qué mide, además de las visitas que cuenta Google solo:
// - seccion_vista: cada sección que el visitante llegó a ver (hasta dónde baja).
// - scroll_profundidad: 25, 50, 75 y 100 % de la página.
// - registro_click / ingresar_click / whatsapp_click / correo_click: a dónde se
//   va, con el producto y la sección desde la que hizo clic.
// - cta_click: los botones marcados con data-track (el nombre exacto del botón).

/** La sección de primer nivel de la página que contiene al elemento. */
function topSection(el: Element): HTMLElement | null {
  let section = el.closest<HTMLElement>("main section");
  while (section?.parentElement?.closest("main section")) {
    section = section.parentElement.closest<HTMLElement>("main section");
  }
  return section;
}

/** Nombre legible de una sección: data-section, su id o su título. */
function sectionName(section: HTMLElement, index?: number): string {
  if (section.dataset.section) return section.dataset.section;
  if (section.id) return section.id;
  const heading = section.querySelector("h1, h2")?.textContent?.trim();
  if (heading) return heading.slice(0, 60);
  return index !== undefined ? `seccion-${index + 1}` : "sin-nombre";
}

function sectionOf(el: Element): string {
  const tagged = el.closest<HTMLElement>("[data-section]");
  if (tagged?.dataset.section) return tagged.dataset.section;
  const section = topSection(el);
  if (section) return sectionName(section);
  if (el.closest("header")) return "cabecera";
  if (el.closest("footer")) return "pie";
  return "otra";
}

/**
 * Qué hace un enlace, por su dirección: registrarse, ingresar o escribirnos.
 * Se mira el camino y no el dominio de cada app, para no repetir direcciones
 * que ya viven en content.ts.
 */
function classifyLink(link: HTMLAnchorElement): { event: string; producto?: string } | null {
  let url: URL;
  try {
    url = new URL(link.href, window.location.href);
  } catch {
    return null;
  }
  if (url.protocol === "mailto:") return { event: "correo_click" };
  if (url.protocol === "tel:") return { event: "telefono_click" };
  if (url.hostname === "wa.me" || url.hostname.endsWith("whatsapp.com")) return { event: "whatsapp_click" };

  const path = url.pathname.replace(/\/+$/, "");
  const sameSite = url.hostname === window.location.hostname;
  if (sameSite) return path === "/ingresar" ? { event: "ingresar_click", producto: "catalogo" } : null;

  const producto = url.hostname.includes("onturn") ? "onturn" : path.startsWith("/aliados") || path.startsWith("/app/aliado") ? "aliados" : "erp";
  if (path === "/auth/register" || path === "/registrar-negocio" || path === "/aliados/unete") return { event: "registro_click", producto };
  if (path === "/auth/login" || path === "/panel" || path.startsWith("/app/aliado")) return { event: "ingresar_click", producto };
  return { event: "salida_click", producto };
}

export default function Analytics() {
  const pathname = usePathname();

  // Clics: botones marcados y enlaces que llevan a registrarse, ingresar o escribirnos.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const el = event.target as Element | null;
      if (!el?.closest) return;
      const tracked = el.closest<HTMLElement>("[data-track]");
      const seccion = sectionOf(el);
      if (tracked?.dataset.track) trackEvent("cta_click", { cta: tracked.dataset.track, seccion });
      const link = el.closest<HTMLAnchorElement>("a[href]");
      const kind = link ? classifyLink(link) : null;
      if (kind && link) {
        trackEvent(kind.event, {
          producto: kind.producto,
          seccion,
          cta: tracked?.dataset.track,
          // innerText: solo lo visible (la cabecera tiene un texto para celular y otro para escritorio)
          texto: (link.innerText || link.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
        });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Secciones vistas: cuenta una vez cada sección que cruza el centro de la pantalla.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const all = Array.from(document.querySelectorAll<HTMLElement>("main section, [data-section]"));
    const targets = all.filter((el) => el.dataset.section || !el.parentElement?.closest("main section"));
    const seen = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || seen.has(entry.target)) continue;
          seen.add(entry.target);
          const index = targets.indexOf(entry.target as HTMLElement);
          trackEvent("seccion_vista", { seccion: sectionName(entry.target as HTMLElement, index), orden: index + 1 });
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  // Profundidad de lectura: 25, 50, 75 y 100 % de la página.
  useEffect(() => {
    const sent = new Set<number>();
    let frame = 0;
    const check = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max <= 0 ? 100 : (window.scrollY / max) * 100;
      for (const mark of [25, 50, 75, 100]) {
        if (pct >= mark - 1 && !sent.has(mark)) {
          sent.add(mark);
          trackEvent("scroll_profundidad", { porcentaje: mark });
        }
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  if (process.env.NODE_ENV !== "production") return null;

  return (
    <>
      {/* gtag existe desde el inicio (los clics tempranos quedan en cola); la librería de Google llega cuando la página ya cargó */}
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="lazyOnload" />
      {CLARITY_PROJECT_ID && (
        <Script id="clarity-init" strategy="lazyOnload">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_PROJECT_ID}");`}
        </Script>
      )}
    </>
  );
}
