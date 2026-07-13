import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../../api/services/userService';
import { otpService } from '../../api/services/otpService';

const Register: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!agreed) {
      setError('Vui lòng đồng ý với điều khoản và chính sách');
      return;
    }

    setLoading(true);

    try {
      await otpService.sendOtp(formData.email);
      // Navigate sang trang OTP, truyền form data để sau khi verify xong thì tạo tài khoản
      navigate('/verify-otp', {
        state: {
          email: formData.email,
          registerData: {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName || undefined,
            phoneNumber: formData.phoneNumber || undefined,
          },
        },
      });
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Gửi OTP thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-['Jost'] transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-zinc-900'}`}>
      {/* Standalone Nav */}
      <nav className="w-full py-6 px-8 md:px-12 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold tracking-widest uppercase text-black dark:text-white">
            VITINH<span className="text-zinc-400">.</span>
          </Link>
          <div className="flex items-center space-x-6 text-gray-500">
             <button className="hover:text-black dark:hover:text-white transition">
              <span className="material-symbols-outlined">search</span>
            </button>
            <button onClick={toggleDarkMode} className="hover:text-black dark:hover:text-white transition">
              <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 md:p-10 shadow-2xl border border-gray-100 dark:border-zinc-800">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-3xl font-light text-zinc-900 dark:text-white uppercase tracking-wide leading-tight">
              Đăng Ký <span className="font-bold">Tài Khoản</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tạo tài khoản để theo dõi đơn hàng và nhận ưu đãi
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded text-xs">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <input 
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Tên đăng nhập *" 
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black outline-none transition text-sm dark:text-white"
              />
              <input 
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Họ và tên" 
                className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black outline-none transition text-sm dark:text-white"
              />
              <input 
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Số điện thoại" 
                className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black outline-none transition text-sm dark:text-white"
              />
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email *" 
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black outline-none transition text-sm dark:text-white"
              />
              <input 
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mật khẩu *" 
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black outline-none transition text-sm dark:text-white"
              />
              <input 
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Xác nhận mật khẩu *" 
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black outline-none transition text-sm dark:text-white"
              />
            </div>

            <div className="flex items-start py-2">
              <div className="flex items-center h-5">
                <input 
                  type="checkbox" 
                  id="agree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 text-black border-gray-300 rounded-none focus:ring-black" 
                />
              </div>
              <label htmlFor="agree" className="ml-3 text-[11px] text-gray-500 dark:text-gray-400">
                Tôi đồng ý với <a href="#" className="font-bold underline text-zinc-900 dark:text-white">Điều khoản & Chính sách</a> của Vitinh.com
              </label>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  ĐANG XỬ LÝ...
                </>
              ) : (
                'TIẾP THEO'
              )}
            </button>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4">
              Đã có tài khoản? <Link to="/login" className="font-bold text-black dark:text-white hover:underline transition-all">Đăng nhập ngay</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Register;
