import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { otpService } from '../../api/services/otpService';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email: string } | null;

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (!state?.email) navigate('/forgot-password');
  }, [state, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await otpService.resetPassword(state!.email, formData.newPassword, formData.confirmPassword);
      navigate('/login', { state: { passwordReset: true } });
    } catch (err: any) {
      setError(err.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!state?.email) return null;

  return (
    <div className={`min-h-screen flex font-['Jost'] transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
      <div className="flex w-full h-screen overflow-hidden">
        {/* Left hero */}
        <div className="hidden lg:block w-1/2 h-full relative bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
          <div className="absolute inset-0 bg-black/30 z-10" />
          <img
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMOHdFA3XTXAcM80rjSMRd5he5w7XyvbPyJqQcgjCxWpNcTuCAhi632wFZ1AEk-Yu2V1u98siSDnWI0gqe9mJuirSb-MT_Ja8yxpxXcVB3FzWuFs1fwZbh0mcbj4-aAOhLHHuSxNcRKQ7TNoNaU3wowCci0R1EwSQLdTqpObhGfpMxSTyglK1eU9cN0LTio5DzqivUWNndpJMfL26m_4JvOO2rS2QiWofdNwmPnqudFd39UwQuOqaTsGaBNtkgQKxIOd45ygiD3BE"
          />
          <div className="absolute bottom-12 left-12 z-20 text-white max-w-lg">
            <h2 className="text-4xl font-light mb-4">Mật Khẩu <br /><span className="font-bold">Mới.</span></h2>
            <p className="text-gray-200 text-sm leading-relaxed opacity-90">Tạo mật khẩu mạnh để bảo vệ tài khoản của bạn.</p>
          </div>
        </div>

        {/* Right form */}
        <div className="w-full lg:w-1/2 h-full flex flex-col relative overflow-y-auto bg-white dark:bg-zinc-950">
          <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-20">
            <Link to="/" className="text-2xl font-bold tracking-widest uppercase text-black dark:text-white">
              VITINH<span className="text-zinc-400">.</span>
            </Link>
            <button onClick={() => { setIsDarkMode(!isDarkMode); document.documentElement.classList.toggle('dark'); }}
              className="text-gray-500 hover:text-black dark:hover:text-white transition">
              <span className="material-symbols-outlined text-[24px]">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 md:px-24 py-20">
            <div className="w-full max-w-md space-y-10">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-zinc-700 dark:text-zinc-300">lock</span>
                </div>
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-light text-black dark:text-white mb-3">Đặt Lại Mật Khẩu</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Tạo mật khẩu mới cho <span className="font-semibold text-zinc-800 dark:text-zinc-200">{state.email}</span>
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</p>
                )}

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">MẬT KHẨU MỚI</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Ít nhất 8 ký tự"
                    required
                    className="w-full bg-transparent border border-gray-200 dark:border-zinc-800 p-4 text-sm focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white outline-none transition dark:text-white rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">XÁC NHẬN MẬT KHẨU</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className="w-full bg-transparent border border-gray-200 dark:border-zinc-800 p-4 text-sm focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white outline-none transition dark:text-white rounded-md"
                  />
                </div>

                {/* Password strength hint */}
                {formData.newPassword && (
                  <p className={`text-xs ${formData.newPassword.length >= 8 ? 'text-green-500' : 'text-orange-400'}`}>
                    {formData.newPassword.length >= 8 ? '✓ Độ dài hợp lệ' : `Cần thêm ${8 - formData.newPassword.length} ký tự`}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1a1a1a] dark:bg-white text-white dark:text-black py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-black dark:hover:bg-zinc-200 transition-all shadow-lg rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? <><span className="animate-spin mr-2">⏳</span>ĐANG XỬ LÝ...</> : 'ĐẶT LẠI MẬT KHẨU'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
