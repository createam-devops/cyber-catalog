"use client";

import { useEffect, useRef, useState } from "react";
import { animate, m, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
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
import type { AssemblySpec, PieceIcon } from "./visuals";

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
};

// Lienzo de 400 × 400 con el núcleo al centro.
const SIZE = 400;
const C = SIZE / 2;
const INNER = 116;
const OUTER = 152;
const DEG = Math.PI / 180;
/** Segundos que tarda la constelación en dar una vuelta completa. */
const ORBIT_SECONDS = 120;
/**
 * La etiqueta va arriba de la pieza cuando está en la mitad de arriba (seno del
 * ángulo menor que esto) y abajo en el resto, para no tapar nunca el núcleo.
 */
const FLIP = -0.2;

/**
 * Lugar de cada pieza en la constelación, en el orden en que llegan: primero la
 * órbita interior y después la exterior, entre medio de las anteriores. Como
 * todo gira junto, las piezas nunca se tapan entre sí. Los radios varían un
 * poco para que se vea como un cielo y no como una grilla.
 */
const SLOTS = [
  { angle: 196, radius: INNER },
  { angle: 12, radius: INNER + 2 },
  { angle: 282, radius: INNER - 2 },
  { angle: 100, radius: INNER },
  { angle: 236, radius: OUTER },
  { angle: 54, radius: OUTER - 2 },
  { angle: 326, radius: OUTER + 2 },
  { angle: 146, radius: OUTER - 3 },
].map((slot) => ({ ...slot, x: C + Math.cos(slot.angle * DEG) * slot.radius, y: C + Math.sin(slot.angle * DEG) * slot.radius }));

type Slot = (typeof SLOTS)[number];

// Estrellas del fondo: x, y, radio y desfase del titileo (en segundos).
const STARS: [number, number, number, number][] = [
  [30, 52, 1.6, 0],
  [96, 20, 1.1, 1.3],
  [176, 10, 1.3, 3.1],
  [316, 28, 1.7, 0.6],
  [374, 96, 1.2, 2.2],
  [392, 214, 1.4, 1.6],
  [360, 350, 1.1, 0.3],
  [268, 388, 1.6, 2.5],
  [150, 384, 1.1, 1],
  [40, 330, 1.7, 1.9],
  [10, 190, 1.1, 2.8],
  [252, 70, 0.9, 3.6],
  [62, 250, 0.9, 0.8],
  [338, 262, 0.9, 3.3],
];

const SINGULAR: Record<string, string> = { módulos: "módulo", conexiones: "conexión", clientes: "cliente" };

/**
 * Una pieza en órbita. Sale del núcleo al llegar (`on`) y gira con la
 * constelación (`turn`, en grados), siempre derecha. Su etiqueta va del lado de
 * afuera: arriba en la mitad de arriba y abajo en la de abajo; al cambiar de
 * lado se apaga un instante.
 */
