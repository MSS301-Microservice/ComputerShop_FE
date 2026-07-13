
export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  tag?: 'Mới' | 'Giảm giá' | 'Hết hàng' | 'Hot' | 'Ưu Đãi Sốc';
  description?: string;
  specs?: Record<string, string>;
}

export interface CartItem extends Product {
  quantity: number;
  cartItemId?: number; // ID from backend cart item
  variantId?: number; // Variant ID for backend API
  discountedPrice?: number; // Giá sau giảm giá nếu có
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  date: string;
  total: number;
  paymentMethod: string;
  status: 'Chờ xác nhận' | 'Đang xử lý' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy';
}
