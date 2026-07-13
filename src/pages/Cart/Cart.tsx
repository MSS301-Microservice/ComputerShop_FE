import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const Cart: React.FC = () => {
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    totalPrice, 
    totalItems,
    selectedItems,
    selectedTotalPrice,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    isItemSelected
  } = useCart();
  const navigate = useNavigate();

  const allSelected = cart.length > 0 && cart.every(item => item.cartItemId && isItemSelected(item.cartItemId));
  const hasSelectedItems = selectedItems.length > 0;

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4" style={{ background: '#F8FAFC' }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(0,43,91,0.08)', border: '1px solid rgba(0,43,91,0.15)' }}>
          <span className="material-symbols-outlined text-4xl" style={{ color: '#002B5B' }}>shopping_basket</span>
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2" style={{ color: '#002B5B' }}>Giỏ hàng trống</h2>
        <p className="text-sm mb-8" style={{ color: '#64748B' }}>Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
        <Link to="/shop" className="px-10 py-4 text-[11px] font-bold uppercase tracking-widest rounded-xl transition text-white hover:opacity-90" style={{ background: '#002B5B' }}>
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* Cart Items */}
          <div className="flex-1">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: '#64748B' }}>— Giỏ hàng</p>
                <h1 className="text-4xl font-black uppercase tracking-tight" style={{ color: '#002B5B' }}>
                  {totalItems} Sản phẩm
                </h1>
              </div>
              
              {/* Select All Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={allSelected ? deselectAllItems : selectAllItems}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition"
                  style={{ color: '#64748B' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#002B5B'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748B'}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                    allSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {allSelected && <span className="material-symbols-outlined text-white text-xs">check</span>}
                  </div>
                  {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {cart.map((item) => {
                const selected = item.cartItemId ? isItemSelected(item.cartItemId) : false;
                return (
                  <div key={item.id} className={`flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl transition-all group ${
                    selected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}
                    style={{ border: `1px solid ${selected ? '#3b82f6' : '#e2e8f0'}` }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = selected ? '#3b82f6' : '#002B5B'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = selected ? '#3b82f6' : '#e2e8f0'}
                  >
                    {/* Selection Checkbox */}
                    {item.cartItemId && (
                      <button
                        onClick={() => toggleItemSelection(item.cartItemId!)}
                        className="flex-shrink-0"
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                          selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-blue-400'
                        }`}>
                          {selected && <span className="material-symbols-outlined text-white text-sm">check</span>}
                        </div>
                      </button>
                    )}

                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#F8FAFC' }}>
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" referrerPolicy="no-referrer" />
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <h3 className="text-sm font-bold truncate mb-1" style={{ color: '#002B5B' }}>{item.name}</h3>
                      <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: '#64748B' }}>{item.category}</p>
                    </div>

                    {/* Qty */}
                    <div className="flex items-center rounded-xl p-1" style={{ background: '#F8FAFC', border: '1px solid #e2e8f0' }}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.cartItemId)}
                        className="w-8 h-8 flex items-center justify-center transition rounded-lg" style={{ color: '#64748B' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#002B5B'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748B'}
                      >
                        <span className="material-symbols-outlined text-sm">remove</span>
                      </button>
                      <span className="w-10 text-center text-xs font-bold" style={{ color: '#002B5B' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.cartItemId)}
                        className="w-8 h-8 flex items-center justify-center transition rounded-lg" style={{ color: '#64748B' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#002B5B'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748B'}
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-center sm:text-right min-w-[110px]">
                      <p className="text-sm font-black" style={{ color: '#002B5B' }}>{fmt(item.price * item.quantity)}</p>
                      <p className="text-[10px] mt-1" style={{ color: '#64748B' }}>{fmt(item.price)} / cái</p>
                      {item.originalPrice && <p className="text-[10px] line-through" style={{ color: '#ef4444' }}>{fmt(item.originalPrice)}</p>}
                    </div>

                    <button onClick={() => removeFromCart(item.id, item.cartItemId)} className="p-2 transition rounded-lg" style={{ color: '#cbd5e1' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#cbd5e1'}
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-10">
              <Link to="/shop" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition" style={{ color: '#64748B' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#002B5B'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748B'}
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>

          {/* Summary */}
          <div className="w-full lg:w-96">
            <div className="rounded-2xl p-8 sticky top-24 bg-white" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,43,91,0.08)' }}>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 pb-4" style={{ color: '#64748B', borderBottom: '1px solid #e2e8f0' }}>Tóm tắt đơn hàng</h3>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#64748B' }}>Sản phẩm đã chọn</span>
                  <span className="font-bold" style={{ color: '#002B5B' }}>{selectedItems.length}/{totalItems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#64748B' }}>Tạm tính</span>
                  <span className="font-bold" style={{ color: '#002B5B' }}>{fmt(selectedTotalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#64748B' }}>Giao hàng</span>
                  <span className="font-bold uppercase text-[10px] tracking-widest" style={{ color: '#22c55e' }}>Miễn phí</span>
                </div>
                <div className="pt-4 flex justify-between items-end" style={{ borderTop: '1px solid #e2e8f0' }}>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>Tổng cộng</span>
                  <div className="text-right">
                    <p className="text-2xl font-black leading-none" style={{ color: '#002B5B' }}>{fmt(selectedTotalPrice)}</p>
                    <p className="text-[10px] mt-1 uppercase font-bold" style={{ color: '#64748B' }}>Đã bao gồm VAT</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => navigate('/checkout')}
                disabled={!hasSelectedItems}
                className={`w-full py-4 text-[11px] font-bold uppercase tracking-widest rounded-xl transition text-white mb-4 ${
                  hasSelectedItems ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'
                }`}
                style={{ background: '#002B5B' }}
              >
                {hasSelectedItems ? 'Tiến hành thanh toán' : 'Chọn sản phẩm để thanh toán'}
              </button>

              <div className="flex items-center justify-center gap-4 opacity-40 grayscale">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
