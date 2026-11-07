'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Phone,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export function CustomerLoginModal() {
  const { isCustomerLoginModalOpen, setIsCustomerLoginModalOpen, loginCustomer, registerCustomer } =
    useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Lock body scroll and prevent viewport wobble when modal is open
  useEffect(() => {
    if (isCustomerLoginModalOpen) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [isCustomerLoginModalOpen]);

  if (!isCustomerLoginModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const res = await loginCustomer(phone, password);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Login failed. Please verify your phone and password.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const res = await registerCustomer(name, phone, password);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] border border-stone-200 rounded-3xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto overscroll-contain">
        <button
          onClick={() => setIsCustomerLoginModalOpen(false)}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-1.5 rounded-full hover:bg-stone-200/50 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="relative h-11 w-36 mx-auto">
            <Image
              src="https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png"
              alt="Puffs 'n' Rolls"
              fill
              sizes="144px"
              className="object-contain"
            />
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900 tracking-tight pt-1">
            {mode === 'LOGIN' ? 'Customer Sign In' : 'Create New Account'}
          </h3>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            {mode === 'LOGIN'
              ? 'Access saved addresses, track fresh orders, and unlock member rewards.'
              : 'Register your mobile number to checkout quickly.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-stone-200/70 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setErrorMessage('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
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
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              mode === 'REGISTER'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            New Customer
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        {mode === 'LOGIN' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1">
                Mobile Number *
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
                  className="w-full pl-12 pr-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
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
              className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 active:scale-[0.99] text-white rounded-xl text-xs font-semibold tracking-wide transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1">
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
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1">
                Mobile Number *
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
                  className="w-full pl-12 pr-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1">
                Password *
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
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
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
              className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 active:scale-[0.99] text-white rounded-xl text-xs font-semibold tracking-wide transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <span>{isLoading ? 'Creating Account...' : 'Create Account & Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-stone-200/70 text-center">
          <p className="text-[10px] text-stone-400">
            By signing in you agree to Puffs &apos;n&apos; Rolls Terms &amp; Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
