import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { installmentService } from '../../api/services/installmentService';
import Pagination from '../../components/ui/Pagination';
import { showToast, showConfirm } from '../../components/ui/Toast';
import { InstallmentPackageResponse, InstallmentPackageRequest } from '../../api/types/installment';

const AdminInstallmentPackages: React.FC = () => {
  const [packages, setPackages] = useState<InstallmentPackageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<InstallmentPackageResponse | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    durationMonths: 0,
    interestRate: 0,
    minOrderAmount: 0,
    downPaymentPercentage: 0,
    isActive: true,
  });

  const fetchPackages = async (page = 0) => {
    try {
      setLoading(true);
      setError(null);
      try {
        const data = await installmentService.getAllPackagesPaged(page, 10);
        setPackages(data.content);
        setTotalPages(data.totalPages);
        setCurrentPage(data.number);
      } catch {
        const all = await installmentService.getAllPackages();
        const size = 10;
        const start = page * size;
        setPackages(all.slice(start, start + size));
        setTotalPages(Math.ceil(all.length / size));
        setCurrentPage(page);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách gói trả góp');
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.durationMonths <= 0) return;

    try {
      const request: InstallmentPackageRequest = {
        name: formData.name.trim(),
        durationMonths: formData.durationMonths,
        interestRate: formData.interestRate,
        minOrderAmount: formData.minOrderAmount,
        downPaymentPercentage: formData.downPaymentPercentage,
        isActive: formData.isActive,
      };
      await installmentService.createPackage(request);
      showToast('Thêm gói trả góp thành công', 'success');
      setShowAddModal(false);
      resetForm();
      fetchPackages(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Không thể tạo gói trả góp', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage || !formData.name.trim()) return;

    try {
      const request: InstallmentPackageRequest = {
        name: formData.name.trim(),
        durationMonths: formData.durationMonths,
        interestRate: formData.interestRate,
        minOrderAmount: formData.minOrderAmount,
        downPaymentPercentage: formData.downPaymentPercentage,
        isActive: formData.isActive,
      };
      await installmentService.updatePackage(selectedPackage.packageId, request);
      showToast('Cập nhật gói trả góp thành công', 'success');
      setShowEditModal(false);
      setSelectedPackage(null);
      resetForm();
      fetchPackages(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Không thể cập nhật gói trả góp', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await showConfirm({ title: 'Xóa gói trả góp', message: 'Bạn có chắc chắn muốn xóa gói trả góp này?', confirmText: 'Xóa', danger: true });
    if (!ok) return;

    try {
      await installmentService.deletePackage(id);
      showToast('Xóa gói trả góp thành công', 'success');
      fetchPackages(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete installment package', 'error');
    }
  };

  const openEditModal = (pkg: InstallmentPackageResponse) => {
    setSelectedPackage(pkg);
    setFormData({
      name: pkg.name,
      durationMonths: pkg.durationMonths,
      interestRate: pkg.interestRate,
      minOrderAmount: pkg.minOrderAmount,
      downPaymentPercentage: pkg.downPaymentPercentage,
      isActive: pkg.active,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      durationMonths: 0,
      interestRate: 0,
      minOrderAmount: 0,
      downPaymentPercentage: 0,
      isActive: true,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <AdminLayout 
      title="Quản Lý Gói Trả Góp" 
      subtitle="Quản lý các gói trả góp cho khách hàng."
      requiredRole="staff"
      actions={
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition flex items-center"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          Thêm Gói Trả Góp
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
          <button onClick={fetchPackages} className="text-xs underline mt-2 hover:text-red-800">
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Tên gói</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Thời hạn</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Lãi suất</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Trả trước</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Giá trị đơn</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Trạng thái</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {packages.map((pkg) => (
                <tr key={pkg.packageId} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{pkg.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{pkg.durationMonths} tháng</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-blue-600">{pkg.interestRate}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-amber-600">
                      {pkg.downPaymentPercentage ? `${pkg.downPaymentPercentage}%` : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600">
                      <div>Tối thiểu: {formatCurrency(pkg.minOrderAmount)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      pkg.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {pkg.active ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(pkg)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        title="Chỉnh sửa"
                      >
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(pkg.packageId)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                        title="Xóa"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-200 mb-4">credit_card</span>
                    <p className="text-gray-500 text-sm">Chưa có gói trả góp nào.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => fetchPackages(p)} />

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 sticky top-0">
              <h2 className="text-lg font-bold text-gray-900">Thêm Gói Trả Góp</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tên gói</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Ví dụ: Trả góp 6 tháng"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Thời hạn (tháng)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.durationMonths === 0 ? '' : formData.durationMonths}
                    onChange={(e) => setFormData({ ...formData, durationMonths: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    placeholder="6"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Lãi suất (%)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.interestRate === 0 ? '' : formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  placeholder="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Giá trị đơn tối thiểu</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minOrderAmount === 0 ? '' : formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    placeholder="5000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">% Trả trước</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={formData.downPaymentPercentage === 0 ? '' : formData.downPaymentPercentage}
                    onChange={(e) => setFormData({ ...formData, downPaymentPercentage: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    placeholder="20"
                  />
                </div>
                <div className="space-y-1 flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Kích hoạt gói</span>
                  </label>
                </div>
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
      {showEditModal && selectedPackage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 sticky top-0">
              <h2 className="text-lg font-bold text-gray-900">Chỉnh Sửa Gói Trả Góp</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tên gói</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Thời hạn (tháng)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.durationMonths}
                    onChange={(e) => setFormData({ ...formData, durationMonths: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Lãi suất (%)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Giá trị đơn tối thiểu</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">% Trả trước</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={formData.downPaymentPercentage || ''}
                    onChange={(e) => setFormData({ ...formData, downPaymentPercentage: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1 flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Kích hoạt gói</span>
                  </label>
                </div>
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

export default AdminInstallmentPackages;
