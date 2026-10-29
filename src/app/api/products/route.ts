import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const outletSlug = searchParams.get('outlet') || undefined;
    const isVegParam = searchParams.get('isVeg');
    const isVeg = isVegParam !== null ? isVegParam === 'true' : undefined;

    const products = orderStore.getMasterProducts({
      category,
      search,
      outletSlug,
      isVeg,
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Failed to get master products:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, productData, id, updates, outletSlug, itemId, isAvailable, itemIds } = body;

    // Action 1: Create Product in Master Catalog
    if (action === 'CREATE_PRODUCT') {
      if (!productData || !productData.name || !productData.category || productData.price === undefined) {
        return NextResponse.json(
          { success: false, error: 'Product name, category, and base price are required' },
          { status: 400 }
        );
      }

      const product = orderStore.createMasterProduct(productData);
      return NextResponse.json({
        success: true,
        message: `Product "${product.name}" created and added to master catalog`,
        product,
      });
    }

    // Action 2: Update Master Product
    if (action === 'UPDATE_PRODUCT') {
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Product id is required' },
          { status: 400 }
        );
      }

      const updated = orderStore.updateMasterProduct(id, updates || {});
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Product "${updated.name}" updated`,
        product: updated,
      });
    }

    // Action 3: Delete / Archive Master Product
    if (action === 'DELETE_PRODUCT') {
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Product id is required' },
          { status: 400 }
        );
      }

      const success = orderStore.deleteMasterProduct(id);
      return NextResponse.json({
        success,
        message: success ? 'Product archived from catalog' : 'Product not found',
      });
    }

    // Action 4: 1-Tap Toggle Product Availability for an Outlet
    if (action === 'TOGGLE_OUTLET_AVAILABILITY') {
      if (!outletSlug || !itemId || typeof isAvailable !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'outletSlug, itemId, and boolean isAvailable are required' },
          { status: 400 }
        );
      }

      const result = orderStore.toggleProductOutletAvailability(outletSlug, itemId, isAvailable);
      return NextResponse.json({
        success: true,
        message: isAvailable
          ? `Product added to ${outletSlug} inventory`
          : `Product removed from ${outletSlug} inventory`,
        ...result,
      });
    }

    // Action 5: Bulk Assign Products to Outlet
    if (action === 'BULK_ASSIGN_OUTLET') {
      if (!outletSlug || !Array.isArray(itemIds)) {
        return NextResponse.json(
          { success: false, error: 'outletSlug and itemIds array are required' },
          { status: 400 }
        );
      }

      const activeStock = orderStore.bulkAssignProductsToOutlet(outletSlug, itemIds);
      return NextResponse.json({
        success: true,
        message: `Updated inventory for ${outletSlug} (${activeStock.length} items active)`,
        activeStock,
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to process product action:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
