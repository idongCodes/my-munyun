"use client";

import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0e2a5e] via-[#040c1b] to-black text-white p-6 sm:p-12 animate-login-instant">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💸</span>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-outfit tracking-tight">
              About <span className="text-[#397ef7]">My Munyun</span>
            </h1>
          </div>
          <Link 
            href="/"
            className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 px-4 py-2 rounded-full border border-slate-700/60 transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>← Back to Home</span>
          </Link>
        </header>

        {/* Hero Badge & Subtitle */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-200 tracking-[0.2em] uppercase bg-[#397ef7]/10 px-5 py-2 rounded-full border border-[#397ef7]/30 shadow-[0_0_20px_rgba(57,126,247,0.2)] inline-block">
            Your Digital Munyun Advisor 💰️
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit tracking-tight">
            Empowering Next-Gen Personal Wealth Management
          </h2>
        </div>

        {/* Main 3-Paragraph Content Box */}
        <div className="custom-card p-8 sm:p-12 border-[#397ef7]/30 shadow-[0_0_50px_rgba(57,126,247,0.2)] space-y-6 text-left">
          {/* Paragraph 1 (Expanded Homepage Intro) */}
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
            <strong className="text-white font-semibold">My Munyun</strong> is your all-in-one digital wealth advisor, designed to simplify money management by aggregating your bank accounts, income streams, recurring bills, and spending into effortless real-time insights. By consolidating multi-institution checking accounts, high-yield savings, investments, and credit cards into a single unified telemetry center, My Munyun eliminates the friction of logging into fragmented financial portals and puts complete control over your financial destiny directly in your hands.
          </p>

          {/* Paragraph 2 (Security, Plaid & Automation) */}
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
            Built upon bank-grade AES-256 encryption and read-only data protocols, My Munyun integrates seamlessly with Plaid to sync account balances, transactions, and direct deposit paychecks with zero compromise on user privacy. Our intelligent engine automatically audits incoming salary deposits, flags upcoming recurring subscription renewals before due dates, and categorizes monthly expenses so you always know exactly where every single dollar is going.
          </p>

          {/* Paragraph 3 (Vision & Wealth Building) */}
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
            Beyond tracking daily expenses, My Munyun is crafted to empower long-term wealth building and financial freedom. Whether you are setting strict monthly category budgets, building emergency savings funds, or auditing recurring bills to cut wasteful subscriptions, our digital advisor provides actionable alerts and rich visual analytics to help you reach your goals faster. Take control of your money, eliminate hidden fee drains, and build lasting wealth with My Munyun.
          </p>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-[#397ef7] uppercase tracking-wider">🔒 Bank-Grade Security</h3>
              <p className="text-xs text-slate-300 leading-relaxed">AES-256 encryption, read-only Plaid syncing, and multi-factor 2FA protection.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-[#397ef7] uppercase tracking-wider">⚡ Real-Time Insights</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Instant wealth aggregation, automated transaction categories, and salary detection.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-[#397ef7] uppercase tracking-wider">🎯 Goal & Budget Audits</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Custom monthly budget caps, subscription renewal alerts, and net worth milestones.</p>
            </div>
          </div>

          {/* Action Button Banner */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#397ef7]/10 border border-[#397ef7]/30 p-5 rounded-2xl">
            <div className="text-left space-y-1">
              <h4 className="text-sm font-bold text-white font-outfit">Ready to Take Control of Your Wealth?</h4>
              <p className="text-xs text-slate-300">Create your free account today and start tracking in minutes.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link 
                href="/register" 
                className="btn-primary text-xs font-bold py-2.5 px-5 rounded-xl shadow-md"
              >
                Get Started Free →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
