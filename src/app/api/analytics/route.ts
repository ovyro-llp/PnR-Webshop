import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const outletSlug = searchParams.get('outlet') || undefined;

    const isScoped = Boolean(outletSlug && outletSlug !== 'all');
    const outletAnalytics = orderStore.getOutletAnalytics(isScoped ? outletSlug : undefined);
    const campaignAnalytics = orderStore.getCampaignAnalytics();
    
    // Scoped orders if filtering by an outlet, or all orders across HQ
    const ordersForMetrics = isScoped
      ? orderStore.getOrdersByOutlet(outletSlug!)
      : orderStore.getAllOrders();

    // High-level aggregate metrics
    const totalGMV = ordersForMetrics.reduce((acc, o) => acc + o.total, 0);
    const totalOrders = ordersForMetrics.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalGMV / totalOrders) : 0;
    const completedOrders = ordersForMetrics.filter((o) => o.orderStatus === 'DELIVERED').length;

    return NextResponse.json({
      success: true,
      summary: {
        totalGMV,
        totalOrders,
        avgOrderValue,
        completedOrders,
      },
      outlets: outletAnalytics,
      campaigns: campaignAnalytics,
    });
  } catch (error) {
    console.error('Failed to get analytics summary:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
