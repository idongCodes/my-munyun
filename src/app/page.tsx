"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  useEffect(() => {
    // Start fading out at 2.7s so the animation completes at 3.0s
    const fadeTimer = setTimeout(() => {
      setFadeSplash(true);
    }, 2700);

    // Completely remove splash screen at 3.0s
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center overflow-x-hidden font-sans">
      {/* Splash Screen */}
      {showSplash && (
        <div
          className={`fixed inset-0 bg-black flex flex-col items-center justify-center z-50 transition-all duration-300 ease-out ${
            fadeSplash ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
          }`}
        >
          <div className="flex flex-col items-center text-center px-6">
            <h1 className="text-5xl font-extrabold tracking-tight mb-4 animate-pulse bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              💸 My Munyun
            </h1>
            <p className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">
              Your Digital Munyun Advisor 💰️
            </p>
            <div className="mt-8 flex gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce delay-100"></span>
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-200"></span>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce delay-300"></span>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Portal Wrapper (Mobile First) */}
      <div className="w-full max-w-md min-h-screen bg-zinc-950 flex flex-col shadow-2xl border-x border-zinc-900">
        <header className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            💸 My Munyun
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400">
            v2.0
          </span>
        </header>

        <main className="flex-1 p-6 flex flex-col justify-center items-center text-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Welcome to Munyun</h2>
            <p className="text-sm text-zinc-400 max-w-xs mx-auto">
              Your secure, intelligent personal finance assistant. Keep track of transaction ledgers, active budgets, and Cash App transfers.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
