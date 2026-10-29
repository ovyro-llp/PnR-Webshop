'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Store, ChevronDown, Check, Building2, MapPin, Sparkles } from 'lucide-react';
import { Outlet } from '@/types';

interface OutletSelectorProps {
  outlets: Outlet[];
  selectedOutlet: string;
  onSelectOutlet: (slug: string) => void;
  includeAll?: boolean;
  allLabel?: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function OutletSelector({
  outlets,
  selectedOutlet,
  onSelectOutlet,
  includeAll = false,
  allLabel = 'All Outlets (HQ View)',
  label = 'Active Kitchen:',
  className = '',
  size = 'md',
}: OutletSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeOutlet = outlets.find((o) => o.slug === selectedOutlet);
  const isAllSelected = includeAll && selectedOutlet === 'all';

  const displayName = isAllSelected
    ? allLabel
    : activeOutlet
    ? activeOutlet.name.replace("Puffs 'n' Rolls - ", '')
    : 'Select Outlet';

  const badgeText = isAllSelected
    ? 'HQ Matrix'
    : activeOutlet?.slug === 'college-road'
    ? 'Flagship'
    : activeOutlet?.slug === 'nashik-road'
    ? 'Station Hub'
    : 'Express Kitchen';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full sm:w-auto inline-flex items-center justify-between gap-3 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-2xl transition-all shadow-[0_2px_6px_rgba(0,0,0,0.03)] cursor-pointer text-stone-900 group ${
          size === 'sm'
            ? 'px-3 py-1.5 text-xs'
            : size === 'lg'
            ? 'px-4 py-3 text-sm'
            : 'px-3.5 py-2 text-xs sm:text-sm'
        } ${isOpen ? 'ring-2 ring-stone-900/10 border-stone-400' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-xl bg-stone-100 group-hover:bg-stone-200/80 flex items-center justify-center shrink-0 transition text-stone-700">
            {isAllSelected ? <Building2 className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
          </div>

          <div className="text-left min-w-0">
            {label && (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 block leading-tight">
                {label}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-stone-900 truncate">{displayName}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-600 shrink-0">
                {badgeText}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-stone-900' : ''
            }`}
          />
        </div>
      </button>

      {/* Luxury Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-stone-200 shadow-[0_12px_32px_rgba(0,0,0,0.08)] py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="px-3.5 py-2 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Select Nashik Outlet</span>
            </span>
            <span className="text-[10px] font-mono text-stone-400">FOCO Model</span>
          </div>

          <div className="p-1.5 space-y-1">
            {includeAll && (
              <button
                type="button"
                onClick={() => {
                  onSelectOutlet('all');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer ${
                  isAllSelected
                    ? 'bg-[#1C1917] text-white'
                    : 'hover:bg-stone-50 text-stone-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isAllSelected ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold block">{allLabel}</span>
                    <span className={`text-[10px] block ${isAllSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                      Consolidated metrics across all 3 kitchens
                    </span>
                  </div>
                </div>
                {isAllSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>
            )}

            {outlets.map((outlet) => {
              const isSelected = selectedOutlet === outlet.slug;
              const shortName = outlet.name.replace("Puffs 'n' Rolls - ", '');
              const tag =
                outlet.slug === 'college-road'
                  ? 'Flagship Outlet'
                  : outlet.slug === 'nashik-road'
                  ? 'Station Hub'
                  : 'Express Kitchen';

              return (
                <button
                  key={outlet.slug}
                  type="button"
                  onClick={() => {
                    onSelectOutlet(outlet.slug);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#1C1917] text-white'
                      : 'hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold truncate">{shortName}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                            isSelected ? 'bg-stone-800 text-stone-200' : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {tag}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] flex items-center gap-1 truncate ${
                          isSelected ? 'text-stone-300' : 'text-stone-400'
                        }`}
                      >
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{outlet.address}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    {outlet.isOpen ? (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                          isSelected ? 'bg-emerald-900/60 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        OPEN
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-semibold">
                        PAUSED
                      </span>
                    )}
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
