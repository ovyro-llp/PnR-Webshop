'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useRouter } from 'next/navigation';
import { DeliveryMapPicker } from '@/components/location/DeliveryMapPicker';
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
  Map,
  Sparkles,
  Zap,
} from 'lucide-react';
import { CustomerDetails, PaymentMethod } from '@/types';

interface CartDrawerProps {
  outletSlug: string;
  campaignSlug?: string;
}

export function CartDrawer({ outletSlug, campaignSlug }: CartDrawerProps) {
  const router = useRouter();
  const { user, isCustomer, loginCustomer, registerCustomer, autoRegisterOrLoginCustomer, logout } = useAuth();
  const {
    deliveryAddress,
    setDeliveryAddress,
    deliveryArea,
    setDeliveryArea,
    deliveryCoordinates,
    setDeliveryCoordinates,
    nearestOutlet,
  } = useLocation();
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

  const effectiveOutletSlug = cartOutletSlug || outletSlug || nearestOutlet?.slug || 'cycle-circle';
  const isCustomerLoggedIn = Boolean(user && isCustomer);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Unauthenticated customer contact state
  const [authMode, setAuthMode] = useState<'REGISTER' | 'LOGIN'>('REGISTER');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [showManualAuth, setShowManualAuth] = useState(false);

  // Customer Delivery State (Strictly not pre-filled)
  const [customer, setCustomer] = useState<CustomerDetails>(() => ({
    name: user?.role === 'CUSTOMER' ? user.name : '',
    phone: user?.role === 'CUSTOMER' ? user.phone : '',
    address: deliveryAddress || '',
    area: deliveryArea || '',
    pincode: '422005',
    specialInstructions: '',
    coordinates: deliveryCoordinates || undefined,
  }));

  useEffect(() => {
    setCustomer((prev) => ({
      ...prev,
      coordinates: deliveryCoordinates || prev.coordinates,
      address: prev.address ? prev.address : (deliveryAddress || ''),
      area: prev.area ? prev.area : (deliveryArea || ''),
    }));
  }, [deliveryCoordinates, deliveryAddress, deliveryArea]);

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

    // 0. MANDATORY HARD GATE: Customer MUST pinpoint doorstep location on map first!
    const effectiveCoords = customer.coordinates || deliveryCoordinates;
    if (!effectiveCoords || typeof effectiveCoords.lat !== 'number' || typeof effectiveCoords.lng !== 'number') {
      setIsMapModalOpen(true);
      setSubmitError('📍 Please pinpoint your exact delivery doorstep on the map first to enable 1-Click Magic Checkout.');
      return;
    }

    // 1. Resolve Delivery Address & Locality
    const resolvedAddress = customer.address.trim() || deliveryAddress?.trim() || 'Nashik Doorstep Location';
    const resolvedArea = customer.area.trim() || deliveryArea?.trim() || nearestOutlet?.area || 'Nashik City';
    const resolvedPincode = customer.pincode.trim() || '422005';

    let activeCustomer: CustomerDetails = {
      ...customer,
      address: resolvedAddress,
      area: resolvedArea,
      pincode: resolvedPincode,
      coordinates: effectiveCoords,
    };

    // 2. Customer Authentication & Phone Handling
    if (isCustomerLoggedIn) {
      if (!activeCustomer.name.trim()) activeCustomer.name = user?.name || 'Valued Customer';
      if (!activeCustomer.phone.trim() && user && 'phone' in user) activeCustomer.phone = user.phone;
    } else if (paymentMethod === 'COD' || showManualAuth) {
      // Cash on delivery requires rider phone upfront
      const cleanPhone = (authPhone || customer.phone).replace(/\D/g, '').slice(-10);
      const cleanName = (authName || customer.name).trim();

      if (cleanPhone.length < 10) {
        setSubmitError('Please enter a valid 10-digit mobile phone number for Cash on Delivery');
        return;
      }
      if (!cleanName) {
        setSubmitError('Please enter your full name');
        return;
      }

      setIsSubmitting(true);

      if (authMode === 'LOGIN' && authPassword.trim()) {
        const loginRes = await loginCustomer(cleanPhone, authPassword.trim());
        if (!loginRes.success) {
          setIsSubmitting(false);
          setSubmitError(loginRes.error || 'Invalid phone or password');
          return;
        }
      } else if (paymentMethod === 'COD') {
        const authRes = await autoRegisterOrLoginCustomer(
          cleanName,
          cleanPhone,
          resolvedAddress,
          resolvedArea,
          resolvedPincode,
          effectiveCoords
        );

        if (!authRes.success) {
          setIsSubmitting(false);
          setSubmitError(authRes.error || 'Failed to initialize customer account');
          return;
        }
      }

      activeCustomer.name = cleanName;
      activeCustomer.phone = cleanPhone;
    } else {
      // ⚡ Magic Checkout (UPI/Cards): Phone number will be verified automatically by Razorpay OTP/WhatsApp!
      // ZERO upfront typing required.
      const cleanPhone = (authPhone || customer.phone).replace(/\D/g, '').slice(-10);
      const cleanName = (authName || customer.name).trim();
      activeCustomer.name = cleanName || 'Valued Customer';
      activeCustomer.phone = cleanPhone || '';
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

    // Flow 2: Online Payment Gateway (Razorpay Magic 1-Click Checkout)
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
        description: `⚡ 1-Click Magic Checkout • ${orderData.outletName || 'Nashik Bakery'}`,
        image: 'https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png',
        order_id: orderData.orderId,
        prefill: {
          ...(activeCustomer.name && activeCustomer.name !== 'Valued Customer' ? { name: activeCustomer.name } : {}),
          ...(activeCustomer.phone && activeCustomer.phone.length === 10 ? { contact: activeCustomer.phone } : {}),
          ...(activeCustomer.email ? { email: activeCustomer.email } : {}),
        },
        notes: {
          delivery_lat: String(effectiveCoords.lat),
          delivery_lng: String(effectiveCoords.lng),
          doorstep_address: activeCustomer.address,
          outlet_slug: effectiveOutletSlug,
          magic_checkout: 'true',
        },
        theme: {
          color: '#1C1917',
          backdrop_color: 'rgba(28, 25, 23, 0.7)',
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
        send_sms_hash: true,
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
              const confirmedOrder = verifyRes.order;
              const verifiedPhone = confirmedOrder.customer?.phone?.replace(/\D/g, '').slice(-10);
              const verifiedName = confirmedOrder.customer?.name || (verifiedPhone ? `Customer ${verifiedPhone.slice(-4)}` : 'Valued Customer');

              // Seamlessly log customer in so their account is ready instantly!
              if (!isCustomerLoggedIn && verifiedPhone && verifiedPhone.length === 10) {
                try {
                  await autoRegisterOrLoginCustomer(
                    verifiedName,
                    verifiedPhone,
                    confirmedOrder.customer?.address || activeCustomer.address,
                    confirmedOrder.customer?.area || activeCustomer.area,
                    confirmedOrder.customer?.pincode || activeCustomer.pincode,
                    confirmedOrder.customer?.coordinates || effectiveCoords
                  );
                } catch (authErr) {
                  console.warn('Auto customer account registration notice:', authErr);
                }
              }

              router.push(`/${effectiveOutletSlug}/order/${confirmedOrder.id}`);
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
                    {/* Map-First Location Selector */}
                    {!customer.coordinates ? (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 border-2 border-amber-300/90 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="p-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-200 shrink-0 mt-0.5">
                              <MapPin className="w-4 h-4 text-amber-700 animate-bounce" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                <span>Step 1: Pinpoint Doorstep on Map</span>
                                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900">
                                  Required
                                </span>
                              </p>
                              <p className="text-[11px] text-amber-900/90 leading-snug mt-0.5">
                                Pinpoint your exact building on the map to verify 30–45m delivery &amp; unlock <strong>1-Click Magic Checkout</strong>.
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMapModalOpen(true);
                            setSubmitError('');
                          }}
                          className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                        >
                          <MapPin className="w-3.5 h-3.5 text-amber-200" />
                          <span>Pinpoint on Map (Unlocks Magic Checkout)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-950 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1 rounded-lg bg-emerald-600 text-white shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-emerald-950">Doorstep Location Verified</span>
                              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-200/70 px-1.5 py-0.2 rounded-full">
                                GPS Locked
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-700 block">
                              Lat: {customer.coordinates.lat.toFixed(5)}, Lng: {customer.coordinates.lng.toFixed(5)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsMapModalOpen(true)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold tracking-wider uppercase transition cursor-pointer"
                        >
                          Change Pin
                        </button>
                      </div>
                    )}

                    {/* Step 2: Address Inputs (Auto-filled from map, editable by customer) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                          House / Flat No., Society / Building, Landmark *
                        </label>
                        {customer.coordinates && (
                          <span className="text-[9px] font-semibold text-emerald-700">
                            Auto-filled • Editable
                          </span>
                        )}
                      </div>
                      <textarea
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
                    SECTION 2: CUSTOMER CONTACT & ACCOUNT CREATION
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
                ) : paymentMethod === 'UPI' && !showManualAuth ? (
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900">
                              Razorpay Magic 1-Click Login Active
                            </span>
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              No Phone Form
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                            Razorpay Magic Checkout will automatically verify your mobile number via OTP / WhatsApp and log you into your PnR account on payment.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-amber-200/50 flex items-center justify-between text-[11px]">
                      <span className="text-stone-500">Have an existing password?</span>
                      <button
                        type="button"
                        onClick={() => setShowManualAuth(true)}
                        className="text-stone-800 hover:text-stone-950 font-semibold underline cursor-pointer"
                      >
                        Sign in manually
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-stone-600" />
                        <span>
                          {paymentMethod === 'COD'
                            ? 'Delivery Contact (Cash on Delivery)'
                            : 'Customer Account'}
                        </span>
                      </h4>
                      {paymentMethod === 'UPI' ? (
                        <button
                          type="button"
                          onClick={() => setShowManualAuth(false)}
                          className="text-[10px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                        >
                          ⚡ Use 1-Click Magic Login
                        </button>
                      ) : (
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
                            Express Checkout
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
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Rahul Deshmukh"
                          value={authName}
                          onChange={(e) => {
                            setAuthName(e.target.value);
                            setCustomer((prev) => ({ ...prev, name: e.target.value }));
                          }}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                        />
                      </div>

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
                        {paymentMethod === 'COD' && (
                          <p className="text-[10px] text-stone-500 mt-1">
                            * Rider will call this number upon doorstep arrival.
                          </p>
                        )}
                      </div>

                      {authMode === 'LOGIN' && paymentMethod !== 'COD' ? (
                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                            Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showAuthPassword ? 'text' : 'password'}
                              placeholder="Enter your password"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              className="w-full pl-3 pr-9 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowAuthPassword(!showAuthPassword)}
                              className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 cursor-pointer"
                            >
                              {showAuthPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        paymentMethod === 'COD' && (
                          <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-center gap-2 text-[11px] text-amber-900">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              Account created automatically upon placing this order.
                            </span>
                          </div>
                        )
                      )}
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
                    {/* Instant Online Payment Option (Razorpay Magic 1-Click Checkout) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`w-full p-3.5 rounded-2xl border text-left transition relative flex items-start gap-3 cursor-pointer ${
                        paymentMethod === 'UPI'
                          ? 'border-stone-900 bg-white ring-2 ring-stone-900/10 shadow-xs'
                          : 'border-stone-200 bg-white/60 hover:bg-white text-stone-700'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          paymentMethod === 'UPI'
                            ? 'bg-[#1C1917] text-amber-400'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        <Zap className="w-4.5 h-4.5 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-stone-900">
                            Razorpay Magic 1-Click Checkout
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1 shrink-0">
                            <Sparkles className="w-2.5 h-2.5 text-amber-700" />
                            <span>1-Click Magic</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Instant UPI (GPay, PhonePe, Paytm), Cards &amp; NetBanking with pre-filled Phone OTP
                        </p>
                        {customer.coordinates ? (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Doorstep GPS Coordinates Locked &amp; Ready for Magic Checkout</span>
                          </div>
                        ) : (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 w-fit">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Map pinpoint required to unlock 1-Click Magic Checkout</span>
                          </div>
                        )}
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
              {!customer.coordinates ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMapModalOpen(true);
                      setSubmitError('📍 Please pinpoint your delivery doorstep on the map to proceed.');
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:scale-[0.99] text-white rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-amber-200 animate-bounce" />
                    <span>📍 Pinpoint Location on Map to Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[10px] text-amber-900 font-semibold text-center flex items-center justify-center gap-1">
                    <span>* Required for 30–45m Mangwale rider delivery &amp; Magic Checkout</span>
                  </p>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#1C1917] hover:bg-stone-800 active:scale-[0.99] text-white rounded-full font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Opening Razorpay Magic Checkout...</span>
                  ) : paymentMethod === 'UPI' ? (
                    <>
                      <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>⚡ Pay with Razorpay Magic 1-Click • ₹{total}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <Truck className="w-3.5 h-3.5 text-stone-300" />
                      <span>Place Cash on Delivery Order • ₹{total}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 text-center">
                <ShieldCheck className="w-3 h-3 text-stone-400" />
                <span>100% Quality Guaranteed • Fresh Oven Bakes • Razorpay Magic Secure</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Picker Modal */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-3xl max-w-md w-full p-5 relative shadow-2xl space-y-3 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif font-bold text-stone-900 text-sm">
                  Pinpoint Delivery Location on Map
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-200/50 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-2 text-xs text-amber-900">
              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
              <span>
                <strong>Required for Magic Checkout:</strong> Pin your exact doorstep for 30–45m delivery &amp; 1-click payment.
              </span>
            </div>

            <DeliveryMapPicker
              initialCoords={customer.coordinates || deliveryCoordinates || undefined}
              onConfirmLocation={(data) => {
                setCustomer((prev) => {
                  let newAddr = data.street || data.formattedAddress;
                  if (prev.address && prev.address.toLowerCase().includes('flat')) {
                    const prefix = prev.address.split(',')[0];
                    newAddr = `${prefix}, ${data.street || data.formattedAddress}`;
                  }
                  return {
                    ...prev,
                    coordinates: { lat: data.lat, lng: data.lng },
                    address: newAddr,
                    area: data.area || prev.area || data.nearestOutlet.area,
                    pincode: data.pincode || prev.pincode || '422005',
                  };
                });
                setDeliveryCoordinates({ lat: data.lat, lng: data.lng });
                setDeliveryAddress(data.street || data.formattedAddress);
                if (data.area) setDeliveryArea(data.area);
                setSubmitError('');
                setIsMapModalOpen(false);
              }}
              onClose={() => setIsMapModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
