import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/ui/ProductCard';
import { productService } from '../../api/services/productService';
import { ProductResponse } from '../../api/types/product';

const Home: React.FC = () => {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getProductsPaged({ page: 0, size: 8 })
      .then(data => setProducts(data.content))
      .catch(() => {
        productService.getAllProducts()
          .then(data => setProducts(data.slice(0, 8)))
          .catch(err => console.error('Error fetching products:', err));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#020617', color: '#F8FAFC' }}>
      {/* CSS Animations - Giúp các thành phần bay bổng */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-20px) rotate(0deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(15px) rotate(15deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
      `}</style>

      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-32 md:pb-40">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] z-0" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] z-0" />

        <div className="relative max-w-7xl mx-auto px-6 z-10 flex flex-col md:flex-row items-center gap-16">
          {/* Left Content */}
          <div className="w-full md:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase">Silicon Horizon Premium</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
              BEYOND <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">LIMITS.</span>
            </h1>

            <p className="text-lg text-slate-400 max-w-md leading-relaxed border-l-2 border-cyan-500/50 pl-6">
              Trải nghiệm sức mạnh đột phá với những cấu hình PC được tinh chỉnh tuyệt đối. Đánh bại mọi giới hạn đồ họa.
            </p>

            <div className="flex flex-wrap gap-5 pt-4">
              <Link to="/shop" className="group relative px-8 py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                <span className="relative flex items-center gap-2 uppercase tracking-wider">
                  MUA NGAY <span className="material-symbols-outlined">bolt</span>
                </span>
              </Link>
              <Link to="/build-pc" className="px-8 py-4 bg-slate-800/50 backdrop-blur-md border border-slate-700 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all flex items-center gap-2 uppercase tracking-wider">
                TỰ BUILD PC <span className="material-symbols-outlined text-sm">settings</span>
              </Link>
            </div>
          </div>

          {/* Right Content - THE DYNAMIC COLLAGE (Thay thế ảnh đơn) */}
          <div className="w-full md:w-1/2 relative h-[500px] flex items-center justify-center">
            {/* Ảnh chính - Case PC */}
            <div className="relative z-20 animate-float">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOSPFHG6GSn8QGVfVQHtKhuTls0Cf_a0PPBVyGWBWXELHIIpHSg2_Ovkti0FpK-C31xs_0KvIJwYGGU5l4RsGRSudHKdY-dFQHUwEGJarOp1xyq7n2UVcZDWN0HK_ye53514XC0Cp1JMAgqUHXwstG0D_RQJ970YVjWaC6sQDbLmHV8GXyVWi9Hzb7Kkjv0MIsfRCIIgtDqqhEN8wQHtIC20NNPCUUHn-G33jkNqxMn2wW8-5UphkdtvWMVJEpeoRxNiasauT2a_Y"
                alt="Main Setup"
                className="w-[320px] md:w-[400px] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
              />
              
              {/* Thẻ chỉ số ảo (UI trang trí) nằm đè lên ảnh */}
              <div className="absolute -bottom-6 -right-4 bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 p-5 rounded-3xl shadow-2xl z-30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                  <div>
                    <div className="text-cyan-400 font-black text-xl leading-none">99%</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Performance</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ảnh phụ 1 - Linh kiện bay phía trên */}
            <div className="absolute -top-10 -left-10 z-30 animate-float-slow">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMOHdFA3XTXAcM80rjSMRd5he5w7XyvbPyJqQcgjCxWpNcTuCAhi632wFZ1AEk-Yu2V1u98siSDnWI0gqe9mJuirSb-MT_Ja8yxpxXcVB3FzWuFs1fwZbh0mcbj4-aAOhLHHuSxNcRKQ7TNoNaU3wowCci0R1EwSQLdTqpObhGfpMxSTyglK1eU9cN0LTio5DzqivUWNndpJMfL26m_4JvOO2rS2QiWofdNwmPnqudFd39UwQuOqaTsGaBNtkgQKxIOd45ygiD3BE"
                alt="Component"
                className="w-44 h-32 object-cover rounded-2xl shadow-2xl border border-white/20 rotate-[-15deg]"
              />
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-cyan-500/10 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-500/5 rounded-full" />
          </div>
        </div>
      </section>

      {/* --- BENEFITS --- */}
      <section className="relative z-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-8 rounded-[2.5rem] bg-slate-900/50 border border-white/5 backdrop-blur-2xl shadow-2xl">
          {[
            { icon: 'local_shipping', title: 'Giao Hỏa Tốc', desc: 'Nội thành trong 2h' },
            { icon: 'verified_user', title: 'Bảo Hành 36T', desc: 'Lỗi 1 đổi 1 tận nơi' },
            { icon: 'support_agent', title: 'Hỗ Trợ 24/7', desc: 'Kỹ thuật viên chuyên nghiệp' },
            { icon: 'payments', title: 'Trả Góp 0%', desc: 'Thủ tục nhanh gọn' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center gap-3 group p-4 rounded-2xl hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">{item.title}</h4>
                <p className="text-[10px] text-slate-500 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FEATURED PRODUCTS --- */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-cyan-500" />
              <span className="text-xs font-bold text-cyan-500 uppercase tracking-[0.3em]">Hàng mới về</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
              SẢN PHẨM <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">NỔI BẬT</span>
            </h2>
          </div>
          <Link to="/shop" className="group flex items-center gap-3 px-6 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/50 transition-all">
            <span className="text-xs font-bold uppercase tracking-widest">Xem tất cả</span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <div key={product.productId} className="group relative">
                {/* Glow Effect on Hover */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-white/5">
                  <ProductCard product={product} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- BANNER TITAN SERIES --- */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-slate-900 to-black border border-white/5">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-cyan-500/5 z-0 skew-x-12 translate-x-20" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center p-12 md:p-24 gap-12">
            <div className="md:w-1/2 space-y-8 text-center md:text-left">
              <h2 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter uppercase italic">
                TITAN <br />
                <span className="text-cyan-500 text-shadow-glow">MOD X</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                Được thiết kế cho những người khao khát hiệu năng tuyệt đối. Hệ thống tản nhiệt nước Custom độc quyền từ Silicon Horizon.
              </p>
              <button className="px-10 py-4 bg-white text-slate-950 font-black rounded-full hover:bg-cyan-400 transition-all flex items-center gap-2 uppercase tracking-tighter mx-auto md:mx-0">
                KHÁM PHÁ CHI TIẾT <span className="material-symbols-outlined">trending_flat</span>
              </button>
            </div>
            
            <div className="md:w-1/2 relative group">
              <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full" />
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMOHdFA3XTXAcM80rjSMRd5he5w7XyvbPyJqQcgjCxWpNcTuCAhi632wFZ1AEk-Yu2V1u98siSDnWI0gqe9mJuirSb-MT_Ja8yxpxXcVB3FzWuFs1fwZbh0mcbj4-aAOhLHHuSxNcRKQ7TNoNaU3wowCci0R1EwSQLdTqpObhGfpMxSTyglK1eU9cN0LTio5DzqivUWNndpJMfL26m_4JvOO2rS2QiWofdNwmPnqudFd39UwQuOqaTsGaBNtkgQKxIOd45ygiD3BE"
                alt="Titan PC"
                className="relative z-10 w-full transform group-hover:scale-105 transition-transform duration-700 ease-out drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;