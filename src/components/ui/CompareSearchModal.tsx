import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCompare } from '../../context/CompareContext';
import { productService } from '../../api/services/productService';
import { ProductResponse } from '../../api/types/product';

const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const CompareSearchModal: React.FC = () => {
  const { isSearchModalOpen, closeSearchModal, addToCompare, isInCompare, compareItems } = useCompare();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Lấy categoryId từ sản phẩm đầu tiên đang so sánh (nếu có)
  const filterCategoryId = compareItems.length > 0 ? compareItems[0].categoryId : undefined;
  const filterCategoryName = compareItems.length > 0 ? compareItems[0].categoryName : undefined;

  useEffect(() => {
    if (!isSearchModalOpen) return;
    setLoading(true);
    productService.getAllProducts(filterCategoryId ? { categoryId: filterCategoryId } : undefined)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [isSearchModalOpen, filterCategoryId]);

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brandName?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 8);

  if (!isSearchModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={closeSearchModal}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="p-6 border-b border-gray-100">
            {filterCategoryName && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-3">
                Chỉ hiển thị sản phẩm danh mục: {filterCategoryName}
              </p>
            )}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                type="text"
                autoFocus
                placeholder="Tìm sản phẩm muốn so sánh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-black transition outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const isAdded = isInCompare(product.productId);
                const displayPrice = product.discountedPrice ?? product.basePrice;
                return (
                  <div key={product.productId} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition group">
                    <div className="w-16 h-16 bg-white border border-gray-100 rounded-xl p-2 flex-shrink-0">
                      <img
                        src={product.thumbnailUrl || ''}
                        alt={product.name}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=No+Image'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{product.name}</h4>
                      <p className="text-[10px] text-gray-400 uppercase">{product.brandName} · {product.categoryName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-black text-red-600">{fmt(displayPrice)}</span>
                        {product.discountedPrice && (
                          <span className="text-[10px] text-gray-400 line-through">{fmt(product.basePrice)}</span>
                        )}
                      </div>
                    </div>
                    <button
                      disabled={isAdded}
                      onClick={() => addToCompare(product)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition ${
                        isAdded
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                      }`}
                    >
                      {isAdded ? 'Đã chọn' : 'Chọn'}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-200 mb-2">search_off</span>
                <p className="text-gray-400 text-sm">Không tìm thấy sản phẩm nào</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 flex justify-end">
            <button onClick={closeSearchModal} className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition">
              Đóng
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CompareSearchModal;
