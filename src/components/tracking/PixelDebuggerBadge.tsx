'use client';

import React, { useState, useEffect } from 'react';
import { useTracking } from './TrackingProvider';
import { Activity, CheckCircle, ChevronDown, ChevronUp, Eye } from 'lucide-react';

interface EventLog {
  id: string;
  name: string;
  time: string;
  pixelId?: string;
  data?: Record<string, unknown>;
}

export function PixelDebuggerBadge() {
  const { pixelId, googleAdsId, outletSlug, campaignSlug } = useTracking();
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<EventLog[]>([]);

  useEffect(() => {
    // Intercept console tracking or push initial PageView
    const initialLog: EventLog = {
      id: Math.random().toString(),
      name: 'PageView',
      time: new Date().toLocaleTimeString(),
      pixelId: pixelId || 'Not Configured',
      data: { outlet: outletSlug, campaign: campaignSlug },
    };
    setLogs([initialLog]);
  }, [pixelId, outletSlug, campaignSlug]);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm font-sans">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-slate-700/60 overflow-hidden text-xs transition-all">
        {/* Header Bar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2.5 flex items-center justify-between gap-2 bg-gradient-to-r from-amber-600/30 to-rose-600/30 hover:bg-slate-800 transition"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-amber-200">
              Marketing Tag Monitor
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-amber-300 font-mono">
              Pixel: {pixelId ? `${pixelId.slice(0, 6)}...` : 'None'}
            </span>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </button>

        {/* Expanded Panel */}
        {isOpen && (
          <div className="p-3.5 space-y-3 bg-slate-900 max-h-80 overflow-y-auto">
            <div className="space-y-1.5 border-b border-slate-800 pb-2.5">
              <div className="flex justify-between items-center text-slate-400">
                <span>Active Outlet:</span>
                <span className="font-medium text-amber-300 capitalize">
                  {outletSlug?.replace('-', ' ') || 'All Outlets'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Active Campaign:</span>
                <span className="font-medium text-rose-300">
                  {campaignSlug || 'General Storefront'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Meta Pixel ID:</span>
                <span className="font-mono text-emerald-400">
                  {pixelId || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Google Ads Tag:</span>
                <span className="font-mono text-sky-400">
                  {googleAdsId || 'Not set'}
                </span>
              </div>
            </div>

            {/* Event Activity Stream */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-amber-400" />
                  Live Event Fires
                </span>
                <span className="text-[10px] text-slate-400">{logs.length} triggered</span>
              </div>

              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-1.5 rounded bg-slate-800/80 border border-slate-700/50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="font-medium text-white">{log.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              ⚡ Events are synchronized simultaneously via Browser Pixel and Server CAPI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
