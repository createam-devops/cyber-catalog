import type { Dispatch, SetStateAction } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { isHexColor, normalizeHex, readableTextOn, contrastRatio } from '@shared/storefront/color';
import { CONTENT_FIELDS, CONTENT_KEYS, type StorefrontContent } from '@shared/storefront/content';
import { FONT_IDS, FONT_LABELS, type FontId } from '@shared/storefront/font-ids';
import { getStorefrontIcon } from '@shared/storefront/icons';
import { STYLE_PRESETS, STYLE_PRESET_IDS, type CardStyle, type FooterStyle, type StylePresetId } from '@shared/storefront/presets';
import { RUBROS, RUBRO_IDS, type RubroId } from '@shared/storefront/rubros';
import { resolveStorefront, type HeroMode, type HomeMode, type StorefrontSettings } from '@shared/storefront/theme';
import type { PreviewPayload } from '@shared/storefront/preview';
import type { Draft, StoreResponse } from '../store';
import { Collapsible, Field, FluidGrid, Notice, Pill, Section, Segmented } from '../ui';
import { PreviewPanel, PreviewSheetButton } from '../Preview';
import { BenefitsEditor, FaqEditor, PromoEditor } from './Extras';

interface Props {
  data: StoreResponse;
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft | null>>;
  canManage: boolean;
  preview: PreviewPayload;
  previewUrl: string;
}

const RUBRO_ICON: Record<RubroId, string> = {
  regalos: 'Gift',
  'moda-belleza': 'Shirt',
  'comida-bebidas': 'UtensilsCrossed',
  'ferreteria-tecnologia': 'Wrench',
  general: 'ShoppingBag',
};

const QUICK_COLORS = ['#c2185b', '#7c3aed', '#1d4ed8', '#0f766e', '#15803d', '#c2410c', '#b45309', '#1f2937'];

export function ColorInput({ label, value, onChange, disabled }: { label: string; value: string; onChange: (hex: string) => void; disabled?: boolean }) {
  return (
    <Field label={label} error={isHexColor(value) ? null : 'Usa un código como #1D4ED8'}>
      {(id) => (
        <span className="flex items-center gap-2">
          <input
            type="color"
            aria-label={`${label}: elegir`}
            value={normalizeHex(value, '#000000')}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-12 shrink-0 cursor-pointer rounded-cm-sm border border-cm-line bg-transparent p-0.5"
          />
          <input
            id={id}
            className="cs-input font-mono uppercase"
            value={value}
            maxLength={7}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)}
          />
        </span>
      )}
    </Field>
  );
}

