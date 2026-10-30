'use client';

import React, { useState } from 'react';

interface RazorpayCheckoutButtonProps {
  amount: number; // in paise (e.g. 50000 = ₹500) or rupees if specifyInRupees is true
  specifyInRupees?: boolean;
  currency?: string;
  receipt?: string;
  name?: string;
  description?: string;
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure?: (error: unknown) => void;
  className?: string;
  children?: React.ReactNode;
}

export function RazorpayCheckoutButton({
  amount,
  specifyInRupees = false,
  currency = 'INR',
  receipt,
  name = "Puffs 'n' Rolls Nashik",
  description = 'Artisanal Bakery Online Order',
  customer,
  onSuccess,
  onFailure,
  className,
  children,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (
        typeof window !== 'undefined' &&
        (window as unknown as { Razorpay?: unknown }).Razorpay
      ) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const amountInPaise = specifyInRupees ? Math.round(amount * 100) : Math.round(amount);

      // 1. Create order on backend
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to initialize payment order');
      }

      // 2. Load Razorpay script
      const scriptReady = await loadScript();
      if (!scriptReady) {
        throw new Error('Razorpay SDK failed to load. Please check your network connection.');
      }

      const keyId =
        orderData.key_id ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        'rzp_test_Tu3J2xHanphLOy';

      // 3. Open Razorpay Checkout Modal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const RazorpayConstructor = (window as unknown as { Razorpay: any }).Razorpay;
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || currency,
        name,
        description,
        order_id: orderData.order_id,
        prefill: {
          name: customer?.name || 'Gourmet Guest',
          email: customer?.email || 'customer@puffsnrolls.com',
          contact: customer?.contact || '9822334455',
        },
        theme: {
          color: '#1C1917',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 4. Verify payment signature on backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Signature verification failed');
            }

            setLoading(false);
            if (onSuccess) {
              onSuccess(response);
            }
          } catch (verifyErr) {
            setLoading(false);
            const errStr =
              verifyErr instanceof Error ? verifyErr.message : 'Payment verification failed';
            setErrorMessage(errStr);
            if (onFailure) onFailure(verifyErr);
          }
        },
      };

      const rzp = new RazorpayConstructor(options);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzp.on('payment.failed', (resp: any) => {
        setLoading(false);
        const failMessage = resp?.error?.description || 'Payment was declined or cancelled';
        setErrorMessage(failMessage);
        if (onFailure) onFailure(resp?.error);
      });

      rzp.open();
    } catch (err) {
      setLoading(false);
      const errStr = err instanceof Error ? err.message : 'Payment initialization failed';
      setErrorMessage(errStr);
      if (onFailure) onFailure(err);
    }
  };

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
        className={
          className ||
          'px-6 py-3 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full font-medium text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer'
        }
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          children || <span>Pay with Razorpay</span>
        )}
      </button>
      {errorMessage && (
        <p className="text-xs text-rose-600 mt-1.5 font-medium">{errorMessage}</p>
      )}
    </div>
  );
}
