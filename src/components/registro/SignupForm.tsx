"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

/**
 * Registro de un negocio nuevo: sus datos, el código que llega al correo y el
 * alta en CyberPOS (lo hace el servidor). Al terminar, el dueño entra a CyberPOS
 * con su correo y crea su tienda desde «Crea tu tienda online».
 */

const PASSWORD_OK = (pw: string) => pw.length >= 8 && /\p{Lu}/u.test(pw) && /\p{Ll}/u.test(pw) && /\p{N}/u.test(pw);

const input =
  "w-full min-h-[48px] rounded-xl border-[1.5px] border-[#C5D0E3] bg-white px-4 text-[16px] text-[#0B1B3A] placeholder:text-[#8A97B1] focus:border-[#A21CAF] focus:outline-none focus:ring-2 focus:ring-[#A21CAF]/20";
const label = "mb-1.5 block text-[15px] font-semibold";
const primary =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#A21CAF] px-6 text-[17px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

type Step = "datos" | "codigo" | "listo";

export default function SignupForm({ passwordRule, loginBase }: { passwordRule: string; loginBase: string | null }) {
  const [step, setStep] = useState<Step>("datos");
  const [form, setForm] = useState({ businessName: "", ownerName: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ text: string; loginUrl?: string | null } | null>(null);
  const [loginUrl, setLoginUrl] = useState<string | null>(null);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value });

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!PASSWORD_OK(form.password)) {
      setError({ text: passwordRule });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/registro/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ text: data.error || "No pudimos enviarte el código. Inténtalo de nuevo." });
        return;
      }
      setCode("");
      setStep("codigo");
    } catch {
      setError({ text: "No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError({ text: "El código tiene 6 números." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code, password: form.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ text: data.error || "No pudimos crear tu cuenta. Inténtalo de nuevo.", loginUrl: data.loginUrl });
        return;
      }
      trackEvent("sign_up", { method: "email" });
      setLoginUrl(data.loginUrl ?? null);
      setStep("listo");
      if (data.loginUrl) setTimeout(() => window.location.assign(data.loginUrl), 4000);
    } catch {
      setError({ text: "No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  const errorBox = error && (
    <div role="alert" className="rounded-xl border border-[#F3C4C4] bg-[#FDF0F0] px-4 py-3 text-[15px] text-[#8A1C1C]">
      <p>{error.text}</p>
      {error.loginUrl && (
        <a href={error.loginUrl} className="mt-2 inline-flex min-h-[44px] items-center font-bold text-[#7A1485] underline">
          Entrar a CyberPOS
        </a>
      )}
    </div>
  );

  if (step === "listo") {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center" aria-live="polite">
        <CheckCircle2 className="h-14 w-14 text-[#15803D]" aria-hidden />
        <h2 className="font-landing-display text-2xl font-extrabold">¡Tu cuenta está lista!</h2>
        <p className="text-[#3D4B66]">
          Entra a CyberPOS con tu correo y tu contraseña. Ahí eliges tu rubro y tu tienda queda en línea.
        </p>
        {loginUrl && (
          <a href={loginUrl} className={primary}>
            Entrar a CyberPOS <ArrowRight className="h-5 w-5" aria-hidden />
          </a>
        )}
        <p className="text-sm text-[#5A6885]">Te llevamos en unos segundos.</p>
      </div>
    );
  }

  if (step === "codigo") {
    return (
      <form onSubmit={verify} className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <MailCheck className="mt-0.5 h-6 w-6 flex-none text-[#A21CAF]" aria-hidden />
          <p className="text-[#3D4B66]">
            Te enviamos un código de 6 números a <strong className="text-[#0B1B3A]">{form.email}</strong>. Vence en 15 minutos.
          </p>
        </div>
        <div>
          <label htmlFor="codigo" className={label}>
            Código
          </label>
          <input
            id="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={`${input} text-center font-mono text-2xl tracking-[0.5em]`}
            placeholder="000000"
            autoFocus
          />
        </div>
        {errorBox}
        <button type="submit" className={primary} disabled={loading || code.length !== 6}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
          {loading ? "Creando tu cuenta…" : "Crear mi cuenta"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("datos");
            setError(null);
          }}
          className="min-h-[44px] text-[15px] font-semibold text-[#1357AD] underline"
        >
          Corregir mis datos o pedir otro código
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="flex flex-col gap-4">
      <div>
        <label htmlFor="businessName" className={label}>
          Nombre de tu negocio
        </label>
        <input id="businessName" className={input} value={form.businessName} onChange={set("businessName")} placeholder="Ej.: Dulce Tentación" autoComplete="organization" required maxLength={60} />
      </div>
      <div>
        <label htmlFor="ownerName" className={label}>
          Tu nombre
        </label>
        <input id="ownerName" className={input} value={form.ownerName} onChange={set("ownerName")} placeholder="Ej.: María Quispe" autoComplete="name" required maxLength={80} />
      </div>
      <div>
        <label htmlFor="email" className={label}>
          Correo
        </label>
        <input id="email" type="email" className={input} value={form.email} onChange={set("email")} placeholder="tu@correo.com" autoComplete="email" required />
      </div>
      <div>
        <label htmlFor="phone" className={label}>
          WhatsApp para pedidos
        </label>
        <input id="phone" type="tel" inputMode="tel" className={input} value={form.phone} onChange={set("phone")} placeholder="987 654 321" autoComplete="tel" required />
      </div>
      <div>
        <label htmlFor="password" className={label}>
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className={`${input} pr-12`}
            value={form.password}
            onChange={set("password")}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            aria-describedby="password-regla"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[#5A6885]"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
          </button>
        </div>
        <p id="password-regla" className="mt-1.5 text-sm text-[#5A6885]">
          {passwordRule} Con ella entrarás a CyberPOS.
        </p>
      </div>
      {errorBox}
      <button type="submit" className={primary} disabled={loading}>
        {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
        {loading ? "Enviando el código…" : "Crear mi catálogo gratis"}
      </button>
      {loginBase && (
        <p className="text-center text-[15px] text-[#3D4B66]">
          ¿Ya tienes cuenta?{" "}
          <a href={loginBase} className="font-bold text-[#7A1485] underline">
            Entra a CyberPOS
          </a>
        </p>
      )}
    </form>
  );
}
