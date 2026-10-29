import { Order, Outlet, Campaign, MenuItem } from '@/types';
import { OUTLETS, CAMPAIGNS, MENU_ITEMS, INITIAL_ORDERS } from '@/lib/data/mock-data';
import { dispatchToMangwale } from '@/lib/logistics/mangwale';
import { sendMetaCAPI } from '@/lib/tracking/pixel-tracker';

// In-Memory store across requests for Next.js dev/prod server
declare global {
  // eslint-disable-next-line no-var
  var __PNR_ORDERS__: Order[] | undefined;
  // eslint-disable-next-line no-var
  var __PNR_CAMPAIGNS__: Campaign[] | undefined;
  // eslint-disable-next-line no-var
  var __PNR_OUTLETS__: Outlet[] | undefined;
}

if (!globalThis.__PNR_ORDERS__) {
  globalThis.__PNR_ORDERS__ = [...INITIAL_ORDERS];
}
if (!globalThis.__PNR_CAMPAIGNS__) {
  globalThis.__PNR_CAMPAIGNS__ = [...CAMPAIGNS];
}
if (!globalThis.__PNR_OUTLETS__) {
  globalThis.__PNR_OUTLETS__ = [...OUTLETS];
}

export const orderStore = {
  getAllOrders: (): Order[] => {
    return globalThis.__PNR_ORDERS__ || [];
  },

  getOrdersByOutlet: (outletSlug: string): Order[] => {
    return (globalThis.__PNR_ORDERS__ || []).filter(
      (o) => o.outletSlug === outletSlug
    );
  },

  getOrderById: (orderId: string): Order | undefined => {
    return (globalThis.__PNR_ORDERS__ || []).find(
      (o) => o.id === orderId || o.orderNumber === orderId
    );
  },

  createOrder: async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'mangwale' | 'orderStatus' | 'paymentStatus'>): Promise<Order> => {
    const outlet = orderStore.getOutletBySlug(orderData.outletSlug);
    if (!outlet) {
      throw new Error(`Outlet not found: ${orderData.outletSlug}`);
    }

    const orderNumber = `PNR-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      orderStatus: 'RECEIVED',
      paymentStatus: orderData.paymentMethod === 'COD' ? 'COD_CONFIRMED' : 'COMPLETED',
      mangwale: {
        status: 'PENDING',
        notes: 'Dispatch initiated to Mangwale Logistics Nashik',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Dispatch automatically to Mangwale Logistics
    try {
      const mangwaleRes = await dispatchToMangwale(newOrder, outlet);
      if (mangwaleRes.success) {
        newOrder.mangwale = {
          taskId: mangwaleRes.taskId,
          status: 'ASSIGNED',
          riderName: mangwaleRes.rider?.name,
          riderPhone: mangwaleRes.rider?.phone,
          riderVehicleNo: mangwaleRes.rider?.vehicleNo,
          trackingUrl: mangwaleRes.trackingUrl,
          estimatedDeliveryMinutes: mangwaleRes.estimatedDeliveryMinutes,
          dispatchedAt: new Date().toISOString(),
          notes: mangwaleRes.message,
        };
        newOrder.orderStatus = 'PREPARING';
      }
    } catch (err) {
      console.error('Mangwale auto-dispatch failure:', err);
    }

    // 2. Server-side Meta Conversions API (CAPI)
    try {
      const campaign = orderStore.getCampaign(orderData.outletSlug, orderData.campaignSlug);
      const pixelId = campaign?.metaPixelId || outlet.defaultMetaPixelId;
      await sendMetaCAPI({
        eventName: 'Purchase',
        pixelId,
        outletSlug: orderData.outletSlug,
        campaignSlug: orderData.campaignSlug,
        value: newOrder.total,
        orderId: newOrder.orderNumber,
        contentName: `Order from ${outlet.name}`,
        userData: {
          name: newOrder.customer.name,
          phone: newOrder.customer.phone,
        },
      });
    } catch (err) {
      console.warn('Meta CAPI trigger error:', err);
    }

    globalThis.__PNR_ORDERS__?.unshift(newOrder);
    return newOrder;
  },

  updateOrderStatus: (orderId: string, status: Order['orderStatus']): Order | undefined => {
    const orders = globalThis.__PNR_ORDERS__ || [];
    const index = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        orderStatus: status,
        updatedAt: new Date().toISOString(),
      };
      return orders[index];
    }
    return undefined;
  },

  updateMangwaleStatus: (
    taskId: string,
    update: Partial<Order['mangwale']> & { orderStatus?: Order['orderStatus'] }
  ): Order | undefined => {
    const orders = globalThis.__PNR_ORDERS__ || [];
    const index = orders.findIndex((o) => o.mangwale.taskId === taskId);
    if (index !== -1) {
      const current = orders[index];
      orders[index] = {
        ...current,
        mangwale: {
          ...current.mangwale,
          ...update,
        },
        orderStatus: update.orderStatus || current.orderStatus,
        updatedAt: new Date().toISOString(),
      };
      return orders[index];
    }
    return undefined;
  },

  // Outlets & Campaigns
  getOutlets: (): Outlet[] => {
    return globalThis.__PNR_OUTLETS__ || [];
  },

  getOutletBySlug: (slug: string): Outlet | undefined => {
    return (globalThis.__PNR_OUTLETS__ || []).find((o) => o.slug === slug);
  },

  getCampaigns: (): Campaign[] => {
    return globalThis.__PNR_CAMPAIGNS__ || [];
  },

  getCampaign: (outletSlug: string, campaignSlug?: string): Campaign | undefined => {
    if (!campaignSlug) return undefined;
    return (globalThis.__PNR_CAMPAIGNS__ || []).find(
      (c) => c.slug === campaignSlug && (c.outletSlug === outletSlug || c.outletSlug === 'all')
    );
  },

  updateCampaignTracking: (
    campaignId: string,
    tracking: { metaPixelId?: string; googleAdsId?: string; gtmId?: string; capiAccessToken?: string }
  ): Campaign | undefined => {
    const campaigns = globalThis.__PNR_CAMPAIGNS__ || [];
    const idx = campaigns.findIndex((c) => c.id === campaignId);
    if (idx !== -1) {
      campaigns[idx] = {
        ...campaigns[idx],
        ...tracking,
      };
      return campaigns[idx];
    }
    return undefined;
  },

  updateOutletTracking: (
    outletSlug: string,
    tracking: { defaultMetaPixelId?: string; defaultGoogleAdsId?: string }
  ): Outlet | undefined => {
    const outlets = globalThis.__PNR_OUTLETS__ || [];
    const idx = outlets.findIndex((o) => o.slug === outletSlug);
    if (idx !== -1) {
      outlets[idx] = {
        ...outlets[idx],
        ...tracking,
      };
      return outlets[idx];
    }
    return undefined;
  },

  getMenuItems: (outletSlug?: string): MenuItem[] => {
    if (!outletSlug) return MENU_ITEMS;
    return MENU_ITEMS.filter((item) => item.availableOutlets.includes(outletSlug));
  },
};
