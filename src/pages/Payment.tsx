import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
import { useTimeTheme } from '../hooks/useTimeTheme';
import { useAuth } from '../contexts/AuthContext';

type Stage = 'initializing' | 'launching' | 'verifying' | 'success' | 'failed' | 'error';

declare global {
  interface Window {
    Cashfree: any;
  }
}

function loadCashfreeSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) return resolve();
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(script);
  });
}

const Payment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTimeTheme();
  const isDark = theme === 'dark';

  // ✅ FIXED PARAMS
  const planId = searchParams.get('planId') || 'starter';
  const amount = searchParams.get('amount') || '0';
  const returnedOrderId = searchParams.get('order_id');

  const [stage, setStage] = useState<Stage>('initializing');
  const [errorMsg, setErrorMsg] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const didVerify = useRef(false);

  // VERIFY FLOW
  useEffect(() => {
    if (!returnedOrderId || didVerify.current) return;
    didVerify.current = true;
    verifyOrder(returnedOrderId);
  }, [returnedOrderId]);

  // INIT PAYMENT
  useEffect(() => {
    if (returnedOrderId) return;
    if (!user) return;

    if (planId === 'free') {
      navigate('/dashboard');
      return;
    }

    initPayment();
  }, [user]);

  async function initPayment() {
    try {
      setStage('initializing');

      // ✅ FIXED API URL
      const res = await fetch('/api/cashfree-create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          amount: Number(amount),
          userId: user?.id,
          userEmail: user?.email,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'Order creation failed');

      const { orderId: newOrderId, paymentSessionId } = orderData;
      setOrderId(newOrderId);

      setStage('launching');
      await loadCashfreeSDK();

      const cashfree = window.Cashfree({ mode: 'sandbox' });

      // ✅ CLEAN RETURN URL
      const returnUrl = `${window.location.origin}/payment?planId=${planId}&amount=${amount}&order_id=${newOrderId}`;

      cashfree.checkout({
        paymentSessionId,
        returnUrl,
      });

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
      setStage('error');
    }
  }

  async function verifyOrder(oid: string) {
    try {
      setStage('verifying');

      const res = await fetch(
        `/api/cashfree-verify-order?orderId=${oid}&userId=${user?.id}&planId=${planId}`
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.status === 'SUCCESS') {
        setOrderId(oid);
        setStage('success');
      } else {
        setStage('failed');
        setErrorMsg('Payment failed or cancelled');
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
      setStage('error');
    }
  }

  return <div>Payment Flow UI (unchanged)</div>;
};

export default Payment;