export default function Diseno({ draft, setDraft, canManage, data, preview, previewUrl }: Props) {
  const s = draft.storefront;
  const rubro = RUBROS[s.rubro ?? 'general'];
  const theme = resolveStorefront({ colors: draft.colors, storefront: s });
  const disabled = !canManage;

  const update = (patch: Partial<StorefrontSettings>) => setDraft((d) => (d ? { ...d, storefront: { ...d.storefront, ...patch } } : d));
  const setLayout = (patch: NonNullable<StorefrontSettings['layout']>) => update({ layout: { ...s.layout, ...patch } });
  const setColors = (patch: Partial<Draft['colors']>) => setDraft((d) => (d ? { ...d, colors: { ...d.colors, ...patch } } : d));
  const setContent = (key: keyof StorefrontContent, value: string | undefined) => {
    const content = { ...s.content };
    if (value === undefined) delete content[key];
    else content[key] = value;
    update({ content });
  };

  const primary = draft.colors.primary;
  const lowContrast = isHexColor(primary) && contrastRatio(primary, theme.colors.background) < 1.6;

  const editor = (
    <div className="min-w-0 space-y-3">
      <Section title="Rubro" description="Con esto preparamos los textos y las categorías sugeridas.">
        <FluidGrid min="17rem" className="gap-2">
          {RUBRO_IDS.map((id) => {
            const r = RUBROS[id];
            const Icon = getStorefrontIcon(RUBRO_ICON[id]);
            const selected = (s.rubro ?? 'general') === id;
            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => update({ rubro: id })}
                className={`flex min-h-14 items-center gap-3 rounded-cm-md border p-3 text-left transition disabled:cursor-not-allowed ${
                  selected ? 'border-cm-primary bg-cm-primary-bg' : 'border-cm-line bg-cm-field hover:border-cm-primary-line'
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-cm-sm text-white" style={{ backgroundColor: r.palette.primary }}>
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-cm-body font-semibold text-cm-ink">{r.label}</span>
                  <span className="block truncate text-cm-caption text-cm-muted">{r.description}</span>
                </span>
                {selected && <Check size={18} className="shrink-0 text-cm-primary-deep" />}
              </button>
            );
          })}
        </FluidGrid>
      </Section>

      <Section title="Estilo" description="La forma de tu tienda: letras, curvas y mayúsculas.">
        <FluidGrid min="15rem" className="gap-2">
          {STYLE_PRESET_IDS.map((id: StylePresetId) => {
            const preset = STYLE_PRESETS[id];
            const selected = theme.style === id;
            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => update({ style: id, fonts: undefined })}
                className={`rounded-cm-md border p-3 text-left transition disabled:cursor-not-allowed ${
                  selected ? 'border-cm-primary bg-cm-primary-bg' : 'border-cm-line bg-cm-field hover:border-cm-primary-line'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-cm-body font-bold text-cm-ink">{preset.label}</span>
                  {rubro.suggestedStyle === id && <Pill tone="ok">Sugerido</Pill>}
                </span>
                <span className="mt-0.5 block text-cm-caption text-cm-muted">{preset.description}</span>
                <span className="mt-2 flex items-center gap-2">
                  <span
                    className="px-3 py-1 text-cm-caption font-bold"
                    style={{ backgroundColor: isHexColor(primary) ? primary : '#111827', color: readableTextOn(isHexColor(primary) ? primary : '#111827'), borderRadius: preset.radius.button }}
                  >
                    Botón
                  </span>
                  <span className="h-6 w-6 border border-cm-line bg-white" style={{ borderRadius: preset.radius.card }} />
                </span>
              </button>
            );
          })}
        </FluidGrid>
      </Section>

      <Section title="Color principal" description="El de botones y destacados.">
        <div className="flex flex-wrap gap-2">
          {[rubro.palette.primary, ...QUICK_COLORS.filter((c) => c !== rubro.palette.primary)].map((c) => (
            <button
              key={c}
              type="button"
              disabled={disabled}
              aria-label={`Usar ${c}`}
              aria-pressed={primary.toLowerCase() === c}
              onClick={() => setColors({ primary: c })}
              className={`h-10 w-10 rounded-full border-2 transition ${primary.toLowerCase() === c ? 'scale-110 border-cm-ink' : 'border-white shadow'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <ColorInput label="O escribe tu color" value={primary} onChange={(primary) => setColors({ primary })} disabled={disabled} />
        {lowContrast && <Notice tone="warn">Tu color se parece mucho al fondo: los botones no van a resaltar.</Notice>}
      </Section>

      <Collapsible title="Más opciones de diseño" description="Colores de la página, letras, portada y tarjetas">
        <FluidGrid min="15rem">
          <ColorInput label="Color secundario" value={draft.colors.secondary} onChange={(secondary) => setColors({ secondary })} disabled={disabled} />
          <ColorInput label="Color de acento" value={draft.colors.accent} onChange={(accent) => setColors({ accent })} disabled={disabled} />
          <ColorInput label="Fondo de la página" value={s.colors?.background ?? theme.colors.background} onChange={(background) => update({ colors: { ...s.colors, background } })} disabled={disabled} />
          <ColorInput label="Color del texto" value={s.colors?.text ?? theme.colors.text} onChange={(text) => update({ colors: { ...s.colors, text } })} disabled={disabled} />
          {(['heading', 'body'] as const).map((slot) => (
            <Field key={slot} label={slot === 'heading' ? 'Letra de títulos' : 'Letra de textos'}>
              {(id) => (
                <select
                  id={id}
                  className="cs-input"
                  disabled={disabled}
                  value={s.fonts?.[slot] ?? ''}
                  onChange={(e) => update({ fonts: { ...s.fonts, [slot]: (e.target.value || undefined) as FontId | undefined } })}
                >
                  <option value="">La del estilo ({FONT_LABELS[STYLE_PRESETS[theme.style].fonts[slot]]})</option>
                  {FONT_IDS.map((f) => (
                    <option key={f} value={f}>
                      {FONT_LABELS[f]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          ))}
        </FluidGrid>
        <FluidGrid min="15rem">
          <div>
            <p className="cs-label">Tipo de portada</p>
            <Segmented<HomeMode>
              label="Tipo de portada"
              value={theme.layout.home}
              onChange={(home) => setLayout({ home })}
              options={[
                { value: 'catalog', label: 'Catálogo' },
                { value: 'spotlight', label: 'Producto estrella' },
              ]}
            />
            <p className="cs-hint">Producto estrella: para tiendas de uno a tres productos. El producto ocupa la portada con su botón de pedir.</p>
          </div>
          {theme.layout.home === 'spotlight' && (
            <Field label="Producto estrella" hint="Sin elegir: el primero destacado, o el primero.">
              {(id) => (
                <select
                  id={id}
                  className="cs-input"
                  disabled={disabled}
                  value={s.layout?.spotlightProductId ?? ''}
                  onChange={(e) => setLayout({ spotlightProductId: e.target.value || undefined })}
                >
                  <option value="">Automático</option>
                  {preview.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          )}
          <div>
            <p className="cs-label">Portada</p>
            <Segmented<HeroMode>
              label="Portada"
              value={theme.layout.hero}
              onChange={(hero) => setLayout({ hero })}
              options={[
                { value: 'carousel', label: 'Carrusel' },
                { value: 'banner', label: 'Un banner fijo' },
                { value: 'none', label: 'Sin portada' },
              ]}
            />
          </div>
          <div>
            <p className="cs-label">Productos por fila en computadora</p>
            <Segmented<3 | 4> label="Productos por fila" value={theme.layout.gridColumns} onChange={(gridColumns) => setLayout({ gridColumns })} options={[{ value: 3, label: '3' }, { value: 4, label: '4' }]} />
          </div>
          <div>
            <p className="cs-label">Tarjetas de producto</p>
            <Segmented<CardStyle>
              label="Tarjetas"
              value={theme.layout.cardStyle}
              onChange={(cardStyle) => setLayout({ cardStyle })}
              options={[
                { value: 'soft', label: 'Suaves' },
                { value: 'flat', label: 'Planas' },
                { value: 'outlined', label: 'Con borde' },
              ]}
            />
          </div>
          <div>
            <p className="cs-label">Pie de página</p>
            <Segmented<FooterStyle>
              label="Pie de página"
              value={theme.layout.footer}
              onChange={(footer) => setLayout({ footer })}
              options={[
                { value: 'dark', label: 'Oscuro' },
                { value: 'light', label: 'Claro' },
                { value: 'brand', label: 'Color de tu marca' },
              ]}
            />
          </div>
          <label className={`flex min-h-10 items-center gap-3 ${data.features.stock ? '' : 'opacity-60'}`}>
            <input
              type="checkbox"
              className="h-5 w-5 accent-[var(--cm-primary,#10b981)]"
              checked={theme.layout.showStock}
              disabled={disabled || !data.features.stock}
              onChange={(e) => setLayout({ showStock: e.target.checked })}
            />
            <span className="text-cm-body font-semibold text-cm-ink">
              Mostrar stock y «Agotado» {!data.features.stock && <Pill tone="pro">Pro</Pill>}
            </span>
          </label>
          <label className="flex min-h-10 items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[var(--cm-primary,#10b981)]"
              checked={theme.layout.showNameWithLogo}
              disabled={disabled}
              onChange={(e) => setLayout({ showNameWithLogo: e.target.checked })}
            />
            <span className="text-cm-body font-semibold text-cm-ink">
              Mostrar el nombre junto al logo
              <span className="block text-cm-label font-normal text-cm-muted">Úsalo si tu logo es solo un ícono, sin el nombre escrito.</span>
            </span>
          </label>
        </FluidGrid>
      </Collapsible>

      <Collapsible title="Textos de tu tienda" description={`Vienen del rubro ${rubro.label.toLowerCase()}; cambia los que quieras`}>
        <FluidGrid min="18rem">
          {CONTENT_KEYS.map((key) => {
            const field = CONTENT_FIELDS[key];
            const override = s.content?.[key];
            return (
              <Field key={key} label={field.label} hint={field.hint}>
                {(id) => (
                  <span className="flex items-center gap-1">
                    <input
                      id={id}
                      className="cs-input"
                      disabled={disabled}
                      value={override ?? rubro.content[key]}
                      maxLength={field.max}
                      placeholder={rubro.content[key] || '(oculto)'}
                      onChange={(e) => setContent(key, e.target.value)}
                    />
                    {override !== undefined && !disabled && (
                      <button type="button" aria-label="Volver al texto del rubro" title="Volver al texto del rubro" onClick={() => setContent(key, undefined)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-cm-sm text-cm-muted hover:bg-cm-primary-bg">
                        <RotateCcw size={16} />
                      </button>
                    )}
                  </span>
                )}
              </Field>
            );
          })}
        </FluidGrid>
      </Collapsible>

      <PromoEditor settings={s} update={update} disabled={disabled} />
      <BenefitsEditor settings={s} theme={theme} rubro={rubro.id} update={update} disabled={disabled} />
      <FaqEditor settings={s} theme={theme} rubro={rubro.id} update={update} disabled={disabled} />
    </div>
  );

  // Con espacio, la vista previa al lado: mide lo que el teléfono y el editor toma el resto. Si no, va en un botón.
  return (
    <div className="grid grid-cols-1 items-start gap-3 @4xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="@4xl:hidden">
        <PreviewSheetButton src={previewUrl} payload={preview} />
      </div>
      {editor}
      <div className="hidden @4xl:block">
        <PreviewPanel src={previewUrl} payload={preview} />
      </div>
    </div>
  );
}
