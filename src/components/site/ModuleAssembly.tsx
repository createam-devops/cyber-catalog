"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, m, motionValue, useInView, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import {
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Boxes,
  Calculator,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Camera,
  ChefHat,
  ClipboardList,
  Coins,
  Factory,
  FileCheck,
  FileText,
  Globe,
  Hammer,
  HandCoins,
  Instagram,
  Kanban,
  LayoutGrid,
  ListOrdered,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Music2,
  PackageSearch,
  Pill,
  QrCode,
  Ruler,
  Scissors,
  Search,
  ShieldCheck,
  ShoppingBasket,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Tags,
  Truck,
  Users,
  UtensilsCrossed,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "./brand";
import { MAX_PIECES, type AssemblySpec, type PieceIcon } from "./visuals";

const ICONS: Record<PieceIcon, LucideIcon> = {
  ventas: ShoppingCart,
  sunat: FileCheck,
  inventario: Boxes,
  compras: ClipboardList,
  contabilidad: BookOpen,
  crm: MessagesSquare,
  tienda: Store,
  reservas: CalendarCheck,
  reportes: BarChart3,
  guias: Truck,
  caja: Calculator,
  yape: ShieldCheck,
  vencimientos: CalendarClock,
  reposicion: PackageSearch,
  fiado: HandCoins,
  salon: LayoutGrid,
  comandas: Smartphone,
  cocina: ChefHat,
  qr: QrCode,
  recetas: UtensilsCrossed,
  cotizador: Ruler,
  precio: Tags,
  corte: Scissors,
  ia: Camera,
  produccion: Factory,
  instalacion: Wrench,
  garantia: BadgeCheck,
  agenda: CalendarDays,
  recordatorio: Bell,
  senas: Wallet,
  espera: ListOrdered,
  resenas: Star,
  clientes: Users,
  carrito: ShoppingCart,
  whatsapp: MessageCircle,
  dominio: Globe,
  seo: Search,
  instagram: Instagram,
  messenger: MessageCircle,
  metaads: Megaphone,
  tiktok: Music2,
  embudo: Kanban,
  chatbot: Bot,
  negocio: Store,
  restaurante: UtensilsCrossed,
  taller: Wrench,
  farmacia: Pill,
  ferreteria: Hammer,
  barberia: Scissors,
  minimarket: ShoppingBasket,
  comision: Coins,
  cotizacion: FileText,
  asistente: Sparkles,
};

// Lienzo de 600 × 600 unidades con el núcleo al centro.
const SIZE = 600;
const C = SIZE / 2;
const DEG = Math.PI / 180;
/** Radio del anillo amarillo que marca el avance alrededor del núcleo. */
const PROGRESS_R = 74;

/**
 * Las órbitas, de adentro hacia afuera. Las de adentro giran más rápido, como
 * los planetas: la figura cambia todo el tiempo y nunca forma un polígono.
 * Entre una órbita y otra cabe una pieza con aire, así no se tocan al cruzarse.
 */
const ORBITS = [
  { radius: 118, seconds: 70, phase: 205 },
  { radius: 190, seconds: 115, phase: 18 },
  { radius: 264, seconds: 170, phase: 292 },
];

/** Corrimiento de cada pieza respecto del reparto parejo en su órbita, para que no se vea como una grilla. */
const JITTER = [0, 10, -8, 6, -11, 8, -5];

/**
 * La etiqueta va arriba de la pieza cuando está en la parte de arriba (seno del
 * ángulo menor que esto) y abajo en el resto, del lado de afuera.
 */
const FLIP = -0.2;
/** Espacio entre la pieza y su etiqueta (px). */
const LABEL_GAP = 5;
/** Cuánto pueden salirse las etiquetas por arriba y por abajo del lienzo (px). */
const PAD_Y = 36;
/** Segundos que tarda una etiqueta en aparecer o apagarse. */
const LABEL_FADE = 0.3;
/** El destello que viaja del núcleo a una pieza, cuando ya están todas. */
const SPARK_SECONDS = 1;
const SPARK_GAP = 1.8;

