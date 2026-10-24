import { EyeOff, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { getStorefrontIcon } from '@shared/storefront/icons';
import type { RubroId } from '@shared/storefront/rubros';
import { BENEFIT_ICONS, RUBRO_SUGGESTIONS } from '@shared/storefront/suggestions';
import { MAX_BENEFITS, MAX_FAQ, type ResolvedStorefront, type StoreBenefit, type StoreFaq, type StorefrontSettings } from '@shared/storefront/theme';
import { Button, Collapsible, Field, FluidGrid } from '../ui';

interface Props {
  settings: StorefrontSettings;
  theme: ResolvedStorefront;
  rubro: RubroId;
  update: (patch: Partial<StorefrontSettings>) => void;
  disabled: boolean;
}

const ICON_LABELS: Record<(typeof BENEFIT_ICONS)[number], string> = {
  Truck: 'Envío',
  WhatsApp: 'WhatsApp',
  MessageCircle: 'Mensaje',
  ShieldCheck: 'Garantía',
  BadgeCheck: 'Verificado',
  Clock: 'Tiempo',
  CreditCard: 'Pago',
  MapPin: 'Ubicación',
  Award: 'Premio',
  Gift: 'Regalo',
  Palette: 'Personalizado',
  Leaf: 'Natural',
  Wrench: 'Servicio',
  Star: 'Estrella',
  Heart: 'Corazón',
  Sparkles: 'Brillo',
  Tag: 'Precio',
};

const Chip = ({ children, onClick, disabled }: { children: string; onClick: () => void; disabled: boolean }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-dashed border-cm-line px-3 text-cm-label font-semibold text-cm-subtle transition hover:border-cm-primary hover:text-cm-primary disabled:opacity-50"
  >
    <Plus size={14} aria-hidden="true" />
    {children}
  </button>
);

/** Franja de beneficios: delivery, pagos, garantía… Lo que la tienda afirma de sí misma. */
export function BenefitsEditor({ settings, theme, rubro, update, disabled }: Props) {
  const custom = Array.isArray(settings.benefits);
  const items: StoreBenefit[] = custom ? settings.benefits! : theme.benefits;
  const set = (next: StoreBenefit[]) => update({ benefits: next });
  const edit = (index: number, patch: Partial<StoreBenefit>) => set(items.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  const suggestions = RUBRO_SUGGESTIONS[rubro].benefits.filter((s) => !items.some((b) => b.title.trim().toLowerCase() === s.title.toLowerCase()));

  return (
    <Collapsible title="Beneficios" description="Por qué comprarte a ti: se ven bajo la portada y en cada producto">
      <div className="space-y-3">
        <p className="cs-hint !mt-0">
          {custom
            ? 'Escribe solo lo que cumples: delivery, formas de pago, garantía, personalización…'
            : 'Hoy se ven los que valen para toda tienda. Cámbialos o agrega los tuyos.'}
        </p>
        {items.length === 0 && <p className="text-cm-label text-cm-muted">La franja está oculta.</p>}
        <FluidGrid min="18rem">
          {items.map((benefit, index) => {
            const Icon = getStorefrontIcon(benefit.icon);
            return (
              <div key={index} className="space-y-2 rounded-cm-md border border-cm-line bg-cm-field p-3">
                <Field label="Ícono">
                  {(id) => (
                    <span className="flex items-center gap-2">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cm-primary-bg text-cm-primary">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <select id={id} className="cs-input" disabled={disabled} value={benefit.icon} onChange={(e) => edit(index, { icon: e.target.value })}>
                        {BENEFIT_ICONS.map((name) => (
                          <option key={name} value={name}>
                            {ICON_LABELS[name]}
                          </option>
                        ))}
                      </select>
                    </span>
                  )}
                </Field>
                <Field label="Título">
                  {(id) => <input id={id} className="cs-input" disabled={disabled} maxLength={40} value={benefit.title} placeholder="Ej.: Delivery a domicilio" onChange={(e) => edit(index, { title: e.target.value })} />}
                </Field>
                <Field label="Detalle (opcional)">
                  {(id) => <input id={id} className="cs-input" disabled={disabled} maxLength={80} value={benefit.text ?? ''} placeholder="Ej.: Coordinamos el día y la hora" onChange={(e) => edit(index, { text: e.target.value })} />}
                </Field>
                {!disabled && (
                  <div className="flex justify-end">
                    <Button variant="danger" aria-label="Quitar beneficio" onClick={() => set(items.filter((_, i) => i !== index))}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </FluidGrid>
        {!disabled && (
          <div className="flex flex-wrap gap-2">
            {items.length < MAX_BENEFITS && (
              <Button icon={<Plus size={16} />} onClick={() => set([...items, { icon: 'Star', title: '', text: '' }])}>
                Agregar beneficio
              </Button>
            )}
            {items.length < MAX_BENEFITS &&
              suggestions.slice(0, MAX_BENEFITS - items.length + 2).map((s) => (
                <Chip key={s.title} disabled={disabled} onClick={() => set([...items, s])}>
                  {s.title}
                </Chip>
              ))}
          </div>
        )}
        {!disabled && (custom || items.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {custom && (
              <Button variant="ghost" icon={<RotateCcw size={16} />} onClick={() => update({ benefits: undefined })}>
                Volver a los de siempre
              </Button>
            )}
            {items.length > 0 && (
              <Button variant="ghost" icon={<EyeOff size={16} />} onClick={() => set([])}>
                Ocultar la franja
              </Button>
            )}
          </div>
        )}
      </div>
    </Collapsible>
  );
}

/** Preguntas frecuentes: visibles en la portada y marcadas para Google y los asistentes de IA. */
export function FaqEditor({ settings, theme, rubro, update, disabled }: Props) {
  const custom = Array.isArray(settings.faq);
  const items: StoreFaq[] = custom ? settings.faq! : theme.faq;
  const set = (next: StoreFaq[]) => update({ faq: next });
  const edit = (index: number, patch: Partial<StoreFaq>) => set(items.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  const suggestions = RUBRO_SUGGESTIONS[rubro].questions.filter((q) => !items.some((f) => f.q.trim().toLowerCase() === q.toLowerCase()));

  return (
    <Collapsible title="Preguntas frecuentes" description="Envíos, pagos, tiempos… Google y los asistentes de IA usan estas respuestas">
      <div className="space-y-3">
        <p className="cs-hint !mt-0">Respuestas cortas y concretas, de dos o tres frases: así Google y los asistentes de IA las pueden citar tal cual.</p>
        {items.length === 0 && <p className="text-cm-label text-cm-muted">Las preguntas están ocultas.</p>}
        {items.map((item, index) => (
          <div key={index} className="space-y-2 rounded-cm-md border border-cm-line bg-cm-field p-3">
            <Field label="Pregunta">
              {(id) => <input id={id} className="cs-input" disabled={disabled} maxLength={120} value={item.q} placeholder="Ej.: ¿Hacen delivery?" onChange={(e) => edit(index, { q: e.target.value })} />}
            </Field>
            <Field label="Respuesta" hint={item.q.trim() && !item.a.trim() ? 'Sin respuesta, la pregunta no se publica.' : undefined}>
              {(id) => (
                <textarea
                  id={id}
                  className="cs-input resize-y"
                  rows={3}
                  disabled={disabled}
                  maxLength={500}
                  value={item.a}
                  placeholder="Ej.: Sí, en Trujillo y alrededores. El costo depende de la zona y te lo confirmamos al pedir."
                  onChange={(e) => edit(index, { a: e.target.value })}
                />
              )}
            </Field>
            {!disabled && (
              <div className="flex justify-end">
                <Button variant="danger" aria-label="Quitar pregunta" onClick={() => set(items.filter((_, i) => i !== index))}>
                  <Trash2 size={16} />
                </Button>
              </div>
            )}
          </div>
        ))}
        {!disabled && (
          <div className="flex flex-wrap gap-2">
            {items.length < MAX_FAQ && (
              <Button icon={<Plus size={16} />} onClick={() => set([...items, { q: '', a: '' }])}>
                Agregar pregunta
              </Button>
            )}
            {items.length < MAX_FAQ &&
              suggestions.map((q) => (
                <Chip key={q} disabled={disabled} onClick={() => set([...items, { q, a: '' }])}>
                  {q}
                </Chip>
              ))}
          </div>
        )}
        {!disabled && (custom || items.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {custom && (
              <Button variant="ghost" icon={<RotateCcw size={16} />} onClick={() => update({ faq: undefined })}>
                Volver a la de siempre
              </Button>
            )}
            {items.length > 0 && (
              <Button variant="ghost" icon={<EyeOff size={16} />} onClick={() => set([])}>
                Ocultar las preguntas
              </Button>
            )}
          </div>
        )}
      </div>
    </Collapsible>
  );
}

/** ISO → valor de <input type="datetime-local"> en la hora del navegador. */
function toLocalInput(iso: string | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Aviso de oferta de toda la tienda, con contador si tiene fecha de fin. */
export function PromoEditor({ settings, update, disabled }: Pick<Props, 'settings' | 'update' | 'disabled'>) {
  const promo = settings.promo ?? { text: '', enabled: true };
  const set = (patch: Partial<NonNullable<StorefrontSettings['promo']>>) => update({ promo: { ...promo, ...patch } });
  const end = promo.endsAt ? Date.parse(promo.endsAt) : NaN;
  const expired = Number.isFinite(end) && end <= Date.now();
  const showing = promo.enabled !== false && Boolean(promo.text.trim()) && !expired;

  return (
    <Collapsible title="Aviso de oferta" description="Una oferta real, con fecha de fin: arriba de tus productos y con contador">
      <div className="space-y-3">
        <label className="flex min-h-10 items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[var(--cm-primary,#10b981)]"
            checked={promo.enabled !== false}
            disabled={disabled}
            onChange={(e) => set({ enabled: e.target.checked })}
          />
          <span className="text-cm-body font-semibold text-cm-ink">Mostrar el aviso</span>
        </label>
        <FluidGrid min="16rem">
          <Field label="Texto del aviso" hint="Ej.: 10% en ramos por el Día de la Madre">
            {(id) => <input id={id} className="cs-input" disabled={disabled} maxLength={90} value={promo.text} onChange={(e) => set({ text: e.target.value })} />}
          </Field>
          <Field label="Termina (opcional)" hint="Con fecha se ve un contador y el aviso se apaga solo al llegar.">
            {(id) => (
              <input
                id={id}
                type="datetime-local"
                className="cs-input"
                disabled={disabled}
                value={toLocalInput(promo.endsAt)}
                onChange={(e) => set({ endsAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              />
            )}
          </Field>
        </FluidGrid>
        {expired && <p className="text-cm-label font-semibold text-cm-warn">La fecha ya pasó: el aviso no se muestra. Cambia la fecha o quítala.</p>}
        {!expired && promo.text.trim() && <p className="text-cm-label text-cm-muted">{showing ? 'Se ve en tu tienda.' : 'Está apagado.'}</p>}
        <p className="cs-hint !mt-0">Usa solo ofertas reales. Un contador que se reinicia engaña al cliente y es publicidad engañosa.</p>
      </div>
    </Collapsible>
  );
}
