import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../../types/index';
import { ProductResponse } from '../../api/types/product';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';
import { showToast } from './Toast';

const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

interface ProductCardProps {
  product: Product | ProductResponse;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToCompare, isInCompare, removeFromCompare } = useCompare();
  const navigate = useNavigate();

  const isApiProduct = 'productId' in product;
  const productId = isApiProduct ? (product as ProductResponse).productId : (product as Product).id;
  const productName = isApiProduct
    ? ((product as ProductResponse).name || (product as ProductResponse).productName || '')
    : (product as Product).name;
  const productImage = isApiProduct
    ? ((product as ProductResponse).thumbnailUrl || (product as ProductResponse).imageUrls?.[0] || (product as ProductResponse).primaryImage || '/placeholder.png')
    : (product as Product).image;
  const productBrand = isApiProduct ? (product as ProductResponse).brandName || '' : (product as Product).brand;
  const productPrice = isApiProduct ? (product as ProductResponse).basePrice : (product as Product).price;
  const productTag = isApiProduct ? undefined : (product as Product).tag;
  const productOriginalPrice = isApiProduct
    ? ((product as ProductResponse).discountedPrice ? (product as ProductResponse).basePrice : undefined)
    : (product as Product).originalPrice;
  const productDisplayPrice = isApiProduct
    ? ((product as ProductResponse).discountedPrice ?? (product as ProductResponse).basePrice)
    : (product as Product).price;
  const hasDiscount = isApiProduct && !!(product as ProductResponse).discountedPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để thêm vào giỏ hàng.', 'warning');
      navigate('/login');
      return;
    }
    addToCart(product as Product);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCompare(productId)) {
      removeFromCompare(productId);
    } else {
      if (isApiProduct) {
        addToCompare(product as ProductResponse);
      } else {
        const p = product as Product;
        addToCompare({
          productId: Number(p.id),
          name: p.name,
          basePrice: p.price,
          discountedPrice: p.originalPrice ? p.price : undefined,
          thumbnailUrl: p.image,
          brandName: p.brand,
          categoryId: 0,
          categoryName: p.category,
          brandId: 0,
        } as ProductResponse);
      }
    }
  };

  const isCompared = isInCompare(productId);

  return (
    <div
      className="group flex flex-col relative transition-all duration-300 bg-white"
      style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#002B5B'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,43,91,0.12)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      <div
        onClick={() => navigate(`/product/${productId}`)}
        className="relative aspect-square overflow-hidden flex items-center justify-center cursor-pointer p-6"
        style={{ background: '#F8FAFC' }}
      >
        {productTag && (
          <span className="absolute top-3 left-3 z-10 text-[10px] font-bold px-2 py-1 uppercase tracking-widest rounded-md"
            style={productTag === 'Giảm giá' ? { background: '#ef4444', color: '#fff' } : { background: '#002B5B', color: '#fff' }}>
            {productTag}
          </span>
        )}
        {hasDiscount && !productTag && (
          <span className="absolute top-3 left-3 z-10 text-[10px] font-bold px-2 py-1 uppercase tracking-widest rounded-md"
            style={{ background: '#ef4444', color: '#fff' }}>
            -{Math.round((1 - (product as ProductResponse).discountedPrice! / (product as ProductResponse).basePrice) * 100)}%
          </span>
        )}
        <button
          onClick={handleCompare}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition"
          style={isCompared
            ? { background: '#002B5B', color: '#fff' }
            : { background: '#fff', color: '#64748B', border: '1px solid #e2e8f0' }}
          title={isCompared ? 'Xóa khỏi so sánh' : 'Thêm vào so sánh'}
        >
          <span className="material-symbols-outlined text-sm">compare_arrows</span>
        </button>
        <img
          src={productImage}
          alt={productName}
          className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
          referrerPolicy="no-referrer"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
        />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center gap-2"
          style={{ background: 'rgba(0,43,91,0.75)' }}>
          <button
            onClick={handleAddToCart}
            className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition rounded-lg"
            style={{ background: '#00D4FF', color: '#002B5B' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          >
            Thêm vào giỏ
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/product/${productId}`); }}
            className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition rounded-lg"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#F8FAFC', border: '1px solid rgba(255,255,255,0.3)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'; }}
          >
            Chi tiết
          </button>
        </div>
      </div>

      <div className="p-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: '#64748B' }}>{productBrand}</p>
        <Link to={`/product/${productId}`} className="block">
          <h3 className="text-sm font-medium truncate transition" style={{ color: '#002B5B' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#00D4FF'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#002B5B'; }}>
            {productName}
          </h3>
        </Link>
        <div className="mt-2 flex justify-center items-center gap-3">
          {hasDiscount ? (
            <>
              <span className="text-sm font-bold" style={{ color: '#002B5B' }}>{fmt(productDisplayPrice)}</span>
              <span className="text-xs line-through" style={{ color: '#ef4444' }}>{fmt(productPrice)}</span>
            </>
          ) : (
            <>
              <span className="text-sm font-bold" style={{ color: '#002B5B' }}>{fmt(isApiProduct ? productDisplayPrice : productPrice)}</span>
              {productOriginalPrice && (
                <span className="text-xs line-through" style={{ color: '#ef4444' }}>{fmt(productOriginalPrice)}</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
