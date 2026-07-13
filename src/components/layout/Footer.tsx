import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer style={{ background: '#002B5B', borderTop: '1px solid rgba(0,212,255,0.15)' }}>
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 pb-12" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#00D4FF' }}>
                <span className="material-symbols-outlined text-base" style={{ color: '#002B5B' }}>memory</span>
              </div>
              <span className="text-xl font-black tracking-tighter uppercase" style={{ color: '#F8FAFC' }}>
                VITINH<span style={{ color: '#00D4FF' }}>.COM</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#64748B' }}>
              Linh kiện máy tính cao cấp và các bộ máy tùy chỉnh dành cho người đam mê, game thủ và chuyên gia.
            </p>
            <div className="flex gap-3 mt-6">
              {['facebook', 'instagram', 'tiktok'].map(s => (
                <button key={s} className="w-9 h-9 rounded-lg flex items-center justify-center transition hover:opacity-80" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}>
                  <span className="material-symbols-outlined text-base">link</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-5" style={{ color: '#00D4FF' }}>Cửa Hàng</h5>
            <ul className="space-y-3">
              {['Laptop', 'PC Để Bàn', 'Linh Kiện', 'Phụ Kiện'].map(item => (
                <li key={item}>
                  <Link to="/shop" className="text-sm transition" style={{ color: '#64748B' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F8FAFC'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748B'}
                  >{item}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-5" style={{ color: '#00D4FF' }}>Hỗ Trợ</h5>
            <ul className="space-y-3">
              {['Liên Hệ', 'Câu Hỏi', 'Bảo Hành', 'Đổi Trả'].map(item => (
                <li key={item}>
                  <span className="text-sm cursor-pointer transition" style={{ color: '#64748B' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F8FAFC'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748B'}
                  >{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: '#334155' }}>© 2025 VITINH.COM. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest" style={{ color: '#334155' }}>Hệ thống hoạt động bình thường</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
