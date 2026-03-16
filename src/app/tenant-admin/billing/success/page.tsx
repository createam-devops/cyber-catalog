"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function BillingSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push('/tenant-admin'), 4000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6">
      <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-gray-100 text-center max-w-sm w-full space-y-4">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">¡Pago exitoso!</h2>
        <p className="text-gray-500 text-sm">Tu plan ha sido activado. Serás redirigido al dashboard en unos segundos.</p>
        <button
          onClick={() => router.push('/tenant-admin')}
          className="mt-2 text-sm font-bold text-gray-500 hover:text-gray-800 underline"
        >
          Ir al Dashboard
        </button>
      </div>
    </div>
  );
}
