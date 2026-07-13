import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../../components/ui/ProductCard';
import { productService } from '../../api/services/productService';
import { categoryService } from '../../api/services/categoryService';
import { ProductResponse } from '../../api/types/product';
import { CategoryTreeNode } from '../../api/types/category';
import { PagedResponse } from '../../api/types/common';
import Pagination from '../../components/ui/Pagination';

const PAGE_SIZE = 12;

const PRICE_RANGES = [
  { label: 'Dưới 5 triệu', min: 0, max: 5_000_000 },
  { label: '5 - 10 triệu', min: 5_000_000, max: 10_000_000 },
  { label: '10 - 20 triệu', min: 10_000_000, max: 20_000_000 },
  { label: '20 - 50 triệu', min: 20_000_000, max: 50_000_000 },
  { label: 'Trên 50 triệu', min: 50_000_000, max: Infinity },
];

const Shop: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const categoryFilter = queryParams.get('category');
  const searchFilter = queryParams.get('search');

  const [pagedData, setPagedData] = useState<PagedResponse<ProductResponse> | null>(null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [allProducts, setAllProducts] = useState<ProductResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<typeof PRICE_RANGES[0] | null>(null);
  const [filterDiscount, setFilterDiscount] = useState(false);
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [openDropdown, setOpenDropdown] = useState<'price' | 'sort' | null>(null);

  useEffect(() => { setCurrentPage(0); }, [categoryFilter, searchFilter, selectedPriceRange, filterDiscount, sortOrder]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const categoryId = categoryFilter ? parseInt(categoryFilter) : undefined;
        let fetched: ProductResponse[] = [];

        if (searchFilter) {
          try {
            const data = await productService.searchProductsPaged(searchFilter, { page: 0, size: 200 });
            fetched = data.content;
          } catch {
            fetched = await productService.getAllProducts();
          }
        } else {
          try {
            const data = await productService.getProductsPaged({ page: 0, size: 200, categoryId: categoryId && !isNaN(categoryId) ? categoryId : undefined });
            fetched = data.content;
          } catch {
            fetched = await productService.getAllProducts({
              categoryId: categoryId && !isNaN(categoryId) ? categoryId : undefined
            });
          }
        }

        setAllProducts(fetched);
        if (categories.length === 0) {
          const cats = await categoryService.getCategoryTree();
          setCategories(cats);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, categoryFilter, searchFilter]);

  useEffect(() => {
    let filtered = [...allProducts];
    if (selectedPriceRange) {
      filtered = filtered.filter(p => {
        const price = p.discountedPrice ?? p.basePrice;
        return price >= selectedPriceRange.min && price < selectedPriceRange.max;
      });
    }
    if (filterDiscount) filtered = filtered.filter(p => p.discountedPrice != null && p.discountedPrice < p.basePrice);
    if (sortOrder === 'asc') filtered.sort((a, b) => (a.discountedPrice ?? a.basePrice) - (b.discountedPrice ?? b.basePrice));
    else if (sortOrder === 'desc') filtered.sort((a, b) => (b.discountedPrice ?? b.basePrice) - (a.discountedPrice ?? a.basePrice));

    const start = currentPage * PAGE_SIZE;
    const pageSlice = filtered.slice(start, start + PAGE_SIZE);
    setProducts(pageSlice);
    setPagedData({ content: pageSlice, totalElements: filtered.length, totalPages: Math.ceil(filtered.length / PAGE_SIZE), size: PAGE_SIZE, number: currentPage });
  }, [allProducts, selectedPriceRange, filterDiscount, sortOrder, currentPage]);

  const handleCategoryChange = (categoryId: number | null) => {
    navigate(categoryId !== null ? `/shop?category=${categoryId}` : '/shop');
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const findCategoryName = (nodes: CategoryTreeNode[], id: number): string | null => {
    for (const n of nodes) {
      if (n.categoryId === id) return n.categoryName;
      if (n.children) { const found = findCategoryName(n.children, id); if (found) return found; }
    }
    return null;
  };

  const activeCategoryName = categoryFilter ? findCategoryName(categories, parseInt(categoryFilter)) || categoryFilter : null;

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Sidebar */}
          <aside className="w-full lg:w-60 flex-shrink-0">
            <div className="sticky top-32 space-y-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 pb-2" style={{ color: '#002B5B', borderBottom: '2px solid #00D4FF' }}>Danh mục</h3>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleCategoryChange(null)}
                    className="px-3 py-2 text-sm font-medium rounded-lg transition-all text-left flex items-center justify-between"
                    style={!categoryFilter ? { background: 'rgba(0,43,91,0.1)', color: '#002B5B', border: '1px solid rgba(0,43,91,0.3)' } : { color: '#64748B' }}
                    onMouseEnter={e => { if (categoryFilter) (e.currentTarget as HTMLElement).style.background = 'rgba(0,43,91,0.05)'; }}
                    onMouseLeave={e => { if (categoryFilter) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    Tất cả
                    {!categoryFilter && <span className="material-symbols-outlined text-sm">chevron_right</span>}
                  </button>

                  {categories.map((parent) => {
                    const hasChildren = parent.children && parent.children.length > 0;
                    const isExpanded = expandedIds.has(parent.categoryId);
                    const isActive = categoryFilter === String(parent.categoryId);
                    return (
                      <div key={parent.categoryId}>
                        <button
                          onClick={() => { handleCategoryChange(parent.categoryId); if (hasChildren) toggleExpand(parent.categoryId); }}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all text-left"
                          style={isActive ? { background: 'rgba(0,43,91,0.1)', color: '#002B5B' } : { color: '#64748B' }}
                          onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(0,43,91,0.05)'; }}
                          onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <span>{parent.categoryName}</span>
                          {hasChildren && (
                            <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                          )}
                        </button>
                        {hasChildren && isExpanded && (
                          <div className="ml-4 mt-1 flex flex-col gap-1 pl-3 border-l" style={{ borderColor: 'rgba(0,43,91,0.15)' }}>
                            {parent.children!.map((child) => {
                              const isChildActive = categoryFilter === String(child.categoryId);
                              return (
                                <button
                                  key={child.categoryId}
                                  onClick={() => handleCategoryChange(child.categoryId)}
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all text-left"
                                  style={isChildActive ? { background: 'rgba(0,43,91,0.1)', color: '#002B5B' } : { color: '#64748B' }}
                                  onMouseEnter={e => { if (!isChildActive) (e.currentTarget as HTMLElement).style.background = 'rgba(0,43,91,0.05)'; }}
                                  onMouseLeave={e => { if (!isChildActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                >
                                  {child.categoryName}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* <<<<<<< HEAD
              <div className="hidden lg:block p-5 rounded-2xl border border-gray-100 bg-white">
                <h4 className="text-xs font-bold uppercase tracking-widest mb-2 text-gray-800">Hỗ trợ 24/7</h4>
                <p className="text-xs leading-relaxed text-gray-500">Cần tư vấn cấu hình? Liên hệ ngay với đội ngũ chuyên gia.</p>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-chat-with-staff', { detail: {} }))}
                  className="mt-4 w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition border border-gray-200 text-gray-500 hover:border-black hover:text-black"
======= */}
              <div className="hidden lg:block p-5 rounded-2xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#002B5B' }}>Hỗ trợ 24/7</h4>
                <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>Cần tư vấn cấu hình? Liên hệ ngay với đội ngũ chuyên gia.</p>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-chat-with-staff', { detail: {} }))}
                  className="mt-4 w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition" style={{ border: '1px solid #002B5B', color: '#002B5B' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#002B5B'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#002B5B'; }}
                >
                  Liên hệ ngay
                </button>
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-3xl font-light uppercase tracking-tight" style={{ color: '#000000' }}>
                {activeCategoryName ? (<>Danh mục: <span className="font-bold" style={{ color: '#60a5fa' }}>{activeCategoryName}</span></>) :
                  searchFilter ? (<>Kết quả: <span className="font-bold" style={{ color: '#60a5fa' }}>"{searchFilter}"</span></>) :
                    (<>Tất cả <span className="font-bold" style={{ color: '#60a5fa' }}>Sản phẩm</span></>)}
              </h1>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#475569' }}>
                Hiển thị {pagedData?.totalElements ?? products.length} sản phẩm
              </p>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 mb-8 pb-6" style={{ borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
              {/* Price filter */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={selectedPriceRange
                    ? { background: '#002B5B', color: '#fff', border: '1px solid #002B5B' }
                    : { background: '#fff', color: '#64748B', border: '1px solid #e2e8f0' }}
                >
                  <span className="material-symbols-outlined text-base">payments</span>
                  {selectedPriceRange ? selectedPriceRange.label : 'Lọc theo giá'}
                  {selectedPriceRange ? (
                    <span role="button" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSelectedPriceRange(null); setOpenDropdown(null); }} className="ml-1 cursor-pointer">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">{openDropdown === 'price' ? 'expand_less' : 'expand_more'}</span>
                  )}
                </button>
                {openDropdown === 'price' && (
                  <div className="absolute top-full left-0 mt-2 w-48 rounded-2xl shadow-2xl py-2 z-30 bg-white" style={{ border: '1px solid #e2e8f0' }}>
                    {PRICE_RANGES.map((range) => (
                      <button key={range.label} onClick={() => { setSelectedPriceRange(range); setOpenDropdown(null); }}
                        className="w-full text-left px-4 py-2.5 text-sm transition flex items-center justify-between"
                        style={selectedPriceRange?.label === range.label ? { color: '#002B5B', fontWeight: 700 } : { color: '#64748B' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        {range.label}
                        {selectedPriceRange?.label === range.label && <span className="material-symbols-outlined text-sm">check</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount toggle */}
              <button
                onClick={() => setFilterDiscount(!filterDiscount)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={filterDiscount
                  ? { background: '#ef4444', color: '#fff', border: '1px solid #ef4444' }
                  : { background: '#fff', color: '#64748B', border: '1px solid #e2e8f0' }}
              >
                <span className="material-symbols-outlined text-base">local_offer</span>
                Đang giảm giá
                {filterDiscount && (
                  <span role="button" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setFilterDiscount(false); }} className="ml-1 cursor-pointer">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </span>
                )}
              </button>

              {/* Sort */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={sortOrder !== 'none'
                    ? { background: '#002B5B', color: '#fff', border: '1px solid #002B5B' }
                    : { background: '#fff', color: '#64748B', border: '1px solid #e2e8f0' }}
                >
                  <span className="material-symbols-outlined text-base">{sortOrder === 'asc' ? 'arrow_upward' : sortOrder === 'desc' ? 'arrow_downward' : 'sort'}</span>
                  {sortOrder === 'asc' ? 'Giá thấp → cao' : sortOrder === 'desc' ? 'Giá cao → thấp' : 'Sắp xếp'}
                  {sortOrder !== 'none' ? (
                    <span role="button" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSortOrder('none'); setOpenDropdown(null); }} className="ml-1 cursor-pointer">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">{openDropdown === 'sort' ? 'expand_less' : 'expand_more'}</span>
                  )}
                </button>
                {openDropdown === 'sort' && (
                  <div className="absolute top-full left-0 mt-2 w-48 rounded-2xl shadow-2xl py-2 z-30 bg-white" style={{ border: '1px solid #e2e8f0' }}>
                    {[{ value: 'asc' as const, label: 'Giá thấp → cao', icon: 'arrow_upward' }, { value: 'desc' as const, label: 'Giá cao → thấp', icon: 'arrow_downward' }].map((opt) => (
                      <button key={opt.value} onClick={() => { setSortOrder(opt.value); setOpenDropdown(null); }}
                        className="w-full text-left px-4 py-2.5 text-sm transition flex items-center gap-2"
                        style={sortOrder === opt.value ? { color: '#002B5B', fontWeight: 700 } : { color: '#64748B' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {(selectedPriceRange || filterDiscount || sortOrder !== 'none') && (
                <button
                  onClick={() => { setSelectedPriceRange(null); setFilterDiscount(false); setSortOrder('none'); setOpenDropdown(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition"
                  style={{ border: '1px dashed #cbd5e1', color: '#64748B' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#002B5B'; (e.currentTarget as HTMLElement).style.borderColor = '#002B5B'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748B'; (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1'; }}
                >
                  <span className="material-symbols-outlined text-base">filter_alt_off</span>
                  Xóa bộ lọc
                </button>
              )}
            </div>

            {openDropdown && <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />}

            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12" style={{ border: '3px solid #e2e8f0', borderTopColor: '#002B5B' }}></div>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-lg mb-6" style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626' }}>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                {products.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {products.map((product) => (
                        <ProductCard key={product.productId} product={product} />
                      ))}
                    </div>
                    {pagedData && pagedData.totalPages > 1 && (
                      <Pagination currentPage={currentPage} totalPages={pagedData.totalPages} onPageChange={setCurrentPage} className="mt-12" />
                    )}
                  </>
                ) : (
                  <div className="py-32 text-center rounded-3xl bg-white" style={{ border: '1px dashed #cbd5e1' }}>
                    <span className="material-symbols-outlined text-6xl mb-4 block" style={{ color: '#e2e8f0' }}>inventory_2</span>
                    <h2 className="text-xl font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>Không tìm thấy sản phẩm nào</h2>
                    <p className="mt-2 text-sm" style={{ color: '#94a3b8' }}>Vui lòng thử lại với bộ lọc khác</p>
                    <button
                      onClick={() => { navigate('/shop'); setSelectedPriceRange(null); setFilterDiscount(false); setSortOrder('none'); }}
                      className="mt-6 px-8 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl transition text-white"
                      style={{ background: '#002B5B' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#003d7a'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#002B5B'; }}
                    >
                      Xem tất cả sản phẩm
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
