import { useEffect, useRef, useState, type RefObject } from 'react';
import { Eye, X } from 'lucide-react';
import { PREVIEW_MESSAGE, PREVIEW_READY, type PreviewPayload } from '@shared/storefront/preview';

/**
 * La tienda real, dibujada por el catálogo en un iframe (/vista-previa de su
 * dominio), con el diseño que se está editando. Vive en otro origen que el
 * ERP: se le habla por postMessage solo con ese origen, nunca con `*`.
 */
/** Borde del marco de teléfono (6 px por lado). */
const FRAME_BORDER = 12;

/**
 * El teléfono se dibuja a su tamaño real (`width` × `height`, el de un
 * celular) y se achica para caber en `maxHeight` y, salvo `fitWidth={false}`,
 * en el ancho de su caja. Nunca se agranda.
 */
function PreviewFrame({
  src,
  payload,
  maxHeight,
  fitWidth: limitByWidth = true,
  width = 390,
  height = 760,
}: {
  src: string;
  payload: PreviewPayload;
  maxHeight?: number;
  fitWidth?: boolean;
  width?: number;
  height?: number;
}) {
  const origin = new URL(src, window.location.href).origin;
  const frameRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const payloadRef = useRef(payload);
  payloadRef.current = payload;
  const [ready, setReady] = useState(false);
  const [boxWidth, setBoxWidth] = useState(width + FRAME_BORDER);
  const fitWidth = limitByWidth ? (boxWidth - FRAME_BORDER) / width : 1;
  const fitHeight = maxHeight ? (maxHeight - FRAME_BORDER) / height : 1;
  const scale = Math.max(0.2, Math.min(1, fitWidth, fitHeight));

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
    const observer = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="flex w-full justify-center">
      <div className="overflow-hidden rounded-[1.75rem] border-[6px] border-cm-ink bg-white shadow-lg" style={{ width: width * scale + FRAME_BORDER, height: height * scale + FRAME_BORDER }}>
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

/**
 * Alto disponible para el teléfono dentro de `container`: el alto visible
 * (`available()`) menos lo que ocupa lo demás del contenedor (título, nota).
 */
function useAvailableHeight(container: RefObject<HTMLElement>, frameBox: RefObject<HTMLElement>, available: () => number) {
  const [maxHeight, setMaxHeight] = useState<number>();
  useEffect(() => {
    const box = container.current;
    const frame = frameBox.current;
    if (!box || !frame) return;
    const update = () => setMaxHeight(available() - (box.offsetHeight - frame.offsetHeight));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return maxHeight;
}

/**
 * Columna al lado del editor cuando el contenedor es ancho. Mide lo que el
 * teléfono, y el teléfono se achica para caber en el alto de la pantalla.
 */
export function PreviewPanel({ src, payload }: { src: string; payload: PreviewPayload }) {
  const asideRef = useRef<HTMLElement>(null);
  const frameBoxRef = useRef<HTMLDivElement>(null);
  // La columna queda fija arriba (sticky, a 0.75rem): cabe en la ventana menos ese margen arriba y abajo.
  const maxHeight = useAvailableHeight(asideRef, frameBoxRef, () => window.innerHeight - 24);
  return (
    <aside ref={asideRef} className="cs-card sticky top-3 space-y-3">
      <p className="text-cm-label font-semibold text-cm-ink-soft">Así se ve tu tienda</p>
      <div ref={frameBoxRef}>
        <PreviewFrame src={src} payload={payload} maxHeight={maxHeight} fitWidth={false} />
      </div>
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
          <SheetFrame src={src} payload={payload} />
        </div>
      )}
    </>
  );
}

/** El teléfono dentro de la hoja: cabe en lo que queda de pantalla bajo su título. */
function SheetFrame({ src, payload }: { src: string; payload: PreviewPayload }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>();
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const observer = new ResizeObserver(([entry]) => setMaxHeight(entry.contentRect.height));
    observer.observe(area);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={areaRef} className="min-h-0 flex-1 overflow-auto">
      <PreviewFrame src={src} payload={payload} maxHeight={maxHeight} />
    </div>
  );
}
