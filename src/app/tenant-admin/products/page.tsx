"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, MousePointerClick } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { tenantApiFetch } from '@/lib/tenant-api';
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErpCatalogGate from '@/components/tenant-admin/ErpCatalogGate';


function ProductsContent() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?.tenantId) {
      loadProducts();
    }
  }, [user]);

  async function loadProducts() {
    if (!user?.tenantId) return;
    
    setLoading(true);
    try {
      const data = await tenantApiFetch<{ products: Product[] }>('/api/tenant-admin/products');
      setProducts((data.products || []) as Product[]);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    
    try {
      await tenantApiFetch<{ ok: boolean }>(`/api/tenant-admin/products/${productId}`, {
        method: 'DELETE',
      });
      
      toast.success("Producto eliminado");
      loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error al eliminar producto");
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Inventario</h2>
            <p className="text-gray-500 font-medium text-sm mt-1">Gestión de stock.</p>
          </div>
          <Link href="/tenant-admin/products/new">
            <button className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition-all active:scale-95">
              <Plus size={18} /> <span className="hidden sm:inline">Nuevo</span>
            </button>
          </Link>
        </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Buscar producto..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 font-semibold placeholder-gray-400 shadow-sm focus:border-rose-200 focus:ring-4 focus:ring-rose-50 outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-semibold">Cargando productos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-[2rem] border border-gray-100">
          <p className="text-gray-400 mb-4 font-medium">
            {searchQuery ? "No se encontraron productos" : "Aún no tienes productos"}
          </p>
          {!searchQuery && (
            <Link href="/tenant-admin/products/new">
              <button className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all">
                <Plus className="inline mr-2" size={18} />
                Agregar Primer Producto
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white p-3 rounded-2xl border border-gray-100 hover:border-rose-100 hover:shadow-md transition-all flex items-center gap-4 group">
              <div className="w-20 h-20 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden relative">
                {product.imageUrls && product.imageUrls.length > 0 ? (
                  <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <MousePointerClick size={24} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0 py-1 pr-2">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-base text-gray-900 truncate pr-4">{product.name}</h3>
                  <div className="flex items-center gap-2">
                    <Link href={`/tenant-admin/products/${product.id}/edit`}>
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                        <Pencil size={16} />
                      </button>
                    </Link>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{product.category || 'Sin categoría'}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-gray-900">{formatPrice(product.price)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}      </div>    </div>
  );
}

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <ErpCatalogGate what="productos">
        <ProductsContent />
      </ErpCatalogGate>
    </ProtectedRoute>
  );
}
