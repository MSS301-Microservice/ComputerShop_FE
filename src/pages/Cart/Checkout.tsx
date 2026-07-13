import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../api/services/userService';
import { orderService } from '../../api/services/orderService';
import { paymentService } from '../../api/services/paymentService';
import { installmentService } from '../../api/services/installmentService';
import { InstallmentPackageResponse, InstallmentPreviewResponse } from '../../api/types/installment';
import { showToast } from '../../components/ui/Toast';


const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('vi-VN');

const Checkout: React.FC = () => {
  const {
    cart,
    totalPrice,
    selectedItems,
    selectedTotalPrice,
    refreshCart
  } = useCart();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'full' | 'installment'>('cod');
  const [installmentPackages, setInstallmentPackages] = useState<InstallmentPackageResponse[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<InstallmentPackageResponse | null>(null);
  const [preview, setPreview] = useState<InstallmentPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phoneNumber: '', address: '' });
  // Đơn đã đặt thành công thì bỏ qua cảnh báo "giỏ hàng trống" bên dưới —
  // tránh toast/redirect thừa khi backend đã tự xóa cart item sau khi đặt hàng.
  const orderPlacedRef = useRef(false);

  // Get selected cart items only
  const selectedCartItems = cart.filter(item => item.cartItemId && selectedItems.includes(item.cartItemId));
  const checkoutPrice = selectedTotalPrice; // Use selected total price instead of total price

  useEffect(() => {
    if (authUser) {
      userService.getMyProfile().then(p => {
        setFormData({ fullName: p.username || '', phoneNumber: p.phoneNumber || '', address: '' });
      }).catch(() => {});
    }
  }, [authUser]);

  useEffect(() => {
    installmentService.getActivePackages().then(pkgs => {
      setInstallmentPackages(pkgs);
      if (pkgs.length > 0) setSelectedPackage(pkgs[0]);
    }).catch(() => {});
  }, []);

  const fetchPreview = useCallback(async (pkg: InstallmentPackageResponse) => {
    setPreviewLoading(true);
    setPreview(null);
    try {
      const result = await installmentService.calculatePreview({ packageId: pkg.packageId, orderAmount: checkoutPrice });
      setPreview(result);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [checkoutPrice]);

  useEffect(() => {
    if (paymentMethod === 'installment' && selectedPackage) {
      fetchPreview(selectedPackage);
    }
  }, [paymentMethod, selectedPackage, fetchPreview]);

  useEffect(() => {
    if (orderPlacedRef.current) return;
    if (selectedCartItems.length === 0) {
      showToast('Vui lòng chọn sản phẩm để thanh toán', 'warning');
      navigate('/cart');
    }
  }, [selectedCartItems.length, navigate]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authUser) {
      showToast('Vui lòng đăng nhập để đặt hàng', 'warning');
      navigate('/login');
      return;
    }

    if (!formData.fullName.trim() || !formData.phoneNumber.trim() || !formData.address.trim()) {
      showToast('Vui lòng điền đầy đủ thông tin giao hàng', 'warning');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Map payment method to backend format
      const backendPaymentMethod = paymentMethod === 'cod' ? 'COD' : 'VNPAY';
      const backendPaymentMode = paymentMethod === 'installment' ? 'INSTALLMENT' : 'FULL';

      // Get variant IDs from selected cart items
      const variantIds = selectedCartItems
        .map(item => item.variantId || parseInt(item.id))
        .filter(id => !isNaN(id));

      const orderData: any = {
        recipientName: formData.fullName,
        recipientPhone: formData.phoneNumber,
        shippingAddress: formData.address,
        paymentMethod: backendPaymentMethod,
        paymentMode: backendPaymentMode,
        variantIds: variantIds, // Add selected variant IDs
      };

      // Only add packageId if payment mode is installment
      if (paymentMethod === 'installment' && selectedPackage) {
        orderData.packageId = selectedPackage.packageId;
      }

      console.log('Creating order with data:', orderData);
      const order = await orderService.placeOrder(orderData);
      console.log('Order created:', order);
      orderPlacedRef.current = true;

      // If payment method is full (VNPay) OR installment, redirect to VNPay
      if (paymentMethod === 'full' || paymentMethod === 'installment') {
        try {
          const payment = await paymentService.createPayment(order.orderId, undefined, 0);
          if (!payment.paymentUrl) throw new Error('Không nhận được link thanh toán từ server.');
          paymentService.redirectToPayment(payment.paymentUrl);
          return;
        } catch (paymentError: any) {
          console.error('Payment error:', paymentError);
          setIsProcessing(false);
          showToast(paymentError.message || 'Đơn hàng đã được tạo nhưng không thể tạo link thanh toán. Vui lòng vào trang đơn hàng để thanh toán lại.', 'error');
          navigate(`/orders/${order.orderId}`);
          return;
        }
      }

      // For COD, backend đã tự xóa các cart item vừa đặt hàng — chỉ cần
      // đồng bộ lại cart từ server (không tự ý xóa lại, tránh gọi xóa item
      // đã không còn tồn tại).
      setIsProcessing(false);
      showToast('Đặt hàng thành công! Cảm ơn bạn đã mua sắm.', 'success');
      await refreshCart();
      navigate('/orders');

    } catch (error: any) {
      setIsProcessing(false);
      console.error('Order error:', error);
      showToast(error.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.', 'error');
    }
  };

  if (selectedCartItems.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 font-['Jost']">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Checkout Form */}
        <div className="flex-1">
          <h1 className="text-4xl font-light uppercase tracking-tight text-black mb-10">
            Thanh <span className="font-bold">Toán</span>
          </h1>

          <form onSubmit={handlePlaceOrder} className="space-y-12">
            {/* Shipping Info */}
            <section>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-100 pb-2">Thông tin giao hàng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Họ và tên</label>
                  <input 
                    type="text" 
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="w-full bg-gray-50 border-none p-4 text-sm rounded-xl focus:ring-1 focus:ring-black outline-none transition"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Số điện thoại</label>
                  <input 
                    type="tel" 
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                    className="w-full bg-gray-50 border-none p-4 text-sm rounded-xl focus:ring-1 focus:ring-black outline-none transition"
                    placeholder="0901 234 567"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Địa chỉ nhận hàng</label>
                  <input 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    className="w-full bg-gray-50 border-none p-4 text-sm rounded-xl focus:ring-1 focus:ring-black outline-none transition"
                    placeholder="Số nhà, tên đường, phường/xã..."
                  />
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-100 pb-2">Phương thức thanh toán</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-3 ${paymentMethod === 'cod' ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <span className="material-symbols-outlined">local_shipping</span>
                  <span className="text-xs font-bold uppercase tracking-widest">Khi nhận hàng (COD)</span>
                  <span className="text-[10px] opacity-60">Thanh toán khi nhận hàng</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('full')}
                  className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-3 ${paymentMethod === 'full' ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <span className="material-symbols-outlined">account_balance</span>
                  <span className="text-xs font-bold uppercase tracking-widest">Thanh toán đầy đủ</span>
                  <span className="text-[10px] opacity-60">Thanh toán qua VNPay</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('installment')}
                  className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-3 ${paymentMethod === 'installment' ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <span className="material-symbols-outlined">credit_card</span>
                  <span className="text-xs font-bold uppercase tracking-widest">Trả góp 0%</span>
                  <span className="text-[10px] opacity-60">Chia nhỏ theo tháng</span>
                </button>
              </div>

              {/* VNPay info */}
              {paymentMethod === 'full' && (
                <div className="mt-6 p-6 bg-blue-50 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
                    <div>
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">Thanh toán qua VNPay</p>
                      <p className="text-sm text-blue-600">
                        Sau khi đặt hàng, bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất giao dịch.
                        Hỗ trợ thẻ ATM nội địa, thẻ Visa/Mastercard và QR Code.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'installment' && (
                <div className="mt-8 p-8 bg-gray-50 rounded-3xl">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">Chọn gói trả góp</h4>
                  {installmentPackages.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Không có gói trả góp khả dụng.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        {installmentPackages.map(pkg => (
                          <button key={pkg.packageId} type="button"
                            onClick={() => setSelectedPackage(pkg)}
                            className={`py-4 px-2 rounded-xl text-xs font-bold transition-all text-center ${selectedPackage?.packageId === pkg.packageId ? 'bg-black text-white' : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-300'}`}>
                            {pkg.durationMonths} tháng
                            {pkg.interestRate > 0
                              ? <span className="block text-[9px] mt-0.5 opacity-70">{pkg.interestRate}% lãi</span>
                              : <span className="block text-[9px] mt-0.5 text-emerald-400">0% lãi</span>}
                          </button>
                        ))}
                      </div>

                      {selectedPackage && totalPrice < selectedPackage.minOrderAmount && (
                        <p className="text-xs text-red-500 mb-4">⚠ Đơn hàng chưa đạt giá trị tối thiểu {fmt(selectedPackage.minOrderAmount)} để áp dụng gói này.</p>
                      )}

                      {previewLoading && (
                        <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                          Đang tính toán lịch trả góp...
                        </div>
                      )}

                      {preview && !previewLoading && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-black rounded-2xl">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Trả trước ({preview.downPaymentPercentage}%)</p>
                              <p className="text-lg font-black text-white">{fmt(preview.downPaymentAmount)}</p>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Mỗi tháng × {preview.durationMonths}</p>
                              <p className="text-lg font-black text-black">{fmt(preview.monthlyInstallmentAmount)}</p>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 px-1">
                            <span>Tổng thanh toán</span>
                            <span className="font-bold text-black">{fmt(preview.totalPayableAmount)}</span>
                          </div>
                          <div className="mt-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Lịch thanh toán dự kiến</p>
                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                              {preview.schedule.map((s, i) => (
                                <div key={s.installmentNo} className={`flex items-center justify-between text-xs p-3 rounded-xl ${i === 0 ? 'bg-amber-50 border border-amber-100' : 'bg-white border border-gray-50'}`}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                      {s.installmentNo}
                                    </div>
                                    <span className="text-gray-600">{i === 0 ? 'Trả trước — ' : `Kỳ ${s.installmentNo} — `}{fmtDate(s.dueDate)}</span>
                                  </div>
                                  <span className="font-bold text-gray-900">{fmt(s.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>

            <button 
              type="submit"
              disabled={isProcessing}
              className="w-full bg-black text-white py-6 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition rounded-2xl shadow-2xl shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing
                ? 'Đang xử lý...'
                : paymentMethod === 'full'
                  ? 'Đặt hàng & Thanh toán VNPay'
                  : paymentMethod === 'installment'
                    ? 'Đặt hàng & Thanh toán trả trước'
                    : 'Xác nhận đặt hàng (COD)'
              }
            </button>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full lg:w-96">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 sticky top-32 shadow-2xl shadow-black/5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black mb-8 border-b border-gray-50 pb-4">Đơn hàng của bạn</h3>
            
            <div className="max-h-[300px] overflow-y-auto mb-8 space-y-4 pr-2">
              {selectedCartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-black truncate">{item.name}</h4>
                    <p className="text-[10px] text-gray-400">SL: {item.quantity}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-black">{fmt(item.price * item.quantity)}</p>
                    {item.originalPrice && (
                      <p className="text-[10px] text-red-400 line-through">{fmt(item.originalPrice * item.quantity)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-50">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Sản phẩm đã chọn</span>
                <span className="font-bold text-black">{selectedCartItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tổng tiền hàng</span>
                <span className="font-bold text-black">{fmt(checkoutPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Phí vận chuyển</span>
                <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest">Miễn phí</span>
              </div>

              {/* Installment breakdown from API preview */}
              {paymentMethod === 'installment' && preview && (
                <div className="pt-3 border-t border-gray-50 space-y-2">
                  <div className="flex justify-between items-center py-2 px-3 bg-black rounded-xl">
                    <div>
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Trả trước ({preview.downPaymentPercentage}%)</p>
                      <p className="text-[10px] text-gray-400">Thanh toán ngay hôm nay</p>
                    </div>
                    <span className="text-sm font-black text-white">{fmt(preview.downPaymentAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Mỗi tháng × {preview.durationMonths}</p>
                      <p className="text-[10px] text-gray-400">Tháng tiếp theo trở đi</p>
                    </div>
                    <span className="text-sm font-black text-gray-700">{fmt(preview.monthlyInstallmentAmount)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-end">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-black">Tổng thanh toán</span>
                      <p className="text-[10px] text-gray-400 mt-0.5">Bao gồm lãi suất {preview.interestRate}%</p>
                    </div>
                    <p className="text-2xl font-black text-amber-600 leading-none">{fmt(preview.totalPayableAmount)}</p>
                  </div>
                </div>
              )}

              {paymentMethod !== 'installment' && (
                <div className="pt-4 border-t border-gray-50 flex justify-between items-end">
                  <span className="text-xs font-bold uppercase tracking-widest text-black">Tổng thanh toán</span>
                  <p className="text-2xl font-black text-black leading-none">{fmt(checkoutPrice)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
