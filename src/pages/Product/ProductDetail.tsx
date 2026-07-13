import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';
import { productService } from '../../api/services/productService';
import { ProductDetailResponse, ProductVariantResponse } from '../../api/types/product';
import ProductCard from '../../components/ui/ProductCard';
import { showToast, showConfirm } from '../../components/ui/Toast';

const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToCompare, isInCompare, removeFromCompare } = useCompare();

  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [related, setRelated] = useState<ProductDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'specs' | 'desc' | 'reviews'>('specs');
  const [activeImage, setActiveImage] = useState<string>('');
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    productService.getProductById(Number(id))
      .then((data) => {
        console.log('[ProductDetail] thumbnailUrl:', data.thumbnailUrl, 'imageUrls:', data.imageUrls);
        setProduct(data);
        const firstImage = data.thumbnailUrl || data.imageUrls?.[0] || '';
        setActiveImage(firstImage);
        if (data.variants?.length) setSelectedVariant(data.variants[0]);
      })
      .catch(() => setError('Không tìm thấy sản phẩm.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch related products (same category)
  useEffect(() => {
    if (!product) return;
    productService.getAllProducts({ categoryId: product.categoryId })
      .then((data) => setRelated((data as ProductDetailResponse[]).filter(p => p.productId !== product.productId).slice(0, 4)))
      .catch(() => {});
  }, [product]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để thêm vào giỏ hàng.', 'warning');
      navigate('/login');
      return;
    }
    if (!product) return;
    const variantId = selectedVariant?.variantId;
    if (!variantId) {
      showToast('Vui lòng chọn phiên bản sản phẩm.', 'warning');
      return;
    }
    const cartItem: any = {
      id: String(product.productId),
      name: product.name,
      price: product.discountedPrice ?? product.basePrice,
      originalPrice: product.discountedPrice ? product.basePrice : undefined,
      image: product.thumbnailUrl || '',
      brand: product.brandName || '',
      category: product.categoryName || '',
    };
    try {
      for (let i = 0; i < quantity; i++) await addToCart(cartItem, variantId);
      const go = await showConfirm({ title: 'Thêm thành công', message: 'Đã thêm vào giỏ hàng! Bạn có muốn xem giỏ hàng ngay không?', confirmText: 'Xem giỏ hàng', cancelText: 'Tiếp tục mua' });
      if (go) navigate('/cart');
    } catch {
      // error already handled in CartContext
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để thêm vào giỏ hàng.', 'warning');
      navigate('/login');
      return;
    }
    if (!product) return;
    const variantId = selectedVariant?.variantId;
    if (!variantId) {
      showToast('Vui lòng chọn phiên bản sản phẩm.', 'warning');
      return;
    }
    const cartItem: any = {
      id: String(product.productId),
      name: product.name,
      price: product.discountedPrice ?? product.basePrice,
      originalPrice: product.discountedPrice ? product.basePrice : undefined,
      image: product.thumbnailUrl || '',
      brand: product.brandName || '',
      category: product.categoryName || '',
    };
    try {
      for (let i = 0; i < quantity; i++) await addToCart(cartItem, variantId);
      const go = await showConfirm({ 
        title: 'Thêm thành công', 
        message: 'Đã thêm vào giỏ hàng! Bạn có muốn xem giỏ hàng ngay không?', 
        confirmText: 'Xem giỏ hàng', 
        cancelText: 'Tiếp tục mua' 
      });
      if (go) navigate('/cart');
    } catch {
      // error already handled in CartContext
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 font-['Jost']">
        <h2 className="text-2xl font-light uppercase tracking-widest">{error || 'Sản phẩm không tồn tại'}</h2>
        <Link to="/shop" className="text-sm font-bold underline uppercase tracking-widest">Quay lại cửa hàng</Link>
      </div>
    );
  }

  const hasDiscount = !!product.discountedPrice && product.discountedPrice < product.basePrice;
  // Variant price is always the base price of that variant
  // Apply discount ratio from product level onto the selected variant price
  const variantBasePrice = selectedVariant?.price ?? product.basePrice;
  const discountRatio = hasDiscount ? product.discountedPrice! / product.basePrice : 1;
  const variantPrice = hasDiscount ? Math.round(variantBasePrice * discountRatio) : variantBasePrice;

  // Collect all images - ưu tiên imageUrls từ detail API, fallback về thumbnailUrl
  const allImageUrls = product.imageUrls?.length
    ? product.imageUrls
    : product.thumbnailUrl ? [product.thumbnailUrl] : [];
  const images = Array.from(new Set(allImageUrls));

  // Build specs from selected variant attributes
  const variantAttrs: Array<{ key: string; value: string }> = selectedVariant?.attributes
    ? Array.isArray(selectedVariant.attributes)
      ? (selectedVariant.attributes as import('../../api/types/product').VariantAttribute[]).map(a => ({ key: a.attributeName, value: a.value }))
      : Object.entries(selectedVariant.attributes as Record<string, string>).map(([key, value]) => ({ key, value }))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-['Jost']">
      {/* Breadcrumbs */}
      <nav className="flex mb-8 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        <ol className="flex items-center space-x-2">
          <li><Link to="/" className="hover:text-black transition">Trang chủ</Link></li>
          <li><span className="text-gray-300">/</span></li>
          <li><Link to={`/shop?category=${encodeURIComponent(product.categoryName || '')}`} className="hover:text-black transition">{product.categoryName}</Link></li>
          <li><span className="text-gray-300">/</span></li>
          <li className="text-gray-900 truncate max-w-[200px]">{product.name}</li>
        </ol>
      </nav>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-16 lg:items-start">
        {/* Left: Images */}
        <div className="flex flex-col-reverse lg:flex-row gap-4">
          {images.length > 1 && (
            <div className="flex lg:flex-col gap-3 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`relative h-20 w-20 flex-shrink-0 border-2 transition-all duration-300 rounded-xl overflow-hidden ${activeImage === img ? 'border-black ring-2 ring-black/5' : 'border-transparent hover:border-gray-200'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
          <div 
            className="w-full aspect-square bg-white border border-gray-100 flex items-center justify-center relative group overflow-hidden rounded-3xl cursor-zoom-in"
            onClick={() => setShowLightbox(true)}
          >
            {hasDiscount && (
              <span className="absolute top-6 left-6 z-10 bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest rounded-full shadow-lg">
                -{Math.round((1 - product.discountedPrice! / product.basePrice) * 100)}%
              </span>
            )}
            <img
              src={activeImage || images[0]}
              alt={product.name}
              className="w-full h-full object-contain p-8 transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 text-4xl">
                zoom_in
              </span>
            </div>
          </div>
        </div>

        {/* Lightbox Modal */}
        {showLightbox && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-10 animate-in fade-in duration-300" onClick={() => setShowLightbox(false)}>
            <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors" onClick={() => setShowLightbox(false)}>
              <span className="material-symbols-outlined text-4xl">close</span>
            </button>
            <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
              <img 
                src={activeImage || product.thumbnailUrl || undefined} 
                alt={product.name} 
                className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300"
                referrerPolicy="no-referrer"
              />
              
              {images.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 py-6 overflow-x-auto no-scrollbar flex justify-center gap-3">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(img)}
                      className={`h-16 w-16 rounded-lg border-2 transition-all overflow-hidden flex-shrink-0 ${activeImage === img ? 'border-white scale-110' : 'border-white/20 hover:border-white/50'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right: Info */}
        <div className="mt-10 lg:mt-0">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">{product.brandName}</p>
          <h1 className="text-3xl lg:text-4xl font-light text-gray-900 uppercase tracking-wide leading-tight mb-4">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-end gap-4 border-b border-gray-100 pb-6 mb-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {fmt(variantPrice)}
              </p>
              {hasDiscount && (
                <p className="text-sm text-red-500 line-through">
                  {fmt(variantBasePrice)}
                </p>
              )}
            </div>
            {hasDiscount && product.discountPercent && (
              <span className="mb-1 px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded">
                -{product.discountPercent}%
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-sm text-gray-500 leading-relaxed mb-6">{product.description}</p>
          )}

          {/* Variants */}
          {product.variants && product.variants.length > 1 && (
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Phiên bản</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.variantId}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 text-xs font-bold border-2 rounded-xl transition ${
                      selectedVariant?.variantId === v.variantId
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {v.variantName}
                    {v.stockQuantity === 0 && <span className="ml-1 text-red-400">(Hết)</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex border border-gray-200 h-14 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 hover:bg-gray-50 transition">−</button>
                <input type="number" value={quantity} readOnly className="w-12 text-center border-none focus:ring-0 text-sm font-bold" />
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 hover:bg-gray-50 transition">+</button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={selectedVariant?.stockQuantity === 0}
                className="flex-1 bg-black text-white text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-xl rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {selectedVariant?.stockQuantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
              </button>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleBuyNow}
                className="flex-1 border border-gray-200 py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-50 transition rounded-xl"
              >
                Đặt hàng ngay
              </button>
              <button
                onClick={() => isInCompare(product.productId) ? removeFromCompare(product.productId) : addToCompare(product)}
                className={`w-14 flex items-center justify-center border-2 rounded-xl transition ${isInCompare(product.productId) ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black'}`}
                title="So sánh"
              >
                <span className="material-symbols-outlined">compare_arrows</span>
              </button>
              <button className="w-14 flex items-center justify-center border-2 border-gray-200 rounded-xl hover:text-red-500 hover:border-red-500 transition">
                <span className="material-symbols-outlined">favorite</span>
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-center space-x-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">verified_user</span>
              {product.warrantyMonths ? `Bảo hành ${product.warrantyMonths} tháng` : 'Bảo hành chính hãng'}
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">local_shipping</span>
              Giao hàng hỏa tốc
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-24">
        <div className="flex space-x-12 border-b border-gray-100 mb-10">
          {[
            { id: 'specs', label: 'Thông số kỹ thuật' },
            { id: 'desc', label: 'Mô tả chi tiết' },
            { id: 'reviews', label: 'Đánh giá' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === tab.id ? 'text-black' : 'text-gray-300 hover:text-gray-500'}`}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-px bg-black" />}
            </button>
          ))}
        </div>

        <div className="max-w-3xl">
          {activeTab === 'specs' && (
            <div className="border border-gray-100 divide-y divide-gray-100 rounded-xl overflow-hidden">
              {variantAttrs.length > 0 ? variantAttrs.map(({ key, value }) => (
                <div key={key} className="grid grid-cols-3 p-5">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{key}</span>
                  <span className="col-span-2 text-sm text-gray-900">{value}</span>
                </div>
              )) : (
                <p className="p-5 text-sm text-gray-400 italic">Đang cập nhật thông số...</p>
              )}
            </div>
          )}
          {activeTab === 'desc' && (
            <div className="text-sm text-gray-500 leading-relaxed space-y-3">
              <p>{product.description || 'Đang cập nhật mô tả sản phẩm...'}</p>
            </div>
          )}
          {activeTab === 'reviews' && (
            <p className="text-sm text-gray-400 italic">Chưa có đánh giá nào.</p>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-32">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-2xl font-light uppercase tracking-widest">Sản phẩm <span className="font-bold">Liên quan</span></h2>
            <Link to="/shop" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black underline underline-offset-8">Xem tất cả</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {related.map(p => <ProductCard key={p.productId} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
