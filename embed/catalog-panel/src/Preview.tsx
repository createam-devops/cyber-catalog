import { useEffect, useRef, useState } from 'react';
import { Eye, X } from 'lucide-react';
import { PREVIEW_MESSAGE, PREVIEW_READY, type PreviewPayload } from '@shared/storefront/preview';

/**
 * La tienda real, dibujada por el catálogo en un iframe (/vista-previa de su
 * dominio), con el diseño que se está editando. Vive en otro origen que el
 * ERP: se le habla por postMessage solo con ese origen, nunca con `*`.
 */
function PreviewFrame({ src, payload, width = 390, height = 760 }: { src: string; payload: PreviewPayload; width?: number; height?: number }) {
  const origin = new URL(src, window.location.href).origin;
  const frameRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const payloadRef = useRef(payload);
  payloadRef.current = payload;
  const [ready, setReady] = useState(false);
  const [scale, setScale] = useState(1);

  const send = (data: PreviewPayload) => frameRef.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, payload: data }, origin);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin || event.data?.type !== PREVIEW_READY) return;
      setReady(true);
      send(payloadRef.current);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin]);

  useEffect(() => {
    if (ready) send(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, payload]);

  useEffect(() => {
    if (!boxRef.current) return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / width)));
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={boxRef} className="flex w-full justify-center">
      <div className="overflow-hidden rounded-[1.75rem] border-[6px] border-cm-ink bg-white shadow-lg" style={{ width: width * scale + 12, height: height * scale + 12 }}>
        <iframe
          ref={frameRef}
          src={src}
          title="Vista previa de tu tienda"
          style={{ width, height, border: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        />
      </div>
    </div>
  );
}

/** Columna fija cuando el contenedor es ancho. */
export function PreviewPanel({ src, payload }: { src: string; payload: PreviewPayload }) {
  return (
    <aside className="cs-card sticky top-3 space-y-3">
      <p className="text-cm-label font-semibold text-cm-ink-soft">Así se ve tu tienda</p>
      <PreviewFrame src={src} payload={payload} />
      <p className="text-center text-cm-caption text-cm-muted">Se actualiza mientras editas. Se publica al guardar.</p>
    </aside>
  );
}

/** Botón y hoja a pantalla completa cuando el contenedor es angosto. */
export function PreviewSheetButton({ src, payload }: { src: string; payload: PreviewPayload }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 items-center gap-2 rounded-cm-md border border-cm-line bg-cm-field px-3 text-cm-body font-semibold text-cm-ink"
      >
        <Eye size={16} /> Vista previa
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[1300] flex flex-col p-3"
          style={{ background: 'rgba(15, 23, 42, 0.92)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa de tu tienda"
        >
          <div className="mb-3 flex items-center justify-between text-white">
            <p className="font-semibold">Así se ve tu tienda</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <X size={20} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <PreviewFrame src={src} payload={payload} height={720} />
          </div>
        </div>
      )}
    </>
  );
}
