import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../api/services/orderService';
import { OrderResponse } from '../../api/types/order';
import { PagedResponse } from '../../api/types/common';
import Pagination from '../../components/ui/Pagination';
import { 
  ORDER_STATUS, 
  ORDER_STATUS_LABELS, 
  ORDER_STATUS_COLORS,
  type OrderStatus 
} from '../../constants/orderStatus';

const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
const PAGE_SIZE = 10;

const STATUS_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: ORDER_STATUS.PENDING, label: ORDER_STATUS_LABELS[ORDER_STATUS.PENDING] },
  { key: ORDER_STATUS.CONFIRMED, label: ORDER_STATUS_LABELS[ORDER_STATUS.CONFIRMED] },
  { key: ORDER_STATUS.PROCESSING, label: ORDER_STATUS_LABELS[ORDER_STATUS.PROCESSING] },
  { key: ORDER_STATUS.SHIPPED, label: ORDER_STATUS_LABELS[ORDER_STATUS.SHIPPED] },
  { key: ORDER_STATUS.DELIVERED, label: ORDER_STATUS_LABELS[ORDER_STATUS.DELIVERED] },
  { key: ORDER_STATUS.CANCELLED, label: ORDER_STATUS_LABELS[ORDER_STATUS.CANCELLED] },
] as const;

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  [ORDER_STATUS.PENDING]: { 
    label: ORDER_STATUS_LABELS[ORDER_STATUS.PENDING], 
    color: 'bg-yellow-100 text-yellow-700' // Slightly different color for user interface
  },
  [ORDER_STATUS.CONFIRMED]: { 
    label: ORDER_STATUS_LABELS[ORDER_STATUS.CONFIRMED], 
    color: 'bg-blue-100 text-blue-700' 
  },
  [ORDER_STATUS.PROCESSING]: { 
    label: ORDER_STATUS_LABELS[ORDER_STATUS.PROCESSING], 
    color: 'bg-cyan-100 text-cyan-700' 
  },
  [ORDER_STATUS.SHIPPED]: { 
    label: ORDER_STATUS_LABELS[ORDER_STATUS.SHIPPED], 
    color: 'bg-indigo-100 text-indigo-700' 
  },
  [ORDER_STATUS.DELIVERED]: { 
    label: ORDER_STATUS_LABELS[ORDER_STATUS.DELIVERED], 
    color: 'bg-green-100 text-green-700' 
  },
  [ORDER_STATUS.CANCELLED]: { 
    label: ORDER_STATUS_LABELS[ORDER_STATUS.CANCELLED], 
    color: 'bg-red-100 text-red-700' 
  },
  PAID: { label: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-700' },
};

const OrderList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pagedData, setPagedData] = useState<PagedResponse<OrderResponse> | null>(null);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    const load = async () => {
      try {
        try {
          const data = await orderService.getMyOrdersPaged({ page: currentPage, size: PAGE_SIZE });
          setPagedData(data);
          setOrders(data.content);
        } catch {
          const data = await orderService.getMyOrders();
          setOrders(data);
          setPagedData({ content: data, totalElements: data.length, totalPages: 1, size: data.length, number: 0 });
        }
      } catch {
        setError('Không thể tải danh sách đơn hàng.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, navigate, currentPage]);

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || String(o.orderId).includes(q) ||
      (o.items?.[0]?.productName || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const countByStatus = (key: string) => key === 'ALL' ? orders.length : orders.filter(o => o.status === key).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-['Jost']">
      <h1 className="text-4xl font-light uppercase tracking-tight text-black mb-8">
        Đơn hàng <span className="font-bold">của tôi</span>
      </h1>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex items-center gap-3">
        <span className="material-symbols-outlined text-gray-300">search</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo mã đơn hoặc tên sản phẩm..."
          className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-300"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setCurrentPage(0); }}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition ${
              statusFilter === tab.key
                ? 'bg-black text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 opacity-60">({countByStatus(tab.key)})</span>
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 mb-6 text-sm">{error}</p>}

      {filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <span className="material-symbols-outlined text-6xl mb-4 block">receipt_long</span>
          <p className="text-sm uppercase tracking-widest">Không có đơn hàng nào</p>
          <button onClick={() => navigate('/shop')}
            className="mt-8 px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 transition">
            Mua sắm ngay
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const st = STATUS_CFG[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-500' };
            const isInstallment = order.paymentType === 'INSTALLMENT' || (order as any).paymentMode === 'INSTALLMENT';
            const firstItem = order.items?.[0] as any;
            const recipientName = order.recipientName || firstItem?.recipientName;
            const recipientPhone = order.recipientPhone || firstItem?.recipientPhone;
            const shippingAddress = order.shippingAddress || firstItem?.shippingAddress;

            return (
              <div key={order.orderId}
                onClick={() => navigate(`/orders/${order.orderId}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-gray-400 text-lg">receipt_long</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-black">Đơn hàng #{order.orderId}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Đặt lúc: {fmtDate(order.orderDate || order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Tổng tiền</p>
                      <p className="text-base font-black text-black">{fmt(order.totalAmount)}</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Thông tin giao hàng</p>
                    {recipientName ? (
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-gray-900">{recipientName}</p>
                        <p className="text-xs text-gray-500">{recipientPhone}</p>
                        <p className="text-xs text-gray-400 truncate">{shippingAddress}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300 italic">Chưa có thông tin</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Sản phẩm ({order.items?.length ?? 0})
                    </p>
                    <div className="space-y-1">
                      {(order.items ?? []).slice(0, 2).map(item => (
                        <div key={item.orderItemId} className="flex justify-between text-xs">
                          <span className="text-gray-700 truncate max-w-[180px]">{item.productName} x{item.quantity}</span>
                          <span className="font-bold text-gray-900 flex-shrink-0 ml-2">{fmt(item.subtotal)}</span>
                        </div>
                      ))}
                      {(order.items?.length ?? 0) > 2 && (
                        <p className="text-xs text-gray-400">+{(order.items?.length ?? 0) - 2} sản phẩm khác</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-50 flex items-center gap-2">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${isInstallment ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                    {isInstallment ? 'Trả góp' : 'Đầy đủ'}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                    {order.paymentMethod === 'COD' ? 'COD' : 'VNPay'}
                  </span>
                </div>
              </div>
            );
          })}

          {pagedData && pagedData.totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={pagedData.totalPages} onPageChange={setCurrentPage} className="pt-4" />
          )}
        </div>
      )}
    </div>
  );
};

export default OrderList;
