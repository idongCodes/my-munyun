"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

const CLI_MESSAGES = [
  "initializing quantum_munyun_engine.sh ... [OK]",
  "encrypting vault with AES-256-GCM ... [OK]",
  "connecting to secure financial node ... [OK]",
  "fetching latest portfolio telemetry ... [OK]",
  "munyun digital advisor ready."
];

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [cliIndex, setCliIndex] = useState(0);

  useEffect(() => {
    // Always play splash screen animation when visiting '/'
    setShowSplash(true);
    setCliIndex(0);

    // Cycle through all 5 CLI messages over 5 seconds (1000ms per step)
    const messageInterval = setInterval(() => {
      setCliIndex((prev) => {
        if (prev < CLI_MESSAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    // Guarantee splash screen plays for at least 5 seconds (5000ms)
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(splashTimer);
    };
  }, []);

  if (showSplash) {
    return (
      <div className="fixed inset-0 h-screen min-h-screen w-screen bg-gradient-to-b from-[#0e2a5e] via-[#040c1b] to-black flex flex-col justify-center items-center z-50 animate-splash px-4 py-6 sm:p-12">
        <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 text-center max-w-lg mx-auto w-full h-full px-4 sm:px-6 py-2">
          {/* Main Title Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-outfit leading-tight px-4 py-1 mb-1 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <span>💸 My</span>
            <span className="text-[#397ef7]">Munyun</span>
          </h1>
          
          {/* Subheading Advisor Badge */}
          <div className="p-1 mb-5 sm:mb-7">
            <p className="text-xs sm:text-sm font-bold text-slate-200 tracking-[0.2em] uppercase bg-[#397ef7]/10 px-7 py-3.5 rounded-full shadow-[0_0_25px_rgba(57,126,247,0.25)] inline-block border border-[#397ef7]/30">
              Your Digital Munyun Advisor 💰️
            </p>
          </div>

          {/* Witty CLI Terminal Box */}
          <div className="w-full max-w-md bg-slate-950/95 border border-[#397ef7]/45 rounded-2xl p-4 sm:p-5 shadow-[0_0_35px_rgba(57,126,247,0.2)] text-left font-mono text-xs sm:text-sm my-2">
            <div className="flex items-center gap-2 mb-2.5 border-b border-slate-800/90 pb-2 px-1">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
              <span className="text-[10px] text-slate-400 font-sans ml-auto uppercase tracking-wider font-semibold px-1">munyun-cli v2.4</span>
            </div>
            <div className="text-[#397ef7] font-semibold flex items-center gap-2 min-h-[40px] py-2.5 px-3 sm:px-4 bg-slate-900/50 rounded-xl border border-slate-800/60 shadow-inner overflow-hidden">
              <span className="text-emerald-400 font-bold text-base px-1 flex-shrink-0">$</span>
              <span className="text-slate-100 flex-1 leading-relaxed px-1.5 break-words overflow-hidden">{CLI_MESSAGES[cliIndex]}</span>
              <span className="w-2.5 h-4 bg-[#397ef7] animate-pulse inline-block flex-shrink-0 rounded-xs mx-0.5"></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0e2a5e] via-[#040c1b] to-black text-white p-6 sm:p-12 flex flex-col justify-between items-center overflow-hidden">
      <div className="max-w-4xl mx-auto w-full space-y-12 my-auto py-12 text-center animate-login-instant">
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

        {/* Home Page Hero Container */}
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
