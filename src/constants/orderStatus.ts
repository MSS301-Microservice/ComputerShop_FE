// Order Status Constants

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED', 
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [ORDER_STATUS.PENDING]: 'Chờ xác nhận',
  [ORDER_STATUS.CONFIRMED]: 'Đã xác nhận',
  [ORDER_STATUS.PROCESSING]: 'Đang xử lý',
  [ORDER_STATUS.SHIPPED]: 'Đang vận chuyển',
  [ORDER_STATUS.DELIVERED]: 'Đã giao',
  [ORDER_STATUS.CANCELLED]: 'Đã hủy',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [ORDER_STATUS.PENDING]: 'bg-orange-100 text-orange-600',
  [ORDER_STATUS.CONFIRMED]: 'bg-blue-100 text-blue-600',
  [ORDER_STATUS.PROCESSING]: 'bg-cyan-100 text-cyan-700',
  [ORDER_STATUS.SHIPPED]: 'bg-indigo-100 text-indigo-600',
  [ORDER_STATUS.DELIVERED]: 'bg-green-100 text-green-600',
  [ORDER_STATUS.CANCELLED]: 'bg-red-100 text-red-600',
};

// Thứ tự chuyển trạng thái: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
// User và shop có thể hủy (CANCELLED) từ PENDING hoặc CONFIRMED
// Một khi đã CANCELLED thì không thể chuyển sang trạng thái khác
// Không thể quay lại trạng thái trước đó
export const getNextOrderStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
  const nextStatuses: OrderStatus[] = [];
  
  switch (currentStatus) {
    case ORDER_STATUS.PENDING:
      nextStatuses.push(ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED);
      break;
    case ORDER_STATUS.CONFIRMED:
      nextStatuses.push(ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED);
      break;
    case ORDER_STATUS.PROCESSING:
      nextStatuses.push(ORDER_STATUS.SHIPPED);
      break;
    case ORDER_STATUS.SHIPPED:
      nextStatuses.push(ORDER_STATUS.DELIVERED);
      break;
    case ORDER_STATUS.DELIVERED:
    case ORDER_STATUS.CANCELLED:
      // Terminal states - không thể chuyển sang trạng thái khác
      break;
    default:
      break;
  }
  
  return nextStatuses;
};

// Kiểm tra xem user có thể hủy đơn hàng không
export const canCancelOrder = (status: OrderStatus): boolean => {
  return [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(status);
};

// Kiểm tra xem trạng thái có phải là terminal state không
export const isTerminalStatus = (status: OrderStatus): boolean => {
  return [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(status);
};