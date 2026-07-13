import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { blogService } from '../../api/services/blogService';
import { BlogResponse, BlogCreationRequest, BlogUpdateRequest } from '../../api/types/blog';
import { PagedResponse } from '../../api/types/common';
import Pagination from '../../components/ui/Pagination';
import { showToast, showConfirm } from '../../components/ui/Toast';

const PAGE_SIZE = 10;

const AdminBlogs: React.FC = () => {
  const [pagedData, setPagedData] = useState<PagedResponse<BlogResponse> | null>(null);
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogResponse | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  const fetchBlogs = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      try {
        const data = await blogService.getAllBlogsPaged({ page, size: PAGE_SIZE });
        setPagedData(data);
        setBlogs(data.content);
      } catch {
        const all = await blogService.getAllBlogs();
        const start = page * PAGE_SIZE;
        const content = all.slice(start, start + PAGE_SIZE);
        setBlogs(content);
        setPagedData({
          content,
          page,
          size: PAGE_SIZE,
          totalElements: all.length,
          totalPages: Math.ceil(all.length / PAGE_SIZE),
        });
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách blog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlogs(currentPage); }, [currentPage]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    try {
      const request: BlogCreationRequest = {
        title: formData.title.trim(),
        content: formData.content.trim(),
      };
      await blogService.createBlog(request);
      showToast('Thêm blog thành công', 'success');
      setShowAddModal(false);
      setFormData({ title: '', content: '' });
      fetchBlogs(0);
      setCurrentPage(0);
    } catch (err: any) {
      showToast(err.message || 'Failed to create blog', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlog || !formData.title.trim()) return;

    try {
      const request: BlogUpdateRequest = {
        title: formData.title.trim(),
        content: formData.content.trim(),
      };
      await blogService.updateBlog(selectedBlog.blogId, request);
      showToast('Cập nhật blog thành công', 'success');
      setShowEditModal(false);
      setSelectedBlog(null);
      setFormData({ title: '', content: '' });
      fetchBlogs(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to update blog', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await showConfirm({ title: 'Xóa blog', message: 'Bạn có chắc chắn muốn xóa blog này?', confirmText: 'Xóa', danger: true });
    if (!ok) return;

    try {
      await blogService.deleteBlog(id);
      showToast('Xóa blog thành công', 'success');
      fetchBlogs(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete blog', 'error');
    }
  };

  const openEditModal = (blog: BlogResponse) => {
    setSelectedBlog(blog);
    setFormData({ title: blog.title, content: blog.content });
    setShowEditModal(true);
  };

  return (
    <AdminLayout
      title="Quản Lý Blogs"
      subtitle="Quản lý bài viết và tin tức."
      requiredRole="staff"
      actions={
        <button
          onClick={() => {
            setFormData({ title: '', content: '' });
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition flex items-center"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          Thêm Blog
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
          <button onClick={fetchBlogs} className="text-xs underline mt-2 hover:text-red-800">
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
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Tiêu đề</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Tác giả</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Ngày tạo</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {blogs.map((blog) => (
                <tr key={blog.blogId} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600">{blog.blogId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{blog.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{blog.content}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{blog.userName || `User #${blog.userId}`}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">
                      {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('vi-VN') : '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(blog)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        title="Chỉnh sửa"
                      >
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(blog.blogId)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                        title="Xóa"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {blogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-200 mb-4">article</span>
                    <p className="text-gray-500 text-sm">Chưa có blog nào.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {pagedData && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Tổng {pagedData.totalElements} bài viết
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Thêm Blog Mới</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tiêu đề</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Nhập tiêu đề blog..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nội dung</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Nhập nội dung blog..."
                  rows={8}
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
      {showEditModal && selectedBlog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Chỉnh Sửa Blog</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tiêu đề</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nội dung</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  rows={8}
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

export default AdminBlogs;
