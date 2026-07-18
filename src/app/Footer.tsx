"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    
    // Poll/listen for session updates
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
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md py-5 px-4 text-center text-xs text-slate-400 font-sans tracking-wide z-40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 px-4">
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
    </footer>
  );
}
