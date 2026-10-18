import { useState } from 'react';
import { Check, Store } from 'lucide-react';
import { normalizeWhatsapp } from '@shared/storefront/public-store';
import { getStorefrontIcon } from '@shared/storefront/icons';
import { RUBROS, RUBRO_IDS, type RubroId } from '@shared/storefront/rubros';
import type { Api } from '../host';
import { Button, Field, Notice } from '../ui';

const RUBRO_ICON: Record<RubroId, string> = {
  regalos: 'Gift',
  'moda-belleza': 'Shirt',
  'comida-bebidas': 'UtensilsCrossed',
  'ferreteria-tecnologia': 'Wrench',
  general: 'ShoppingBag',
};

/**
 * Un negocio del ERP que todavía no tiene tienda online. Tres datos y listo:
 * los productos ya los tiene en el ERP; se publican desde Venta online.
 */
export default function Bienvenida({ api, onCreated }: { api: Api; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [rubro, setRubro] = useState<RubroId | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const digits = normalizeWhatsapp(whatsapp);
  const ready = name.trim().length >= 2 && rubro && digits;

  const create = async () => {
    if (!ready) return;
    setCreating(true);
    setError('');
    try {
      await api('/store', { method: 'POST', body: { name: name.trim(), rubro, whatsapp: digits } });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos crear tu tienda.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="cs-card mx-auto max-w-2xl space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-cm-md bg-cm-primary-bg text-cm-primary-deep">
          <Store size={22} />
        </span>
        <div>
          <h2 className="text-cm-display font-bold leading-tight text-cm-ink">Crea tu tienda online</h2>
          <p className="mt-1 text-cm-body text-cm-muted">
            Tus clientes verán los productos que publiques en Venta online y te harán sus pedidos por WhatsApp.
          </p>
        </div>
      </div>

      <Field label="Nombre de la tienda" hint="El que verán tus clientes. Puedes cambiarlo después.">
        {(id) => <input id={id} className="cs-input" value={name} maxLength={60} placeholder="Ej.: Ferretería El Tornillo" onChange={(e) => setName(e.target.value)} />}
      </Field>

      <div>
        <p className="cs-label">¿Qué vende tu negocio?</p>
        <div className="grid grid-cols-1 gap-2 @lg:grid-cols-2">
          {RUBRO_IDS.map((id) => {
            const r = RUBROS[id];
            const Icon = getStorefrontIcon(RUBRO_ICON[id]);
            const selected = rubro === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => setRubro(id)}
                className={`flex min-h-14 items-center gap-3 rounded-cm-md border p-3 text-left transition ${
                  selected ? 'border-cm-primary bg-cm-primary-bg' : 'border-cm-line bg-cm-field hover:border-cm-primary-line'
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-cm-sm text-white" style={{ backgroundColor: r.palette.primary }}>
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1 text-cm-body font-semibold text-cm-ink">{r.label}</span>
                {selected && <Check size={18} className="shrink-0 text-cm-primary-deep" />}
              </button>
            );
          })}
        </div>
      </div>

      <Field
        label="WhatsApp para pedidos"
        error={whatsapp && !digits ? 'Ese número no parece válido. Escribe tu celular de 9 dígitos.' : null}
        hint={digits ? `Los pedidos llegarán a +${digits}` : 'Tu celular de 9 dígitos; agregamos el 51 de Perú.'}
      >
        {(id) => <input id={id} type="tel" inputMode="tel" className="cs-input" value={whatsapp} placeholder="987 654 321" onChange={(e) => setWhatsapp(e.target.value)} />}
      </Field>

      {error && <Notice tone="danger">{error}</Notice>}

      <Button variant="primary" className="w-full @md:w-auto" disabled={!ready} loading={creating} onClick={() => void create()}>
        Crear mi tienda
      </Button>
    </div>
  );
}
