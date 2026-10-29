import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      outletSlug,
      campaignSlug,
      customer,
      items,
      subtotal,
      discount,
      deliveryFee,
      total,
      paymentMethod,
    } = body;

    if (!outletSlug || !customer || !items || !items.length) {
      return NextResponse.json(
        { success: false, message: 'Missing required order fields' },
        { status: 400 }
      );
    }

    const order = await orderStore.createOrder({
      outletSlug,
      campaignSlug,
      customer,
      items,
      subtotal: Number(subtotal),
      discount: Number(discount || 0),
      deliveryFee: Number(deliveryFee || 0),
      total: Number(total),
      paymentMethod: paymentMethod || 'UPI',
    });

    return NextResponse.json({
      success: true,
      message: 'Order placed and dispatched to Mangwale Logistics successfully',
      order,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json(
      { success: false, message: errorMsg },
      { status: 500 }
    );
  }
}
