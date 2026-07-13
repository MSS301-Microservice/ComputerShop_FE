
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './src/components/layout/Header';
import Footer from './src/components/layout/Footer';
import Home from './src/pages/Home/Home';
import Shop from './src/pages/Shop/Shop';
import ProductDetail from './src/pages/Product/ProductDetail';
import Dashboard from './src/pages/admin/Dashboard';
import AdminProducts from './src/pages/admin/Products';
import AdminOrders from './src/pages/admin/Orders';
import AdminOrderDetail from './src/pages/admin/OrderDetail';
import AdminUsers from './src/pages/admin/Users';
import AdminBrands from './src/pages/admin/Brands';
import AdminCategories from './src/pages/admin/Categories';
import AdminPromotions from './src/pages/admin/Promotions';
import AdminAttributes from './src/pages/admin/Attributes';
import AdminBlogs from './src/pages/admin/Blogs';
import AdminInstallmentPackages from './src/pages/admin/InstallmentPackages';
import StaffMessages from './src/pages/admin/Messages';
import Login from './src/pages/auth/Login';
import Register from './src/pages/auth/Register';
import OtpVerification from './src/pages/auth/OtpVerification';
import ForgotPassword from './src/pages/auth/ForgotPassword';
import ResetPassword from './src/pages/auth/ResetPassword';
import BuildPC from './src/pages/BuildPC';
import ScrollToTop from './src/components/ScrollToTop';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider, useCart } from './src/context/CartContext';
import { CompareProvider } from './src/context/CompareContext';
import CompareBar from './src/components/ui/CompareBar';
import CompareSearchModal from './src/components/ui/CompareSearchModal';
import { ToastProvider } from './src/components/ui/Toast';
import Cart from './src/pages/Cart/Cart';
import Checkout from './src/pages/Cart/Checkout';
import Compare from './src/pages/Compare/Compare';
import OrderList from './src/pages/Orders/OrderList';
import OrderDetail from './src/pages/Orders/OrderDetail';
import WarrantyLookup from './src/pages/Warranty/WarrantyLookup';
import AdminWarranties from './src/pages/admin/Warranties';
import AdminReports from './src/pages/admin/Reports';
import PaymentCallback from './src/pages/PaymentCallback';
import Profile from './src/pages/Profile/Profile';
import ChatWidget from './src/components/chat/ChatWidget';
import { useCurrentUserId } from './src/hooks/useCurrentUserId';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CompareProvider>
        <Router>
          <CartProvider>
            <ToastProvider>
            <ScrollToTop />
            <CompareBar />
            <CompareSearchModal />
            <div className="flex flex-col min-h-screen">
            <Routes>
              {/* Admin routes */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/brands" element={<AdminBrands />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
              <Route path="/admin/promotions" element={<AdminPromotions />} />
              <Route path="/admin/installment-packages" element={<AdminInstallmentPackages />} />
              <Route path="/admin/attributes" element={<AdminAttributes />} />
              <Route path="/admin/blogs" element={<AdminBlogs />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/warranties" element={<AdminWarranties />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/messages" element={<StaffMessages />} />

              {/* Staff routes - same pages, different prefix */}
              <Route path="/staff" element={<Dashboard />} />
              <Route path="/staff/products" element={<AdminProducts />} />
              <Route path="/staff/categories" element={<AdminCategories />} />
              <Route path="/staff/brands" element={<AdminBrands />} />
              <Route path="/staff/orders" element={<AdminOrders />} />
              <Route path="/staff/orders/:id" element={<AdminOrderDetail />} />
              <Route path="/staff/promotions" element={<AdminPromotions />} />
              <Route path="/staff/installment-packages" element={<AdminInstallmentPackages />} />
              <Route path="/staff/attributes" element={<AdminAttributes />} />
              <Route path="/staff/blogs" element={<AdminBlogs />} />
              <Route path="/staff/warranties" element={<AdminWarranties />} />
              <Route path="/staff/reports" element={<AdminReports />} />
              <Route path="/staff/messages" element={<StaffMessages />} />
              
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<OtpVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Public routes with Header/Footer layout */}
              <Route path="*" element={
                <>
                  <HeaderWithCart />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/build-pc" element={<BuildPC />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/compare" element={<Compare />} />
                      <Route path="/orders" element={<OrderList />} />
                      <Route path="/orders/:id" element={<OrderDetail />} />
                      <Route path="/warranty" element={<WarrantyLookup />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/payment-callback" element={<PaymentCallback />} />
                      <Route path="/payment-success" element={<PaymentCallback />} />
                      <Route path="/payment-failed" element={<PaymentCallback />} />
                      <Route path="/payment-result" element={<PaymentCallback />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </main>
                  <Footer />
                  <MemberChatWidget />
                </>
              } />
            </Routes>
          </div>
          </ToastProvider>
        </CartProvider>
      </Router>
    </CompareProvider>
  </AuthProvider>
  );
};

// Helper component to pass cart count from context to Header
const HeaderWithCart: React.FC = () => {
  const { totalItems } = useCart();
  return <Header cartCount={totalItems} />;
};

// Chat widget only for authenticated members (not admin/staff)
const MemberChatWidget: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const currentUserId = useCurrentUserId();
  if (loading || !isAuthenticated || !user || user.role === 'admin' || user.role === 'staff') return null;
  if (!currentUserId) return null;
  return <ChatWidget currentUserId={currentUserId} />;
};

export default App;
