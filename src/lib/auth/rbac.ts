import { EmployeeRole, Permission } from '@/types';

/**
 * Enterprise RBAC Role Definition
 */
export interface RoleDefinition {
  id: EmployeeRole;
  name: string;
  shortName: string;
  description: string;
  typicalStaff: string;
  scope: 'ALL_OUTLETS' | 'ASSIGNED_OUTLET';
  badge: {
    bg: string;
    text: string;
    border: string;
  };
  permissions: readonly Permission[];
}

/**
 * Grouped Permission Metadata for UI display and matrix auditing
 */
export interface PermissionCategory {
  id: string;
  title: string;
  description: string;
  permissions: {
    id: Permission;
    label: string;
    description: string;
  }[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'orders',
    title: 'Orders & Fleet Dispatch',
    description: 'Order fulfillment lifecycle and Mangwale dispatch control',
    permissions: [
      {
        id: 'orders:view',
        label: 'View Orders',
        description: 'View customer orders, delivery addresses, and payment details',
      },
      {
        id: 'orders:manage_status',
        label: 'Update Kitchen Status',
        description: 'Transition order state to Confirm, Preparing, and Ready for Pickup',
      },
      {
        id: 'orders:dispatch',
        label: 'Dispatch to Fleet',
        description: 'Trigger Mangwale fleet rider assignment and pickup requests',
      },
      {
        id: 'orders:cancel',
        label: 'Cancel & Void Orders',
        description: 'Cancel incoming or active orders with customer notification',
      },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory & Catalog',
    description: 'Real-time 86 sold-out controls, batch stock, and master menu catalog',
    permissions: [
      {
        id: 'inventory:view',
        label: 'View Inventory & Stock',
        description: 'Check stock levels, availability, and low-stock alerts',
      },
      {
        id: 'inventory:toggle_stock',
        label: '1-Tap 86 (Availability Toggle)',
        description: 'Instantly mark items Sold Out or Available on live storefront',
      },
      {
        id: 'inventory:manage_quantities',
        label: 'Adjust Batch Quantities',
        description: 'Update physical count of pastries, cakes, and rolls in kitchen',
      },
      {
        id: 'inventory:manage_master_catalog',
        label: 'Master Catalog Architecture',
        description: 'Create, edit, or archive products, categories, base pricing, and images',
      },
    ],
  },
  {
    id: 'outlets',
    title: 'Outlets & Logistics Integration',
    description: 'Bakery outlets, store profiles, and per-outlet Mangwale API keys',
    permissions: [
      {
        id: 'outlets:view',
        label: 'View Outlets Directory',
        description: 'Access outlet profiles, addresses, operating hours, and fleet status',
      },
      {
        id: 'outlets:manage',
        label: 'Manage Store Profiles',
        description: 'Create new branches, modify opening hours, addresses, and delivery radius',
      },
      {
        id: 'outlets:manage_mangwale_api',
        label: 'Manage Mangwale API Credentials',
        description: 'Insert, update, and test outlet-specific Mangwale API keys & secrets',
      },
    ],
  },
  {
    id: 'marketing',
    title: 'Performance Marketing & Tracking',
    description: 'Meta CAPI, Google Ads, GTM, ad campaigns, and landing page URLs',
    permissions: [
      {
        id: 'marketing:view',
        label: 'View Campaign Hub',
        description: 'Review active ad campaigns, conversion tracking, and campaign analytics',
      },
      {
        id: 'marketing:manage_campaigns',
        label: 'Create & Modify Campaigns',
        description: 'Launch geo-targeted ad promos, discount codes, and special menus',
      },
      {
        id: 'marketing:manage_pixels',
        label: 'Pixel & CAPI Instrumentation',
        description: 'Configure Meta Pixel, Google Ads conversion ID, and server CAPI tokens',
      },
    ],
  },
  {
    id: 'staff',
    title: 'Staff Directory & RBAC Security',
    description: 'Personnel access control, employee accounts, and role assignments',
    permissions: [
      {
        id: 'staff:view',
        label: 'View Staff Directory',
        description: 'View employee roster, roles, assigned branches, and contact info',
      },
      {
        id: 'staff:manage_employees',
        label: 'Add & Edit Employees',
        description: 'Invite new kitchen staff, store managers, or change operational access',
      },
      {
        id: 'staff:manage_roles',
        label: 'Manage RBAC Security Matrix',
        description: 'Configure enterprise access levels, permissions, and security roles',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Financials',
    description: 'Real-time sales, outlet performance, and FOCO margin visibility',
    permissions: [
      {
        id: 'analytics:view_outlet',
        label: 'View Store Analytics',
        description: 'View daily order volumes, popular items, and delivery turnaround for outlet',
      },
      {
        id: 'analytics:view_financials',
        label: 'HQ Financials & FOCO Margins',
        description: 'Access aggregate brand revenue, royalty splits, and store comparison metrics',
      },
    ],
  },
];

/**
 * Enterprise Role Definitions Mapping
 */
export const ROLE_DEFINITIONS: Record<EmployeeRole, RoleDefinition> = {
  SUPER_ADMIN: {
    id: 'SUPER_ADMIN',
    name: 'HQ Super Administrator',
    shortName: 'Super Admin',
    description: 'Full unconstrained brand operations authority across all bakery outlets, master catalog, ad pixels, and system settings.',
    typicalStaff: 'Brand Directors, Head of Operations, Executive Chef',
    scope: 'ALL_OUTLETS',
    badge: {
      bg: 'bg-stone-900',
      text: 'text-stone-50',
      border: 'border-stone-800',
    },
    permissions: [
      'orders:view',
      'orders:manage_status',
      'orders:dispatch',
      'orders:cancel',
      'inventory:view',
      'inventory:toggle_stock',
      'inventory:manage_quantities',
      'inventory:manage_master_catalog',
      'outlets:view',
      'outlets:manage',
      'outlets:manage_mangwale_api',
      'marketing:view',
      'marketing:manage_campaigns',
      'marketing:manage_pixels',
      'staff:view',
      'staff:manage_employees',
      'staff:manage_roles',
      'analytics:view_outlet',
      'analytics:view_financials',
    ],
  },
  OUTLET_MANAGER: {
    id: 'OUTLET_MANAGER',
    name: 'Store Franchise Partner / Manager',
    shortName: 'Outlet Manager',
    description: 'Complete operational management for an assigned bakery branch, including order dispatch, live stock, outlet Mangwale API keys, and local kitchen staff.',
    typicalStaff: 'Franchise Partner, Store General Manager, Assistant Manager',
    scope: 'ASSIGNED_OUTLET',
    badge: {
      bg: 'bg-amber-100',
      text: 'text-amber-900',
      border: 'border-amber-300',
    },
    permissions: [
      'orders:view',
      'orders:manage_status',
      'orders:dispatch',
      'orders:cancel',
      'inventory:view',
      'inventory:toggle_stock',
      'inventory:manage_quantities',
      'outlets:view',
      'outlets:manage_mangwale_api',
      'staff:view',
      'staff:manage_employees',
      'analytics:view_outlet',
    ],
  },
  KITCHEN_STAFF: {
    id: 'KITCHEN_STAFF',
    name: 'Kitchen Staff & Head Baker',
    shortName: 'Kitchen Staff',
    description: 'Fast-paced kitchen fulfillment interface focused on preparing tickets, updating order readiness, and 1-tap 86 out-of-stock toggles.',
    typicalStaff: 'Head Baker, Pastry Chef, Line Cook, Kitchen Expeditor',
    scope: 'ASSIGNED_OUTLET',
    badge: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
    },
    permissions: [
      'orders:view',
      'orders:manage_status',
      'inventory:view',
      'inventory:toggle_stock',
    ],
  },
  MARKETING_MANAGER: {
    id: 'MARKETING_MANAGER',
    name: 'Performance Marketer',
    shortName: 'Marketing Manager',
    description: 'Manages multi-outlet digital campaigns, promo banners, Meta Conversions API (CAPI), and Google Ads attribution without impacting kitchen operations.',
    typicalStaff: 'Growth Marketer, Media Buyer, Social Media Specialist',
    scope: 'ALL_OUTLETS',
    badge: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
    },
    permissions: [
      'marketing:view',
      'marketing:manage_campaigns',
      'marketing:manage_pixels',
      'analytics:view_outlet',
      'analytics:view_financials',
      'orders:view',
      'outlets:view',
    ],
  },
};

/**
 * Domain Service: Check if role has a specific permission
 */
export function hasPermission(
  role: EmployeeRole | undefined | null,
  permission: Permission
): boolean {
  if (!role) return false;
  const def = ROLE_DEFINITIONS[role];
  if (!def) return false;
  return def.permissions.includes(permission);
}

/**
 * Domain Service: Check if role has any of the requested permissions
 */
export function hasAnyPermission(
  role: EmployeeRole | undefined | null,
  permissions: Permission[]
): boolean {
  if (!role || !permissions.length) return false;
  return permissions.some((perm) => hasPermission(role, perm));
}

/**
 * Domain Service: Check if role has all requested permissions
 */
export function hasAllPermissions(
  role: EmployeeRole | undefined | null,
  permissions: Permission[]
): boolean {
  if (!role || !permissions.length) return false;
  return permissions.every((perm) => hasPermission(role, perm));
}

/**
 * Domain Service: Check if user has permission to access a target outlet
 */
export function canAccessOutlet(
  userRole: EmployeeRole | undefined | null,
  userOutletAccess: string[] | undefined | null,
  targetOutletSlug: string
): boolean {
  if (!userRole) return false;
  if (userRole === 'SUPER_ADMIN' || userRole === 'MARKETING_MANAGER') return true;
  if (!userOutletAccess || !userOutletAccess.length) return false;
  if (userOutletAccess.includes('all')) return true;
  return userOutletAccess.includes(targetOutletSlug);
}

/**
 * Domain Service: Get role definition
 */
export function getRoleDefinition(role: EmployeeRole): RoleDefinition {
  return (
    ROLE_DEFINITIONS[role] || {
      id: role,
      name: role,
      shortName: role,
      description: 'Standard staff account',
      typicalStaff: 'General Staff',
      scope: 'ASSIGNED_OUTLET',
      badge: { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' },
      permissions: [],
    }
  );
}

/**
 * Domain Service: Get list of all role definitions
 */
export function getAllRoleDefinitions(): RoleDefinition[] {
  return Object.values(ROLE_DEFINITIONS);
}

/**
 * Domain Service: Get grouped permissions
 */
export function getGroupedPermissions(): PermissionCategory[] {
  return PERMISSION_CATEGORIES;
}
