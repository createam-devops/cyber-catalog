"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { ExternalLink, Loader2, PackageCheck } from 'lucide-react';
import { tenantApiFetch } from '@/lib/tenant-api';
import type { TenantConfig } from '@/lib/types';

/**
 * Productos y categorías de una tienda conectada al ERP se administran en
 * CyberPOS: el ERP todavía no tiene la escritura desde el catálogo (su
 * Bloque 2). Para las demás tiendas muestra la pantalla de siempre.
 */
export default function ErpCatalogGate({ what, children }: { what: 'productos' | 'categorías'; children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'erp' | 'local'>('loading');
  const [appUrl, setAppUrl] = useState<string | null>(null);

  useEffect(() => {
    tenantApiFetch<{ tenant: TenantConfig }>('/api/tenant-admin/settings')
      .then(({ tenant }) => setState(tenant.erp?.partnerId ? 'erp' : 'local'))
      .catch(() => setState('local'));
    fetch('/api/auth/erp/login')
      .then((res) => res.json())
      .then((data: { appUrl?: string | null }) => setAppUrl(data.appUrl ?? null))
      .catch(() => {});
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }
  if (state === 'local') return <>{children}</>;

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10">
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 text-center">
        <PackageCheck className="mx-auto mb-4 text-gray-900" size={40} />
        <h1 className="text-2xl font-black text-gray-900 mb-2">Tus {what} se administran en CyberPOS</h1>
        <p className="text-gray-500 mb-6">
          Tu tienda muestra los productos que publicas en CyberPOS: en el producto, sección «Venta online», bloque
          «Catálogo», marca <strong>Publicar</strong>. Los cambios se ven en tu tienda en menos de un minuto.
        </p>
        {appUrl && (
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 font-bold text-white hover:bg-black"
          >
            Abrir CyberPOS <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  );
}