type Piece = AssemblySpec["pieces"][number];

interface Slot {
  orbit: number;
  radius: number;
  /** Ángulo inicial, en grados */
  angle: number;
  /** Grados por segundo */
  speed: number;
}

/**
 * Reparte las piezas en las órbitas según su largo (la de afuera lleva más).
 * Las primeras piezas, las del plan básico, quedan en la de adentro.
 */
function orbitSlots(n: number): Slot[] {
  const inner = n < 3 ? n : Math.max(1, Math.round(n * 0.2));
  const middle = n < 3 ? 0 : Math.max(1, Math.round(n * 0.33));
  const counts = [inner, middle, n - inner - middle];
  return counts.flatMap((k, o) =>
    Array.from({ length: k }, (_, j) => ({
      orbit: o,
      radius: ORBITS[o].radius,
      angle: ORBITS[o].phase + (360 / k) * j + JITTER[j % JITTER.length],
      speed: 360 / ORBITS[o].seconds,
    })),
  );
}

// Estrellas del fondo: x, y, radio y desfase del titileo (en segundos).
const STARS: [number, number, number, number][] = [
  [45, 78, 2.2, 0],
  [144, 30, 1.6, 1.3],
  [264, 14, 1.8, 3.1],
  [474, 42, 2.4, 0.6],
  [561, 144, 1.7, 2.2],
  [588, 321, 2, 1.6],
  [540, 525, 1.6, 0.3],
  [402, 582, 2.2, 2.5],
  [225, 576, 1.6, 1],
  [60, 495, 2.4, 1.9],
  [15, 285, 1.6, 2.8],
  [378, 105, 1.3, 3.6],
  [93, 375, 1.3, 0.8],
  [507, 393, 1.3, 3.3],
];

const SINGULAR: Record<string, string> = { módulos: "módulo", conexiones: "conexión", clientes: "cliente" };

