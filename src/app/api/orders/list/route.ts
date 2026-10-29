import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const outletSlug = searchParams.get('outlet');
    const phone = searchParams.get('phone');

    let orders = outletSlug
      ? orderStore.getOrdersByOutlet(outletSlug)
      : orderStore.getAllOrders();

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
