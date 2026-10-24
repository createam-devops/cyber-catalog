import { Star } from 'lucide-react';

/** Cinco estrellas con las llenas según `value` (redondeado). Solo decorativas: el texto lleva el número. */
export default function Stars({ value, size = 14, className = '' }: { value: number; size?: number; className?: string }) {
  const filled = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} className={i < filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-sf-border'} strokeWidth={1.75} />
      ))}
    </span>
  );
}
