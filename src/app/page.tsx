"use client";

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0e2a5e] via-[#040c1b] to-black text-white p-6 sm:p-12 flex flex-col justify-between items-center overflow-hidden">
      <div className="max-w-4xl mx-auto w-full space-y-12 my-auto py-12 text-center">
        {/* Main Title Heading */}
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-outfit leading-tight flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <span>💸 My</span>
            <span className="text-[#397ef7]">Munyun</span>
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-200 tracking-[0.2em] uppercase bg-[#397ef7]/10 px-7 py-3 rounded-full shadow-[0_0_25px_rgba(57,126,247,0.25)] inline-block border border-[#397ef7]/30">
            Your Digital Munyun Advisor 💰️
          </p>
        </div>

        {/* Empty Home Page Hero Container */}
        <section className="custom-card p-10 sm:p-16 border-[#397ef7]/30 shadow-[0_0_40px_rgba(57,126,247,0.2)] max-w-2xl mx-auto flex flex-col items-center justify-center gap-6">
          <div className="w-20 h-20 rounded-full bg-[#397ef7]/10 flex items-center justify-center text-[#397ef7] text-3xl font-bold border border-[#397ef7]/30">
            🏛️
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white font-outfit">
              Welcome to My Munyun
            </h2>
            <p className="text-sm text-slate-300 max-w-md leading-relaxed">
              Your personal wealth aggregation portal. Manage your accounts, monitor budgets, and securely track transactions in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-4">
            <Link 
              href="/login" 
              className="btn-primary py-3.5 px-6 text-sm font-bold text-center block"
            >
              Log In to Portal
            </Link>
            <Link 
              href="/register" 
              className="btn-secondary py-3.5 px-6 text-sm font-bold text-center block"
            >
              Register an Account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
