import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { productService } from '../../api/services/productService';
import { ProductResponse, VariantCreationRequest, VariantUpdateRequest } from '../../api/types/product';
import { categoryService } from '../../api/services/categoryService';
import { brandService } from '../../api/services/brandService';
import { attributeService } from '../../api/services/attributeService';
import { CategoryResponse } from '../../api/types/category';
import { BrandResponse } from '../../api/types/brand';
import { AttributeResponse } from '../../api/types/attribute';
import { PagedResponse } from '../../api/types/common';
import Pagination from '../../components/ui/Pagination';
import { showToast, showConfirm } from '../../components/ui/Toast';

const PAGE_SIZE = 10;

interface VariantForm {
  variantId?: number; // undefined = new variant
  sku: string;
  variantName: string;
  price: string;
  stockQuantity: string;
  attributes: { attributeId: number; attributeName: string; value: string }[];
}

const emptyVariant = (): VariantForm => ({
  sku: '', variantName: '', price: '', stockQuantity: '', attributes: [],
});

const AdminProducts: React.FC = () => {
  const [pagedData, setPagedData] = useState<PagedResponse<ProductResponse> | null>(null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [attributes, setAttributes] = useState<AttributeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    categoryId: 0,
    brandId: 0,
    warrantyMonths: '',
  });
  const [variants, setVariants] = useState<VariantForm[]>([emptyVariant()]);
  const [editVariants, setEditVariants] = useState<VariantForm[]>([]);
  const [images, setImages] = useState<File[]>([]);

  const fetchProducts = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      try {
        const data = await productService.getProductsPaged({
          page,
          size: PAGE_SIZE,
          categoryId: selectedCategoryId || undefined,
        });
        setPagedData(data);
        setProducts(data.content);
      } catch {
        const all = await productService.getAllProducts(
          selectedCategoryId ? { categoryId: selectedCategoryId } : undefined
        );
        const start = page * PAGE_SIZE;
        const content = all.slice(start, start + PAGE_SIZE);
        setProducts(content);
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
      setError(err.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
    Promise.all([
      categoryService.getAllCategories(),
      brandService.getAllBrands(),
      attributeService.getAllAttributes(),
    ]).then(([cats, brnds, attrs]) => {
      setCategories(cats);
      setBrands(brnds);
      setAttributes(attrs);
    }).catch(console.error);
  }, [currentPage, selectedCategoryId]);

  const filteredProducts = products.filter((p) => {
    return !searchTerm ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brandName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = async (id: number) => {
    const ok = await showConfirm({ title: 'Xóa sản phẩm', message: 'Bạn có chắc chắn muốn xóa sản phẩm này?', confirmText: 'Xóa', danger: true });
    if (!ok) return;
    try {
      await productService.deleteProduct(id);
      showToast('Xóa sản phẩm thành công', 'success');
      fetchProducts(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  // --- Variant helpers ---
  const updateVariant = (idx: number, field: keyof VariantForm, value: string) => {
    setVariants((prev) => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const addAttributeToVariant = (idx: number) => {
    setVariants((prev) => prev.map((v, i) =>
      i === idx ? { ...v, attributes: [...v.attributes, { attributeId: 0, attributeName: '', value: '' }] } : v
    ));
  };

  const updateVariantAttribute = (
    vIdx: number, aIdx: number,
    field: 'attributeId' | 'value', value: string
  ) => {
    setVariants((prev) => prev.map((v, i) => {
      if (i !== vIdx) return v;
      const newAttrs = v.attributes.map((a, j) => {
        if (j !== aIdx) return a;
        if (field === 'attributeId') {
          const found = attributes.find((attr) => attr.attributeId === Number(value));
          return { attributeId: Number(value), attributeName: found?.attributeName || '', value: a.value };
        }
        return { ...a, value };
      });
      return { ...v, attributes: newAttrs };
    }));
  };

  const removeAttributeFromVariant = (vIdx: number, aIdx: number) => {
    setVariants((prev) => prev.map((v, i) =>
      i === vIdx ? { ...v, attributes: v.attributes.filter((_, j) => j !== aIdx) } : v
    ));
  };

  const removeVariant = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  // Edit variant helpers (reuse same pattern)
  const updateEditVariant = (idx: number, field: keyof VariantForm, value: string) => {
    setEditVariants((prev) => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };
  const addAttrToEditVariant = (idx: number) => {
    setEditVariants((prev) => prev.map((v, i) =>
      i === idx ? { ...v, attributes: [...v.attributes, { attributeId: 0, attributeName: '', value: '' }] } : v
    ));
  };
  const updateEditVariantAttr = (vIdx: number, aIdx: number, field: 'attributeId' | 'value', value: string) => {
    setEditVariants((prev) => prev.map((v, i) => {
      if (i !== vIdx) return v;
      const newAttrs = v.attributes.map((a, j) => {
        if (j !== aIdx) return a;
        if (field === 'attributeId') {
          const found = attributes.find((attr) => attr.attributeId === Number(value));
          return { attributeId: Number(value), attributeName: found?.attributeName || '', value: a.value };
        }
        return { ...a, value };
      });
      return { ...v, attributes: newAttrs };
    }));
  };
  const removeAttrFromEditVariant = (vIdx: number, aIdx: number) => {
    setEditVariants((prev) => prev.map((v, i) =>
      i === vIdx ? { ...v, attributes: v.attributes.filter((_, j) => j !== aIdx) } : v
    ));
  };
  const removeEditVariant = (idx: number) => {
    setEditVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  // --- Submit ---
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName.trim() || formData.categoryId === 0 || formData.brandId === 0) {
      showToast('Vui lòng điền đầy đủ thông tin sản phẩm', 'warning');
      return;
    }

    const validVariants = variants.filter((v) => v.variantName.trim());
    if (validVariants.length === 0) {
      showToast('Vui lòng thêm ít nhất 1 phiên bản (variant) cho sản phẩm', 'warning');
      return;
    }

    const parsedVariants: VariantCreationRequest[] = validVariants.map((v) => ({
      sku: v.sku.trim(),
      variantName: v.variantName.trim(),
      price: parseFloat(v.price) || 0,
      stockQuantity: parseInt(v.stockQuantity) || 0,
      attributes: v.attributes.filter((a) => a.attributeId > 0 && a.value.trim()),
    }));

    try {
      await productService.createProduct({
        name: formData.productName.trim(),
        description: formData.description.trim() || undefined,
        categoryId: formData.categoryId,
        brandId: formData.brandId,
        warrantyMonths: formData.warrantyMonths ? parseInt(formData.warrantyMonths) : undefined,
        variants: parsedVariants,
      }, images.length > 0 ? images : undefined);
      showToast('Thêm sản phẩm thành công', 'success');
      setShowAddModal(false);
      resetForm();
      fetchProducts(0);
      setCurrentPage(0);
    } catch (err: any) {
      showToast(err.message || 'Failed to create product', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (editVariants.length === 0 || !editVariants.some((v) => v.variantName.trim())) {
      showToast('Vui lòng có ít nhất 1 variant hợp lệ', 'warning');
      return;
    }

    try {
      const updateData: any = {};
      if (formData.productName.trim() && formData.productName !== selectedProduct.name)
        updateData.name = formData.productName.trim();
      if (formData.description.trim() !== (selectedProduct.description || ''))
        updateData.description = formData.description.trim() || undefined;
      if (formData.categoryId && formData.categoryId !== selectedProduct.categoryId)
        updateData.categoryId = formData.categoryId;
      if (formData.brandId && formData.brandId !== selectedProduct.brandId)
        updateData.brandId = formData.brandId;
      if (formData.warrantyMonths !== '')
        updateData.warrantyMonths = parseInt(formData.warrantyMonths) || undefined;

      // Always send variants so backend can sync (update/create/delete)
      updateData.variants = editVariants
        .filter((v) => v.variantName.trim())
        .map((v): VariantUpdateRequest => ({
          ...(v.variantId ? { variantId: v.variantId } : {}),
          sku: v.sku.trim() || undefined,
          variantName: v.variantName.trim(),
          price: parseFloat(v.price) || undefined,
          stockQuantity: parseInt(v.stockQuantity) >= 0 ? parseInt(v.stockQuantity) : undefined,
          attributes: v.attributes.filter((a) => a.attributeId > 0 && a.value.trim()),
        }));

      await productService.updateProduct(selectedProduct.productId, updateData, images.length > 0 ? images : undefined);
      showToast('Cập nhật sản phẩm thành công', 'success');
      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
      fetchProducts(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to update product', 'error');
    }
  };

  const openEditModal = (product: ProductResponse) => {
    setSelectedProduct(product);
    setFormData({
      productName: product.name || '',
      description: product.description || '',
      categoryId: product.categoryId || 0,
      brandId: product.brandId || 0,
      warrantyMonths: product.warrantyMonths ? String(product.warrantyMonths) : '',
    });
    // Load existing variants into edit form
    const existingVariants: VariantForm[] = (product.variants || []).map((v) => {
      const attrs = Array.isArray(v.attributes)
        ? (v.attributes as import('../../api/types/product').VariantAttribute[]).map((a) => ({
            attributeId: a.attributeId,
            attributeName: a.attributeName,
            value: a.value,
          }))
        : Object.entries(v.attributes as Record<string, string>).map(([k, val]) => ({
            attributeId: 0, attributeName: k, value: val,
          }));
      return {
        variantId: v.variantId,
        sku: v.sku || '',
        variantName: v.variantName || '',
        price: String(v.price || ''),
        stockQuantity: String(v.stockQuantity ?? ''),
        attributes: attrs,
      };
    });
    setEditVariants(existingVariants.length > 0 ? existingVariants : [emptyVariant()]);
    setImages([]);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({ productName: '', description: '', categoryId: 0, brandId: 0, warrantyMonths: '' });
    setVariants([emptyVariant()]);
    setEditVariants([]);
    setImages([]);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm';
  const labelCls = 'block text-xs font-bold text-gray-600 mb-1';

  return (
    <AdminLayout
      title="Danh Sách Sản Phẩm"
      subtitle={`Quản lý ${pagedData?.totalElements ?? products.length} sản phẩm trong hệ thống.`}
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
      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc thương hiệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
              value={selectedCategoryId}
              onChange={(e) => { setSelectedCategoryId(Number(e.target.value)); setCurrentPage(0); }}
              className="border border-gray-200 rounded-lg pl-4 pr-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:1em_1em]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              }}
            >
              <option value={0}>Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>
              ))}
          </select>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategoryId(0); setCurrentPage(0); }}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <span className="material-symbols-outlined text-gray-600">filter_list_off</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={fetchProducts} className="text-xs underline mt-2">Thử lại</button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Sản phẩm</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Danh mục</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Thương hiệu</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Giá bán</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Tồn kho</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map((product) => {
                  const stock = product.variants?.reduce((s, v) => s + (v.stockQuantity || 0), 0) || 0;
                  return (
                    <tr key={product.productId} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {product.thumbnailUrl && (
                            <div className="w-12 h-12 bg-gray-50 rounded-lg p-2 border border-gray-100 flex-shrink-0">
                              <img src={product.thumbnailUrl} alt="" className="w-full h-full object-contain" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">ID: {product.productId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded">
                          {product.categoryName || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.brandName || '-'}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(product.basePrice)}</p>
                        {product.discountedPrice && (
                          <p className="text-xs text-red-500">{formatCurrency(product.discountedPrice)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest ${stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${stock > 0 ? 'bg-green-600' : 'bg-red-500'}`} />
                          {stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(product)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Chỉnh sửa">
                            <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                          <button onClick={() => handleDelete(product.productId)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition" title="Xóa">
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <span className="material-symbols-outlined text-5xl text-gray-200">inventory_2</span>
                      <p className="text-gray-500 text-sm mt-2">Không tìm thấy sản phẩm nào.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pagedData && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Tổng {pagedData.totalElements} sản phẩm
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

      {/* ===== ADD MODAL ===== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold">Thêm Sản Phẩm Mới</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelCls}>Tên sản phẩm *</label>
                  <input type="text" value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Mô tả</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputCls} rows={2} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Danh mục *</label>
                  <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })} className={inputCls} required>
                    <option value={0}>Chọn danh mục</option>
                    {categories.map((cat) => <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Thương hiệu *</label>
                  <select value={formData.brandId} onChange={(e) => setFormData({ ...formData, brandId: Number(e.target.value) })} className={inputCls} required>
                    <option value={0}>Chọn thương hiệu</option>
                    {brands.map((b) => <option key={b.brandId} value={b.brandId}>{b.brandName}</option>)}
                  </select>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className={labelCls}>Bảo hành (tháng)</label>
                <input type="text" inputMode="numeric" placeholder="VD: 24" value={formData.warrantyMonths} onChange={(e) => setFormData({ ...formData, warrantyMonths: e.target.value })} className={inputCls} />
              </div>

              {/* Images */}
              <div>
                <label className={labelCls}>Hình ảnh</label>
                <input type="file" multiple accept="image/*" onChange={(e) => e.target.files && setImages(Array.from(e.target.files))} className={inputCls} />
                {images.length > 0 && <p className="text-xs text-gray-400 mt-1">{images.length} file đã chọn</p>}
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700">Phiên bản (Variants)</label>
                    <p className="text-xs text-gray-400 mt-0.5">Bắt buộc ít nhất 1 variant. Backend tự tính basePrice = giá thấp nhất của variants.</p>
                  </div>
                  <button type="button" onClick={() => setVariants((p) => [...p, emptyVariant()])}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">add</span> Thêm variant
                  </button>
                </div>
                <div className="space-y-4">
                  {variants.map((v, vIdx) => (
                    <div key={vIdx} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Variant #{vIdx + 1}</span>
                        {variants.length > 1 && (
                          <button type="button" onClick={() => removeVariant(vIdx)} className="text-red-400 hover:text-red-600">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className={labelCls}>Tên variant *</label>
                          <input type="text" placeholder="VD: i9-14900K Box" value={v.variantName} onChange={(e) => updateVariant(vIdx, 'variantName', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>SKU</label>
                          <input type="text" placeholder="VD: CPU-I9-14900K-BOX" value={v.sku} onChange={(e) => updateVariant(vIdx, 'sku', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Giá variant (USD)</label>
                          <input type="text" inputMode="decimal" placeholder="0.00" value={v.price} onChange={(e) => updateVariant(vIdx, 'price', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Số lượng tồn kho</label>
                          <input type="text" inputMode="numeric" placeholder="0" value={v.stockQuantity} onChange={(e) => updateVariant(vIdx, 'stockQuantity', e.target.value)} className={inputCls} />
                        </div>
                      </div>

                      {/* Attributes */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-500">Thuộc tính</span>
                          <button type="button" onClick={() => addAttributeToVariant(vIdx)}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">add</span> Thêm thuộc tính
                          </button>
                        </div>
                        {v.attributes.length === 0 && (
                          <p className="text-xs text-gray-400 italic">Chưa có thuộc tính nào.</p>
                        )}
                        <div className="space-y-2">
                          {v.attributes.map((attr, aIdx) => (
                            <div key={aIdx} className="flex items-center gap-2">
                              <select
                                value={attr.attributeId}
                                onChange={(e) => updateVariantAttribute(vIdx, aIdx, 'attributeId', e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value={0}>Chọn thuộc tính</option>
                                {attributes.map((a) => (
                                  <option key={a.attributeId} value={a.attributeId}>{a.attributeName}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                placeholder="Giá trị"
                                value={attr.value}
                                onChange={(e) => updateVariantAttribute(vIdx, aIdx, 'value', e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button type="button" onClick={() => removeAttributeFromVariant(vIdx, aIdx)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition">
                  Tạo Sản Phẩm
                </button>
                <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="px-6 py-2.5 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold">Chỉnh Sửa Sản Phẩm</h2>
              <button onClick={() => { setShowEditModal(false); setSelectedProduct(null); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              {/* Basic info */}
              <div>
                <label className={labelCls}>Tên sản phẩm</label>
                <input type="text" value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Mô tả</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputCls} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Danh mục</label>
                  <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })} className={inputCls}>
                    <option value={0}>Chọn danh mục</option>
                    {categories.map((cat) => <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Thương hiệu</label>
                  <select value={formData.brandId} onChange={(e) => setFormData({ ...formData, brandId: Number(e.target.value) })} className={inputCls}>
                    <option value={0}>Chọn thương hiệu</option>
                    {brands.map((b) => <option key={b.brandId} value={b.brandId}>{b.brandName}</option>)}
                  </select>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className={labelCls}>Bảo hành (tháng)</label>
                <input type="text" inputMode="numeric" placeholder="VD: 24" value={formData.warrantyMonths} onChange={(e) => setFormData({ ...formData, warrantyMonths: e.target.value })} className={inputCls} />
              </div>

              {/* Images */}
              <div>
                <label className={labelCls}>Hình ảnh mới (tùy chọn)</label>
                <input type="file" multiple accept="image/*" onChange={(e) => e.target.files && setImages(Array.from(e.target.files))} className={inputCls} />
                {images.length > 0 && <p className="text-xs text-gray-400 mt-1">{images.length} file đã chọn</p>}
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700">Phiên bản (Variants)</label>
                    <p className="text-xs text-gray-400 mt-0.5">Variant không có trong danh sách sẽ bị xóa. Variant có ID = update, không có ID = tạo mới.</p>
                  </div>
                  <button type="button" onClick={() => setEditVariants((p) => [...p, emptyVariant()])}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">add</span> Thêm variant
                  </button>
                </div>
                <div className="space-y-4">
                  {editVariants.map((v, vIdx) => (
                    <div key={vIdx} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          {v.variantId ? `Variant ID: ${v.variantId}` : `Variant mới #${vIdx + 1}`}
                        </span>
                        {editVariants.length > 1 && (
                          <button type="button" onClick={() => removeEditVariant(vIdx)} className="text-red-400 hover:text-red-600">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className={labelCls}>Tên variant *</label>
                          <input type="text" placeholder="VD: i9-14900K Box" value={v.variantName} onChange={(e) => updateEditVariant(vIdx, 'variantName', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>SKU</label>
                          <input type="text" placeholder="VD: CPU-I9-14900K-BOX" value={v.sku} onChange={(e) => updateEditVariant(vIdx, 'sku', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Giá (USD)</label>
                          <input type="text" inputMode="decimal" placeholder="0.00" value={v.price} onChange={(e) => updateEditVariant(vIdx, 'price', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Tồn kho</label>
                          <input type="text" inputMode="numeric" placeholder="0" value={v.stockQuantity} onChange={(e) => updateEditVariant(vIdx, 'stockQuantity', e.target.value)} className={inputCls} />
                        </div>
                      </div>
                      {/* Attributes */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-500">Thuộc tính</span>
                          <button type="button" onClick={() => addAttrToEditVariant(vIdx)}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">add</span> Thêm
                          </button>
                        </div>
                        {v.attributes.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có thuộc tính.</p>}
                        <div className="space-y-2">
                          {v.attributes.map((attr, aIdx) => (
                            <div key={aIdx} className="flex items-center gap-2">
                              <select
                                value={attr.attributeId}
                                onChange={(e) => updateEditVariantAttr(vIdx, aIdx, 'attributeId', e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value={0}>Chọn thuộc tính</option>
                                {attributes.map((a) => <option key={a.attributeId} value={a.attributeId}>{a.attributeName}</option>)}
                              </select>
                              <input
                                type="text"
                                placeholder="Giá trị"
                                value={attr.value}
                                onChange={(e) => updateEditVariantAttr(vIdx, aIdx, 'value', e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button type="button" onClick={() => removeAttrFromEditVariant(vIdx, aIdx)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition">
                  Cập Nhật
                </button>
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedProduct(null); resetForm(); }} className="px-6 py-2.5 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition">
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

export default AdminProducts;
