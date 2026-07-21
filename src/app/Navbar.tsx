"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSplashActive, setIsSplashActive] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkState = () => {
      if (typeof window !== 'undefined') {
        const splashActive = sessionStorage.getItem('munyun_splash_active') === 'true';
        setIsSplashActive(splashActive);

        const loggedIn = sessionStorage.getItem('munyun_logged_in') === 'true';
        setIsLoggedIn(loggedIn);
      }
    };
    checkState();
    const interval = setInterval(checkState, 200);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('munyun_logged_in');
      sessionStorage.removeItem('munyun_login_time');
      router.push('/login');
    }
  };

  if (!mounted) return null;

  // Do not show header logo while splash screen animation is active on /
  if (pathname === '/' && isSplashActive) {
    return null;
  }

  // Dynamic top-right link controls based on session state
  const getAuthLink = () => {
    if (isLoggedIn) {
      return (
        <button 
          onClick={handleLogout}
          className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900/70 hover:bg-red-500/10 px-4 py-2 rounded-full border border-slate-700/60 hover:border-red-500/40 transition-all cursor-pointer shadow-md flex items-center gap-1.5"
        >
          <LogOut size={13} className="text-red-400" />
          <span>Logout</span>
        </button>
      );
    }

    return (
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold bg-slate-900/80 p-1 rounded-full border border-slate-800 shadow-md">
        <Link 
          href="/login" 
          className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
            pathname === '/login' 
              ? 'bg-[#397ef7] text-white shadow-sm' 
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          Login
        </Link>
        <span className="text-slate-600 font-light">|</span>
        <Link 
          href="/register" 
          className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
            pathname === '/register' 
              ? 'bg-[#397ef7] text-white shadow-sm' 
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          Register
        </Link>
      </div>
    );
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
