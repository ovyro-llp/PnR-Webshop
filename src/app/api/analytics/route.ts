import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const outletSlug = searchParams.get('outlet') || undefined;

    const outletAnalytics = orderStore.getOutletAnalytics(outletSlug === 'all' ? undefined : outletSlug);
    const campaignAnalytics = orderStore.getCampaignAnalytics();
    const allOrders = orderStore.getAllOrders();

    // High-level aggregate metrics
    const totalGMV = allOrders.reduce((acc, o) => acc + o.total, 0);
    const totalOrders = allOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalGMV / totalOrders) : 0;
    const completedOrders = allOrders.filter((o) => o.orderStatus === 'DELIVERED').length;

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
