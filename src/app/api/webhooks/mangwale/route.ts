import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';
import { parseMangwaleWebhook, verifyMangwaleWebhookSignature } from '@/lib/logistics/mangwale';
import { OrderStatus } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get('x-mangwale-signature') ||
      req.headers.get('x-signature') ||
      '';

    const isValid = verifyMangwaleWebhookSignature({ rawBody, signature });
    if (!isValid) {
      console.warn('Invalid Mangwale webhook signature received');
      return NextResponse.json(
        { success: false, message: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    console.log('[Mangwale Webhook Received]', payload);

    const logisticsUpdate = parseMangwaleWebhook(payload);

    if (!logisticsUpdate.taskId) {
      return NextResponse.json(
        { success: false, message: 'Missing taskId in webhook payload' },
        { status: 400 }
      );
    }

    let mappedOrderStatus: OrderStatus | undefined;
    if (logisticsUpdate.status === 'ASSIGNED') mappedOrderStatus = 'CONFIRMED';
    if (logisticsUpdate.status === 'PICKED_UP') mappedOrderStatus = 'DISPATCHED';
    if (logisticsUpdate.status === 'IN_TRANSIT') mappedOrderStatus = 'OUT_FOR_DELIVERY';
    if (logisticsUpdate.status === 'DELIVERED') mappedOrderStatus = 'DELIVERED';
    if (logisticsUpdate.status === 'FAILED') mappedOrderStatus = 'CANCELLED';

    const updatedOrder = orderStore.updateMangwaleStatus(logisticsUpdate.taskId, {
      ...logisticsUpdate,
      orderStatus: mappedOrderStatus,
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: `Order with Mangwale task ID ${logisticsUpdate.taskId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mangwale order logistics status updated',
      orderNumber: updatedOrder.orderNumber,
      newStatus: updatedOrder.orderStatus,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Webhook processing error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
