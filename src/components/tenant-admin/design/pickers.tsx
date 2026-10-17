"use client";

import { Check } from 'lucide-react';
import { STOREFRONT_FONT_CLASSNAMES } from '@/lib/storefront/fonts';
import { fontCssVar } from '@/lib/storefront/font-ids';
import { getStorefrontIcon } from '@/lib/storefront/icons';
import { STYLE_PRESETS, STYLE_PRESET_IDS, type StylePresetId } from '@/lib/storefront/presets';
import { RUBROS, RUBRO_IDS, type RubroId } from '@/lib/storefront/rubros';
import { contrastRatio, isHexColor, normalizeHex, readableTextOn } from '@/lib/storefront/color';

const RUBRO_ICON: Record<RubroId, string> = {
  regalos: 'Gift',
  'moda-belleza': 'Shirt',
  'comida-bebidas': 'UtensilsCrossed',
  'ferreteria-tecnologia': 'Wrench',
  general: 'ShoppingBag',
};

export function RubroPicker({ value, onChange }: { value: RubroId | undefined; onChange: (rubro: RubroId) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {RUBRO_IDS.map((id) => {
        const rubro = RUBROS[id];
        const Icon = getStorefrontIcon(RUBRO_ICON[id]);
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={selected}
            className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
              selected ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-300'
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: rubro.palette.primary }}>
              <Icon size={20} />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 font-bold text-gray-900">
                {rubro.label} {selected && <Check size={16} />}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">{rubro.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function StylePicker({
  value,
  suggested,
  primary,
  onChange,
}: {
  value: StylePresetId;
  suggested?: StylePresetId;
  primary: string;
  onChange: (style: StylePresetId) => void;
}) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${STOREFRONT_FONT_CLASSNAMES}`}>
      {STYLE_PRESET_IDS.map((id) => {
        const preset = STYLE_PRESETS[id];
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={selected}
            className={`rounded-2xl border-2 p-4 text-left transition-all ${
              selected ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-300'
            }`}
          >
            <span
              className="block text-lg leading-tight text-gray-900"
              style={{
                fontFamily: fontCssVar(preset.fonts.heading),
                textTransform: preset.headingTransform,
                letterSpacing: preset.headingTracking,
              }}
            >
              {preset.label}
            </span>
            <span className="mt-1 block text-xs text-gray-500" style={{ fontFamily: fontCssVar(preset.fonts.body) }}>
              {preset.description}
            </span>
            <span className="mt-3 flex items-center gap-2">
              <span
                className="px-3 py-1 text-[10px] font-bold"
                style={{ backgroundColor: primary, color: readableTextOn(primary), borderRadius: preset.radius.button }}
              >
                Botón
              </span>
              <span className="h-6 w-6 border border-gray-300 bg-gray-100" style={{ borderRadius: preset.radius.card }} />
              {suggested === id && <span className="ml-auto text-[10px] font-bold uppercase text-emerald-700">Sugerido</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-gray-700 mb-1.5">{label}</span>
      <span className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 focus-within:ring-2 focus-within:ring-gray-300">
        <input
          type="color"
          value={normalizeHex(value, '#000000')}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          maxLength={7}
          onChange={(e) => {
            const next = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
            onChange(next);
          }}
          className={`w-full bg-transparent font-mono text-sm uppercase outline-none ${isHexColor(value) ? 'text-gray-900' : 'text-red-600'}`}
        />
      </span>
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

/** Avisos de legibilidad en lenguaje simple. Devuelve null si todo se lee bien. */
export function ContrastNotes({ primary, background, text }: { primary: string; background: string; text: string }) {
  const notes: string[] = [];
  if (isHexColor(text) && isHexColor(background) && contrastRatio(text, background) < 4.5) {
    notes.push('El texto casi no se distingue del fondo. Usa un texto más oscuro o un fondo más claro.');
  }
  if (isHexColor(primary) && isHexColor(background) && contrastRatio(primary, background) < 1.6) {
    notes.push('Tu color principal se parece mucho al fondo: los botones no van a resaltar.');
  }
  const onPrimary = isHexColor(primary) ? readableTextOn(primary) : null;
  return (
    <div className="space-y-2">
      {onPrimary && (
        <p className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-flex h-6 items-center rounded-md px-2 text-[10px] font-bold" style={{ backgroundColor: primary, color: onPrimary }}>
            Aa
          </span>
          Los botones llevarán texto {onPrimary === '#ffffff' ? 'blanco' : 'oscuro'} para que se lea bien sobre tu color principal.
        </p>
      )}
      {notes.map((note) => (
        <p key={note} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          {note}
        </p>
      ))}
    </div>
  );
}
