// API Configuration
// Empty string in dev so Vite proxy handles routing (avoids CORS)
export const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
export const API_VERSION = '/api/v1';

// API Endpoints
export const API_ENDPOINTS = {
  // Attributes
  ATTRIBUTES: `${API_VERSION}/attributes`,
  ATTRIBUTES_PAGED: `${API_VERSION}/attributes/paged`,
  ATTRIBUTE_BY_ID: (id: number) => `${API_VERSION}/attributes/${id}`,
  
  // Products
  PRODUCTS: `${API_VERSION}/products`,
  PRODUCTS_PAGED: `${API_VERSION}/products/paged`,
  PRODUCT_BY_ID: (id: number) => `${API_VERSION}/products/${id}`,
  PRODUCTS_SEARCH: `${API_VERSION}/products/search`,
  PRODUCTS_SEARCH_PAGED: `${API_VERSION}/products/search/paged`,
  
  // Categories
  CATEGORIES: `${API_VERSION}/categories`,
  CATEGORIES_PAGED: `${API_VERSION}/categories/paged`,
  CATEGORY_BY_ID: (id: number) => `${API_VERSION}/categories/${id}`,
  CATEGORIES_TREE: `${API_VERSION}/categories/tree`,
  CATEGORIES_PARENTS: `${API_VERSION}/categories/parents`,
  CATEGORIES_CHILDREN: (id: number) => `${API_VERSION}/categories/${id}/children`,
  
  // Brands (to be implemented)
  BRANDS: `${API_VERSION}/brands`,
  BRANDS_PAGED: `${API_VERSION}/brands/paged`,
  BRAND_BY_ID: (id: number) => `${API_VERSION}/brands/${id}`,
  
  // Orders
  ORDERS: `${API_VERSION}/orders`,
  ORDERS_PAGED: `${API_VERSION}/orders/paged`,
  ORDERS_ME: `${API_VERSION}/orders/me`,
  ORDERS_ME_PAGED: `${API_VERSION}/orders/me/paged`,
  ORDER_BY_ID: (id: number) => `${API_VERSION}/orders/${id}`,
  ORDER_UPDATE_STATUS: (id: number) => `${API_VERSION}/orders/${id}/status`,
  ORDER_CANCEL: (id: number) => `${API_VERSION}/orders/${id}/cancel`,
  
  // Users
  USERS: `${API_VERSION}/users`,
  USERS_PAGED: `${API_VERSION}/users/paged`,
  USER_BY_ID: (id: number) => `${API_VERSION}/users/${id}`,
  USER_ME: `${API_VERSION}/users/me`,
  
  // Roles
  ROLES: `${API_VERSION}/roles`,
  ROLES_PAGED: `${API_VERSION}/roles/paged`,
  ROLE_BY_ID: (id: number) => `${API_VERSION}/roles/${id}`,
  
  // Blogs
  BLOGS: `${API_VERSION}/blogs`,
  BLOGS_PAGED: `${API_VERSION}/blogs/paged`,
  BLOG_BY_ID: (id: number) => `${API_VERSION}/blogs/${id}`,
  BLOGS_BY_USER: (userId: number) => `${API_VERSION}/blogs/user/${userId}`,
  
  // Cart
  CART: `${API_VERSION}/cart`,
  CART_ITEMS: `${API_VERSION}/cart/items`,
  CART_ITEM_BY_ID: (cartItemId: number) => `${API_VERSION}/cart/items/${cartItemId}`,
  
  // Installment Packages
  INSTALLMENT_PACKAGES: `${API_VERSION}/installment-packages`,
  INSTALLMENT_PACKAGES_PAGED: `${API_VERSION}/installment-packages/paged`,
  INSTALLMENT_PACKAGES_ACTIVE: `${API_VERSION}/installment-packages/active`,
  INSTALLMENT_PACKAGE_BY_ID: (id: number) => `${API_VERSION}/installment-packages/${id}`,
  INSTALLMENT_CALCULATE: `${API_VERSION}/installment-packages/calculate`,
  
  // Promotions
  PROMOTIONS: `${API_VERSION}/promotions`,
  PROMOTIONS_PAGED: `${API_VERSION}/promotions/paged`,
  PROMOTION_BY_ID: (id: number) => `${API_VERSION}/promotions/${id}`,
  PROMOTION_BY_CODE: (code: string) => `${API_VERSION}/promotions/code/${code}`,
  PROMOTION_ADD_TO_PRODUCTS: `${API_VERSION}/promotions/add-to-products`,
  PROMOTION_ADD_TO_CATEGORY: `${API_VERSION}/promotions/add-to-category`,
  PROMOTION_ADD_TO_BRAND: `${API_VERSION}/promotions/add-to-brand`,
  
  // PC Builds
  PC_BUILDS: `${API_VERSION}/pc-builds`,
  PC_BUILDS_DRAFT: `${API_VERSION}/pc-builds/draft`,
  PC_BUILDS_DRAFT_ITEMS: `${API_VERSION}/pc-builds/draft/items`,
  PC_BUILDS_DRAFT_ITEM: (buildItemId: number) => `${API_VERSION}/pc-builds/draft/items/${buildItemId}`,
  PC_BUILDS_DRAFT_SAVE: `${API_VERSION}/pc-builds/draft/save`,
  PC_BUILDS_DRAFT_ORDER: `${API_VERSION}/pc-builds/draft/order`,
  PC_BUILDS_COMPATIBLE: `${API_VERSION}/pc-builds/compatible-variants`,

  // Warranties
  WARRANTY_BY_ID: (id: number) => `${API_VERSION}/warranties/${id}`,
  WARRANTIES_BY_ORDER: (orderId: number) => `${API_VERSION}/warranties/order/${orderId}`,
  WARRANTIES_BY_PHONE: (phone: string) => `${API_VERSION}/warranties/phone/${phone}`,
  WARRANTY_UPDATE_STATUS: (id: number) => `${API_VERSION}/warranties/${id}/status`,

  // Warranty Claims
  CLAIMS: `${API_VERSION}/claims`,
  CLAIM_BY_ID: (id: number) => `${API_VERSION}/claims/${id}`,
  CLAIMS_BY_WARRANTY: (warrantyId: number) => `${API_VERSION}/claims/warranty/${warrantyId}`,

  // Reports
  REPORTS_REVENUE_TIME: `${API_VERSION}/reports/revenue/time`,
  REPORTS_REVENUE_TIME_EXPORT: `${API_VERSION}/reports/revenue/time/export`,
  REPORTS_REVENUE_PRODUCT: `${API_VERSION}/reports/revenue/product`,
  REPORTS_REVENUE_PRODUCT_EXPORT: `${API_VERSION}/reports/revenue/product/export`,
  REPORTS_REVENUE_INSTALLMENT: `${API_VERSION}/reports/revenue/installment`,
  REPORTS_REVENUE_INSTALLMENT_EXPORT: `${API_VERSION}/reports/revenue/installment/export`,

  // Payment
  PAYMENT_CREATE: `${API_VERSION}/orders/payment/createPayment`,
  PAYMENT_CALLBACK: `${API_VERSION}/orders/payment/callback`,
  PAYMENT_IPN: `${API_VERSION}/orders/payment/vnp-ipn`,
  ORDER_PAYMENT_RESULT: (orderId: number) => `${API_VERSION}/orders/${orderId}/payment-result`,

  // Auth
  AUTH_LOGIN: `${API_VERSION}/auth/login`,
  AUTH_LOGOUT: `${API_VERSION}/auth/logout`,
  AUTH_INTROSPECT: `${API_VERSION}/auth/introspect`,
  AUTH_REFRESH: `${API_VERSION}/auth/refresh`,
  AUTH_GOOGLE: `${API_VERSION}/auth/google`,

  // OTP Verification
  OTP_SEND: `${API_VERSION}/otp-verification/send-otp`,
  OTP_VERIFY: `${API_VERSION}/otp-verification/verify-otp`,

  // Forgot Password
  FORGOT_PASSWORD_RESET: (email: string) => `${API_VERSION}/forgot-password/reset/${email}`,
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;
