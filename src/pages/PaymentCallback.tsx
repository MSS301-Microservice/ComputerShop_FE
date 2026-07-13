import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { paymentService } from '../api/services/paymentService';

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [orderId, setOrderId] = useState<string | null>(null);
  const hasRun = useRef(false);
  const cartCleared = useRef(false);

  useEffect(() => {
    if (status === 'success' && !cartCleared.current) {
      cartCleared.current = true;
      clearCart().catch(err => console.error('Failed to clear cart:', err));
    }
  }, [status, clearCart]);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const orderIdQuery = searchParams.get('orderId');
    const installmentNoQuery = searchParams.get('installmentNo');
    const vnpResponseCode = searchParams.get('vnp_ResponseCode');

    const isSuccessPath = location.pathname.includes('payment-success');
    const isFailedPath = location.pathname.includes('payment-failed');

    const orderIdFromPath = orderIdQuery ? Number(orderIdQuery) : null;
    // installmentNo=0 nghĩa là FULL payment, truyền undefined để backend xử lý đúng
    const installmentNoRaw = installmentNoQuery !== null && installmentNoQuery !== '' ? Number(installmentNoQuery) : undefined;
    const installmentNo = installmentNoRaw === 0 ? undefined : installmentNoRaw;
    const isFullPayment = installmentNoRaw === 0 || installmentNoRaw === undefined;

    // Nếu VNPay trả về responseCode trực tiếp trong URL, dùng luôn không cần poll
    const vnpSuccess = vnpResponseCode === '00';
    const vnpFailed = vnpResponseCode !== null && vnpResponseCode !== '00';

    const isPaymentSuccess = (s: unknown): boolean => {
      const v = String(s ?? '').trim().toLowerCase();
      return ['success', 'paid', 'completed', 'ok', '00', 'true', '1'].includes(v);
    };

    if (orderIdFromPath) {
      setOrderId(String(orderIdFromPath));

      // Nếu VNPay đã cho biết kết quả qua responseCode, không cần poll
      if (vnpFailed) {
        setStatus('failed');
        setTimeout(() => navigate(`/orders/${orderIdFromPath}`, { replace: true }), 3000);
        return;
      }

      if (vnpSuccess) {
        setStatus('success');
        setTimeout(() => navigate(`/orders/${orderIdFromPath}`, { replace: true }), 1500);
        return;
      }

      // Fallback: poll backend nếu không có responseCode trong URL
      (async () => {
        try {
          setStatus('processing');
          for (let attempt = 1; attempt <= 8; attempt++) {
            // Dùng payment-result endpoint
            const result = await paymentService.getPaymentResult(orderIdFromPath, installmentNo);
            if (isPaymentSuccess(result.status)) {
              setStatus('success');
              setTimeout(() => {
                navigate(`/orders/${orderIdFromPath}`, { replace: true });
              }, 1200);
              return;
            }
            if (result.status?.toUpperCase() === 'FAILED') {
              setStatus('failed');
              setTimeout(() => navigate(`/orders/${orderIdFromPath}`, { replace: true }), 3000);
              return;
            }
            if (attempt < 8) {
              await new Promise(res => setTimeout(res, 2000));
            }
          }
          // Sau khi poll hết vẫn không thấy success/failed
          // FULL payment: VNPay đã redirect về đây nghĩa là user đã thanh toán xong
          // IPN có thể chưa về kịp — coi là thành công
          if (isFullPayment || isSuccessPath) {
            setStatus('success');
            setTimeout(() => navigate(`/orders/${orderIdFromPath}`, { replace: true }), 1500);
          } else {
            setStatus('failed');
            setTimeout(() => navigate(`/orders/${orderIdFromPath}`, { replace: true }), 3000);
          }
        } catch (err) {
          if (isFullPayment || isSuccessPath) {
            setStatus('success');
            setTimeout(() => navigate(`/orders/${orderIdFromPath}`, { replace: true }), 1500);
          } else {
            setStatus('failed');
            setTimeout(() => navigate(`/orders/${orderIdFromPath}`, { replace: true }), 3000);
          }
        }
      })();
      return;
    }

    if (isSuccessPath) {
      setStatus('success');
      clearCart().catch(console.error);
      setTimeout(() => navigate('/orders', { replace: true }), 1500);
    } else if (isFailedPath) {
      setStatus('failed');
      setTimeout(() => navigate('/cart', { replace: true }), 1500);
    }
  }, [searchParams, location.pathname, navigate, clearCart]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-['Jost']">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-6" />
            <h2 className="text-xl font-light uppercase tracking-widest text-black mb-2">Đang xử lý</h2>
            <p className="text-gray-400 text-sm">Vui lòng chờ...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
            </div>
            <h2 className="text-xl font-light uppercase tracking-widest text-black mb-2">Thanh toán thành công</h2>
            <p className="text-gray-400 text-sm mb-6">Cảm ơn bạn đã mua hàng!</p>
            <p className="text-xs text-gray-300 uppercase tracking-widest">Đang chuyển đến đơn hàng...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-red-500">cancel</span>
            </div>
            <h2 className="text-xl font-light uppercase tracking-widest text-black mb-2">Thanh toán thất bại</h2>
            <p className="text-gray-400 text-sm mb-6">Giao dịch không thành công. Đơn hàng vẫn được giữ lại, bạn có thể thanh toán lại sau.</p>
            <p className="text-xs text-gray-300 uppercase tracking-widest">Đang chuyển đến đơn hàng...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
