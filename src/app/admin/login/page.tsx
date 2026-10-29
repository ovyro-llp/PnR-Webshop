'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin } = useAuth();
  const [email, setEmail] = useState('admin@puffsnrolls.com');
  const [password, setPassword] = useState('pnr@admin2026');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const res = await loginAdmin(email, password);
    setIsLoading(false);

    if (res.success) {
      router.push('/admin');
    } else {
      setError(res.error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#FAF8F5] text-stone-900 p-4 font-sans">
      <div className="max-w-md w-full bg-white border border-stone-200/90 rounded-3xl p-8 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1C1917] text-white flex items-center justify-center mx-auto shadow-xs font-serif font-bold text-sm">
            P&amp;R
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200">
              Operations &amp; Marketing Hub
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
              P&amp;R Operations Portal
            </h1>
            <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
              Multi-outlet performance marketing, outlet stock 86-ing, and FOCO fulfillment terminal.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@puffsnrolls.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 font-mono"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#1C1917] hover:bg-stone-800 text-white rounded-full text-xs font-medium tracking-wide flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Access Operations Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <Link href="/" className="hover:text-stone-900 transition">
            &larr; Back to Storefront
          </Link>
          <span className="flex items-center gap-1 font-mono text-[10px]">
            <ShieldCheck className="w-3 h-3 text-stone-700" />
            RBAC Authenticated
          </span>
        </div>
      </div>
    </div>
  );
}
