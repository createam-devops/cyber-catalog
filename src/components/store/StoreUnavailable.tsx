import type { StorefrontAvailability } from '@/lib/server/storefront-data';

/**
 * Lo que ve un visitante cuando la vitrina no está abierta. "En pausa" (prueba
 * vencida, suspendida) no es "no existe": la tienda existe y puede volver.
 */
export default function StoreUnavailable({ reason, storeName }: { reason: Exclude<StorefrontAvailability, 'open'>; storeName?: string }) {
  const paused = reason === 'paused';
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{paused ? `${storeName ?? 'Esta tienda'} está en pausa` : 'Tienda no encontrada'}</h1>
        <p className="text-muted-foreground mb-8">
          {paused
            ? 'Por ahora no está recibiendo pedidos por aquí. Vuelve pronto o escríbele por sus redes.'
            : 'Esta dirección no corresponde a ninguna tienda.'}
        </p>
        <a href="https://createam.cloud" className="text-primary hover:underline">
          Crea tu catálogo con Createam
        </a>
      </div>
    </main>
  );
}