function Satellite({
  piece,
  slot,
  on,
  highlighted,
  turn,
}: {
  piece: AssemblySpec["pieces"][number];
  slot: Slot;
  on: boolean;
  highlighted: boolean;
  turn: MotionValue<number>;
}) {
  const Icon = ICONS[piece.icon];
  const reach = useMotionValue(on ? 1 : 0);
  useEffect(() => {
    const controls = animate(reach, on ? 1 : 0, on ? { type: "spring", stiffness: 120, damping: 17 } : { duration: 0.4, ease: "easeIn" });
    return () => controls.stop();
  }, [on, reach]);

  // La capa mide lo mismo que el lienzo: moverla un % la lleva a su lugar en la órbita.
  const x = useTransform([turn, reach], ([t, k]: number[]) => `${((k * slot.radius * Math.cos((slot.angle + t) * DEG)) / SIZE) * 100}%`);
  const y = useTransform([turn, reach], ([t, k]: number[]) => `${((k * slot.radius * Math.sin((slot.angle + t) * DEG)) / SIZE) * 100}%`);
  const scale = useTransform(reach, [0, 1], [0.4, 1]);
  const opacity = useTransform(reach, [0, 0.6], [0, 1]);

  const sine = useTransform(turn, (t) => Math.sin((slot.angle + t) * DEG));
  const labelOpacity = useTransform(sine, (s) => Math.min(1, Math.abs(s - FLIP) / 0.05));
  const [above, setAbove] = useState(() => Math.sin(slot.angle * DEG) < FLIP);
  const aboveRef = useRef(above);
  useMotionValueEvent(sine, "change", (s) => {
    const next = s < FLIP;
    if (next !== aboveRef.current) {
      aboveRef.current = next;
      setAbove(next);
    }
  });

  return (
    <m.div className="pointer-events-none absolute inset-0" style={{ x, y }}>
      <m.div className="absolute left-1/2 top-1/2" style={{ x: "-50%", y: "-50%", scale, opacity }}>
        <span
          className={`grid h-9 w-9 place-items-center rounded-full bg-site-on-ink text-site-ink shadow-[0_10px_24px_rgba(0,0,0,0.3)] sm:h-12 sm:w-12 ${
            highlighted ? "ring-[3px] ring-site-accent ring-offset-2 ring-offset-site-ink" : ""
          }`}
        >
          <Icon className="h-[18px] w-[18px] sm:h-6 sm:w-6" strokeWidth={1.75} aria-hidden />
        </span>
        <m.span
          style={{ opacity: labelOpacity }}
          className={`absolute left-1/2 w-max max-w-[78px] -translate-x-1/2 rounded-full bg-site-ink-raise px-2 py-0.5 text-center text-[10px] font-bold leading-[1.2] text-site-on-ink-muted ring-1 ring-inset ring-site-ink-line sm:max-w-[124px] sm:text-[12.5px] ${
            above ? "bottom-full mb-1 sm:mb-1.5" : "top-full mt-1 sm:mt-1.5"
          }`}
        >
          {piece.label}
        </m.span>
      </m.div>
    </m.div>
  );
}

/**
 * La identidad en movimiento, como una constelación: el núcleo del producto
 * queda al centro y las piezas salen de él una a una, entran en órbita y se
 * enlazan entre sí hasta completar el sistema (de básico a completo). Todo gira
 * despacio alrededor del núcleo. Se arma una vez al entrar en pantalla, gira
 * solo mientras se ve y respeta «reducir movimiento» (se muestra completo y quieto).
 */
