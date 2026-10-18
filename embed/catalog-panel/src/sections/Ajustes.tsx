import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { normalizeWhatsapp } from '@shared/storefront/public-store';
import { shrinkImage } from '@shared/image-compress';
import type { PreviewPayload } from '@shared/storefront/preview';
import type { Api } from '../host';
import type { Draft, HeroSlide, StoreResponse } from '../store';
import { Button, Field, Notice, Pill, Section } from '../ui';
import { PreviewPanel, PreviewSheetButton } from '../Preview';

interface Props {
  data: StoreResponse;
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft | null>>;
  canManage: boolean;
  api: Api;
  preview: PreviewPayload;
  previewUrl: string;
}

const SUBDOMAIN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;


export default function Ajustes({ data, draft, setDraft, canManage, api, preview, previewUrl }: Props) {
  const disabled = !canManage;
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [uploadError, setUploadError] = useState('');
  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const fromErp = data.fromErp ?? { name: false, logo: false, whatsapp: false };
  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const setSlides = (heroSlides: HeroSlide[]) => set({ heroSlides });
  const maxSlides = data.limits.heroSlides;

  const upload = async (file: File, kind: 'logo' | 'banner'): Promise<string | null> => {
    setUploadError('');
    setUploading(kind);
    try {
      const { blob, extension } = await shrinkImage(file, kind === 'logo' ? 800 : 2000);
      const form = new FormData();
      form.append('file', new File([blob], `${kind}.${extension}`, { type: blob.type || file.type }));
      form.append('kind', kind);
      const res = await api<{ url: string }>('/store/images', { method: 'POST', form });
      return res.url;
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
      return null;
    } finally {
      setUploading(null);
    }
  };

  const whatsappDigits = normalizeWhatsapp(draft.whatsapp);
  const subdomainError = draft.subdomain && !SUBDOMAIN.test(draft.subdomain) ? 'Solo minúsculas, números y guiones; sin espacios.' : null;

  const editor = (
    <div className="min-w-0 space-y-3">
      <Section title="Logo y portada" description="Lo primero que ve tu cliente.">
        {uploadError && <Notice tone="danger">{uploadError}</Notice>}

        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-cm-md border border-cm-line bg-white">
            {draft.logo ? <img src={draft.logo} alt="Logo" className="max-h-full max-w-full object-contain" /> : <span className="text-cm-caption text-cm-faint">Sin logo</span>}
          </span>
          {!fromErp.logo && (
            <>
              <input
                ref={logoInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  const url = await upload(file, 'logo');
                  if (url) set({ logo: url });
                }}
              />
              <Button disabled={disabled} loading={uploading === 'logo'} icon={<ImagePlus size={16} />} onClick={() => logoInput.current?.click()}>
                {draft.logo ? 'Cambiar logo' : 'Subir logo'}
              </Button>
              {draft.logo && (
                <Button variant="danger" disabled={disabled} onClick={() => set({ logo: '' })}>
                  Quitar
                </Button>
              )}
            </>
          )}
        </div>
        <p className="cs-hint !mt-0">
          {fromErp.logo
            ? 'Es el logo de tu negocio en CyberPOS. Se cambia en Ajustes › Negocio.'
            : 'PNG con fondo transparente se ve mejor. La reducimos antes de subirla.'}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="cs-label !mb-0">
              Banners de portada{' '}
              <span className="font-normal text-cm-muted">
                ({draft.heroSlides.length} de {maxSlides})
              </span>
            </p>
          </div>
          {draft.heroSlides.length === 0 && <p className="text-cm-label text-cm-muted">Sin banners, la portada usa el color de tu marca con los textos de tu rubro.</p>}
          {draft.heroSlides.map((slide, index) => (
            <div key={slide.id} className="rounded-cm-md border border-cm-line bg-cm-field p-3">
              <div className="flex gap-3">
                <img src={slide.image} alt="" className="h-16 w-24 shrink-0 rounded-cm-sm object-cover @md:h-20 @md:w-32" />
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 @xl:grid-cols-3">
                  {(['title', 'subtitle', 'buttonText'] as const).map((key) => (
                    <input
                      key={key}
                      className="cs-input"
                      disabled={disabled}
                      aria-label={key === 'title' ? 'Título' : key === 'subtitle' ? 'Frase pequeña' : 'Texto del botón'}
                      placeholder={key === 'title' ? 'Título' : key === 'subtitle' ? 'Frase pequeña' : 'Texto del botón'}
                      value={slide[key]}
                      maxLength={key === 'subtitle' ? 120 : 60}
                      onChange={(e) => setSlides(draft.heroSlides.map((s, i) => (i === index ? { ...s, [key]: e.target.value } : s)))}
                    />
                  ))}
                </div>
              </div>
              {!disabled && (
                <div className="mt-2 flex justify-end gap-1">
                  <Button variant="ghost" aria-label="Subir" disabled={index === 0} onClick={() => setSlides(swap(draft.heroSlides, index, index - 1))}>
                    <ArrowUp size={16} />
                  </Button>
                  <Button variant="ghost" aria-label="Bajar" disabled={index === draft.heroSlides.length - 1} onClick={() => setSlides(swap(draft.heroSlides, index, index + 1))}>
                    <ArrowDown size={16} />
                  </Button>
                  <Button variant="danger" aria-label="Quitar banner" onClick={() => setSlides(draft.heroSlides.filter((_, i) => i !== index))}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            </div>
          ))}
          <input
            ref={bannerInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              const url = await upload(file, 'banner');
              if (url) setSlides([...draft.heroSlides, { id: `b${Date.now()}`, image: url, title: '', subtitle: '', buttonText: '' }]);
            }}
          />
          {draft.heroSlides.length < maxSlides ? (
            <Button disabled={disabled} loading={uploading === 'banner'} icon={uploading === 'banner' ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />} onClick={() => bannerInput.current?.click()}>
              Agregar banner
            </Button>
          ) : (
            <p className="text-cm-label text-cm-muted">
              Llegaste al máximo de tu plan. {maxSlides === 1 && <Pill tone="pro">Pro: hasta 10</Pill>}
            </p>
          )}
          <p className="cs-hint !mt-0">Mejor horizontal, 1600 px de ancho o más, con lo importante al centro.</p>
        </div>
      </Section>

      <Section title="Contacto" description="Dónde te escriben tus clientes.">
        <Field
          label="WhatsApp para pedidos"
          error={!fromErp.whatsapp && draft.whatsapp && !whatsappDigits ? 'Ese número no parece válido. Escribe tu celular de 9 dígitos.' : null}
          hint={
            fromErp.whatsapp
              ? 'Es el WhatsApp de tu negocio en CyberPOS. Se cambia en Ajustes › Negocio.'
              : whatsappDigits
                ? `Los pedidos llegan a +${whatsappDigits}`
                : 'Tu celular de 9 dígitos; agregamos el 51 de Perú.'
          }
        >
          {(id) => (
            <span className="flex gap-2">
              <input id={id} type="tel" inputMode="tel" className="cs-input" disabled={disabled || fromErp.whatsapp} value={draft.whatsapp} placeholder="987 654 321" onChange={(e) => set({ whatsapp: e.target.value })} />
              {whatsappDigits && (
                <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 shrink-0 items-center rounded-cm-md border border-cm-line bg-cm-field px-3 text-cm-body font-semibold text-cm-ink">
                  Probar
                </a>
              )}
            </span>
          )}
        </Field>
        <div className="grid grid-cols-1 gap-3 @xl:grid-cols-3">
          {(
            [
              ['instagram', 'Instagram', '@tutienda'],
              ['facebook', 'Facebook', 'facebook.com/tutienda'],
              ['tiktok', 'TikTok', '@tutienda'],
            ] as const
          ).map(([key, label, placeholder]) => (
            <Field key={key} label={label}>
              {(id) => (
                <input
                  id={id}
                  className="cs-input"
                  disabled={disabled}
                  value={draft.socialMedia[key]}
                  placeholder={placeholder}
                  onChange={(e) => set({ socialMedia: { ...draft.socialMedia, [key]: e.target.value } })}
                />
              )}
            </Field>
          ))}
        </div>
      </Section>

      <Section title="Nombre y dirección" description="Cómo se llama tu tienda y dónde la encuentran.">
        <Field
          label="Nombre de la tienda"
          error={!fromErp.name && draft.name.trim().length < 2 ? 'Escribe el nombre de tu tienda.' : null}
          hint={fromErp.name ? 'Es el nombre comercial de tu negocio en CyberPOS. Se cambia en Ajustes › Negocio.' : undefined}
        >
          {(id) => <input id={id} className="cs-input" disabled={disabled || fromErp.name} value={draft.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} />}
        </Field>
        <Field label="Dirección en Createam" error={subdomainError} hint="Si la cambias, la dirección anterior deja de funcionar.">
          {(id) => (
            <span className="flex items-stretch overflow-hidden rounded-cm-md border border-cm-line bg-cm-field focus-within:border-cm-primary">
              <input
                id={id}
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-cm-body text-cm-ink outline-none disabled:opacity-60"
                disabled={disabled}
                value={draft.subdomain}
                maxLength={63}
                onChange={(e) => set({ subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              />
              <span className="flex items-center border-l border-cm-line px-3 text-cm-label text-cm-muted">.{data.platformDomain}</span>
            </span>
          )}
        </Field>
        <Field
          label="Dominio propio"
          hint={data.features.customDomain ? 'Ej.: mitienda.pe. En tu proveedor de dominio, apúntalo a createam.cloud (registro CNAME) y escríbenos para activarlo.' : 'Disponible en el plan Pro.'}
        >
          {(id) => (
            <input
              id={id}
              className="cs-input"
              disabled={disabled || !data.features.customDomain}
              value={draft.domain}
              placeholder="mitienda.pe"
              onChange={(e) => set({ domain: e.target.value.toLowerCase().trim() })}
            />
          )}
        </Field>
      </Section>

      <Section title="Cómo apareces en Google" description="Título y descripción para buscadores." action={!data.features.seo ? <Pill tone="pro">Pro</Pill> : undefined}>
        <Field label="Título" hint={`${draft.seoTitle.length}/60`}>
          {(id) => <input id={id} className="cs-input" disabled={disabled || !data.features.seo} value={draft.seoTitle} maxLength={70} placeholder={draft.name} onChange={(e) => set({ seoTitle: e.target.value })} />}
        </Field>
        <Field label="Descripción" hint={`${draft.seoDescription.length}/160`}>
          {(id) => (
            <textarea
              id={id}
              rows={3}
              className="cs-input resize-y"
              disabled={disabled || !data.features.seo}
              value={draft.seoDescription}
              maxLength={170}
              onChange={(e) => set({ seoDescription: e.target.value })}
            />
          )}
        </Field>
      </Section>
    </div>
  );

  return (
    <div className="grid grid-cols-1 items-start gap-3 @4xl:grid-cols-[minmax(0,1fr)_340px]">
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

function swap<T>(list: T[], a: number, b: number): T[] {
  const next = [...list];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}
