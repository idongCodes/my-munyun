"use client";

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0e2a5e] via-[#040c1b] to-black text-white p-6 sm:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💸</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit tracking-tight">
              My <span className="text-[#397ef7]">Munyun</span> Dashboard
            </h1>
          </div>
          <Link 
            href="/"
            className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 px-4 py-2 rounded-full border border-slate-700/60 transition-colors"
          >
            ← Back to Main
          </Link>
        </header>

        {/* Empty Dashboard Shell Container */}
        <section className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl border border-dashed border-slate-800/90 bg-slate-950/40 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#397ef7]/10 flex items-center justify-center text-[#397ef7] text-2xl font-bold">
            📊
          </div>
          <h2 className="text-xl font-bold text-slate-100 font-outfit">
            Dashboard Overview
          </h2>
          <p className="text-sm text-slate-400 max-w-md">
            Your wealth management and financial insights space is ready for component integration.
          </p>
        </section>
      </div>
    </main>
  );
}
