import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import { orderService } from '../../api/services/orderService';
import { warrantyService } from '../../api/services/warrantyService';
import { OrderResponse } from '../../api/types/order';
import { WarrantyResponse, WarrantyStatus } from '../../api/types/warranty';
import { showToast } from '../../components/ui/Toast';
import { 
  ORDER_STATUS_LABELS, 
  ORDER_STATUS_COLORS, 
  getNextOrderStatuses,
  type OrderStatus 
} from '../../constants/orderStatus';

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

  const getStatusColor = (status: string) => {
    return ORDER_STATUS_COLORS[status as OrderStatus] || 'bg-gray-100 text-gray-600';
  };

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warranties, setWarranties] = useState<WarrantyResponse[]>([]);
  const [expandedWarranty, setExpandedWarranty] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getOrderById(Number(id));
      setOrder(data);
      warrantyService.getByOrderId(data.orderId).then(setWarranties).catch(() => {});
    } catch (err: any) {
      setError(err.message || 'Failed to load order details');
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!order) return;
    try {
      await orderService.updateOrderStatus(order.orderId, { status });
      showToast('Cập nhật trạng thái đơn hàng thành công', 'success');
      fetchOrderDetail();
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    return ORDER_STATUS_COLORS[status as OrderStatus] || 'bg-gray-100 text-gray-600';
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID': return 'bg-green-100 text-green-600';
      case 'UNPAID': return 'bg-orange-100 text-orange-600';
      case 'OVERDUE': return 'bg-red-100 text-red-600';
      case 'FAILED': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID': return 'Đã thanh toán';
      case 'UNPAID': return 'Chưa thanh toán';
      case 'OVERDUE': return 'Quá hạn';
      case 'FAILED': return 'Thất bại';
      default: return status;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  if (loading) {
    return (
      <AdminLayout title="Chi Tiết Đơn Hàng" requiredRole="staff">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout title="Chi Tiết Đơn Hàng" requiredRole="staff">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">{error || 'Order not found'}</p>
          <button onClick={() => navigate('/admin/orders')} className="text-xs underline mt-2 hover:text-red-800">
            Quay lại danh sách
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={`Đơn Hàng #${order.orderId}`}
      subtitle="Chi tiết thông tin đơn hàng"
      requiredRole="staff"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Quay lại</span>
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Trạng thái:</span>
            {(() => {
              const nextStatuses = getNextOrderStatuses(order.status as OrderStatus);
              if (nextStatuses.length === 0) {
                // Terminal state - chỉ hiển thị trạng thái hiện tại
                return (
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-full ${getStatusColor(order.status)}`}>
                    {ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status}
                  </span>
                );
              }
              
              // Có thể chuyển trạng thái - hiển thị dropdown với trạng thái hiện tại + các trạng thái có thể chuyển
              const availableStatuses = [order.status, ...nextStatuses];
              return (
                <select 
                  value={order.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  className={`text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-full border-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${getStatusColor(order.status)}`}
                >
                  {availableStatuses.map(status => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status as OrderStatus] || status}
                    </option>
                  ))}
                </select>
              );
            })()}
          </div>
        </div>

        {/* Order Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Thông tin khách hàng</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Tên khách hàng</p>
                <p className="text-sm font-bold text-gray-900">{order.username || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">User ID</p>
                <p className="text-sm font-bold text-gray-900">{order.userId}</p>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Thông tin đơn hàng</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Ngày đặt</p>
                <p className="text-sm font-bold text-gray-900">{formatDate(order.orderDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Hình thức thanh toán</p>
                <p className="text-sm font-bold text-gray-900">
                  {order.paymentMethod === 'COD' ? 'Tiền mặt (COD)' : 'VNPay'}
                  {' · '}
                  {order.paymentMode === 'INSTALLMENT' || order.paymentType === 'INSTALLMENT' ? 'Trả góp' : 'Đầy đủ'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Trạng thái thanh toán</p>
                {(() => {
                  const payments = order.payments || [];
                  const allPaid = payments.length > 0 && payments.every(p => p.status === 'PAID');
                  const anyPaid = payments.some(p => p.status === 'PAID');
                  const anyOverdue = payments.some(p => p.status === 'OVERDUE');
                  const paidCount = payments.filter(p => p.status === 'PAID').length;
                  if (allPaid) return <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-green-100 text-green-700">Đã thanh toán đủ</span>;
                  if (anyOverdue) return <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-red-100 text-red-700">Có kỳ quá hạn</span>;
                  if (anyPaid) return <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-amber-100 text-amber-700">Đã trả {paidCount}/{payments.length} kỳ</span>;
                  return <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-orange-100 text-orange-700">Chưa thanh toán</span>;
                })()}
              </div>
              <div>
                <p className="text-xs text-gray-500">Tổng tiền</p>
                <p className="text-lg font-black text-blue-600">{formatCurrency(order.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        {order.items && order.items.length > 0 && order.items[0].recipientName && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Thông tin giao hàng</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Người nhận</p>
                <p className="text-sm font-bold text-gray-900">{order.items[0].recipientName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Số điện thoại</p>
                <p className="text-sm font-bold text-gray-900">{order.items[0].recipientPhone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Địa chỉ</p>
                <p className="text-sm font-bold text-gray-900">{order.items[0].shippingAddress}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Sản phẩm</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Sản phẩm</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">SKU</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Serial</th>
                <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Đơn giá</th>
                <th className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">SL</th>
                <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {order.items?.map((item) => (
                <tr key={item.orderItemId} className="hover:bg-gray-50/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {item.thumbnailUrl && (
                        <img 
                          src={item.thumbnailUrl} 
                          alt={item.productName}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                        />
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.variantName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-gray-600">{item.sku || '-'}</td>
                  <td className="p-4 text-xs text-gray-600">{item.serialNumber || '-'}</td>
                  <td className="p-4 text-sm font-bold text-gray-900 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="p-4 text-sm font-bold text-gray-900 text-center">{item.quantity}</td>
                  <td className="p-4 text-sm font-black text-blue-600 text-right">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment Schedule */}
        {order.payments && order.payments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                {order.paymentMode === 'INSTALLMENT' || order.paymentType === 'INSTALLMENT' ? 'Lịch thanh toán trả góp' : 'Lịch thanh toán'}
              </h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Kỳ</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Ngày đến hạn</th>
                  <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Số tiền</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Trạng thái</th>
                  <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Ngày thanh toán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.payments.map((payment, index) => {
                  const isOverdue = payment.status === 'OVERDUE';
                  const isPaid = payment.status === 'PAID';
                  // Hiển thị penalty cho cả OVERDUE và PAID nếu có penalty amount
                  const hasPenalty = payment.penaltyAmount && payment.penaltyAmount > 0;
                  const totalAmount = payment.amount + (hasPenalty ? payment.penaltyAmount : 0);
                  
                  return (
                    <tr key={payment.scheduleId} className="hover:bg-gray-50/50">
                      <td className="p-4 text-sm font-bold text-gray-900">Kỳ {index + 1}</td>
                      <td className="p-4 text-sm text-gray-600">{formatDate(payment.dueDate)}</td>
                      <td className="p-4 text-right">
                        {hasPenalty ? (
                          <div className="space-y-1">
                            <p className={`text-sm font-black ${isPaid ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totalAmount)}</p>
                            <p className="text-xs text-gray-400 line-through">{formatCurrency(payment.amount)}</p>
                            <p className="text-[10px] text-red-500 font-medium">+ Phí phạt: {formatCurrency(payment.penaltyAmount)}</p>
                          </div>
                        ) : (
                          <p className="text-sm font-black text-gray-900">{formatCurrency(payment.amount)}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${getPaymentStatusColor(payment.status)}`}>
                          {getPaymentStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{formatDate(payment.paidDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Warranties */}
        {warranties.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400">verified_user</span>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                Bảo hành ({warranties.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {warranties.map(w => {
                const si = WARRANTY_STATUS[w.status];
                const daysLeft = Math.ceil((new Date(w.endDate).getTime() - Date.now()) / 86400000);
                const isOpen = expandedWarranty === w.id;
                return (
                  <div key={w.id}>
                    <button
                      onClick={() => setExpandedWarranty(isOpen ? null : w.id)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{w.productName}</p>
                        {w.serialNumber && <p className="text-xs text-gray-400">S/N: {w.serialNumber}</p>}
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(w.startDate)} → {formatDate(w.endDate)}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border flex-shrink-0 ${si.color}`}>
                        {si.label}
                      </span>
                      <span className="material-symbols-outlined text-base text-gray-400 flex-shrink-0">
                        {isOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-5 pt-2 bg-gray-50/50 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Loại bảo hành</p>
                            <p className="font-medium">{w.type === 'MANUFACTURER' ? 'Hãng' : 'Cửa hàng'}</p>
                          </div>
                          {w.status === 'ACTIVE' && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Còn lại</p>
                              <p className={`font-bold ${daysLeft <= 30 ? 'text-amber-500' : 'text-green-600'}`}>
                                {daysLeft > 0 ? `${daysLeft} ngày` : 'Hết hạn hôm nay'}
                              </p>
                            </div>
                          )}
                        </div>

                        {w.description && (
                          <p className="text-xs text-gray-500 bg-white border border-gray-100 rounded-lg px-3 py-2">{w.description}</p>
                        )}

                        {w.claims && w.claims.length > 0 ? (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                              Yêu cầu bảo hành ({w.claims.length})
                            </p>
                            <div className="space-y-2">
                              {w.claims.map(c => {
                                const cs = CLAIM_STATUS[c.status] ?? { label: c.status, color: 'text-gray-500 bg-gray-50' };
                                return (
                                  <div key={c.claimId} className="bg-white border border-gray-100 rounded-xl p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                      <span className="text-xs text-gray-400">{formatDate(c.claimDate)}</span>
                                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${cs.color}`}>
                                        {cs.label}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Khách hàng</p>
                                        <p className="text-gray-700">{c.customerNote || '—'}</p>
                                      </div>
                                      {c.technicianNote && (
                                        <div>
                                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Kỹ thuật viên</p>
                                          <p className="text-gray-700">{c.technicianNote}</p>
                                        </div>
                                      )}
                                    </div>
                                    {c.solutionType && (
                                      <p className="text-xs text-gray-500 mt-2">Giải pháp: <span className="font-bold">{c.solutionType}</span></p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">Chưa có yêu cầu bảo hành nào.</p>
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
    </AdminLayout>
  );
};

export default OrderDetail;
