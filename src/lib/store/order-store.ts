import {
  Order,
  Outlet,
  Campaign,
  MenuItem,
  Employee,
  OutletStockItem,
  CampaignAnalytics,
  OutletAnalytics,
  PaymentGatewayConfig,
  CreateProductDTO,
  UpdateProductDTO,
  Category,
  SubCategory,
} from '@/types';
import { OUTLETS, CAMPAIGNS, MENU_ITEMS, INITIAL_ORDERS } from '@/lib/data/mock-data';
import { dispatchToMangwale } from '@/lib/logistics/mangwale';
import { sendMetaCAPI } from '@/lib/tracking/pixel-tracker';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-puffs',
    name: 'Puffs & Patties',
    slug: 'puffs-and-patties',
    description: 'Flaky artisanal layered bakery puffs and spiced potato patties',
    subCategories: [
      { id: 'sub-veg-puff', categoryId: 'cat-puffs', name: 'Veg Puffs', slug: 'veg-puffs' },
      { id: 'sub-paneer-puff', categoryId: 'cat-puffs', name: 'Paneer Puffs', slug: 'paneer-puffs' },
      { id: 'sub-cheese-puff', categoryId: 'cat-puffs', name: 'Cheese & Corn', slug: 'cheese-and-corn' },
      { id: 'sub-egg-puff', categoryId: 'cat-puffs', name: 'Egg & Non-Veg', slug: 'egg-and-non-veg' },
    ],
  },
  {
    id: 'cat-rolls',
    name: 'Savory Rolls',
    slug: 'savory-rolls',
    description: 'Fresh grilled rolls, kathi wraps, and flaky savory frankies',
    subCategories: [
      { id: 'sub-kathi-roll', categoryId: 'cat-rolls', name: 'Kathi Rolls', slug: 'kathi-rolls' },
      { id: 'sub-paneer-roll', categoryId: 'cat-rolls', name: 'Paneer Tikka Rolls', slug: 'paneer-tikka-rolls' },
      { id: 'sub-spring-roll', categoryId: 'cat-rolls', name: 'Spring Rolls', slug: 'spring-rolls' },
    ],
  },
  {
    id: 'cat-cakes',
    name: 'Cakes & Pastries',
    slug: 'cakes-and-pastries',
    description: 'Decadent Belgian chocolate truffles, red velvet, and tea cakes',
    subCategories: [
      { id: 'sub-pastry-slice', categoryId: 'cat-cakes', name: 'Pastry Slices', slug: 'pastry-slices' },
      { id: 'sub-celebration-cake', categoryId: 'cat-cakes', name: 'Celebration Cakes', slug: 'celebration-cakes' },
      { id: 'sub-brownies', categoryId: 'cat-cakes', name: 'Brownies & Teacakes', slug: 'brownies-and-teacakes' },
    ],
  },
  {
    id: 'cat-combos',
    name: 'Snack Combos',
    slug: 'snack-combos',
    description: 'Value tea-time pairings and office snack boxes',
    subCategories: [
      { id: 'sub-chai-combo', categoryId: 'cat-combos', name: 'Chai & Puff Combos', slug: 'chai-and-puff-combos' },
      { id: 'sub-party-packs', categoryId: 'cat-combos', name: 'Party Packs', slug: 'party-packs' },
    ],
  },
  {
    id: 'cat-breads',
    name: 'Breads & Buns',
    slug: 'breads-and-buns',
    description: 'Freshly baked sourdough, soft pav, and multigrain loaves',
    subCategories: [
      { id: 'sub-artisan-bread', categoryId: 'cat-breads', name: 'Artisanal Loaves', slug: 'artisanal-loaves' },
      { id: 'sub-buns-pav', categoryId: 'cat-breads', name: 'Burger Buns & Pav', slug: 'burger-buns-and-pav' },
      { id: 'sub-garlic-bread', categoryId: 'cat-breads', name: 'Garlic Breads', slug: 'garlic-breads' },
    ],
  },
  {
    id: 'cat-beverages',
    name: 'Beverages',
    slug: 'beverages',
    description: 'Hot cutting chai, iced teas, and thick cold coffees',
    subCategories: [
      { id: 'sub-hot-chai', categoryId: 'cat-beverages', name: 'Special Chai', slug: 'special-chai' },
      { id: 'sub-cold-brews', categoryId: 'cat-beverages', name: 'Cold Brews & Shakes', slug: 'cold-brews-and-shakes' },
    ],
  },
];

