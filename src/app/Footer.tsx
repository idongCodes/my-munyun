"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Footer() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isSplashActive, setIsSplashActive] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkState = () => {
      if (typeof window !== 'undefined') {
        const splashActive = sessionStorage.getItem('munyun_splash_active') === 'true';
        setIsSplashActive(splashActive);
      }
    };
    checkState();
    
    // Listen for session and splash updates
    const interval = setInterval(checkState, 200);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  // On home route /, do not show while splash screen animation is active
  if (pathname === '/' && isSplashActive) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md pt-6 pb-24 px-4 text-center text-xs text-slate-400 font-sans tracking-wide z-10">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4 px-4">
        {/* Support / Donation Handles Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-slate-300 py-1">
          <span className="text-slate-400 font-normal">Keep Munyun 100% Free ☕ Support:</span>
          <a
            href="https://cash.app/$idongcodes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 px-2.5 py-1 rounded-md border border-emerald-500/40 transition-colors flex items-center gap-1 font-mono"
          >
            <span>Cash App:</span>
            <span className="font-bold">$idongcodes</span>
          </a>
          <a
            href="https://venmo.com/idongcodes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 bg-sky-950/60 hover:bg-sky-900/80 px-2.5 py-1 rounded-md border border-sky-500/40 transition-colors flex items-center gap-1 font-mono"
          >
            <span>Venmo:</span>
            <span className="font-bold">@idongcodes</span>
          </a>
          <a
            href="https://paypal.me/idongcodes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-900/80 px-2.5 py-1 rounded-md border border-blue-500/40 transition-colors flex items-center gap-1 font-mono"
          >
            <span>PayPal:</span>
            <span className="font-bold">@idongcodes</span>
          </a>
        </div>

        {/* Copyright & Creator Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2.5">
          <div className="flex items-center justify-center gap-1 flex-wrap">
            <span>&copy; {currentYear}</span>
            <span className="font-semibold text-slate-200">💸 My Munyun.</span>
            <span>All Rights Reserved.</span>
          </div>
          <div>
            Web App made by{' '}
            <a
              href="https://www.instagram.com/idongcodes/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#397ef7] hover:text-[#5fa0ff] hover:underline font-bold transition-colors"
            >
              idongcodes
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
