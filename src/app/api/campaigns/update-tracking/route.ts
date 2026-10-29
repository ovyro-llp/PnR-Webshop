import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store/order-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaignId, outletSlug, metaPixelId, googleAdsId, gtmId, capiAccessToken } = body;

    if (campaignId) {
      const updatedCampaign = orderStore.updateCampaignTracking(campaignId, {
        metaPixelId,
        googleAdsId,
        gtmId,
        capiAccessToken,
      });

      if (!updatedCampaign) {
        return NextResponse.json(
          { success: false, message: 'Campaign not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Campaign tracking pixels updated successfully',
        campaign: updatedCampaign,
      });
    }

    if (outletSlug) {
      const updatedOutlet = orderStore.updateOutletTracking(outletSlug, {
        defaultMetaPixelId: metaPixelId,
        defaultGoogleAdsId: googleAdsId,
      });

      if (!updatedOutlet) {
        return NextResponse.json(
          { success: false, message: 'Outlet not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Outlet default tracking pixels updated successfully',
        outlet: updatedOutlet,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Either campaignId or outletSlug must be specified' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to update tracking';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