// In-Memory store across requests for Next.js dev/prod server
declare global {
  // eslint-disable-next-line no-var
  var __PNR_ORDERS__: Order[] | undefined;
  // eslint-disable-next-line no-var
  var __PNR_CAMPAIGNS__: Campaign[] | undefined;
  // eslint-disable-next-line no-var
  var __PNR_OUTLETS__: Outlet[] | undefined;
  // eslint-disable-next-line no-var
  var __PNR_EMPLOYEES__: Employee[] | undefined;
  // eslint-disable-next-line no-var
  var __PNR_OUTLET_STOCK__: OutletStockItem[] | undefined;
  // eslint-disable-next-line no-var
  var __PNR_MARKETING_TAGS__: Record<string, unknown> | undefined;
  // eslint-disable-next-line no-var
  var __PNR_PAYMENT_CONFIG__: PaymentGatewayConfig | undefined;
  // eslint-disable-next-line no-var
  var __PNR_MASTER_PRODUCTS__: MenuItem[] | undefined;
  // eslint-disable-next-line no-var
  var __PNR_CATEGORIES__: Category[] | undefined;
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
if (!globalThis.__PNR_MASTER_PRODUCTS__) {
  globalThis.__PNR_MASTER_PRODUCTS__ = [...MENU_ITEMS];
}
if (!globalThis.__PNR_CATEGORIES__) {
  globalThis.__PNR_CATEGORIES__ = [...DEFAULT_CATEGORIES];
}

// Initial Employees Hierarchical Seed
if (!globalThis.__PNR_EMPLOYEES__) {
  globalThis.__PNR_EMPLOYEES__ = [
    {
      id: 'emp-1',
      name: 'Aditi Sharma',
      email: 'admin@puffsnrolls.com',
      phone: '+91 94236 39911',
      role: 'SUPER_ADMIN',
      outletSlug: 'all',
      designation: 'HQ Brand Director & Operations Head',
      status: 'ACTIVE',
      lastLogin: '2026-10-29T16:00:00Z',
      createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'emp-2',
      name: 'Vikram Joshi',
      email: 'marketing@puffsnrolls.com',
      phone: '+91 98220 77881',
      role: 'SUPER_ADMIN', // Performance Marketer with full campaign/tag access
      outletSlug: 'all',
      designation: 'Lead Performance Marketer (Meta & Google Ads)',
      status: 'ACTIVE',
      lastLogin: '2026-10-29T15:45:00Z',
      createdAt: '2026-02-01T10:00:00Z',
    },
    {
      id: 'emp-3',
      name: 'Suhas Deshmukh',
      email: 'collegeroad@puffsnrolls.com',
      phone: '+91 98220 11234',
      role: 'OUTLET_MANAGER',
      outletSlug: 'college-road',
      designation: 'Outlet Store Manager (College Road)',
      status: 'ACTIVE',
      lastLogin: '2026-10-29T16:15:00Z',
      createdAt: '2026-01-20T10:00:00Z',
    },
    {
      id: 'emp-4',
      name: 'Nikhil Kulkarni',
      email: 'nashikroad@puffsnrolls.com',
      phone: '+91 98220 55678',
      role: 'OUTLET_MANAGER',
      outletSlug: 'nashik-road',
      designation: 'Outlet Store Manager (Nashik Road)',
      status: 'ACTIVE',
      lastLogin: '2026-10-29T14:30:00Z',
      createdAt: '2026-01-20T10:00:00Z',
    },
    {
      id: 'emp-5',
      name: 'Pooja Shinde',
      email: 'indiranagar@puffsnrolls.com',
      phone: '+91 98220 99012',
      role: 'OUTLET_MANAGER',
      outletSlug: 'indira-nagar',
      designation: 'Outlet Store Manager (Indira Nagar)',
      status: 'ACTIVE',
      lastLogin: '2026-10-29T13:10:00Z',
      createdAt: '2026-01-22T10:00:00Z',
    },
    {
      id: 'emp-6',
      name: 'Ramesh Pawar',
      email: 'kitchen.cr@puffsnrolls.com',
      phone: '+91 98221 33445',
      role: 'KITCHEN_STAFF',
      outletSlug: 'college-road',
      designation: 'Head Baker & Kitchen Lead',
      status: 'ACTIVE',
      createdAt: '2026-02-10T10:00:00Z',
    },
  ];
}

// Initial Outlet Stock Inventory Matrix (Per-outlet availability & quantities)
if (!globalThis.__PNR_OUTLET_STOCK__) {
  const stockSeed: OutletStockItem[] = [];
  OUTLETS.forEach((outlet) => {
    MENU_ITEMS.forEach((item) => {
      stockSeed.push({
        itemId: item.id,
        name: item.name,
        category: item.category,
        basePrice: item.price,
        outletSlug: outlet.slug,
        isAvailable: true,
        stockQuantity: item.category === 'Cakes & Pastries' ? 8 : 35,
        lowStockThreshold: 5,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'System Auto-Seed',
      });
    });
  });
  globalThis.__PNR_OUTLET_STOCK__ = stockSeed;
}

if (!globalThis.__PNR_MARKETING_TAGS__) {
  globalThis.__PNR_MARKETING_TAGS__ = {
    globalMetaPixelId: '999888777666555',
    globalGoogleAdsId: 'AW-987654300',
    globalGtmId: 'GTM-PNR2026',
    tiktokPixelId: '',
    snapchatPixelId: '',
    metaCapiEnabled: true,
    customHeaderScript: '<!-- P&R Analytics Tracking Engine Active -->',
  };
}

if (!globalThis.__PNR_PAYMENT_CONFIG__) {
  const isLiveEnv = process.env.RAZORPAY_ENV === 'live';
  const testKeyId =
    process.env.RAZORPAY_TEST_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID ||
    'rzp_test_pnr_demo';
  const testKeySecret =
    process.env.RAZORPAY_TEST_KEY_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    'rzp_sec_demo_secret_key';
  const testWebhookSecret =
    process.env.RAZORPAY_TEST_WEBHOOK_SECRET ||
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    'rzp_whsec_demo';

  const liveKeyId = process.env.RAZORPAY_LIVE_KEY_ID || '';
  const liveKeySecret = process.env.RAZORPAY_LIVE_KEY_SECRET || '';
  const liveWebhookSecret = process.env.RAZORPAY_LIVE_WEBHOOK_SECRET || '';

  const activeTestMode = !isLiveEnv;

  globalThis.__PNR_PAYMENT_CONFIG__ = {
    testMode: activeTestMode,
    isEnabled: true,
    businessName: "Puffs 'n' Rolls Nashik",
    testKeyId,
    testKeySecret,
    testWebhookSecret,
    liveKeyId,
    liveKeySecret,
    liveWebhookSecret,
    razorpayKeyId: activeTestMode ? testKeyId : (liveKeyId || testKeyId),
    razorpayKeySecret: activeTestMode ? testKeySecret : (liveKeySecret || testKeySecret),
    razorpayWebhookSecret: activeTestMode ? testWebhookSecret : (liveWebhookSecret || testWebhookSecret),
  };
}

export const orderStore = {
  // Orders
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

  createOrder: async (
    orderData: Omit<
      Order,
      'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'mangwale' | 'orderStatus' | 'paymentStatus'
    > & {
      paymentStatus?: Order['paymentStatus'];
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    }
  ): Promise<Order> => {
    const outlet = orderStore.getOutletBySlug(orderData.outletSlug);
    if (!outlet) {
      throw new Error(`Outlet not found: ${orderData.outletSlug}`);
    }

    if (!outlet.isOpen) {
      throw new Error(`Orders are currently paused for ${outlet.name}. Please select another outlet.`);
    }

    // Validate stock and availability before order acceptance
    const stockList = globalThis.__PNR_OUTLET_STOCK__ || [];
    for (const item of orderData.items) {
      const stock = stockList.find(
        (s) => s.outletSlug === orderData.outletSlug && s.itemId === item.itemId
      );
      if (stock && (!stock.isAvailable || stock.stockQuantity < item.quantity)) {
        throw new Error(
          `"${item.name}" is currently sold out at ${outlet.name}. Please remove it to proceed.`
        );
      }
    }

    const orderNumber = `PNR-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      orderStatus: 'RECEIVED',
      paymentStatus:
        orderData.paymentStatus ||
        (orderData.paymentMethod === 'COD' ? 'COD_CONFIRMED' : 'COMPLETED'),
      mangwale: {
        status: 'PENDING',
        notes: 'Dispatch initiated to logistics fleet',
      },
      razorpayOrderId: orderData.razorpayOrderId,
      razorpayPaymentId: orderData.razorpayPaymentId,
      razorpaySignature: orderData.razorpaySignature,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Decrement stock in this outlet's inventory
    orderData.items.forEach((item) => {
      orderStore.decrementStock(orderData.outletSlug, item.itemId, item.quantity);
    });

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
      console.error('Logistics auto-dispatch failure:', err);
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
    const index = orders.findIndex(
      (o) => o.mangwale?.taskId === taskId || o.id === taskId || o.orderNumber === taskId
    );
    if (index !== -1) {
      const current = orders[index];
      orders[index] = {
        ...current,
        mangwale: {
          ...(current.mangwale || { status: 'PENDING' }),
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
    return (globalThis.__PNR_OUTLETS__ || []).find((o) => o.slug === slug || o.id === slug);
  },

  createOutlet: (data: Omit<Outlet, 'id'>): Outlet => {
    const newOutlet: Outlet = {
      ...data,
      id: `out-${Date.now()}`,
    };
    if (!globalThis.__PNR_OUTLETS__) {
      globalThis.__PNR_OUTLETS__ = [];
    }
    globalThis.__PNR_OUTLETS__.push(newOutlet);

    // Seed stock inventory for this new outlet
    if (globalThis.__PNR_OUTLET_STOCK__) {
      MENU_ITEMS.forEach((item) => {
        globalThis.__PNR_OUTLET_STOCK__?.push({
          itemId: item.id,
          name: item.name,
          category: item.category,
          basePrice: item.price,
          outletSlug: newOutlet.slug,
          isAvailable: true,
          stockQuantity: item.category === 'Cakes & Pastries' ? 8 : 35,
          lowStockThreshold: 5,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'System Auto-Seed',
        });
      });
    }

    return newOutlet;
  },

  updateOutlet: (idOrSlug: string, updates: Partial<Outlet>): Outlet | undefined => {
    const outlets = globalThis.__PNR_OUTLETS__ || [];
    const idx = outlets.findIndex((o) => o.slug === idOrSlug || o.id === idOrSlug);
    if (idx !== -1) {
      outlets[idx] = {
        ...outlets[idx],
        ...updates,
      };
      return outlets[idx];
    }
    return undefined;
  },

  deleteOutlet: (idOrSlug: string): boolean => {
    const outlets = globalThis.__PNR_OUTLETS__ || [];
    const initialLen = outlets.length;
    globalThis.__PNR_OUTLETS__ = outlets.filter((o) => o.slug !== idOrSlug && o.id !== idOrSlug);
    return (globalThis.__PNR_OUTLETS__ || []).length < initialLen;
  },

  toggleOutletOpenStatus: (slug: string, isOpen: boolean): Outlet | undefined => {
    const outlets = globalThis.__PNR_OUTLETS__ || [];
    const idx = outlets.findIndex((o) => o.slug === slug);
    if (idx !== -1) {
      outlets[idx] = { ...outlets[idx], isOpen };
      return outlets[idx];
    }
    return undefined;
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

  createCampaign: (campaign: Omit<Campaign, 'id'>): Campaign => {
    const newCamp: Campaign = {
      ...campaign,
      id: `camp-${Date.now()}`,
    };
    globalThis.__PNR_CAMPAIGNS__?.push(newCamp);
    return newCamp;
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

  // Marketing Tags Manager
  getMarketingTags: () => {
    return globalThis.__PNR_MARKETING_TAGS__ || {};
  },

  updateMarketingTags: (tags: Record<string, unknown>) => {
    globalThis.__PNR_MARKETING_TAGS__ = {
      ...globalThis.__PNR_MARKETING_TAGS__,
      ...tags,
    };
    return globalThis.__PNR_MARKETING_TAGS__;
  },

  // Payment Gateway (Razorpay) Configuration & Status
  getPaymentConfig: (): PaymentGatewayConfig => {
    if (!globalThis.__PNR_PAYMENT_CONFIG__) {
      const isLiveEnv = process.env.RAZORPAY_ENV === 'live';
      const testKeyId =
        process.env.RAZORPAY_TEST_KEY_ID ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        process.env.RAZORPAY_KEY_ID ||
        'rzp_test_Tu2yDSDcMLoCMU';
      const testKeySecret =
        process.env.RAZORPAY_TEST_KEY_SECRET ||
        process.env.RAZORPAY_KEY_SECRET ||
        'a4RYbgtPLsopH0QZ2aSHAdNd';
      const testWebhookSecret =
        process.env.RAZORPAY_TEST_WEBHOOK_SECRET ||
        process.env.RAZORPAY_WEBHOOK_SECRET ||
        'rzp_whsec_demo';

      const liveKeyId = process.env.RAZORPAY_LIVE_KEY_ID || '';
      const liveKeySecret = process.env.RAZORPAY_LIVE_KEY_SECRET || '';
      const liveWebhookSecret = process.env.RAZORPAY_LIVE_WEBHOOK_SECRET || '';

      const activeTestMode = !isLiveEnv;

      globalThis.__PNR_PAYMENT_CONFIG__ = {
        testMode: activeTestMode,
        isEnabled: true,
        businessName: "Puffs 'n' Rolls Nashik",
        testKeyId,
        testKeySecret,
        testWebhookSecret,
        liveKeyId,
        liveKeySecret,
        liveWebhookSecret,
        razorpayKeyId: activeTestMode ? testKeyId : (liveKeyId || testKeyId),
        razorpayKeySecret: activeTestMode ? testKeySecret : (liveKeySecret || testKeySecret),
        razorpayWebhookSecret: activeTestMode ? testWebhookSecret : (liveWebhookSecret || testWebhookSecret),
      };
    }
    return globalThis.__PNR_PAYMENT_CONFIG__;
  },

  updatePaymentConfig: (config: Partial<PaymentGatewayConfig>): PaymentGatewayConfig => {
    const current = orderStore.getPaymentConfig();
    const merged = {
      ...current,
      ...config,
    };

    // If testMode is toggled, sync active credentials
    if (config.testMode !== undefined) {
      if (config.testMode) {
        merged.razorpayKeyId = merged.testKeyId || merged.razorpayKeyId;
        merged.razorpayKeySecret = merged.testKeySecret || merged.razorpayKeySecret;
        merged.razorpayWebhookSecret = merged.testWebhookSecret || merged.razorpayWebhookSecret;
      } else {
        merged.razorpayKeyId = merged.liveKeyId || merged.razorpayKeyId;
        merged.razorpayKeySecret = merged.liveKeySecret || merged.razorpayKeySecret;
        merged.razorpayWebhookSecret = merged.liveWebhookSecret || merged.razorpayWebhookSecret;
      }
    }

    globalThis.__PNR_PAYMENT_CONFIG__ = merged;
    return globalThis.__PNR_PAYMENT_CONFIG__;
  },

  updatePaymentStatus: (
    orderId: string,
    status: Order['paymentStatus'],
    paymentId?: string
  ): Order | undefined => {
    const orders = globalThis.__PNR_ORDERS__ || [];
    const index = orders.findIndex(
      (o) => o.id === orderId || o.orderNumber === orderId || o.razorpayOrderId === orderId
    );
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        paymentStatus: status,
        razorpayPaymentId: paymentId || orders[index].razorpayPaymentId,
        updatedAt: new Date().toISOString(),
      };
      return orders[index];
    }
    return undefined;
  },

  // Centralized Master Product Catalog
  getMasterProducts: (options?: {
    category?: string;
    search?: string;
    outletSlug?: string;
    isVeg?: boolean;
  }): MenuItem[] => {
    let list = (globalThis.__PNR_MASTER_PRODUCTS__ || MENU_ITEMS).filter(
      (item) => !item.isArchived
    );

    if (options?.category && options.category !== 'ALL') {
      list = list.filter((item) => item.category === options.category);
    }

    if (options?.isVeg !== undefined) {
      list = list.filter((item) => item.isVeg === options.isVeg);
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    if (options?.outletSlug) {
      list = list.filter((item) =>
        item.availableOutlets.includes(options.outletSlug!)
      );
    }

    return list;
  },

  getMasterProductById: (id: string): MenuItem | undefined => {
    return (globalThis.__PNR_MASTER_PRODUCTS__ || MENU_ITEMS).find(
      (item) => item.id === id && !item.isArchived
    );
  },

  createMasterProduct: (productData: CreateProductDTO): MenuItem => {
    const list = globalThis.__PNR_MASTER_PRODUCTS__ || [...MENU_ITEMS];
    const outlets = globalThis.__PNR_OUTLETS__ || OUTLETS;

    let targetOutlets = productData.availableOutlets || [];
    if (targetOutlets.includes('all') || targetOutlets.length === 0) {
      targetOutlets = outlets.map((o) => o.slug);
    }

    const newProduct: MenuItem = {
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: productData.name.trim(),
      description: productData.description.trim(),
      category: productData.category,
      subCategory: productData.subCategory,
      subCategoryId: productData.subCategoryId,
      price: Number(productData.price),
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : undefined,
      image:
        productData.image ||
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
      isVeg: productData.isVeg !== undefined ? productData.isVeg : true,
      isBestseller: Boolean(productData.isBestseller),
      isSpicy: Boolean(productData.isSpicy),
      preparationTimeMinutes: productData.preparationTimeMinutes || 15,
      availableOutlets: targetOutlets,
      isAvailable: true,
      stockQuantity: productData.initialStock || 25,
      isArchived: false,
    };

    list.unshift(newProduct);
    globalThis.__PNR_MASTER_PRODUCTS__ = list;

    // Provision stock items for assigned outlets
    if (!globalThis.__PNR_OUTLET_STOCK__) {
      globalThis.__PNR_OUTLET_STOCK__ = [];
    }

    targetOutlets.forEach((outletSlug) => {
      const existingStock = globalThis.__PNR_OUTLET_STOCK__?.find(
        (s) => s.outletSlug === outletSlug && s.itemId === newProduct.id
      );
      if (!existingStock) {
        globalThis.__PNR_OUTLET_STOCK__?.push({
          itemId: newProduct.id,
          name: newProduct.name,
          category: newProduct.category,
          basePrice: newProduct.price,
          outletSlug,
          isAvailable: true,
          stockQuantity: productData.initialStock || 25,
          lowStockThreshold: 5,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'Central Catalog Creation',
        });
      }
    });

    return newProduct;
  },

  updateMasterProduct: (
    id: string,
    updates: UpdateProductDTO
  ): MenuItem | undefined => {
    const list = globalThis.__PNR_MASTER_PRODUCTS__ || [];
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) return undefined;

    const current = list[idx];
    const updated: MenuItem = {
      ...current,
      ...updates,
      subCategory: updates.subCategory !== undefined ? updates.subCategory : current.subCategory,
      subCategoryId: updates.subCategoryId !== undefined ? updates.subCategoryId : current.subCategoryId,
      price: updates.price !== undefined ? Number(updates.price) : current.price,
      originalPrice:
        updates.originalPrice !== undefined
          ? Number(updates.originalPrice)
          : current.originalPrice,
    };
    list[idx] = updated;

    // Sync changes to outlet stock matrix
    const stockList = globalThis.__PNR_OUTLET_STOCK__ || [];
    stockList.forEach((stock) => {
      if (stock.itemId === id) {
        if (updates.name) stock.name = updates.name;
        if (updates.price !== undefined) stock.basePrice = Number(updates.price);
        if (updates.category) stock.category = updates.category;
      }
    });

    // If available outlets changed, reconcile stock
    if (updates.availableOutlets) {
      const outlets = globalThis.__PNR_OUTLETS__ || OUTLETS;
      let targetOutlets = updates.availableOutlets;
      if (targetOutlets.includes('all')) {
        targetOutlets = outlets.map((o) => o.slug);
      }

      targetOutlets.forEach((slug) => {
        const found = stockList.find(
          (s) => s.outletSlug === slug && s.itemId === id
        );
        if (!found) {
          stockList.push({
            itemId: updated.id,
            name: updated.name,
            category: updated.category,
            basePrice: updated.price,
            outletSlug: slug,
            isAvailable: true,
            stockQuantity: 20,
            lowStockThreshold: 5,
            lastUpdated: new Date().toISOString(),
            updatedBy: 'Catalog Sync',
          });
        } else {
          found.isAvailable = true;
        }
      });
    }

    return updated;
  },

  deleteMasterProduct: (id: string): boolean => {
    const list = globalThis.__PNR_MASTER_PRODUCTS__ || [];
    const idx = list.findIndex((item) => item.id === id);
    if (idx !== -1) {
      list[idx].isArchived = true;
      list[idx].availableOutlets = [];

      // Deactivate from all outlet stock
      const stockList = globalThis.__PNR_OUTLET_STOCK__ || [];
      stockList.forEach((s) => {
        if (s.itemId === id) {
          s.isAvailable = false;
          s.stockQuantity = 0;
        }
      });

      return true;
    }
    return false;
  },

  // 1-Tap Toggle Product Availability for an Outlet
  toggleProductOutletAvailability: (
    outletSlug: string,
    itemId: string,
    isAvailableForOutlet: boolean
  ): { product?: MenuItem; stockItem?: OutletStockItem } => {
    const products = globalThis.__PNR_MASTER_PRODUCTS__ || MENU_ITEMS;
    const product = products.find((p) => p.id === itemId);
    if (!product) return {};

    const stockList = globalThis.__PNR_OUTLET_STOCK__ || [];
    let stockItem = stockList.find(
      (s) => s.outletSlug === outletSlug && s.itemId === itemId
    );

    if (isAvailableForOutlet) {
      // Add outlet to availableOutlets if not already present
      if (!product.availableOutlets.includes(outletSlug)) {
        product.availableOutlets.push(outletSlug);
      }

      // Provision or reactivate stock
      if (!stockItem) {
        stockItem = {
          itemId: product.id,
          name: product.name,
          category: product.category,
          basePrice: product.price,
          outletSlug,
          isAvailable: true,
          stockQuantity: 15,
          lowStockThreshold: 5,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'Outlet Selection',
        };
        stockList.push(stockItem);
      } else {
        stockItem.isAvailable = true;
        if (stockItem.stockQuantity === 0) {
          stockItem.stockQuantity = 15;
        }
        stockItem.lastUpdated = new Date().toISOString();
        stockItem.updatedBy = 'Outlet Manager Activated';
      }
    } else {
      // Remove outlet from product's availableOutlets
      product.availableOutlets = product.availableOutlets.filter(
        (slug) => slug !== outletSlug
      );

      // Deactivate in outlet stock
      if (stockItem) {
        stockItem.isAvailable = false;
        stockItem.stockQuantity = 0;
        stockItem.lastUpdated = new Date().toISOString();
        stockItem.updatedBy = 'Outlet Manager Removed';
      }
    }

    return { product, stockItem };
  },

  // Bulk Assign Products to Outlet
  bulkAssignProductsToOutlet: (
    outletSlug: string,
    selectedItemIds: string[]
  ): OutletStockItem[] => {
    const products = globalThis.__PNR_MASTER_PRODUCTS__ || MENU_ITEMS;
    const stockList = globalThis.__PNR_OUTLET_STOCK__ || [];
    const selectedSet = new Set(selectedItemIds);

    products.forEach((product) => {
      const isSelected = selectedSet.has(product.id);
      let stockItem = stockList.find(
        (s) => s.outletSlug === outletSlug && s.itemId === product.id
      );

      if (isSelected) {
        if (!product.availableOutlets.includes(outletSlug)) {
          product.availableOutlets.push(outletSlug);
        }

        if (!stockItem) {
          stockItem = {
            itemId: product.id,
            name: product.name,
            category: product.category,
            basePrice: product.price,
            outletSlug,
            isAvailable: true,
            stockQuantity: 15,
            lowStockThreshold: 5,
            lastUpdated: new Date().toISOString(),
            updatedBy: 'Bulk Outlet Sync',
          };
          stockList.push(stockItem);
        } else {
          stockItem.isAvailable = true;
          if (stockItem.stockQuantity === 0) {
            stockItem.stockQuantity = 15;
          }
          stockItem.lastUpdated = new Date().toISOString();
        }
      } else {
        product.availableOutlets = product.availableOutlets.filter(
          (slug) => slug !== outletSlug
        );
        if (stockItem) {
          stockItem.isAvailable = false;
          stockItem.stockQuantity = 0;
          stockItem.lastUpdated = new Date().toISOString();
        }
      }
    });

    return orderStore.getOutletStock(outletSlug);
  },

  // Menu items filtered by outlet and stock availability (reads from master catalog)
  getMenuItems: (outletSlug?: string): MenuItem[] => {
    const master = (globalThis.__PNR_MASTER_PRODUCTS__ || MENU_ITEMS).filter(
      (p) => !p.isArchived
    );
    if (!outletSlug) return master;

    // Look up this outlet's stock items
    const stockMap = new Map<string, OutletStockItem>();
    (globalThis.__PNR_OUTLET_STOCK__ || [])
      .filter((s) => s.outletSlug === outletSlug)
      .forEach((s) => stockMap.set(s.itemId, s));

    return master
      .filter((item) => item.availableOutlets.includes(outletSlug))
      .map((item) => {
        const stock = stockMap.get(item.id);
        return {
          ...item,
          price: stock?.customPrice || item.price,
          isAvailable: stock !== undefined ? stock.isAvailable : true,
          stockQuantity: stock !== undefined ? stock.stockQuantity : 15,
        };
      });
  },

  // Outlet Stock Management (For Store Managers) - strictly scoped to assigned products
  getOutletStock: (outletSlug: string): OutletStockItem[] => {
    const products = globalThis.__PNR_MASTER_PRODUCTS__ || MENU_ITEMS;
    const assignedItemIds = new Set(
      products
        .filter((p) => !p.isArchived && p.availableOutlets.includes(outletSlug))
        .map((p) => p.id)
    );

    return (globalThis.__PNR_OUTLET_STOCK__ || []).filter(
      (s) => s.outletSlug === outletSlug && assignedItemIds.has(s.itemId)
    );
  },

  updateOutletStockItem: (
    outletSlug: string,
    itemId: string,
    updates: { isAvailable?: boolean; stockQuantity?: number; customPrice?: number; updatedBy?: string }
  ): OutletStockItem | undefined => {
    const list = globalThis.__PNR_OUTLET_STOCK__ || [];
    const idx = list.findIndex(
      (s) => s.outletSlug === outletSlug && s.itemId === itemId
    );
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        ...updates,
        lastUpdated: new Date().toISOString(),
        updatedBy: updates.updatedBy || 'Outlet Manager',
      };
      return list[idx];
    }
    return undefined;
  },

  decrementStock: (outletSlug: string, itemId: string, quantity: number) => {
    const list = globalThis.__PNR_OUTLET_STOCK__ || [];
    const idx = list.findIndex(
      (s) => s.outletSlug === outletSlug && s.itemId === itemId
    );
    if (idx !== -1) {
      const newQty = Math.max(0, list[idx].stockQuantity - quantity);
      list[idx].stockQuantity = newQty;
      if (newQty === 0) {
        list[idx].isAvailable = false;
      }
    }
  },

  // Employee & Hierarchical Role Management
  getEmployees: (outletSlug?: string): Employee[] => {
    const employees = globalThis.__PNR_EMPLOYEES__ || [];
    if (!outletSlug || outletSlug === 'all') return employees;
    return employees.filter(
      (e) => e.outletSlug === outletSlug || e.outletSlug === 'all'
    );
  },

  createEmployee: (data: Omit<Employee, 'id' | 'createdAt'>): Employee => {
    const newEmp: Employee = {
      ...data,
      id: `emp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    globalThis.__PNR_EMPLOYEES__?.push(newEmp);
    return newEmp;
  },

  updateEmployee: (id: string, updates: Partial<Employee>): Employee | undefined => {
    const list = globalThis.__PNR_EMPLOYEES__ || [];
    const idx = list.findIndex((e) => e.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      return list[idx];
    }
    return undefined;
  },

  deleteEmployee: (id: string): boolean => {
    const list = globalThis.__PNR_EMPLOYEES__ || [];
    const initialLen = list.length;
    globalThis.__PNR_EMPLOYEES__ = list.filter((e) => e.id !== id);
    return globalThis.__PNR_EMPLOYEES__.length < initialLen;
  },

  // Analytics Engine
  getCampaignAnalytics: (): CampaignAnalytics[] => {
    const campaigns = globalThis.__PNR_CAMPAIGNS__ || [];
    const orders = globalThis.__PNR_ORDERS__ || [];

    return campaigns.map((camp) => {
      const campOrders = orders.filter((o) => o.campaignSlug === camp.slug);
      const ordersPlaced = campOrders.length;
      const grossRevenue = campOrders.reduce((acc, o) => acc + o.total, 0);

      // Simulated marketing funnel metrics based on real orders
      const clicks = ordersPlaced > 0 ? ordersPlaced * 18 : 120;
      const impressions = clicks * 14;
      const ctr = parseFloat(((clicks / impressions) * 100).toFixed(2));
      const conversionRate = parseFloat(
        ((ordersPlaced / clicks) * 100).toFixed(1)
      );

      return {
        campaignSlug: camp.slug,
        title: camp.title,
        outletSlug: camp.outletSlug,
        impressions,
        clicks,
        ctr,
        ordersPlaced,
        conversionRate,
        grossRevenue,
        metaPixelId: camp.metaPixelId,
      };
    });
  },

  getOutletAnalytics: (outletSlug?: string): OutletAnalytics[] => {
    const outlets = outletSlug
      ? (globalThis.__PNR_OUTLETS__ || []).filter((o) => o.slug === outletSlug)
      : globalThis.__PNR_OUTLETS__ || [];
    const allOrders = globalThis.__PNR_ORDERS__ || [];

    return outlets.map((outlet) => {
      const outletOrders = allOrders.filter((o) => o.outletSlug === outlet.slug);
      const totalRevenue = outletOrders.reduce((sum, o) => sum + o.total, 0);
      const totalOrders = outletOrders.length;
      const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      const activeDeliveryCount = outletOrders.filter(
        (o) => o.orderStatus === 'OUT_FOR_DELIVERY' || o.orderStatus === 'PREPARING'
      ).length;

      // Item sales breakdown
      const itemCounts = new Map<string, { quantity: number; revenue: number }>();
      outletOrders.forEach((o) => {
        o.items.forEach((it) => {
          const current = itemCounts.get(it.name) || { quantity: 0, revenue: 0 };
          itemCounts.set(it.name, {
            quantity: current.quantity + it.quantity,
            revenue: current.revenue + it.total,
          });
        });
      });

      const topSellingItems = Array.from(itemCounts.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      const hourlyTrend = [
        { hour: '11:00 AM', orders: 2, revenue: 380 },
        { hour: '1:00 PM', orders: 5, revenue: 1150 },
        { hour: '4:00 PM', orders: 4, revenue: 840 },
        { hour: '6:00 PM', orders: 8, revenue: 1890 },
        { hour: '8:00 PM', orders: 6, revenue: 1420 },
      ];

      return {
        outletSlug: outlet.slug,
        outletName: outlet.name,
        totalRevenue,
        totalOrders,
        averageOrderValue,
        activeDeliveryCount,
        topSellingItems,
        hourlyTrend,
      };
    });
  },

  // Category & Sub-Category Management Engine
  getCategories: (): Category[] => {
    return globalThis.__PNR_CATEGORIES__ || DEFAULT_CATEGORIES;
  },

  createCategory: (data: { name: string; description?: string }): Category => {
    const categories = globalThis.__PNR_CATEGORIES__ || [...DEFAULT_CATEGORIES];
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCategory: Category = {
      id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: data.name.trim(),
      slug: slug || `cat-${Date.now()}`,
      description: data.description?.trim() || '',
      subCategories: [],
    };
    categories.push(newCategory);
    globalThis.__PNR_CATEGORIES__ = categories;
    return newCategory;
  },

  deleteCategory: (idOrSlug: string): boolean => {
    const categories = globalThis.__PNR_CATEGORIES__ || [];
    const target = categories.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
    if (!target) return false;

    globalThis.__PNR_CATEGORIES__ = categories.filter((c) => c.id !== target.id);
    return true;
  },

  createSubCategory: (categoryId: string, data: { name: string; description?: string }): SubCategory | null => {
    const categories = globalThis.__PNR_CATEGORIES__ || [];
    const cat = categories.find((c) => c.id === categoryId || c.slug === categoryId);
    if (!cat) return null;

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newSub: SubCategory = {
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      categoryId: cat.id,
      name: data.name.trim(),
      slug: slug || `sub-${Date.now()}`,
      description: data.description?.trim() || '',
    };
    if (!cat.subCategories) cat.subCategories = [];
    cat.subCategories.push(newSub);
    return newSub;
  },

  deleteSubCategory: (categoryId: string, subCategoryId: string): boolean => {
    const categories = globalThis.__PNR_CATEGORIES__ || [];
    const cat = categories.find((c) => c.id === categoryId || c.slug === categoryId);
    if (!cat || !cat.subCategories) return false;

    const initialLen = cat.subCategories.length;
    cat.subCategories = cat.subCategories.filter((s) => s.id !== subCategoryId && s.slug !== subCategoryId);
    return cat.subCategories.length < initialLen;
  },
};
