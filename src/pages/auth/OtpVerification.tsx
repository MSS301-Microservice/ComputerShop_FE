import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { otpService } from '../../api/services/otpService';
import { userService } from '../../api/services/userService';

interface LocationState {
  email: string;
  mode?: 'register' | 'forgot'; // default = register
  registerData?: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    phoneNumber?: string;
  };
}

const OtpVerification: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const isForgot = state?.mode === 'forgot';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(120);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!state?.email) {
      navigate(isForgot ? '/forgot-password' : '/register');
    }
  }, [state, navigate, isForgot]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c: number) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) { setError('Vui lòng nhập đủ 6 chữ số OTP'); return; }

    setLoading(true);
    setError('');
    try {
      await otpService.verifyOtp(state!.email, otpCode);

      if (isForgot) {
        // Forgot password: navigate sang trang đặt lại mật khẩu
        navigate('/reset-password', { state: { email: state!.email } });
      } else {
        // Register: tạo tài khoản rồi về login
        await userService.createUser(state!.registerData!);
        navigate('/login', { state: { registered: true } });
      }
    } catch (err: any) {
      setError(err.message || 'OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    setError('');
    try {
      await otpService.sendOtp(state!.email);
      setCountdown(120);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Gửi lại OTP thất bại. Vui lòng thử lại.');
    } finally {
      setResending(false);
    }
  };

  const formatCountdown = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!state?.email) return null;

  return (
    <div className={`min-h-screen flex flex-col font-['Jost'] transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-zinc-900'}`}>
      {/* Nav */}
      <nav className="w-full py-6 px-8 md:px-12 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold tracking-widest uppercase text-black dark:text-white">
            VITINH<span className="text-zinc-400">.</span>
          </Link>
          <button onClick={() => { setIsDarkMode(!isDarkMode); document.documentElement.classList.toggle('dark'); }}
            className="text-gray-500 hover:text-black dark:hover:text-white transition">
            <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 md:p-10 shadow-2xl border border-gray-100 dark:border-zinc-800">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-zinc-700 dark:text-zinc-300">mark_email_read</span>
            </div>
          </div>

          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-light text-zinc-900 dark:text-white uppercase tracking-wide">
              Xác Thực <span className="font-bold">Email</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Mã OTP đã được gửi đến</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{state.email}</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded text-xs text-center">
                {error}
              </div>
            )}

            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {otp.map((digit: string, index: number) => (
                <input
                  key={index}
                  ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 dark:border-zinc-700 bg-transparent focus:border-black dark:focus:border-white outline-none transition dark:text-white rounded-md"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              {countdown > 0 ? (
                <span>Mã hết hạn sau <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatCountdown(countdown)}</span></span>
              ) : (
                <span className="text-red-500">Mã OTP đã hết hạn</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <><span className="animate-spin mr-2">⏳</span>ĐANG XÁC THỰC...</>
              ) : isForgot ? (
                'XÁC THỰC'
              ) : (
                'XÁC THỰC & ĐĂNG KÝ'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Không nhận được mã?{' '}
              <button
                onClick={handleResend}
                disabled={countdown > 0 || resending}
                className="font-bold text-black dark:text-white hover:underline disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {resending ? 'Đang gửi...' : 'Gửi lại'}
              </button>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              to={isForgot ? '/forgot-password' : '/register'}
              className="inline-flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black dark:hover:text-white transition group"
            >
              <span className="material-symbols-outlined text-sm mr-2 group-hover:-translate-x-1 transition-transform">arrow_back</span>
              {isForgot ? 'QUAY LẠI QUÊN MẬT KHẨU' : 'QUAY LẠI ĐĂNG KÝ'}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OtpVerification;
