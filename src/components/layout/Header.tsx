import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PRODUCTS } from '../../constants/index';
import { Product } from '../../types/index';
import { useAuth } from '../../context/AuthContext';
import { categoryService } from '../../api/services/categoryService';
import { CategoryTreeNode } from '../../api/types/category';

interface HeaderProps {
  cartCount: number;
}

const Header: React.FC<HeaderProps> = ({ cartCount }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const { user, logout, isAuthenticated } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    categoryService.getCategoryTree().then(tree => setCategoryTree(tree)).catch(() => {});
  }, []);

  useEffect(() => {
    if (showCategories && categoryTree.length > 0 && activeCategoryId === null) {
      setActiveCategoryId(categoryTree[0].categoryId);
    }
  }, [showCategories, categoryTree]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSuggestions(false);
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) setShowCategories(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const handleCategoryClick = (categoryId: number) => {
    navigate(`/shop?category=${categoryId}`);
    setShowCategories(false);
    setActiveCategoryId(null);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const activeCategoryData = categoryTree.find(c => c.categoryId === activeCategoryId);

  return (
    <header className="sticky top-0 z-50" style={{ background: '#002B5B', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,212,255,0.2)' }}>
      <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center gap-3 md:gap-6">

        {/* Logo */}
        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#00D4FF' }}>
            <span className="material-symbols-outlined text-base" style={{ color: '#002B5B' }}>memory</span>
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tighter uppercase" style={{ color: '#F8FAFC' }}>
            VITINH<span style={{ color: '#00D4FF' }}>.COM</span>
          </span>
        </Link>

        {/* Categories */}
        <div className="relative" ref={categoryRef}>
          <button
            onClick={() => { setShowCategories(!showCategories); if (showCategories) setActiveCategoryId(null); }}
            className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm font-bold uppercase tracking-wider"
            style={showCategories
              ? { background: 'rgba(0,212,255,0.2)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.5)' }
              : { background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <span className="material-symbols-outlined text-xl">{showCategories ? 'close' : 'grid_view'}</span>
            <span className="text-xs">Danh mục</span>
            <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${showCategories ? 'rotate-180' : ''}`}>expand_more</span>
          </button>

          {showCategories && (
            <div className="absolute top-full left-0 mt-2 w-[650px] rounded-2xl shadow-2xl overflow-hidden z-[70] flex animate-in fade-in slide-in-from-top-2 duration-200" style={{ background: '#001a3d', border: '1px solid rgba(0,212,255,0.2)' }}>
              <div className="w-[240px] border-r p-2" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(0,212,255,0.15)' }}>
                {categoryTree.map((cat) => (
                  <button
                    key={cat.categoryId}
                    onMouseEnter={() => setActiveCategoryId(cat.categoryId)}
                    onClick={() => handleCategoryClick(cat.categoryId)}
                    className="w-full flex items-center justify-between p-3 rounded-xl transition text-left"
                    style={activeCategoryId === cat.categoryId
                      ? { background: 'rgba(0,212,255,0.15)', color: '#00D4FF' }
                      : { color: '#94a3b8' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-base">category</span>
                      <span className="text-sm font-medium">{cat.categoryName}</span>
                    </div>
                    {cat.children && cat.children.length > 0 && (
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex-1 p-8">
                {activeCategoryData && (
                  <div className="animate-in fade-in duration-200">
                    <h3 className="text-base font-bold uppercase tracking-tight mb-6" style={{ color: '#F8FAFC' }}>{activeCategoryData.categoryName}</h3>
                    {activeCategoryData.children && activeCategoryData.children.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {activeCategoryData.children.map((child) => (
                          <button
                            key={child.categoryId}
                            onClick={() => handleCategoryClick(child.categoryId)}
                            className="text-sm flex items-center gap-3 group text-left transition hover:translate-x-1"
                            style={{ color: '#94a3b8' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#00D4FF'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#94a3b8'}
                          >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00D4FF' }} />
                            <span className="font-medium">{child.categoryName}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic" style={{ color: '#475569' }}>Không có danh mục con</p>
                    )}
                    <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(0,212,255,0.15)' }}>
                      <button
                        onClick={() => handleCategoryClick(activeCategoryData.categoryId)}
                        className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition hover:gap-3"
                        style={{ color: '#00D4FF' }}
                      >
                        Xem tất cả {activeCategoryData.categoryName}
                        <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Build PC */}
        <Link to="/build-pc" className="hidden lg:flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest transition" style={{ color: '#94a3b8' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#00D4FF'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#94a3b8'}
        >
          <span className="material-symbols-outlined text-xl">build</span>
          Build PC
        </Link>

        {/* Search */}
        <div className="flex-1 relative min-w-[150px]" ref={searchRef}>
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
              placeholder="Tìm kiếm linh kiện..."
              className="w-full px-4 py-2.5 pl-10 rounded-lg text-sm outline-none transition"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#F8FAFC' }}
            />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 transition" style={{ color: '#64748B' }}>
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl overflow-hidden z-[60]" style={{ background: '#001a3d', border: '1px solid rgba(0,212,255,0.2)' }}>
              <div className="p-2 border-b" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2" style={{ color: '#64748B' }}>Gợi ý sản phẩm</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSuggestionClick(product.id)}
                    className="w-full flex items-center gap-3 p-3 transition text-left group"
                    style={{ color: '#94a3b8' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.08)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate" style={{ color: '#F8FAFC' }}>{product.name}</h4>
                      <span className="text-xs font-bold" style={{ color: '#00D4FF' }}>{product.price.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <span className="material-symbols-outlined text-sm" style={{ color: '#00D4FF' }}>arrow_forward</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Cart */}
          <Link to="/cart" className="flex items-center gap-2 p-2 rounded-lg transition relative" style={{ color: '#94a3b8' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#00D4FF'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#94a3b8'}
          >
            <div className="relative">
              <span className="material-symbols-outlined text-2xl">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full" style={{ background: '#00D4FF', color: '#002B5B' }}>
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden md:block text-[11px] font-bold uppercase tracking-wider">Giỏ hàng</span>
          </Link>

          {/* Account */}
          <div className="relative" ref={userMenuRef}>
            {isAuthenticated ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 md:px-3 rounded-lg transition"
                style={{ color: '#94a3b8' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#00D4FF'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#94a3b8'}
              >
                <span className="material-symbols-outlined text-2xl">account_circle</span>
                <div className="hidden md:block text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block leading-none">
                    {user?.name}
                  </span>
                  <span className="text-[9px] text-gray-400 uppercase font-bold">
                    {{ ADMIN: 'Quản trị viên', STAFF: 'Nhân viên', MEMBER: 'Thành viên' }[user?.role?.toUpperCase() ?? ''] ?? user?.role}
                  </span>
                </div>
              </button>
            ) : (
              <Link to="/login" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition" style={{ background: '#00D4FF', color: '#002B5B' }}>
                <span className="material-symbols-outlined text-xl">login</span>
                <span className="hidden md:block">Đăng nhập</span>
              </Link>
            )}

            {showUserMenu && isAuthenticated && (
              <div className="absolute top-full right-0 mt-2 w-52 rounded-xl shadow-2xl overflow-hidden z-[80] animate-in fade-in slide-in-from-top-2 duration-200" style={{ background: '#001a3d', border: '1px solid rgba(0,212,255,0.2)' }}>
                <div className="p-4 border-b" style={{ borderColor: 'rgba(0,212,255,0.1)', background: 'rgba(0,212,255,0.05)' }}>
                  <p className="text-xs font-bold truncate" style={{ color: '#94a3b8' }}>{user?.email}</p>
                </div>
                <div className="p-1">
                  {(user?.role === 'admin') && (
                    <Link to="/admin" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 w-full p-3 text-left text-xs font-bold uppercase tracking-widest rounded-lg transition" style={{ color: '#94a3b8' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#00D4FF'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                    >
                      <span className="material-symbols-outlined text-lg">dashboard</span>Quản lý
                    </Link>
                  )}
                  {(user?.role === 'staff') && (
                    <Link to="/staff" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 w-full p-3 text-left text-xs font-bold uppercase tracking-widest rounded-lg transition" style={{ color: '#94a3b8' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#00D4FF'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                    >
                      <span className="material-symbols-outlined text-lg">dashboard</span>Quản lý
                    </Link>
                  )}
                  {[
                    { to: '/orders', icon: 'receipt_long', label: 'Đơn hàng' },
                    { to: '/warranty', icon: 'verified_user', label: 'Bảo hành' },
                    { to: '/profile', icon: 'manage_accounts', label: 'Hồ sơ' },
                  ].map(item => (
                    <Link key={item.to} to={item.to} onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 w-full p-3 text-left text-xs font-bold uppercase tracking-widest rounded-lg transition" style={{ color: '#94a3b8' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#00D4FF'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                    >
                      <span className="material-symbols-outlined text-lg">{item.icon}</span>{item.label}
                    </Link>
                  ))}
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 text-left text-xs font-bold uppercase tracking-widest rounded-lg transition" style={{ color: '#ef4444' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
