import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, ShieldCheck, Heart, Clock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#1C1917] text-stone-400 py-12 sm:py-16 text-xs w-full border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand & Story */}
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="inline-block relative h-10 w-36">
              <Image
                src="https://puffsnrolls.com/wp-content/uploads/2025/12/banner-logo.png"
                alt="Puffs 'n' Rolls"
                fill
                sizes="144px"
                className="object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-stone-400 text-xs leading-relaxed">
              Where Every Bite Unrolls Happiness. Handcrafting Nashik&apos;s favorite flaky puffs, artisan rolls, and decadent celebration cakes since 2001.
            </p>
            <div className="flex items-center gap-2 pt-2 text-stone-300 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>FSSAI Certified Bakery Kitchens</span>
            </div>
          </div>

          {/* Bakery Outlets */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Our Nashik Kitchens
            </h4>
            <div className="space-y-2 text-stone-400">
              <div>
                <Link
                  href="/college-road"
                  className="font-medium text-stone-200 hover:text-amber-400 transition"
                >
                  College Road
                </Link>
                <p className="text-[11px] text-stone-500">Shop 4, Shreerang Heights, Opp. BYK College</p>
              </div>
              <div>
                <Link
                  href="/nashik-road"
                  className="font-medium text-stone-200 hover:text-amber-400 transition"
                >
                  Nashik Road
                </Link>
                <p className="text-[11px] text-stone-500">Datta Mandir Chowk, Opp. Bytco Point</p>
              </div>
              <div>
                <Link
                  href="/indira-nagar"
                  className="font-medium text-stone-200 hover:text-amber-400 transition"
                >
                  Indira Nagar
                </Link>
                <p className="text-[11px] text-stone-500">Govind Nagar Ring Road, Near Jogging Track</p>
              </div>
            </div>
          </div>

          {/* Quick & Legal Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Customer Care &amp; Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Browse Fresh Menu
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition">
                  My Orders &amp; Account
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-amber-400 text-stone-300 font-medium transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-amber-400 text-stone-300 font-medium transition">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/terms#cancellation" className="hover:text-white transition">
                  Cancellation &amp; Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Helpline & Timings */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Order Helpline &amp; Hours
            </h4>
            <div className="space-y-2.5">
              <a
                href="tel:+919423639911"
                className="flex items-center gap-2 text-stone-200 hover:text-amber-400 transition"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium">+91 94236 39911</span>
              </a>
              <a
                href="mailto:care@puffsnrolls.com"
                className="flex items-center gap-2 text-stone-300 hover:text-white transition"
              >
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <span>care@puffsnrolls.com</span>
              </a>
              <div className="flex items-start gap-2 text-stone-400 text-[11px] pt-1">
                <Clock className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                <span>Open Everyday: 9:00 AM – 10:30 PM (Fresh hot batches every 2 hours)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between text-stone-500 text-[11px] gap-3">
          <p>© 2026 Puffs &apos;n&apos; Rolls. All rights reserved. Handcrafted in Nashik.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-stone-300 transition">
              Privacy Policy
            </Link>
            <span className="text-stone-700">•</span>
            <Link href="/terms" className="hover:text-stone-300 transition">
              Terms of Service
            </Link>
            <span className="text-stone-700">•</span>
            <span className="text-stone-600">Baking Excellence Since 2001</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