export default function ModuleAssembly({ spec, className = "" }: { spec: AssemblySpec; className?: string }) {
  const pieces = spec.pieces.slice(0, SLOTS.length);
  const total = pieces.length;
  const base = Math.min(spec.base ?? 2, total);
  const levels = spec.levels ?? ["Básico", "En crecimiento", "Completo"];
  const countLabel = spec.countLabel ?? "módulos";

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [count, setCount] = useState(base);
  const turn = useMotionValue(0);

  // Llegan una a una la primera vez que se ve; después quedan en órbita.
  useEffect(() => {
    if (reduce) {
      setCount(total);
      return;
    }
    if (!inView || count >= total) return;
    const timer = setTimeout(() => setCount((c) => Math.min(c + 1, total)), count === base ? 800 : 1050);
    return () => clearTimeout(timer);
  }, [inView, reduce, count, total, base]);

  // La órbita gira solo mientras se ve; al volver sigue desde donde quedó.
  useEffect(() => {
    if (reduce || !inView) return;
    const controls = animate(turn, turn.get() + 360, { duration: ORBIT_SECONDS, ease: "linear", repeat: Infinity });
    return () => controls.stop();
  }, [inView, reduce, turn]);

  const level = count >= total ? levels[2] : count <= Math.ceil(total * 0.4) ? levels[0] : levels[1];
  const unit = count === 1 ? SINGULAR[countLabel] ?? countLabel : countLabel;
  const description = `${spec.core}: empieza con ${pieces
    .slice(0, base)
    .map((p) => p.label)
    .join(" y ")} y suma ${pieces
    .slice(base)
    .map((p) => p.label)
    .join(", ")}.`;

  // Enlaces de la constelación: cada pieza con su vecina siguiente alrededor del núcleo.
  const ring = pieces.map((_, i) => i).sort((a, b) => SLOTS[a].angle - SLOTS[b].angle);
  const edges = ring.length > 2 ? ring.map((from, k) => [from, ring[(k + 1) % ring.length]] as const) : [];

  return (
    <div
      ref={ref}
      role="img"
      aria-label={description}
      style={{ "--orbit-state": inView ? "running" : "paused" } as React.CSSProperties}
      className={`relative mx-auto aspect-square w-full max-w-[340px] sm:max-w-[460px] ${className}`}
    >
      {/* El cielo, quieto: estrellas, las dos órbitas y el avance alrededor del núcleo */}
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {STARS.map(([x, y, r, delay]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="var(--c-on-ink)" className="site-twinkle" style={{ animationDelay: `${delay}s` }} />
        ))}
        <circle cx={C} cy={C} r={INNER} fill="none" stroke="var(--c-ink-line)" strokeWidth="1.5" strokeDasharray="2 7" />
        <circle cx={C} cy={C} r={OUTER} fill="none" stroke="var(--c-ink-line)" strokeWidth="1.5" strokeDasharray="2 7" />
        <circle cx={C} cy={C} r={56} fill="none" stroke="var(--c-ink-line)" strokeWidth="3" />
        <g transform={`rotate(-90 ${C} ${C})`}>
          <m.circle
            cx={C}
            cy={C}
            r={56}
            fill="none"
            stroke="var(--c-accent)"
            strokeWidth="3"
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
            strokeWidth="2"
            initial={{ r: 56, opacity: 0.6 }}
            animate={{ r: 92, opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        )}
      </svg>

      {/* Enlaces y rayos al núcleo: giran con las piezas */}
      <m.div className="absolute inset-0" style={{ rotate: turn }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          {edges.map(([a, b]) => (
            <m.line
              key={`enlace-${a}-${b}`}
              x1={SLOTS[a].x}
              y1={SLOTS[a].y}
              x2={SLOTS[b].x}
              y2={SLOTS[b].y}
              stroke="var(--c-on-ink)"
              strokeWidth="1.2"
              initial={false}
              animate={{ opacity: a < count && b < count ? 0.38 : 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          ))}
          {pieces.map((piece, i) => {
            const on = i < count;
            return (
              <m.line
                key={`rayo-${piece.label}`}
                x1={C}
                y1={C}
                x2={SLOTS[i].x}
                y2={SLOTS[i].y}
                stroke="var(--c-accent)"
                strokeWidth="1.6"
                strokeLinecap="round"
                initial={false}
                animate={{ pathLength: on ? 1 : 0, opacity: on ? 0.75 : 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
            );
          })}
        </svg>
      </m.div>

      {pieces.map((piece, i) => (
        <Satellite key={piece.label} piece={piece} slot={SLOTS[i]} on={i < count} highlighted={spec.highlight === i} turn={turn} />
      ))}

      {/* El núcleo, fijo al centro */}
      <div className="absolute left-1/2 top-1/2 flex aspect-square w-[24%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-full bg-site-ink-raise text-center shadow-[0_18px_40px_rgba(0,0,0,0.3)] ring-1 ring-inset ring-site-ink-line sm:gap-1">
        <BrandMark className="h-[16px] w-[24px] text-site-on-ink sm:h-6 sm:w-9" />
        <span className="max-w-[90%] font-landing-display text-[11px] font-bold leading-tight text-white sm:text-[14px]">{spec.core}</span>
        <span className="whitespace-nowrap rounded-full bg-site-accent px-1.5 py-px text-[9px] font-bold text-site-on-accent sm:px-2 sm:text-[11px]">{level}</span>
        <span className="hidden text-[10px] font-medium text-site-on-ink-muted sm:block">
          {count} {unit}
        </span>
      </div>
    </div>
  );
}
