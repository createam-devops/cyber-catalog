"use client";

import { useEffect, useState } from 'react';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/**
 * «31 de octubre, 11:59 p. m.» en hora de Lima. Se arma a mano: el servidor
 * y el navegador traen datos de idioma distintos y con Intl la frase cambia
 * («…, 6:19» o «… a las 6:19»), y React avisa que la página no coincide.
 */
export function formatEnd(endsAt: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
      .formatToParts(new Date(endsAt))
      .map((part) => [part.type, part.value])
  );
  const hour = Number(parts.hour) % 24;
  return `${Number(parts.day)} de ${MONTHS[Number(parts.month) - 1]}, ${hour % 12 || 12}:${parts.minute.padStart(2, '0')} ${hour < 12 ? 'a. m.' : 'p. m.'}`;
}

type Left = { days: number; hours: number; minutes: number; seconds: number };

/**
 * Lo que falta para `endsAt`, cada segundo. null antes de montarse (el servidor
 * no dibuja segundos: evitaría que la página llegue distinta de como se ve) y
 * 'over' cuando ya pasó.
 */
export function useCountdown(endsAt: string | null | undefined): Left | 'over' | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!endsAt) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);
  if (!endsAt || now === null) return null;
  const ms = Date.parse(endsAt) - now;
  if (!(ms > 0)) return 'over';
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const two = (n: number) => String(n).padStart(2, '0');

/** Contador «2 d 03:14:22». Sin montar todavía, la fecha de fin en texto. */
export default function Countdown({ endsAt, className = '' }: { endsAt: string; className?: string }) {
  const left = useCountdown(endsAt);
  if (left === 'over') return null;
  if (!left) return <span className={className}>hasta el {formatEnd(endsAt)}</span>;
  return (
    <span className={`tabular-nums ${className}`} aria-label={`Termina el ${formatEnd(endsAt)}`}>
      {left.days > 0 && `${left.days} d `}
      {two(left.hours)}:{two(left.minutes)}:{two(left.seconds)}
    </span>
  );
}
