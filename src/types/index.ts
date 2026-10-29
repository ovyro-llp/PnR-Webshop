export type EmployeeRole = 'SUPER_ADMIN' | 'OUTLET_MANAGER' | 'KITCHEN_STAFF';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  outletSlug: string; // 'all' for SUPER_ADMIN or specific outlet slug like 'college-road'
  designation: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string;
  createdAt: string;
}

export interface OutletStockItem {
  itemId: string;
  name: string;
  category: string;
  basePrice: number;
  outletSlug: string;
  isAvailable: boolean; // 1-tap toggle for managers
  stockQuantity: number; // 0 for sold out
  lowStockThreshold: number;
  customPrice?: number;
  lastUpdated: string;
  updatedBy: string;
}

export interface Outlet {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  address: string;
  area: string;
  city: string;
  pincode: string;
  phone: string;
  email: string;
  googleMapsUrl?: string;
  openingHours: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  minOrderAmount: number;
  deliveryTimeEstimate: string;
  defaultMetaPixelId?: string;
  defaultGoogleAdsId?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Campaign {
  id: string;
  slug: string;
  outletSlug: string; // Target outlet or 'all'
  title: string;
  headline: string;
  subheadline: string;
  badge: string;
  offerCode: string;
  discountPercentage: number;
  minOrderValue: number;
  heroImage: string;
  featuredCategory?: string;
  featuredItemIds?: string[];
  metaPixelId?: string;
  googleAdsId?: string;
  gtmId?: string;
  capiAccessToken?: string;
  active: boolean;
  ctaText: string;
  countdownMinutes?: number;
}

export type MenuCategory = 
  | 'Puffs & Patties'
  | 'Savory Rolls'
  | 'Cakes & Pastries'
  | 'Snack Combos'
  | 'Breads & Buns'
  | 'Beverages';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: MenuCategory;
  price: number;
  originalPrice?: number;
  image: string;
  isVeg: boolean;
  isBestseller?: boolean;
  isSpicy?: boolean;
  preparationTimeMinutes: number;
  availableOutlets: string[]; // Outlet slugs
  isAvailable?: boolean;
  stockQuantity?: number;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  instructions?: string;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  landmark?: string;
  area: string;
  pincode: string;
  specialInstructions?: string;
}

export type PaymentMethod = 'UPI' | 'COD' | 'CARD';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'COD_CONFIRMED' | 'FAILED';
export type OrderStatus = 'RECEIVED' | 'CONFIRMED' | 'PREPARING' | 'DISPATCHED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface MangwaleLogisticsInfo {
  taskId?: string;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  riderName?: string;
  riderPhone?: string;
  riderVehicleNo?: string;
  trackingUrl?: string;
  estimatedDeliveryMinutes?: number;
  dispatchedAt?: string;
  deliveredAt?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  outletSlug: string;
  campaignSlug?: string;
  customer: CustomerDetails;
  items: {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  mangwale: MangwaleLogisticsInfo;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEventPayload {
  eventName: string;
  outletSlug?: string;
  campaignSlug?: string;
  pixelId?: string;
  value?: number;
  currency?: string;
  contentName?: string;
  contentIds?: string[];
  orderId?: string;
  userData?: {
    phone?: string;
    email?: string;
    name?: string;
  };
}

export interface CampaignAnalytics {
  campaignSlug: string;
  title: string;
  outletSlug: string;
  impressions: number;
  clicks: number;
  ctr: number;
  ordersPlaced: number;
  conversionRate: number;
  grossRevenue: number;
  metaPixelId?: string;
}

export interface OutletAnalytics {
  outletSlug: string;
  outletName: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  activeDeliveryCount: number;
  topSellingItems: { name: string; quantity: number; revenue: number }[];
  hourlyTrend: { hour: string; orders: number; revenue: number }[];
}
