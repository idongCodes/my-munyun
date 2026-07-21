"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Home, Info, LayoutDashboard, Mail } from 'lucide-react';

export default function BottomNav() {
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
    const interval = setInterval(checkState, 200);
    return () => clearInterval(interval);
  }, []);

  const handleTouchStart = (name: string) => {
    longPressTimer.current = setTimeout(() => {
      setActiveTooltip(name);
    }, 200);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setTimeout(() => setActiveTooltip(null), 1000);
  };

  if (!mounted) return null;

  // Do not show while splash screen is active on homepage
  if (pathname === '/' && isSplashActive) {
    return null;
  }

  const navItems = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'About', icon: Info, href: '/about' },
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Contact', icon: Mail, href: 'mailto:support@mymunyun.com', isExternal: true },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-login-instant select-none pointer-events-auto">
      <nav className="flex items-center justify-center gap-5 sm:gap-7 bg-slate-950/75 border border-slate-800/80 backdrop-blur-md px-6 py-2.5 rounded-full shadow-[0_15px_35px_-5px_rgba(0,0,0,0.85),0_0_25px_rgba(57,126,247,0.15)] hover:border-[#397ef7]/50 transition-all duration-300">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const isTooltipVisible = activeTooltip === item.name;

          const content = (
            <div 
              className="relative group p-2.5 rounded-full hover:bg-slate-900/60 transition-all cursor-pointer active:scale-90 flex items-center justify-center"
              onTouchStart={() => handleTouchStart(item.name)}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => handleTouchStart(item.name)}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              <Icon 
                size={22} 
                className={`transition-all duration-300 group-hover:scale-110 ${
                  isActive 
                    ? 'text-[#397ef7] filter drop-shadow-[0_0_6px_rgba(57,126,247,0.65)] scale-105' 
                    : 'text-slate-400 group-hover:text-[#397ef7]'
                }`} 
              />
              
              {/* Floating Custom Tooltip */}
              <div 
                className={`absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-extrabold py-1.5 px-3 rounded-lg border border-[#397ef7]/35 shadow-2xl transition-all duration-200 pointer-events-none whitespace-nowrap ${
                  isTooltipVisible ? 'opacity-100 scale-100 -translate-y-1' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-hover:-translate-y-1'
                }`}
              >
                <span>{item.name}</span>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-950 border-r border-b border-[#397ef7]/35 rotate-45"></div>
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
    </div>
  );
}