const pct = (units: number) => `${(units / SIZE) * 100}%`;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function circleHitsBox(cx: number, cy: number, r: number, box: Box, pad: number) {
  const nx = Math.max(box.x - pad, Math.min(cx, box.x + box.w + pad));
  const ny = Math.max(box.y - pad, Math.min(cy, box.y + box.h + pad));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

function boxesHit(a: Box, b: Box, pad: number) {
  return a.x - pad < b.x + b.w && b.x < a.x + a.w + pad && a.y - pad < b.y + b.h && b.y < a.y + a.h + pad;
}

/** Dónde va la etiqueta respecto de su pieza. */
type Side = "above" | "below" | "left" | "right";

/** Esquina superior izquierda de la etiqueta, desde el centro de la pieza (px). */
function labelOffset(side: Side, nodeR: number, size: { w: number; h: number }): [number, number] {
  if (side === "above") return [-size.w / 2, -(nodeR + LABEL_GAP + size.h)];
  if (side === "below") return [-size.w / 2, nodeR + LABEL_GAP];
  if (side === "right") return [nodeR + LABEL_GAP, -size.h / 2];
  return [-(nodeR + LABEL_GAP + size.w), -size.h / 2];
}

/** Valores que mueve el cuadro a cuadro de cada pieza (sin pasar por React). */
interface PieceMotion {
  x: MotionValue<string>;
  y: MotionValue<string>;
  reach: MotionValue<number>;
  labelX: MotionValue<number>;
  labelY: MotionValue<number>;
  labelOpacity: MotionValue<number>;
  glow: MotionValue<number>;
}

/** Una pieza en órbita, siempre derecha, con su etiqueta del lado de afuera. */
function Satellite({
  piece,
  motion,
  highlighted,
  nodeRef,
  labelRef,
}: {
  piece: Piece;
  motion: PieceMotion;
  highlighted: boolean;
  nodeRef: (el: HTMLSpanElement | null) => void;
  labelRef: (el: HTMLSpanElement | null) => void;
}) {
  const Icon = ICONS[piece.icon];
  const scale = useTransform(motion.reach, [0, 1], [0.4, 1]);
  const opacity = useTransform(motion.reach, [0, 0.6], [0, 1]);

  return (
    // La capa mide lo mismo que el lienzo: moverla un % la lleva a su lugar en la órbita.
    // La destacada va por encima de las demás: su etiqueta no se apaga al cruzarse.
    <m.div className={`pointer-events-none absolute inset-0 ${highlighted ? "z-10" : ""}`} style={{ x: motion.x, y: motion.y }}>
      <div className="absolute left-1/2 top-1/2 h-0 w-0">
        <m.div className="absolute left-0 top-0 h-0 w-0" style={{ scale, opacity }}>
          <span
            ref={nodeRef}
            className={`absolute left-0 top-0 grid h-[34px] w-[34px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-site-on-ink text-site-ink shadow-[0_10px_24px_rgba(0,0,0,0.3)] sm:h-[52px] sm:w-[52px] ${
              highlighted ? "ring-[3px] ring-site-accent ring-offset-2 ring-offset-site-ink" : ""
            }`}
          >
            <Icon className="h-[17px] w-[17px] sm:h-6 sm:w-6" strokeWidth={1.75} aria-hidden />
            {/* Se enciende cuando le llega el destello del núcleo */}
            <m.span aria-hidden className="absolute -inset-1.5 rounded-full ring-2 ring-site-accent" style={{ opacity: motion.glow }} />
          </span>
        </m.div>
        <m.span
          ref={labelRef}
          style={{ x: motion.labelX, y: motion.labelY, opacity: motion.labelOpacity }}
          className={`absolute left-0 top-0 whitespace-nowrap rounded-full px-[7px] py-0.5 text-[10px] font-bold leading-[1.25] ring-1 ring-inset sm:px-2.5 sm:text-[13px] ${
            highlighted ? "bg-site-accent text-site-on-accent ring-site-accent" : "bg-site-ink-raise text-site-on-ink-muted ring-site-ink-line"
          }`}
        >
          {piece.label}
        </m.span>
      </div>
    </m.div>
  );
}

/**
 * La identidad en movimiento: el núcleo del producto al centro y sus módulos
 * en órbita a distintas distancias, como planetas. Salen del núcleo uno a uno
 * (de básico a completo); cada órbita gira a su ritmo y, ya completo, un
 * destello viaja del núcleo a un módulo de vez en cuando, como un dato que
 * llega. Las etiquetas que chocarían con otra pieza se apagan mientras dura el
 * cruce. Gira solo mientras se ve y respeta «reducir movimiento» (se muestra
 * completo y quieto).
 */
export default function ModuleAssembly({ spec, className = "" }: { spec: AssemblySpec; className?: string }) {
  const pieces = spec.pieces.slice(0, MAX_PIECES);
  const total = pieces.length;
  const base = Math.min(spec.base ?? 2, total);
  const levels = spec.levels ?? ["Básico", "En crecimiento", "Completo"];
  const countLabel = spec.countLabel ?? "módulos";

  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [count, setCount] = useState(base);

  const slots = useMemo(() => orbitSlots(total), [total]);
  const [motions] = useState<PieceMotion[]>(() =>
    slots.map((slot, i) => {
      const k = i < base ? 1 : 0;
      return {
        x: motionValue(pct(k * slot.radius * Math.cos(slot.angle * DEG))),
        y: motionValue(pct(k * slot.radius * Math.sin(slot.angle * DEG))),
        reach: motionValue(k),
        labelX: motionValue(0),
        labelY: motionValue(0),
        labelOpacity: motionValue(0),
        glow: motionValue(0),
      };
    }),
  );
  const [spark] = useState(() => ({ x: motionValue("0%"), y: motionValue("0%"), opacity: motionValue(0) }));

  const nodeEls = useRef<(HTMLSpanElement | null)[]>([]);
  const labelEls = useRef<(HTMLSpanElement | null)[]>([]);
  /** Medidas en px: lienzo, radio de una pieza, margen a los lados y tamaño de cada etiqueta. */
  const sizes = useRef({ w: 0, nodeR: 0, padL: 0, padR: 0, labels: [] as ({ w: number; h: number } | null)[] });
  /** Segundos de órbita (solo avanza mientras se ve). */
  const clock = useRef(0);
  const countRef = useRef(count);
  const arrivedAt = useRef<number[]>([]);
  const labels = useRef(pieces.map(() => ({ side: "below" as Side, opacity: 0 })));
  const glows = useRef(pieces.map(() => 0));
  const sparkState = useRef({ target: -1, start: 0, nextAt: Infinity });

  /**
   * Un cuadro: ubica las piezas en su órbita, decide qué etiquetas se ven sin
   * chocar (primero la destacada, después la que acaba de llegar y luego en
   * orden) y mueve el destello. `animated` es falso en la vista quieta.
   */
  const place = useRef<(dt: number, animated: boolean) => void>(() => {});
  place.current = (dt, animated) => {
    const t = clock.current;
    const { w: W, nodeR, padL, padR } = sizes.current;
    const s = W / SIZE;

    const angles: number[] = [];
    const nodes = slots.map((slot, i) => {
      const a = (slot.angle + slot.speed * t) * DEG;
      const k = motions[i].reach.get();
      const ux = k * slot.radius * Math.cos(a);
      const uy = k * slot.radius * Math.sin(a);
      motions[i].x.set(pct(ux));
      motions[i].y.set(pct(uy));
      angles.push(a);
      return { x: W / 2 + ux * s, y: W / 2 + uy * s, r: k > 0.05 ? nodeR * (0.4 + 0.6 * Math.min(k, 1)) : 0 };
    });

    // El destello: del núcleo a una pieza al azar, y la pieza se enciende al recibirlo.
    const sp = sparkState.current;
    if (animated && countRef.current >= total && total > 0) {
      if (sp.target < 0 && t >= sp.nextAt) {
        let next = Math.floor(Math.random() * total);
        if (next === sp.target && total > 1) next = (next + 1) % total;
        sp.target = next;
        sp.start = t;
      }
      if (sp.target >= 0) {
        const p = (t - sp.start) / SPARK_SECONDS;
        if (p >= 1) {
          glows.current[sp.target] = 1;
          sp.target = -1;
          sp.nextAt = t + SPARK_GAP;
          spark.opacity.set(0);
        } else {
          const eased = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
          const from = PROGRESS_R + 6;
          const to = slots[sp.target].radius - (s > 0 ? nodeR / s : 30) - 4;
          const r = from + (to - from) * eased;
          spark.x.set(pct(r * Math.cos(angles[sp.target])));
          spark.y.set(pct(r * Math.sin(angles[sp.target])));
          spark.opacity.set(Math.min(1, p / 0.15));
        }
      }
    }
    glows.current.forEach((g, i) => {
      const next = Math.max(0, g - dt / 1.2);
      glows.current[i] = next;
      motions[i].glow.set(next);
    });

    if (!W || !nodeR) return;

    // Etiquetas: cada una del lado de afuera; si chocaría con algo, se apaga hasta que pase.
    const rank = (i: number) => (i === spec.highlight ? -2 : t - (arrivedAt.current[i] ?? -99) < 3.5 ? -1 : i);
    const order = slots.map((_, i) => i).sort((a, b) => rank(a) - rank(b));
    const placed: Box[] = [];
    const core = { x: W / 2, y: W / 2, r: PROGRESS_R * s + 3 };
    for (const i of order) {
      const state = labels.current[i];
      const size = sizes.current.labels[i];
      let target = 0;
      if (size && motions[i].reach.get() > 0.85) {
        const node = nodes[i];
        const free = (side: Side, pad: number, overNodes = false) => {
          const [dx, dy] = labelOffset(side, nodeR, size);
          const box = { x: node.x + dx, y: node.y + dy, w: size.w, h: size.h };
          const inside = box.x >= -padL && box.x + box.w <= W + padR && box.y >= -PAD_Y && box.y + box.h <= W + PAD_Y;
          const clear =
            inside &&
            !circleHitsBox(core.x, core.y, core.r, box, pad) &&
            (overNodes || nodes.every((n, j) => j === i || n.r === 0 || !circleHitsBox(n.x, n.y, n.r, box, pad))) &&
            placed.every((other) => !boxesHit(box, other, pad));
          return clear ? box : null;
        };
        // Del lado de afuera primero (arriba o abajo, después al costado); hacia el núcleo solo si no queda otra.
        const up = Math.sin(angles[i]) < FLIP;
        const right = Math.cos(angles[i]) > 0;
        const sides: Side[] = [up ? "above" : "below", right ? "right" : "left", up ? "below" : "above", right ? "left" : "right"];
        // Para aparecer pide un poco más de aire que para seguir visible: así no parpadea.
        const clean = sides.find((side) => free(side, 6));
        // La destacada nunca se apaga: si no tiene lado libre, pasa por encima de otra pieza.
        const overNodes = i === spec.highlight && !clean;
        const best = clean ?? (overNodes ? sides.find((side) => free(side, 6, true)) : undefined);
        if (state.opacity < 0.04 && best) state.side = best;
        const box = free(state.side, state.opacity > 0.5 ? 0 : 6, overNodes);
        // Si se liberó el lado de afuera, se apaga un instante y se cambia allá.
        if (box && (state.side === best || best !== sides[0])) {
          target = 1;
          placed.push(box);
        }
      }
      const step = dt / LABEL_FADE;
      state.opacity = target > state.opacity ? Math.min(target, state.opacity + step) : Math.max(target, state.opacity - step);
      const [dx, dy] = size ? labelOffset(state.side, nodeR, size) : [0, 0];
      motions[i].labelX.set(dx);
      motions[i].labelY.set(dy);
      motions[i].labelOpacity.set(state.opacity);
    }
  };

  const running = Boolean(inView && !reduce);
  const runningRef = useRef(running);
  runningRef.current = running;

  // Medidas: el lienzo cambia con la pantalla y las etiquetas con la fuente.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const rect = stage.getBoundingClientRect();
      const viewport = document.documentElement.clientWidth;
      sizes.current = {
        w: rect.width,
        nodeR: (nodeEls.current[0]?.offsetWidth ?? 0) / 2,
        padL: Math.max(0, Math.min(24, rect.left - 6)),
        padR: Math.max(0, Math.min(40, viewport - rect.right - 6)),
        labels: labelEls.current.map((el) => (el ? { w: el.offsetWidth, h: el.offsetHeight } : null)),
      };
      if (!runningRef.current) place.current(10, false);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, []);

  // Llegan una a una la primera vez que se ve; después quedan en órbita.
  useEffect(() => {
    if (reduce) {
      setCount(total);
      return;
    }
    if (!inView || count >= total) return;
    const timer = setTimeout(() => setCount((c) => Math.min(c + 1, total)), count === base ? 800 : 650);
    return () => clearTimeout(timer);
  }, [inView, reduce, count, total, base]);

  // Cada llegada: la pieza sale del núcleo hasta su órbita.
  useEffect(() => {
    countRef.current = count;
    if (reduce) {
      motions.forEach((motion) => motion.reach.set(1));
      place.current(10, false);
      return;
    }
    if (count > base) {
      const i = count - 1;
      arrivedAt.current[i] = clock.current;
      animate(motions[i].reach, 1, { type: "spring", stiffness: 110, damping: 16 });
    }
    if (count >= total) sparkState.current.nextAt = clock.current + 1.4;
  }, [count, reduce, base, total, motions]);

  // Las órbitas giran solo mientras se ve; al volver siguen desde donde quedaron.
  useEffect(() => {
    if (!running) {
      place.current(10, false);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      clock.current += dt;
      place.current(dt, true);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const level = count >= total ? levels[2] : count <= Math.ceil(total * 0.4) ? levels[0] : levels[1];
  const unit = count === 1 ? SINGULAR[countLabel] ?? countLabel : countLabel;
  const description = `${spec.core}: empieza con ${pieces
    .slice(0, base)
    .map((p) => p.label)
    .join(" y ")} y suma ${pieces
    .slice(base)
    .map((p) => p.label)
    .join(", ")}.`;

  return (
    <div
      ref={stageRef}
      role="img"
      aria-label={description}
      style={{ "--orbit-state": inView ? "running" : "paused" } as React.CSSProperties}
      className={`relative mx-auto aspect-square w-full max-w-[400px] sm:max-w-[560px] ${className}`}
    >
      {/* El cielo, quieto: estrellas, las órbitas (aparecen con su primera pieza) y el avance alrededor del núcleo */}
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {STARS.map(([x, y, r, delay]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="var(--c-on-ink)" className="site-twinkle" style={{ animationDelay: `${delay}s` }} />
        ))}
        {ORBITS.map((orbit, o) => {
          const first = slots.findIndex((slot) => slot.orbit === o);
          if (first < 0) return null;
          return (
            <m.circle
              key={orbit.radius}
              cx={C}
              cy={C}
              r={orbit.radius}
              fill="none"
              stroke="var(--c-ink-line)"
              strokeWidth="1.6"
              strokeDasharray="2 9"
              initial={false}
              animate={{ opacity: first < count ? 1 : 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          );
        })}
        <circle cx={C} cy={C} r={PROGRESS_R} fill="none" stroke="var(--c-ink-line)" strokeWidth="4" />
        <g transform={`rotate(-90 ${C} ${C})`}>
          <m.circle
            cx={C}
            cy={C}
            r={PROGRESS_R}
            fill="none"
            stroke="var(--c-accent)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: count / total }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </g>
        {/* Cada llegada deja una onda que sale del núcleo */}
        {count > base && (
          <m.circle
            key={count}
            cx={C}
            cy={C}
            fill="none"
            stroke="var(--c-accent)"
            strokeWidth="2.5"
            initial={{ r: PROGRESS_R, opacity: 0.6 }}
            animate={{ r: PROGRESS_R + 50, opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        )}
      </svg>

      {/* El destello que viaja del núcleo a un módulo */}
      <m.div className="pointer-events-none absolute inset-0" style={{ x: spark.x, y: spark.y, opacity: spark.opacity }}>
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-site-accent shadow-[0_0_10px_2px_var(--c-accent)] sm:h-2 sm:w-2" />
      </m.div>

      {pieces.map((piece, i) => (
        <Satellite
          key={piece.label}
          piece={piece}
          motion={motions[i]}
          highlighted={spec.highlight === i}
          nodeRef={(el) => {
            nodeEls.current[i] = el;
          }}
          labelRef={(el) => {
            labelEls.current[i] = el;
          }}
        />
      ))}

      {/* El núcleo, fijo al centro */}
      <div className="absolute left-1/2 top-1/2 flex aspect-square w-[22%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-full bg-site-ink-raise text-center shadow-[0_18px_40px_rgba(0,0,0,0.3)] ring-1 ring-inset ring-site-ink-line">
        <BrandMark className="h-[15px] w-[22px] text-site-on-ink sm:h-[22px] sm:w-[33px]" />
        <span className="max-w-[88%] font-landing-display text-[11px] font-bold leading-[1.1] text-white sm:text-[14px]">{spec.core}</span>
        <span className="whitespace-nowrap rounded-full bg-site-accent px-1.5 py-px text-[8.5px] font-bold text-site-on-accent sm:px-2 sm:text-[11px]">{level}</span>
        <span className="hidden text-[10.5px] font-medium text-site-on-ink-muted sm:block">
          {count} {unit}
        </span>
      </div>
    </div>
  );
}
