'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Tag, Truck } from 'lucide-react';
import { CustomerDetails, PaymentMethod } from '@/types';

interface CartDrawerProps {
  outletSlug: string;
  campaignSlug?: string;
}

export function CartDrawer({ outletSlug, campaignSlug }: CartDrawerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    itemCount,
    subtotal,
    discount,
    deliveryFee,
    total,
    updateQuantity,
    removeItem,
    appliedCoupon,
    applyCoupon,
    isCartOpen,
    setIsCartOpen,
    submitOrder,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Customer Form State
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: user?.role === 'CUSTOMER' ? user.name : '',
    phone: user?.role === 'CUSTOMER' ? user.phone : '',
    address: '',
    area: 'College Road',
    pincode: '422005',
    specialInstructions: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'COLLEGE20' || code === 'PNR20') {
      applyCoupon(code, 20);
    } else if (code === 'CAKE150') {
      applyCoupon(code, 25);
    } else if (code === 'INDIRAFREE') {
      applyCoupon(code, 18);
    } else {
      setCouponError('Invalid promo code. Try COLLEGE20 or CAKE150');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!customer.name.trim()) {
      setSubmitError('Please enter your full name');
      return;
    }
    if (!customer.phone.trim() || customer.phone.replace(/\D/g, '').length < 10) {
      setSubmitError('Please enter a valid 10-digit WhatsApp phone number');
      return;
    }
    if (!customer.address.trim()) {
      setSubmitError('Please enter your delivery address in Nashik');
      return;
    }

    setIsSubmitting(true);
    const res = await submitOrder(outletSlug, campaignSlug, customer, paymentMethod);
    setIsSubmitting(false);

    if (res.success && res.order) {
      router.push(`/${outletSlug}/order/${res.order.id}`);
    } else {
      setSubmitError(res.error || 'Failed to place order. Please try again.');
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
              className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition"
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
                  className="px-5 py-2 bg-[#1C1917] text-white rounded-full text-xs font-semibold hover:bg-stone-800 transition"
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
                          className="text-stone-500 hover:text-stone-800 p-0.5"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-stone-800 min-w-[14px] text-center">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                          className="text-stone-500 hover:text-stone-800 p-0.5"
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
                          className="text-stone-300 hover:text-rose-600 mt-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code Section */}
                <form onSubmit={handleApplyCoupon} className="space-y-1">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Promo code (e.g. COLLEGE20)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs uppercase focus:outline-none focus:ring-1 focus:ring-stone-900"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-xl transition"
                    >
                      Apply
                    </button>
                  </div>
                  {appliedCoupon && (
                    <p className="text-[11px] text-emerald-700 font-medium">
                      ✓ Promo <strong>{appliedCoupon}</strong> applied!
                    </p>
                  )}
                  {couponError && (
                    <p className="text-[11px] text-rose-500">{couponError}</p>
                  )}
                </form>

                {/* Express Bakery Delivery Notice (Zero mention of partner) */}
                <div className="p-3 bg-white rounded-2xl border border-stone-200/80 flex items-start gap-2.5 shadow-xs">
                  <Truck className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-stone-900">
                      Express Doorstep Delivery
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Dispatched straight from our ovens to your address in 25 minutes.
                    </p>
                  </div>
                </div>

                {/* Delivery Form */}
                <div className="space-y-2.5 pt-2 border-t border-stone-200">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                    Delivery Address (Nashik)
                  </h4>

                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name *"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                    />

                    <input
                      type="tel"
                      inputMode="tel"
                      required
                      placeholder="WhatsApp Phone Number *"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none font-mono"
                    />

                    <textarea
                      required
                      rows={2}
                      placeholder="House / Flat No., Building, Landmark *"
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none resize-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={customer.area}
                        onChange={(e) => setCustomer({ ...customer, area: e.target.value })}
                        className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-700 focus:outline-none"
                      >
                        <option value="College Road">College Road</option>
                        <option value="Thatte Nagar">Thatte Nagar</option>
                        <option value="Gangapur Road">Gangapur Road</option>
                        <option value="Nashik Road">Nashik Road</option>
                        <option value="Bytco Point">Bytco Point</option>
                        <option value="Indira Nagar">Indira Nagar</option>
                        <option value="Govind Nagar">Govind Nagar</option>
                        <option value="Panchavati">Panchavati</option>
                      </select>

                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Pincode"
                        value={customer.pincode}
                        onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                        className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="pt-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Payment Mode
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('UPI')}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition ${
                          paymentMethod === 'UPI'
                            ? 'border-stone-900 bg-white text-stone-900 font-bold shadow-xs'
                            : 'border-stone-200 bg-white/50 text-stone-600'
                        }`}
                      >
                        Instant UPI / QR
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('COD')}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition ${
                          paymentMethod === 'COD'
                            ? 'border-stone-900 bg-white text-stone-900 font-bold shadow-xs'
                            : 'border-stone-200 bg-white/50 text-stone-600'
                        }`}
                      >
                        Cash on Delivery
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Item Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Promo Discount</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>{deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${deliveryFee}`}</span>
                  </div>
                  <div className="flex justify-between text-stone-900 font-bold text-sm pt-2 border-t border-stone-200">
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
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full font-medium text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Confirming Order...</span>
                ) : (
                  <>
                    <span>Place Order • ₹{total}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <p className="text-[10px] text-stone-400 text-center">
                100% Quality Guaranteed • Fresh Oven Bakes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
