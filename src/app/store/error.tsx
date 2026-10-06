'use client';

// Un fallo al cargar la tienda (la base de datos no respondió, una credencial
// venció) NO es "Tienda no encontrada": la tienda existe y va a volver. Decir
// que no existe manda al dueño a buscar un problema que no tiene.
export default function StoreError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-4xl font-bold mb-4">No pudimos cargar la tienda</h1>
        <p className="text-muted-foreground mb-8">
          El problema es nuestro, no de la tienda. Inténtalo de nuevo en unos minutos.
        </p>
        <button type="button" onClick={() => reset()} className="text-primary hover:underline">
          Reintentar
        </button>
      </div>
    </div>
  );
}
