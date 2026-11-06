import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';
import { getMangwaleDeliveryQuote, calculateMangwaleDeliveryFee } from '@/lib/logistics/mangwale';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const outletSlug = searchParams.get('outletSlug') || 'college-road';
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const address = searchParams.get('address') || undefined;

    const lat = latStr ? parseFloat(latStr) : NaN;
    const lng = lngStr ? parseFloat(lngStr) : NaN;

    if (isNaN(lat) || isNaN(lng)) {
      // Return default base rate (2.5 km standard delivery)
      const defaultQuote = calculateMangwaleDeliveryFee(2.5);
      return NextResponse.json({
        success: true,
        serviceable: true,
        distanceKm: 2.5,
        deliveryFee: defaultQuote.deliveryFee,
        priceBreakdown: defaultQuote.priceBreakdown,
        estimatedMinutes: defaultQuote.estimatedMinutes,
        source: 'MANGWALE_RATE_CARD',
      });
    }

    const outlet = orderStore.getOutletBySlug(outletSlug) || orderStore.getOutlets()[0];
    const quote = await getMangwaleDeliveryQuote({
      outlet,
      customerCoordinates: { lat, lng },
      customerAddress: address,
    });

    return NextResponse.json(quote);
  } catch (error: any) {
    console.error('Failed to get Mangwale delivery quote:', error);
    // Safe fallback to 3.0 km default rate card
    const fallback = calculateMangwaleDeliveryFee(3.0);
    return NextResponse.json({
      success: true,
      serviceable: true,
      distanceKm: 3.0,
      deliveryFee: fallback.deliveryFee,
      priceBreakdown: fallback.priceBreakdown,
      estimatedMinutes: fallback.estimatedMinutes,
      source: 'MANGWALE_RATE_CARD',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { outletSlug, lat, lng, address } = body;

    const latNum = typeof lat === 'number' ? lat : parseFloat(lat);
    const lngNum = typeof lng === 'number' ? lng : parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      const defaultQuote = calculateMangwaleDeliveryFee(2.5);
      return NextResponse.json({
        success: true,
        serviceable: true,
        distanceKm: 2.5,
        deliveryFee: defaultQuote.deliveryFee,
        priceBreakdown: defaultQuote.priceBreakdown,
        estimatedMinutes: defaultQuote.estimatedMinutes,
        source: 'MANGWALE_RATE_CARD',
      });
    }

    const outlet = orderStore.getOutletBySlug(outletSlug || 'college-road') || orderStore.getOutlets()[0];
    const quote = await getMangwaleDeliveryQuote({
      outlet,
      customerCoordinates: { lat: latNum, lng: lngNum },
      customerAddress: address,
    });

    return NextResponse.json(quote);
  } catch (error: any) {
    console.error('Failed to calculate Mangwale delivery quote:', error);
    const fallback = calculateMangwaleDeliveryFee(3.0);
    return NextResponse.json({
      success: true,
      serviceable: true,
      distanceKm: 3.0,
      deliveryFee: fallback.deliveryFee,
      priceBreakdown: fallback.priceBreakdown,
      estimatedMinutes: fallback.estimatedMinutes,
      source: 'MANGWALE_RATE_CARD',
    });
  }
}
