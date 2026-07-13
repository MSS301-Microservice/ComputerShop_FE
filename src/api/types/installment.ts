// Installment Package API Types — aligned with backend DTOs

export interface InstallmentPackageResponse {
  packageId: number;
  name: string;
  durationMonths: number;
  interestRate: number;
  minOrderAmount: number;
  downPaymentPercentage: number;
  active: boolean; // Jackson serializes boolean isActive() getter as "active"
}

export interface InstallmentPackageRequest {
  name: string;
  durationMonths: number;
  interestRate: number;
  minOrderAmount: number;
  downPaymentPercentage: number;
  isActive: boolean; // request field stays isActive
}

export interface InstallmentCalculateRequest {
  packageId: number;
  orderAmount: number;
}

export interface InstallmentScheduleItem {
  installmentNo: number;
  dueDate: string;
  amount: number;
  status?: string;
}

export interface InstallmentPreviewResponse {
  orderAmount: number;
  downPaymentPercentage: number;
  downPaymentAmount: number;
  remainingBalance: number;
  monthlyInstallmentAmount: number;
  interestRate: number;
  durationMonths: number;
  totalPayableAmount: number;
  schedule: InstallmentScheduleItem[];
}
