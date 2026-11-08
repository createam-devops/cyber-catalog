"use client";

import { useEffect, useRef, useState } from "react";
import { m, useInView, useReducedMotion } from "framer-motion";
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

// Casillas alrededor del núcleo (fila, columna) en el orden en que se ocupan:
// primero a los lados, luego arriba y abajo, al final las esquinas.
const SLOTS = [
  { row: 2, col: 1 },
  { row: 2, col: 3 },
  { row: 1, col: 2 },
  { row: 3, col: 2 },
  { row: 1, col: 1 },
  { row: 1, col: 3 },
  { row: 3, col: 1 },
  { row: 3, col: 3 },
];

const SINGULAR: Record<string, string> = { módulos: "módulo", conexiones: "conexión", clientes: "cliente" };

/**
 * La identidad en movimiento: el núcleo del producto y las piezas que se le
 * acoplan una a una, de básico a completo. Así se ve que el ERP es modular y
 * crece con el negocio. Se anima solo cuando está a la vista, vuelve a empezar
 * al completarse y respeta «reducir movimiento» (se muestra completo y quieto).
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

  useEffect(() => {
    if (reduce) {
      setCount(total);
      return;
    }
    if (!inView) return;
    let timer: ReturnType<typeof setTimeout>;
    const step = (current: number) => {
      if (current < total) {
        timer = setTimeout(() => {
          setCount(current + 1);
          step(current + 1);
        }, current === base ? 700 : 950);
      } else {
        timer = setTimeout(() => {
          setCount(base);
          step(base);
        }, 3800);
      }
    };
    step(count);
    return () => clearTimeout(timer);
    // `count` solo da el punto de partida al volver a la vista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, total, base]);

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
    <div ref={ref} role="img" aria-label={description} className={`relative mx-auto aspect-square w-full max-w-[340px] sm:max-w-[460px] ${className}`}>
      {/* Conexiones del núcleo a cada casilla: se encienden al acoplarse la pieza */}
      <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {pieces.map((piece, i) => {
          const slot = SLOTS[i];
          const x = (slot.col - 1) * 100 + 50;
          const y = (slot.row - 1) * 100 + 50;
          const on = i < count;
          return (
            <g key={piece.label}>
              <line x1="150" y1="150" x2={x} y2={y} stroke="var(--c-ink-line)" strokeWidth="2" strokeDasharray="3 5" />
              <m.line
                x1="150"
                y1="150"
                x2={x}
                y2={y}
                stroke="var(--c-accent)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={false}
                animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              />
            </g>
          );
        })}
      </svg>

      <div className="relative grid h-full w-full grid-cols-3 grid-rows-3 gap-3 sm:gap-4">
        {/* El núcleo */}
        <div className="col-start-2 row-start-2 flex flex-col items-center justify-center gap-1.5 rounded-[22px] bg-site-ink-raise p-2 text-center shadow-[0_20px_40px_rgba(0,0,0,0.28)] ring-1 ring-inset ring-site-ink-line sm:gap-2 sm:rounded-[26px]">
          <BrandMark className="h-6 w-9 text-site-on-ink sm:h-8 sm:w-12" />
          <span className="font-landing-display text-[12px] font-bold leading-tight text-white sm:text-[15px]">{spec.core}</span>
          <span className="rounded-full bg-site-accent px-2 py-0.5 text-[10px] font-bold text-site-on-accent sm:text-[11px]">{level}</span>
          <span className="hidden text-[11px] font-medium text-site-on-ink-muted sm:block">
            {count} {unit}
          </span>
          <span className="h-1 w-3/4 overflow-hidden rounded-full bg-site-ink-line">
            <m.span
              className="block h-full rounded-full bg-site-accent"
              initial={false}
              animate={{ width: `${(count / total) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </span>
        </div>

        {/* Las piezas */}
        {pieces.map((piece, i) => {
          const slot = SLOTS[i];
          const Icon = ICONS[piece.icon];
          const on = i < count;
          const away = { x: (slot.col - 2) * 34, y: (slot.row - 2) * 34 };
          const highlighted = spec.highlight === i;
          return (
            <m.div
              key={piece.label}
              style={{ gridRow: slot.row, gridColumn: slot.col }}
              initial={false}
              animate={on ? { opacity: 1, x: 0, y: 0, scale: 1 } : { opacity: 0, x: away.x, y: away.y, scale: 0.86 }}
              transition={on ? { type: "spring", stiffness: 260, damping: 20 } : { duration: 0.35, ease: "easeIn" }}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-[18px] bg-site-on-ink p-2 text-center text-site-ink shadow-[0_14px_30px_rgba(0,0,0,0.22)] sm:gap-2 sm:rounded-[22px] ${
                highlighted ? "ring-[3px] ring-site-accent" : ""
              }`}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} aria-hidden />
              <span className="text-[11px] font-bold leading-tight sm:text-[13px]">{piece.label}</span>
            </m.div>
          );
        })}
      </div>
    </div>
  );
}
