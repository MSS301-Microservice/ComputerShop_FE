import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { roleService } from '../../api/services/roleService';
import Pagination from '../../components/ui/Pagination';
import { showToast, showConfirm } from '../../components/ui/Toast';
import { RoleResponse, RoleCreationRequest, RoleUpdateRequest } from '../../api/types/role';


const AdminRoles: React.FC = () => {
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleResponse | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchRoles = async (page = 0) => {
    try {
      setLoading(true);
      setError(null);
      try {
        const data = await roleService.getAllRolesPaged(page, 10);
        setRoles(data.content);
        setTotalPages(data.totalPages);
        setCurrentPage(data.number);
      } catch {
        const all = await roleService.getAllRoles();
        const size = 10;
        const start = page * size;
        setRoles(all.slice(start, start + size));
        setTotalPages(Math.ceil(all.length / size));
        setCurrentPage(page);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách vai trò');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const request: RoleCreationRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      };
      await roleService.createRole(request);
      showToast('Thêm role thành công', 'success');
      setShowAddModal(false);
      setFormData({ name: '', description: '' });
      fetchRoles(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to create role', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !formData.name.trim()) return;

    try {
      const request: RoleUpdateRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      };
      await roleService.updateRole(selectedRole.roleId, request);
      showToast('Cập nhật role thành công', 'success');
      setShowEditModal(false);
      setSelectedRole(null);
      setFormData({ name: '', description: '' });
      fetchRoles(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await showConfirm({ title: 'Xóa role', message: 'Bạn có chắc chắn muốn xóa role này?', confirmText: 'Xóa', danger: true });
    if (!ok) return;

    try {
      await roleService.deleteRole(id);
      showToast('Xóa role thành công', 'success');
      fetchRoles(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete role', 'error');
    }
  };

  const openEditModal = (role: RoleResponse) => {
    setSelectedRole(role);
    setFormData({ name: role.name, description: role.description || '' });
    setShowEditModal(true);
  };

  return (
    <AdminLayout
      title="Quản Lý Roles"
      subtitle="Quản lý các vai trò người dùng trong hệ thống."
      requiredRole="admin"
      actions={
        <button
          onClick={() => {
            setFormData({ name: '', description: '' });
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition flex items-center"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          Thêm Role
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
          <button onClick={fetchRoles} className="text-xs underline mt-2 hover:text-red-800">
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Tên Role</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Mô tả</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {roles.map((role) => (
                <tr key={role.roleId} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600">{role.roleId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{role.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{role.description || '-'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(role)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        title="Chỉnh sửa"
                      >
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(role.roleId)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                        title="Xóa"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-200 mb-4">badge</span>
                    <p className="text-gray-500 text-sm">Chưa có role nào.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => fetchRoles(p)} />

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Thêm Role Mới</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tên Role</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Ví dụ: ADMIN, STAFF, USER..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Mô tả vai trò..."
                  rows={3}
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
      {showEditModal && selectedRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Chỉnh Sửa Role</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tên Role</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  rows={3}
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

export default AdminRoles;
