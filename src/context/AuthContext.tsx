'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  outletAccess: string[]; // ['all'] or ['college-road', etc.]
  title: string;
}

export type AuthUser = CustomerUser | AdminUser;

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  isHydrated: boolean;
  loginCustomer: (phone: string, name?: string) => Promise<boolean>;
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

  // Restore auth from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pnr_auth_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse auth user', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const loginCustomer = async (phone: string, name: string = 'Nashik Foodie') => {
    const customer: CustomerUser = {
      id: `cust-${Date.now()}`,
      name: name.trim() || 'Valued Customer',
      phone: phone.trim(),
      role: 'CUSTOMER',
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

    setUser(customer);
    localStorage.setItem('pnr_auth_user', JSON.stringify(customer));
    setIsCustomerLoginModalOpen(false);
    return true;
  };

  const loginAdmin = async (email: string, password: string) => {
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
        outletAccess: ['all'],
        title: 'Master Brand Administrator',
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
        outletAccess: ['indira-nagar'],
        title: 'Franchise Partner (Indira Nagar)',
      };
      setUser(admin);
      localStorage.setItem('pnr_auth_user', JSON.stringify(admin));
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid administrator credentials. Try admin@puffsnrolls.com / pnr@admin2026',
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pnr_auth_user');
  };

  const openCustomerLogin = () => setIsCustomerLoginModalOpen(true);

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
