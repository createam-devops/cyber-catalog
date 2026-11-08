"use client";

import { useEffect, useRef, useState } from "react";
import { LazyMotion, MotionConfig, animate, domAnimation, m, useInView, useReducedMotion } from "framer-motion";

// Movimiento del sitio, con framer-motion en su versión liviana (LazyMotion +
// `m`). Todo respeta «reducir movimiento» del sistema operativo. La idea de la
// marca: ideas que suben a la nube. Lo que aparece sube suave; en los
// encabezados oscuros flotan nubes con el trazo del logo.

/** Habilita las animaciones en el árbol. Va una vez, en el marco del sitio. */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Si el elemento empieza más abajo de lo que se ve. Solo eso se anima: lo que
 * ya está en pantalla al cargar se queda quieto y visible.
 */
function useBelowFold(ref: React.RefObject<HTMLElement>, reduce: boolean | null) {
  const [below, setBelow] = useState(false);
  useEffect(() => {
    if (reduce) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect && rect.top > window.innerHeight) setBelow(true);
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return below;
}

/**
 * Aparece subiendo cuando entra en pantalla (una sola vez). El servidor lo
 * entrega visible: si el JavaScript tarda o falla, el contenido igual se ve, y
 * los buscadores lo leen completo. Ya en el navegador, lo que está más abajo
 * se oculta sin animar y aparece al llegar.
 */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const below = useBelowFold(ref, reduce);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  const hidden = below && !inView;
  return (
    <m.div
      ref={ref}
      className={className}
      initial={false}
      animate={hidden ? "hidden" : "shown"}
      variants={{
        hidden: { opacity: 0, y, transition: { duration: 0 } },
        shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay } },
      }}
    >
      {children}
    </m.div>
  );
}

/** Flota despacio arriba y abajo, como una nube. Solo transforma: no afecta la carga. */
export function Float({
  children,
  className,
  style,
  distance = 8,
  duration = 6,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  distance?: number;
  duration?: number;
  delay?: number;
}) {
  return (
    <m.div
      className={className}
      style={style}
      animate={{ y: [0, -distance, 0] }}
      transition={{ duration, ease: "easeInOut", repeat: Infinity, delay }}
    >
      {children}
    </m.div>
  );
}

/**
 * Fondo de los encabezados oscuros: un brillo suave con los colores de la
 * paleta, como la luz sobre las esferas. Decorativo.
 */
export function HeroSky() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 70% at 88% 12%, color-mix(in srgb, var(--c-on-ink) 22%, transparent), transparent 70%), radial-gradient(45% 60% at 0% 100%, color-mix(in srgb, var(--c-ink-raise) 95%, transparent), transparent 75%)",
        }}
      />
    </div>
  );
}

/** Número que cuenta hasta su valor al entrar en pantalla («150+»). */
export function CountUp({ value, suffix = "", className }: { value: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const reduce = useReducedMotion();
  // El servidor entrega la cifra final (la leen buscadores y quien no tiene JavaScript).
  const [shown, setShown] = useState(value);
  // Los años no cuentan desde cero: suben desde una década antes.
  const from = value > 1900 ? value - 9 : 0;

  // Ya en el navegador, si está más abajo de lo que se ve, se prepara para contar.
  const below = useBelowFold(ref, reduce);
  useEffect(() => {
    if (below) setShown(from);
  }, [below, from]);

  useEffect(() => {
    if (!below || !inView) return;
    const controls = animate(from, value, { duration: 1.2, ease: EASE, onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [below, inView, value, from]);

  return (
    <span ref={ref} className={className}>
      {shown}
      {suffix}
    </span>
  );
}

/**
 * Contenido que cambia con un cruce suave (por ejemplo, la respuesta del
 * selector). La primera vez se muestra quieto: solo se anima al cambiar.
 */
export function FadeSwap({ swapKey, children, className }: { swapKey: string; children: React.ReactNode; className?: string }) {
  const firstKey = useRef(swapKey);
  const animateIn = swapKey !== firstKey.current;
  return (
    <m.div
      key={swapKey}
      className={className}
      initial={animateIn ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      {children}
    </m.div>
  );
}
