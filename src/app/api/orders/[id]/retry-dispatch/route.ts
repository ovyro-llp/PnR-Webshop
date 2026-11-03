import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';
import { orderRepository } from '@/lib/db/order-repository';
import { dispatchToMangwale } from '@/lib/logistics/mangwale';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order =
      (await orderRepository.getOrderById(id)) ||
      (await orderStore.getOrderByIdAsync(id)) ||
      orderStore.getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, message: `Order not found: ${id}` },
        { status: 404 }
      );
    }

    if (order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED') {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot retry dispatch for order with status ${order.orderStatus}`,
        },
        { status: 400 }
      );
    }

    const outlet = orderStore.getOutletBySlug(order.outletSlug);
    if (!outlet) {
      return NextResponse.json(
        { success: false, message: `Outlet not found: ${order.outletSlug}` },
        { status: 404 }
      );
    }

    const mangwaleRes = await dispatchToMangwale(order, outlet);
    if (!mangwaleRes.success) {
      return NextResponse.json(
        { success: false, message: mangwaleRes.message },
        { status: 502 }
      );
    }

    order.mangwale = {
      taskId: mangwaleRes.taskId,
      status: 'ASSIGNED',
      riderName: mangwaleRes.rider?.name,
      riderPhone: mangwaleRes.rider?.phone,
      riderVehicleNo: mangwaleRes.rider?.vehicleNo,
      trackingUrl: mangwaleRes.trackingUrl,
      estimatedDeliveryMinutes: mangwaleRes.estimatedDeliveryMinutes,
      dispatchedAt: new Date().toISOString(),
      notes: mangwaleRes.message,
    };
    order.orderStatus = 'PREPARING';
    order.updatedAt = new Date().toISOString();

    await orderRepository.saveOrder(order);
    orderStore.updateMangwaleStatus(mangwaleRes.taskId, {
      ...order.mangwale,
      orderStatus: 'PREPARING',
    });

    return NextResponse.json({
      success: true,
      message: 'Order successfully re-dispatched to Mangwale',
      order,
    });
  } catch (error: unknown) {
    console.error('Retry dispatch error:', error);
    const message = error instanceof Error ? error.message : 'Failed to retry dispatch';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
