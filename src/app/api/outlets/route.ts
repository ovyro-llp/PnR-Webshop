import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';
import { testMangwaleConnection } from '@/lib/logistics/mangwale';
import { Outlet, MangwaleOutletConfig } from '@/types';

export async function GET() {
  try {
    const outlets = orderStore.getOutlets();
    return NextResponse.json({
      success: true,
      outlets,
    });
  } catch (error) {
    console.error('Failed to get outlets:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, outletData, idOrSlug, updates, mangwaleConfig, outletName } = body;

    // Test Mangwale Connection directly from Admin Portal
    if (action === 'TEST_MANGWALE_CONNECTION') {
      const config: MangwaleOutletConfig = mangwaleConfig || updates?.mangwaleConfig;
      if (!config) {
        return NextResponse.json(
          { success: false, error: 'mangwaleConfig is required to test connection' },
          { status: 400 }
        );
      }

      const result = await testMangwaleConnection(config, outletName || idOrSlug || 'Outlet');

      // If idOrSlug provided, update the lastTestedAt and lastTestStatus timestamp
      if (idOrSlug) {
        const existing = orderStore.getOutletBySlug(idOrSlug);
        if (existing) {
          orderStore.updateOutlet(idOrSlug, {
            mangwaleConfig: {
              ...(existing.mangwaleConfig || config),
              lastTestedAt: new Date().toISOString(),
              lastTestStatus: result.success ? 'SUCCESS' : 'FAILED',
            },
          });
        }
      }

      return NextResponse.json({
        success: result.success,
        message: result.message,
        latencyMs: result.latencyMs,
      });
    }

    if (action === 'CREATE') {
      const {
        name,
        slug,
        tagline,
        address,
        area,
        city,
        pincode,
        phone,
        email,
        googleMapsUrl,
        openingHours,
        minOrderAmount,
        deliveryTimeEstimate,
        mangwaleConfig: newMangwaleConfig,
      } = outletData || {};

      if (!name || !slug) {
        return NextResponse.json(
          { success: false, error: 'Name and Slug are required' },
          { status: 400 }
        );
      }

      // Check for duplicate slug
      const existing = orderStore.getOutletBySlug(slug);
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Outlet with slug "${slug}" already exists` },
          { status: 400 }
        );
      }

      const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-');

      const newOutlet = orderStore.createOutlet({
        name,
        slug: cleanSlug,
        tagline: tagline || 'Fresh artisanal bakes & cakes in Nashik',
        address: address || '',
        area: area || 'Nashik',
        city: city || 'Nashik',
        pincode: pincode || '422005',
        phone: phone || '+91 94236 39911',
        email: email || `${cleanSlug}@puffsnrolls.com`,
        googleMapsUrl: googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(name + ' Nashik')}`,
        openingHours: openingHours || '9:00 AM - 10:30 PM',
        rating: 4.8,
        reviewCount: 12,
        isOpen: true,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 149,
        deliveryTimeEstimate: deliveryTimeEstimate || '20-30 mins',
        coordinates: {
          lat: 20.0063,
          lng: 73.7634,
        },
        mangwaleConfig: newMangwaleConfig || {
          apiKey: `mw_live_${cleanSlug.replace(/[^a-z0-9]/g, '_')}_7731`,
          apiSecret: `sk_live_${cleanSlug.replace(/[^a-z0-9]/g, '_')}_sec_9921`,
          merchantId: `MNG-MKT-${cleanSlug.toUpperCase()}`,
          environment: 'live',
          isEnabled: true,
        },
      });

      return NextResponse.json({
        success: true,
        outlet: newOutlet,
        message: `Outlet "${newOutlet.name}" created successfully with Mangwale configuration`,
      });
    }

    if (action === 'UPDATE') {
      if (!idOrSlug || !updates) {
        return NextResponse.json(
          { success: false, error: 'idOrSlug and updates are required' },
          { status: 400 }
        );
      }

      const updated = orderStore.updateOutlet(idOrSlug, updates);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Outlet not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        outlet: updated,
        message: `Outlet "${updated.name}" updated successfully`,
      });
    }

    if (action === 'DELETE') {
      if (!idOrSlug) {
        return NextResponse.json(
          { success: false, error: 'idOrSlug is required' },
          { status: 400 }
        );
      }

      const deleted = orderStore.deleteOutlet(idOrSlug);
      return NextResponse.json({
        success: deleted,
        message: deleted ? 'Outlet deleted successfully' : 'Outlet not found',
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Outlet API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
