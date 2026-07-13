import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import { motion, AnimatePresence } from 'motion/react';

const CompareBar: React.FC = () => {
  const { compareItems, removeFromCompare, clearCompare, openSearchModal } = useCompare();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (compareItems.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: isCollapsed ? 140 : 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        className="fixed bottom-8 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none font-['Jost']"
      >
        <div className="bg-white rounded-[3rem] shadow-[0_25px_70px_rgba(0,0,0,0.2)] border border-gray-100 p-5 flex items-center gap-10 pointer-events-auto">
          {/* Slots Section */}
          <div className="flex items-center gap-5">
            {[0, 1, 2].map((index) => {
              const item = compareItems[index];
              if (item) {
                return (
                  <div key={item.productId} className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white border border-gray-100 rounded-2xl p-2 group shadow-sm">
                    <img 
                      src={item.thumbnailUrl || ''} 
                      alt={item.name} 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      onClick={() => removeFromCompare(item.productId)}
                      className="absolute -top-2 -right-2 bg-white text-gray-400 w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:text-red-500 transition border border-gray-50 z-10"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-full px-1">
                      <p className="text-[8px] font-bold text-gray-400 truncate text-center bg-white/90 backdrop-blur-sm rounded py-0.5">{item.name}</p>
                    </div>
                  </div>
                );
              }
              return (
                <button 
                  key={index}
                  onClick={openSearchModal}
                  className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-300 hover:border-gray-300 hover:text-gray-500 transition group bg-gray-50/30"
                >
                  <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">add_circle</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest">Thêm sản phẩm</span>
                </button>
              );
            })}
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-6 pl-8 border-l border-gray-100">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Đã chọn {compareItems.length} sản phẩm</p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="px-5 py-2.5 bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-100 transition"
                >
                  {isCollapsed ? 'Mở rộng' : 'Thu gọn'}
                </button>
                <button 
                  onClick={clearCompare}
                  className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 transition"
                >
                  Xóa hết
                </button>
              </div>
            </div>
            
            <Link 
              to="/compare"
              className="px-10 py-5 bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl hover:bg-red-700 transition shadow-xl shadow-red-600/20 flex items-center gap-3"
            >
              So sánh ngay
              <span className="material-symbols-outlined text-sm">compare_arrows</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompareBar;
