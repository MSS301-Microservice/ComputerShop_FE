import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../api/services/userService';
import { authService } from '../../api/services/authService';
import { UserResponse } from '../../api/types/user';

const Profile: React.FC = () => {
  const { user: authUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  const [infoForm, setInfoForm] = useState({ username: '', phoneNumber: '' });
  const [pwForm, setPwForm] = useState({ oldPassword: '', password: '', confirmPassword: '' });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    userService.getMyProfile()
      .then(p => {
        setProfile(p);
        setInfoForm({ username: p.username || '', phoneNumber: p.phoneNumber || '' });
      })
      .catch(e => setError(e.message || 'Không thể tải hồ sơ'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null); setSuccessMsg(null);
    try {
      const updated = await userService.updateMyProfile({
        username: infoForm.username.trim() || undefined,
        phoneNumber: infoForm.phoneNumber.trim() || undefined,
      });
      setProfile(updated);
      setSuccessMsg('Cập nhật thông tin thành công.');
    } catch (err: any) {
      setError(err.message || 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.oldPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại.'); return;
    }
    if (pwForm.password !== pwForm.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.'); return;
    }
    if (pwForm.password.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.'); return;
    }
    if (pwForm.oldPassword === pwForm.password) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại.'); return;
    }
    setSaving(true); setError(null); setSuccessMsg(null);
    try {
      // Verify old password by attempting login
      await authService.login(profile!.email, pwForm.oldPassword);
      // If login succeeds, update password
      await userService.updateMyProfile({ password: pwForm.password });
      setPwForm({ oldPassword: '', password: '', confirmPassword: '' });
      setSuccessMsg('Đổi mật khẩu thành công.');
    } catch (err: any) {
      const msg = err.message || '';
      setError(msg.toLowerCase().includes('login') || msg.toLowerCase().includes('invalid') || msg.includes('1006') || msg.includes('401')
        ? 'Mật khẩu hiện tại không đúng.'
        : err.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    const r = (role || '').toUpperCase();
    if (r === 'ADMIN') return 'bg-red-100 text-red-600';
    if (r === 'STAFF') return 'bg-blue-100 text-blue-600';
    return 'bg-gray-100 text-gray-500';
  };

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-['Jost']">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 font-['Jost']">
      {/* Header */}
      <div className="mb-10">
        <Link to="/" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition mb-6 group">
          <span className="material-symbols-outlined text-sm mr-2 group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Trang chủ
        </Link>
        <h1 className="text-4xl font-light uppercase tracking-tight text-black">
          Hồ Sơ <span className="font-bold">Của Tôi</span>
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left — avatar card */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm">
            <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
              {(profile?.username || authUser?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <p className="text-lg font-bold text-gray-900">{profile?.username}</p>
            <p className="text-sm text-gray-400 mt-1">{profile?.email}</p>
            <span className={`inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getRoleBadge(profile?.roleName || profile?.role)}`}>
              {(() => {
                const r = (profile?.roleName || profile?.role || '').toUpperCase();
                if (r === 'ADMIN') return 'Quản trị viên';
                if (r === 'STAFF') return 'Nhân viên';
                if (r === 'MEMBER') return 'Thành viên';
                return r || 'Thành viên';
              })()}
            </span>

            <div className="mt-6 pt-6 border-t border-gray-50 space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="material-symbols-outlined text-base text-gray-300">phone</span>
                {profile?.phoneNumber || <span className="italic text-gray-300">Chưa cập nhật</span>}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="material-symbols-outlined text-base text-gray-300">calendar_today</span>
                Tham gia {fmtDate(profile?.createdAt)}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-base text-gray-300">verified_user</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                  profile?.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                }`}>
                  {profile?.status === 'ACTIVE' ? 'Hoạt động' : profile?.status || '—'}
                </span>
              </div>
            </div>

            <Link
              to="/orders"
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-[11px] font-bold uppercase tracking-widest text-gray-600 hover:bg-black hover:text-white hover:border-black transition"
            >
              <span className="material-symbols-outlined text-base">receipt_long</span>
              Đơn hàng của tôi
            </Link>
          </div>
        </div>

        {/* Right — edit form */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => { setActiveTab('info'); setError(null); setSuccessMsg(null); }}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition ${activeTab === 'info' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
            >
              Thông tin
            </button>
            <button
              onClick={() => { setActiveTab('password'); setError(null); setSuccessMsg(null); setPwForm({ oldPassword: '', password: '', confirmPassword: '' }); }}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition ${activeTab === 'password' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
            >
              Đổi mật khẩu
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-600 font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              {successMsg}
            </div>
          )}

          {activeTab === 'info' && (
            <form onSubmit={handleUpdateInfo} className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email</label>
                <input
                  type="text"
                  value={profile?.email || ''}
                  disabled
                  className="w-full p-4 bg-gray-50 rounded-xl text-sm text-gray-400 cursor-not-allowed"
                />
                <p className="text-[10px] text-gray-300">Email không thể thay đổi</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tên hiển thị</label>
                <input
                  type="text"
                  value={infoForm.username}
                  onChange={e => setInfoForm({ ...infoForm, username: e.target.value })}
                  className="w-full p-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none transition"
                  placeholder="Tên của bạn"
                  minLength={3}
                  maxLength={50}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Số điện thoại</label>
                <input
                  type="tel"
                  value={infoForm.phoneNumber}
                  onChange={e => setInfoForm({ ...infoForm, phoneNumber: e.target.value })}
                  className="w-full p-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none transition"
                  placeholder="0901 234 567"
                  maxLength={15}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-black text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleUpdatePassword} className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={pwForm.oldPassword}
                  onChange={e => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                  className="w-full p-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none transition"
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mật khẩu mới</label>
                <input
                  type="password"
                  value={pwForm.password}
                  onChange={e => setPwForm({ ...pwForm, password: e.target.value })}
                  className="w-full p-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none transition"
                  placeholder="Tối thiểu 6 ký tự"
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  className="w-full p-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none transition"
                  placeholder="Nhập lại mật khẩu mới"
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-black text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
