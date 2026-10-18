import { useId, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-cm-primary text-white hover:bg-cm-primary-strong border border-transparent',
  secondary: 'bg-cm-field text-cm-ink border border-cm-line hover:border-cm-primary-line',
  ghost: 'bg-transparent text-cm-ink-soft border border-transparent hover:bg-cm-primary-bg',
  danger: 'bg-transparent text-cm-danger border border-transparent hover:bg-cm-danger-bg',
};

export function Button({
  variant = 'secondary',
  loading = false,
  icon,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; icon?: ReactNode }) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-cm-md px-4 text-cm-body font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

/** Campo con etiqueta, ayuda y error. `children` recibe el id para el control. */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="cs-label">
        {label}
      </label>
      {children(id)}
      {error ? <span className="cs-hint !text-cm-danger">{error}</span> : hint ? <span className="cs-hint">{hint}</span> : null}
    </div>
  );
}

export function Section({ title, description, action, children }: { title: string; description?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="cs-card space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-cm-title font-bold text-cm-ink">{title}</h2>
          {description && <p className="mt-0.5 text-cm-label text-cm-muted">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Opciones excluyentes como botones (sirve en celular: se envuelven). */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<{ value: T; label: string; hint?: string }>;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`min-h-10 rounded-cm-md border px-3.5 text-left text-cm-body font-semibold transition ${
              selected ? 'border-cm-primary bg-cm-primary-bg text-cm-primary-deep' : 'border-cm-line bg-cm-field text-cm-ink-soft hover:border-cm-primary-line'
            }`}
          >
            {option.label}
            {option.hint && <span className="block text-cm-caption font-normal text-cm-muted">{option.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Bloque plegable para lo avanzado: lo básico siempre a la vista, lo demás a un toque. */
export function Collapsible({ title, description, children, defaultOpen = false }: { title: string; description?: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="rounded-cm-md border border-cm-line bg-cm-field">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left"
      >
        <span>
          <span className="block text-cm-body font-semibold text-cm-ink">{title}</span>
          {description && <span className="block text-cm-caption text-cm-muted">{description}</span>}
        </span>
        <ChevronDown size={18} className={`shrink-0 text-cm-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div id={id} className="space-y-4 border-t border-cm-line px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function Pill({ tone = 'neutral', children }: { tone?: 'neutral' | 'ok' | 'warn' | 'pro'; children: ReactNode }) {
  const tones = {
    neutral: 'bg-cm-field text-cm-subtle border-cm-line',
    ok: 'bg-cm-primary-bg text-cm-primary-deep border-cm-primary-line',
    warn: 'bg-cm-warn-bg text-cm-warn border-transparent',
    pro: 'bg-cm-info-bg text-cm-info border-transparent',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-cm-caption font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'danger'; children: ReactNode }) {
  const tones = {
    info: 'bg-cm-info-bg text-cm-info',
    warn: 'bg-cm-warn-bg text-cm-warn',
    danger: 'bg-cm-danger-bg text-cm-danger',
  };
  return <p className={`rounded-cm-md px-3 py-2 text-cm-label font-medium ${tones[tone]}`}>{children}</p>;
}
