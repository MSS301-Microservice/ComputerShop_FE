import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { warrantyService } from '../../api/services/warrantyService';
import { orderService } from '../../api/services/orderService';
import { WarrantyResponse, WarrantyStatus } from '../../api/types/warranty';
import { showToast } from '../../components/ui/Toast';

const fmt = (d: string) => new Date(d).toLocaleDateString('vi-VN');

const STATUS_CFG: Record<WarrantyStatus, { label: string; badge: string; bar: string; accent: string }> = {
  ACTIVE:  { label: 'Còn hiệu lực', badge: 'text-green-700 bg-green-50 border-green-200',  bar: 'bg-green-500',  accent: 'border-l-green-500' },
  EXPIRED: { label: 'Hết hạn',      badge: 'text-gray-500 bg-gray-100 border-gray-200',    bar: 'bg-gray-300',   accent: 'border-l-gray-300' },
  VOIDED:  { label: 'Đã hủy',       badge: 'text-red-600 bg-red-50 border-red-200',        bar: 'bg-red-400',    accent: 'border-l-red-400' },
};

const CLAIM_CFG: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:    { label: 'Chờ xử lý',  color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
  PROCESSING: { label: 'Đang xử lý', color: 'text-blue-700 bg-blue-50 border-blue-200',    dot: 'bg-blue-500' },
  COMPLETED:  { label: 'Hoàn thành', color: 'text-green-700 bg-green-50 border-green-200', dot: 'bg-green-500' },
  REJECTED:   { label: 'Từ chối',    color: 'text-red-600 bg-red-50 border-red-200',       dot: 'bg-red-400' },
};

