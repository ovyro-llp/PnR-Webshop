'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, AdminUser } from '@/context/AuthContext';
import { Order } from '@/types';
import { Bell, Volume2, VolumeX, CheckCircle, Clock, MapPin, ShoppingBag, Store, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Web Audio API Synthesizer for high-visibility restaurant order chime
class RestaurantChimeSynthesizer {
  private ctx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  public getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    return this.ctx;
  }

  public unlock(): boolean {
    const ctx = this.getContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    this.isUnlocked = ctx.state === 'running';
    return this.isUnlocked;
  }

  public playOrderBell(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => this.executeChime(ctx)).catch(() => {});
      return;
    }

    this.executeChime(ctx);
  }

  private executeChime(ctx: AudioContext): void {
    const now = ctx.currentTime;

    // Harmonious, crisp 4-note ascending kitchen service chime
    // E5 (659Hz) -> G#5 (830Hz) -> B5 (987Hz) -> E6 (1318Hz)
    const chord = [
      { freq: 659.25, time: 0.0, dur: 0.45, gain: 0.35 },
      { freq: 830.61, time: 0.16, dur: 0.45, gain: 0.40 },
      { freq: 987.77, time: 0.32, dur: 0.55, gain: 0.45 },
      { freq: 1318.51, time: 0.48, dur: 0.85, gain: 0.55 },
    ];

    chord.forEach(({ freq, time, dur, gain }) => {
      try {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Sine + Triangle harmonic blend for natural metallic bell ring
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        // Attack & Exponential Release
        gainNode.gain.setValueAtTime(0.0001, now + time);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      } catch {
        // Audio node creation error safeguard
      }
    });
  }
}

const chimeSynth = new RestaurantChimeSynthesizer();

