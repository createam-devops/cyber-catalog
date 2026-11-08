import Link from "next/link";
import SwipeRow from "@/components/landing/SwipeRow";
import { MODULE_GROUPS } from "./data/modules";
import { IconTile } from "./brand";
import { Reveal } from "./motion";

/**
 * Todos los módulos del ERP, agrupados. Los que tienen página propia van
 * con enlace. En celular, una fila de grupos que se desliza de lado.
 */
export default function ModuleCatalog() {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm text-site-text-faint md:hidden">Desliza para ver más</p>
      <SwipeRow label="Módulos del ERP" className="md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {MODULE_GROUPS.map(({ title, icon: Icon, modules }, index) => (
          <Reveal
            key={title}
            delay={(index % 3) * 0.07}
            className="flex shrink-0 basis-[86%] snap-start flex-col gap-3 rounded-[20px] border border-site-line bg-white p-6 sm:basis-[48%] md:basis-auto"
          >
            <div className="flex items-center gap-3">
              <IconTile accent="cyberpos" variant="solid" icon={Icon} />
              <h3 className="font-landing-body text-lg font-bold leading-tight">{title}</h3>
            </div>
            <ul className="flex flex-col gap-2.5">
              {modules.map((m) => (
                <li key={m.name} className="text-[15px] leading-snug">
                  {m.page || m.href ? (
                    <Link href={m.page ? `/erp/${m.page}` : m.href!} className="font-bold text-site-ink underline-offset-2 hover:underline">
                      {m.name} →
                    </Link>
                  ) : (
                    <span className="font-bold">{m.name}</span>
                  )}
                  <span className="text-site-text-muted"> · {m.text}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </SwipeRow>
    </div>
  );
}
