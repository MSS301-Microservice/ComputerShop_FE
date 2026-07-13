import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { promotionService } from '../../api/services/promotionService';
import { PromotionResponse } from '../../api/types/promotion';
import { productService } from '../../api/services/productService';
import { categoryService } from '../../api/services/categoryService';
import { brandService } from '../../api/services/brandService';
import { ProductResponse } from '../../api/types/product';
import { CategoryResponse } from '../../api/types/category';
import { BrandResponse } from '../../api/types/brand';
import { PagedResponse } from '../../api/types/common';
import Pagination from '../../components/ui/Pagination';
import { showToast, showConfirm } from '../../components/ui/Toast';

const PAGE_SIZE = 10;

const AdminPromotions: React.FC = () => {
  const [pagedData, setPagedData] = useState<PagedResponse<PromotionResponse> | null>(null);
  const [promotions, setPromotions] = useState<PromotionResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignType, setAssignType] = useState<'products' | 'category' | 'brand'>('products');
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionResponse | null>(null);
  
  // Data for dropdowns
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const [formData, setFormData] = useState({
    promoCode: '',
    description: '',
    discountPercent: 0,
    startDate: '',
    endDate: '',
    isActive: true,
  });
  const [assignData, setAssignData] = useState({
    selectedProductIds: [] as number[],
    categoryId: '',
    brandId: '',
  });

  const fetchPromotions = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      try {
        const data = await promotionService.getAllPromotionsPaged({ page, size: PAGE_SIZE });
        setPagedData(data);
        setPromotions(data.content);
      } catch {
        const all = await promotionService.getAllPromotions();
        const start = page * PAGE_SIZE;
        const content = all.slice(start, start + PAGE_SIZE);
        setPromotions(content);
        setPagedData({
          content,
          page,
          size: PAGE_SIZE,
          number: page,
          totalElements: all.length,
          totalPages: Math.ceil(all.length / PAGE_SIZE),
        });
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromotions(currentPage); }, [currentPage]);

  const handleDelete = async (id: number) => {
    const ok = await showConfirm({ title: 'Xóa khuyến mãi', message: 'Bạn có chắc chắn muốn xóa khuyến mãi này?', confirmText: 'Xóa', danger: true });
    if (!ok) return;

    try {
      await promotionService.deletePromotion(id);
      showToast('Xóa khuyến mãi thành công', 'success');
      fetchPromotions(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete promotion', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.promoCode.trim() || formData.discountPercent <= 0) {
      showToast('Vui lòng điền đầy đủ thông tin', 'warning');
      return;
    }

    try {
      await promotionService.createPromotion({
        promoCode: formData.promoCode.trim(),
        description: formData.description.trim() || undefined,
        discountPercent: formData.discountPercent,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: formData.isActive,
      });
      
      showToast('Thêm khuyến mãi thành công', 'success');
      setShowAddModal(false);
      resetForm();
      fetchPromotions(0);
      setCurrentPage(0);
    } catch (err: any) {
      showToast(err.message || 'Failed to create promotion', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromotion) return;

    try {
      await promotionService.updatePromotion(selectedPromotion.promotionId, {
        promoCode: formData.promoCode.trim() || undefined,
        description: formData.description.trim() || undefined,
        discountPercent: formData.discountPercent || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        isActive: formData.isActive,
      });
      
      showToast('Cập nhật khuyến mãi thành công', 'success');
      setShowEditModal(false);
      setSelectedPromotion(null);
      resetForm();
      fetchPromotions(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to update promotion', 'error');
    }
  };

  const openEditModal = (promo: PromotionResponse) => {
    setSelectedPromotion(promo);
    
    // Parse dates properly
    const parseDate = (dateStr: string) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      } catch (e) {
        console.error('Error parsing date:', dateStr, e);
        return '';
      }
    };
    
    setFormData({
      promoCode: promo.promoCode || '',
      description: promo.description || '',
      discountPercent: promo.discountPercent || 0,
      startDate: parseDate(promo.startDate),
      endDate: parseDate(promo.endDate),
      isActive: promo.isActive ?? true,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      promoCode: '',
      description: '',
      discountPercent: 0,
      startDate: '',
      endDate: '',
      isActive: true,
    });
  };

  const openAssignModal = async (promo: PromotionResponse, type: 'products' | 'category' | 'brand') => {
    setSelectedPromotion(promo);
    setAssignType(type);
    setAssignData({
      selectedProductIds: [],
      categoryId: '',
      brandId: '',
    });
    
    // Reset all data arrays first
    setProducts([]);
    setCategories([]);
    setBrands([]);
    
    setShowAssignModal(true);
    
    // Fetch data based on type
    setLoadingData(true);
    try {
      if (type === 'products') {
        const productsData = await productService.getAllProducts();
        setProducts(productsData);
      } else if (type === 'category') {
        const categoriesData = await categoryService.getAllCategories();
        setCategories(categoriesData);
      } else if (type === 'brand') {
        const brandsData = await brandService.getAllBrands();
        setBrands(brandsData);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromotion) return;

    try {
      if (assignType === 'products') {
        if (assignData.selectedProductIds.length === 0) {
          showToast('Vui lòng chọn ít nhất 1 sản phẩm', 'warning');
          return;
        }
        await promotionService.addPromotionToProducts({
          promotionId: selectedPromotion.promotionId,
          productIds: assignData.selectedProductIds,
        });
      } else if (assignType === 'category') {
        const categoryId = parseInt(assignData.categoryId);
        if (isNaN(categoryId)) {
          showToast('Vui lòng chọn danh mục', 'warning');
          return;
        }
        await promotionService.addPromotionToCategory({
          promotionId: selectedPromotion.promotionId,
          categoryId,
        });
      } else if (assignType === 'brand') {
        const brandId = parseInt(assignData.brandId);
        if (isNaN(brandId)) {
          showToast('Vui lòng chọn thương hiệu', 'warning');
          return;
        }
        await promotionService.addPromotionToBrand({
          promotionId: selectedPromotion.promotionId,
          brandId,
        });
      }
      
      setShowAssignModal(false);
      setSelectedPromotion(null);
      showToast('Gán khuyến mãi thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to assign promotion', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch (e) {
      console.error('Error formatting date:', dateStr, e);
      return dateStr;
    }
  };

  return (
    <AdminLayout 
      title="Danh Sách Khuyến Mãi" 
      subtitle={`Quản lý ${pagedData?.totalElements ?? promotions.length} khuyến mãi trong hệ thống.`}
      requiredRole="staff"
      actions={
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition flex items-center"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          Thêm Mới
        </button>
      }
    >
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={fetchPromotions} className="text-xs underline mt-2 hover:text-red-800">
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Mã KM</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Giảm giá</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Thời gian</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {promotions.map((promo) => (
                  <tr key={promo.promotionId} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{promo.promoCode}</p>
                      <p className="text-xs text-gray-500">ID: {promo.promotionId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                        -{promo.discountPercent}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-600">
                        {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest ${
                        promo.isActive ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                          promo.isActive ? 'bg-green-600' : 'bg-gray-400'
                        }`}></span>
                        {promo.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                   <td className="px-6 py-4 text-right">
  <div className="flex items-center justify-end gap-2">
    {[
      { icon: 'inventory_2', label: 'SP', color: 'purple', onClick: () => openAssignModal(promo, 'products') },
      { icon: 'category', label: 'DM', color: 'orange', onClick: () => openAssignModal(promo, 'category') },
      { icon: 'store', label: 'TH', color: 'cyan', onClick: () => openAssignModal(promo, 'brand') },
      { icon: 'edit', label: 'Sửa', color: 'indigo', onClick: () => openEditModal(promo) },
      { icon: 'delete', label: 'Xóa', color: 'rose', onClick: () => handleDelete(promo.promotionId) },
    ].map((btn, idx) => (
      <button
        key={idx}
        onClick={btn.onClick}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200
          bg-${btn.color}-50 text-${btn.color}-600 hover:bg-${btn.color}-100 active:scale-90
        `}
      >
        <span className="material-symbols-outlined text-[16px]">{btn.icon}</span>
        <span className="text-[10px] font-black uppercase tracking-tighter">{btn.label}</span>
      </button>
    ))}
  </div>
</td>
                  </tr>
                ))}
                {promotions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <span className="material-symbols-outlined text-5xl text-gray-200 mb-4">local_offer</span>
                      <p className="text-gray-500 text-sm">Chưa có khuyến mãi nào.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pagedData && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Tổng {pagedData.totalElements} khuyến mãi
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={pagedData.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Add Promotion Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Thêm Khuyến Mãi Mới</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mã khuyến mãi *</label>
                <input
                  type="text"
                  value={formData.promoCode}
                  onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="VD: SUMMER25"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  placeholder="Mô tả về chương trình khuyến mãi"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phần trăm giảm giá (%) *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.discountPercent === 0 ? '' : formData.discountPercent}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || val === '-') {
                      setFormData({ ...formData, discountPercent: 0 });
                    } else {
                      const n = parseInt(val);
                      if (!isNaN(n) && n >= 0 && n <= 100) setFormData({ ...formData, discountPercent: n });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0 - 100"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ngày bắt đầu *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ngày kết thúc *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Kích hoạt ngay</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Tạo Khuyến Mãi
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-6 py-2.5 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Promotion Modal */}
      {showEditModal && selectedPromotion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Chỉnh Sửa Khuyến Mãi</h2>
              <button onClick={() => { setShowEditModal(false); setSelectedPromotion(null); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mã khuyến mãi</label>
                <input
                  type="text"
                  value={formData.promoCode}
                  onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phần trăm giảm giá (%)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.discountPercent === 0 ? '' : formData.discountPercent}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || val === '-') {
                      setFormData({ ...formData, discountPercent: 0 });
                    } else {
                      const n = parseInt(val);
                      if (!isNaN(n) && n >= 0 && n <= 100) setFormData({ ...formData, discountPercent: n });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0 - 100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActiveEdit" className="text-sm font-medium text-gray-700">Kích hoạt</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Cập Nhật
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedPromotion(null); resetForm(); }}
                  className="px-6 py-2.5 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Promotion Modal */}
      {showAssignModal && selectedPromotion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl sticky top-0">
              <div>
                <h2 className="text-xl font-bold">Gán Khuyến Mãi</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedPromotion.promoCode} (-{selectedPromotion.discountPercent}%)
                </p>
              </div>
              <button 
                onClick={() => { setShowAssignModal(false); setSelectedPromotion(null); }} 
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {assignType === 'products' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <span className="material-symbols-outlined text-purple-600 align-middle mr-1">inventory_2</span>
                        Chọn sản phẩm *
                      </label>
                      <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                        {products.length === 0 ? (
                          <p className="text-center text-gray-500 py-8 text-sm">Không có sản phẩm nào</p>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {products.map((product) => (
                              <label 
                                key={product.productId} 
                                className="flex items-center gap-3 p-3 hover:bg-purple-50 cursor-pointer transition"
                              >
                                <input
                                  type="checkbox"
                                  checked={assignData.selectedProductIds.includes(product.productId)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setAssignData({
                                        ...assignData,
                                        selectedProductIds: [...assignData.selectedProductIds, product.productId]
                                      });
                                    } else {
                                      setAssignData({
                                        ...assignData,
                                        selectedProductIds: assignData.selectedProductIds.filter(id => id !== product.productId)
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{product.name || product.productName}</p>
                                  <p className="text-xs text-gray-500">ID: {product.productId} | {product.brandName}</p>
                                </div>
                                <span className="text-sm font-bold text-gray-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice)}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Đã chọn: {assignData.selectedProductIds.length} sản phẩm
                      </p>
                    </div>
                  )}
                  
                  {assignType === 'category' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <span className="material-symbols-outlined text-orange-600 align-middle mr-1">category</span>
                        Chọn danh mục *
                      </label>
                      <select
                        value={assignData.categoryId}
                        onChange={(e) => setAssignData({ ...assignData, categoryId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        required
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map((category) => (
                          <option key={category.categoryId} value={category.categoryId}>
                            {category.categoryName} (ID: {category.categoryId})
                          </option>
                        ))}
                      </select>
                      {categories.length === 0 && (
                        <p className="text-xs text-gray-500 mt-2">Không có danh mục nào</p>
                      )}
                    </div>
                  )}
                  
                  {assignType === 'brand' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <span className="material-symbols-outlined text-cyan-600 align-middle mr-1">store</span>
                        Chọn thương hiệu *
                      </label>
                      <select
                        value={assignData.brandId}
                        onChange={(e) => setAssignData({ ...assignData, brandId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                        required
                      >
                        <option value="">-- Chọn thương hiệu --</option>
                        {brands.map((brand) => (
                          <option key={brand.brandId} value={brand.brandId}>
                            {brand.brandName} (ID: {brand.brandId})
                          </option>
                        ))}
                      </select>
                      {brands.length === 0 && (
                        <p className="text-xs text-gray-500 mt-2">Không có thương hiệu nào</p>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loadingData}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Gán Khuyến Mãi
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAssignModal(false); setSelectedPromotion(null); }}
                  className="px-6 py-2.5 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPromotions;
