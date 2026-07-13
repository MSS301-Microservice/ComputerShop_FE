import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../api/services/orderService';
import { paymentService } from '../../api/services/paymentService';
import { warrantyService } from '../../api/services/warrantyService';
import { OrderResponse } from '../../api/types/order';
import { WarrantyResponse, WarrantyStatus } from '../../api/types/warranty';
import { showToast, showConfirm } from '../../components/ui/Toast';
import { 
  ORDER_STATUS_LABELS, 
  canCancelOrder,
  type OrderStatus 
} from '../../constants/orderStatus';

const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const statusLabel: Record<string, { label: string; color: string }> = {
  PENDING:    { label: ORDER_STATUS_LABELS.PENDING,    color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED:  { label: ORDER_STATUS_LABELS.CONFIRMED,  color: 'bg-blue-100 text-blue-700' },
  PROCESSING: { label: ORDER_STATUS_LABELS.PROCESSING, color: 'bg-cyan-100 text-cyan-700' },
  SHIPPED:    { label: ORDER_STATUS_LABELS.SHIPPED,    color: 'bg-indigo-100 text-indigo-700' },
  DELIVERED:  { label: ORDER_STATUS_LABELS.DELIVERED,  color: 'bg-green-100 text-green-700' },
  CANCELLED:  { label: ORDER_STATUS_LABELS.CANCELLED,  color: 'bg-red-100 text-red-700' },
  PAID:       { label: 'Đã thanh toán',                color: 'bg-emerald-100 text-emerald-700' },
  FAILED:     { label: 'Thất bại',                     color: 'bg-gray-100 text-gray-500' },
};

const WARRANTY_STATUS: Record<WarrantyStatus, { label: string; color: string }> = {
  ACTIVE:  { label: 'Còn hiệu lực', color: 'text-green-700 bg-green-50 border-green-200' },
  EXPIRED: { label: 'Hết hạn',      color: 'text-gray-500 bg-gray-100 border-gray-200' },
  VOIDED:  { label: 'Đã hủy',       color: 'text-red-500 bg-red-50 border-red-200' },
};

const CLAIM_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'Chờ xử lý',  color: 'text-amber-700 bg-amber-50' },
  PROCESSING: { label: 'Đang xử lý', color: 'text-blue-700 bg-blue-50' },
  COMPLETED:  { label: 'Hoàn thành', color: 'text-green-700 bg-green-50' },
  REJECTED:   { label: 'Từ chối',    color: 'text-red-600 bg-red-50' },
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [payingNext, setPayingNext] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [error, setError] = useState('');
  const [warranties, setWarranties] = useState<WarrantyResponse[]>([]);
  const [expandedWarranty, setExpandedWarranty] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!id) return;
    orderService.getOrderById(Number(id))
      .then(o => {
        console.log('[OrderDetail] order response:', JSON.stringify(o));
        setOrder(o);
        warrantyService.getByOrderId(o.orderId).then(setWarranties).catch(() => {});
      })
      .catch(() => setError('Không tìm thấy đơn hàng.'))
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  const handleCancel = async () => {
    if (!order) return;
    const ok = await showConfirm({ title: 'Hủy đơn hàng', message: 'Bạn có chắc muốn hủy đơn hàng này?', confirmText: 'Hủy đơn', cancelText: 'Giữ lại', danger: true });
    if (!ok) return;
    setCancelling(true);
    try {
      await orderService.cancelOrder(order.orderId);
      setOrder({ ...order, status: 'CANCELLED' });
      showToast('Đã hủy đơn hàng thành công.', 'success');
    } catch {
      showToast('Không thể hủy đơn hàng. Vui lòng thử lại.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handlePayNextInstallment = async () => {
    if (!order) return;
    setPayingNext(true);
    try {
    const nextUnpaid = order.payments?.find(p => p.status === 'UNPAID' || p.status === 'OVERDUE');
      const payment = await paymentService.createPayment(
        order.orderId,
        undefined,
        nextUnpaid?.installmentNo
      );
      if (!payment.paymentUrl) throw new Error('Không nhận được link thanh toán.');
      paymentService.redirectToPayment(payment.paymentUrl);
    } catch (err: any) {
      console.error('Payment error:', err);
      showToast(err.message || 'Không thể tạo link thanh toán. Vui lòng thử lại.', 'error');
      setPayingNext(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!order) return;
    setRetryingPayment(true);
    try {
      // Thử không truyền installmentNo cho FULL payment
      const payment = await paymentService.createPayment(order.orderId, undefined, undefined);
      if (!payment.paymentUrl) throw new Error('Không nhận được link thanh toán.');
      paymentService.redirectToPayment(payment.paymentUrl);
    } catch (err: any) {
      showToast(err.message || 'Không thể tạo link thanh toán. Vui lòng thử lại.', 'error');
      setRetryingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 font-['Jost'] text-center text-gray-400">
        <p>{error || 'Không tìm thấy đơn hàng.'}</p>
        <button onClick={() => navigate('/orders')} className="mt-6 text-sm underline">Quay lại đơn hàng</button>
      </div>
    );
  }

  const st = statusLabel[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-500' };
  const date = order.orderDate || order.createdAt;
  const canCancel = canCancelOrder(order.status as OrderStatus);
  const isInstallmentOrder =
    order.paymentMode === 'INSTALLMENT' || order.paymentType === 'INSTALLMENT';

  // Đơn VNPAY FULL chưa thanh toán → cho phép thanh toán lại
  const isFullVnpay = order.paymentMethod === 'VNPAY' && !isInstallmentOrder;
  const isUnpaidFull = isFullVnpay && (
    !order.payments || order.payments.length === 0 ||
    !order.payments.some(p => p.status === 'PAID')
  ) && !['CANCELLED', 'COMPLETED'].includes(order.status);

  // Lấy thông tin giao hàng từ item đầu tiên nếu không có ở root
  const firstItem = order.items?.[0] as any;
  const recipientName = order.recipientName || firstItem?.recipientName;
  const recipientPhone = order.recipientPhone || firstItem?.recipientPhone;
  const shippingAddress = order.shippingAddress || firstItem?.shippingAddress;

  // Find next unpaid installment
  const nextUnpaid = order.payments?.find(p => p.status === 'UNPAID' || p.status === 'OVERDUE');
  const hasUnpaidInstallment = isInstallmentOrder && !!nextUnpaid;
  const paidCount = order.payments?.filter(p => p.status === 'PAID').length ?? 0;
  const totalCount = order.payments?.length ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-['Jost']">
      {/* Back */}
      <button onClick={() => navigate('/orders')} className="flex items-center gap-1 text-xs text-gray-400 uppercase tracking-widest mb-8 hover:text-black transition">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Đơn hàng của tôi
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-light uppercase tracking-tight text-black">
            Đơn hàng <span className="font-bold">#{order.orderId}</span>
          </h1>
          {date && (
            <p className="text-sm text-gray-400 mt-1">
              Ngày đặt: {new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${st.color}`}>
          {st.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 pb-2 border-b border-gray-50">Sản phẩm</h3>
            <div className="space-y-4">
              {(order.items ?? []).map((item) => (
                <div key={item.orderItemId} className="flex items-center gap-4">
                  {item.thumbnailUrl && (
                    <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.thumbnailUrl} alt={item.productName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black truncate">{item.productName}</p>
                    {item.variantName && <p className="text-xs text-gray-400">{item.variantName}</p>}
                    {item.serialNumber && <p className="text-[10px] text-gray-300">S/N: {item.serialNumber}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">x{item.quantity}</p>
                    <p className="text-sm font-bold text-black">{fmt(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Installment schedule - chỉ hiện cho đơn trả góp */}
          {isInstallmentOrder && order.payments && order.payments.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-50">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Lịch trả góp
                </h3>
                <span className="text-[10px] font-bold text-gray-400">
                  {paidCount}/{totalCount} kỳ đã trả
                </span>
              </div>
              <div className="space-y-3">
                {order.payments.map((p, idx) => {
                  const isPaid = p.status === 'PAID';
                  const pid = p.paymentScheduleId ?? p.scheduleId;
                  const nextPid = nextUnpaid?.paymentScheduleId ?? nextUnpaid?.scheduleId;
                  const isNext = pid === nextPid;
                  const isOverdue = p.status === 'OVERDUE';
                  // Hiển thị penalty cho cả OVERDUE và PAID nếu có penalty amount
                  const hasPenalty = p.penaltyAmount && p.penaltyAmount > 0;
                  const totalAmount = p.amount + (hasPenalty ? p.penaltyAmount : 0);
                  
                  return (
                    <div key={p.paymentScheduleId ?? p.scheduleId ?? idx} className={`flex items-center justify-between text-sm p-3 rounded-xl ${isNext ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isPaid ? 'bg-green-500 text-white' : isOverdue ? 'bg-red-400 text-white' : isNext ? 'bg-amber-400 text-white' : 'bg-gray-200 text-gray-500'}`}>
                          {isPaid ? '✓' : idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-black text-xs">
                            {idx === 0 ? 'Trả trước' : `Kỳ ${idx}`} — {new Date(p.dueDate).toLocaleDateString('vi-VN')}
                          </p>
                          {p.paidDate && <p className="text-[10px] text-gray-400">Đã trả: {new Date(p.paidDate).toLocaleDateString('vi-VN')}</p>}
                          {hasPenalty && (
                            <p className="text-[10px] text-red-500 font-medium">
                              + Phí phạt: {fmt(p.penaltyAmount)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          {hasPenalty ? (
                            <>
                              <p className={`font-bold text-sm ${isPaid ? 'text-green-600' : 'text-red-600'}`}>{fmt(totalAmount)}</p>
                              <p className="text-[10px] text-gray-400 line-through">{fmt(p.amount)}</p>
                            </>
                          ) : (
                            <p className="font-bold text-sm">{fmt(p.amount)}</p>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          isPaid ? 'bg-green-100 text-green-700' :
                          isOverdue ? 'bg-red-100 text-red-700' :
                          isNext ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {isPaid ? 'Đã trả' : isOverdue ? 'Quá hạn' : isNext ? 'Cần trả' : 'Chờ'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Warranties */}
          {warranties.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 pb-2 border-b border-gray-50 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">verified_user</span>
                Bảo hành ({warranties.length})
              </h3>
              <div className="space-y-3">
                {warranties.map(w => {
                  const si = WARRANTY_STATUS[w.status];
                  const daysLeft = Math.ceil((new Date(w.endDate).getTime() - Date.now()) / 86400000);
                  const isOpen = expandedWarranty === w.id;
                  return (
                    <div key={w.id} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedWarranty(isOpen ? null : w.id)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-black truncate">{w.productName}</p>
                          {w.serialNumber && <p className="text-[10px] text-gray-400">S/N: {w.serialNumber}</p>}
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border flex-shrink-0 ${si.color}`}>
                          {si.label}
                        </span>
                        <span className="material-symbols-outlined text-base text-gray-400 flex-shrink-0">
                          {isOpen ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Bắt đầu</p>
                              <p className="font-medium">{new Date(w.startDate).toLocaleDateString('vi-VN')}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Hết hạn</p>
                              <p className="font-medium">{new Date(w.endDate).toLocaleDateString('vi-VN')}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Loại</p>
                              <p className="font-medium">{w.type === 'MANUFACTURER' ? 'Hãng' : 'Cửa hàng'}</p>
                            </div>
                            {w.status === 'ACTIVE' && (
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Còn lại</p>
                                <p className={`font-bold ${daysLeft <= 30 ? 'text-amber-500' : 'text-green-600'}`}>
                                  {daysLeft > 0 ? `${daysLeft} ngày` : 'Hết hạn hôm nay'}
                                </p>
                              </div>
                            )}
                          </div>

                          {w.description && (
                            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{w.description}</p>
                          )}

                          {w.claims && w.claims.length > 0 && (
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Yêu cầu bảo hành ({w.claims.length})</p>
                              <div className="space-y-1.5">
                                {w.claims.map(c => {
                                  const cs = CLAIM_STATUS[c.status] ?? { label: c.status, color: 'text-gray-500 bg-gray-50' };
                                  return (
                                    <div key={c.claimId ?? `claim-${c.claimDate}`} className="flex flex-wrap items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
                                      <span className="text-gray-400">{new Date(c.claimDate).toLocaleDateString('vi-VN')}</span>
                                      <span className="flex-1 min-w-0 text-gray-700 truncate">{c.customerNote || '—'}</span>
                                      {c.technicianNote && <span className="text-blue-500 italic truncate max-w-[140px]">{c.technicianNote}</span>}
                                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${cs.color}`}>{cs.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Shipping info */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 pb-2 border-b border-gray-50">Thông tin giao hàng</h3>
            <div className="space-y-2 text-sm">
              {(recipientName) ? (
                <>
                  <p className="font-bold text-black">{recipientName}</p>
                  <p className="text-gray-500">{recipientPhone}</p>
                  <p className="text-gray-500">{shippingAddress}</p>
                  {order.notes && <p className="text-gray-400 text-xs italic">{order.notes}</p>}
                </>
              ) : (
                <p className="text-gray-300 italic text-xs">Không có thông tin giao hàng</p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 pb-2 border-b border-gray-50">Tổng cộng</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Phương thức</span>
                <span className="font-bold">
                  {order.paymentMethod === 'COD' ? 'Tiền mặt (COD)' : 'VNPay'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Hình thức</span>
                <span className="font-bold">{isInstallmentOrder ? 'Trả góp' : 'Đầy đủ'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Thanh toán</span>
                {(() => {
                  const paid = order.payments?.every(p => p.status === 'PAID');
                  const hasPaid = order.payments?.some(p => p.status === 'PAID');
                  return paid
                    ? <span className="font-bold text-green-600">Đã thanh toán</span>
                    : hasPaid
                    ? <span className="font-bold text-amber-600">Thanh toán một phần</span>
                    : <span className="font-bold text-red-500">Chưa thanh toán</span>;
                })()}
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-gray-50">
                <span className="text-xs font-bold uppercase tracking-widest">Tổng tiền</span>
                <span className="text-xl font-black text-black">{fmt(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Pay next installment */}
          {hasUnpaidInstallment && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Kỳ thanh toán tiếp theo</p>
              {(() => {
                const isOverdue = nextUnpaid!.status === 'OVERDUE';
                const hasPenalty = isOverdue && nextUnpaid!.penaltyAmount && nextUnpaid!.penaltyAmount > 0;
                const totalAmount = nextUnpaid!.amount + (hasPenalty ? nextUnpaid!.penaltyAmount : 0);
                
                return (
                  <>
                    {hasPenalty ? (
                      <div className="mb-3">
                        <p className="text-2xl font-black text-red-600 mb-1">{fmt(totalAmount)}</p>
                        <p className="text-sm text-amber-600 line-through">{fmt(nextUnpaid!.amount)}</p>
                        <p className="text-xs text-red-500 font-medium">+ Phí phạt: {fmt(nextUnpaid!.penaltyAmount)}</p>
                      </div>
                    ) : (
                      <p className="text-2xl font-black text-amber-700 mb-3">{fmt(nextUnpaid!.amount)}</p>
                    )}
                  </>
                );
              })()}
              <p className="text-xs text-amber-600 mb-4">Hạn: {new Date(nextUnpaid!.dueDate).toLocaleDateString('vi-VN')}</p>
              <button
                onClick={handlePayNextInstallment}
                disabled={payingNext}
                className="w-full py-3 bg-amber-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-amber-600 transition disabled:opacity-50"
              >
                {payingNext ? 'Đang xử lý...' : 'Thanh toán ngay'}
              </button>
            </div>
          )}

          {/* Cancel */}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full py-3 border-2 border-red-200 text-red-500 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-red-50 transition disabled:opacity-50"
            >
              {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
