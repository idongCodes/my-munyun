"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Info, LayoutDashboard, Mail } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkAuth = () => {
      const loggedIn = typeof window !== 'undefined' && sessionStorage.getItem('munyun_logged_in') === 'true';
      setIsLoggedIn(loggedIn);
    };
    checkAuth();
    
    // Listen for session updates
    const interval = setInterval(checkAuth, 500);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  // Do not show on /login or /register
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  // On home route /, only show when user is logged in
  if (pathname === '/' && !isLoggedIn) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md py-6 px-4 text-center text-xs text-slate-400 font-sans tracking-wide z-40">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4 px-4">
        {/* Navigation Icons Row */}
        <nav className="flex items-center justify-center gap-6 sm:gap-10 border-b border-slate-800/60 pb-4 w-full">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-all font-semibold group cursor-pointer text-xs sm:text-sm"
          >
            <Home size={16} className="group-hover:scale-110 transition-transform text-[#397ef7]" />
            <span>Home</span>
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-all font-semibold group cursor-pointer text-xs sm:text-sm"
          >
            <Info size={16} className="group-hover:scale-110 transition-transform text-[#397ef7]" />
            <span>About</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-all font-semibold group cursor-pointer text-xs sm:text-sm"
          >
            <LayoutDashboard size={16} className="group-hover:scale-110 transition-transform text-[#397ef7]" />
            <span>Dashboard</span>
          </Link>
          <a
            href="mailto:support@mymunyun.com"
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-all font-semibold group cursor-pointer text-xs sm:text-sm"
          >
            <Mail size={16} className="group-hover:scale-110 transition-transform text-[#397ef7]" />
            <span>Contact</span>
          </a>
        </nav>

        {/* Copyright & Creator Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2.5">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span>&copy; {currentYear}. All Rights Reserved.</span>
            <span className="font-semibold text-slate-200">💸 My Munyun.</span>
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
