"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
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
    const interval = setInterval(checkState, 200);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  // Do not show header logo while splash screen animation is active on /
  if (pathname === '/' && isSplashActive) {
    return null;
  }

  // Dynamic top-right link text based on route
  const getAuthLink = () => {
    if (pathname === '/login') {
      return (
        <Link 
          href="/register" 
          className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900/70 hover:bg-slate-800 px-4 py-2 rounded-full border border-slate-700/60 hover:border-[#397ef7]/60 transition-all cursor-pointer shadow-md"
        >
          Register an Account
        </Link>
      );
    }
    if (pathname === '/register') {
      return (
        <Link 
          href="/login" 
          className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900/70 hover:bg-slate-800 px-4 py-2 rounded-full border border-slate-700/60 hover:border-[#397ef7]/60 transition-all cursor-pointer shadow-md"
        >
          Log in to an Account
        </Link>
      );
    }
    return null;
  };

  return (
    <header className="w-full fixed top-0 left-0 right-0 z-40 bg-slate-950/70 backdrop-blur-md border-b border-slate-800/60 py-3.5 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Global Top-Left Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2 font-extrabold font-outfit text-lg sm:text-xl tracking-tight text-white hover:opacity-90 transition-opacity group cursor-pointer"
        >
          <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">💸</span>
          <span>My <span className="text-[#397ef7]">Munyun</span></span>
        </Link>

        {/* Top-Right Context Link */}
        <div>{getAuthLink()}</div>
      </div>
    </header>
  );
}
