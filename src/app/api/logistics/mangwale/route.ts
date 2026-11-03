import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';
import { orderRepository } from '@/lib/db/order-repository';
import {
  fetchMangwaleOrderStatus,
  fetchMangwaleDeliveries,
  dispatchToMangwale,
  resolveMangwaleCredentials,
} from '@/lib/logistics/mangwale';
import { Order } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/logistics/mangwale
 * Real-time queries for Mangwale orders, delivery fleet, and tracking
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const taskId = searchParams.get('taskId');
    const outletSlug = searchParams.get('outlet');

    // 1. Fetch real-time status for a specific order
    if (orderId) {
      const order =
        (await orderRepository.getOrderById(orderId)) ||
        (await orderStore.getOrderByIdAsync(orderId)) ||
        orderStore.getOrderById(orderId);

      if (!order) {
        return NextResponse.json(
          { success: false, message: `Order not found: ${orderId}` },
          { status: 404 }
        );
      }

      if (!order.mangwale?.taskId) {
        return NextResponse.json({
          success: true,
          isDispatched: false,
          order,
          message: 'Order has not been dispatched to Mangwale yet',
        });
      }

      const outlet = orderStore.getOutletBySlug(order.outletSlug);
      const liveStatus = await fetchMangwaleOrderStatus(order.mangwale.taskId, outlet);

      if (liveStatus.success) {
        // Update database and in-memory store with live data from Mangwale
        const updatePayload: Partial<Order['mangwale']> = {
          status: liveStatus.status,
          riderName: liveStatus.rider?.name,
          riderPhone: liveStatus.rider?.phone,
          riderVehicleNo: liveStatus.rider?.vehicleNo,
          trackingUrl: liveStatus.trackingUrl || order.mangwale.trackingUrl,
          estimatedDeliveryMinutes: liveStatus.estimatedDeliveryMinutes || order.mangwale.estimatedDeliveryMinutes,
        };

        const updatedOrder = orderStore.updateMangwaleStatus(order.mangwale.taskId, {
          ...updatePayload,
          orderStatus:
            liveStatus.status === 'DELIVERED'
              ? 'DELIVERED'
              : liveStatus.status === 'IN_TRANSIT'
              ? 'OUT_FOR_DELIVERY'
              : liveStatus.status === 'PICKED_UP'
              ? 'DISPATCHED'
              : order.orderStatus,
        });

        return NextResponse.json({
          success: true,
          liveStatus,
          order: updatedOrder || order,
        });
      }

      return NextResponse.json({
        success: true,
        liveStatus,
        order,
      });
    }

    // 2. Fetch real-time status for a specific Mangwale task ID
    if (taskId) {
      const outlet = outletSlug ? orderStore.getOutletBySlug(outletSlug) : undefined;
      const liveStatus = await fetchMangwaleOrderStatus(taskId, outlet);
      return NextResponse.json({ success: true, liveStatus });
    }

    // 3. Fetch active deliveries list from Mangwale API for outlet
    const outlet = outletSlug && outletSlug !== 'all' ? orderStore.getOutletBySlug(outletSlug) : undefined;
    const creds = resolveMangwaleCredentials(outlet);
    const deliveriesRes = await fetchMangwaleDeliveries(outlet, { status: 'active', limit: 50 });

    return NextResponse.json({
      success: true,
      isConfigured: creds.isConfigured,
      environment: creds.environment,
      endpoint: creds.endpoint,
      deliveries: deliveriesRes.deliveries,
      message: deliveriesRes.message,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to query Mangwale logistics';
    console.error('Mangwale Logistics GET Error:', errorMsg);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

/**
 * POST /api/logistics/mangwale
 * Real-time actions: sync all active orders with Mangwale or dispatch an order
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, orderId, outletSlug } = body;

    // A. Sync all active deliveries in real-time with Mangwale API
    if (action === 'SYNC_ALL') {
      const dbOrders = await orderRepository.getAllOrders();
      const allOrders: Order[] = dbOrders.length > 0 ? dbOrders : orderStore.getAllOrders();
      const activeDispatchedOrders = allOrders.filter(
        (o: Order) =>
          o.mangwale?.taskId &&
          o.orderStatus !== 'DELIVERED' &&
          o.orderStatus !== 'CANCELLED' &&
          (!outletSlug || outletSlug === 'all' || o.outletSlug === outletSlug)
      );

      let syncedCount = 0;
      const updates: Array<{ orderId: string; taskId: string; status: string }> = [];

      for (const order of activeDispatchedOrders) {
        if (!order.mangwale?.taskId) continue;
        const outlet = orderStore.getOutletBySlug(order.outletSlug);
        const liveStatus = await fetchMangwaleOrderStatus(order.mangwale.taskId, outlet);

        if (liveStatus.success) {
          orderStore.updateMangwaleStatus(order.mangwale.taskId, {
            status: liveStatus.status,
            riderName: liveStatus.rider?.name,
            riderPhone: liveStatus.rider?.phone,
            riderVehicleNo: liveStatus.rider?.vehicleNo,
            trackingUrl: liveStatus.trackingUrl || order.mangwale.trackingUrl,
            estimatedDeliveryMinutes: liveStatus.estimatedDeliveryMinutes || order.mangwale.estimatedDeliveryMinutes,
            orderStatus:
              liveStatus.status === 'DELIVERED'
                ? 'DELIVERED'
                : liveStatus.status === 'IN_TRANSIT'
                ? 'OUT_FOR_DELIVERY'
                : liveStatus.status === 'PICKED_UP'
                ? 'DISPATCHED'
                : order.orderStatus,
          });

          syncedCount++;
          updates.push({
            orderId: order.id,
            taskId: order.mangwale.taskId,
            status: liveStatus.status,
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Synced ${syncedCount} active deliveries with Mangwale API`,
        syncedCount,
        updates,
      });
    }

    // B. Manual dispatch of an order to Mangwale
    if (action === 'DISPATCH' && orderId) {
      const order =
        (await orderRepository.getOrderById(orderId)) ||
        (await orderStore.getOrderByIdAsync(orderId)) ||
        orderStore.getOrderById(orderId);

      if (!order) {
        return NextResponse.json(
          { success: false, message: `Order not found: ${orderId}` },
          { status: 404 }
        );
      }

      const outlet = orderStore.getOutletBySlug(order.outletSlug);
      if (!outlet) {
        return NextResponse.json(
          { success: false, message: `Outlet not found: ${order.outletSlug}` },
          { status: 404 }
        );
      }

      const dispatchRes = await dispatchToMangwale(order, outlet);
      if (!dispatchRes.success) {
        return NextResponse.json(
          { success: false, message: dispatchRes.message },
          { status: 502 }
        );
      }

      order.mangwale = {
        taskId: dispatchRes.taskId,
        status: 'ASSIGNED',
        riderName: dispatchRes.rider?.name,
        riderPhone: dispatchRes.rider?.phone,
        riderVehicleNo: dispatchRes.rider?.vehicleNo,
        trackingUrl: dispatchRes.trackingUrl,
        estimatedDeliveryMinutes: dispatchRes.estimatedDeliveryMinutes,
        dispatchedAt: new Date().toISOString(),
        notes: dispatchRes.message,
      };
      order.orderStatus = 'PREPARING';
      order.updatedAt = new Date().toISOString();

      await orderRepository.saveOrder(order);
      orderStore.updateMangwaleStatus(dispatchRes.taskId, {
        ...order.mangwale,
        orderStatus: 'PREPARING',
      });

      return NextResponse.json({
        success: true,
        message: 'Order successfully dispatched to Mangwale',
        order,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action. Supported actions: SYNC_ALL, DISPATCH' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Mangwale Logistics POST Error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
