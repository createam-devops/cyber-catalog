"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, ShoppingBag, Share2, Check, Zap, Star, ArrowLeft } from 'lucide-react';
import { Product, TenantConfig } from '@/lib/types';
import { collection, getDocs, query, limit, doc, getDoc } from 'firebase/firestore';
import { initTenantFirebase } from '@/lib/firebase';
import ModernNavbar from './ModernNavbar';
import ModernFooter from './ModernFooter';
import ModernCart from './ModernCart';
import { useCart } from '@/contexts/CartContext';
import { getPrimaryColor, getAccentColor } from '@/lib/tenant-colors';

interface ModernProductDetailProps {
  productId: string;
  tenant: TenantConfig;
  domain: string;
  initialProduct?: Product; // Producto cargado en el servidor
  initialRelatedProducts?: Product[]; // Productos relacionados cargados en el servidor
}

export default function ModernProductDetail({ 
  productId, 
  tenant, 
  domain,
  initialProduct,
  initialRelatedProducts = []
}: ModernProductDetailProps) {
  const router = useRouter();
  const { cart, addToCart, removeFromCart, getCartCount } = useCart();
  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct); // Solo carga si no hay producto inicial
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>(initialRelatedProducts);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const primaryColor = getPrimaryColor(tenant);
  const accentColor = getAccentColor(tenant);

  // Cargar producto solo si no hay producto inicial
  useEffect(() => {
    if (!initialProduct) {
      loadProduct();
    }
  }, [productId, tenant.id, initialProduct]);

  // Trackear vista de producto (fire-and-forget)
  useEffect(() => {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: tenant.id, event: 'view' }),
    }).catch(() => {}); // ignorar errores de tracking
  }, [productId, tenant.id]);

  async function loadProduct() {
    try {
      setLoading(true);
      const { db } = initTenantFirebase(tenant.id, tenant.firebaseConfig);
      const productDoc = await getDoc(doc(db, 'products', productId));
      
      if (!productDoc.exists()) {
        router.push('/');
        return;
      }

      const productData = {
        id: productDoc.id,
        ...productDoc.data(),
        createdAt: productDoc.data().createdAt?.toDate(),
        updatedAt: productDoc.data().updatedAt?.toDate(),
      } as Product;

      setProduct(productData);
    } catch (error) {
      console.error('Error loading product:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!product) return;
    setActiveImage(0);
    setQuantity(1);
    // Solo cargar productos relacionados si no hay productos iniciales
    if (initialRelatedProducts.length === 0) {
      loadRelatedProducts();
    }
  }, [product?.id, initialRelatedProducts.length]);

  const loadRelatedProducts = async () => {
    if (!product) return;
    try {
      const { db } = initTenantFirebase(tenant.id, tenant.firebaseConfig);
      const productsRef = collection(db, 'products');
      const q = query(productsRef, limit(5)); // +1 para asegurar que tengamos suficientes
      const snapshot = await getDocs(q);
      
      const products = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Product))
        .filter(p => p.id !== product.id)
        .slice(0, 4);
      
      setRelatedProducts(products);
    } catch (error) {
      console.error('Error loading related products:', error);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setIsCartOpen(true);
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
  };

  const handleGoHome = () => {
    router.push(`/`);
  };

  const handleShare = async () => {
    if (!product) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-semibold">Cargando producto...</p>
        </div>
      </div>
    );
  }

  const images: string[] = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : ['/placeholder.svg'];

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* Navbar */}
      <ModernNavbar
        tenant={tenant}
        cartCount={getCartCount()}
        onOpenCart={() => setIsCartOpen(true)}
        isScrolled={isScrolled}
        onGoHome={handleGoHome}
        isProductPage={true}
      />

      {/* Content */}
      <div className="pt-24 pb-20 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl animate-fade-in-up">
        {/* Botón Volver */}
        <button
          onClick={handleGoHome}
          className="flex items-center gap-2 text-gray-600 mb-8 transition-colors group"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = primaryColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#4B5563';
          }}
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">Volver</span>
        </button>

        {/* Grid Principal: 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 items-start">
          
          {/* IZQUIERDA: Galería */}
          <div className="flex flex-col-reverse lg:flex-row gap-4 lg:max-h-[500px]">
            {/* Miniaturas */}
            {images.length > 1 && (
              <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto p-2 lg:p-2 lg:w-24 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-20 h-20 lg:w-full lg:aspect-square rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300 border-2 ${
                      activeImage === idx 
                        ? 'scale-105 shadow-sm' 
                        : 'border-gray-100 hover:border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                    style={activeImage === idx ? {
                      borderColor: primaryColor,
                      borderWidth: '2px'
                    } : {}}
                  >
                    <Image 
                      src={img} 
                      alt={`${product.name} - Vista ${idx + 1}`}
                      fill
                      sizes="96px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Imagen Principal */}
            <div className="relative aspect-square flex-1 rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100">
              <Image 
                src={images[activeImage]} 
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
                priority
              />
              {product.featured && (
                <span 
                  className="absolute top-4 left-4 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg z-10"
                  style={{ 
                    background: `linear-gradient(to right, ${primaryColor}, ${accentColor})`
                  }}
                >
                  ⭐ Destacado
                </span>
              )}
              <button 
                onClick={handleShare}
                className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/90 backdrop-blur-sm hover:bg-white text-gray-600 transition-all shadow-lg z-10"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = primaryColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#4B5563';
                }}
              >
                <Share2 size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* DERECHA: Info del Producto */}
          <div className="flex flex-col justify-start">
            {/* Categoría */}
            <div className="mb-4">
              <span 
                className="inline-flex items-center font-black uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-lg"
                style={{ 
                  color: primaryColor,
                  backgroundColor: primaryColor + '15'
                }}
              >
                {product.category}
              </span>
            </div>

            {/* Título */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-tight mb-4 tracking-tight">
              {product.name}
            </h1>

            {/* Precio */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-black text-gray-900">
                S/{product.price.toFixed(2)}
              </span>
              <div className="flex items-center gap-1 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                ))}
                <span className="text-gray-500 font-semibold text-xs ml-1">(120)</span>
              </div>
            </div>

            {/* Descripción */}
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
              {product.description || 'Producto de alta calidad, perfecto para cualquier ocasión especial.'}
            </p>

            {/* Acciones: Cantidad + Agregar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Cantidad */}
              <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 sm:w-36 border border-gray-200 shadow-sm">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                  className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-30"
                  disabled={quantity <= 1}
                >
                  <Minus size={16} strokeWidth={3} />
                </button>
                <span className="font-black text-lg w-8 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)} 
                  className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>

              {/* Botón Agregar */}
              <button 
                onClick={handleAddToCart}
                className="flex-1 text-white rounded-xl py-4 font-black text-sm hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-3 active:scale-[0.98] uppercase tracking-wider"
                style={{ backgroundColor: primaryColor }}
              >
                <ShoppingBag size={20} strokeWidth={2.5} />
                Agregar al Carrito
              </button>
            </div>
            
            {/* Garantías */}
            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2.5 bg-green-50/50 px-3 py-2.5 rounded-xl">
                <Check size={16} className="text-green-600" strokeWidth={3} />
                <span className="text-xs font-bold text-green-700">Stock disponible</span>
              </div>
              <div className="flex items-center gap-2.5 bg-amber-50/50 px-3 py-2.5 rounded-xl">
                <Zap size={16} className="text-amber-600" strokeWidth={3} />
                <span className="text-xs font-bold text-amber-700">Entrega Express</span>
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCTOS RELACIONADOS */}
        {relatedProducts.length > 0 && (
          <div className="bg-white rounded-[2rem] p-8 sm:p-12 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Te Podría Gustar</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <div 
                  key={p.id} 
                  className="group relative cursor-pointer" 
                  onClick={() => router.push(`/product/${p.id}`)}
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-4 border border-gray-100 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                    <Image 
                      src={p.imageUrls && p.imageUrls[0] || '/placeholder.svg'} 
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h4 
                    className="text-sm font-bold text-gray-900 line-clamp-2 mb-1 transition-colors"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = primaryColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#111827';
                    }}
                  >
                    {p.name}
                  </h4>
                  <span className="text-base font-black text-gray-900">S/{p.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cart */}
      <ModernCart
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onRemoveItem={handleRemoveItem}
        tenant={tenant}
      />

      {/* Footer */}
      <ModernFooter tenant={tenant} />
    </div>
  );
}
