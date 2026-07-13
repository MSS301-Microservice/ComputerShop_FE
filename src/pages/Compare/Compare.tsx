import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import { useCart } from '../../context/CartContext';
import { motion } from 'motion/react';

const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const Compare: React.FC = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  if (compareItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">compare_arrows</span>
        <h1 className="text-3xl font-light uppercase tracking-tight text-black mb-4">So sánh sản phẩm</h1>
        <p className="text-gray-500 mb-8">Bạn chưa chọn sản phẩm nào để so sánh.</p>
        <Link
          to="/shop"
          className="inline-block px-8 py-3 bg-black text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 transition"
        >
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  // Collect all unique attribute names across all products' first variant
  const allAttrKeys: string[] = Array.from(
    new Set(
      compareItems.flatMap((item) => {
        const firstVariant = item.variants?.[0];
        if (!firstVariant?.attributes) return [];
        if (Array.isArray(firstVariant.attributes)) {
          return (firstVariant.attributes as import('../../api/types/product').VariantAttribute[]).map(a => a.attributeName);
        }
        return Object.keys(firstVariant.attributes as Record<string, string>);
      })
    )
  );

  const getAttrValue = (item: typeof compareItems[0], attrName: string): string => {
    const firstVariant = item.variants?.[0];
    if (!firstVariant?.attributes) return '—';
    if (Array.isArray(firstVariant.attributes)) {
      const found = (firstVariant.attributes as import('../../api/types/product').VariantAttribute[]).find(a => a.attributeName === attrName);
      return found?.value ?? '—';
    }
    return (firstVariant.attributes as Record<string, string>)[attrName] ?? '—';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 font-['Jost']">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-light uppercase tracking-tight text-black">So sánh <span className="font-bold">Sản phẩm</span></h1>
          <p className="text-gray-400 mt-2 text-[10px] font-bold uppercase tracking-[0.2em]">So sánh chi tiết cấu hình và giá bán</p>
        </div>
        <button
          onClick={clearCompare}
          className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
          Xóa tất cả
        </button>
      </div>

      <div className="overflow-x-auto pb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-4 bg-gray-50 border border-gray-100 w-48 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Đặc điểm</th>
              {compareItems.map((item) => {
                const displayPrice = item.discountedPrice ?? item.basePrice;
                const hasDiscount = !!item.discountedPrice;
                const discountPct = hasDiscount
                  ? Math.round((1 - item.discountedPrice! / item.basePrice) * 100)
                  : 0;
                return (
                  <th key={item.productId} className="p-6 bg-white border border-gray-100 min-w-[280px] relative group">
                    <button
                      onClick={() => removeFromCompare(item.productId)}
                      className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                    <Link to={`/product/${item.productId}`} className="block">
                      <img
                        src={item.thumbnailUrl || ''}
                        alt={item.name}
                        className="w-32 h-32 object-contain mx-auto mb-4 group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128?text=No+Image'; }}
                      />
                      <h3 className="text-sm font-bold text-black line-clamp-2 mb-2 h-10">{item.name}</h3>
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-lg font-black text-black">{fmt(displayPrice)}</p>
                        {hasDiscount && (
                          <>
                            <p className="text-sm text-red-400 line-through">{fmt(item.basePrice)}</p>
                            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">-{discountPct}%</span>
                          </>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        const cartItem: any = {
                          id: String(item.productId),
                          name: item.name,
                          price: displayPrice,
                          originalPrice: hasDiscount ? item.basePrice : undefined,
                          image: item.thumbnailUrl || '',
                          brand: item.brandName || '',
                          category: item.categoryName || '',
                        };
                        addToCart(cartItem);
                        navigate('/cart');
                      }}
                      className="mt-4 w-full py-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 transition"
                    >
                      Thêm vào giỏ
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* General Info */}
            <tr className="bg-gray-50/50">
              <td colSpan={compareItems.length + 1} className="p-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border border-gray-100">Thông tin chung</td>
            </tr>
            <tr>
              <td className="p-4 bg-gray-50 border border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">Thương hiệu</td>
              {compareItems.map((item) => (
                <td key={item.productId} className="p-6 border border-gray-100 text-sm font-medium text-gray-600 text-center">
                  {item.brandName || '—'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 bg-gray-50 border border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">Danh mục</td>
              {compareItems.map((item) => (
                <td key={item.productId} className="p-6 border border-gray-100 text-sm font-medium text-gray-600 text-center">
                  {item.categoryName || '—'}
                </td>
              ))}
            </tr>

            {/* Technical Specs */}
            {allAttrKeys.length > 0 && (
              <tr className="bg-gray-50/50">
                <td colSpan={compareItems.length + 1} className="p-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border border-gray-100">Thông số kỹ thuật</td>
              </tr>
            )}
            {allAttrKeys.map((key) => (
              <tr key={key}>
                <td className="p-4 bg-gray-50 border border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">{key}</td>
                {compareItems.map((item) => {
                  const val = getAttrValue(item, key);
                  return (
                    <td key={item.productId} className="p-6 border border-gray-100 text-sm text-gray-600 text-center">
                      {val !== '—' ? val : <span className="text-gray-300">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Stock */}
            <tr className="bg-gray-50/50">
              <td colSpan={compareItems.length + 1} className="p-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border border-gray-100">Tình trạng</td>
            </tr>
            <tr>
              <td className="p-4 bg-gray-50 border border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">Tồn kho</td>
              {compareItems.map((item) => {
                const totalStock = item.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) ?? 0;
                return (
                  <td key={item.productId} className="p-6 border border-gray-100 text-center">
                    <span className={`text-xs font-bold uppercase tracking-widest ${totalStock > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {totalStock > 0 ? `Còn hàng (${totalStock})` : 'Hết hàng'}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Compare;
