'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, CartItem, CustomerDetails, Order, PaymentMethod } from '@/types';
import { useTracking } from '@/components/tracking/TrackingProvider';

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  appliedCoupon: string | null;
  applyCoupon: (code: string, discountPercentage: number) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  submitOrder: (
    outletSlug: string,
    campaignSlug: string | undefined,
    customer: CustomerDetails,
    paymentMethod: PaymentMethod
  ) => Promise<{ success: boolean; order?: Order; error?: string }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const tracking = useTracking();

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pnr_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to parse cart storage', e);
    }
  }, []);

  // Save cart changes
  useEffect(() => {
    try {
      localStorage.setItem('pnr_cart', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart storage', e);
    }
  }, [items]);

  const addItem = (item: MenuItem, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { item, quantity }];
    });

    tracking.trackAddToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity,
    });
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.item.id === itemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setDiscountPercent(0);
  };

  const applyCoupon = (code: string, discountPercentage: number) => {
    setAppliedCoupon(code);
    setDiscountPercent(discountPercentage);
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
  const discount = Math.round((subtotal * discountPercent) / 100);
  const deliveryFee = subtotal > 0 ? (subtotal > 299 ? 0 : 25) : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const submitOrder = async (
    outletSlug: string,
    campaignSlug: string | undefined,
    customer: CustomerDetails,
    paymentMethod: PaymentMethod
  ) => {
    try {
      tracking.trackInitiateCheckout(total, itemCount);

      const orderPayload = {
        outletSlug,
        campaignSlug,
        customer,
        items: items.map((i) => ({
          itemId: i.item.id,
          name: i.item.name,
          price: i.item.price,
          quantity: i.quantity,
          total: i.item.price * i.quantity,
        })),
        subtotal,
        discount,
        deliveryFee,
        total,
        paymentMethod,
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.message || 'Failed to place order' };
      }

      // Track conversion
      tracking.trackPurchase(data.order.orderNumber, total, items);

      clearCart();
      setIsCartOpen(false);

      return { success: true, order: data.order };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error placing order';
      return { success: false, error: msg };
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        discount,
        deliveryFee,
        total,
        appliedCoupon,
        applyCoupon,
        isCartOpen,
        setIsCartOpen,
        submitOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
