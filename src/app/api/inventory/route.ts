import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const outletSlug = searchParams.get('outlet') || 'college-road';

    const stock = orderStore.getOutletStock(outletSlug);
    const outlet = orderStore.getOutletBySlug(outletSlug);

    return NextResponse.json({
      success: true,
      outletSlug,
      isOpen: outlet ? outlet.isOpen : true,
      stock,
    });
  } catch (error) {
    console.error('Failed to get inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { outletSlug, itemId, isAvailable, stockQuantity, customPrice, updatedBy, toggleOutletOpen } = body;

    if (!outletSlug) {
      return NextResponse.json(
        { success: false, error: 'outletSlug is required' },
        { status: 400 }
      );
    }

    // Toggle outlet open/closed (emergency busy pause)
    if (typeof toggleOutletOpen === 'boolean') {
      const updatedOutlet = orderStore.toggleOutletOpenStatus(outletSlug, toggleOutletOpen);
      return NextResponse.json({
        success: true,
        outlet: updatedOutlet,
        message: `Outlet status updated to ${toggleOutletOpen ? 'Open' : 'Busy / Paused'}`,
      });
    }

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'itemId is required for stock updates' },
        { status: 400 }
      );
    }

    const updated = orderStore.updateOutletStockItem(outletSlug, itemId, {
      isAvailable,
      stockQuantity,
      customPrice,
      updatedBy,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Item not found in outlet inventory' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item: updated,
      message: `Stock updated for ${updated.name}`,
    });
  } catch (error) {
    console.error('Failed to update inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
