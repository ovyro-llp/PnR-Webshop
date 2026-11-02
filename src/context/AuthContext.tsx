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
  outletAccess: string[]; // ['all'] or ['college-road', etc.]
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
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
      cleanEmail === 'collegeroad@puffsnrolls.com' &&
      (password === 'college2026' || password === 'admin' || password === 'pnr123')
    ) {
      const admin: AdminUser = {
        id: 'admin-cr',
        name: 'College Road Outlet Manager',
        email: cleanEmail,
        role: 'ADMIN',
        employeeRole: 'OUTLET_MANAGER',
        outletAccess: ['college-road'],
        title: 'Franchise Partner (College Road)',
      };
      setUser(admin);
      localStorage.setItem('pnr_auth_user', JSON.stringify(admin));
      return { success: true };
    }

    if (
      cleanEmail === 'nashikroad@puffsnrolls.com' &&
      (password === 'nashik2026' || password === 'admin' || password === 'pnr123')
    ) {
      const admin: AdminUser = {
        id: 'admin-nr',
        name: 'Nashik Road Outlet Manager',
        email: cleanEmail,
        role: 'ADMIN',
        employeeRole: 'OUTLET_MANAGER',
        outletAccess: ['nashik-road'],
        title: 'Franchise Partner (Nashik Road)',
      };
      setUser(admin);
      localStorage.setItem('pnr_auth_user', JSON.stringify(admin));
      return { success: true };
    }

    if (
      cleanEmail === 'indiranagar@puffsnrolls.com' &&
      (password === 'indira2026' || password === 'admin' || password === 'pnr123')
    ) {
      const admin: AdminUser = {
        id: 'admin-in',
        name: 'Indira Nagar Outlet Manager',
        email: cleanEmail,
        role: 'ADMIN',
        employeeRole: 'OUTLET_MANAGER',
        outletAccess: ['indira-nagar'],
        title: 'Franchise Partner (Indira Nagar)',
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
        outletAccess: ['college-road'],
        title: 'Head Baker (College Road)',
      };
      setUser(admin);
      localStorage.setItem('pnr_auth_user', JSON.stringify(admin));
      return { success: true };
    }

    if (
      cleanEmail === 'rider.rohit@puffsnrolls.com' &&
      (password === 'rider2026' || password === 'admin' || password === 'pnr123')
    ) {
      const admin: AdminUser = {
        id: 'admin-rider',
        name: 'Rohit Shinde (Fleet Rider)',
        email: cleanEmail,
        role: 'ADMIN',
        employeeRole: 'DISPATCH_RIDER',
        outletAccess: ['college-road'],
        title: 'Express Fleet Dispatch Rider',
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
        loginAdmin,
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
