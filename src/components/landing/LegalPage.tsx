import Image from "next/image";
import Link from "next/link";
import Analytics from "@/components/Analytics";
import { CONTACT, LINKS } from "./content";
import { bodyFont, displayFont } from "./fonts";

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
    <div
      className={`${displayFont.variable} ${bodyFont.variable} flex min-h-screen flex-col bg-[#F6F8FC] font-landing-body text-[17px] leading-[1.6] text-[#0B1B3A]`}
    >
      <Analytics />
      <header className="border-b border-[#DDE4F0] bg-white">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-x-3 px-5 py-3 sm:px-8 lg:px-10">
          <Link href="/" className="flex min-h-[44px] items-center gap-2 sm:gap-2.5">
            <Image
              src="/images/createam-cloud-logo.svg"
              alt=""
              width={54}
              height={35}
              className="h-[30px] w-[46px] object-contain sm:h-[35px] sm:w-[54px]"
            />
            <span className="font-heading text-xl sm:text-2xl">Createam</span>
          </Link>
          <Link href="/" className="flex min-h-[44px] items-center text-[15px] font-semibold text-[#1357AD] underline hover:text-[#0F3281]">
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[780px] flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <h1 className="font-landing-display text-[clamp(32px,4.4vw,48px)] font-extrabold leading-[1.08] tracking-[-0.015em]">
          {title}
        </h1>
        <p className="mt-2 text-[15px] text-[#5A6885]">Versión vigente: {version}</p>
        <div className="mt-9 flex flex-col gap-8 [&_a]:font-semibold [&_a]:text-[#1357AD] [&_a]:underline [&_h2]:mb-2 [&_h2]:font-landing-display [&_h2]:text-[22px] [&_h2]:font-bold [&_li]:text-[#3D4B66] [&_p+p]:mt-3 [&_p]:text-[#3D4B66] [&_strong]:font-semibold [&_strong]:text-[#0B1B3A] [&_ul]:mt-2 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-6">
          {children}
        </div>
      </main>

      <footer className="bg-[#0B1B3A] text-sm text-[#C9D6EE]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-x-7 gap-y-2 px-5 py-6 sm:px-8 lg:px-10">
          <span>© {new Date().getFullYear()} Createam · Lima, Perú</span>
          <div className="flex flex-wrap gap-x-6">
            <Link href="/terminos" className="flex min-h-[44px] items-center underline hover:text-white">
              Términos
            </Link>
            <Link href="/privacidad" className="flex min-h-[44px] items-center underline hover:text-white">
              Privacidad
            </Link>
            <a href={LINKS.email} className="flex min-h-[44px] items-center underline hover:text-white">
              {CONTACT.email}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
