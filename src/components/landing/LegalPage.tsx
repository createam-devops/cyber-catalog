import SiteShell from "@/components/site/SiteShell";

// Marco común de Términos y Privacidad. Los estilos de h2, p, ul y a se aplican
// desde aquí para que cada página solo escriba su contenido.
export default function LegalPage({
  title,
  version,
  children,
}: {
  title: string;
  version: string;
  children: React.ReactNode;
}) {
  return (
    <SiteShell contactBand={false}>
      <div className="mx-auto w-full max-w-[780px] px-5 py-12 leading-[1.6] sm:px-8 sm:py-16">
        <h1 className="font-landing-display text-[clamp(32px,4.4vw,48px)] font-bold leading-[1.08] tracking-[-0.01em]">
          {title}
        </h1>
        <p className="mt-2 text-[15px] text-site-text-faint">Versión vigente: {version}</p>
        <div className="mt-9 flex flex-col gap-8 [&_a]:font-semibold [&_a]:text-site-ink [&_a]:underline [&_h2]:mb-2 [&_h2]:font-landing-display [&_h2]:text-[22px] [&_h2]:font-bold [&_li]:text-site-text-muted [&_p+p]:mt-3 [&_p]:text-site-text-muted [&_strong]:font-semibold [&_strong]:text-site-ink [&_ul]:mt-2 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-6">
          {children}
        </div>
      </div>
    </SiteShell>
  );
}