export default function OrderSoundAlertManager() {
  const { user } = useAuth();
  const adminUser = user && user.role === 'ADMIN' ? (user as AdminUser) : null;

  const [unreadOrders, setUnreadOrders] = useState<Order[]>([]);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [isMarkingRead, setIsMarkingRead] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Normalize outlet access for the logged in staff/manager
  const assignedOutlets = adminUser?.outletAccess || ['all'];
  const isSuperAdmin = assignedOutlets.includes('all');

  // Attempt to unlock audio on any initial user interaction anywhere on the page
  const handleUserInteraction = useCallback(() => {
    const unlocked = chimeSynth.unlock();
    if (unlocked) {
      setAudioUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    // Initial check
    const ctx = chimeSynth.getContext();
    if (ctx && ctx.state === 'running') {
      setAudioUnlocked(true);
    }

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [handleUserInteraction]);

  // Polling for incoming confirmed, paid orders
  const fetchActiveOrders = useCallback(async () => {
    try {
      // For outlet managers with a specific outlet, filter by that outlet slug
      const outletSlug = !isSuperAdmin && assignedOutlets.length > 0 ? assignedOutlets[0] : 'all';
      const url = outletSlug === 'all'
        ? '/api/orders/list?status=PAID'
        : `/api/orders/list?status=PAID&outlet=${encodeURIComponent(outletSlug)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.orders)) {
        // Filter strictly to:
        // 1. Paid, non-awaiting orders
        // 2. Unread orders (!o.isRead)
        // 3. Belonging to this manager's outlet scope
        const newUnread = data.orders.filter((order: Order) => {
          if (order.isRead === true) return false;
          if (order.orderStatus === 'AWAITING_PAYMENT') return false;
          if (order.paymentStatus !== 'COMPLETED') return false;

          // Scope check
          if (!isSuperAdmin) {
            return assignedOutlets.some(
              (oSlug) =>
                oSlug.toLowerCase().trim() === (order.outletSlug || '').toLowerCase().trim()
            );
          }
          return true;
        });

        setUnreadOrders(newUnread);
      }
    } catch (err) {
      console.warn('[OrderSoundAlertManager polling warning]:', err);
    }
  }, [assignedOutlets, isSuperAdmin]);

  // Poll every 5 seconds for new orders
  useEffect(() => {
    fetchActiveOrders();
    const pollTimer = setInterval(fetchActiveOrders, 5000);
    return () => clearInterval(pollTimer);
  }, [fetchActiveOrders]);

  // Listen for custom 'pnr-order-read' events across tabs or local components
  useEffect(() => {
    const handleLocalRead = (e: Event) => {
      const customEvent = e as CustomEvent<{ orderId: string }>;
      if (customEvent.detail?.orderId) {
        setUnreadOrders((prev) => prev.filter((o) => o.id !== customEvent.detail.orderId && o.orderNumber !== customEvent.detail.orderId));
      }
    };

    window.addEventListener('pnr-order-read', handleLocalRead);
    return () => window.removeEventListener('pnr-order-read', handleLocalRead);
  }, []);

  // Continuous Sound Ringing Loop while unread orders exist and not muted
  useEffect(() => {
    if (unreadOrders.length > 0 && !isMuted) {
      // Play immediately once
      chimeSynth.playOrderBell();

      // Clear any prior interval and loop every 2.2 seconds until 'Read' is clicked
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = setInterval(() => {
        chimeSynth.playOrderBell();
      }, 2200);
    } else {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    }

    return () => {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    };
  }, [unreadOrders.length, isMuted]);

  // Handler for cafe manager clicking the 'Read' button
  const handleMarkAsRead = async (orderId: string) => {
    setIsMarkingRead(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readBy: adminUser?.name || adminUser?.email || 'Cafe Manager',
        }),
      });

      if (response.ok) {
        // Immediately remove from unread orders list so ringing stops instantly
        setUnreadOrders((prev) => prev.filter((o) => o.id !== orderId && o.orderNumber !== orderId));

        // Dispatch local event to sync Orders table immediately
        window.dispatchEvent(
          new CustomEvent('pnr-order-read', {
            detail: { orderId },
          })
        );
      }
    } catch (err) {
      console.error('Failed to mark order as read:', err);
    } finally {
      setIsMarkingRead(null);
    }
  };

  // Handler to mark all active unread orders as read at once
  const handleMarkAllAsRead = async () => {
    const idsToRead = unreadOrders.map((o) => o.id);
    for (const id of idsToRead) {
      await handleMarkAsRead(id);
    }
  };

  return (
    <>
      {/* 1. Persistent Audio Status Pill in Bottom Right */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          id="btn-test-chime"
          onClick={() => {
            chimeSynth.unlock();
            setAudioUnlocked(true);
            chimeSynth.playOrderBell();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md transition cursor-pointer backdrop-blur-md border bg-white/95 text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-900 active:scale-95"
          title="Play a test chime through your speakers to check audio volume"
        >
          <Volume2 className="w-3.5 h-3.5 text-stone-600" />
          <span>Test Sound</span>
        </button>

        <button
          onClick={() => {
            chimeSynth.unlock();
            setAudioUnlocked(true);
            setIsMuted((prev) => !prev);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md transition cursor-pointer backdrop-blur-md border ${
            isMuted
              ? 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
              : unreadOrders.length > 0
              ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
              : 'bg-white/95 text-stone-700 border-stone-200 hover:bg-stone-50'
          }`}
          title={isMuted ? 'Unmute kitchen alert chime' : 'Kitchen alert audio active'}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-rose-300" />
              <span>Chime Muted</span>
            </>
          ) : (
            <>
              <Volume2 className={`w-3.5 h-3.5 ${unreadOrders.length > 0 ? 'animate-bounce text-white' : 'text-emerald-600'}`} />
              <span>{unreadOrders.length > 0 ? `${unreadOrders.length} New Orders!` : 'Kitchen Chime Ready'}</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Urgent High-Visibility Alert Modal / Banner for Incoming Unread Orders */}
      {unreadOrders.length > 0 && (
        <div className="fixed inset-x-0 top-0 z-50 p-3 sm:p-4 bg-rose-600 text-white shadow-2xl border-b-2 border-rose-700 animate-in slide-in-from-top-4 duration-300">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Alert Header & Ringing Indicator */}
            <div className="flex items-start sm:items-center gap-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-white text-rose-600 shadow-md shrink-0 animate-bounce">
                <Bell className="w-6 h-6 animate-[spin_1.5s_ease-in-out_infinite]" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-700 text-[9px] text-white font-bold items-center justify-center">
                    {unreadOrders.length}
                  </span>
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-mono uppercase tracking-wider font-bold">
                    🚨 Ringing Alert • Acknowledgment Required
                  </span>
                  <span className="text-xs text-rose-100 font-medium">
                    {unreadOrders.length === 1 ? '1 New Order Pending' : `${unreadOrders.length} New Orders Pending`}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-white tracking-tight mt-0.5">
                  New Order Received: {unreadOrders[0].orderNumber} (₹{unreadOrders[0].total})
                </h3>
                <p className="text-xs text-rose-100 line-clamp-1">
                  Outlet: <strong className="text-white">{unreadOrders[0].outletSlug.toUpperCase()}</strong> • Customer: {unreadOrders[0].customer.name} ({unreadOrders[0].customer.phone})
                </p>
              </div>
            </div>

            {/* Quick Summary of Current Ringing Order */}
            <div className="hidden lg:flex items-center gap-3 bg-rose-700/60 px-4 py-2 rounded-2xl border border-rose-500/40 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-rose-200">Items:</span>
                <p className="font-medium text-white max-w-xs truncate">
                  {unreadOrders[0].items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </p>
              </div>
            </div>

            {/* Action Buttons: Explicit 'Read' Button */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {unreadOrders.length > 1 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={Boolean(isMarkingRead)}
                  className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition cursor-pointer backdrop-blur-xs"
                >
                  Read All ({unreadOrders.length})
                </button>
              )}

              <button
                id="btn-acknowledge-order-read"
                onClick={() => handleMarkAsRead(unreadOrders[0].id)}
                disabled={Boolean(isMarkingRead)}
                className="px-6 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-rose-700 font-bold text-sm tracking-wide shadow-lg hover:shadow-xl transition transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                {isMarkingRead === unreadOrders[0].id ? (
                  <>
                    <span className="w-4 h-4 border-2 border-rose-700 border-t-transparent rounded-full animate-spin" />
                    <span>Silencing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Read</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
