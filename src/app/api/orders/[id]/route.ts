import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';
import { Order } from '@/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = orderStore.getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
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
