"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { auth } from "@/lib/auth";
import { initTenantFirebase } from "@/lib/firebase";
import { uploadProductImage } from "@/lib/products";
import { Category, TenantConfig } from "@/lib/types";
import { toast } from "sonner";

interface ApiError extends Error {
  limitReached?: boolean;
}

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
    const err: ApiError = new Error(payload?.error || 'Error en API tenant-admin');
    err.limitReached = payload?.limitReached ?? false;
    throw err;
  }

  return payload as T;
}

function NewProductContent() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    featured: false,
    stock: "",
  });

  useEffect(() => {
    if (user?.tenantId) {
      loadTenantAndCategories();
    }
  }, [user]);

  async function loadTenantAndCategories() {
    try {
      const settings = await tenantApiFetch<{ tenant: TenantConfig }>('/api/tenant-admin/settings');
      const tenantData = settings.tenant;
      setTenant(tenantData);
      
      const categoriesResponse = await tenantApiFetch<{ categories: Category[] }>('/api/tenant-admin/categories');
      const cats = categoriesResponse.categories || [];
      
      setCategories(cats);
    } catch (error) {
      console.error("Error loading tenant/categories:", error);
      toast.error('Error al cargar configuración del tenant');
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setImages(prev => [...prev, ...files]);
    
    // Crear previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!tenant) throw new Error("Tenant not found");
      
      const { storage } = initTenantFirebase(tenant.id, tenant.firebaseConfig);
      
      // Subir imágenes
      const imageUrls: string[] = [];
      for (const image of images) {
        const url = await uploadProductImage(storage, tenant.id, image);
        imageUrls.push(url);
      }
      
      // Crear producto
      await tenantApiFetch<{ ok: boolean; id: string }>('/api/tenant-admin/products', {
        method: 'POST',
        body: JSON.stringify({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        imageUrls,
        featured: formData.featured,
        stock: formData.stock !== '' ? parseInt(formData.stock) : null,
        }),
      });
      
      toast.success("Producto creado exitosamente");
      router.push('/tenant-admin/products');
    } catch (error) {
      const err = error as ApiError;
      if (err.limitReached) {
        toast.error(err.message, {
          description: 'Actualiza tu plan para crear productos ilimitados.',
          action: { label: 'Ver planes', onClick: () => router.push('/tenant-admin/billing') },
        });
      } else {
        console.error("Error creating product:", error);
        toast.error("Error al crear producto");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <Link href="/tenant-admin/products">
            <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-colors">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Nuevo Producto</h2>
            <p className="text-gray-500 font-medium text-sm mt-1">Agrega un producto a tu catálogo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-white border border-gray-100 rounded-[2rem] shadow-sm">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Información del Producto</CardTitle>
              <CardDescription className="text-gray-500 text-sm mt-1">Completa todos los campos requeridos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 pt-0">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-bold text-gray-700">Nombre del Producto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Ramo de Rosas Rojas"
                required
                className="bg-white border-gray-200 rounded-xl focus:border-rose-300 focus:ring-2 focus:ring-rose-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-bold text-gray-700">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe tu producto..."
                rows={4}
                className="bg-white border-gray-200 rounded-xl focus:border-rose-300 focus:ring-2 focus:ring-rose-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-bold text-gray-700">Precio (S/.) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="89.90"
                  required
                  className="bg-white border-gray-200 rounded-xl focus:border-rose-300 focus:ring-2 focus:ring-rose-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-bold text-gray-700">Categoría</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-rose-300 focus:ring-2 focus:ring-rose-50 outline-none transition-all"
                >
                  <option value="">Sin categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {tenant && (tenant as TenantConfig & { plan?: string }).plan === 'pro' && (
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-sm font-bold text-gray-700">Stock disponible <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Pro</span></Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="Dejar vacío = sin límite de stock"
                  className="bg-white border-gray-200 rounded-xl focus:border-rose-300 focus:ring-2 focus:ring-rose-50"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700">Imágenes</Label>
              <div className="space-y-4">
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-rose-300 transition-colors bg-white">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500 font-medium">Click para subir imágenes</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 focus:ring-2"
              />
              <Label htmlFor="featured" className="cursor-pointer text-sm font-semibold text-gray-700">
                Producto destacado
              </Label>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <Button 
                type="submit" 
                disabled={loading} 
                className="flex-1 bg-black text-white hover:bg-gray-800 rounded-xl font-bold py-3 shadow-lg transition-all active:scale-95"
              >
                {loading ? "Creando..." : "Crear Producto"}
              </Button>
              <Link href="/tenant-admin/products">
                <Button 
                  type="button" 
                  variant="outline"
                  className="rounded-xl font-semibold py-3 border-gray-200 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
      </div>
    </div>
  );
}

export default function NewProductPage() {
  return (
    <ProtectedRoute>
      <NewProductContent />
    </ProtectedRoute>
  );
}
