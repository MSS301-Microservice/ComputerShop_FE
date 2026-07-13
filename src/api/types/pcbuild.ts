// PCBuild API Types

export type ComponentType =
  | 'CPU'
  | 'MAINBOARD'
  | 'RAM'
  | 'GPU'
  | 'STORAGE_PRIMARY'
  | 'STORAGE_SECONDARY'
  | 'PSU'
  | 'CASE'
  | 'COOLING'
  | 'MONITOR'
  | 'KEYBOARD'
  | 'MOUSE';

export type BuildStatus = 'DRAFT' | 'SAVED' | 'ORDERED';

export const COMPONENT_DISPLAY_NAMES: Record<ComponentType, string> = {
  CPU: 'CPU / Bộ xử lý',
  MAINBOARD: 'Bo mạch chủ',
  RAM: 'RAM / Bộ nhớ',
  GPU: 'Card đồ họa',
  STORAGE_PRIMARY: 'Ổ cứng chính (SSD/NVMe)',
  STORAGE_SECONDARY: 'Ổ cứng phụ (HDD/SSD)',
  PSU: 'Nguồn máy tính',
  CASE: 'Vỏ case',
  COOLING: 'Tản nhiệt',
  MONITOR: 'Màn hình',
  KEYBOARD: 'Bàn phím',
  MOUSE: 'Chuột',
};

export const COMPONENT_CATEGORY_NAMES: Record<ComponentType, string> = {
  CPU: 'CPU',
  MAINBOARD: 'Mainboard',
  RAM: 'RAM',
  GPU: 'VGA',
  STORAGE_PRIMARY: 'SSD',
  STORAGE_SECONDARY: 'HDD',
  PSU: 'PSU',
  CASE: 'Case',
  COOLING: 'Tản nhiệt',
  MONITOR: 'Màn hình',
  KEYBOARD: 'Bàn phím',
  MOUSE: 'Chuột',
};

export const COMPONENT_ICONS: Record<ComponentType, string> = {
  CPU: 'memory',
  MAINBOARD: 'developer_board',
  RAM: 'sd_card',
  GPU: 'videogame_asset',
  STORAGE_PRIMARY: 'storage',
  STORAGE_SECONDARY: 'hard_drive',
  PSU: 'power',
  CASE: 'computer',
  COOLING: 'mode_fan',
  MONITOR: 'monitor',
  KEYBOARD: 'keyboard',
  MOUSE: 'mouse',
};

// Multi-slot components (can have multiple)
export const MULTI_SLOT_COMPONENTS: ComponentType[] = [
  'RAM', 'STORAGE_SECONDARY', 'COOLING', 'MONITOR', 'KEYBOARD', 'MOUSE',
];

// Required components for a complete build
export const REQUIRED_COMPONENTS: ComponentType[] = [
  'CPU', 'MAINBOARD', 'RAM', 'STORAGE_PRIMARY', 'PSU', 'CASE',
];

export interface PCBuildItemResponse {
  buildItemId: number;
  componentType: ComponentType;
  componentTypeName: string;
  variantId: number;
  variantName: string;
  sku?: string;
  price: number;
  quantity: number;
  subtotal: number;
  productId: number;
  productName: string;
  thumbnailUrl?: string;
}

export interface PCBuildResponse {
  buildId: number;
  buildName?: string;
  status: BuildStatus;
  totalPrice: number;
  createdAt?: string;
  updatedAt?: string;
  items: PCBuildItemResponse[];
}

export interface AddBuildItemRequest {
  componentType: ComponentType;
  variantId: number;
  quantity?: number;
}

export interface SaveBuildNameRequest {
  buildName: string;
}

export interface CompatibilityItemHint {
  componentType: ComponentType;
  variantId: number;
}

export interface CompatibleVariantsRequest {
  currentItems: CompatibilityItemHint[];
  targetComponentType: ComponentType;
}

export interface CompatibilityFilterHint {
  attributeName: string;
  operator?: string;   // eq, lte, gte (field cũ, giữ để tương thích)
  value?: string;      // field cũ
  requiredValue?: string; // field BE thực tế trả về
  comparison?: string;    // field BE thực tế trả về (eq, lte, gte)
  ruleType?: string;
}

export interface CompatibleVariantsResponse {
  categoryId?: number;
  hints: CompatibilityFilterHint[];
}
