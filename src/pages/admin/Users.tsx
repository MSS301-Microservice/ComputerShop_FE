import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { userService } from '../../api/services/userService';
import { UserResponse } from '../../api/types/user';
import { PagedResponse } from '../../api/types/common';
import Pagination from '../../components/ui/Pagination';
import { showToast, showConfirm } from '../../components/ui/Toast';

const PAGE_SIZE = 10;

const AdminUsers: React.FC = () => {
  const [pagedData, setPagedData] = useState<PagedResponse<UserResponse> | null>(null);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    status: 'ACTIVE',
  });

  const fetchUsers = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      try {
        const data = await userService.getAllUsersPaged({ page, size: PAGE_SIZE });
        setPagedData(data);
        setUsers(data.content);
        setCurrentPage(data.number);
      } catch {
        const all = await userService.getAllUsers();
        const start = page * PAGE_SIZE;
        setUsers(all.slice(start, start + PAGE_SIZE));
        setPagedData({ content: all.slice(start, start + PAGE_SIZE), totalPages: Math.ceil(all.length / PAGE_SIZE), totalElements: all.length, number: page, size: PAGE_SIZE } as any);
        setCurrentPage(page);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(currentPage); }, [currentPage]);

  const handleDelete = async (id: number) => {
    const ok = await showConfirm({ title: 'Xóa người dùng', message: 'Bạn có chắc chắn muốn xóa người dùng này?', confirmText: 'Xóa', danger: true });
    if (!ok) return;

    try {
      await userService.deleteUser(id);
      showToast('Xóa người dùng thành công', 'success');
      fetchUsers(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'warning');
      return;
    }

    try {
      await userService.createUser({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
      });
      
      showToast('Thêm người dùng thành công', 'success');
      setShowAddModal(false);
      resetForm();
      fetchUsers(0);
      setCurrentPage(0);
    } catch (err: any) {
      showToast(err.message || 'Failed to create user', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const updateData: any = {};
      
      if (formData.username.trim() && formData.username !== selectedUser.username) {
        updateData.username = formData.username.trim();
      }
      
      if (formData.phoneNumber.trim() !== (selectedUser.phoneNumber || '')) {
        updateData.phoneNumber = formData.phoneNumber.trim() || undefined;
      }
      
      if (formData.status && formData.status !== selectedUser.status) {
        updateData.status = formData.status;
      }
      
      if (formData.password.trim()) {
        updateData.password = formData.password.trim();
      }
      
      if (Object.keys(updateData).length === 0) {
        showToast('Không có thay đổi nào để cập nhật', 'warning');
        return;
      }
      
      await userService.updateUser(selectedUser.userId, updateData);
      showToast('Cập nhật người dùng thành công', 'success');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error');
    }
  };

  const openEditModal = (user: UserResponse) => {
    setSelectedUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      password: '',
      phoneNumber: user.phoneNumber || '',
      status: user.status || 'ACTIVE',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
      status: 'ACTIVE',
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch (e) {
      return dateStr;
    }
  };

  const getRoleDisplay = (role?: string) => {
    const r = role?.toUpperCase();
    if (r === 'ADMIN') return 'Quản trị viên';
    if (r === 'STAFF') return 'Nhân viên';
    if (r === 'MEMBER') return 'Thành viên';
    return role || 'Người dùng';
  };

  const getRoleBadgeColor = (role?: string) => {
    const r = role?.toUpperCase();
    if (r === 'ADMIN') return 'bg-red-100 text-red-600';
    if (r === 'STAFF') return 'bg-blue-100 text-blue-600';
    return 'bg-gray-100 text-gray-600';
  };

  const getStatusDisplay = (status?: string) => {
    const s = status?.toUpperCase();
    if (s === 'ACTIVE') return 'Hoạt động';
    if (s === 'INACTIVE') return 'Đã khóa';
    return status || 'Không rõ';
  };

  const getStatusBadgeColor = (status?: string) => {
    const s = status?.toUpperCase();
    if (s === 'ACTIVE') return 'bg-green-100 text-green-600';
    if (s === 'INACTIVE') return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <AdminLayout 
      title="Quản Lý Người Dùng" 
      subtitle={`Quản lý ${pagedData?.totalElements ?? users.length} tài khoản khách hàng và nhân viên hệ thống.`}
      requiredRole="admin"
      
    >
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={fetchUsers} className="text-xs underline mt-2 hover:text-red-800">
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-[35%]">Người dùng</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-[15%]">Vai trò</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-[15%]">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-[20%]">Ngày tham gia</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right w-[15%]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.userId} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded ${getRoleBadgeColor(user.roleName || user.role)}`}>
                        {getRoleDisplay(user.roleName || user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded ${getStatusBadgeColor(user.status)}`}>
                        {getStatusDisplay(user.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-600">{formatDate(user.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition" 
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(user.userId)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition" 
                          title="Xóa"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <span className="material-symbols-outlined text-5xl text-gray-200 mb-4">person</span>
                      <p className="text-gray-500 text-sm">Chưa có người dùng nào.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pagedData && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Tổng {pagedData.totalElements} người dùng
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tên đăng nhập *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                    minLength={3}
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Tối thiểu 6 ký tự</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  maxLength={15}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Tạo Người Dùng
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

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Chỉnh Sửa Người Dùng</h2>
              <button onClick={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tên đăng nhập</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    minLength={3}
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu mới (để trống nếu không đổi)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nhập mật khẩu mới nếu muốn thay đổi"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Tối thiểu 6 ký tự</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    maxLength={15}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Khóa</option>
                  </select>
                </div>
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
                  onClick={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }}
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

export default AdminUsers;
