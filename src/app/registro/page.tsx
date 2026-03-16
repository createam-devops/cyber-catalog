"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Store, 
  LogIn, 
  UserPlus, 
  Zap, 
  Menu, 
  X, 
  ExternalLink,
  Cpu,
  Send,
  Lightbulb,
  Cloud,
  Mail,
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

export default function RegistroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [verifyCode, setVerifyCode] = useState('');
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    phone: "",
    password: "",
    wantsDomain: false,
    customDomain: "",
  });
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Paso 1: enviar código al email
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/registro/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al procesar solicitud");
        return;
      }

      toast.success("Código enviado", {
        description: `Revisá tu correo: ${formData.email}`,
      });
      setStep('verify');
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al enviar el código. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: verificar código y crear cuenta
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.length !== 6) {
      toast.error("El código debe tener 6 dígitos");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: verifyCode, password: formData.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Código incorrecto");
        return;
      }

      toast.success("¡Cuenta activada!", {
        description: "Tu período de prueba gratuito ha comenzado.",
      });
      setTimeout(() => router.push('/login'), 1500);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al verificar. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Aquí iría la lógica de autenticación
      // Por ahora simulamos un login exitoso
      toast.success("¡Bienvenido de vuelta!", {
        description: "Redirigiendo a tu panel...",
      });

      setTimeout(() => {
        router.push("/tenant-admin");
      }, 1500);
    } catch (error) {
      console.error("Error logging in:", error);
      toast.error("Error al iniciar sesión", {
        description: "Verifica tus credenciales.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/5 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/10 blur-[130px] rounded-full"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#020408]/80 backdrop-blur-2xl border-b border-white/5 py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
            <div className="relative">
              <div className="w-14 h-14 flex items-center justify-center transform group-hover:scale-110 transition-all duration-500">
                <Image 
                  src="/images/createam-cloud-logo.svg" 
                  alt="Createam Logo" 
                  width={56} 
                  height={56}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black tracking-tight leading-none" style={{ fontFamily: '"Days One", sans-serif' }}>
                Createam
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center space-x-10 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ fontFamily: '"Days One", sans-serif' }}>
            <a href="/#on-turn" className="hover:text-cyan-400 transition-colors">Gestión de Turnos</a>
            <a href="/#catalogo" className="hover:text-cyan-400 transition-colors">Catálogo Digital</a>
            <a href="/#erp" className="hover:text-cyan-400 transition-colors">POS Integral</a>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-white">
            <Menu size={28} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-[#020408] flex flex-col items-center justify-center space-y-8 animate-fade-in lg:hidden" style={{ fontFamily: '"Days One", sans-serif' }}>
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-8 right-8 text-white">
            <X size={32} />
          </button>
          <a href="/#on-turn" onClick={() => setIsMenuOpen(false)} className="text-3xl font-black hover:text-cyan-400 transition-colors">Gestión de Turnos</a>
          <a href="/#catalogo" onClick={() => setIsMenuOpen(false)} className="text-3xl font-black hover:text-cyan-400 transition-colors">Catálogo Digital</a>
          <a href="/#erp" onClick={() => setIsMenuOpen(false)} className="text-3xl font-black hover:text-cyan-400 transition-colors">POS Integral</a>
        </div>
      )}

      {/* Main Content */}
      <main className="relative pt-28 pb-10 px-2 md:px-4">
        <div className="container mx-auto max-w-2xl relative z-10 px-0">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="text-center p-6 border-b border-white/10">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <Store className="h-6 w-6 text-cyan-400" />
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  {isLogin ? "Administrar Catálogo" : "Crear Catálogo Digital"}
                </h1>
              </div>
              <p className="text-gray-400 text-sm">
                {isLogin 
                  ? "Ingresa con tus credenciales para gestionar tu catálogo" 
                  : step === 'form'
                    ? "Completa el formulario y activa tu catálogo digital al instante"
                    : "Ingresa el código que enviamos a tu correo"
                }
              </p>
            </div>

            <div className="p-6">
              {/* Tabs para alternar entre Registro y Login */}
              <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl border border-white/5">
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    !isLogin 
                      ? "bg-cyan-500 text-black shadow-lg" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  Crear Catálogo
                </button>
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    isLogin 
                      ? "bg-cyan-500 text-black shadow-lg" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <LogIn className="h-4 w-4" />
                  Administrar
                </button>
              </div>

              {/* Formulario de Login */}
              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-white">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center justify-end text-sm">
                    <Link href="/recuperar-password" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full px-8 py-3 bg-cyan-500 text-black rounded-xl font-black hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Ingresando..." : "Iniciar Sesión"}
                    </button>
                  </div>

                  <p className="text-center text-sm text-gray-400">
                    ¿Aún no tienes catálogo?{" "}
                    <button
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                    >
                      Créalo aquí
                    </button>
                  </p>
                </form>
              ) : (
                /* Formulario de Registro */
                step === 'verify' ? (
                  /* Paso 2: Verificar código */
                  <form onSubmit={handleVerify} className="space-y-6">
                    <button
                      type="button"
                      onClick={() => { setStep('form'); setVerifyCode(''); }}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft size={16} />
                      Volver
                    </button>

                    <div className="text-center py-2">
                      <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Mail className="h-7 w-7 text-cyan-400" />
                      </div>
                      <p className="text-white font-bold">Revisa tu correo</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Enviamos un código de 6 dígitos a<br />
                        <span className="text-cyan-400 font-semibold">{formData.email}</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code" className="text-white">Código de verificación</Label>
                      <Input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        placeholder="123456"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        autoFocus
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500 text-center text-2xl tracking-[0.5em] font-bold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || verifyCode.length !== 6}
                      className="w-full px-8 py-3 bg-cyan-500 text-black rounded-xl font-black hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        "Verificando..."
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          Verificar y Activar Catálogo
                        </>
                      )}
                    </button>

                    <p className="text-center text-sm text-gray-500">
                      ¿No llegó el correo?{" "}
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => { setStep('form'); setVerifyCode(''); }}
                        className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors disabled:opacity-50"
                      >
                        Reenviar código
                      </button>
                    </p>
                  </form>
                ) : (
                  /* Paso 1: Formulario */
                  <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-white">Nombre del Negocio *</Label>
                  <Input
                    id="businessName"
                    placeholder="Ej: Dulce Tentación, Mi Boutique"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email de Contacto *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contacto@minegocio.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">WhatsApp (con código de país) *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+51999999999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-500">
                    Incluye el código de país. Ej: +51 para Perú
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regPassword" className="text-white">Contraseña *</Label>
                  <Input
                    id="regPassword"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-500">
                    Usarás esta contraseña para ingresar a tu panel
                  </p>
                </div>

                <div className="space-y-4 p-4 border border-white/10 rounded-xl bg-white/5">
                  <Label className="text-base text-white">Tipo de Dominio</Label>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="domainType"
                        checked={!formData.wantsDomain}
                        onChange={() => setFormData({ ...formData, wantsDomain: false, customDomain: "" })}
                        className="mt-1 accent-cyan-500"
                      />
                      <div>
                        <div className="font-medium text-white">Subdominio gratuito</div>
                        <div className="text-sm text-gray-400">
                          Tu catálogo estará en: minegocio.createam.cloud
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="domainType"
                        checked={formData.wantsDomain}
                        onChange={() => setFormData({ ...formData, wantsDomain: true })}
                        className="mt-1 accent-cyan-500"
                      />
                      <div>
                        <div className="font-medium text-white">Dominio personalizado</div>
                        <div className="text-sm text-gray-400">
                          Usa tu propio dominio (ej: minegocio.com)
                        </div>
                      </div>
                    </label>
                  </div>

                  {formData.wantsDomain && (
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="customDomain" className="text-white">Tu Dominio</Label>
                      <Input
                        id="customDomain"
                        placeholder="minegocio.com"
                        value={formData.customDomain}
                        onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500"
                      />
                      <p className="text-xs text-gray-500">
                        Te ayudaremos con la configuración DNS
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full px-8 py-3 bg-cyan-500 text-black rounded-xl font-black hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base"
                  >
                    <Send className="h-5 w-5" />
                    {loading ? "Enviando código..." : "Continuar →"}
                  </button>
                </div>

                <p className="text-center text-sm text-gray-400">
                  ¿Ya tienes tu catálogo?{" "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                  >
                    Administra aquí
                  </button>
                </p>

                <p className="text-center text-xs text-gray-500">
                  Verificaremos tu email para activar tu catálogo gratis por 30 días
                </p>
              </form>
                )
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pt-20 pb-16 relative">
        <div className="container mx-auto px-6">
          <div className="mt-12 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] gap-8">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Sistemas Operativos en la Nube
            </div>
            <div>© 2024 CREATEAM.CLOUD // Ecosistema SaaS Modular</div>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
