import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';
import { orderRepository } from '@/lib/db/order-repository';
import { Order } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const outletSlug = searchParams.get('outlet');
    const phone = searchParams.get('phone');
    const statusParam = searchParams.get('status')?.toUpperCase() || 'PAID';
    const includePending = searchParams.get('includePending') === 'true';

    // 1. Fetch from PostgreSQL (with in-memory fallback)
    let rawOrders: Order[] = [];
    try {
      rawOrders =
        outletSlug && outletSlug !== 'all'
          ? await orderRepository.getOrdersByOutlet(outletSlug)
          : await orderRepository.getAllOrders();
    } catch {
      rawOrders = [];
    }

    if (!rawOrders || rawOrders.length === 0) {
      rawOrders =
        outletSlug && outletSlug !== 'all'
          ? orderStore.getOrdersByOutlet(outletSlug)
          : orderStore.getAllOrders();
    }

    // 2. Filter by status:
    // By default ('PAID'): only confirmed, paid orders (exclude AWAITING_PAYMENT / PENDING)
    let orders = rawOrders;
    if (statusParam === 'AWAITING_PAYMENT') {
      orders = orders.filter(
        (o) => o.orderStatus === 'AWAITING_PAYMENT' || o.paymentStatus === 'PENDING'
      );
    } else if (statusParam === 'ALL' || includePending) {
      orders = rawOrders;
    } else {
      // Default: 'PAID' - only captured payments
      orders = orders.filter(
        (o) => o.orderStatus !== 'AWAITING_PAYMENT' && o.paymentStatus === 'COMPLETED'
      );
    }

    // 3. Filter by phone if provided
    if (phone) {
      const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
      orders = orders.filter((o) => {
        const oPhone = (o.customer?.phone || '').replace(/[\s\-\(\)\+]/g, '');
        return oPhone && (oPhone.includes(cleanPhone) || cleanPhone.includes(oPhone));
      });
    }

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to list orders';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
