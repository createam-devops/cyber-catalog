"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/auth";

/**
 * Restablecer la contraseña de una cuenta del catálogo (Firebase). Responde
 * igual exista o no el correo, para no revelar qué correos tienen cuenta.
 * Quien entra con su usuario de CyberPOS cambia la contraseña en el ERP.
 */
export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch {
      // Mismo mensaje si el correo no existe o tuvo un error: no se revela nada.
    }
    setState("sent");
  };

  return (
    <main className="min-h-screen bg-[#020408] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-2xl font-black mb-2">Recuperar contraseña</h1>
        {state === "sent" ? (
          <>
            <p className="text-gray-300 mb-6">
              Si <strong>{email.trim()}</strong> tiene una cuenta, te enviamos un enlace para crear una contraseña nueva.
              Revisa también la carpeta de spam.
            </p>
            <Link href="/registro" className="font-bold text-cyan-400 hover:text-cyan-300">
              Volver a iniciar sesión
            </Link>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-gray-400">Escribe el correo de tu cuenta del catálogo y te enviaremos un enlace.</p>
            <label className="block">
              <span className="block text-sm font-bold mb-1.5">Correo</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-cyan-500"
              />
            </label>
            <button
              type="submit"
              disabled={state === "sending"}
              className="w-full rounded-xl bg-cyan-500 px-8 py-3 font-black text-black hover:bg-cyan-400 disabled:opacity-50"
            >
              {state === "sending" ? "Enviando..." : "Enviar enlace"}
            </button>
            <p className="text-center text-sm text-gray-400">
              <Link href="/registro" className="text-cyan-400 hover:text-cyan-300">
                Volver
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
