'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { EmployeeRole } from '@/types';

export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'CUSTOMER';
  savedAddresses?: {
    id: string;
    label: string;
    address: string;
    area: string;
    pincode: string;
  }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN';
  employeeRole?: EmployeeRole;
  outletAccess: string[]; // ['all'] or ['cycle-circle', etc.]
  title: string;
}

export type AuthUser = CustomerUser | AdminUser;

interface RegisteredCustomerRecord {
  id: string;
  name: string;
  phone: string;
  password: string;
  savedAddresses?: CustomerUser['savedAddresses'];
}

// Pre-seeded test accounts
const PRESEEDED_CUSTOMERS: RegisteredCustomerRecord[] = [
  {
    id: 'cust-aditya-101',
    name: 'Aditya Deshmukh',
    phone: '9822344556',
    password: 'pnr@customer123',
    savedAddresses: [
      {
        id: 'addr-1',
        label: 'Home',
        address: 'Flat 402, Shrinath Heights, Near KTHM College Ground',
        area: 'Gangapur Road',
        pincode: '422002',
      },
    ],
  },
  {
    id: 'cust-tester-102',
    name: "Puffs 'n' Rolls Tester",
    phone: '9822011223',
    password: 'pnr@customer123',
    savedAddresses: [
      {
        id: 'addr-2',
        label: 'Office',
        address: 'Shop No. 4, Opposite BYK College, Thatte Nagar',
        area: 'College Road',
        pincode: '422005',
      },
    ],
  },
];

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  isHydrated: boolean;
  loginCustomer: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerCustomer: (name: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  autoRegisterOrLoginCustomer: (
    name: string,
    phone: string,
    address?: string,
    area?: string,
    pincode?: string,
    coords?: { lat: number; lng: number }
  ) => Promise<{ success: boolean; customer?: CustomerUser; error?: string }>;
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  updateCustomerProfile: (updates: { name?: string; phone?: string; savedAddresses?: CustomerUser['savedAddresses'] }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  openCustomerLogin: () => void;
  isCustomerLoginModalOpen: boolean;
  setIsCustomerLoginModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCustomerLoginModalOpen, setIsCustomerLoginModalOpen] = useState(false);

  // Restore auth and ensure pre-seeded accounts in storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pnr_auth_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }

      // Initialize registered accounts registry if empty
      const existingAccounts = localStorage.getItem('pnr_registered_customers');
      if (!existingAccounts) {
        localStorage.setItem('pnr_registered_customers', JSON.stringify(PRESEEDED_CUSTOMERS));
      }
    } catch (e) {
      console.warn('Failed to parse auth user', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const loginCustomer = useCallback(
    async (rawPhone: string, password: string): Promise<{ success: boolean; error?: string }> => {
      const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
      const cleanPassword = password.trim();

      if (cleanPhone.length < 10) {
        return { success: false, error: 'Please enter a valid 10-digit mobile number' };
      }
      if (!cleanPassword) {
        return { success: false, error: 'Please enter your account password' };
      }

      // Read registered accounts from storage
      let accounts: RegisteredCustomerRecord[] = [...PRESEEDED_CUSTOMERS];
      try {
        const stored = localStorage.getItem('pnr_registered_customers');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Merge stored with preseeded (stored takes precedence)
            const map = new Map<string, RegisteredCustomerRecord>();
            PRESEEDED_CUSTOMERS.forEach((acc) => map.set(acc.phone, acc));
            parsed.forEach((acc) => map.set(acc.phone, acc));
            accounts = Array.from(map.values());
          }
        }
      } catch (e) {
        console.warn('Failed to load registered accounts', e);
      }

      const match = accounts.find((acc) => acc.phone === cleanPhone);

      // Check password
      const isMasterTestPass = cleanPassword === 'pnr@customer123' || cleanPassword === '123456';
      const isCorrectPassword = match ? match.password === cleanPassword || isMasterTestPass : isMasterTestPass;

      if (!isCorrectPassword) {
        return {
          success: false,
          error: match
            ? 'Incorrect password. Please try again or use the test password.'
            : 'No account found with this phone number. Please click Register to create one.',
        };
      }

      const customer: CustomerUser = {
        id: match?.id || `cust-${Date.now()}`,
        name: match?.name || 'Valued Customer',
        phone: cleanPhone,
        role: 'CUSTOMER',
        savedAddresses: match?.savedAddresses || [
          {
            id: 'addr-default',
            label: 'Home',
            address: 'Flat 402, Shrinath Heights, Near BYK Circle',
            area: 'College Road',
            pincode: '422005',
          },
        ],
      };

      setUser(customer);
      try {
        localStorage.setItem('pnr_auth_user', JSON.stringify(customer));
      } catch {}
      setIsCustomerLoginModalOpen(false);
      return { success: true };
    },
    []
  );

  const autoRegisterOrLoginCustomer = useCallback(
    async (
      name: string,
      rawPhone: string,
      address?: string,
      area?: string,
      pincode?: string,
      coords?: { lat: number; lng: number }
    ): Promise<{ success: boolean; customer?: CustomerUser; error?: string }> => {
      const cleanName = name.trim();
      const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);

      if (!cleanPhone || cleanPhone.length < 10) {
        return { success: false, error: 'Please enter a valid 10-digit mobile number' };
      }

      const defaultAddress = address?.trim() || 'Nashik Delivery Location';
      const defaultArea = area?.trim() || 'Nashik City';
      const defaultPincode = pincode?.trim() || '422005';

      let accounts: RegisteredCustomerRecord[] = [...PRESEEDED_CUSTOMERS];
      try {
        const stored = localStorage.getItem('pnr_registered_customers');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            accounts = parsed;
          }
        }
      } catch {}

      let existing = accounts.find((a) => a.phone === cleanPhone);
      let customerUser: CustomerUser;

      if (existing) {
        if (cleanName && cleanName !== existing.name) {
          existing.name = cleanName;
        }
        existing.savedAddresses = existing.savedAddresses || [];
        if (address) {
          const hasAddr = existing.savedAddresses.some((a) => a.address === defaultAddress);
          if (!hasAddr) {
            existing.savedAddresses.unshift({
              id: `addr-${Date.now()}`,
              label: 'Recent Delivery',
              address: defaultAddress,
              area: defaultArea,
              pincode: defaultPincode,
            });
          }
        }
        customerUser = {
          id: existing.id,
          name: existing.name,
          phone: existing.phone,
          role: 'CUSTOMER',
          savedAddresses: existing.savedAddresses,
        };
      } else {
        const newRecord: RegisteredCustomerRecord = {
          id: `cust-${Date.now()}`,
          name: cleanName || `Customer ${cleanPhone.slice(-4)}`,
          phone: cleanPhone,
          password: 'pnr@customer', // Default generated password
          savedAddresses: [
            {
              id: `addr-${Date.now()}`,
              label: 'Delivery Location',
              address: defaultAddress,
              area: defaultArea,
              pincode: defaultPincode,
            },
          ],
        };
        accounts.push(newRecord);
        customerUser = {
          id: newRecord.id,
          name: newRecord.name,
          phone: newRecord.phone,
          role: 'CUSTOMER',
          savedAddresses: newRecord.savedAddresses,
        };
      }

      try {
        localStorage.setItem('pnr_registered_customers', JSON.stringify(accounts));
        localStorage.setItem('pnr_auth_user', JSON.stringify(customerUser));
      } catch (e) {
        console.warn('Failed to save auto-registered account', e);
      }

      setUser(customerUser);
      return { success: true, customer: customerUser };
    },
    []
  );

  const registerCustomer = useCallback(
    async (
      name: string,
      rawPhone: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      const cleanName = name.trim();
      const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
      const cleanPassword = password.trim();

      if (!cleanName) {
        return { success: false, error: 'Please enter your full name' };
      }
      if (cleanPhone.length < 10) {
        return { success: false, error: 'Please enter a valid 10-digit mobile number' };
      }
      if (!cleanPassword || cleanPassword.length < 4) {
        return { success: false, error: 'Password must be at least 4 characters long' };
      }

      const newRecord: RegisteredCustomerRecord = {
        id: `cust-${Date.now()}`,
        name: cleanName,
        phone: cleanPhone,
        password: cleanPassword,
        savedAddresses: [
          {
            id: 'addr-1',
            label: 'Home',
            address: 'Flat 402, Shrinath Heights, Near BYK Circle',
            area: 'College Road',
            pincode: '422005',
          },
        ],
      };

      try {
        let accounts: RegisteredCustomerRecord[] = [...PRESEEDED_CUSTOMERS];
        const stored = localStorage.getItem('pnr_registered_customers');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            accounts = parsed;
          }
        }
        const filtered = accounts.filter((a) => a.phone !== cleanPhone);
        filtered.push(newRecord);
        localStorage.setItem('pnr_registered_customers', JSON.stringify(filtered));
      } catch (e) {
        console.warn('Failed to save registered account', e);
      }

      const customer: CustomerUser = {
        id: newRecord.id,
        name: newRecord.name,
        phone: newRecord.phone,
        role: 'CUSTOMER',
        savedAddresses: newRecord.savedAddresses,
      };

      setUser(customer);
      try {
        localStorage.setItem('pnr_auth_user', JSON.stringify(customer));
      } catch {}
      setIsCustomerLoginModalOpen(false);
      return { success: true };
    },
    []
  );

  const loginAdmin = useCallback(async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // Default Super Admin & Outlet Manager credentials
    if (
      (cleanEmail === 'admin@puffsnrolls.com' && password === 'pnr@admin2026') ||
      (cleanEmail === 'admin' && password === 'admin')
    ) {
      const admin: AdminUser = {
        id: 'admin-super',
        name: 'Headquarters Operations',
        email: 'admin@puffsnrolls.com',
        role: 'ADMIN',
        employeeRole: 'SUPER_ADMIN',
        outletAccess: ['all'],
        title: 'Master Brand Administrator',
      };
      setUser(admin);
      localStorage.setItem('pnr_auth_user', JSON.stringify(admin));
      return { success: true };
    }

    if (
      cleanEmail === 'marketing@puffsnrolls.com' &&
      (password === 'pnr@marketing2026' || password === 'admin' || password === 'pnr123')
    ) {
      const admin: AdminUser = {
        id: 'admin-mkt',
        name: 'Vikram Joshi (Marketing)',
        email: cleanEmail,
        role: 'ADMIN',
        employeeRole: 'MARKETING_MANAGER',
        outletAccess: ['all'],
        title: 'Lead Performance Marketer',
      };
      setUser(admin);
      localStorage.setItem('pnr_auth_user', JSON.stringify(admin));
      return { success: true };
    }

    if (
      (cleanEmail === 'cyclecircle@puffsnrolls.com' || cleanEmail === 'collegeroad@puffsnrolls.com') &&
      (password === 'cycle2026' || password === 'college2026' || password === 'admin' || password === 'pnr123')
    ) {
      const admin: AdminUser = {
        id: 'admin-cr',
        name: 'Cycle Circle Outlet Manager',
        email: cleanEmail,
        role: 'ADMIN',
        employeeRole: 'OUTLET_MANAGER',
        outletAccess: ['cycle-circle'],
        title: 'Franchise Partner (Cycle Circle)',
      };
      setUser(admin);
      localStorage.setItem('pnr_auth_user', JSON.stringify(admin));
      return { success: true };
    }

    if (
      (cleanEmail === 'ndpatel@puffsnrolls.com' || cleanEmail === 'ndpatelroad@puffsnrolls.com') &&
      (password === 'ndpatel2026' || password === 'admin' || password === 'pnr123')
    ) {
      const admin: AdminUser = {
        id: 'admin-nd',
        name: 'ND Patel Road Outlet Manager',
        email: cleanEmail,
        role: 'ADMIN',
        employeeRole: 'OUTLET_MANAGER',
        outletAccess: ['nd-patel-road'],
        title: 'Franchise Partner (ND Patel Road)',
      };
      setUser(admin);
      localStorage.setItem('pnr_auth_user', JSON.stringify(admin));
      return { success: true };
    }

    if (
      (cleanEmail === 'gangapur@puffsnrolls.com' || cleanEmail === 'gangapurroad@puffsnrolls.com') &&
      (password === 'gangapur2026' || password === 'admin' || password === 'pnr123')
    ) {
      const admin: AdminUser = {
        id: 'admin-gp',
        name: 'Gangapur Road Outlet Manager',
        email: cleanEmail,
        role: 'ADMIN',
        employeeRole: 'OUTLET_MANAGER',
        outletAccess: ['gangapur-road'],
        title: 'Franchise Partner (Gangapur Road)',
      };
      setUser(admin);
      localStorage.setItem('pnr_auth_user', JSON.stringify(admin));
      return { success: true };
    }

    if (
      cleanEmail === 'kitchen.cr@puffsnrolls.com' &&
      (password === 'kitchen2026' || password === 'admin' || password === 'pnr123')
    ) {
      const admin: AdminUser = {
        id: 'admin-kitchen',
        name: 'Ramesh Pawar (Kitchen Lead)',
        email: cleanEmail,
        role: 'ADMIN',
        employeeRole: 'KITCHEN_STAFF',
        outletAccess: ['cycle-circle'],
        title: 'Head Baker (Cycle Circle)',
      };
      setUser(admin);
      localStorage.setItem('pnr_auth_user', JSON.stringify(admin));
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid administrator credentials. Try admin@puffsnrolls.com / pnr@admin2026',
    };
  }, []);

  const updateCustomerProfile = useCallback(
    async (updates: { name?: string; phone?: string; savedAddresses?: CustomerUser['savedAddresses'] }) => {
      if (!user || user.role !== 'CUSTOMER') {
        return { success: false, error: 'Not authenticated as customer' };
      }

      const updatedUser: CustomerUser = {
        ...user,
        name: updates.name || user.name,
        phone: updates.phone || user.phone,
        savedAddresses: updates.savedAddresses || user.savedAddresses,
      };

      setUser(updatedUser);
      try {
        localStorage.setItem('pnr_auth_user', JSON.stringify(updatedUser));
        const raw = localStorage.getItem('pnr_registered_customers');
        if (raw) {
          const accounts: RegisteredCustomerRecord[] = JSON.parse(raw);
          const idx = accounts.findIndex((a) => a.id === user.id || a.phone === user.phone);
          if (idx !== -1) {
            accounts[idx] = {
              ...accounts[idx],
              name: updatedUser.name,
              phone: updatedUser.phone,
              savedAddresses: updatedUser.savedAddresses || [],
            };
            localStorage.setItem('pnr_registered_customers', JSON.stringify(accounts));
          }
        }
      } catch {}
      return { success: true };
    },
    [user]
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('pnr_auth_user');
  }, []);

  const openCustomerLogin = useCallback(() => setIsCustomerLoginModalOpen(true), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isCustomer: user?.role === 'CUSTOMER',
        isHydrated,
        loginCustomer,
        registerCustomer,
        autoRegisterOrLoginCustomer,
        loginAdmin,
        updateCustomerProfile,
        logout,
        openCustomerLogin,
        isCustomerLoginModalOpen,
        setIsCustomerLoginModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
