"use client";

import { useEffect, useState } from "react";
import Analytics from "@/components/Analytics";
import { trackEvent } from "@/lib/analytics";

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "createam.cloud";

/**
 * Avisa a Analytics que alguien llegó a una dirección que no existe y desde
 * dónde venía: así aparecen los enlaces rotos (propios o de otros sitios).
 * Solo en createam.cloud: las tiendas de los clientes usan la misma página 404
 * y sus visitas no se mezclan con las nuestras.
 */
export default function NotFoundEvent() {
  const [measure, setMeasure] = useState(false);

  useEffect(() => {
    const host = window.location.hostname.toLowerCase();
    if (host !== PLATFORM_DOMAIN && host !== `www.${PLATFORM_DOMAIN}`) return;
    setMeasure(true);
    // Espera a que la medición esté lista (gtag aparece al montar <Analytics />).
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      const ready = typeof (window as unknown as { gtag?: unknown }).gtag === "function";
      if (!ready && tries <= 20) return;
      clearInterval(timer);
      if (ready) {
        trackEvent("pagina_no_encontrada", {
          ruta: window.location.pathname + window.location.search,
          referente: document.referrer || "(directo)",
        });
      }
    }, 250);
    return () => clearInterval(timer);
  }, []);

  return measure ? <Analytics /> : null;
}
