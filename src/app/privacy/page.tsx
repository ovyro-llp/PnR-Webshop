import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  UserCheck,
  Server,
  HelpCircle,
  ArrowLeft,
  Mail,
  Phone,
  CheckCircle2,
} from 'lucide-react';

export const metadata = {
  title: "Privacy Policy | Puffs 'n' Rolls Nashik",
  description:
    "Learn how Puffs 'n' Rolls collects, protects, and handles your personal information for bakery orders and delivery in Nashik.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 29, 2026';

  const sections = [
    {
      id: 'collection',
      title: '1. Information We Collect',
      icon: Eye,
      content: (
        <div className="space-y-3">
          <p>
            When you browse our fresh menu, place an order, or register an account with Puffs &apos;n&apos; Rolls, we collect specific information required to prepare and deliver your bakery order:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>
              <strong>Customer Identity &amp; Contact:</strong> Your full name, mobile phone number, and optional email address for order receipts and OTP verification.
            </li>
            <li>
              <strong>Doorstep Delivery Address:</strong> Flat/house number, apartment/building name, street, landmark, area in Nashik (e.g., College Road, Nashik Road, Indira Nagar, Gangapur Road), pincode, and specific delivery instructions (e.g., doorbell instructions).
            </li>
            <li>
              <strong>Order &amp; Dietary Preferences:</strong> Items ordered, customized baking instructions (e.g., eggless preference, birthday cake inscription), and order history.
            </li>
            <li>
              <strong>Payment Metadata:</strong> Selected payment method (Cash on Delivery or Secure Online UPI/Card) and transaction reference IDs. <em>We never store credit/debit card numbers, CVVs, or bank account PINs on our servers.</em> All electronic transactions are tokenized via certified PCI-DSS compliant banking partners.
            </li>
            <li>
              <strong>Device &amp; Session Data:</strong> Technical logs such as your browser type, IP address, and local device preferences used to maintain your shopping cart across sessions and remember your nearest bakery outlet.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'usage',
      title: '2. How We Use Your Information',
      icon: UserCheck,
      content: (
        <div className="space-y-3">
          <p>Your data is used strictly to fulfill your bakery orders and elevate your customer experience:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>
              <strong>Kitchen Preparation &amp; Baking:</strong> Sending your itemized order and custom baking requests to the kitchen ovens at your chosen outlet.
            </li>
            <li>
              <strong>Express Doorstep Delivery:</strong> Sharing your delivery address, landmark, and phone number with our dedicated logistics fleet so the assigned rider can locate your doorstep.
            </li>
            <li>
              <strong>Live Order Updates:</strong> Sending real-time SMS or WhatsApp notifications when your order is confirmed, baking in the oven, dispatched, and approaching your location.
            </li>
            <li>
              <strong>Customer Support &amp; Quality Resolution:</strong> Assisting you with order modifications, dietary/allergen inquiries, or resolving delivery questions.
            </li>
            <li>
              <strong>Security &amp; Fraud Prevention:</strong> Verifying order authenticity to protect against unauthorized transactions and bot spam.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'sharing',
      title: '3. Information Sharing & Third Parties',
      icon: Lock,
      content: (
        <div className="space-y-3">
          <p>
            <strong>We respect your privacy. Puffs &apos;n&apos; Rolls will never sell, rent, trade, or lease your personal information to third-party advertisers or telemarketing companies.</strong>
          </p>
          <p>Information is disclosed solely in the following limited and necessary operational scenarios:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>
              <strong>Delivery Executives:</strong> Assigned delivery riders receive only your name, delivery address, and phone number to hand over hot bakery items at your location.
            </li>
            <li>
              <strong>Secure Payment Processors:</strong> Standard payment gateway interfaces securely process your UPI/Card payments with bank-grade 256-bit encryption.
            </li>
            <li>
              <strong>Legal &amp; Regulatory Obligations:</strong> Where required by applicable Indian laws, judicial orders, or food safety authorities (FSSAI) in response to valid legal requests.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'security',
      title: '4. Data Protection & Storage Security',
      icon: Server,
      content: (
        <div className="space-y-3">
          <p>
            We take administrative, technical, and physical measures to safeguard your personal data:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>All web traffic between your device and our servers is encrypted using modern Transport Layer Security (TLS 1.3 / HTTPS).</li>
            <li>Access to backend store terminals and customer contact lists is restricted strictly to authenticated outlet kitchen managers and dispatch supervisors via role-based access control (RBAC).</li>
            <li>Sensitive authentication tokens and customer session data are safely hashed and protected against unauthorized tampering.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'cookies',
      title: '5. Cookies & Local Storage',
      icon: FileText,
      content: (
        <div className="space-y-3">
          <p>
            Our web platform uses lightweight browser cookies and local storage tokens to provide a seamless browsing and ordering experience:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>
              <strong>Cart Persistence:</strong> Retains your selected bakery items in your basket even if you refresh or switch pages.
            </li>
            <li>
              <strong>Outlet Preference:</strong> Remembers your chosen Nashik outlet (College Road, Nashik Road, or Indira Nagar) so you see accurate local kitchen availability and stock.
            </li>
            <li>
              <strong>Authentication State:</strong> Keeps you logged into your customer profile so you do not have to re-enter your delivery address for repeat orders.
            </li>
          </ul>
          <p className="text-xs text-stone-500">
            You can configure your browser to reject cookies; however, some interactive features like live cart updates and automatic address population may not function as intended.
          </p>
        </div>
      ),
    },
    {
      id: 'rights',
      title: '6. Your Rights & Account Control',
      icon: ShieldCheck,
      content: (
        <div className="space-y-3">
          <p>As a Puffs &apos;n&apos; Rolls customer, you retain control over your information:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
            <li>
              <strong>Access &amp; Edit Addresses:</strong> You can view, add, modify, or delete your saved delivery addresses anytime by visiting the <Link href="/account" className="text-amber-800 underline font-medium">My Account</Link> dashboard.
            </li>
            <li>
              <strong>Order Records:</strong> You can review past order receipts, delivery timestamps, and items ordered directly in your account.
            </li>
            <li>
              <strong>Data Deletion Request:</strong> If you wish to permanently delete your customer account and associated saved addresses, you may send a simple request to{' '}
              <a href="mailto:care@puffsnrolls.com" className="text-stone-900 underline font-medium">
                care@puffsnrolls.com
              </a>{' '}
              with your registered phone number.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'contact',
      title: '7. Grievance Officer & Contact Details',
      icon: HelpCircle,
      content: (
        <div className="space-y-4">
          <p>
            If you have any questions, concerns, or grievances regarding this Privacy Policy or how your data is handled, please contact our Customer Care &amp; Compliance Desk:
          </p>
          <div className="bg-[#FAF8F5] border border-stone-200/90 rounded-2xl p-5 space-y-2 text-xs">
            <p className="font-bold text-stone-900 text-sm">Puffs &apos;n&apos; Rolls Bakery</p>
            <p className="text-stone-600">Grievance &amp; Customer Privacy Officer</p>
            <p className="text-stone-600">
              Shop No. 4, Shreerang Heights, Opp. BYK College, College Road, Nashik, Maharashtra – 422005
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-900 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Customer Privacy &amp; Data Protection</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-stone-500">
              Effective Date: {lastUpdated} • Applicable to Puffs &apos;n&apos; Rolls Online Store &amp; Delivery Services
            </p>
          </div>
        </div>

        {/* Commitment Banner */}
        <div className="bg-[#FAF8F5] border border-stone-200/90 rounded-3xl p-6 sm:p-7 space-y-3">
          <div className="flex items-center gap-2.5 text-stone-900 font-serif font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3>Our Privacy Promise</h3>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            At Puffs &apos;n&apos; Rolls, baking honest delicacies with pride has been our tradition since 2001. We treat your personal data with the exact same integrity: we collect only what is necessary to bake and deliver your food fresh, safeguard it with industry-standard protocols, and never sell your details to advertisers.
          </p>
        </div>

        {/* Table of Contents Quick Links */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 space-y-3">
          <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-stone-400 block">
            Contents &amp; Key Sections
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

        {/* Policy Sections */}
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

        {/* Bottom Disclaimer */}
        <div className="text-[11px] text-stone-400 border-t border-stone-200/80 pt-6 text-center">
          <p>
            This Privacy Policy was formulated in compliance with the Information Technology Act, 2000, and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
