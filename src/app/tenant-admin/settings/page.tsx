"use client";

import { useState, useEffect } from 'react';
import { auth } from '@/lib/auth';
import { TenantConfig } from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Upload, Save, Palette, Globe, Hash, MessageCircle, Instagram, Facebook, Music2, Loader2, Image as ImageIcon, Plus, Trash2, X, Info } from 'lucide-react';
import { initTenantFirebase } from '@/lib/firebase';
import { uploadLogoImage, uploadBannerImage } from '@/lib/products';

async function tenantApiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken(true);

  if (!token) {
    throw new Error('No hay sesión activa');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || 'Error en API tenant-admin');
  }

  return payload as T;
}

function SettingsContent() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [domainType, setDomainType] = useState<'custom' | 'subdomain'>('subdomain');
  const [domain, setDomain] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [logo, setLogo] = useState('');
  // Valores originales para restaurar al cambiar de tipo
  const [originalCustomDomain, setOriginalCustomDomain] = useState('');
  const [originalSubdomain, setOriginalSubdomain] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#E11D48');
  const [secondaryColor, setSecondaryColor] = useState('#F43F5E');
  const [accentColor, setAccentColor] = useState('#FB7185');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [heroSlides, setHeroSlides] = useState<Array<{
    id: string;
    image: string;
    title: string;
    subtitle: string;
    buttonText: string;
    order?: number;
  }>>([]);

  useEffect(() => {
    const loadTenant = async () => {
      if (!user?.tenantId) {
        setError('No se encontró el tenant del usuario');
        setLoadingTenant(false);
        return;
      }

      try {
        const data = await tenantApiFetch<{ tenant: TenantConfig }>('/api/tenant-admin/settings');
        const tenantData = data.tenant;

        if (!tenantData) {
          setError(`No se encontró el tenant: ${user.tenantId}`);
          setLoadingTenant(false);
          return;
        }

        console.log('Tenant encontrado:', tenantData);
        
        setTenant(tenantData);
        setName(tenantData.name || '');
        
        // Determinar tipo de dominio
        const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
        const hasCustomDomain = tenantData.domain && !tenantData.domain.endsWith(`.${platformDomain}`);
        
        if (hasCustomDomain) {
          // Dominio personalizado
          setDomainType('custom');
          const customDomain = tenantData.domain || '';
          setDomain(customDomain);
          setOriginalCustomDomain(customDomain);
          setSubdomain('');
          setOriginalSubdomain('');
        } else {
          // Subdominio
          setDomainType('subdomain');
          let subdomainName = tenantData.subdomain || '';
          // Si tiene domain pero es subdominio, extraer el nombre
          if (tenantData.domain && tenantData.domain.endsWith(`.${platformDomain}`)) {
            subdomainName = tenantData.domain.replace(`.${platformDomain}`, '');
          }
          setSubdomain(subdomainName);
          setOriginalSubdomain(subdomainName);
          setDomain(subdomainName ? `${subdomainName}.${platformDomain}` : '');
          setOriginalCustomDomain('');
        }
        
        setLogo(tenantData.logo || '');
        setPrimaryColor(tenantData.colors?.primary || tenantData.primaryColor || '#E11D48');
        setSecondaryColor(tenantData.colors?.secondary || '#F43F5E');
        setAccentColor(tenantData.colors?.accent || '#FB7185');
        setWhatsapp(tenantData.whatsapp || '');
        setInstagram(tenantData.socialMedia?.instagram || '');
        setFacebook(tenantData.socialMedia?.facebook || '');
        setTiktok(tenantData.socialMedia?.tiktok || '');
        setSeoTitle(tenantData.seoTitle || '');
        setSeoDescription(tenantData.seoDescription || '');
        setHeroSlides(tenantData.heroSlides || []);
        setError(null);
      } catch (err: any) {
        console.error('Error al cargar tenant:', err);
        setError(err.message || 'Error al cargar el tenant');
      } finally {
        setLoadingTenant(false);
      }
    };

    loadTenant();
  }, [user]);

  const handleSave = async () => {
    if (!tenant || !user?.tenantId) {
      toast.error('No hay tenant para guardar');
      return;
    }

    setLoading(true);
    try {
      const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
      
      // Preparar datos según el tipo de dominio
      const updateData: any = {
        name,
        logo,
        primaryColor,
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
        },
        whatsapp,
        socialMedia: {
          instagram,
          facebook,
          tiktok,
        },
        heroSlides: heroSlides.map((slide, index) => ({
          ...slide,
          order: index,
        })),
        seoTitle,
        seoDescription,
        updatedAt: new Date().toISOString(),
      };
      
      // Configurar dominio según el tipo
      if (domainType === 'custom') {
        updateData.domain = domain;
        updateData.subdomain = null;
      } else {
        // Subdominio
        updateData.subdomain = subdomain;
        updateData.domain = subdomain ? `${subdomain}.${platformDomain}` : null;
      }

      await tenantApiFetch<{ ok: boolean }>('/api/tenant-admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      toast.success('Configuración guardada exitosamente');
      
      // Actualizar el estado local
      const updatedDomain = domainType === 'custom' ? domain : (subdomain ? `${subdomain}.${platformDomain}` : '');
      setTenant({
        ...tenant,
        name,
        domain: updatedDomain,
        subdomain: domainType === 'subdomain' ? subdomain : undefined,
        logo,
        primaryColor,
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
        },
        whatsapp,
        socialMedia: { instagram, facebook, tiktok },
        heroSlides,
      });
    } catch (err: any) {
      console.error('Error al guardar:', err);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  if (loadingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-semibold">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] p-6">
        <div className="bg-white rounded-[2rem] p-8 max-w-md text-center shadow-xl">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cargar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configurar Branding</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Personaliza la identidad de tu tienda.</p>
          {user && (
            <div className="mt-4 flex items-center gap-2 text-xs flex-wrap">
              <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full font-bold">
                {user.email}
              </div>
              <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-bold">
                Tenant: {user.tenantId}
              </div>
            </div>
          )}
        </div>

        {/* Información Básica */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
              <Globe size={20} className="text-rose-600" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Información Básica</h2>
              <p className="text-sm text-gray-500">Nombre y dominio de tu tienda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Nombre de la Tienda (Solo lectura)</label>
              <input
                type="text"
                value={name}
                disabled
                className="w-full bg-gray-100 rounded-2xl px-5 py-3.5 font-semibold text-gray-500 outline-none cursor-not-allowed"
                placeholder="Ej: Bella Sorpresa"
              />
              <p className="text-xs text-gray-400 ml-1">El nombre de la tienda no se puede modificar desde aquí</p>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Logo</label>
              
              {/* Recomendaciones */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    <p className="font-bold mb-1">Recomendaciones:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Tamaño: 200x200px a 400x400px (cuadrado)</li>
                      <li>Formato: PNG con fondo transparente o JPG</li>
                      <li>Peso máximo: 500KB</li>
                      <li>Resolución: 72-150 DPI</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Opción de subir archivo */}
              <div className="mb-3">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-rose-300 transition-colors bg-white">
                  {uploadingLogo ? (
                    <Loader2 size={24} className="text-gray-400 mb-2 animate-spin" />
                  ) : (
                    <Upload size={24} className="text-gray-400 mb-2" />
                  )}
                  <span className="text-sm text-gray-600 font-medium">
                    {uploadingLogo ? 'Subiendo...' : 'Subir Logo'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !tenant) return;
                      
                      setUploadingLogo(true);
                      try {
                        const { storage } = initTenantFirebase(tenant.id, tenant.firebaseConfig);
                        const url = await uploadLogoImage(storage, tenant.id, file);
                        setLogo(url);
                        toast.success('Logo subido exitosamente');
                      } catch (error) {
                        console.error('Error uploading logo:', error);
                        toast.error('Error al subir el logo');
                      } finally {
                        setUploadingLogo(false);
                      }
                    }}
                    disabled={uploadingLogo}
                  />
                </label>
              </div>

              {/* Opción de URL */}
              <div className="relative">
                <input
                  type="url"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full bg-gray-50 rounded-2xl pl-10 pr-5 py-3.5 font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                  placeholder="O ingresa una URL del logo"
                />
                <ImageIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              
              {logo && (
                <div className="mt-2">
                  <img src={logo} alt="Logo preview" className="h-16 w-auto object-contain rounded-lg border border-gray-200" onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }} />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Tipo de Dominio</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDomainType('subdomain');
                    // Restaurar subdominio original o dejar vacío
                    setSubdomain(originalSubdomain);
                    // Actualizar domain con el subdominio completo
                    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
                    setDomain(originalSubdomain ? `${originalSubdomain}.${platformDomain}` : '');
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    domainType === 'subdomain'
                      ? 'bg-black text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Subdominio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDomainType('custom');
                    // Restaurar dominio personalizado original o dejar vacío
                    setDomain(originalCustomDomain);
                    // Limpiar subdominio
                    setSubdomain('');
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    domainType === 'custom'
                      ? 'bg-black text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Dominio Personalizado
                </button>
              </div>
            </div>

            {domainType === 'subdomain' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Nombre del Subdominio</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={subdomain}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                        setSubdomain(value);
                        const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
                        setDomain(value ? `${value}.${platformDomain}` : '');
                      }}
                      className="w-full bg-gray-50 rounded-2xl pl-10 pr-5 py-3.5 font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                      placeholder="mitienda"
                    />
                    <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">URL Completa (Solo lectura)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={domain}
                      disabled
                      className="w-full bg-gray-100 rounded-2xl pl-10 pr-5 py-3.5 font-semibold text-gray-500 outline-none cursor-not-allowed"
                      placeholder="mitienda.createam.cloud"
                    />
                    <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-400 ml-1">La URL completa se genera automáticamente</p>
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Dominio Personalizado</label>
                <div className="relative">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full bg-gray-50 rounded-2xl pl-10 pr-5 py-3.5 font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                    placeholder="mitienda.com"
                  />
                  <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <p className="text-xs text-gray-400 ml-1">Ingresa tu dominio completo (ej: mitienda.com)</p>
              </div>
            )}
          </div>
        </div>

        {/* Colores */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Palette size={20} className="text-purple-600" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Colores de la Marca</h2>
              <p className="text-sm text-gray-500">Define la paleta de colores de tu tienda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Color Primario */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600">Color Primario</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-16 rounded-xl cursor-pointer border-2 border-gray-200 shadow-sm"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 bg-gray-50 rounded-xl px-3 py-2 font-mono text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-purple-500/20"
                  placeholder="#E11D48"
                />
              </div>
            </div>

            {/* Color Secundario */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600">Color Secundario</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-16 h-16 rounded-xl cursor-pointer border-2 border-gray-200 shadow-sm"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 bg-gray-50 rounded-xl px-3 py-2 font-mono text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-purple-500/20"
                  placeholder="#F43F5E"
                />
              </div>
            </div>

            {/* Color Acento */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600">Color Acento</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-16 h-16 rounded-xl cursor-pointer border-2 border-gray-200 shadow-sm"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 bg-gray-50 rounded-xl px-3 py-2 font-mono text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-purple-500/20"
                  placeholder="#FB7185"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <MessageCircle size={20} className="text-blue-600" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Contacto y Redes Sociales</h2>
              <p className="text-sm text-gray-500">Enlaces a tus canales de comunicación</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">WhatsApp</label>
              <div className="relative">
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-green-50 rounded-2xl pl-10 pr-5 py-3.5 font-semibold text-green-900 outline-none focus:ring-2 focus:ring-green-500/20 transition-all placeholder-green-300"
                  placeholder="51999999999"
                />
                <MessageCircle size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Instagram</label>
              <div className="relative">
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full bg-pink-50 rounded-2xl pl-10 pr-5 py-3.5 font-semibold text-pink-900 outline-none focus:ring-2 focus:ring-pink-500/20 transition-all placeholder-pink-300"
                  placeholder="https://instagram.com/..."
                />
                <Instagram size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-600" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Facebook</label>
              <div className="relative">
                <input
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full bg-blue-50 rounded-2xl pl-10 pr-5 py-3.5 font-semibold text-blue-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-blue-300"
                  placeholder="https://facebook.com/..."
                />
                <Facebook size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">TikTok</label>
              <div className="relative">
                <input
                  type="url"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="w-full bg-gray-50 rounded-2xl pl-10 pr-5 py-3.5 font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-gray-500/20 transition-all placeholder-gray-300"
                  placeholder="https://tiktok.com/@..."
                />
                <Music2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Hero Slides */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <ImageIcon size={20} className="text-orange-600" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Banners del Carrusel</h2>
                <p className="text-sm text-gray-500">Configura las imágenes del carrusel principal</p>
              </div>
            </div>
          </div>

          {/* Recomendaciones para banners */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-orange-800">
                <p className="font-bold mb-1">Recomendaciones para Banners:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Tamaño: 1920x800px (16:7) o 1920x600px (16:5)</li>
                  <li>Formato: JPG o PNG</li>
                  <li>Peso máximo: 1MB por imagen</li>
                  <li>Resolución: 72-150 DPI</li>
                  <li>Mantén el texto importante en el centro (zona segura)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end mb-4">
            <button
              onClick={() => {
                const newSlide = {
                  id: Date.now().toString(),
                  image: '',
                  title: '',
                  subtitle: '',
                  buttonText: 'Ver Más',
                  order: heroSlides.length,
                };
                setHeroSlides([...heroSlides, newSlide]);
              }}
              className="px-4 py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              Agregar Slide
            </button>
          </div>

          <div className="space-y-4">
            {heroSlides.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay slides configurados. Agrega uno para comenzar.</p>
              </div>
            ) : (
              heroSlides.map((slide, index) => (
                <div key={slide.id} className="border-2 border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Slide {index + 1}</h3>
                    <button
                      onClick={() => setHeroSlides(heroSlides.filter(s => s.id !== slide.id))}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600">Imagen del Banner</label>
                      
                      {/* Opción de subir archivo */}
                      <div className="mb-2">
                        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-orange-300 transition-colors bg-white">
                          {uploadingBanner[slide.id] ? (
                            <Loader2 size={20} className="text-gray-400 mb-1 animate-spin" />
                          ) : (
                            <Upload size={20} className="text-gray-400 mb-1" />
                          )}
                          <span className="text-xs text-gray-600 font-medium">
                            {uploadingBanner[slide.id] ? 'Subiendo...' : 'Subir Imagen'}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file || !tenant) return;
                              
                              setUploadingBanner({ ...uploadingBanner, [slide.id]: true });
                              try {
                                const { storage } = initTenantFirebase(tenant.id, tenant.firebaseConfig);
                                const url = await uploadBannerImage(storage, tenant.id, file);
                                const updated = [...heroSlides];
                                updated[index].image = url;
                                setHeroSlides(updated);
                                toast.success('Imagen subida exitosamente');
                              } catch (error) {
                                console.error('Error uploading banner:', error);
                                toast.error('Error al subir la imagen');
                              } finally {
                                setUploadingBanner({ ...uploadingBanner, [slide.id]: false });
                              }
                            }}
                            disabled={uploadingBanner[slide.id]}
                          />
                        </label>
                      </div>

                      {/* Opción de URL */}
                      <input
                        type="url"
                        value={slide.image}
                        onChange={(e) => {
                          const updated = [...heroSlides];
                          updated[index].image = e.target.value;
                          setHeroSlides(updated);
                        }}
                        className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20"
                        placeholder="O ingresa una URL de la imagen"
                      />
                      {slide.image && (
                        <div className="mt-2">
                          <img src={slide.image} alt={`Slide ${index + 1}`} className="h-32 w-full object-cover rounded-lg border border-gray-200" onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }} />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600">Título</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => {
                          const updated = [...heroSlides];
                          updated[index].title = e.target.value;
                          setHeroSlides(updated);
                        }}
                        className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20"
                        placeholder="Ej: REGALA EMOCIONES"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600">Subtítulo</label>
                      <input
                        type="text"
                        value={slide.subtitle}
                        onChange={(e) => {
                          const updated = [...heroSlides];
                          updated[index].subtitle = e.target.value;
                          setHeroSlides(updated);
                        }}
                        className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20"
                        placeholder="Ej: Nueva Colección 2025"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600">Texto del Botón</label>
                      <input
                        type="text"
                        value={slide.buttonText}
                        onChange={(e) => {
                          const updated = [...heroSlides];
                          updated[index].buttonText = e.target.value;
                          setHeroSlides(updated);
                        }}
                        className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20"
                        placeholder="Ej: Ver Más"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SEO - Solo plan Pro */}
        {tenant && (tenant as TenantConfig & { plan?: string }).plan === 'pro' && (
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Hash size={20} className="text-purple-600" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">SEO <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full align-middle">Pro</span></h2>
                <p className="text-sm text-gray-500">Optimiza cómo aparece tu tienda en Google</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Título SEO</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  maxLength={60}
                  className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="Mi Tienda | Los mejores productos"
                />
                <p className="text-xs text-gray-400 ml-1">{seoTitle.length}/60 caracteres</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Descripción SEO</label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  maxLength={160}
                  rows={3}
                  className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                  placeholder="Descripción breve de tu tienda para aparecer en resultados de búsqueda..."
                />
                <p className="text-xs text-gray-400 ml-1">{seoDescription.length}/160 caracteres</p>
              </div>
            </div>
          </div>
        )}

        {/* Botón Guardar */}
        <div className="sticky bottom-6 z-20">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-black text-white font-bold py-4 rounded-2xl shadow-2xl shadow-gray-400/50 hover:scale-[1.01] active:scale-[0.99] transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={22} />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
