import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';
import { fetchMangwaleOrderStatus } from '@/lib/logistics/mangwale';
import { Order } from '@/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let order = (await orderStore.getOrderByIdAsync(id)) || orderStore.getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // If order has an active Mangwale delivery task and is not finished, sync live status from Mangwale
    if (
      order.mangwale?.taskId &&
      order.orderStatus !== 'DELIVERED' &&
      order.orderStatus !== 'CANCELLED'
    ) {
      try {
        const outlet = orderStore.getOutletBySlug(order.outletSlug);
        const liveStatus = await fetchMangwaleOrderStatus(order.mangwale.taskId, outlet);
        if (liveStatus.success) {
          const updated = orderStore.updateMangwaleStatus(order.mangwale.taskId, {
            status: liveStatus.status,
            riderName: liveStatus.rider?.name,
            riderPhone: liveStatus.rider?.phone,
            riderVehicleNo: liveStatus.rider?.vehicleNo,
            trackingUrl: liveStatus.trackingUrl || order.mangwale.trackingUrl,
            estimatedDeliveryMinutes:
              liveStatus.estimatedDeliveryMinutes || order.mangwale.estimatedDeliveryMinutes,
            orderStatus:
              liveStatus.status === 'DELIVERED'
                ? 'DELIVERED'
                : liveStatus.status === 'IN_TRANSIT'
                ? 'OUT_FOR_DELIVERY'
                : liveStatus.status === 'PICKED_UP'
                ? 'DISPATCHED'
                : order.orderStatus,
          });
          if (updated) {
            order = updated;
          }
        }
      } catch (err) {
        // Continue with current order state if real-time Mangwale polling fails
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch order';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { orderStatus, riderName, riderPhone, riderVehicleNo, estimatedMinutes, notes } = body;

    const existingOrder = orderStore.getOrderById(id);
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    let updated = existingOrder;
    if (orderStatus) {
      const res = orderStore.updateOrderStatus(id, orderStatus);
      if (res) updated = res;
    }

    if (riderName || riderPhone || riderVehicleNo || estimatedMinutes !== undefined || notes) {
      const taskId = updated.mangwale?.taskId || `task-${updated.id}`;
      const logisticsUpdate: Partial<Order['mangwale']> = {};
      if (riderName) logisticsUpdate.riderName = riderName;
      if (riderPhone) logisticsUpdate.riderPhone = riderPhone;
      if (riderVehicleNo) logisticsUpdate.riderVehicleNo = riderVehicleNo;
      if (estimatedMinutes !== undefined) logisticsUpdate.estimatedDeliveryMinutes = estimatedMinutes;
      if (notes) logisticsUpdate.notes = notes;

      const res = orderStore.updateMangwaleStatus(taskId, logisticsUpdate);
      if (res) updated = res;
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to update order';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
