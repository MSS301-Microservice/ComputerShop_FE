
import React, { useState } from 'react';
import { Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showConfirm } from '../ui/Toast';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  requiredRole?: 'admin' | 'staff';
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle, actions, requiredRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useAuth();

  // Must be before any early returns — Rules of Hooks
  const [groupOpen, setGroupOpen] = useState(() =>
    ['/admin/products', '/admin/categories', '/admin/brands', '/admin/attributes',
     '/staff/products', '/staff/categories', '/staff/brands', '/staff/attributes']
      .includes(location.pathname)
  );

  const handleLogout = async () => {
    const ok = await showConfirm({ title: 'Đăng xuất', message: 'Bạn có chắc chắn muốn đăng xuất?', confirmText: 'Đăng xuất', danger: true });
    if (ok) {
      await logout();
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole === 'admin' && user?.role !== 'admin') {
    return <Navigate to="/admin" />;
  }

  if (requiredRole === 'staff' && user?.role !== 'staff' && user?.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  const isAdmin = user?.role === 'admin';
  const prefix = isAdmin ? '/admin' : '/staff';

  // Redirect nếu đang ở sai prefix
  const currentPrefix = location.pathname.startsWith('/admin') ? '/admin' : '/staff';
  if (isAdmin && currentPrefix === '/staff') {
    return <Navigate to={location.pathname.replace('/staff', '/admin')} />;
  }
  if (!isAdmin && currentPrefix === '/admin') {
    return <Navigate to={location.pathname.replace('/admin', '/staff')} />;
  }

  const baseNavItems = [
    { path: `${prefix}`, label: 'Tổng Quan', icon: 'dashboard' },
    {
      label: 'Kho Hàng', icon: 'inventory_2', group: true,
      children: [
        { path: `${prefix}/products`,   label: 'Sản Phẩm',    icon: 'inventory_2' },
        { path: `${prefix}/categories`, label: 'Danh Mục',    icon: 'category' },
        { path: `${prefix}/brands`,     label: 'Thương Hiệu', icon: 'branding_watermark' },
        { path: `${prefix}/attributes`, label: 'Thuộc Tính',  icon: 'label' },
      ],
    },
    { path: `${prefix}/blogs`, label: 'Blogs', icon: 'article' },
    { path: `${prefix}/orders`, label: 'Đơn Hàng', icon: 'shopping_cart' },
    { path: `${prefix}/promotions`, label: 'Khuyến Mãi', icon: 'sell' },
    { path: `${prefix}/installment-packages`, label: 'Gói Trả Góp', icon: 'credit_card' },
    { path: `${prefix}/warranties`, label: 'Bảo Hành', icon: 'verified_user' },
    { path: `${prefix}/reports`, label: 'Báo Cáo', icon: 'bar_chart' },
  ] as const;

  // Add Messages menu item only for staff role
  const staffNavItems = user?.role === 'staff' 
    ? [...baseNavItems, { path: `${prefix}/messages`, label: 'Tin Nhắn', icon: 'chat' }]
    : baseNavItems;

  type NavItem = typeof staffNavItems[number];

  const groupPaths = [`${prefix}/products`, `${prefix}/categories`, `${prefix}/brands`, `${prefix}/attributes`];
  const isGroupActive = groupPaths.includes(location.pathname);

  const adminNavItems = [
    { path: `/admin/users`, label: 'Người Dùng', icon: 'group' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-['Jost']">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
          <Link to={prefix} className="text-xl font-bold text-blue-600 uppercase tracking-tight">
            ViTinh<span className="text-gray-900">.{user?.role || 'admin'}</span>
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-800 truncate">{user?.name}</p>
              <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${isAdmin ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {isAdmin ? 'Quản trị viên' : 'Nhân viên'}
              </span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {staffNavItems.map((item) => {
            if ('group' in item && item.group) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setGroupOpen(o => !o)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition ${
                      isGroupActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="material-symbols-outlined mr-3 text-xl">{item.icon}</span>
                      {item.label}
                    </div>
                    <span className={`material-symbols-outlined text-base transition-transform duration-200 ${groupOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>
                  {groupOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-blue-100 pl-3">
                      {item.children.map(child => {
                        const isActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                              isActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                          >
                            <span className="material-symbols-outlined mr-3 text-lg">{child.icon}</span>
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            const flat = item as { path: string; label: string; icon: string };
            const isActive = location.pathname === flat.path;
            return (
              <Link
                key={flat.path}
                to={flat.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                  isActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-xl">{flat.icon}</span>
                {flat.label}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-400">Quản trị hệ thống</p>
              </div>
              {adminNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                      isActive ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <span className="material-symbols-outlined mr-3 text-xl">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition"
          >
            <span className="material-symbols-outlined mr-3 text-xl">logout</span>
            Đăng Xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              {actions}
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
