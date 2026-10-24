"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEdgeFade } from "@/lib/use-edge-fade";

/**
 * Carrusel de la portada. En celular es una fila que se desliza de lado; desde
 * `md` es la grilla o fila que indique className, salvo con `desktopCarousel`,
 * que sigue en una sola fila y suma flechas. Nunca se sale del contenedor: el
 * borde donde queda contenido cortado se difumina.
 */
export default function SwipeRow({
  label,
  className = "",
  desktopCarousel = false,
  children,
}: {
  label: string;
  className?: string;
  desktopCarousel?: boolean;
  children: React.ReactNode;
}) {
  const fade = useEdgeFade<HTMLDivElement>();
  return (
    <div className="relative">
      <div
        ref={fade.ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        style={fade.style}
        className={`flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          desktopCarousel ? "" : "md:overflow-visible md:pb-0"
        } ${className}`}
      >
        {children}
      </div>
      {desktopCarousel && (
        <>
          <Arrow side="prev" visible={fade.canPrev} onClick={() => fade.scroll(-1)} />
          <Arrow side="next" visible={fade.canNext} onClick={() => fade.scroll(1)} />
        </>
      )}
    </div>
  );
}

function Arrow({ side, visible, onClick }: { side: "prev" | "next"; visible: boolean; onClick: () => void }) {
  const Icon = side === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "prev" ? "Ver anteriores" : "Ver más"}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`absolute top-[40%] z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-[#DDE4F0] bg-white text-[#0B1B3A] shadow-[0_6px_20px_rgba(11,27,58,0.16)] transition-opacity hover:bg-[#F6F8FC] md:grid ${
        side === "prev" ? "left-2" : "right-2"
      } ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <Icon size={22} aria-hidden="true" />
    </button>
  );
}
