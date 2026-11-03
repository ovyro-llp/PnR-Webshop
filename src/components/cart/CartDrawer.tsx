'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useRouter } from 'next/navigation';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  Lock,
  CreditCard,
  Phone,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  MapPin,
} from 'lucide-react';
import { CustomerDetails, PaymentMethod } from '@/types';

interface CartDrawerProps {
  outletSlug: string;
  campaignSlug?: string;
}

export function CartDrawer({ outletSlug, campaignSlug }: CartDrawerProps) {
  const router = useRouter();
  const { user, isCustomer, loginCustomer, registerCustomer, logout } = useAuth();
  const { deliveryAddress, deliveryArea, nearestOutlet } = useLocation();
  const {
    items,
    cartOutletSlug,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    updateQuantity,
    removeItem,
    isCartOpen,
    setIsCartOpen,
    submitOrder,
    verifyRazorpayPayment,
  } = useCart();

  const effectiveOutletSlug = cartOutletSlug || outletSlug || nearestOutlet?.slug || 'college-road';
  const isCustomerLoggedIn = Boolean(user && isCustomer);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Unauthenticated customer contact state
  const [authMode, setAuthMode] = useState<'REGISTER' | 'LOGIN'>('REGISTER');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);

  // Customer Delivery State (Strictly not pre-filled)
  const [customer, setCustomer] = useState<CustomerDetails>(() => ({
    name: user?.role === 'CUSTOMER' ? user.name : '',
    phone: user?.role === 'CUSTOMER' ? user.phone : '',
    address: '',
    area: '',
    pincode: '',
    specialInstructions: '',
  }));

  // Sync customer details when user logs in
  useEffect(() => {
    if (user && user.role === 'CUSTOMER') {
      const addr = user.savedAddresses?.[0];
      setCustomer((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        address: prev.address || addr?.address || '',
        area: prev.area || addr?.area || '',
        pincode: prev.pincode || addr?.pincode || '',
      }));
    }
  }, [user]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');

  if (!isCartOpen) return null;

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if (typeof window !== 'undefined' && (window as unknown as { Razorpay?: unknown }).Razorpay) {
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

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // 1. Validate Delivery Address
    if (!customer.address.trim()) {
      setSubmitError('Please enter your delivery address (Flat / House No., Society, Landmark) in Nashik');
      return;
    }
    if (!customer.pincode.trim() || customer.pincode.length < 6) {
      setSubmitError('Please enter a valid 6-digit Nashik pincode (e.g. 422005)');
      return;
    }

    // 2. Validate / Authenticate Customer
    let activeCustomer = { ...customer };

    if (!isCustomerLoggedIn) {
      const cleanPhone = authPhone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length < 10) {
        setSubmitError('Please enter a valid 10-digit mobile phone number');
        return;
      }
      if (!authPassword.trim()) {
        setSubmitError('Please enter a password for your customer account');
        return;
      }
      if (authMode === 'REGISTER' && !authName.trim()) {
        setSubmitError('Please enter your full name');
        return;
      }

      setIsSubmitting(true);
      let authRes;
      if (authMode === 'REGISTER') {
        authRes = await registerCustomer(authName.trim(), cleanPhone, authPassword);
      } else {
        authRes = await loginCustomer(cleanPhone, authPassword);
      }

      if (!authRes.success) {
        setIsSubmitting(false);
        setSubmitError(authRes.error || 'Account authentication failed. Please check your credentials.');
        return;
      }

      activeCustomer.name = authName.trim() || customer.name || 'Valued Customer';
      activeCustomer.phone = cleanPhone;
    } else {
      if (!activeCustomer.name.trim()) activeCustomer.name = user?.name || 'Valued Customer';
      if (!activeCustomer.phone.trim() && user && 'phone' in user) activeCustomer.phone = user.phone;
    }

    setIsSubmitting(true);

    // Flow 1: Cash on Delivery
    if (paymentMethod === 'COD') {
      const res = await submitOrder(effectiveOutletSlug, campaignSlug, activeCustomer, 'COD');
      setIsSubmitting(false);

      if (res.success && res.order) {
        router.push(`/${effectiveOutletSlug}/order/${res.order.id}`);
      } else {
        setSubmitError(res.error || 'Failed to place order. Please try again.');
      }
      return;
    }

    // Flow 2: Online Payment Gateway (UPI, Cards, NetBanking)
    try {
      const createRes = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          outletSlug: effectiveOutletSlug,
          campaignSlug,
          customer: activeCustomer,
          items: items.map((i) => ({
            itemId: i.item.id,
            name: i.item.name,
            price: i.item.price,
            quantity: i.quantity,
          })),
        }),
      });

      const orderData = await createRes.json();
      if (!createRes.ok || !orderData.success) {
        setIsSubmitting(false);
        setSubmitError(orderData.message || orderData.error || 'Failed to initialize payment gateway');
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setIsSubmitting(false);
        setSubmitError('Payment gateway script failed to load. Please check your connection.');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const RazorpayConstructor = (window as any).Razorpay;
      if (!RazorpayConstructor) {
        setIsSubmitting(false);
        setSubmitError('Payment provider not available');
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: "Puffs 'n' Rolls Bakery",
        description: `Order from ${orderData.outletName || 'Nashik Bakery'}`,
        image: 'https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png',
        order_id: orderData.orderId,
        prefill: {
          name: activeCustomer.name,
          contact: activeCustomer.phone,
          email: `${activeCustomer.phone.replace(/\D/g, '')}@puffsnrolls.com`,
        },
        theme: {
          color: '#1C1917',
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await verifyRazorpayPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              effectiveOutletSlug,
              campaignSlug,
              activeCustomer,
              paymentMethod
            );
            setIsSubmitting(false);
            if (verifyRes.success && verifyRes.order) {
              router.push(`/${effectiveOutletSlug}/order/${verifyRes.order.id}`);
            } else {
              setSubmitError(verifyRes.error || 'Payment verification failed');
            }
          } catch (err) {
            setIsSubmitting(false);
            setSubmitError(
              err instanceof Error ? err.message : 'Failed to verify payment with server'
            );
          }
        },
      };

      const rzpInstance = new RazorpayConstructor(options);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzpInstance.on('payment.failed', (resp: any) => {
        setIsSubmitting(false);
        setSubmitError(resp?.error?.description || 'Payment was declined or cancelled');
      });
      rzpInstance.open();
    } catch (err) {
      console.error('Razorpay checkout error:', err);
      setIsSubmitting(false);
      setSubmitError(
        err instanceof Error ? err.message : 'Checkout encountered an unexpected error'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col justify-between border-l border-stone-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1C1917] text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4 text-stone-300" />
              </div>
              <div>
                <h2 className="text-sm font-serif font-bold text-stone-900">Your Basket</h2>
                <p className="text-[11px] text-stone-500">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-stone-800 font-serif font-bold text-base">Your basket is empty</h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Discover our freshly baked savory rolls, crispy puffs, and artisanal cakes.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2 bg-[#1C1917] text-white rounded-full text-xs font-semibold hover:bg-stone-800 transition cursor-pointer"
                >
                  Explore Menu
                </button>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-2.5">
                  {items.map((cartItem) => (
                    <div
                      key={cartItem.item.id}
                      className="p-3.5 bg-white rounded-2xl border border-stone-200/80 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              cartItem.item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                          <p className="font-medium text-xs text-stone-900 truncate">
                            {cartItem.item.name}
                          </p>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          ₹{cartItem.item.price} each
                        </p>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 bg-stone-50 px-2 py-1 rounded-full border border-stone-200">
                        <button
                          onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                          className="text-stone-500 hover:text-stone-800 p-0.5 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-stone-800 min-w-[14px] text-center">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                          className="text-stone-500 hover:text-stone-800 p-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-xs text-stone-900">
                          ₹{cartItem.item.price * cartItem.quantity}
                        </p>
                        <button
                          onClick={() => removeItem(cartItem.item.id)}
                          className="text-stone-300 hover:text-rose-600 mt-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Express Bakery Delivery Notice */}
                <div className="p-3 bg-white rounded-2xl border border-stone-200/80 flex items-start gap-2.5 shadow-xs">
                  <Truck className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-stone-900">
                      Express Doorstep Delivery
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Dispatched straight from our nearest ovens to your address in 25 minutes.
                    </p>
                  </div>
                </div>

                {/* =========================================================================
                    SECTION 1: DELIVERY ADDRESS (ALWAYS VISIBLE - WHERE SHOULD WE DELIVER?)
                   ========================================================================= */}
                <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-700" />
                      <span>Where Should We Deliver?</span>
                    </h4>
                    <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Nashik Delivery
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                        House / Flat No., Society / Building, Landmark *
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="e.g. Flat 402, Shrinath Heights, Opp. BYK Circle"
                        value={customer.address}
                        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                          Nashik Locality *
                        </label>
                        <select
                          value={customer.area}
                          onChange={(e) => setCustomer({ ...customer, area: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-none"
                        >
                          <option value="">Select Locality...</option>
                          <option value="Cycle Circle / College Road">Cycle Circle / College Road</option>
                          <option value="Krishi Nagar / Thatte Nagar">Krishi Nagar / Thatte Nagar</option>
                          <option value="Gangapur Road / Sahdev Nagar">Gangapur Road / Sahdev Nagar</option>
                          <option value="Datta Chowk / Serene Meadows">Datta Chowk / Serene Meadows</option>
                          <option value="ND Patel Road / Shalimar">ND Patel Road / Shalimar</option>
                          <option value="CBS / Old Nashik">CBS / Old Nashik</option>
                          <option value="Panchavati">Panchavati</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="422005"
                          value={customer.pincode}
                          onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Delivery instructions (e.g. Ring doorbell, leave at door)"
                        value={customer.specialInstructions || ''}
                        onChange={(e) =>
                          setCustomer({ ...customer, specialInstructions: e.target.value })
                        }
                        className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-700 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* =========================================================================
                    SECTION 2: CUSTOMER CONTACT & ACCOUNT
                   ========================================================================= */}
                {isCustomerLoggedIn ? (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-emerald-950 truncate">
                          {user?.name || customer.name || 'Verified Customer'}
                        </p>
                        <p className="text-[11px] text-emerald-700 font-mono">
                          +91 {user && 'phone' in user ? user.phone : customer.phone}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline px-2 py-1 rounded-lg hover:bg-emerald-100/50 transition cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-stone-600" />
                        <span>Customer Details</span>
                      </h4>
                      <div className="flex rounded-md bg-stone-100 p-0.5">
                        <button
                          type="button"
                          onClick={() => setAuthMode('REGISTER')}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded transition cursor-pointer ${
                            authMode === 'REGISTER'
                              ? 'bg-white text-stone-900 shadow-2xs'
                              : 'text-stone-500'
                          }`}
                        >
                          New Customer
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthMode('LOGIN')}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded transition cursor-pointer ${
                            authMode === 'LOGIN'
                              ? 'bg-white text-stone-900 shadow-2xs'
                              : 'text-stone-500'
                          }`}
                        >
                          Sign In
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {authMode === 'REGISTER' && (
                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                            Your Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Rahul Deshmukh"
                            value={authName}
                            onChange={(e) => {
                              setAuthName(e.target.value);
                              setCustomer((prev) => ({ ...prev, name: e.target.value }));
                            }}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                          Mobile Phone Number *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-stone-400 font-mono">
                            +91
                          </span>
                          <input
                            type="tel"
                            required
                            inputMode="tel"
                            maxLength={10}
                            placeholder="98220 00000"
                            value={authPhone}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setAuthPhone(clean);
                              setCustomer((prev) => ({ ...prev, phone: clean }));
                            }}
                            className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                          Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showAuthPassword ? 'text' : 'password'}
                            required
                            placeholder={
                              authMode === 'REGISTER'
                                ? 'Create a password (min 4 characters)'
                                : 'Enter your password'
                            }
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full px-3 pr-9 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAuthPassword(!showAuthPassword)}
                            className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                          >
                            {showAuthPassword ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================================
                    SECTION 3: PAYMENT METHOD
                   ========================================================================= */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-800">
                      Payment Method
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 font-medium">
                      <Lock className="w-2.5 h-2.5 text-emerald-600" />
                      100% Encrypted
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Instant Online Payment Option */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`w-full p-3 rounded-2xl border text-left transition relative flex items-start gap-3 cursor-pointer ${
                        paymentMethod === 'UPI'
                          ? 'border-stone-900 bg-white ring-1 ring-stone-900 shadow-xs'
                          : 'border-stone-200 bg-white/60 hover:bg-white text-stone-700'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          paymentMethod === 'UPI'
                            ? 'bg-[#1C1917] text-white'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">
                            Instant Online Payment
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Instant
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking
                        </p>
                      </div>
                    </button>

                    {/* Cash on Delivery Option */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      className={`w-full p-3 rounded-2xl border text-left transition relative flex items-start gap-3 cursor-pointer ${
                        paymentMethod === 'COD'
                          ? 'border-stone-900 bg-white ring-1 ring-stone-900 shadow-xs'
                          : 'border-stone-200 bg-white/60 hover:bg-white text-stone-700'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          paymentMethod === 'COD'
                            ? 'bg-[#1C1917] text-white'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">Cash on Delivery</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                            Cash
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Pay cash or UPI scan directly to our delivery rider upon doorstep arrival
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-500">
                    <span>Items Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>Express Delivery Fee</span>
                    <span>₹{deliveryFee}</span>
                  </div>
                  <div className="pt-2 border-t border-stone-100 flex justify-between font-bold text-sm text-stone-900">
                    <span>Total Amount</span>
                    <span>₹{total}</span>
                  </div>
                </div>

                {submitError && (
                  <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    {submitError}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Checkout Footer */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-white space-y-2">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#1C1917] hover:bg-stone-800 active:scale-[0.99] text-white rounded-full font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : paymentMethod === 'UPI' ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pay Online • ₹{total}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Place Cash Order • ₹{total}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 text-center">
                <ShieldCheck className="w-3 h-3 text-stone-400" />
                <span>100% Quality Guaranteed • Fresh Oven Bakes</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
