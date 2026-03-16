"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Edit3, Coffee, Flower, Gift, Heart, Sparkles, Package, ShoppingBag, Star, Cake, Wine, Palette, Home, Shirt, Watch, Footprints, Baby, Music, Book, Camera, Gamepad2, Dumbbell, Pizza, IceCream } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/auth";
import { Category } from "@/lib/types";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import * as LucideIcons from "lucide-react";

// Íconos disponibles para categorías
const AVAILABLE_ICONS = [
  { name: "Package", icon: Package },
  { name: "ShoppingBag", icon: ShoppingBag },
  { name: "Gift", icon: Gift },
  { name: "Heart", icon: Heart },
  { name: "Star", icon: Star },
  { name: "Sparkles", icon: Sparkles },
  { name: "Coffee", icon: Coffee },
  { name: "Flower", icon: Flower },
  { name: "Cake", icon: Cake },
  { name: "Wine", icon: Wine },
  { name: "Palette", icon: Palette },
  { name: "Home", icon: Home },
  { name: "Shirt", icon: Shirt },
  { name: "Watch", icon: Watch },
  { name: "Footprints", icon: Footprints },
  { name: "Baby", icon: Baby },
  { name: "Music", icon: Music },
  { name: "Book", icon: Book },
  { name: "Camera", icon: Camera },
  { name: "Gamepad2", icon: Gamepad2 },
  { name: "Dumbbell", icon: Dumbbell },
  { name: "Pizza", icon: Pizza },
  { name: "IceCream", icon: IceCream },
];

// Función para renderizar ícono dinámicamente
const renderIcon = (iconName?: string, size = 24) => {
  if (!iconName) return <Sparkles size={size} />;
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent ? <IconComponent size={size} /> : <Sparkles size={size} />;
};

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

function CategoriesContent() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newIcon, setNewIcon] = useState("Package");
  const [editingName, setEditingName] = useState("");
  const [editingIcon, setEditingIcon] = useState("Package");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.tenantId) {
      loadCategories();
    }
  }, [user]);

  async function loadCategories() {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await tenantApiFetch<{ categories: Category[] }>('/api/tenant-admin/categories');
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newCategory.trim()) return;
    
    try {
      await tenantApiFetch<{ ok: boolean; id: string }>('/api/tenant-admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          label: newCategory,
          icon: newIcon,
          order: categories.length,
        }),
      });
      
      toast.success("Categoría creada");
      setNewCategory("");
      setNewIcon("Package");
      setShowModal(false);
      loadCategories();
    } catch (error) {
      const err = error as ApiError;
      if (err.limitReached) {
        toast.error(err.message, {
          description: 'Actualiza tu plan para crear categorías ilimitadas.',
          action: { label: 'Ver planes', onClick: () => router.push('/tenant-admin/billing') },
        });
      } else {
        console.error("Error creating category:", error);
        toast.error("Error al crear categoría");
      }
    }
  }

  async function handleUpdate(categoryId: string) {
    if (!editingName.trim()) return;
    
    try {
      const category = categories.find(c => c.id === categoryId);
      await tenantApiFetch<{ ok: boolean }>(`/api/tenant-admin/categories/${categoryId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          label: editingName,
          icon: editingIcon,
          order: category?.order || 0,
        }),
      });
      
      toast.success("Categoría actualizada");
      setEditingId(null);
      setEditingName("");
      setEditingIcon("Package");
      loadCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Error al actualizar categoría");
    }
  }

  async function handleDelete(categoryId: string) {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;
    
    try {
      await tenantApiFetch<{ ok: boolean }>(`/api/tenant-admin/categories/${categoryId}`, {
        method: 'DELETE',
      });
      
      toast.success("Categoría eliminada");
      loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Error al eliminar categoría");
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Categorías</h2>
          <p className="text-gray-500 font-medium text-sm mt-1">Organiza tus productos.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition-all active:scale-95"
        >
          <Plus size={18} /> <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-semibold">Cargando categorías...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles size={32} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay categorías</h3>
          <p className="text-gray-500 mb-6">Crea tu primera categoría para organizar tus productos.</p>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all inline-flex items-center gap-2"
          >
            <Plus size={20} /> Crear Categoría
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white p-5 rounded-[1.5rem] border border-gray-100 hover:border-rose-100 hover:shadow-lg transition-all group relative cursor-pointer">
              {editingId === cat.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/20"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleUpdate(cat.id)}
                  />
                  <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                    {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setEditingIcon(name)}
                        className={`p-2 rounded-lg border transition-all ${
                          editingIcon === name
                            ? 'border-rose-500 bg-rose-50 text-rose-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon size={18} />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(cat.id)}
                      className="flex-1 bg-black text-white text-xs font-bold py-2 rounded-lg hover:bg-gray-800 transition-all"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingName("");
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 text-xs font-bold py-2 rounded-lg hover:bg-gray-200 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-rose-50 text-rose-600">
                    {renderIcon(cat.icon, 24)}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{cat.label}</h3>
                  <p className="text-xs font-semibold text-gray-400 mt-1">{cat.value}</p>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditingName(cat.label);
                        setEditingIcon(cat.icon || 'Package');
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          <button 
            onClick={() => setShowModal(true)} 
            className="border-2 border-dashed border-gray-200 rounded-[1.5rem] flex flex-col items-center justify-center text-gray-400 hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-500 transition-all min-h-[160px]"
          >
            <Plus size={32} className="mb-2 opacity-50" />
            <span className="text-sm font-bold">Crear Categoría</span>
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full max-w-md rounded-[2rem] p-6 md:p-8 relative z-10 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900">Nueva Categoría</h3>
              <button onClick={() => setShowModal(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                  className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  placeholder="Ej: Aniversario"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Ícono</label>
                <div className="grid grid-cols-6 gap-2 p-4 bg-gray-50 rounded-2xl max-h-48 overflow-y-auto">
                  {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setNewIcon(name)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        newIcon === name
                          ? 'border-rose-500 bg-white text-rose-600 shadow-sm'
                          : 'border-transparent hover:border-gray-200 hover:bg-white'
                      }`}
                    >
                      <Icon size={20} strokeWidth={2.5} />
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleCreate}
                className="w-full bg-black text-white font-bold py-4 rounded-2xl shadow-xl shadow-gray-200 mt-4 active:scale-[0.98] transition-transform"
              >
                Crear Categoría
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <ProtectedRoute>
      <CategoriesContent />
    </ProtectedRoute>
  );
}