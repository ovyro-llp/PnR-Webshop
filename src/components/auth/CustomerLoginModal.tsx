'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { X, Phone, User, CheckCircle2, ArrowRight } from 'lucide-react';

export function CustomerLoginModal() {
  const { isCustomerLoginModalOpen, setIsCustomerLoginModalOpen, loginCustomer } = useAuth();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isCustomerLoginModalOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) return;
    setStep('OTP');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await loginCustomer(phone, name || 'Nashik Guest');
    setIsLoading(false);
    setStep('PHONE');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF8F5] border border-stone-200 rounded-3xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl space-y-6">
        <button
          onClick={() => setIsCustomerLoginModalOpen(false)}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-1.5 rounded-full hover:bg-stone-200/50 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative h-12 w-40 mx-auto">
            <Image
              src="https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png"
              alt="Puffs 'n' Rolls"
              fill
              className="object-contain"
            />
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900 tracking-tight pt-1">
            {step === 'PHONE' ? 'Sign In / Register' : 'Verify WhatsApp OTP'}
          </h3>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            {step === 'PHONE'
              ? 'Access your saved addresses, track fresh orders, and unlock member bakery discounts.'
              : `Enter the 4-digit code sent to +91 ${phone}`}
          </p>
        </div>

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp} className="space-y-3.5">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1">
                Your Name (Optional)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Aditya Deshmukh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-600 mb-1">
                Phone Number *
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
                  className="w-full pl-12 pr-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 text-white rounded-xl text-xs font-semibold tracking-wide transition shadow-sm flex items-center justify-center gap-1.5"
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
                className="w-full text-center text-2xl font-mono tracking-widest py-3 bg-white border border-stone-300 rounded-xl focus:ring-1 focus:ring-stone-900 focus:outline-none"
              />
              <p className="text-[11px] text-stone-400 text-center mt-1.5">
                (Demo mode: enter any 4 numbers or click verify)
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 text-white rounded-xl text-xs font-semibold tracking-wide transition shadow-sm flex items-center justify-center gap-1.5"
            >
              {isLoading ? 'Verifying...' : 'Verify & Enter'}
            </button>

            <button
              type="button"
              onClick={() => setStep('PHONE')}
              className="w-full text-center text-xs text-stone-500 hover:text-stone-800"
            >
              ← Edit phone number
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
