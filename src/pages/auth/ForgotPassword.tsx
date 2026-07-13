import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { otpService } from '../../api/services/otpService';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Vui lòng nhập email'); return; }
    setError('');
    setLoading(true);
    try {
      await otpService.sendOtp(email);
      navigate('/verify-otp', {
        state: { email, mode: 'forgot' },
      });
    } catch (err: any) {
      setError(err.message || 'Gửi OTP thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

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
            <h2 className="text-4xl font-light mb-4">Khôi Phục <br /><span className="font-bold">Tài Khoản.</span></h2>
            <p className="text-gray-200 text-sm leading-relaxed opacity-90">Nhập email để nhận mã xác thực và đặt lại mật khẩu.</p>
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
                  <span className="material-symbols-outlined text-3xl text-zinc-700 dark:text-zinc-300">lock_reset</span>
                </div>
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-light text-black dark:text-white mb-3">Quên Mật Khẩu</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Nhập email tài khoản của bạn. Chúng tôi sẽ gửi mã OTP để xác thực.</p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</p>
                )}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">EMAIL</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@vitinh.com"
                    required
                    className="w-full bg-transparent border border-gray-200 dark:border-zinc-800 p-4 text-sm focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white outline-none transition dark:text-white rounded-md"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1a1a1a] dark:bg-white text-white dark:text-black py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-black dark:hover:bg-zinc-200 transition-all shadow-lg rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? <><span className="animate-spin mr-2">⏳</span>ĐANG GỬI...</> : 'GỬI MÃ OTP'}
                </button>
              </form>

              <div className="text-center">
                <Link to="/login" className="inline-flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black dark:hover:text-white transition group">
                  <span className="material-symbols-outlined text-sm mr-2 group-hover:-translate-x-1 transition-transform">arrow_back</span>
                  QUAY LẠI ĐĂNG NHẬP
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
