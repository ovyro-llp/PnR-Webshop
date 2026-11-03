import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';
import { orderRepository } from '@/lib/db/order-repository';
import { parseMangwaleWebhook, verifyMangwaleWebhookSignature } from '@/lib/logistics/mangwale';
import { OrderStatus } from '@/types';

/**
 * Health check & discovery endpoint for Mangwale Webhook Consumer
 */
export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    service: 'Mangwale Enterprise Logistics Webhook Consumer',
    version: '1.0',
    endpoint: '/api/webhooks/mangwale',
    publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://shop.puffsnrolls.com'}/api/webhooks/mangwale`,
    environment: process.env.MANGWALE_ENV || 'test',
    signatureAlgorithm: 'HMAC-SHA256(secret, "v1." + timestamp + "." + eventId + "." + rawBody)',
    supportedEvents: [
      'order.created',
      'order.searching_rider',
      'order.assigned',
      'order.arrived_pickup',
      'order.picked_up',
      'order.arrived_drop',
      'order.delivered',
      'order.cancelled',
      'order.failed',
      'order.returning',
      'order.returned',
      'order.status_changed',
      'wallet.low_balance',
      'wallet.recharged',
      'wallet.auto_recharge_initiated',
    ],
  });
}

/**
 * Handles incoming signed delivery status webhooks from Mangwale Enterprise fleet
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Extract headers per Mangwale Enterprise v1 specification
    const signature =
      req.headers.get('x-webhook-signature') ||
      req.headers.get('x-mangwale-signature') ||
      req.headers.get('x-signature') ||
      '';

    const timestamp = req.headers.get('x-webhook-timestamp');
    const eventId = req.headers.get('x-webhook-id');

    const isValid = verifyMangwaleWebhookSignature({
      rawBody,
      signature,
      timestamp,
      eventId,
    });

    if (!isValid) {
      console.warn('[Mangwale Webhook] Invalid signature received:', {
        signature,
        timestamp,
        eventId,
      });
      return NextResponse.json(
        { success: false, message: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    console.log('[Mangwale Webhook Received]', {
      eventId,
      timestamp,
      event: payload.event || payload.event_type,
      order: payload.order || payload.order_id,
    });

    // Handle wallet lifecycle events gracefully
    const eventName = String(payload.event || payload.event_type || '');
    if (eventName.startsWith('wallet.')) {
      console.log(`[Mangwale Wallet Event] ${eventName}:`, payload);
      return NextResponse.json({
        success: true,
        message: `Wallet event ${eventName} acknowledged`,
      });
    }

    const logisticsUpdate = parseMangwaleWebhook(payload);

    // Resolve order by Mangwale taskId or merchant external orderNumber
    const identifier = logisticsUpdate.taskId || logisticsUpdate.orderNumber;
    if (!identifier) {
      return NextResponse.json(
        { success: false, message: 'Missing order_id or external_order_id in payload' },
        { status: 400 }
      );
    }

    let mappedOrderStatus: OrderStatus | undefined;
    if (logisticsUpdate.status === 'ASSIGNED') mappedOrderStatus = 'CONFIRMED';
    if (logisticsUpdate.status === 'PICKED_UP') mappedOrderStatus = 'DISPATCHED';
    if (logisticsUpdate.status === 'IN_TRANSIT') mappedOrderStatus = 'OUT_FOR_DELIVERY';
    if (logisticsUpdate.status === 'DELIVERED') mappedOrderStatus = 'DELIVERED';
    if (logisticsUpdate.status === 'FAILED') mappedOrderStatus = 'CANCELLED';

    let updatedOrder = orderStore.updateMangwaleStatus(identifier, {
      ...logisticsUpdate,
      orderStatus: mappedOrderStatus,
    });

    if (!updatedOrder) {
      const dbOrder = await orderRepository.updateMangwaleStatus(identifier, {
        ...logisticsUpdate,
        orderStatus: mappedOrderStatus,
      });
      if (dbOrder) {
        updatedOrder = dbOrder;
      }
    }

    if (!updatedOrder) {
      console.warn(`[Mangwale Webhook] Order matching "${identifier}" not found in database or local store`);
      // Return 200 with notice so Mangwale retry queue is not needlessly exhausted for sandbox tests
      return NextResponse.json(
        {
          success: true,
          message: `Order ${identifier} acknowledged but not found in active memory session`,
          identifier,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mangwale order logistics status updated',
      orderNumber: updatedOrder.orderNumber,
      mangwaleTaskId: updatedOrder.mangwale?.taskId,
      newStatus: updatedOrder.orderStatus,
      logisticsStatus: updatedOrder.mangwale?.status,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Webhook processing error';
    console.error('[Mangwale Webhook Error]', errorMsg);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
