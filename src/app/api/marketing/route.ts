import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';

export async function GET() {
  try {
    const tags = orderStore.getMarketingTags();
    const campaigns = orderStore.getCampaigns();
    const analytics = orderStore.getCampaignAnalytics();

    return NextResponse.json({
      success: true,
      tags,
      campaigns,
      analytics,
    });
  } catch (error) {
    console.error('Failed to get marketing config:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, tags, campaignData, campaignId, trackingUpdates } = body;

    if (action === 'UPDATE_TAGS') {
      const updatedTags = orderStore.updateMarketingTags(tags || {});
      return NextResponse.json({
        success: true,
        tags: updatedTags,
        message: 'Marketing tags and tracking pixels updated globally',
      });
    }

    if (action === 'CREATE_CAMPAIGN') {
      if (!campaignData || !campaignData.slug || !campaignData.title || !campaignData.outletSlug) {
        return NextResponse.json(
          { success: false, error: 'Campaign slug, title, and outletSlug are required' },
          { status: 400 }
        );
      }

      const newCampaign = orderStore.createCampaign({
        slug: campaignData.slug,
        title: campaignData.title,
        outletSlug: campaignData.outletSlug,
        headline: campaignData.headline || campaignData.title,
        subheadline: campaignData.subheadline || 'Handcrafted Fresh Daily in Nashik',
        badge: campaignData.badge || 'Limited Time Offer',
        discountPercentage: campaignData.discountPercentage || 0,
        offerCode: campaignData.discountCode || campaignData.offerCode || 'SPECIAL',
        minOrderValue: campaignData.minOrderValue || 200,
        heroImage: campaignData.heroImage || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1200',
        ctaText: campaignData.ctaText || 'Order Fresh Now',
        metaPixelId: campaignData.metaPixelId || '',
        googleAdsId: campaignData.googleAdsId || '',
        gtmId: campaignData.gtmId || '',
        active: true,
      });

      return NextResponse.json({
        success: true,
        campaign: newCampaign,
        message: 'Campaign created successfully',
      });
    }

    if (action === 'UPDATE_CAMPAIGN_TRACKING') {
      if (!campaignId) {
        return NextResponse.json(
          { success: false, error: 'campaignId is required' },
          { status: 400 }
        );
      }

      const updated = orderStore.updateCampaignTracking(campaignId, trackingUpdates || {});
      return NextResponse.json({
        success: true,
        campaign: updated,
        message: 'Campaign tracking parameters updated',
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Marketing API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
