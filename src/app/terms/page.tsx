import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  FileText,
  UtensilsCrossed,
  AlertTriangle,
  RotateCcw,
  Truck,
  CreditCard,
  Scale,
  ShieldAlert,
  ArrowLeft,
  Mail,
  Phone,
  CheckCircle2,
} from 'lucide-react';

export const metadata = {
  title: "Terms and Conditions | Puffs 'n' Rolls Nashik",
  description:
    "Terms of service, fresh bakery order guidelines, delivery policies, and cancellation/refund terms for Puffs 'n' Rolls Nashik.",
};

export default function TermsAndConditionsPage() {
  const lastUpdated = 'October 29, 2026';

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      icon: FileText,
      content: (
        <div className="space-y-3">
          <p>
            Welcome to <strong>Puffs &apos;n&apos; Rolls</strong>. By accessing our website, browsing our menu, or placing an order for pickup or delivery from any of our Nashik bakery outlets, you agree to be bound by these Terms and Conditions (&quot;Terms&quot;) and our <Link href="/privacy" className="text-amber-800 underline font-medium">Privacy Policy</Link>.
          </p>
          <p>
            These Terms form a legally binding contract between you (the customer) and Puffs &apos;n&apos; Rolls Bakery, headquartered in Nashik, Maharashtra, India. If you do not agree with any part of these Terms, please refrain from using our online ordering services.
          </p>
        </div>
      ),
    },
    {
      id: 'products',
      title: '2. Artisanal Bakery Products & Freshness',
      icon: UtensilsCrossed,
      content: (
        <div className="space-y-3">
          <p>
            Since 2001, Puffs &apos;n&apos; Rolls has been committed to authentic, handcrafted baking. Because our puffs, rolls, breads, and celebration cakes are prepared daily by artisanal bakers:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>
              <strong>Artisanal Variation:</strong> Photographs on our storefront serve as representative previews. Handcrafted items may have slight natural variations in appearance, crust texture, or decorative chocolate garnishes.
            </li>
            <li>
              <strong>Immediate Consumption &amp; Storage:</strong> Flaky savory puffs and hot rolls are baked fresh and intended for immediate consumption. Fresh cream cakes, pastries, and mousse desserts must be refrigerated immediately upon receipt at temperatures between 2°C to 5°C.
            </li>
            <li>
              <strong>Batch Timing:</strong> Hot bakery batches are prepared in recurring cycles throughout the day. In the event of high in-store footfall, delivery estimates may adjust dynamically by 10–15 minutes.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'allergens',
      title: '3. Dietary, Allergen & Food Safety Guidelines',
      icon: AlertTriangle,
      content: (
        <div className="space-y-3">
          <p>
            We adhere to rigorous FSSAI standards and good manufacturing practices across all our bakery kitchens:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>
              <strong>Clear Vegetarian Labeling:</strong> Items are clearly designated with the green vegetarian symbol or brown/red non-vegetarian/egg symbol.
            </li>
            <li>
              <strong>Allergen Notice:</strong> Our kitchens handle common allergens including wheat (gluten), dairy products (butter, cheese, milk solids, paneer), soy, and tree nuts (almonds, cashews, walnuts in brownies and celebration cakes).
            </li>
            <li>
              <strong>Customer Discretion:</strong> While our staff follows strict separation protocols, trace cross-contact may occur. If you or any recipient has severe or life-threatening food allergies, please contact the outlet directly prior to placing your order.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'ordering',
      title: '4. Order Placement, Pricing & Sold-Out Items',
      icon: CreditCard,
      content: (
        <div className="space-y-3">
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>
              <strong>Pricing &amp; Taxes:</strong> All prices displayed on our website are in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST) unless explicitly indicated otherwise.
            </li>
            <li>
              <strong>Kitchen Acceptance:</strong> An order confirmation email/SMS indicates that your order has been transmitted to the local kitchen. Order fulfillment is subject to kitchen ingredient availability and operating hours.
            </li>
            <li>
              <strong>Sold Out (&quot;86-ed&quot;) Items:</strong> Due to unpredictable demand for daily fresh-baked batches, certain high-velocity items may occasionally sell out. If an item becomes unavailable after order placement, our store manager will contact you promptly to offer a freshly baked alternative or initiate an immediate full refund.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'delivery',
      title: '5. Doorstep Delivery & Handover Policies',
      icon: Truck,
      content: (
        <div className="space-y-3">
          <p>We deliver across designated postal areas in Nashik through dedicated delivery fleet partners:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>
              <strong>Delivery Windows:</strong> Displayed delivery ETAs (e.g. ~25–35 minutes) are estimates calculated based on kitchen prep times and local road traffic conditions.
            </li>
            <li>
              <strong>Customer Availability:</strong> The recipient must be present at the address provided and reachable via the registered phone number.
            </li>
            <li>
              <strong>Failed Delivery:</strong> Because food items are perishable, if the delivery rider cannot reach the customer after multiple phone calls and waits for more than 10 minutes at the location, the order will be considered fulfilled and non-refundable.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'cancellation',
      title: '6. Cancellation & Refund Policy',
      icon: RotateCcw,
      content: (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2">
            <p className="font-bold text-amber-900">Perishable Goods Policy Notice</p>
            <p className="text-amber-800 leading-relaxed">
              Because our bakery delicacies and celebration cakes are fresh food items prepared immediately upon receipt, strict cancellation windows apply.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-serif font-bold text-stone-900 text-sm">Cancellation Window:</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
              <li>
                <strong>Before Kitchen Baking (Order Status: RECEIVED):</strong> You may request cancellation within 3 minutes of placing the order by calling the bakery outlet helpline. In such cases, 100% refund is initiated immediately.
              </li>
              <li>
                <strong>After Preparation Begins (Order Status: PREPARING / DISPATCHED):</strong> Once items have entered the oven or packaging, orders cannot be cancelled or modified.
              </li>
            </ul>

            <h4 className="font-serif font-bold text-stone-900 text-sm pt-2">Refund Scenarios:</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
              <li>
                <strong>Damaged or Incorrect Items:</strong> If an item is received severely damaged during transit or if the wrong product was delivered, please contact us within <strong>30 minutes of delivery</strong> with photos of the damaged item and packaging.
              </li>
              <li>
                <strong>Kitchen Out of Stock:</strong> If an item cannot be prepared due to stock exhaustion, you are entitled to a full refund for that item.
              </li>
              <li>
                <strong>Refund Timelines:</strong> Approved refunds for online payments are credited back to the original payment source (UPI, debit/credit card, net banking) within <strong>3 to 5 business days</strong>, depending on your issuing bank.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'intellectual-property',
      title: '7. Intellectual Property & Brand Rights',
      icon: Scale,
      content: (
        <div className="space-y-3">
          <p>
            The &quot;Puffs &apos;n&apos; Rolls&quot; brand name, brand slogan (&quot;Where Every Bite Unrolls Happiness&quot;), visual trademarks, menus, product descriptions, recipe formulations, and website code are the exclusive intellectual property of Puffs &apos;n&apos; Rolls Bakery.
          </p>
          <p>
            Reproduction, commercial reuse, scraping, or redistribution of our materials without express written authorization is strictly prohibited.
          </p>
        </div>
      ),
    },
    {
      id: 'liability',
      title: '8. Limitation of Liability & Force Majeure',
      icon: ShieldAlert,
      content: (
        <div className="space-y-3">
          <p>
            Puffs &apos;n&apos; Rolls shall not be liable for delivery failures, delays, or quality depreciation resulting from events outside our reasonable operational control (Force Majeure), including but not limited to heavy monsoon downpours, severe traffic blockades, road closures, civil disturbances, or municipal power grid interruptions.
          </p>
          <p>
            In all cases, our maximum aggregate liability for any claim arising out of an order shall not exceed the total rupee value paid by the customer for that specific order.
          </p>
        </div>
      ),
    },
    {
      id: 'jurisdiction',
      title: '9. Governing Law & Dispute Resolution',
      icon: Scale,
      content: (
        <div className="space-y-3">
          <p>
            These Terms and any transactions conducted on our online web store shall be governed by and interpreted in accordance with the laws of the Republic of India.
          </p>
          <p>
            Any disputes, controversies, or legal claims arising out of or related to these Terms or orders placed with Puffs &apos;n&apos; Rolls shall be subject to the exclusive jurisdiction of the competent courts located in <strong>Nashik, Maharashtra, India</strong>.
          </p>
        </div>
      ),
    },
    {
      id: 'contact',
      title: '10. Bakery Helpline & Legal Communications',
      icon: Phone,
      content: (
        <div className="space-y-4">
          <p>
            For order modifications, feedback, or legal inquiries regarding these Terms, please connect with our team:
          </p>
          <div className="bg-[#FAF8F5] border border-stone-200/90 rounded-2xl p-5 space-y-2 text-xs">
            <p className="font-bold text-stone-900 text-sm">Puffs &apos;n&apos; Rolls Bakery Headquarters</p>
            <p className="text-stone-600">Legal &amp; Customer Relations Department</p>
            <p className="text-stone-600">
              Shop No. 4, Shreerang Heights, Opp. BYK College, College Road, Nashik – 422005, Maharashtra, India
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 text-stone-800 font-medium">
              <a href="tel:+919423639911" className="flex items-center gap-1.5 hover:text-amber-700">
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                +91 94236 39911
              </a>
              <span className="hidden sm:inline text-stone-300">•</span>
              <a href="mailto:care@puffsnrolls.com" className="flex items-center gap-1.5 hover:text-amber-700">
                <Mail className="w-3.5 h-3.5 text-stone-500" />
                care@puffsnrolls.com
              </a>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCFB]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8 flex-1 w-full">
        {/* Back Link & Header */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Storefront</span>
          </Link>

          <div className="border-b border-stone-200/80 pb-6 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-800 text-[11px] font-semibold">
              <FileText className="w-3.5 h-3.5 text-stone-600" />
              <span>Customer Agreement &amp; Operating Policies</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
              Terms &amp; Conditions
            </h1>
            <p className="text-xs sm:text-sm text-stone-500">
              Effective Date: {lastUpdated} • Governing all online bakery orders and fulfillment across Nashik
            </p>
          </div>
        </div>

        {/* Highlight Callout */}
        <div className="bg-[#FAF8F5] border border-stone-200/90 rounded-3xl p-6 sm:p-7 space-y-3">
          <div className="flex items-center gap-2.5 text-stone-900 font-serif font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-amber-700" />
            <h3>Fresh Food &amp; Artisanal Bakery Agreement</h3>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Please read these terms carefully before placing your order. They outline our handcrafted food standards, kitchen preparation processes, cancellation cutoffs, and delivery handover guarantees.
          </p>
        </div>

        {/* Quick Links Table of Contents */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 space-y-3">
          <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-stone-400 block">
            Table of Contents
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {sections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="text-stone-700 hover:text-amber-800 hover:underline flex items-center gap-1.5 transition"
              >
                <span className="text-stone-300">•</span>
                <span>{sec.title}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <section
                key={sec.id}
                id={sec.id}
                className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 space-y-4 scroll-mt-24 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
                    {sec.title}
                  </h2>
                </div>

                <div className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                  {sec.content}
                </div>
              </section>
            );
          })}
        </div>

        {/* Legal Disclaimer Note */}
        <div className="text-[11px] text-stone-400 border-t border-stone-200/80 pt-6 text-center">
          <p>
            Puffs &apos;n&apos; Rolls reserves the right to amend these terms at any time. Continued use of the website or ordering services constitutes acceptance of the modified terms.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
