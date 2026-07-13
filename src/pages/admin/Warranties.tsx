import React, { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { warrantyService } from '../../api/services/warrantyService';
import { WarrantyResponse, ClaimResponse, ClaimStatus, SolutionType, WarrantyStatus } from '../../api/types/warranty';
import { showToast } from '../../components/ui/Toast';

const STATUS_LABEL: Record<WarrantyStatus, { label: string; color: string; bg: string }> = {
  ACTIVE:  { label: 'Còn hiệu lực', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  EXPIRED: { label: 'Hết hạn',      color: 'text-gray-500',  bg: 'bg-gray-100 border-gray-200' },
  VOIDED:  { label: 'Đã hủy',       color: 'text-red-600',   bg: 'bg-red-50 border-red-200' },
};

const CLAIM_STATUS_LABEL: Record<ClaimStatus, { label: string; color: string }> = {
  PENDING:    { label: 'Chờ xử lý',  color: 'text-amber-700 bg-amber-50 border-amber-200' },
  PROCESSING: { label: 'Đang xử lý', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  COMPLETED:  { label: 'Hoàn thành', color: 'text-green-700 bg-green-50 border-green-200' },
  REJECTED:   { label: 'Từ chối',    color: 'text-red-600 bg-red-50 border-red-200' },
};

const SOLUTION_LABEL: Record<string, string> = {
  REPAIR: 'Sửa chữa', REPLACE: 'Thay thế', REFUND: 'Hoàn tiền', REJECT: 'Từ chối',
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

interface EditClaimState {
  claimId: number;
  status: ClaimStatus;
  technicianNote: string;
  solutionType: SolutionType | '';
}

const Warranties: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [results, setResults] = useState<WarrantyResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [editClaim, setEditClaim] = useState<EditClaimState | null>(null);
  const [savingClaim, setSavingClaim] = useState(false);
  const [editWarrantyId, setEditWarrantyId] = useState<number | null>(null);
  const [newWarrantyStatus, setNewWarrantyStatus] = useState<WarrantyStatus>('ACTIVE');
  const [savingWarranty, setSavingWarranty] = useState(false);
  const [creatingClaimId, setCreatingClaimId] = useState<number | null>(null);
  const [newClaimNote, setNewClaimNote] = useState('');
  const [savingNewClaim, setSavingNewClaim] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const data = await warrantyService.getByPhone(phone.trim());
      setResults(data);
    } catch {
      setError('Không tìm thấy hoặc có lỗi xảy ra.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshResults = async () => {
    if (!phone.trim()) return;
    try {
      const data = await warrantyService.getByPhone(phone.trim());
      setResults(data);
    } catch { /* silent */ }
  };

  const handleSaveClaim = async () => {
    if (!editClaim) return;
    setSavingClaim(true);
    try {
      await warrantyService.updateClaim(editClaim.claimId, {
        status: editClaim.status,
        technicianNote: editClaim.technicianNote || undefined,
        solutionType: editClaim.solutionType || undefined,
      });
      setEditClaim(null);
      await refreshResults();
      showToast('Cập nhật yêu cầu bảo hành thành công', 'success');
    } catch {
      showToast('Không thể cập nhật yêu cầu bảo hành.', 'error');
    } finally {
      setSavingClaim(false);
    }
  };

  const handleSaveWarrantyStatus = async (id: number) => {
    setSavingWarranty(true);
    try {
      await warrantyService.updateStatus(id, { status: newWarrantyStatus });
      setEditWarrantyId(null);
      await refreshResults();
      showToast('Cập nhật trạng thái bảo hành thành công', 'success');
    } catch {
      showToast('Không thể cập nhật trạng thái bảo hành.', 'error');
    } finally {
      setSavingWarranty(false);
    }
  };

  const handleCreateClaim = async (warrantyId: number) => {
    setSavingNewClaim(true);
    try {
      await warrantyService.createClaim({ warrantyId, customerNote: newClaimNote.trim() || undefined });
      setCreatingClaimId(null);
      setNewClaimNote('');
      await refreshResults();
    } catch {
      alert('Không thể tạo yêu cầu sửa chữa.');
    } finally {
      setSavingNewClaim(false);
    }
  };

  return (
    <AdminLayout title="Quản Lý Bảo Hành" subtitle="Tra cứu và xử lý yêu cầu bảo hành theo khách hàng">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8 max-w-lg">
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Nhập số điện thoại khách hàng..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" disabled={loading}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Đang tìm...' : 'Tìm kiếm'}
        </button>
      </form>

      {error && (
        <div className="text-center py-12 text-gray-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
          <p>{error}</p>
        </div>
      )}

      {searched && !loading && !error && results.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">inbox</span>
          <p>Không tìm thấy bảo hành nào.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {results.length} bảo hành tìm thấy
          </p>

          {results.map(w => {
            const si = STATUS_LABEL[w.status];
            const totalDays = Math.ceil((new Date(w.endDate).getTime() - new Date(w.startDate).getTime()) / 86400000);
            const daysLeft = Math.max(0, Math.ceil((new Date(w.endDate).getTime() - Date.now()) / 86400000));
            const progress = totalDays > 0 ? Math.round((daysLeft / totalDays) * 100) : 0;

            return (
              <div key={w.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className={`px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 ${si.bg} border-l-4 ${w.status === 'ACTIVE' ? 'border-l-green-500' : w.status === 'EXPIRED' ? 'border-l-gray-400' : 'border-l-red-400'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-2xl ${si.color}`}>verified_user</span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{w.productName}</h3>
                      {w.serialNumber && (
                        <p className="text-xs text-gray-500 font-mono mt-0.5">S/N: {w.serialNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${si.bg} ${si.color}`}>
                      {si.label}
                    </span>
                    {/* Edit warranty status */}
                    {editWarrantyId === w.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={newWarrantyStatus}
                          onChange={e => setNewWarrantyStatus(e.target.value as WarrantyStatus)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white"
                        >
                          <option value="ACTIVE">Còn hiệu lực</option>
                          <option value="EXPIRED">Hết hạn</option>
                          <option value="VOIDED">Đã hủy</option>
                        </select>
                        <button onClick={() => handleSaveWarrantyStatus(w.id)} disabled={savingWarranty}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                          Lưu
                        </button>
                        <button onClick={() => setEditWarrantyId(null)}
                          className="text-xs px-3 py-1 border border-gray-200 bg-white rounded-lg hover:bg-gray-50">
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditWarrantyId(w.id); setNewWarrantyStatus(w.status); }}
                        className="text-xs text-gray-400 hover:text-blue-600 transition flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">edit</span>
                        Đổi trạng thái
                      </button>
                    )}
                  </div>
                </div>

                {/* Info grid */}
                <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-5 border-b border-gray-50">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Loại bảo hành</p>
                    <p className="text-sm font-semibold text-gray-800">{w.type === 'MANUFACTURER' ? 'Bảo hành hãng' : 'Bảo hành cửa hàng'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Ngày bắt đầu</p>
                    <p className="text-sm font-semibold text-gray-800">{fmtDate(w.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Ngày hết hạn</p>
                    <p className="text-sm font-semibold text-gray-800">{fmtDate(w.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Thời gian còn lại</p>
                    {w.status === 'ACTIVE' ? (
                      <p className={`text-sm font-bold ${daysLeft <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
                        {daysLeft > 0 ? `${daysLeft} ngày` : 'Hết hạn hôm nay'}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">—</p>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {w.status === 'ACTIVE' && (
                  <div className="px-6 py-3 border-b border-gray-50">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                      <span>Tiến độ bảo hành</span>
                      <span>{progress}% còn lại</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${progress > 50 ? 'bg-green-500' : progress > 20 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {w.description && (
                  <div className="px-6 py-3 border-b border-gray-50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Mô tả</p>
                    <p className="text-sm text-gray-600">{w.description}</p>
                  </div>
                )}

                {/* Claims section */}
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">build_circle</span>
                      Yêu cầu bảo hành ({w.claims?.length ?? 0})
                    </p>
                  </div>

                  {/* Form tạo claim mới */}
                  {creatingClaimId === w.id && (
                    <div className="mb-4 border-t border-gray-50 pt-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Mô tả vấn đề</p>
                      <textarea
                        value={newClaimNote}
                        onChange={e => setNewClaimNote(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black resize-none"
                        placeholder="Mô tả tình trạng sản phẩm cần sửa chữa..."
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleCreateClaim(w.id)} disabled={savingNewClaim}
                          className="px-5 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 transition disabled:opacity-50">
                          {savingNewClaim ? 'Đang gửi...' : 'Gửi yêu cầu'}
                        </button>
                        <button onClick={() => { setCreatingClaimId(null); setNewClaimNote(''); }}
                          className="px-5 py-2 border border-gray-200 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-50 transition">
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}

                  {w.status === 'ACTIVE' && creatingClaimId !== w.id && (
                    <button
                      onClick={() => { setCreatingClaimId(w.id); setNewClaimNote(''); }}
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black border border-black px-4 py-2.5 rounded-xl hover:bg-black hover:text-white transition"
                    >
                      <span className="material-symbols-outlined text-base">build</span>
                      Tạo yêu cầu sửa chữa
                    </button>
                  )}

                  {(!w.claims || w.claims.length === 0) ? (
                    <div className="text-center py-6 bg-gray-50 rounded-xl">
                      <span className="material-symbols-outlined text-3xl text-gray-300 mb-1 block">inbox</span>
                      <p className="text-sm text-gray-400">Chưa có yêu cầu bảo hành nào.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {w.claims.map((c: ClaimResponse) => {
                        const cs = CLAIM_STATUS_LABEL[c.status] ?? { label: c.status, color: 'text-gray-500 bg-gray-50 border-gray-200' };
                        const isEditing = editClaim?.claimId === c.claimId;

                        return (
                          <div key={c.claimId} className="border border-gray-100 rounded-xl overflow-hidden">
                            {/* Claim header */}
                            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50/60">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-500">#{c.claimId}</span>
                                <span className="text-xs text-gray-400">Ngày tạo: {fmtDate(c.claimDate)}</span>
                                {c.returnDate && <span className="text-xs text-gray-400">Ngày trả: {fmtDate(c.returnDate)}</span>}
                              </div>
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${cs.color}`}>
                                {cs.label}
                              </span>
                            </div>

                            {/* Claim body */}
                            <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Ghi chú khách hàng</p>
                                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{c.customerNote || '—'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Ghi chú kỹ thuật viên</p>
                                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{c.technicianNote || '—'}</p>
                              </div>
                              {c.solutionType && (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Giải pháp</p>
                                  <p className="text-sm font-semibold text-gray-800">{SOLUTION_LABEL[c.solutionType] ?? c.solutionType}</p>
                                </div>
                              )}
                            </div>

                            {/* Edit form */}
                            {isEditing ? (
                              <div className="border-t border-gray-100 px-4 py-4 bg-blue-50/30 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Trạng thái</label>
                                    <select
                                      value={editClaim.status}
                                      onChange={e => setEditClaim({ ...editClaim, status: e.target.value as ClaimStatus })}
                                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    >
                                      <option value="PENDING">Chờ xử lý</option>
                                      <option value="PROCESSING">Đang xử lý</option>
                                      <option value="COMPLETED">Hoàn thành</option>
                                      <option value="REJECTED">Từ chối</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Giải pháp</label>
                                    <select
                                      value={editClaim.solutionType}
                                      onChange={e => setEditClaim({ ...editClaim, solutionType: e.target.value as SolutionType | '' })}
                                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    >
                                      <option value="">— Chưa xác định —</option>
                                      <option value="REPAIR">Sửa chữa</option>
                                      <option value="REPLACE">Thay thế</option>
                                      <option value="REFUND">Hoàn tiền</option>
                                      <option value="REJECT">Từ chối</option>
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Ghi chú kỹ thuật viên</label>
                                  <textarea
                                    value={editClaim.technicianNote}
                                    onChange={e => setEditClaim({ ...editClaim, technicianNote: e.target.value })}
                                    rows={2}
                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 resize-none bg-white"
                                    placeholder="Nhập ghi chú kỹ thuật viên..."
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={handleSaveClaim} disabled={savingClaim}
                                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {savingClaim ? 'Đang lưu...' : 'Lưu thay đổi'}
                                  </button>
                                  <button onClick={() => setEditClaim(null)}
                                    className="px-4 py-2 border border-gray-200 text-xs font-bold rounded-lg hover:bg-gray-50 bg-white">
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="border-t border-gray-100 px-4 py-3">
                                <button
                                  onClick={() => setEditClaim({
                                    claimId: c.claimId,
                                    status: c.status,
                                    technicianNote: c.technicianNote || '',
                                    solutionType: c.solutionType || '',
                                  })}
                                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-sm">edit</span>
                                  Cập nhật yêu cầu
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default Warranties;
