"use client";

import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';

export default function BillingPendingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6">
      <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-gray-100 text-center max-w-sm w-full space-y-4">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
          <Clock size={40} className="text-amber-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Pago pendiente</h2>
        <p className="text-gray-500 text-sm">
          Tu pago está siendo procesado. Recibirás una confirmación cuando sea aprobado.
          Puede tardar unos minutos.
        </p>
        <button
          onClick={() => router.push('/tenant-admin')}
          className="mt-2 w-full py-3 rounded-2xl bg-gray-900 text-white text-sm font-bold hover:bg-black transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
}
