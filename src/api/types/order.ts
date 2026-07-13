// Order API Types

export interface OrderItemResponse {
  orderItemId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  // Variant info
  variantId: number;
  variantName?: string;
  sku?: string;
  // Product info
  productId: number;
  productName?: string;
  thumbnailUrl?: string;
  // Shipping info
  recipientName?: string;
  recipientPhone?: string;
  shippingAddress?: string;
  // ProductItem info
  serialNumber?: string;
}

export interface PaymentScheduleResponse {
  scheduleId?: number;
  paymentScheduleId?: number; // backend thực tế trả field này
  installmentNo?: number;
  dueDate: string;
  amount: number;
  status: string; // PENDING, UNPAID, PAID, OVERDUE
  paidDate?: string;
  vnpTransactionNo?: string;
  penaltyAmount?: number; // Tiền phạt khi quá hạn
}

export interface OrderResponse {
  orderId: number;
  userId: number;
  username?: string;
  totalAmount: number;
  status: string; // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  paymentType: string; // FULL, INSTALLMENT, COD (legacy FE field)
  paymentMethod?: string; // COD, VNPAY
  paymentMode?: string; // FULL, INSTALLMENT
  orderDate?: string;
  items?: OrderItemResponse[];
  payments?: PaymentScheduleResponse[];
  paymentUrl?: string;
  // Backward compatibility
  userName?: string;
  userEmail?: string;
  createdAt?: string;
  recipientName?: string;
  recipientPhone?: string;
  shippingAddress?: string;
  notes?: string;
  updatedAt?: string;
}

export interface PlaceOrderRequest {
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  paymentMethod: 'COD' | 'VNPAY';
  paymentMode: 'FULL' | 'INSTALLMENT';
  packageId?: number; // Required for INSTALLMENT
  variantIds?: number[]; // Optional: Choose specific products from cart. If NULL or EMPTY, take all cart items.
}

export interface UpdateOrderStatusRequest {
  status: string; // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
}
