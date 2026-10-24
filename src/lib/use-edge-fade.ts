"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";

/** Largo del difuminado en el borde donde el carrusel queda cortado. */
const FADE_PX = 40;

interface Edges {
  axis: "x" | "y";
  start: boolean;
  end: boolean;
}

const NONE: Edges = { axis: "x", start: false, end: false };

function maskFor({ axis, start, end }: Edges): CSSProperties | undefined {
  if (!start && !end) return undefined;
  const direction = axis === "x" ? "to right" : "to bottom";
  const gradient = `linear-gradient(${direction}, ${start ? "transparent" : "#000"}, #000 ${start ? FADE_PX : 0}px, #000 calc(100% - ${end ? FADE_PX : 0}px), ${end ? "transparent" : "#000"})`;
  return { maskImage: gradient, WebkitMaskImage: gradient };
}

/**
 * Carruseles que no se salen de su contenedor: donde queda contenido cortado
 * (a un lado, al otro o a ambos), el borde se difumina; al llegar al final, el
 * difuminado de ese lado se quita. Sirve en horizontal y en vertical, según
 * hacia dónde se desborde el elemento.
 *
 *   const fade = useEdgeFade<HTMLDivElement>();
 *   <div ref={fade.ref} style={fade.style} className="flex overflow-x-auto">…</div>
 *
 * `ref` es un ref de función: sirve aunque el carrusel aparezca después (por
 * ejemplo, cuando llega la segunda categoría o la segunda foto).
 */
export function useEdgeFade<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [edges, setEdges] = useState<Edges>(NONE);

  useEffect(() => {
    if (!el) {
      setEdges(NONE);
      return;
    }
    const update = () => {
      const overX = el.scrollWidth - el.clientWidth;
      const overY = el.scrollHeight - el.clientHeight;
      const next: Edges =
        overX > 2
          ? { axis: "x", start: el.scrollLeft > 2, end: overX - el.scrollLeft > 2 }
          : overY > 2
            ? { axis: "y", start: el.scrollTop > 2, end: overY - el.scrollTop > 2 }
            : NONE;
      setEdges((prev) => (prev.axis === next.axis && prev.start === next.start && prev.end === next.end ? prev : next));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    // También cuando cambia el ancho de la pantalla o terminan de cargar las fotos.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [el]);

  /** Mueve el carrusel casi una pantalla hacia un lado (para las flechas). */
  const scroll = useCallback(
    (direction: 1 | -1) => el?.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" }),
    [el]
  );

  return { ref: setEl, style: maskFor(edges), canPrev: edges.axis === "x" && edges.start, canNext: edges.axis === "x" && edges.end, scroll };
}
