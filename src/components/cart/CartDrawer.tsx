'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useTracking } from '@/components/tracking/TrackingProvider';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Clock,
  AlertTriangle,
  Home,
  Navigation,
} from 'lucide-react';
import { CustomerDetails, PaymentMethod } from '@/types';
import { useOutletAcceptance } from '@/hooks/useOutletTiming';
import { DietarySymbol, GlutenFreeSymbol } from '@/components/ui/DietarySymbol';
import { validateDeliveryAddress, splitAddressComponents } from '@/lib/utils/address-validation';
import { getMetaTrackingContext } from '@/lib/tracking/pixel-tracker';

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
    appliedCoupon,
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

  const searchParams = useSearchParams();
  const simTime = searchParams?.get('simulatedTime');
  const simDate = simTime
    ? (() => {
        const [h, m] = simTime.split(':').map(Number);
        return new Date(
          `2026-11-15T${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00+05:30`
        );
      })()
    : undefined;

  const effectiveOutletSlug = cartOutletSlug || outletSlug || nearestOutlet?.slug || 'cycle-circle';
  const currentOutlet = allOutlets.find((o) => o.slug === effectiveOutletSlug) || nearestOutlet;
  const outletStatus = useOutletAcceptance(currentOutlet, simDate);
  const openAlternativeOutlet = allOutlets.find(
    (o) => o.slug !== effectiveOutletSlug && o.isOpen !== false
  );
  const isCustomerLoggedIn = Boolean(user && isCustomer);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const cartScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll cart drawer to top whenever an error is triggered so it is immediately visible
  useEffect(() => {
    if (submitError && cartScrollRef.current) {
      cartScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [submitError]);

  // Address Confirmation Modal State ("Is the delivery location correct?")
  const [isLocationConfirmOpen, setIsLocationConfirmOpen] = useState(false);
  const [confirmFlatNo, setConfirmFlatNo] = useState('');
  const [confirmBuilding, setConfirmBuilding] = useState('');
  const [confirmStreet, setConfirmStreet] = useState('');
  const [confirmPincode, setConfirmPincode] = useState('422005');
  const [confirmError, setConfirmError] = useState('');

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

  // Lock body scroll and prevent viewport wobble when cart, map modal, or location confirm modal is open
  useEffect(() => {
    if (isCartOpen || isMapModalOpen || isLocationConfirmOpen) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [isCartOpen, isMapModalOpen, isLocationConfirmOpen]);

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
            if (data) {
              setDeliveryFee(0);
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

  /**
   * Step 1: When user clicks "Proceed to Pay", validate contact info & prompt location confirmation
   */
  const handleInitiateCheckout = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitError('');

    // 0. Hard Operating Hours & Outlet Acceptance Gate (10:00 AM - 10:00 PM IST)
    if (!outletStatus.isAccepting) {
      setSubmitError(outletStatus.reason || 'Orders are accepted only between 10:00 AM and 10:00 PM.');
      return;
    }

    // 0.1 MANDATORY HARD GATE: Customer MUST pinpoint location on map first!
    const effectiveCoords = customer.coordinates || deliveryCoordinates;
    if (!effectiveCoords || typeof effectiveCoords.lat !== 'number' || typeof effectiveCoords.lng !== 'number') {
      setIsMapModalOpen(true);
      setSubmitError('📍 Please pinpoint your delivery location on the map first to proceed to checkout.');
      return;
    }

    // Customer Authentication & Phone Handling (Required for Mangwale delivery rider)
    if (!isCustomerLoggedIn) {
      const cleanPhone = (customer.phone || authPhone).replace(/\D/g, '').slice(-10);
      const cleanName = (customer.name || authName).trim();
      const cleanPassword = authPassword.trim();

      if (cleanName.length < 2) {
        setSubmitError('Please enter your full name for order delivery');
        return;
      }
      if (cleanPhone.length < 10) {
        setSubmitError('Please enter a valid 10-digit mobile phone number for delivery rider contact');
        return;
      }
      if (!cleanPassword || cleanPassword.length < 4) {
        setSubmitError('Please enter an account password (at least 4 characters) to track delivery and secure your account.');
        return;
      }
    }

    // Parse current address into structured fields for the prompt
    const currentAddr = customer.address.trim() || deliveryAddress?.trim() || '';
    const parsed = splitAddressComponents(currentAddr);
    setConfirmFlatNo(parsed.flatNo);
    setConfirmBuilding(parsed.building);
    setConfirmStreet(parsed.street);
    setConfirmPincode(customer.pincode || '422005');
    setConfirmError('');

    // Open dedicated confirmation prompt: "Is the delivery location correct?"
    setIsLocationConfirmOpen(true);
  };

  /**
   * Step 2: "Confirm Location and Pay" button handler
   * Validates non-ambiguous address and triggers Razorpay Checkout
   */
  const handleConfirmLocationAndPay = async () => {
    setConfirmError('');

    const cleanFlat = confirmFlatNo.trim();
    const cleanBldg = confirmBuilding.trim();
    const cleanStreet = confirmStreet.trim();
    const cleanPin = confirmPincode.trim() || '422005';

    if (!cleanFlat || cleanFlat.length < 1) {
      setConfirmError('Please enter your specific Flat / House / Floor number.');
      return;
    }

    if (!cleanBldg || cleanBldg.length < 3) {
      setConfirmError('Please enter your Building / Society name.');
      return;
    }

    // Construct composite doorstep address
    const fullAddress = [cleanFlat, cleanBldg, cleanStreet].filter(Boolean).join(', ');

    const addressCheck = validateDeliveryAddress(fullAddress);
    if (!addressCheck.isValid) {
      setConfirmError(addressCheck.reason || 'Please provide complete address details.');
      return;
    }

    const effectiveCoords = customer.coordinates || deliveryCoordinates;
    if (!effectiveCoords) {
      setConfirmError('Mandatory map pin coordinates missing. Please adjust pin on map.');
      return;
    }

    const resolvedArea = customer.area.trim() || deliveryArea?.trim() || nearestOutlet?.area || 'Nashik City';

    // Update customer and context states
    setCustomer((prev) => ({
      ...prev,
      address: fullAddress,
      pincode: cleanPin,
      area: resolvedArea,
      coordinates: effectiveCoords,
    }));
    setDeliveryAddress(fullAddress);

    // Proceed to trigger Razorpay payment flow
    await executePaymentFlow(fullAddress, cleanPin, resolvedArea, effectiveCoords);
  };

  /**
   * Step 3: Trigger Razorpay Order Creation and Launch Checkout Modal
   */
  const executePaymentFlow = async (
    resolvedAddress: string,
    resolvedPincode: string,
    resolvedArea: string,
    effectiveCoords: { lat: number; lng: number }
  ) => {
    let activeCustomer: CustomerDetails = {
      ...customer,
      address: resolvedAddress,
      area: resolvedArea,
      pincode: resolvedPincode,
      coordinates: effectiveCoords,
    };

    const cleanPassword = authPassword.trim();

    // Customer Authentication & Phone Handling
    if (isCustomerLoggedIn) {
      if (!activeCustomer.name.trim()) activeCustomer.name = user?.name || 'Valued Customer';
      if (!activeCustomer.phone.trim() && user && 'phone' in user) activeCustomer.phone = user.phone;
    } else {
      const cleanPhone = (customer.phone || authPhone).replace(/\D/g, '').slice(-10);
      const cleanName = (customer.name || authName).trim();

      setIsSubmitting(true);
      const authRes = await autoRegisterOrLoginCustomer(
        cleanName,
        cleanPhone,
        cleanPassword,
        resolvedAddress,
        resolvedArea,
        resolvedPincode,
        effectiveCoords
      );

      if (!authRes.success) {
        setIsSubmitting(false);
        setConfirmError(authRes.error || 'Failed to authenticate customer account. Please check your password.');
        return;
      }

      activeCustomer.name = cleanName;
      activeCustomer.phone = cleanPhone;
      activeCustomer.password = cleanPassword;
    }

    setIsSubmitting(true);

    // Track Meta & Google Ads InitiateCheckout
    // Boost browser-side Meta Pixel Advanced Matching before InitiateCheckout
    tracking.identifyCustomer({
      phone: activeCustomer.phone,
      email: activeCustomer.email,
      name: activeCustomer.name,
      pincode: activeCustomer.pincode,
    });

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

    const metaAttribution = getMetaTrackingContext();

    // Online Payment Gateway (Razorpay - 100% Prepaid Online)
    try {
      const createRes = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          subtotal,
          discount,
          deliveryFee: 0,
          total,
          outletSlug: effectiveOutletSlug,
          campaignSlug,
          customer: activeCustomer,
          metaAttribution,
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
        setConfirmError(orderData.message || orderData.error || 'Failed to initialize payment gateway');
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setIsSubmitting(false);
        setConfirmError('Payment gateway script failed to load. Please check your connection.');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const RazorpayConstructor = (window as any).Razorpay;
      if (!RazorpayConstructor) {
        setIsSubmitting(false);
        setConfirmError('Payment gateway temporarily unavailable. Please try again.');
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

              // Seamlessly ensure customer is logged in so their account is ready instantly!
              if (!isCustomerLoggedIn && verifiedPhone && verifiedPhone.length === 10) {
                try {
                  await autoRegisterOrLoginCustomer(
                    verifiedName,
                    verifiedPhone,
                    cleanPassword,
                    confirmedOrder.customer?.address || activeCustomer.address,
                    confirmedOrder.customer?.area || activeCustomer.area,
                    confirmedOrder.customer?.pincode || activeCustomer.pincode,
                    confirmedOrder.customer?.coordinates || effectiveCoords
                  );
                } catch (authErr) {
                  console.warn('Auto customer account registration notice:', authErr);
                }
              }

              // Close confirmation modal
              setIsLocationConfirmOpen(false);
              router.push(`/${effectiveOutletSlug}/order/${confirmedOrder.id}`);
            } else {
              setConfirmError(verifyRes.error || 'Payment verification failed');
            }
          } catch (err) {
            setIsSubmitting(false);
            setConfirmError(
              err instanceof Error ? err.message : 'Failed to verify payment with server'
            );
          }
        },
      };

      const rzpInstance = new RazorpayConstructor(options);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzpInstance.on('payment.failed', (resp: any) => {
        setIsSubmitting(false);
        setConfirmError(resp?.error?.description || 'Payment was declined or cancelled');
      });

      // Close location confirmation modal right before Razorpay opens
      setIsLocationConfirmOpen(false);
      rzpInstance.open();
    } catch (err) {
      console.error('Razorpay checkout error:', err);
      setIsSubmitting(false);
      setConfirmError(
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
          <div
            ref={cartScrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain touch-pan-y"
          >
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
                {/* Top Prominent Error Banner */}
                {submitError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-900 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs font-semibold leading-relaxed">
                      {submitError}
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-2.5">
                  {items.map((cartItem) => (
                    <div
                      key={cartItem.item.id}
                      className="p-3.5 bg-white rounded-2xl border border-stone-200/80 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {cartItem.item.isGlutenFree && (
                            <GlutenFreeSymbol size="xs" />
                          )}
                          <DietarySymbol isVeg={cartItem.item.isVeg} size="xs" />
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
                                <span>Step 1: Set Delivery Location on Map</span>
                                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900">
                                  Required
                                </span>
                              </p>
                              <p className="text-[11px] text-amber-900/90 leading-snug mt-0.5">
                                Pinpoint your building on the map for accurate bakery delivery.
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
                          <span>Pinpoint Delivery Location on Map</span>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-3 flex items-center justify-between gap-2.5 text-xs shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-stone-900 leading-tight">
                              Delivery Pin Confirmed
                            </p>
                            <p className="text-[11px] text-stone-600 font-medium truncate mt-0.5 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                              <span className="truncate">
                                {customer.area || deliveryArea ? `${customer.area || deliveryArea}, Nashik` : 'Delivery location verified'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsMapModalOpen(true)}
                          className="shrink-0 px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 hover:text-stone-900 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                        >
                          Change
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

                      {/* Mandatory Account Password for Customer Order Tracking & Reorders */}
                      <div className="pt-2 border-t border-stone-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-700" />
                            <span>Account Password *</span>
                          </label>
                          <span className="text-[9px] font-semibold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                            Required to Track Order
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type={showAuthPassword ? 'text' : 'password'}
                            placeholder="Create or enter account password (min. 4 characters)"
                            value={authPassword}
                            onChange={(e) => {
                              setAuthPassword(e.target.value);
                              if (submitError) setSubmitError('');
                            }}
                            className={`w-full pl-3 pr-9 py-2 rounded-xl text-xs focus:bg-white focus:outline-none transition ${
                              submitError && submitError.toLowerCase().includes('password')
                                ? 'bg-rose-50/40 border border-rose-300 focus:ring-1 focus:ring-rose-500 text-rose-950'
                                : 'bg-stone-50 border border-stone-200 focus:ring-1 focus:ring-stone-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowAuthPassword(!showAuthPassword)}
                            className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 cursor-pointer p-0.5"
                            title={showAuthPassword ? 'Hide password' : 'Show password'}
                          >
                            {showAuthPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {submitError && submitError.toLowerCase().includes('password') ? (
                          <p className="text-[11px] text-rose-700 font-semibold bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 animate-in fade-in">
                            {submitError}
                          </p>
                        ) : (
                          <p className="text-[10px] text-stone-500 leading-snug">
                            Use this password to log back in anytime to track your delivery status and reorder with 1 tap.
                          </p>
                        )}
                      </div>

                      <div className="pt-0.5 flex items-center justify-end text-[10px]">
                        <button
                          type="button"
                          onClick={() => openCustomerLogin()}
                          className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                        >
                          Already have an account? Sign in
                        </button>
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
                    {/* Instant Online Payment Option (100% Prepaid) */}
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
                            Instant Online Payment
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                            100% Secure
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Instant UPI (GPay, PhonePe, Paytm), Cards, NetBanking &amp; Wallets
                        </p>
                        {customer.coordinates ? (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Delivery Location Confirmed</span>
                          </div>
                        ) : (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 w-fit">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Map pin required for delivery</span>
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
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Promo Discount {appliedCoupon ? `(${appliedCoupon})` : ''}</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-500 items-center">
                    <div className="flex items-center gap-1.5">
                      <span>Delivery Fee</span>
                      {deliveryQuote?.distanceKm && (
                        <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-semibold">
                          {Number(deliveryQuote.distanceKm).toFixed(1)} km
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold">
                      {deliveryQuote?.deliveryFee && deliveryQuote.deliveryFee > 0 ? (
                        <span className="line-through text-stone-400 font-normal text-[11px]">
                          ₹{deliveryQuote.deliveryFee}
                        </span>
                      ) : null}
                      <span className="font-bold text-emerald-700">FREE</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium pl-0.5 flex items-center justify-between">
                    <span>⚡ Free Delivery</span>
                    <span>Direct Dispatch</span>
                  </div>
                  <div className="pt-2 border-t border-stone-100 flex justify-between font-bold text-sm text-stone-900">
                    <span>Total Amount</span>
                    <span>₹{total}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Checkout Footer */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-white space-y-2.5">
              {!outletStatus.isAccepting ? (
                <div className="space-y-2">
                  <div
                    className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                      outletStatus.isPausedByAdmin
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {outletStatus.isPausedByAdmin ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                      )}
                      <span>
                        {outletStatus.isPausedByAdmin
                          ? 'Orders Temporarily Unavailable'
                          : 'Store Closed for Ordering (10 AM – 10 PM)'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {outletStatus.reason}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 bg-stone-200 text-stone-500 rounded-full font-bold text-xs uppercase tracking-wider transition cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>
                      {outletStatus.isPausedByAdmin
                        ? 'Currently Unavailable'
                        : `Closed • Opens ${outletStatus.timing.nextOpenTimeText}`}
                    </span>
                  </button>

                  {outletStatus.isPausedByAdmin && openAlternativeOutlet && (
                    <button
                      type="button"
                      onClick={() => {
                        switchOutlet(openAlternativeOutlet.slug);
                        setCartOutletSlug(openAlternativeOutlet.slug);
                      }}
                      className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md mt-1"
                    >
                      <Store className="w-4 h-4 text-amber-400" />
                      <span>Switch to {openAlternativeOutlet.name.replace("Puffs 'n' Rolls - ", '')} &amp; Order</span>
                    </button>
                  )}
                </div>
              ) : !customer.coordinates ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMapModalOpen(true);
                      setSubmitError('📍 Please pinpoint your delivery location on the map to proceed.');
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:scale-[0.99] text-white rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-amber-200 animate-bounce" />
                    <span>📍 Pinpoint Location on Map to Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[10px] text-amber-900 font-semibold text-center flex items-center justify-center gap-1">
                    <span>* Accurate map pinpoint ensures seamless bakery delivery</span>
                  </p>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleInitiateCheckout}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#1C1917] hover:bg-stone-800 active:scale-[0.99] text-white rounded-full font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Opening Secure Checkout...</span>
                  ) : (
                    <>
                      <span>Proceed to Pay • ₹{total}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 text-center">
                <ShieldCheck className="w-3 h-3 text-stone-400" />
                <span>100% Quality Guaranteed • Fresh Oven Bakes • 256-Bit SSL Encrypted Payment</span>
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
                <strong>Required for Delivery:</strong> Pin your exact location for bakery delivery.
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

                // Immediate calculation with official rate card
                const dist = data.distanceKm || 2.5;
                const fare = Math.max(20, Math.round(dist * 10 * 100) / 100);
                const sub = fare + 10;
                const calculatedFee = Math.round(sub * 1.05);
                setDeliveryFee(0); // Free doorstep delivery for customers
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

      {/* =========================================================================
          MANDATORY ADDRESS CONFIRMATION MODAL: "Is the delivery location correct?"
         ========================================================================= */}
      {isLocationConfirmOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-3xl max-w-md w-full p-5 sm:p-6 relative shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto overscroll-contain">
            {/* Header & Prompt */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-extrabold uppercase tracking-wider">
                  <MapPin className="w-3 h-3 text-amber-700" />
                  <span>Delivery Address Verification</span>
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-lg tracking-tight">
                  Is the delivery location correct?
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Our rider delivers directly to your address. Please ensure your flat number and building name are accurate before payment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationConfirmOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-200/50 transition cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pinned Map Summary & Change Pin Button */}
            <div className="p-3 bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-amber-600" />
                  <span>Map Pin Confirmed</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsLocationConfirmOpen(false);
                    setIsMapModalOpen(true);
                  }}
                  className="text-amber-800 hover:text-amber-950 font-bold text-[11px] underline cursor-pointer"
                >
                  Adjust Pin on Map
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-0.5">
                <span className="font-semibold text-emerald-800">
                  Kitchen: {currentOutlet.name.replace("Puffs 'n' Rolls - ", '')}
                </span>
                <span>•</span>
                <span>{deliveryQuote?.distanceKm ? `${Number(deliveryQuote.distanceKm).toFixed(1)} km away` : 'Express Delivery'}</span>
              </div>
            </div>

            {/* Address Fields */}
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div>
                <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Flat / House / Floor No. *
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 402, 4th Floor / Bungalow 12"
                    value={confirmFlatNo}
                    onChange={(e) => {
                      setConfirmFlatNo(e.target.value);
                      if (confirmError) setConfirmError('');
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Society / Building / Apartment Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shrinath Heights, Wing B"
                  value={confirmBuilding}
                  onChange={(e) => {
                    setConfirmBuilding(e.target.value);
                    if (confirmError) setConfirmError('');
                  }}
                  className="w-full px-3 py-2 bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Street, Area &amp; Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Opp. BYK College, College Road"
                  value={confirmStreet}
                  onChange={(e) => {
                    setConfirmStreet(e.target.value);
                    if (confirmError) setConfirmError('');
                  }}
                  className="w-full px-3 py-2 bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Delivery Area
                  </label>
                  <input
                    type="text"
                    value={customer.area || currentOutlet.area}
                    readOnly
                    className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="422005"
                    value={confirmPincode}
                    onChange={(e) => {
                      setConfirmPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      if (confirmError) setConfirmError('');
                    }}
                    className="w-full px-3 py-2 bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl text-xs font-mono font-medium focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Validation Error Banner */}
            {confirmError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="font-semibold leading-tight">{confirmError}</p>
              </div>
            )}

            {/* "Confirm location and pay" Button */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmLocationAndPay}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Opening Razorpay Secure Checkout...</span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Confirm Location and Pay • ₹{total}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsLocationConfirmOpen(false)}
                className="w-full py-1.5 text-stone-500 hover:text-stone-800 text-xs font-semibold text-center transition cursor-pointer"
              >
                ← Back to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
