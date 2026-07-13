import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { brandService } from '../../api/services/brandService';
import Pagination from '../../components/ui/Pagination';
import { showToast, showConfirm } from '../../components/ui/Toast';
import { BrandResponse, BrandCreationRequest, BrandUpdateRequest } from '../../api/types/brand';

const AdminBrands: React.FC = () => {
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandResponse | null>(null);
  const [formData, setFormData] = useState({ brandName: '', logo: null as File | null });

  // Helper function to get full image URL
  const getImageUrl = (logoPath?: string): string | undefined => {
    if (!logoPath) return undefined;
    
    // If already a full URL, return as is
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
      return logoPath;
    }
    
    // If relative path, prepend backend URL
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    return `${apiBaseUrl}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;
  };

  const fetchBrands = async (page = 0) => {
    try {
      setLoading(true);
      setError(null);
      try {
        const data = await brandService.getAllBrandsPaged(page, 10);
        setBrands(data.content);
        setTotalPages(data.totalPages);
        setCurrentPage(data.number);
      } catch {
        // Fallback: backend /brands/paged route conflicts with /brands/{id}
        const all = await brandService.getAllBrands();
        const size = 10;
        const start = page * size;
        setBrands(all.slice(start, start + size));
        setTotalPages(Math.ceil(all.length / size));
        setCurrentPage(page);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách thương hiệu');
      console.error('Error fetching brands:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName.trim()) return;

    try {
      const request: BrandCreationRequest = {
        brandName: formData.brandName.trim(),
      };
      await brandService.createBrand(request, formData.logo || undefined);
      showToast('Thêm thương hiệu thành công', 'success');
      setShowAddModal(false);
      setFormData({ brandName: '', logo: null });
      fetchBrands(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to create brand', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand || !formData.brandName.trim()) return;

    try {
      const request: BrandUpdateRequest = {
        brandName: formData.brandName.trim(),
      };
      await brandService.updateBrand(selectedBrand.brandId, request, formData.logo || undefined);
      showToast('Cập nhật thương hiệu thành công', 'success');
      setShowEditModal(false);
      setSelectedBrand(null);
      setFormData({ brandName: '', logo: null });
      fetchBrands(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to update brand', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await showConfirm({ title: 'Xóa thương hiệu', message: 'Bạn có chắc chắn muốn xóa thương hiệu này?', confirmText: 'Xóa', danger: true });
    if (!ok) return;

    try {
      await brandService.deleteBrand(id);
      showToast('Xóa thương hiệu thành công', 'success');
      fetchBrands(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete brand', 'error');
    }
  };

  const openEditModal = (brand: BrandResponse) => {
    setSelectedBrand(brand);
    setFormData({ brandName: brand.brandName, logo: null });
    setShowEditModal(true);
  };

  return (
    <AdminLayout 
      title="Quản Lý Thương Hiệu" 
      subtitle="Quản lý các hãng sản xuất thiết bị phần cứng."
      requiredRole="staff"
      actions={
        <button
          onClick={() => {
            setFormData({ brandName: '', logo: null });
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition flex items-center"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          Thêm Thương Hiệu
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
          <button onClick={fetchBrands} className="text-xs underline mt-2 hover:text-red-800">
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Thương hiệu</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {brands.map((brand) => (
                <tr key={brand.brandId} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {brand.logoUrl && (
                        <div className="w-10 h-10 bg-gray-50 rounded-lg p-1 border border-gray-100">
                          <img 
                            src={getImageUrl(brand.logoUrl)} 
                            alt={brand.brandName} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              console.error('Failed to load logo:', brand.logoUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <p className="text-sm font-bold text-gray-900">{brand.brandName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(brand)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        title="Chỉnh sửa"
                      >
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(brand.brandId)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                        title="Xóa"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-200 mb-4">branding_watermark</span>
                    <p className="text-gray-500 text-sm">Chưa có thương hiệu nào.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => fetchBrands(p)} />

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Thêm Thương Hiệu</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tên thương hiệu</label>
                <input
                  type="text"
                  required
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Ví dụ: MSI, ASUS..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Logo (tùy chọn)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, logo: e.target.files?.[0] || null })}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBrand && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Chỉnh Sửa Thương Hiệu</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tên thương hiệu</label>
                <input
                  type="text"
                  required
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Logo mới (tùy chọn)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, logo: e.target.files?.[0] || null })}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
                {selectedBrand.logoUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Logo hiện tại:</p>
                    <img 
                      src={getImageUrl(selectedBrand.logoUrl)} 
                      alt="" 
                      className="w-20 h-20 object-contain border border-gray-200 rounded-lg p-2"
                      onError={(e) => {
                        console.error('Failed to load logo:', selectedBrand.logoUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBrands;
