export type GroupBy = 'DAY' | 'MONTH' | 'YEAR';

export interface RevenueTimeBreakdown {
  period: string;
  revenue: number;
  orderCount: number;
}

export interface RevenueTimeResponse {
  fromDate: string;
  toDate: string;
  groupBy: GroupBy;
  totalRevenue: number;
  totalOrders: number;
  breakdown: RevenueTimeBreakdown[];
}

export interface RevenueProductItem {
  productName: string;
  variantName: string;
  totalSold: number;
  revenue: number;
}

export interface RevenueProductResponse {
  fromDate: string;
  toDate: string;
  totalRevenue: number;
  products: RevenueProductItem[];
}

export interface InstallmentSummary {
  totalPaid: number;
  totalUnpaid: number;
  totalOverdue: number;
  total: number;
}

export interface InstallmentOrderItem {
  orderId: number;
  customerUsername: string;
  orderTotal: number;
  totalInstallments: number;
  paidInstallments: number;
  remainingInstallments: number;
  nextDueDate: string;
}

export interface RevenueInstallmentResponse {
  summary: InstallmentSummary;
  orders: InstallmentOrderItem[];
}
