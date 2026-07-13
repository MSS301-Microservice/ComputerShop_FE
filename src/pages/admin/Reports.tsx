import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { reportService, RevenueTimeParams, RevenueProductParams } from '../../api/services/reportService';
import { RevenueTimeResponse, RevenueProductResponse, RevenueInstallmentResponse, GroupBy } from '../../api/types/report';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
const fmtShort = (v: number) => {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'B';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
  return String(v);
};

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

type Tab = 'time' | 'product' | 'installment';

const StatCard: React.FC<{ label: string; value: string; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <span className="material-symbols-outlined text-2xl text-white">{icon}</span>
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-xl font-black text-gray-900 mt-0.5">{value}</p>
    </div>
  </div>
);

const Reports: React.FC = () => {
  const [tab, setTab] = useState<Tab>('time');

  // --- Time Revenue ---
  const [timeParams, setTimeParams] = useState<RevenueTimeParams>({ fromDate: monthAgo, toDate: today, groupBy: 'MONTH' });
  const [timeData, setTimeData] = useState<RevenueTimeResponse | null>(null);
  const [timeLoading, setTimeLoading] = useState(false);
  const [timeError, setTimeError] = useState('');

  // --- Product Revenue ---
  const [productParams, setProductParams] = useState<RevenueProductParams>({ fromDate: monthAgo, toDate: today, limit: 10 });
  const [productData, setProductData] = useState<RevenueProductResponse | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState('');

  // --- Installment ---
  const [installData, setInstallData] = useState<RevenueInstallmentResponse | null>(null);
  const [installLoading, setInstallLoading] = useState(false);
  const [installError, setInstallError] = useState('');

  const loadTime = useCallback(async () => {
    setTimeLoading(true); setTimeError('');
    try { setTimeData(await reportService.getRevenueTime(timeParams)); }
    catch { setTimeError('Không thể tải báo cáo doanh thu theo thời gian.'); }
    finally { setTimeLoading(false); }
  }, [timeParams]);

  const loadProduct = useCallback(async () => {
    setProductLoading(true); setProductError('');
    try { setProductData(await reportService.getRevenueProduct(productParams)); }
    catch { setProductError('Không thể tải báo cáo doanh thu theo sản phẩm.'); }
    finally { setProductLoading(false); }
  }, [productParams]);

  const loadInstall = useCallback(async () => {
    setInstallLoading(true); setInstallError('');
    try { setInstallData(await reportService.getRevenueInstallment()); }
    catch (err: any) {
      console.error('[Reports] installment error:', err);
      setInstallError(`Không thể tải báo cáo trả góp. (${err?.message || err?.code || 'Lỗi server'})`);
    }
    finally { setInstallLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'time') loadTime(); }, [tab, loadTime]);
  useEffect(() => { if (tab === 'product') loadProduct(); }, [tab, loadProduct]);
  useEffect(() => { if (tab === 'installment') loadInstall(); }, [tab, loadInstall]);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'time',        label: 'Doanh thu theo thời gian', icon: 'bar_chart' },
    { key: 'product',     label: 'Doanh thu theo sản phẩm',  icon: 'inventory_2' },
    { key: 'installment', label: 'Trả góp',                  icon: 'credit_card' },
  ];

  return (
    <AdminLayout title="Báo Cáo" subtitle="Thống kê doanh thu và phân tích kinh doanh" requiredRole="staff">
      {/* Tab bar */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
              tab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300'
            }`}>
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Time Revenue ── */}
      {tab === 'time' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-wrap items-end gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Từ ngày</label>
              <input type="date" value={timeParams.fromDate} onChange={e => setTimeParams(p => ({ ...p, fromDate: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Đến ngày</label>
              <input type="date" value={timeParams.toDate} onChange={e => setTimeParams(p => ({ ...p, toDate: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Nhóm theo</label>
              <select value={timeParams.groupBy} onChange={e => setTimeParams(p => ({ ...p, groupBy: e.target.value as GroupBy }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500">
                <option value="DAY">Ngày</option>
                <option value="MONTH">Tháng</option>
                <option value="YEAR">Năm</option>
              </select>
            </div>
            <button onClick={loadTime} disabled={timeLoading}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
              {timeLoading ? 'Đang tải...' : 'Xem báo cáo'}
            </button>
            <button onClick={() => reportService.exportRevenueTime(timeParams)}
              className="px-5 py-2 border border-gray-200 text-sm font-bold rounded-xl hover:bg-gray-50 transition flex items-center gap-2">
              <span className="material-symbols-outlined text-base">download</span>
              Xuất Excel
            </button>
          </div>

          {timeError && <p className="text-red-500 text-sm">{timeError}</p>}

          {timeData && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Tổng doanh thu" value={fmt(timeData.totalRevenue)} icon="payments" color="bg-blue-500" />
                <StatCard label="Tổng đơn hàng" value={String(timeData.totalOrders)} icon="shopping_cart" color="bg-green-500" />
                <StatCard label="Trung bình / đơn" value={timeData.totalOrders > 0 ? fmt(timeData.totalRevenue / timeData.totalOrders) : '—'} icon="analytics" color="bg-purple-500" />
              </div>

              {/* Chart */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">Biểu đồ doanh thu</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeData.breakdown} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => [fmt(v), 'Doanh thu']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Chi tiết theo kỳ</p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Kỳ</th>
                      <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Doanh thu</th>
                      <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Số đơn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {timeData.breakdown.map(row => (
                      <tr key={row.period} className="hover:bg-gray-50/50">
                        <td className="p-4 text-sm font-medium text-gray-700">{row.period}</td>
                        <td className="p-4 text-sm font-black text-blue-600 text-right">{fmt(row.revenue)}</td>
                        <td className="p-4 text-sm text-gray-500 text-right">{row.orderCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB 2: Product Revenue ── */}
      {tab === 'product' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-wrap items-end gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Từ ngày</label>
              <input type="date" value={productParams.fromDate} onChange={e => setProductParams(p => ({ ...p, fromDate: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Đến ngày</label>
              <input type="date" value={productParams.toDate} onChange={e => setProductParams(p => ({ ...p, toDate: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Top N sản phẩm</label>
              <input type="number" min={1} max={100} value={productParams.limit} onChange={e => setProductParams(p => ({ ...p, limit: Number(e.target.value) }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 w-24" />
            </div>
            <button onClick={loadProduct} disabled={productLoading}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
              {productLoading ? 'Đang tải...' : 'Xem báo cáo'}
            </button>
            <button onClick={() => reportService.exportRevenueProduct(productParams)}
              className="px-5 py-2 border border-gray-200 text-sm font-bold rounded-xl hover:bg-gray-50 transition flex items-center gap-2">
              <span className="material-symbols-outlined text-base">download</span>
              Xuất Excel
            </button>
          </div>

          {productError && <p className="text-red-500 text-sm">{productError}</p>}

          {productData && (
            <>
              <StatCard label="Tổng doanh thu" value={fmt(productData.totalRevenue)} icon="payments" color="bg-blue-500" />

              {/* Bar chart top products */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">Top sản phẩm theo doanh thu</p>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart layout="vertical" data={productData.products.slice(0, 10)}
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="productName" width={160} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => [fmt(v), 'Doanh thu']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Chi tiết sản phẩm</p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">STT</th>
                      <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Sản phẩm</th>
                      <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Biến thể</th>
                      <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Đã bán</th>
                      <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {productData.products.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="p-4 text-sm text-gray-400">{i + 1}</td>
                        <td className="p-4 text-sm font-bold text-gray-900">{p.productName}</td>
                        <td className="p-4 text-xs text-gray-500">{p.variantName}</td>
                        <td className="p-4 text-sm font-bold text-gray-700 text-right">{p.totalSold}</td>
                        <td className="p-4 text-sm font-black text-purple-600 text-right">{fmt(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB 3: Installment ── */}
      {tab === 'installment' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button onClick={loadInstall} disabled={installLoading}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
              {installLoading ? 'Đang tải...' : 'Làm mới'}
            </button>
            <button onClick={() => reportService.exportRevenueInstallment()}
              className="px-5 py-2 border border-gray-200 text-sm font-bold rounded-xl hover:bg-gray-50 transition flex items-center gap-2">
              <span className="material-symbols-outlined text-base">download</span>
              Xuất Excel
            </button>
          </div>

          {installError && <p className="text-red-500 text-sm">{installError}</p>}

          {installData && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Đã thu" value={fmt(installData.summary.totalPaid)} icon="check_circle" color="bg-green-500" />
                <StatCard label="Chưa thu" value={fmt(installData.summary.totalUnpaid)} icon="schedule" color="bg-amber-500" />
                <StatCard label="Quá hạn" value={fmt(installData.summary.totalOverdue)} icon="warning" color="bg-red-500" />
                <StatCard label="Tổng cộng" value={fmt(installData.summary.total)} icon="account_balance_wallet" color="bg-blue-600" />
              </div>

              {/* Donut-style summary bar */}
              {installData.summary.total > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Tỷ lệ thu hồi</p>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="bg-green-500 h-full transition-all" style={{ width: `${(installData.summary.totalPaid / installData.summary.total) * 100}%` }} />
                    <div className="bg-amber-400 h-full transition-all" style={{ width: `${(installData.summary.totalUnpaid / installData.summary.total) * 100}%` }} />
                    <div className="bg-red-400 h-full transition-all" style={{ width: `${(installData.summary.totalOverdue / installData.summary.total) * 100}%` }} />
                  </div>
                  <div className="flex gap-6 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Đã thu ({((installData.summary.totalPaid / installData.summary.total) * 100).toFixed(1)}%)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Chưa thu ({((installData.summary.totalUnpaid / installData.summary.total) * 100).toFixed(1)}%)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Quá hạn ({((installData.summary.totalOverdue / installData.summary.total) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              )}

              {/* Orders table */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Chi tiết đơn trả góp ({installData.orders.length})</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Mã đơn</th>
                        <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Khách hàng</th>
                        <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Tổng đơn</th>
                        <th className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Tiến độ</th>
                        <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Kỳ tiếp theo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {installData.orders.map(o => {
                        const pct = o.totalInstallments > 0 ? Math.round((o.paidInstallments / o.totalInstallments) * 100) : 0;
                        const done = o.remainingInstallments === 0;
                        return (
                          <tr key={o.orderId} className="hover:bg-gray-50/50">
                            <td className="p-4">
                              <span className="text-xs font-bold text-blue-600">#{o.orderId}</span>
                            </td>
                            <td className="p-4 text-sm font-medium text-gray-800">{o.customerUsername}</td>
                            <td className="p-4 text-sm font-black text-gray-900 text-right">{fmt(o.orderTotal)}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${done ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">{o.paidInstallments}/{o.totalInstallments}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              {done
                                ? <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Hoàn tất</span>
                                : <span className="text-xs text-gray-600">{o.nextDueDate}</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default Reports;
