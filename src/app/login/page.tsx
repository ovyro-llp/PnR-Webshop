'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { ArrowRight, Phone, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export default function CustomerLoginPage() {
  const router = useRouter();
  const { loginCustomer, isAuthenticated, isCustomer } = useAuth();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) return;
    setStep('OTP');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await loginCustomer(phone, name);
    setIsLoading(false);
    router.push('/account');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="relative h-14 w-44 mx-auto">
              <Image
                src="https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png"
                alt="Puffs 'n' Rolls"
                fill
                priority
                className="object-contain"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-widest">
                Customer Account
              </span>
              <h1 className="text-2xl font-serif font-bold text-stone-900">
                {step === 'PHONE' ? 'Sign In / Register' : 'Enter One-Time Password'}
              </h1>
              <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                {step === 'PHONE'
                  ? 'Access your saved addresses, track fresh orders, and enjoy bakery rewards.'
                  : `Enter the 4-digit code sent to +91 ${phone}`}
              </p>
            </div>
          </div>

          {step === 'PHONE' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aditya Deshmukh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  WhatsApp Phone Number *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-stone-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="98220 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  maxLength={4}
                  autoFocus
                  placeholder="• • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full text-center text-2xl font-mono tracking-widest py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
                <p className="text-[11px] text-stone-400 text-center mt-1.5">
                  (Demo: enter any 4 numbers or click verify)
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-sm flex items-center justify-center gap-1.5"
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="w-full text-center text-xs text-stone-500 hover:text-stone-800"
              >
                ← Change phone number
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-700" />
              Fast &amp; Secure
            </span>
            <Link href="/admin/login" className="text-stone-400 hover:text-stone-700">
              Admin Portal →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
