'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Bike, Tag } from 'lucide-react';
import { CustomerDetails, PaymentMethod } from '@/types';

interface CartDrawerProps {
  outletSlug: string;
  campaignSlug?: string;
}

export function CartDrawer({ outletSlug, campaignSlug }: CartDrawerProps) {
  const router = useRouter();
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
    name: '',
    phone: '',
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
      setCouponError('Invalid coupon code. Try COLLEGE20 or CAKE150');
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
      setSubmitError('Please provide delivery address in Nashik');
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">Your Fresh Bakes</h2>
                <p className="text-xs text-stone-500">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in basket
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="text-stone-800 font-semibold text-sm">Your basket is empty</h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Explore our oven-hot puffs, rolls, and celebration cakes to treat yourself!
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-3">
                  {items.map((cartItem) => (
                    <div
                      key={cartItem.item.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              cartItem.item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <p className="font-semibold text-xs text-stone-900 truncate">
                            {cartItem.item.name}
                          </p>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          ₹{cartItem.item.price} each
                        </p>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-stone-300">
                        <button
                          onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                          className="text-stone-500 hover:text-stone-800 p-0.5"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-stone-800 min-w-[16px] text-center">
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
                          className="text-stone-400 hover:text-rose-500 mt-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Have a coupon? (e.g. COLLEGE20)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Apply
                    </button>
                  </div>
                  {appliedCoupon && (
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      ✓ Coupon <strong>{appliedCoupon}</strong> applied!
                    </p>
                  )}
                  {couponError && (
                    <p className="text-[11px] text-rose-500">{couponError}</p>
                  )}
                </form>

                {/* Mangwale Logistics Banner */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5">
                  <Bike className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-900">
                      Mangwale Logistics Dispatch
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Hot bakes dispatched directly from our oven to your doorstep in Nashik via Mangwale 25-min delivery network.
                    </p>
                  </div>
                </div>

                {/* Customer Details Form */}
                <div className="space-y-3 pt-2 border-t border-stone-200">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Delivery Details (Nashik)
                  </h4>

                  <div className="space-y-2">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Your Name *"
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <input
                        type="tel"
                        required
                        placeholder="WhatsApp Phone Number (10 digits) *"
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <textarea
                        required
                        rows={2}
                        placeholder="House / Flat No., Society, Landmark *"
                        value={customer.address}
                        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={customer.area}
                        onChange={(e) => setCustomer({ ...customer, area: e.target.value })}
                        className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none text-stone-700"
                      >
                        <option value="College Road">College Road</option>
                        <option value="Thatte Nagar">Thatte Nagar</option>
                        <option value="Gangapur Road">Gangapur Road</option>
                        <option value="Nashik Road">Nashik Road</option>
                        <option value="Bytco Point">Bytco Point</option>
                        <option value="Indira Nagar">Indira Nagar</option>
                        <option value="Govind Nagar">Govind Nagar</option>
                        <option value="Panchavati">Panchavati</option>
                        <option value="Cidco">Cidco</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Nashik Pincode"
                        value={customer.pincode}
                        onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                        className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-stone-800 mb-1.5">
                      Payment Mode
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('UPI')}
                        className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                          paymentMethod === 'UPI'
                            ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                            : 'border-stone-200 bg-stone-50 text-stone-600'
                        }`}
                      >
                        ⚡ Instant UPI / QR
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('COD')}
                        className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                          paymentMethod === 'COD'
                            ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                            : 'border-stone-200 bg-stone-50 text-stone-600'
                        }`}
                      >
                        💵 Cash on Delivery
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="pt-2 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Item Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Mangwale Delivery Fee</span>
                    <span>{deliveryFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${deliveryFee}`}</span>
                  </div>
                  <div className="flex justify-between text-stone-900 font-bold text-sm pt-1 border-t border-stone-200">
                    <span>Total Amount</span>
                    <span className="text-amber-700">₹{total}</span>
                  </div>
                </div>

                {submitError && (
                  <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {submitError}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Footer Checkout Button */}
          {items.length > 0 && (
            <div className="p-4 border-t border-stone-200 bg-stone-50">
              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Connecting to Mangwale Logistics...
                  </span>
                ) : (
                  <>
                    <span>Place Order • ₹{total}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1 text-[11px] text-stone-500 mt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Fresh Bakes Guarantee • Direct Outlet Fulfillment</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
