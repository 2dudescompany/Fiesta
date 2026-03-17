import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
import { useTimeTheme } from '../hooks/useTimeTheme';
import { useAuth } from '../contexts/AuthContext';

/* ─── types ─── */
type Stage = 'initializing' | 'launching' | 'verifying' | 'success' | 'failed' | 'error';

declare global {
  interface Window {
    Cashfree: any;
  }
}

/* ─── helpers ─── */
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

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

/* ─── component ─── */
const Payment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTimeTheme();
  const isDark = theme === 'dark';

  const planId = searchParams.get('plan') || 'starter';
  const amount = searchParams.get('amount') || '0';
  const returnedOrderId = searchParams.get('order_id'); // set by Cashfree on redirect back

  const [stage, setStage] = useState<Stage>('initializing');
  const [errorMsg, setErrorMsg] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const didVerify = useRef(false);

  /* ── STEP A: If Cashfree redirected back with ?order_id= → verify ── */
  useEffect(() => {
    if (!returnedOrderId || didVerify.current) return;
    didVerify.current = true;
    verifyOrder(returnedOrderId);
  }, [returnedOrderId]);

  /* ── STEP B: Otherwise → create order & launch SDK ── */
  useEffect(() => {
    if (returnedOrderId) return; // handled by STEP A
    if (!user) return;
    if (planId === 'free') {
      navigate('/dashboard');
      return;
    }
    initPayment();
  }, [user]);

  /* ── create order → launch Cashfree checkout ── */
  async function initPayment() {
    try {
      setStage('initializing');

      // 1. Create order on our backend
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

      // 2. Load Cashfree JS SDK
      setStage('launching');
      await loadCashfreeSDK();

      // 3. Launch Cashfree payment sheet
      const cashfree = window.Cashfree({ mode: 'sandbox' });
      const returnUrl = `${window.location.origin}/payment?plan=${planId}&amount=${amount}&order_id=${newOrderId}`;

      cashfree.checkout({
        paymentSessionId,
        returnUrl,
        components: ['order-details', 'card', 'upi', 'netbanking', 'app', 'saved-cards'],
      });

    } catch (err: any) {
      console.error('initPayment error:', err);
      setErrorMsg(err.message || 'Something went wrong');
      setStage('error');
    }
  }

  /* ── verify order status via our backend ── */
  async function verifyOrder(oid: string) {
    try {
      setStage('verifying');
      const res = await fetch(
        `/api/cashfree-verify-order?orderId=${oid}&userId=${user?.id || ''}&planId=${planId}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Verification request failed');

      if (data.status === 'SUCCESS') {
        setOrderId(oid);
        setStage('success');
      } else if (data.status === 'FAILED') {
        setErrorMsg(`Payment was declined (${data.paymentStatus || 'FAILED'}). Please try again.`);
        setStage('failed');
      } else {
        setErrorMsg('Payment is still pending or could not be confirmed. Please contact support.');
        setStage('error');
      }
    } catch (err: any) {
      console.error('verifyOrder error:', err);
      setErrorMsg(err.message || 'Verification failed');
      setStage('error');
    }
  }

  /* ─── UI ─── */
  const bg = isDark ? 'bg-black text-white' : 'gradient-bg text-gray-900';
  const card = isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white';
  const sub = isDark ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`min-h-screen py-12 px-4 flex flex-col items-center justify-center transition-colors duration-500 ${bg}`}>
      <div className={`max-w-md w-full p-8 rounded-2xl shadow-xl text-center ${card}`}>

        {/* ── INITIALIZING / LAUNCHING ── */}
        {(stage === 'initializing' || stage === 'launching') && (
          <>
            <Loader2 className="w-14 h-14 text-blue-500 mx-auto mb-5 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">
              {stage === 'initializing' ? 'Preparing your order…' : 'Opening payment…'}
            </h1>
            <p className={`text-sm ${sub}`}>
              {stage === 'initializing'
                ? `Setting up your ${PLAN_LABELS[planId] || planId} plan (₹${amount}/mo)`
                : 'The Cashfree payment window will open shortly. Please do not close this tab.'}
            </p>
          </>
        )}

        {/* ── VERIFYING ── */}
        {stage === 'verifying' && (
          <>
            <ShieldCheck className="w-14 h-14 text-indigo-500 mx-auto mb-5 animate-pulse" />
            <h1 className="text-2xl font-bold mb-2">Verifying payment…</h1>
            <p className={`text-sm ${sub}`}>Confirming your transaction with Cashfree. Hang tight!</p>
          </>
        )}

        {/* ── SUCCESS ── */}
        {stage === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-5" />
            <h1 className="text-2xl font-bold mb-2">Payment Successful! 🎉</h1>
            <p className={`mb-2 ${sub}`}>
              You're now on the <strong>{PLAN_LABELS[planId] || planId}</strong> plan.
            </p>
            {orderId && (
              <p className={`text-xs mb-6 font-mono ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                Order ID: {orderId}
              </p>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-6 rounded-xl font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              Go to Dashboard →
            </button>
          </>
        )}

        {/* ── FAILED ── */}
        {stage === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-5" />
            <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
            <p className={`mb-6 text-sm ${sub}`}>{errorMsg}</p>
            <button
              onClick={() => navigate(`/payment?plan=${planId}&amount=${amount}`)}
              className="w-full py-3 px-6 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors mb-3"
            >
              <CreditCard className="inline w-4 h-4 mr-2" />
              Try Again
            </button>
            <button
              onClick={() => navigate('/pricing-select')}
              className={`flex items-center justify-center gap-2 mx-auto text-sm transition-colors ${sub} hover:underline`}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Plans
            </button>
          </>
        )}

        {/* ── ERROR ── */}
        {stage === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-yellow-500 mx-auto mb-5" />
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className={`mb-6 text-sm ${sub}`}>{errorMsg}</p>
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default Payment;
