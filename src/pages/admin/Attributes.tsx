import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { attributeService } from '../../api/services/attributeService';
import Pagination from '../../components/ui/Pagination';
import { showToast, showConfirm } from '../../components/ui/Toast';
import {
  AttributeResponse,
  AttributeCreationRequest,
  AttributeUpdateRequest,
} from '../../api/types/attribute';

const AdminAttributes: React.FC = () => {
  const [attributes, setAttributes] = useState<AttributeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeResponse | null>(null);
  const [formData, setFormData] = useState<string>('');

  const fetchAttributes = async (page = 0) => {
    try {
      setLoading(true);
      setError(null);
      try {
        const data = await attributeService.getAllAttributesPaged(page, 10);
        setAttributes(data.content);
        setTotalPages(data.totalPages);
        setCurrentPage(data.number);
      } catch {
        const all = await attributeService.getAllAttributes();
        const size = 10;
        const start = page * size;
        setAttributes(all.slice(start, start + size));
        setTotalPages(Math.ceil(all.length / size));
        setCurrentPage(page);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách thuộc tính');
      console.error('Error fetching attributes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  // Handle create attribute
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trim()) return;

    try {
      const request: AttributeCreationRequest = {
        attributeName: formData.trim(),
      };
      await attributeService.createAttribute(request);
      showToast('Thêm thuộc tính thành công', 'success');
      setShowAddModal(false);
      setFormData('');
      fetchAttributes(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to create attribute', 'error');
    }
  };

  // Handle update attribute
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttribute || !formData.trim()) return;

    try {
      const request: AttributeUpdateRequest = {
        attributeName: formData.trim(),
      };
      await attributeService.updateAttribute(selectedAttribute.attributeId, request);
      showToast('Cập nhật thuộc tính thành công', 'success');
      setShowEditModal(false);
      setSelectedAttribute(null);
      setFormData('');
      fetchAttributes(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to update attribute', 'error');
    }
  };

  // Handle delete attribute
  const handleDelete = async (id: number) => {
    const ok = await showConfirm({ title: 'Xóa thuộc tính', message: 'Bạn có chắc chắn muốn xóa thuộc tính này?', confirmText: 'Xóa', danger: true });
    if (!ok) return;

    try {
      await attributeService.deleteAttribute(id);
      showToast('Xóa thuộc tính thành công', 'success');
      fetchAttributes(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete attribute', 'error');
    }
  };

  // Open edit modal
  const openEditModal = (attribute: AttributeResponse) => {
    setSelectedAttribute(attribute);
    setFormData(attribute.attributeName);
    setShowEditModal(true);
  };

  return (
    <AdminLayout
      title="Quản Lý Thuộc Tính"
      subtitle="Quản lý các thuộc tính sản phẩm trong hệ thống."
      requiredRole="staff"
      actions={
        <button
          onClick={() => {
            setFormData('');
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition flex items-center"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          Thêm Thuộc Tính
        </button>
      }
    >
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={fetchAttributes}
            className="text-xs underline mt-2 hover:text-red-800"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Attributes Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  ID
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Tên thuộc tính
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {attributes.map((attribute) => (
                <tr
                  key={attribute.attributeId}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600">
                      {attribute.attributeId}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">
                      {attribute.attributeName}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(attribute)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        title="Chỉnh sửa"
                      >
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(attribute.attributeId)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                        title="Xóa"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {attributes.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-200 mb-4">
                      inventory_2
                    </span>
                    <p className="text-gray-500 text-sm">Chưa có thuộc tính nào.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => fetchAttributes(p)} />

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          ></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Thêm Thuộc Tính Mới</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Tên thuộc tính
                </label>
                <input
                  type="text"
                  required
                  value={formData}
                  onChange={(e) => setFormData(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Ví dụ: Màu sắc, Kích thước..."
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
      {showEditModal && selectedAttribute && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          ></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Chỉnh Sửa Thuộc Tính</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Tên thuộc tính
                </label>
                <input
                  type="text"
                  required
                  value={formData}
                  onChange={(e) => setFormData(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
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

export default AdminAttributes;
