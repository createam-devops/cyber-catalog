import Link from "next/link";
import NotFoundEvent from "@/components/NotFoundEvent";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Registra la dirección rota en Analytics (solo en createam.cloud) */}
      <NotFoundEvent />
      <div className="text-center space-y-6 px-4">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <h2 className="text-3xl font-semibold">Página no encontrada</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button size="lg">Volver al Inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
