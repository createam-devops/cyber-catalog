"use client";

import { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { PREVIEW_MESSAGE, PREVIEW_PATH, PREVIEW_READY, type PreviewPayload } from '@/lib/storefront/preview';

const DEVICES = {
  mobile: { width: 390, height: 780, label: 'Celular', Icon: Smartphone },
  desktop: { width: 1280, height: 860, label: 'Computadora', Icon: Monitor },
} as const;

type Device = keyof typeof DEVICES;

/**
 * La vitrina real, dibujada dentro de un iframe con el diseño en borrador.
 * El iframe tiene su propio ancho, así que la vista de celular se comporta
 * como un celular de verdad (no solo una caja angosta).
 */
export default function StorefrontPreviewFrame({ payload }: { payload: PreviewPayload | null }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [device, setDevice] = useState<Device>('mobile');
  const [boxWidth, setBoxWidth] = useState(0);

  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  const send = (data: PreviewPayload | null) => {
    if (data) iframeRef.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, payload: data }, window.location.origin);
  };

  // El iframe avisa cuando está listo (también si se recarga): se le manda lo último.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== PREVIEW_READY) return;
      setReady(true);
      send(payloadRef.current);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (ready) send(payload);
  }, [ready, payload]);

  useEffect(() => {
    if (!boxRef.current) return;
    const observer = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, []);

  const { width, height } = DEVICES[device];
  const scale = boxWidth > 0 ? Math.min(1, boxWidth / width) : 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">Vista previa</p>
        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          {(Object.keys(DEVICES) as Device[]).map((key) => {
            const { label, Icon } = DEVICES[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDevice(key)}
                aria-pressed={device === key}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  device === key ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            );
          })}
        </div>
      </div>
      <div ref={boxRef} className="w-full flex justify-center">
        <div
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          style={{ width: width * scale, height: height * scale }}
        >
          <iframe
            ref={iframeRef}
            src={PREVIEW_PATH}
            title="Vista previa de la tienda"
            style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left', border: 0 }}
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 text-center">Así se verá tu tienda. Los cambios se publican al guardar.</p>
    </div>
  );
}
