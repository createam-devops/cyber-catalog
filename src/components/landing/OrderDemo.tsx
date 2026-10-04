"use client";

import { useState } from "react";

// Productos de ejemplo; el formato del mensaje es el mismo que arma el carrito
// de las tiendas (ver components/store/modern/ModernCart.tsx).
const PRODUCTS = [
  { id: "a", name: "Cuadro calendario", price: 35 },
  { id: "b", name: "Caja corazón", price: 48 },
  { id: "c", name: "Ramo", price: 90 },
];

const EMPTY: Record<string, number> = { a: 0, b: 0, c: 0 };

export default function OrderDemo() {
  const [qty, setQty] = useState<Record<string, number>>({ ...EMPTY, a: 1 });

  const picked = PRODUCTS.filter((p) => qty[p.id] > 0);
  const total = picked.reduce((sum, p) => sum + p.price * qty[p.id], 0);

  return (
    <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-[18px] rounded-[22px] border border-[#DDE4F0] bg-[#F6F8FC] p-5 sm:p-7">
      <div>
        <h3 className="font-landing-display text-[22px] font-bold">Pruébalo: arma un pedido</h3>
        <p className="mt-1 text-[15px] text-[#3D4B66]">Así llega el mensaje al WhatsApp del negocio.</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {PRODUCTS.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2 rounded-[14px] border border-[#DDE4F0] bg-white px-3.5 py-3"
          >
            <div className="min-w-0">
              <p className="font-bold">{p.name}</p>
              <p className="text-sm text-[#3D4B66]">
                S/ {p.price.toFixed(2)} · {qty[p.id] > 0 ? `en el pedido: ${qty[p.id]}` : "sin agregar"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setQty((q) => ({ ...q, [p.id]: q[p.id] + 1 }))}
              className="min-h-[44px] rounded-[10px] border-[1.5px] border-[#A21CAF] bg-white px-[18px] text-[15px] font-bold text-[#7A1485] transition-colors hover:bg-[#F7E3F9]"
            >
              Agregar
            </button>
          </div>
        ))}
      </div>

      <div aria-live="polite" className="rounded-2xl rounded-tl bg-[#DFF5D8] px-[18px] py-4 text-[15px] leading-[1.6] text-[#12331A]">
        {picked.length > 0 ? (
          <>
            <p>¡Hola! Quiero hacer un pedido:</p>
            <div className="my-2">
              {picked.map((p) => (
                <p key={p.id}>
                  • {p.name} x{qty[p.id]} - S/{(p.price * qty[p.id]).toFixed(2)}
                </p>
              ))}
            </div>
            <p className="font-bold">Total: S/{total.toFixed(2)}</p>
          </>
        ) : (
          <p>Agrega un producto para ver el mensaje.</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setQty(EMPTY)}
        className="min-h-[44px] self-start px-1 text-[15px] font-bold text-[#1357AD] underline hover:text-[#0F3281]"
      >
        Vaciar el pedido
      </button>
    </div>
  );
}
