import { NextRequest, NextResponse } from 'next/server';
import { orderStore, MarketingEventRecord } from '@/lib/store/order-store';
import { orderRepository } from '@/lib/db/order-repository';
import { hashPhoneForMeta, hashForMeta } from '@/lib/tracking/meta-capi';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || 100), 500);
    const eventName = searchParams.get('event');

    const dbEvents = await orderRepository.getMarketingEvents(limit, eventName || undefined);
    const events = dbEvents.length > 0 ? dbEvents : orderStore.getMarketingEvents(limit, eventName || undefined);

    return NextResponse.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('Failed to get marketing events:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventName,
      eventId,
      orderId,
      pixelId: reqPixelId,
      outletSlug,
      campaignSlug,
      value,
      currency = 'INR',
      userData,
      customData,
    } = body;

    if (!eventName || !eventId) {
      return NextResponse.json(
        { success: false, message: 'eventName and eventId are required' },
        { status: 400 }
      );
    }

    // Resolve active Pixel ID
    const tags = await orderStore.getMarketingTagsAsync();
    const outlet = outletSlug ? orderStore.getOutletBySlug(outletSlug) : undefined;
    const campaign = outletSlug && campaignSlug ? orderStore.getCampaign(outletSlug, campaignSlug) : undefined;
    const pixelId =
      reqPixelId ||
      campaign?.metaPixelId ||
      outlet?.defaultMetaPixelId ||
      (tags.globalMetaPixelId as string) ||
      '';

    // Hash user data for privacy & match quality
    const hashedPhone = userData?.phone ? hashPhoneForMeta(userData.phone) : undefined;
    const hashedEmail = userData?.email ? hashForMeta(userData.email) : undefined;

    const eventRecord: MarketingEventRecord = {
      orderId: orderId || undefined,
      eventName,
      eventId,
      pixelId,
      outletSlug: outletSlug || undefined,
      campaignSlug: campaignSlug || undefined,
      value: typeof value === 'number' ? value : 0,
      currency: currency || 'INR',
      userHash: {
        phoneHashed: Boolean(hashedPhone),
        emailHashed: Boolean(hashedEmail),
      },
      capiStatus: 'CLIENT_LOGGED',
      capiResponse: customData || {},
      createdAt: new Date().toISOString(),
    };

    // Store in memory and database
    orderStore.recordMarketingEvent(eventRecord);
    await orderRepository.recordMarketingEvent(eventRecord);

    return NextResponse.json({
      success: true,
      eventId,
      message: `Marketing event "${eventName}" recorded successfully`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to record marketing event';
    console.error('Error logging marketing event:', message);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
