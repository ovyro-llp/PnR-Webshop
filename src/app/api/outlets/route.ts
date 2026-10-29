import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';
import { Outlet } from '@/types';

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
    const { action, outletData, idOrSlug, updates } = body;

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

      const newOutlet = orderStore.createOutlet({
        name,
        slug: slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-'),
        tagline: tagline || 'Fresh artisanal bakes & cakes in Nashik',
        address: address || '',
        area: area || 'Nashik',
        city: city || 'Nashik',
        pincode: pincode || '422005',
        phone: phone || '+91 94236 39911',
        email: email || `${slug}@puffsnrolls.com`,
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
      });

      return NextResponse.json({
        success: true,
        outlet: newOutlet,
        message: `Outlet "${newOutlet.name}" created successfully`,
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
