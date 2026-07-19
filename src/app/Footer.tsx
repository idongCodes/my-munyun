"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Home, Info, LayoutDashboard, Mail } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isSplashActive, setIsSplashActive] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

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

  const handleTouchStart = (name: string) => {
    longPressTimer.current = setTimeout(() => {
      setActiveTooltip(name);
    }, 200); // triggers tooltip on long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setTimeout(() => setActiveTooltip(null), 1200); // hide tooltip after release
  };

  if (!mounted) return null;

  // On home route /, do not show while splash screen animation is active
  if (pathname === '/' && isSplashActive) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  const navItems = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'About', icon: Info, href: '/about' },
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Contact', icon: Mail, href: 'mailto:support@mymunyun.com', isExternal: true },
  ];

  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md py-6 px-4 text-center text-xs text-slate-400 font-sans tracking-wide z-40">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4 px-4">
        {/* Navigation Icons Only Row with Custom Tooltips */}
        <nav className="flex items-center justify-center gap-4 sm:gap-6 border-b border-slate-800/60 pb-4 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isTooltipVisible = activeTooltip === item.name;

            const content = (
              <div 
                className="relative group p-2 rounded-xl hover:bg-slate-900/80 transition-all cursor-pointer active:scale-95"
                onTouchStart={() => handleTouchStart(item.name)}
                onTouchEnd={handleTouchEnd}
                onMouseDown={() => handleTouchStart(item.name)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
              >
                <Icon size={24} className="text-[#397ef7] group-hover:scale-110 transition-transform" />
                
                {/* Floating Custom Tooltip */}
                <div 
                  className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg border border-[#397ef7]/40 shadow-xl transition-all duration-200 pointer-events-none whitespace-nowrap ${
                    isTooltipVisible ? 'opacity-100 scale-100 -translate-y-1' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-hover:-translate-y-1'
                  }`}
                >
                  <span>{item.name}</span>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-[#397ef7]/40 rotate-45"></div>
                </div>
              </div>
            );

            return item.isExternal ? (
              <a key={item.name} href={item.href}>
                {content}
              </a>
            ) : (
              <Link key={item.name} href={item.href}>
                {content}
              </Link>
            );
          })}
        </nav>

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
