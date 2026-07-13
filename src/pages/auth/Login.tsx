import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          prompt: () => void;
          renderButton: (el: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

const Login: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();

  const registeredSuccess = (location.state as any)?.registered === true;
  const passwordResetSuccess = (location.state as any)?.passwordReset === true;

  const navigateByRole = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = (payload.scope || '').toLowerCase();
      navigate(role === 'admin' || role === 'staff' ? '/admin' : '/');
    } catch {
      navigate('/');
    }
  };

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle(credential);
      const token = localStorage.getItem('authToken');
      if (token) navigateByRole(token);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập Google thất bại.');
    } finally {
      setGoogleLoading(false);
    }
  }, [loginWithGoogle]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const initAndRender = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => handleGoogleCredential(response.credential),
      });
      if (googleBtnRef.current) {
        window.google?.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: googleBtnRef.current.offsetWidth || 400,
          text: 'signin_with',
          locale: 'vi',
        });
      }
    };
    if (window.google) {
      initAndRender();
    } else {
      const interval = setInterval(() => {
        if (window.google) { initAndRender(); clearInterval(interval); }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [handleGoogleCredential]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const token = localStorage.getItem('authToken');
      if (token) navigateByRole(token);
      else navigate('/');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex font-['Jost'] transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
      <div className="flex w-full h-screen overflow-hidden">
        {/* Left Side */}
        <div className="hidden lg:block w-1/2 h-full relative bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
          <div className="absolute inset-0 bg-black/30 z-10"></div>
          <img
            alt="High End PC Component Art"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMOHdFA3XTXAcM80rjSMRd5he5w7XyvbPyJqQcgjCxWpNcTuCAhi632wFZ1AEk-Yu2V1u98siSDnWI0gqe9mJuirSb-MT_Ja8yxpxXcVB3FzWuFs1fwZbh0mcbj4-aAOhLHHuSxNcRKQ7TNoNaU3wowCci0R1EwSQLdTqpObhGfpMxSTyglK1eU9cN0LTio5DzqivUWNndpJMfL26m_4JvOO2rS2QiWofdNwmPnqudFd39UwQuOqaTsGaBNtkgQKxIOd45ygiD3BE"
          />
          <div className="absolute bottom-12 left-12 z-20 text-white max-w-lg">
            <h2 className="text-4xl font-light mb-4">Sức Mạnh <br /><span className="font-bold">Không Giới Hạn.</span></h2>
            <p className="text-gray-200 text-sm leading-relaxed tracking-wide opacity-90">
              Khám phá hệ sinh thái linh kiện máy tính đỉnh cao dành cho những người kiến tạo tương lai.
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/2 h-full flex flex-col relative overflow-y-auto bg-white dark:bg-zinc-950">
          <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-20">
            <Link to="/" className="text-2xl font-bold tracking-widest uppercase text-black dark:text-white">
              VITINH<span className="text-zinc-400">.</span>
            </Link>
            <button onClick={toggleDarkMode} className="text-gray-500 hover:text-black dark:hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[24px]">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 md:px-24 py-20">
            <div className="w-full max-w-md space-y-10">
              <div>
                <h1 className="text-3xl md:text-4xl font-light text-black dark:text-white mb-3">Đăng Nhập</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Chào mừng trở lại. Vui lòng nhập thông tin của bạn.</p>
              </div>

              <form className="space-y-6" onSubmit={handleLogin}>
                {registeredSuccess && (
                  <p className="text-xs text-green-700 font-bold bg-green-50 dark:bg-green-900/20 p-3 rounded">
                    Đăng ký thành công! Vui lòng đăng nhập.
                  </p>
                )}
                {passwordResetSuccess && (
                  <p className="text-xs text-green-700 font-bold bg-green-50 dark:bg-green-900/20 p-3 rounded">
                    Đặt lại mật khẩu thành công! Vui lòng đăng nhập.
                  </p>
                )}
                {error && <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</p>}

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">EMAIL</label>
                  <input
                    type="text" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@vitinh.com"
                    className="w-full bg-transparent border border-gray-200 dark:border-zinc-800 p-4 text-sm focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white outline-none transition dark:text-white rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">MẬT KHẨU</label>
                    <Link to="/forgot-password" className="text-[10px] font-bold text-gray-400 hover:text-black dark:hover:text-white transition uppercase tracking-widest">
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent border border-gray-200 dark:border-zinc-800 p-4 text-sm focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white outline-none transition dark:text-white rounded-md"
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-[#1a1a1a] dark:bg-white text-white dark:text-black py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-black dark:hover:bg-zinc-200 transition-all shadow-lg rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? <><span className="animate-spin mr-2">⏳</span>ĐANG ĐĂNG NHẬP...</> : 'ĐĂNG NHẬP'}
                </button>
              </form>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-100 dark:border-zinc-800"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest">HOẶC</span>
                <div className="flex-grow border-t border-gray-100 dark:border-zinc-800"></div>
              </div>

              {/* Google Sign-In Button — rendered by GSI SDK */}
              <div className="flex justify-center min-h-[44px]">
                {googleLoading ? (
                  <div className="w-full border border-gray-200 py-4 flex items-center justify-center rounded-md">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">ĐANG XỬ LÝ...</span>
                  </div>
                ) : (
                  <div ref={googleBtnRef} className="w-full" />
                )}
              </div>

              <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4">
                Chưa có tài khoản? <Link to="/register" className="font-bold text-black dark:text-white hover:underline transition-all">Đăng ký ngay</Link>
              </p>

              <div className="pt-8 text-center">
                <Link to="/" className="inline-flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black dark:hover:text-white transition group">
                  <span className="material-symbols-outlined text-sm mr-2 group-hover:-translate-x-1 transition-transform">arrow_back</span>
                  QUAY LẠI TRANG CHỦ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
