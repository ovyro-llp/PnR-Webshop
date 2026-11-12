'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useTracking } from '@/components/tracking/TrackingProvider';
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
  Store,
} from 'lucide-react';
import { CustomerDetails, PaymentMethod } from '@/types';

interface CartDrawerProps {
  outletSlug: string;
  campaignSlug?: string;
}

export function CartDrawer({ outletSlug, campaignSlug }: CartDrawerProps) {
  const router = useRouter();
  const { user, isCustomer, loginCustomer, registerCustomer, autoRegisterOrLoginCustomer, logout, openCustomerLogin } = useAuth();
  const tracking = useTracking();
  const {
    deliveryAddress,
    setDeliveryAddress,
    deliveryArea,
    setDeliveryArea,
    deliveryCoordinates,
    setDeliveryCoordinates,
    nearestOutlet,
    allOutlets,
    switchOutlet,
  } = useLocation();
  const {
    items,
    cartOutletSlug,
    setCartOutletSlug,
    itemCount,
    subtotal,
    discount,
    deliveryFee,
    setDeliveryFee,
    deliveryQuote,
    setDeliveryQuote,
    total,
    updateQuantity,
    removeItem,
    isCartOpen,
    setIsCartOpen,
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

  // Lock body scroll and prevent viewport wobble when cart or map modal is open
  useEffect(() => {
    if (isCartOpen || isMapModalOpen) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [isCartOpen, isMapModalOpen]);

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

  // Dynamic Mangwale delivery quote calculation based on customer doorstep coordinates
  const activeCoords = customer.coordinates || deliveryCoordinates;
  useEffect(() => {
    if (activeCoords && typeof activeCoords.lat === 'number' && typeof activeCoords.lng === 'number') {
      let isCurrent = true;
      const fetchLiveQuote = async () => {
        try {
          const res = await fetch(
            `/api/logistics/quote?outletSlug=${effectiveOutletSlug}&lat=${activeCoords.lat}&lng=${activeCoords.lng}`
          );
          if (res.ok && isCurrent) {
            const data = await res.json();
            if (data && typeof data.deliveryFee === 'number') {
              setDeliveryFee(data.deliveryFee);
              setDeliveryQuote(data);
            }
          }
        } catch (err) {
          console.warn('Mangwale quote query notice:', err);
        }
      };
      fetchLiveQuote();
      return () => {
        isCurrent = false;
      };
    }
  }, [activeCoords?.lat, activeCoords?.lng, effectiveOutletSlug, setDeliveryFee, setDeliveryQuote]);

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
      setSubmitError('📍 Please pinpoint your exact delivery doorstep on the map first to proceed to checkout.');
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

    // 2. Customer Authentication & Phone Handling (Required for Mangwale delivery rider)
    if (isCustomerLoggedIn) {
      if (!activeCustomer.name.trim()) activeCustomer.name = user?.name || 'Valued Customer';
      if (!activeCustomer.phone.trim() && user && 'phone' in user) activeCustomer.phone = user.phone;
    } else {
      const cleanPhone = (customer.phone || authPhone).replace(/\D/g, '').slice(-10);
      const cleanName = (customer.name || authName).trim();

      if (cleanName.length < 2) {
        setSubmitError('Please enter your full name for order delivery');
        return;
      }
      if (cleanPhone.length < 10) {
        setSubmitError('Please enter a valid 10-digit mobile phone number for delivery rider contact');
        return;
      }

      if (showManualAuth && authMode === 'LOGIN' && authPassword.trim()) {
        setIsSubmitting(true);
        const loginRes = await loginCustomer(cleanPhone, authPassword.trim());
        if (!loginRes.success) {
          setIsSubmitting(false);
          setSubmitError(loginRes.error || 'Invalid phone or password');
          return;
        }
      }

      activeCustomer.name = cleanName;
      activeCustomer.phone = cleanPhone;
    }

    setIsSubmitting(true);

    // Track Meta & Google Ads InitiateCheckout
    tracking.trackInitiateCheckout(
      total,
      itemCount,
      items.map((i) => ({
        id: i.item.id,
        name: i.item.name,
        price: i.item.price,
        quantity: i.quantity,
        category: i.item.category,
      }))
    );

    // Online Payment Gateway (Razorpay - 100% Prepaid Online)
    try {
      const createRes = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          subtotal,
          discount,
          deliveryFee,
          total,
          outletSlug: effectiveOutletSlug,
          campaignSlug,
          customer: activeCustomer,
          items: items.map((i) => ({
            itemId: i.item.id,
            name: i.item.name,
            price: i.item.price,
            quantity: i.quantity,
            total: i.item.price * i.quantity,
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
        description: `Fresh Bakes Payment • ${orderData.outletName || 'Nashik Bakery'}`,
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
          payment_type: 'razorpay_prepaid',
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
    <div className="fixed inset-0 z-50 overflow-hidden touch-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity overscroll-contain touch-none"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col justify-between border-l border-stone-200 overscroll-contain touch-pan-y">
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain touch-pan-y">
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
                                Pinpoint your exact building on the map to verify 30–45m delivery &amp; calculate rider fare.
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
                          <span>Pinpoint Delivery Doorstep on Map</span>
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

                    {/* Fulfilling Bakery Kitchen Selector (Choose outlet freely) */}
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/90 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-amber-700" />
                          <span>Fulfilling Bakery Kitchen</span>
                        </label>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                          Customizable
                        </span>
                      </div>
                      <select
                        value={effectiveOutletSlug}
                        onChange={(e) => {
                          const newSlug = e.target.value;
                          switchOutlet(newSlug);
                          setCartOutletSlug(newSlug);
                        }}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none cursor-pointer"
                      >
                        {allOutlets.map((outlet) => (
                          <option key={outlet.slug} value={outlet.slug}>
                            {outlet.name} — {outlet.area}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-stone-500">
                        Order from Gangapur Road, Cycle Circle, or ND Patel Road anytime.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
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

                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                          Landmark / Note
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Near Datta Mandir"
                          value={customer.specialInstructions || ''}
                          onChange={(e) =>
                            setCustomer({ ...customer, specialInstructions: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* =========================================================================
                    SECTION 2: CUSTOMER CONTACT DETAILS (FOR DELIVERY RIDER CONTACT)
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
                        <span>Customer Contact</span>
                      </h4>
                      <span className="text-[10px] text-stone-500 font-medium">
                        For Rider Updates
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Rahul Deshmukh"
                          value={customer.name}
                          onChange={(e) => {
                            setCustomer((prev) => ({ ...prev, name: e.target.value }));
                            setAuthName(e.target.value);
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
                            value={customer.phone}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setCustomer((prev) => ({ ...prev, phone: clean }));
                              setAuthPhone(clean);
                            }}
                            className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                          />
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1">
                          Delivery rider will call this number to confirm delivery upon arrival.
                        </p>
                      </div>

                      {showManualAuth ? (
                        <div className="pt-2 border-t border-stone-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                              Account Password
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowManualAuth(false)}
                              className="text-[10px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
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
                        <div className="pt-1 flex items-center justify-between text-[10px]">
                          <button
                            type="button"
                            onClick={() => setShowManualAuth(true)}
                            className="text-stone-500 hover:text-stone-800 underline cursor-pointer"
                          >
                            Enter account password
                          </button>
                          <button
                            type="button"
                            onClick={() => openCustomerLogin()}
                            className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                          >
                            Already have an account? Sign in
                          </button>
                        </div>
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
                    {/* Instant Online Payment Option (Razorpay - 100% Prepaid) */}
                    <div
                      className="w-full p-3.5 rounded-2xl border text-left border-stone-900 bg-white ring-2 ring-stone-900/10 shadow-xs flex items-start gap-3"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-[#1C1917] text-amber-400"
                      >
                        <ShieldCheck className="w-4.5 h-4.5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-stone-900">
                            Razorpay
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                            Prepaid Online
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Instant UPI (GPay, PhonePe, Paytm), Cards, NetBanking &amp; Wallets
                        </p>
                        {customer.coordinates ? (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Doorstep GPS Coordinates Verified</span>
                          </div>
                        ) : (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 w-fit">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Map pinpoint required to calculate delivery fare</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-500">
                    <span>Items Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-stone-500 items-center">
                    <div className="flex items-center gap-1.5">
                      <span>Mangwale Doorstep Delivery</span>
                      {deliveryQuote?.distanceKm && (
                        <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-semibold">
                          {Number(deliveryQuote.distanceKm).toFixed(1)} km
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-stone-800">₹{deliveryFee}</span>
                  </div>
                  {deliveryQuote?.priceBreakdown && (
                    <div className="text-[10px] text-stone-400 pl-0.5 flex items-center justify-between">
                      <span>Rate: ₹{deliveryQuote.priceBreakdown.deliveryFare} fare + ₹{deliveryQuote.priceBreakdown.platformFee} platform + 5% GST</span>
                      <span className="text-emerald-700 font-medium">⚡ ~{deliveryQuote.estimatedMinutes || 30}m Express</span>
                    </div>
                  )}
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
                    <span>* Required for 30–45m Mangwale rider delivery</span>
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
                    <span>Opening Razorpay Checkout...</span>
                  ) : (
                    <>
                      <span>Pay with Razorpay • ₹{total}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 text-center">
                <ShieldCheck className="w-3 h-3 text-stone-400" />
                <span>100% Quality Guaranteed • Fresh Oven Bakes • Secure Razorpay Payment</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Picker Modal */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-3xl max-w-md w-full p-5 relative shadow-2xl space-y-3 max-h-[92vh] overflow-y-auto overscroll-contain">
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
              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>Required for Delivery:</strong> Pin your exact doorstep for 30–45m rider delivery.
              </span>
            </div>

            <DeliveryMapPicker
              initialCoords={customer.coordinates || deliveryCoordinates || undefined}
              showActionButtons={true}
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

                // Immediate calculation with official Mangwale rate card
                const dist = data.distanceKm || 2.5;
                const fare = Math.max(20, Math.round(dist * 10 * 100) / 100);
                const sub = fare + 10;
                const calculatedFee = Math.round(sub * 1.05);
                setDeliveryFee(calculatedFee);
                setDeliveryQuote({
                  distanceKm: dist,
                  deliveryFee: calculatedFee,
                  priceBreakdown: {
                    deliveryFare: fare,
                    platformFee: 10,
                    subtotal: sub,
                    gstPercent: 5,
                    gstAmount: Math.round(sub * 0.05 * 100) / 100,
                    total: Math.round(sub * 1.05 * 100) / 100,
                  },
                  estimatedMinutes: Math.min(50, Math.max(20, Math.round(15 + dist * 3))),
                });

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