const WarrantyCard: React.FC<{ w: WarrantyResponse; onClaimCreated: () => void }> = ({ w, onClaimCreated }) => {
  const [showClaim, setShowClaim] = useState(false);
  const [claimNote, setClaimNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const cfg = STATUS_CFG[w.status];
  const totalDays = Math.ceil((new Date(w.endDate).getTime() - new Date(w.startDate).getTime()) / 86400000);
  const daysLeft = Math.max(0, Math.ceil((new Date(w.endDate).getTime() - Date.now()) / 86400000));
  const progress = totalDays > 0 ? Math.round((daysLeft / totalDays) * 100) : 0;

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await warrantyService.createClaim({ warrantyId: w.id, customerNote: claimNote });
      setShowClaim(false);
      setClaimNote('');
      onClaimCreated();
      showToast('Đã gửi yêu cầu bảo hành thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Không thể tạo yêu cầu bảo hành', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${cfg.accent} overflow-hidden`}>
      {/* Card header */}
      <div className="px-6 pt-5 pb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-2xl text-gray-400">memory</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{w.productName}</h3>
            <div className="flex items-center gap-3 mt-1">
              {w.serialNumber && (
                <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">S/N: {w.serialNumber}</span>
              )}
              <span className="text-xs text-gray-400">{w.type === 'MANUFACTURER' ? 'Bảo hành hãng' : 'Bảo hành cửa hàng'}</span>
            </div>
          </div>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      {/* Progress + dates */}
      <div className="px-6 pb-5">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>{fmt(w.startDate)}</span>
          {w.status === 'ACTIVE' && (
            <span className={`font-bold text-sm ${daysLeft <= 30 ? 'text-amber-500' : 'text-green-600'}`}>
              Còn {daysLeft} ngày
            </span>
          )}
          <span>{fmt(w.endDate)}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${progress}%` }} />
        </div>
        {w.description && (
          <p className="text-xs text-gray-500 mt-3 bg-gray-50 rounded-lg px-3 py-2">{w.description}</p>
        )}
      </div>

      {/* Claims */}
      {w.claims && w.claims.length > 0 && (
        <div className="border-t border-gray-50 px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Lịch sử yêu cầu ({w.claims.length})
          </p>
          <div className="space-y-2">
            {w.claims.map(c => {
              const cc = CLAIM_CFG[c.status] ?? { label: c.status, color: 'text-gray-500 bg-gray-50 border-gray-200', dot: 'bg-gray-400' };
              return (
                <div key={c.claimId} className="bg-gray-50 rounded-xl px-4 py-3 flex flex-wrap items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cc.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">{fmt(c.claimDate)}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${cc.color}`}>{cc.label}</span>
                      {c.returnDate && <span className="text-[10px] text-gray-400">Trả: {fmt(c.returnDate)}</span>}
                    </div>
                    <p className="text-sm text-gray-700">{c.customerNote || '—'}</p>
                    {c.technicianNote && (
                      <p className="text-xs text-blue-600 mt-1 italic">KTV: {c.technicianNote}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create claim */}
      {w.status === 'ACTIVE' && (
        <div className="border-t border-gray-50 px-6 py-4">
          {!showClaim ? (
            <button onClick={() => setShowClaim(true)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black border border-black px-4 py-2.5 rounded-xl hover:bg-black hover:text-white transition">
              <span className="material-symbols-outlined text-base">build</span>
              Tạo yêu cầu bảo hành
            </button>
          ) : (
            <form onSubmit={handleClaim} className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Mô tả vấn đề</p>
              <textarea value={claimNote} onChange={e => setClaimNote(e.target.value)} rows={3} required
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black resize-none"
                placeholder="Mô tả tình trạng sản phẩm cần bảo hành..." />
              <div className="flex gap-2">
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 transition disabled:opacity-50">
                  {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
                <button type="button" onClick={() => { setShowClaim(false); setClaimNote(''); }}
                  className="px-5 py-2 border border-gray-200 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-50 transition">
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

const WarrantyLookup: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [warranties, setWarranties] = useState<WarrantyResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const orders = await orderService.getMyOrders();
      const all: WarrantyResponse[] = [];
      await Promise.all(
        orders.map(async (o: any) => {
          try { all.push(...await warrantyService.getByOrderId(o.orderId)); } catch { /* no warranty */ }
        })
      );
      setWarranties(all);
    } catch {
      setError('Không thể tải danh sách bảo hành.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAuthenticated) load(); }, [isAuthenticated]);

  const active = warranties.filter(w => w.status === 'ACTIVE');
  const others = warranties.filter(w => w.status !== 'ACTIVE');

  return (
    <div className="min-h-screen font-['Jost']" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      {/* Hero banner */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-3xl text-white">verified_user</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Bảo Hành Của Tôi</h1>
              <p className="text-sm text-gray-500 mt-0.5">Quản lý và theo dõi bảo hành sản phẩm</p>
            </div>
          </div>
          {warranties.length > 0 && (
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-3xl font-black text-green-600">{active.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">Còn hiệu lực</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="text-center">
                <p className="text-3xl font-black text-gray-400">{others.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">Hết hạn / Hủy</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="text-center">
                <p className="text-3xl font-black text-gray-900">{warranties.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">Tổng cộng</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Not logged in */}
        {!isAuthenticated && (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-gray-300">lock</span>
            </div>
            <p className="text-lg font-bold text-gray-700">Vui lòng đăng nhập</p>
            <p className="text-sm text-gray-400 mt-1">để xem thông tin bảo hành của bạn</p>
          </div>
        )}

        {/* Loading */}
        {isAuthenticated && loading && (
          <div className="text-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto" />
            <p className="text-gray-400 mt-4 text-sm">Đang tải bảo hành...</p>
          </div>
        )}

        {/* Error */}
        {isAuthenticated && error && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-3 block">error_outline</span>
            <p className="text-gray-500">{error}</p>
            <button onClick={load} className="mt-4 text-sm font-bold text-black underline">Thử lại</button>
          </div>
        )}

        {/* Empty */}
        {isAuthenticated && !loading && !error && warranties.length === 0 && (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-5xl text-gray-300">shield</span>
            </div>
            <p className="text-lg font-bold text-gray-700">Chưa có bảo hành nào</p>
            <p className="text-sm text-gray-400 mt-1">Bảo hành sẽ được tạo tự động khi đơn hàng hoàn thành.</p>
          </div>
        )}

        {/* Active warranties */}
        {!loading && active.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Đang bảo hành ({active.length})</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {active.map(w => <WarrantyCard key={w.id} w={w} onClaimCreated={load} />)}
            </div>
          </div>
        )}

        {/* Expired / voided */}
        {!loading && others.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Đã hết hạn / hủy ({others.length})</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 opacity-70">
              {others.map(w => <WarrantyCard key={w.id} w={w} onClaimCreated={load} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarrantyLookup;
