import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { pcBuildService } from '../api/services/pcBuildService';
import { productService } from '../api/services/productService';
import { categoryService } from '../api/services/categoryService';
import { userService } from '../api/services/userService';
import { installmentService } from '../api/services/installmentService';
import {
  PCBuildResponse, PCBuildItemResponse, ComponentType,
  COMPONENT_DISPLAY_NAMES, COMPONENT_ICONS, REQUIRED_COMPONENTS, MULTI_SLOT_COMPONENTS,
  COMPONENT_CATEGORY_NAMES,
} from '../api/types/pcbuild';
import { CategoryResponse } from '../api/types/category';
import { ProductResponse } from '../api/types/product';
import { InstallmentPackageResponse } from '../api/types/installment';
import { paymentService } from '../api/services/paymentService';
import { showToast, showConfirm } from '../components/ui/Toast';

const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const COMPONENT_SLOTS: ComponentType[] = [
  'CPU', 'MAINBOARD', 'RAM', 'GPU',
  'STORAGE_PRIMARY', 'STORAGE_SECONDARY',
  'PSU', 'CASE', 'COOLING',
  'MONITOR', 'KEYBOARD', 'MOUSE',
];

const BuildPC: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [build, setBuild] = useState<PCBuildResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [selectingSlot, setSelectingSlot] = useState<ComponentType | null>(null);
  const [replacingItemId, setReplacingItemId] = useState<number | null>(null);
  const [slotProducts, setSlotProducts] = useState<ProductResponse[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [buildName, setBuildName] = useState('');
  const [myBuilds, setMyBuilds] = useState<PCBuildResponse[]>([]);
  const [loadingMyBuilds, setLoadingMyBuilds] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [installmentPackages, setInstallmentPackages] = useState<InstallmentPackageResponse[]>([]);
  const [ramSlotFull, setRamSlotFull] = useState(false);
  const [categoryCache, setCategoryCache] = useState<CategoryResponse[]>([]);
  const [orderForm, setOrderForm] = useState({
    recipientName: '', recipientPhone: '', shippingAddress: '',
    paymentMethod: 'COD' as 'COD' | 'VNPAY',
    paymentMode: 'FULL' as 'FULL' | 'INSTALLMENT',
    packageId: undefined as number | undefined,
  });

  // ── Fetch draft (GET /pc-builds/draft) ──
  const fetchDraft = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true);
    try { setBuild(await pcBuildService.getDraft()); }
    catch { setBuild(null); }
    finally { setLoading(false); }
  }, [isAuthenticated]);

  // ── Fetch saved builds (GET /pc-builds) ──
  const fetchMyBuilds = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingMyBuilds(true);
    try { setMyBuilds(await pcBuildService.getMyBuilds()); }
    catch { setMyBuilds([]); }
    finally { setLoadingMyBuilds(false); }
  }, [isAuthenticated]);

  useEffect(() => { fetchDraft(); }, [fetchDraft]);
  useEffect(() => { fetchMyBuilds(); }, [fetchMyBuilds]);

  // Cache categories để resolve categoryId khi BE trả null
  useEffect(() => {
    categoryService.getAllCategories().then(setCategoryCache).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    userService.getMyProfile().then(p => {
      setOrderForm(prev => ({
        ...prev,
        recipientName: p.username || prev.recipientName,
        recipientPhone: p.phoneNumber || prev.recipientPhone,
      }));
    }).catch(() => {});
    installmentService.getActivePackages().then(setInstallmentPackages).catch(() => {});
  }, [isAuthenticated]);

  // ── Helpers ──
  const getItems = (slot: ComponentType): PCBuildItemResponse[] =>
    build?.items.filter(i => i.componentType === slot) || [];

  const isMultiSlot = (slot: ComponentType) => MULTI_SLOT_COMPONENTS.includes(slot);

  const getCategoryName = (slot: ComponentType): string => ({
    CPU: 'cpu', MAINBOARD: 'mainboard', RAM: 'ram', GPU: 'gpu',
    STORAGE_PRIMARY: 'ssd', STORAGE_SECONDARY: 'hdd',
    PSU: 'psu', CASE: 'case', COOLING: 'cooling',
    MONITOR: 'monitor', KEYBOARD: 'keyboard', MOUSE: 'mouse',
  } as Record<ComponentType, string>)[slot] || slot.toLowerCase();

  const missingRequired = REQUIRED_COMPONENTS.filter(c => getItems(c).length === 0);

  // Tính RAM slot limit từ mainboard
  const mainboardItem = getItems('MAINBOARD')[0];
  const ramSlotLimit = (() => {
    // Không có mainboard → không giới hạn
    if (!mainboardItem) return Infinity;
    // Backend trả về RAM Slots qua compatible-variants, không có trong item response
    // Dùng giá trị mặc định phổ biến: 4 slots ATX, 2 slots mATX
    // Sẽ được override khi backend báo lỗi 10005
    return Infinity; // để backend kiểm soát, frontend chỉ disable sau khi nhận lỗi
  })();
  const currentRamQty = getItems('RAM').reduce((sum, i) => sum + (i.quantity || 1), 0);
  const isRamSlotFull = ramSlotFull; // vẫn dùng state từ backend error

  // ── Open slot picker with compatibility check ──
  const openSlot = async (slot: ComponentType, excludeItemId?: number) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setSelectingSlot(slot);
    setReplacingItemId(excludeItemId ?? null);
    setSlotLoading(true);
    setSlotProducts([]);
    try {
      const currentItems = (build?.items || [])
        .filter(i => excludeItemId ? i.buildItemId !== excludeItemId : true)
        .map(i => ({ componentType: i.componentType, variantId: i.variantId }));

      // Resolve categoryId từ cache theo tên category của slot
      const slotCategoryName = COMPONENT_CATEGORY_NAMES[slot].toLowerCase();
      const slotCategoryLower = slotCategoryName.toLowerCase();
      const fallbackCategoryId = 
        categoryCache.find(c => c.categoryName.toLowerCase() === slotCategoryLower)?.categoryId ||
        categoryCache.find(c => c.categoryName.toLowerCase().startsWith(slotCategoryLower))?.categoryId ||
        categoryCache.find(c => c.categoryName.toLowerCase().includes(slotCategoryLower))?.categoryId;

      if (currentItems.length > 0) {
        try {
          const compat = await pcBuildService.getCompatibleVariants({ currentItems, targetComponentType: slot });
          const categoryId = compat.categoryId ?? fallbackCategoryId;
          if (categoryId) {
            const attributes = (compat.hints || []).map(h => {
              const op = ((h as any).comparison || h.operator || 'eq').toLowerCase();
              const val = (h as any).requiredValue ?? h.value;
              return op === 'eq' ? `${h.attributeName}:${val}` : `${h.attributeName}:${op}:${val}`;
            });
            setSlotProducts(await productService.getAllProducts({ categoryId, attributes } as any));
            return;
          }
        } catch { /* fallthrough */ }
      }

      // Fallback: dùng categoryId từ cache nếu có, không thì filter tên
      if (fallbackCategoryId) {
        setSlotProducts(await productService.getAllProducts({ categoryId: fallbackCategoryId } as any));
      } else {
        const all = await productService.getAllProducts();
        setSlotProducts(all.filter(p => p.categoryName?.toLowerCase().includes(slotCategoryName)));
      }
    } finally {
      setSlotLoading(false);
    }
  };

  const closeModal = () => { setSelectingSlot(null); setReplacingItemId(null); };

  const handleSelectProduct = async (product: ProductResponse) => {
    if (!selectingSlot) return;
    const variant = product.variants?.[0];
    if (!variant) { showToast('Sản phẩm này chưa có variant.', 'warning'); return; }
    try {
      if (replacingItemId !== null) {
        // Xóa item cũ qua API trước
        try { await pcBuildService.removeItem(replacingItemId); } catch { /* ignore */ }
        // Upsert item mới
        const updated = await pcBuildService.upsertItem({
          componentType: selectingSlot,
          variantId: variant.variantId,
          quantity: 1,
        });
        setBuild(updated);
        // Reset ramSlotFull nếu đổi mainboard
        if (selectingSlot === 'MAINBOARD') setRamSlotFull(false);
        showToast('Đã thay thế linh kiện.', 'success');
      } else {
        // Tính quantity hiện tại của variantId này trong build
        const existingItem = build?.items.find(i => i.componentType === selectingSlot && i.variantId === variant.variantId);
        const currentQty = existingItem?.quantity || 0;
        const updated = await pcBuildService.upsertItem({
          componentType: selectingSlot,
          variantId: variant.variantId,
          quantity: currentQty + 1,
        });
        console.log('[BuildPC] upsert response items:', JSON.stringify(updated.items?.map(i => ({ id: i.buildItemId, type: i.componentType, qty: i.quantity }))));
        setBuild({ ...updated });
        // Reset ramSlotFull nếu đổi mainboard hoặc xóa RAM
        if (selectingSlot === 'MAINBOARD') setRamSlotFull(false);
        showToast('Đã thêm linh kiện vào cấu hình.', 'success');
      }
      closeModal();
    } catch (err: any) {
      const msg = err.message || '';
      const code = err.code;
      if (code === 10005 || msg.toLowerCase().includes('ram slot')) {
        showToast('Bo mạch chủ đã đầy slot RAM, không thể thêm.', 'error');
        setRamSlotFull(true);
      } else {
        showToast(msg || 'Không thể thêm linh kiện', 'error');
      }
    }
  };

  // ── Remove item via API ──
  const handleRemoveItem = async (buildItemId: number) => {
    if (!build) return;
    const item = build.items.find(i => i.buildItemId === buildItemId);
    try {
      if (item && (item.quantity || 1) > 1) {
        // Xóa item cũ rồi upsert lại với quantity - 1
        await pcBuildService.removeItem(buildItemId);
        const updated = await pcBuildService.upsertItem({
          componentType: item.componentType,
          variantId: item.variantId,
          quantity: item.quantity - 1,
        });
        setBuild({ ...updated });
        if (item.componentType === 'RAM') setRamSlotFull(false);
      } else {
        const updated = await pcBuildService.removeItem(buildItemId);
        setBuild({ ...updated });
        if (item?.componentType === 'RAM' || item?.componentType === 'MAINBOARD') setRamSlotFull(false);
      }      showToast('Đã xóa linh kiện.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Không thể xóa linh kiện', 'error');
    }
  };

  // ── Save build (PUT /pc-builds/draft/save) ──
  const handleSaveBuild = async () => {
    if (!buildName.trim()) { showToast('Vui lòng nhập tên cấu hình', 'warning'); return; }
    setSavingName(true);
    try {
      const updated = await pcBuildService.saveBuild({ buildName: buildName.trim() });
      setBuild(updated);
      await fetchMyBuilds();
      setShowSaveModal(false);
      setBuildName('');
      showToast('Đã lưu cấu hình thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Không thể lưu cấu hình', 'error');
    } finally {
      setSavingName(false);
    }
  };

  // ── Load saved build into draft ──
  const handleLoadBuild = async (b: PCBuildResponse) => {
    try {
      let fullBuild = b;
      if (!b.items || b.items.length === 0) {
        try { fullBuild = await pcBuildService.getBuildById(b.buildId); } catch { fullBuild = b; }
      }
      if (fullBuild.status === 'SAVED' && fullBuild.items?.length > 0) {
        showToast('Đang tải cấu hình vào bản nháp...', 'info');
        let draft: PCBuildResponse | null = null;
        for (const item of fullBuild.items) {
          draft = await pcBuildService.upsertItem({ componentType: item.componentType, variantId: item.variantId, quantity: item.quantity || 1 });
        }
        if (draft) { setBuild(draft); showToast(`Đã tải "${fullBuild.buildName}" vào bản nháp.`, 'success'); }
      } else {
        setBuild(fullBuild);
        showToast(`Đã tải "${fullBuild.buildName || `Build #${fullBuild.buildId}`}"`, 'success');
      }
      window.scrollTo({ top: 300, behavior: 'smooth' });
    } catch (err: any) {
      showToast(err.message || 'Không thể tải cấu hình', 'error');
    }
  };

  // ── Add build to cart ──
  const addBuildToCart = async () => {
    if (!build || build.items.length === 0) {
      showToast('Không có sản phẩm nào trong build', 'warning');
      return;
    }

    if (missingRequired.length > 0) {
      showToast('Cần chọn đủ linh kiện bắt buộc trước khi thêm vào giỏ hàng', 'warning');
      return;
    }

    try {
      setPlacingOrder(true);
      
      // Add each item in build to cart
      for (const item of build.items) {
        const cartItem: any = {
          id: String(item.productId),
          name: item.productName,
          price: item.discountedPrice ?? item.price,
          originalPrice: item.discountedPrice ? item.price : undefined,
          image: item.thumbnailUrl || '',
          brand: item.brandName || '',
          category: item.categoryName || '',
        };
        
        await addToCart(cartItem, item.variantId);
      }
      
      showToast(`Đã thêm ${build.items.length} sản phẩm vào giỏ hàng!`, 'success');
      
      // Ask user if they want to go to cart
      const goToCart = await showConfirm({
        title: 'Thêm thành công',
        message: `Đã thêm ${build.items.length} sản phẩm vào giỏ hàng! Bạn có muốn xem giỏ hàng ngay không?`,
        confirmText: 'Xem giỏ hàng',
        cancelText: 'Tiếp tục build'
      });
      if (goToCart) {
        navigate('/cart');
      }
    } catch (err: any) {
      showToast(err.message || 'Không thể thêm vào giỏ hàng', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  // ── Place order from draft (POST /pc-builds/draft/order) ──
  const submitOrderFromBuild = async () => {
    if (!orderForm.recipientName.trim() || !orderForm.recipientPhone.trim() || !orderForm.shippingAddress.trim()) {
      showToast('Vui lòng nhập đủ thông tin giao hàng', 'warning'); return;
    }
    if (orderForm.paymentMode === 'INSTALLMENT' && !orderForm.packageId) {
      showToast('Vui lòng chọn gói trả góp', 'warning'); return;
    }
    setPlacingOrder(true);
    try {
      const req: any = {
        recipientName: orderForm.recipientName,
        recipientPhone: orderForm.recipientPhone,
        shippingAddress: orderForm.shippingAddress,
        paymentMethod: orderForm.paymentMethod,
        paymentMode: orderForm.paymentMode,
      };
      if (orderForm.paymentMode === 'INSTALLMENT' && orderForm.packageId) req.packageId = orderForm.packageId;

      const order = await pcBuildService.orderFromDraft(req);
      setShowOrderModal(false);
      await fetchMyBuilds();

      if (orderForm.paymentMethod === 'VNPAY') {
        // installmentNo = 0 cho cả FULL và INSTALLMENT (down payment)
        const installmentNo = 0;
        const payment = await paymentService.createPayment(order.orderId, undefined, installmentNo);
        if (!payment.paymentUrl) throw new Error('Không nhận được link thanh toán.');
        paymentService.redirectToPayment(payment.paymentUrl);
        return;
      }
      showToast('Đặt hàng thành công!', 'success');
      navigate(`/orders/${order.orderId}`);
    } catch (err: any) {
      showToast(err.message || 'Không thể đặt hàng', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-['Jost']">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-6xl text-gray-200">build</span>
          <h2 className="text-2xl font-light uppercase tracking-widest">Đăng nhập để Build PC</h2>
          <p className="text-gray-400 text-sm">Cấu hình của bạn sẽ được lưu trên cloud</p>
          <Link to="/login" className="inline-block mt-4 px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-xl">Đăng nhập</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-['Jost']">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-light uppercase tracking-tight text-black">
              Xây dựng <span className="font-bold">Cấu hình PC</span>
            </h1>
            <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest">
              {build?.buildName ? `Cấu hình: ${build.buildName}` : 'Tự tay thiết kế dàn máy trong mơ của bạn'}
            </p>
          </div>
          <div className="bg-black text-white p-6 rounded-2xl shadow-xl min-w-[240px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-1">Tổng cộng dự tính</p>
            <span className="text-3xl font-black">{fmt(build?.totalPrice || 0)}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 mt-12 space-y-6">

          {/* Saved builds list */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Các cấu hình đã tạo</h3>
              <button onClick={fetchMyBuilds} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black">Làm mới</button>
            </div>
            {loadingMyBuilds ? (
              <p className="text-sm text-gray-400">Đang tải...</p>
            ) : myBuilds.filter(b => b.status === 'SAVED').length === 0 ? (
              <p className="text-sm text-gray-400 italic">Chưa có cấu hình nào được lưu.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myBuilds.filter(b => b.status === 'SAVED').map(b => (
                  <div key={b.buildId} onClick={() => handleLoadBuild(b)}
                    className="p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:border-black hover:shadow-sm transition group">
                    <p className="text-xs font-bold text-black truncate group-hover:underline">{b.buildName || `Build #${b.buildId}`}</p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {b.items?.length || 0} linh kiện • {fmt(b.totalPrice || 0)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Component slots */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {COMPONENT_SLOTS.map((slot, index) => {
              const items = getItems(slot);
              const multi = isMultiSlot(slot);
              return (
                <div key={slot} className={`flex flex-col gap-3 p-6 md:p-8 ${index !== COMPONENT_SLOTS.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    {/* Label */}
                    <div className="w-full md:w-1/4 flex items-center gap-3 flex-shrink-0">
                      <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined">{COMPONENT_ICONS[slot]}</span>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">{COMPONENT_DISPLAY_NAMES[slot]}</p>
                        {REQUIRED_COMPONENTS.includes(slot) && <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest">Bắt buộc</span>}
                        {multi && <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest block">Nhiều slot</span>}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="flex-1 w-full space-y-2">
                      {items.length === 0 ? (
                        <p className="text-sm text-gray-300 italic">Chưa chọn linh kiện</p>
                      ) : items.flatMap((it) =>
                        // Expand theo quantity: 1 item qty=2 → hiển thị 2 dòng
                        Array.from({ length: it.quantity || 1 }, (_, qIdx) => (
                          <div key={`${it.buildItemId}-${qIdx}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition">
                            <img src={it.thumbnailUrl || '/placeholder.png'} alt={it.productName}
                              className="w-12 h-12 object-cover rounded-lg bg-gray-50 flex-shrink-0"
                              onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.src = '/placeholder.png'; }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-black truncate">{it.productName}</p>
                              <p className="text-xs text-gray-400">{it.variantName}</p>
                              <p className="text-xs font-bold text-gray-700 mt-0.5">{fmt(it.price)}</p>
                            </div>
                            <button onClick={() => openSlot(slot, it.buildItemId)} title="Thay thế"
                              className="p-1.5 hover:bg-gray-100 text-gray-300 hover:text-gray-600 rounded-lg transition flex-shrink-0">
                              <span className="material-symbols-outlined text-base">swap_horiz</span>
                            </button>
                            <button onClick={() => handleRemoveItem(it.buildItemId)} title="Xóa"
                              className="p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition flex-shrink-0">
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      {(multi || items.length === 0) && (
                        <button onClick={() => openSlot(slot)}
                          disabled={multi && slot === 'RAM' && isRamSlotFull}
                          title={multi && slot === 'RAM' && isRamSlotFull ? 'Bo mạch chủ đã đầy slot RAM' : undefined}
                          className="px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-black text-white hover:bg-gray-800 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                          {multi ? '+ Thêm' : 'Chọn'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Missing required warning */}
          {missingRequired.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-700">
              Còn thiếu: {missingRequired.map(c => COMPONENT_DISPLAY_NAMES[c]).join(', ')}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4">
            <Link to="/shop" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">arrow_back</span>Tiếp tục mua sắm
            </Link>
            <div className="flex gap-3 w-full md:w-auto">
              <button onClick={() => setShowSaveModal(true)} disabled={!build || build.items.length === 0}
                className="flex-1 md:flex-none px-7 py-3.5 border border-black text-black text-[11px] font-bold uppercase tracking-widest hover:bg-gray-50 transition rounded-xl disabled:opacity-40 disabled:cursor-not-allowed">
                Lưu cấu hình
              </button>
              <button onClick={addBuildToCart}
                disabled={!build || build.items.length === 0 || placingOrder}
                className="flex-1 md:flex-none px-9 py-3.5 bg-black text-white text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition rounded-xl shadow-xl shadow-black/20 disabled:opacity-40 disabled:cursor-not-allowed">
                {placingOrder ? 'Đang thêm...' : 'Đặt hàng ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product selection modal */}
      {selectingSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold uppercase tracking-tight">
                {replacingItemId ? 'Thay thế' : 'Chọn'} {COMPONENT_DISPLAY_NAMES[selectingSlot]}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {slotLoading ? (
                <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
              ) : slotProducts.length > 0 ? slotProducts.map(product => (
                <div key={product.productId} onClick={() => handleSelectProduct(product)}
                  className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:border-black hover:shadow-md transition cursor-pointer group">
                  <img src={product.thumbnailUrl || '/placeholder.png'} alt={product.name}
                    className="w-14 h-14 object-cover rounded-xl bg-gray-50 group-hover:scale-105 transition"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.src = '/placeholder.png'; }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.brandName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-black">{fmt(product.discountedPrice ?? product.basePrice)}</p>
                    {product.discountedPrice && <p className="text-xs text-red-400 line-through">{fmt(product.basePrice)}</p>}
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-200 block mb-3">inventory_2</span>
                  <p className="text-gray-400 text-sm">Không tìm thấy sản phẩm phù hợp</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSaveModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Lưu cấu hình</h2>
            <input type="text" placeholder="Tên cấu hình (VD: Gaming Build 2025)" value={buildName}
              onChange={e => setBuildName(e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSaveBuild()}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black mb-4" />
            <div className="flex gap-3">
              <button onClick={handleSaveBuild} disabled={savingName}
                className="flex-1 bg-black text-white py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50">
                {savingName ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button onClick={() => setShowSaveModal(false)}
                className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Order modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowOrderModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-bold mb-5">Đặt hàng từ cấu hình</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Người nhận" value={orderForm.recipientName}
                onChange={e => setOrderForm(p => ({ ...p, recipientName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black" />
              <input type="tel" placeholder="Số điện thoại" value={orderForm.recipientPhone}
                onChange={e => setOrderForm(p => ({ ...p, recipientPhone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black" />
              <input type="text" placeholder="Địa chỉ giao hàng" value={orderForm.shippingAddress}
                onChange={e => setOrderForm(p => ({ ...p, shippingAddress: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black" />

              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { label: 'COD', method: 'COD' as const, mode: 'FULL' as const },
                  { label: 'VNPay đầy đủ', method: 'VNPAY' as const, mode: 'FULL' as const },
                  { label: 'Trả góp VNPay', method: 'VNPAY' as const, mode: 'INSTALLMENT' as const },
                ].map(opt => (
                  <button key={opt.label}
                    onClick={() => setOrderForm(p => ({ ...p, paymentMethod: opt.method, paymentMode: opt.mode, packageId: undefined }))}
                    className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition ${
                      orderForm.paymentMethod === opt.method && orderForm.paymentMode === opt.mode
                        ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}>{opt.label}</button>
                ))}
              </div>

              {orderForm.paymentMode === 'INSTALLMENT' && (
                <select value={orderForm.packageId ?? ''}
                  onChange={e => setOrderForm(p => ({ ...p, packageId: Number(e.target.value) || undefined }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black">
                  <option value="">Chọn gói trả góp</option>
                  {installmentPackages.map(p => (
                    <option key={p.packageId} value={p.packageId}>
                      {p.name} — {p.durationMonths} tháng — {p.interestRate}% lãi
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={submitOrderFromBuild} disabled={placingOrder}
                className="flex-1 bg-black text-white py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50">
                {placingOrder ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
              </button>
              <button onClick={() => setShowOrderModal(false)}
                className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildPC;
