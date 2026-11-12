'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import {
  ArrowRight,
  Phone,
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function CustomerLoginPage() {
  const router = useRouter();
  const { loginCustomer, registerCustomer, isAuthenticated, isCustomer } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already authenticated customer, redirect to account
  React.useEffect(() => {
    if (isAuthenticated && isCustomer) {
      router.push('/account');
    }
  }, [isAuthenticated, isCustomer, router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const res = await loginCustomer(phone, password);
    setIsLoading(false);

    if (res.success) {
      router.push('/account');
    } else {
      setErrorMessage(res.error || 'Login failed. Please verify your phone and password.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const res = await registerCustomer(name, phone, password);
    setIsLoading(false);

    if (res.success) {
      router.push('/account');
    } else {
      setErrorMessage(res.error || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="max-w-md w-full bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="relative h-12 w-40 mx-auto">
              <Image
                src="https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png"
                alt="Puffs 'n' Rolls"
                fill
                priority
                sizes="160px"
                className="object-contain"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                Customer Portal
              </span>
              <h1 className="text-2xl font-serif font-bold text-stone-900">
                {mode === 'LOGIN' ? 'Customer Sign In' : 'Create New Account'}
              </h1>
              <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                {mode === 'LOGIN'
                  ? 'Sign in with your registered phone number and password to view active orders.'
                  : 'Join Puffs &apos;n&apos; Rolls to save delivery addresses and enjoy bakery loyalty benefits.'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                mode === 'LOGIN'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                mode === 'REGISTER'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              New Customer
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          {mode === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Mobile Phone Number *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-stone-500 font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    inputMode="tel"
                    maxLength={10}
                    placeholder="9822344556"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-12 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                    Password *
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 active:scale-[0.99] text-white rounded-xl text-xs font-bold tracking-wide transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Quick Demo Test Login */}
              <div className="pt-2 border-t border-stone-200/80 space-y-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    setPhone('9822011223');
                    setPassword('pnr@customer123');
                    setIsLoading(true);
                    setErrorMessage('');
                    const res = await loginCustomer('9822011223', 'pnr@customer123');
                    setIsLoading(false);
                    if (res.success) {
                      router.push('/account');
                    } else {
                      setErrorMessage(res.error || 'Test login failed');
                    }
                  }}
                  className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>One-Click Test Login (9822011223)</span>
                </button>
                <p className="text-[10px] text-stone-400 text-center">
                  New to Puffs &apos;n&apos; Rolls? Click <b>Create New Account</b> above.
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Deshmukh"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Mobile Phone Number *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-stone-500 font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    inputMode="tel"
                    maxLength={10}
                    placeholder="98220 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-12 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Create Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    placeholder="At least 4 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 active:scale-[0.99] text-white rounded-xl text-xs font-bold tracking-wide transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <span>{isLoading ? 'Creating Account...' : 'Create Account & Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-stone-100 flex items-center justify-center text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-stone-700" />
              Secure Encrypted Sign In
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
