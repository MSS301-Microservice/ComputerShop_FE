// Payment API Types

export interface PaymentDTO {
  code?: string;
  message?: string;
  paymentUrl: string;
  orderId?: number;
  amount?: number;
  bankCode?: string;
}

export interface PaymentCallbackParams {
  vnp_Amount?: string;
  vnp_BankCode?: string;
  vnp_CardType?: string;
  vnp_OrderInfo?: string;
  vnp_PayDate?: string;
  vnp_ResponseCode?: string;
  vnp_TmnCode?: string;
  vnp_TransactionNo?: string;
  vnp_TransactionStatus?: string;
  vnp_TxnRef?: string;
  vnp_SecureHash?: string;
}

export interface PaymentIpnResponse {
  RspCode: string;
  Message: string;
}

export interface PaymentResultResponse {
  orderId: number;
  amount?: number;
  status: string;
  installmentNo?: number | null;
}
