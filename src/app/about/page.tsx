"use client";

import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0e2a5e] via-[#040c1b] to-black text-white p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💸</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit tracking-tight">
              About <span className="text-[#397ef7]">My Munyun</span>
            </h1>
          </div>
          <Link 
            href="/"
            className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 px-4 py-2 rounded-full border border-slate-700/60 transition-colors"
          >
            ← Back to Home
          </Link>
        </header>

        {/* Content Box */}
        <div className="custom-card p-8 sm:p-10 border-[#397ef7]/30 space-y-6">
          <h2 className="text-xl font-bold text-slate-100 font-outfit">
            Next-Gen Personal Wealth Management Portal
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            My Munyun is designed to deliver a modern, secure, and intuitive financial dashboard experience. Built with bank-grade encryption, real-time transaction tracking, and customizable budget analytics.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-[#397ef7]">🔒 Bank-Grade Security</h3>
              <p className="text-xs text-slate-300">Local database encryption with multi-factor TOTP & SMS 2FA protection.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-[#397ef7]">⚡ Real-Time Insights</h3>
              <p className="text-xs text-slate-300">Instant wealth aggregation, transaction categorization, and budget tracking.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
