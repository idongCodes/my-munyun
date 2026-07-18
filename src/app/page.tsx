"use client";

import { useEffect, useState, useMemo } from 'react';
import { 
  Lock, RefreshCw, Key, Shield, User, FileText, CheckCircle, 
  XCircle, Smartphone, AlertCircle, Edit, Trash2, LayoutDashboard,
  LogOut, Plus, ChevronRight, Info, Search, HelpCircle, Settings
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  Income: '#10b981',
  Groceries: '#3b82f6',
  Dining: '#f59e0b',
  Subscriptions: '#8b5cf6',
  Transfers: '#ec4899',
  Shopping: '#06b6d4',
  Utilities: '#6b7280',
  Travel: '#14b8a6',
  Other: '#f43f5e',
  Uncategorized: '#9ca3af'
};

const CLI_MESSAGES = [
  "initializing quantum_munyun_engine.sh ... [OK]",
  "establishing encrypted link to BofA mainframe ... [CONNECTED]",
  "scanning cash app transaction frequency ... [SECURE]",
  "calculating inflation defense matrix ... [99.9% SHIELD]",
  "compiling digital munyun ledger ... [READY]"
];

export default function Home() {
  // Splash screen state
  const [isSplashActive, setIsSplashActive] = useState(true);
  const [cliIndex, setCliIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginTime, setLoginTime] = useState<string | null>(null);

  // Auth form states
  const [authMethod, setAuthMethod] = useState<'passcode' | 'totp' | 'sms'>('passcode');
  const [passcode, setPasscode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [smsDemoCode, setSmsDemoCode] = useState<string | null>(null);
  
  // 2FA Setup states
  const [isSettingUpTotp, setIsSettingUpTotp] = useState(false);
  const [totpSetupSecret, setTotpSetupSecret] = useState('');
  const [totpSetupQr, setTotpSetupQr] = useState('');
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [totpSetupSuccess, setTotpSetupSuccess] = useState(false);

  // Feedback/Error messages
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // Dashboard states
  const [status, setStatus] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'cashapp' | 'budgets'>('overview');
  
  // Ledger Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [institutionFilter, setInstitutionFilter] = useState('All');

  // Edit Transaction State
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Sidebar Budget form state
  const [budgetFormCat, setBudgetFormCat] = useState('Groceries');
  const [budgetFormLimit, setBudgetFormLimit] = useState(200);

  // Sync / Action loadings
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Session Load and Restore
  useEffect(() => {
    // Check sessionStorage
    try {
      const storedLoggedIn = sessionStorage.getItem('munyun_logged_in') === 'true';
      const storedLoginTime = sessionStorage.getItem('munyun_login_time');
      
      if (storedLoggedIn && storedLoginTime) {
        const loginDate = new Date(storedLoginTime);
        const elapsedSeconds = (Date.now() - loginDate.getTime()) / 1000;
        
        if (elapsedSeconds <= 72 * 3600) {
          setIsLoggedIn(true);
          setLoginTime(storedLoginTime);
          setIsSplashActive(false); // Skip splash on session restore
        } else {
          sessionStorage.removeItem('munyun_logged_in');
          sessionStorage.removeItem('munyun_login_time');
        }
      }
    } catch (e) {
      console.error("Error reading sessionStorage:", e);
    }
    
    // Standard splash timeout if not restored (extended to 6s)
    const timer = setTimeout(() => {
      setIsSplashActive(false);
    }, 6000);
    
    return () => clearTimeout(timer);
  }, []);

  // Witty CLI rotator effect on splash screen (rotates every 1.1s)
  useEffect(() => {
    if (!isSplashActive) return;
    const interval = setInterval(() => {
      setCliIndex((prev) => (prev + 1) % CLI_MESSAGES.length);
    }, 1100);
    return () => clearInterval(interval);
  }, [isSplashActive]);

  // Fetch Dashboard data once logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboardData();
    }
  }, [isLoggedIn]);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch system status
      const resStatus = await fetch('/api/status');
      const dataStatus = await resStatus.json();
      setStatus(dataStatus);

      // 2. Fetch transactions and accounts
      const resTxs = await fetch('/api/transactions');
      const dataTxs = await resTxs.json();
      setTransactions(dataTxs.transactions || []);
      setAccounts(dataTxs.accounts || []);

      // 3. Fetch budgets
      const resBudgets = await fetch('/api/budgets');
      const dataBudgets = await resBudgets.json();
      setBudgets(dataBudgets || {});
    } catch (e) {
      console.error("Error fetching dashboard data:", e);
    }
  };

  // --- Calculations for Overview Analytics (Hooks must be called unconditionally at top) ---
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + (acc.balance_available ?? acc.balance_current ?? 0), 0);
  }, [accounts]);

  const bofABalance = useMemo(() => {
    return accounts
      .filter(acc => acc.institution === "Bank of America")
      .reduce((sum, acc) => sum + (acc.balance_available ?? acc.balance_current ?? 0), 0);
  }, [accounts]);

  const cashAppBalance = useMemo(() => {
    return accounts
      .filter(acc => acc.institution.includes("Cash App"))
      .reduce((sum, acc) => sum + (acc.balance_available ?? acc.balance_current ?? 0), 0);
  }, [accounts]);

  // Expenses data calculation for Pie Chart
  const expenseSummary = useMemo(() => {
    const expenses = transactions.filter(t => t.amount > 0 && t.category !== 'Income');
    const categoriesMap: Record<string, number> = {};
    let totalExpensesSum = 0;

    expenses.forEach(t => {
      const cat = t.category || 'Uncategorized';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + t.amount;
      totalExpensesSum += t.amount;
    });

    const slices = Object.entries(categoriesMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpensesSum > 0 ? amount / totalExpensesSum : 0,
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS.Other
    })).sort((a, b) => b.amount - a.amount);

    return { slices, totalExpensesSum };
  }, [transactions]);

  // Balance history calculation for Spline Line Chart
  const balanceHistory = useMemo(() => {
    if (transactions.length === 0) return [];
    
    // Sort transactions chronologically
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Group transactions by date
    const dailyMap: Record<string, number> = {};
    sorted.forEach(t => {
      const dateStr = t.date;
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) - t.amount;
    });

    const dailyChanges = Object.entries(dailyMap).map(([date, change]) => ({
      date,
      change
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Back-calculate historical balances starting from the current total balance
    const history: { date: string; balance: number }[] = [];
    let currentCalc = totalBalance;
    
    // Process backwards to calculate the previous points
    for (let i = dailyChanges.length - 1; i >= 0; i--) {
      history.unshift({
        date: dailyChanges[i].date,
        balance: currentCalc
      });
      currentCalc -= dailyChanges[i].change;
    }

    return history;
  }, [transactions, totalBalance]);

  // Filtered transactions for Ledger
  const filteredTxs = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (t.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
      const matchesInstitution = institutionFilter === 'All' || t.institution === institutionFilter;
      return matchesSearch && matchesCategory && matchesInstitution;
    });
  }, [transactions, searchQuery, categoryFilter, institutionFilter]);

  // Cash App transaction lists and flows
  const cashAppTxs = useMemo(() => {
    return transactions.filter(t => t.institution.includes("Cash App"));
  }, [transactions]);

  const cashAppFlow = useMemo(() => {
    let sent = 0;
    let received = 0;
    cashAppTxs.forEach(t => {
      if (t.amount > 0) {
        sent += t.amount;
      } else {
        received += Math.abs(t.amount);
      }
    });
    return { sent, received, net: received - sent };
  }, [cashAppTxs]);

  // Dropdown list contents for ledger filters
  const uniqueCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [transactions]);

  const uniqueInstitutions = useMemo(() => {
    const insts = new Set(transactions.map(t => t.institution).filter(Boolean));
    return ['All', ...Array.from(insts)];
  }, [transactions]);

  // Auth submission handlers
  const handlePasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'passcode', passcode })
      });
      const data = await res.json();
      if (data.success) {
        completeLogin();
      } else {
        setAuthError(data.message || 'Invalid passcode');
      }
    } catch (err) {
      setAuthError('Server authentication failed.');
    }
  };

  const handleTotpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'totp_login', code: totpCode })
      });
      const data = await res.json();
      if (data.success) {
        completeLogin();
      } else {
        setAuthError(data.message || 'Invalid 2FA code');
      }
    } catch (err) {
      setAuthError('2FA validation failed.');
    }
  };

  const handleSmsRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sms_send', phone })
      });
      const data = await res.json();
      if (data.success) {
        setSmsSent(true);
        if (data.demoMode) {
          setSmsDemoCode(data.code);
          setAuthSuccessMsg(`[DEMO MODE] SMS Code generated: ${data.code}`);
        } else {
          setAuthSuccessMsg("Verification code sent successfully via SMS!");
        }
      } else {
        setAuthError(data.message || 'Failed to send SMS');
      }
    } catch (err) {
      setAuthError('Twilio request failed.');
    }
  };

  const handleSmsVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sms_verify', code: smsCode })
      });
      const data = await res.json();
      if (data.success) {
        setSmsSent(false);
        setSmsDemoCode(null);
        setAuthSuccessMsg('');
        completeLogin();
      } else {
        setAuthError(data.message || 'Incorrect verification code');
      }
    } catch (err) {
      setAuthError('SMS verification failed.');
    }
  };

  const handleSetupTotpStart = async () => {
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'totp_setup' })
      });
      const data = await res.json();
      if (data.success) {
        setTotpSetupSecret(data.secret);
        const provisioningUri = encodeURIComponent(data.qrProvisioningUri);
        setTotpSetupQr(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${provisioningUri}&color=4e80e4&bgcolor=000000`);
        setIsSettingUpTotp(true);
      }
    } catch (err) {
      setAuthError('Failed to trigger 2FA setup.');
    }
  };

  const handleSetupTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'totp_verify', code: totpVerifyCode, secret: totpSetupSecret })
      });
      const data = await res.json();
      if (data.success) {
        setTotpSetupSuccess(true);
      } else {
        setAuthError(data.message || 'Invalid validation code');
      }
    } catch (err) {
      setAuthError('2FA validation failed.');
    }
  };

  const completeLogin = () => {
    const timeIso = new Date().toISOString();
    sessionStorage.setItem('munyun_logged_in', 'true');
    sessionStorage.setItem('munyun_login_time', timeIso);
    setIsLoggedIn(true);
    setLoginTime(timeIso);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('munyun_logged_in');
    sessionStorage.removeItem('munyun_login_time');
    setIsLoggedIn(false);
    setLoginTime(null);
    setPasscode('');
    setTotpCode('');
    setSmsCode('');
  };

  // Plaid linking simulator (demo links)
  const handleLinkInstitution = async (inst: string) => {
    try {
      const resLink = await fetch('/api/create_link_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institution: inst })
      });
      const dataLink = await resLink.json();

      if (dataLink.link_token === "mock_link_token") {
        await fetch('/api/exchange_public_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token: 'mock_public_token', institution: inst })
        });
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Linking error:", err);
    }
  };

  // Sync operations
  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/sync', { method: 'POST' });
      await fetchDashboardData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to disconnect all accounts and delete all transaction log entries?")) {
      setIsClearing(true);
      try {
        await fetch('/api/clear', { method: 'POST' });
        await fetchDashboardData();
      } catch (e) {
        console.error(e);
      } finally {
        setIsClearing(false);
      }
    }
  };

  // Budgets Sidebar submission
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: budgetFormCat, limit_amount: budgetFormLimit })
      });
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  // Transaction Edit submission
  const handleUpdateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTx.id, category: editCategory, notes: editNotes })
      });
      setEditingTx(null);
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  // SVG Area Chart drawing helper
  const drawAreaChart = () => {
    if (balanceHistory.length < 2) return null;
    const width = 600;
    const height = 220;
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 30;

    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    const balances = balanceHistory.map(h => h.balance);
    const maxBal = Math.max(...balances, 1000);
    const minBal = Math.min(...balances, 0);
    const balRange = maxBal - minBal || 1;

    const points = balanceHistory.map((h, i) => {
      const x = paddingLeft + (i / (balanceHistory.length - 1)) * graphWidth;
      const y = paddingTop + graphHeight - ((h.balance - minBal) / balRange) * graphHeight;
      return { x, y, date: h.date, val: h.balance };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`;

    const gridLines = [];
    for (let i = 0; i <= 4; i++) {
      const yVal = minBal + (i / 4) * balRange;
      const y = paddingTop + graphHeight - (i / 4) * graphHeight;
      gridLines.push({ y, value: yVal });
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="220" className="overflow-visible">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#397ef7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#397ef7" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {gridLines.map((line, i) => (
          <g key={i}>
            <line 
              x1={paddingLeft} 
              y1={line.y} 
              x2={width - paddingRight} 
              y2={line.y} 
              stroke="rgba(255,255,255,0.08)" 
              strokeWidth="1" 
            />
            <text 
              x={paddingLeft - 8} 
              y={line.y + 4} 
              fill="#cbd5e1" 
              fontSize="10" 
              textAnchor="end"
            >
              ${Math.round(line.value).toLocaleString()}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke="#397ef7" strokeWidth="2" strokeLinecap="round" />

        {points.length > 1 && [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]].map((p, idx) => (
          <text
            key={idx}
            x={p.x}
            y={height - 8}
            fill="#cbd5e1"
            fontSize="10"
            textAnchor={idx === 0 ? "start" : idx === 2 ? "end" : "middle"}
          >
            {new Date(p.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
          </text>
        ))}
      </svg>
    );
  };

  // SVG Doughnut Chart drawing helper
  const drawDoughnutChart = () => {
    if (expenseSummary.totalExpensesSum === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-slate-300">
          <HelpCircle size={32} className="mb-2 text-[#397ef7]" />
          <p className="text-sm font-semibold">No expenses in this period</p>
        </div>
      );
    }

    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    return (
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-44 h-44 flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
            {expenseSummary.slices.map((slice, idx) => {
              const dasharray = `${(slice.percentage * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
              const dashoffset = accumulatedOffset.toFixed(2);
              accumulatedOffset -= slice.percentage * circumference;
              
              return (
                <circle
                  key={idx}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth="12"
                  strokeDasharray={dasharray}
                  strokeDashoffset={dashoffset}
                  className="transition-all duration-300 hover:stroke-[15px] cursor-pointer"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs uppercase text-slate-300 font-bold tracking-wider">Total Spent</span>
            <span className="text-lg font-bold text-white">${expenseSummary.totalExpensesSum.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="flex-1 space-y-2 max-h-48 overflow-y-auto w-full pr-2">
          {expenseSummary.slices.map((slice, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }}></span>
                <span className="text-slate-200 font-medium">{slice.category}</span>
              </div>
              <span className="text-white font-bold">
                ${slice.amount.toFixed(2)} ({(slice.percentage * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- Render Splash Screen (Conditional Return AFTER all hooks) ---
  if (isSplashActive) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col justify-center items-center z-50 animate-splash p-6 sm:p-12">
        <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full">
          {/* Main Title Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-outfit leading-tight mb-6 sm:mb-8">
            💸 My <span className="text-[#397ef7]">Munyun</span>
          </h1>
          
          {/* Subheading Advisor Badge */}
          <div className="my-5 sm:my-7">
            <p className="text-xs sm:text-sm font-bold text-slate-200 tracking-[0.2em] uppercase bg-[#397ef7]/10 px-7 py-3 rounded-full border border-[#397ef7]/35 shadow-[0_0_25px_rgba(57,126,247,0.25)] inline-block">
              Your Digital Munyun Advisor 💰️
            </p>
          </div>

          {/* Witty CLI Terminal Box */}
          <div className="w-full max-w-md bg-slate-950/95 border border-[#397ef7]/45 rounded-2xl p-5 sm:p-6 shadow-[0_0_35px_rgba(57,126,247,0.2)] text-left font-mono text-xs sm:text-sm mt-8 sm:mt-12">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-800/90 pb-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
              <span className="text-[10px] text-slate-400 font-sans ml-auto uppercase tracking-wider font-semibold">munyun-cli v2.4</span>
            </div>
            <div className="text-[#397ef7] font-semibold flex items-center gap-2.5 min-h-[42px] px-1">
              <span className="text-emerald-400 font-bold text-base">$</span>
              <span className="text-slate-100 flex-1 leading-relaxed">{CLI_MESSAGES[cliIndex]}</span>
              <span className="w-2 h-4 bg-[#397ef7] animate-pulse inline-block rounded-xs"></span>
            </div>
          </div>
        </div>
      </div>
    );
  }




  // --- Render Auth Screens ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-login-instant">
          <div className="text-center mb-8">
            <div className="text-4xl font-extrabold tracking-tight text-white mb-2 font-outfit">
              💸 My <span className="text-[#397ef7]">Munyun</span>
            </div>
            <div className="text-xs uppercase tracking-widest text-slate-300 font-bold">
              Secure Wealth Portal
            </div>
          </div>

          <div className="custom-card relative overflow-hidden border-[#397ef7]/30 shadow-[0_0_30px_rgba(57,126,247,0.15)]">
            {/* SETUP TOTP WIZARD */}
            {isSettingUpTotp ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2 text-xl font-bold text-white">
                  <Lock className="text-[#397ef7]" />
                  <span>Setup 2FA (Google Authenticator)</span>
                </div>
                
                <p className="text-xs text-slate-200">
                  Scan the QR code below using your Google Authenticator app on your phone, then enter the verification code.
                </p>

                {totpSetupQr && (
                  <div className="flex flex-col items-center py-4 bg-zinc-950/80 rounded-xl border border-zinc-800">
                    <img src={totpSetupQr} alt="QR Code" className="border-4 border-zinc-800 rounded-xl mb-4" />
                    <code className="text-xs bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-700 text-[#397ef7] font-mono font-bold">
                      Secret Key: {totpSetupSecret}
                    </code>
                  </div>
                )}

                {totpSetupSuccess ? (
                  <div className="space-y-4">
                    <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-xl text-xs flex gap-2">
                      <CheckCircle className="flex-shrink-0" />
                      <div>
                        <strong className="text-white">Google Authenticator verification successful!</strong>
                        <p className="mt-1 text-slate-200">Add this variable to your .env file or deployment configuration:</p>
                        <pre className="mt-1 bg-black/80 p-2 rounded-lg border border-emerald-500/30 text-emerald-300 select-all font-mono">
                          TOTP_SECRET={totpSetupSecret}
                        </pre>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setIsSettingUpTotp(false);
                        setTotpSetupSuccess(false);
                        completeLogin();
                      }}
                      className="btn-primary w-full"
                    >
                      Proceed to Dashboard
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSetupTotpVerify} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase font-bold text-slate-200 mb-2">
                        Enter 6-digit Verification Code
                      </label>
                      <input 
                        type="text" 
                        placeholder="000 000" 
                        value={totpVerifyCode}
                        onChange={(e) => setTotpVerifyCode(e.target.value)}
                        className="form-input text-center tracking-widest text-lg font-bold" 
                      />
                    </div>
                    
                    {authError && (
                      <div className="bg-rose-950/40 border border-rose-500/40 text-rose-300 p-3 rounded-xl text-xs flex gap-2">
                        <AlertCircle className="flex-shrink-0" size={16} />
                        <span>{authError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsSettingUpTotp(false);
                          setAuthError('');
                        }}
                        className="btn-secondary w-full"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary w-full">
                        Verify & Activate
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* REGULAR LOGIN FLOW */
              <div className="space-y-6">
                {/* Method selector */}
                <div className="space-y-2">
                  <label className="block text-xs uppercase font-bold text-slate-200">
                    Authentication Method
                  </label>
                  <select 
                    value={authMethod}
                    onChange={(e) => {
                      setAuthMethod(e.target.value as any);
                      setAuthError('');
                      setAuthSuccessMsg('');
                    }}
                    className="form-input cursor-pointer"
                  >
                    <option value="passcode">Passcode Login</option>
                    <option value="totp">Authenticator Code</option>
                    <option value="sms">SMS Verification</option>
                  </select>
                </div>

                {/* Flow 1: Passcode */}
                {authMethod === 'passcode' && (
                  <form onSubmit={handlePasscodeLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs uppercase font-bold text-slate-200">
                        Passcode
                      </label>
                      <input 
                        type="password" 
                        placeholder="••••" 
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        className="form-input text-center text-xl tracking-widest" 
                      />
                    </div>
                    <button type="submit" className="btn-primary w-full">
                      Authenticate
                    </button>
                  </form>
                )}

                {/* Flow 2: TOTP */}
                {authMethod === 'totp' && (
                  <form onSubmit={handleTotpLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs uppercase font-bold text-slate-200">
                        Google Authenticator Code
                      </label>
                      <input 
                        type="text" 
                        placeholder="000 000" 
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value)}
                        className="form-input text-center text-lg tracking-widest font-bold" 
                      />
                    </div>
                    <button type="submit" className="btn-primary w-full">
                      Unlock Portal
                    </button>
                  </form>
                )}

                {/* Flow 3: SMS */}
                {authMethod === 'sms' && (
                  <div className="space-y-4">
                    {!smsSent ? (
                      <form onSubmit={handleSmsRequest} className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-xs uppercase font-bold text-slate-200">
                            Phone Number
                          </label>
                          <input 
                            type="text" 
                            placeholder="+1 (774) 312 6471" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="form-input" 
                          />
                        </div>
                        <button type="submit" className="btn-primary w-full">
                          Send Code
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleSmsVerify} className="space-y-4">
                        <div className="space-y-2 text-xs text-slate-200">
                          Code sent to <strong className="text-white">{phone}</strong>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs uppercase font-bold text-slate-200">
                            Enter 6-digit SMS Code
                          </label>
                          <input 
                            type="text" 
                            placeholder="000 000" 
                            value={smsCode}
                            onChange={(e) => setSmsCode(e.target.value)}
                            className="form-input text-center text-lg tracking-widest font-bold" 
                          />
                        </div>
                        <button type="submit" className="btn-primary w-full">
                          Unlock Portal
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            setSmsSent(false);
                            setSmsCode('');
                            setSmsDemoCode(null);
                            setAuthSuccessMsg('');
                          }}
                          className="btn-secondary w-full"
                        >
                          Resend Code / Change Number
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Feedback messages */}
                {authError && (
                  <div className="bg-rose-950/40 border border-rose-500/40 text-rose-300 p-3.5 rounded-xl text-xs flex gap-2">
                    <AlertCircle className="flex-shrink-0" size={16} />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccessMsg && (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-xl text-xs flex gap-2">
                    <CheckCircle className="flex-shrink-0" size={16} />
                    <span>{authSuccessMsg}</span>
                  </div>
                )}

                {/* TOTP Setup Button */}
                {authMethod === 'passcode' && (
                  <div className="border-t border-zinc-800 pt-4 flex flex-col items-center">
                    <span className="text-xs text-slate-300 font-semibold mb-3">or</span>
                    <button 
                      onClick={handleSetupTotpStart}
                      className="btn-secondary w-full text-xs py-2"
                    >
                      🛡️ Setup Google Authenticator 2FA
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="text-center mt-6 text-xs text-slate-300 tracking-wider font-semibold">
            PROTECTED BY AES-256 LOCAL DATABASE ENCRYPTION.
          </div>
        </div>
      </div>
    );
  }

  // --- Render Dashboard App ---
  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row">
      {/* MOBILE TOP HEADER BAR */}
      <div className="md:hidden flex items-center justify-between p-4 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl">💸</span>
          <span className="text-xl font-extrabold text-white font-outfit">
            My <span className="text-[#397ef7]">Munyun</span>
          </span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 font-bold"
        >
          {isMobileMenuOpen ? "Close Menu ✕" : "Controls ⚙️"}
        </button>
      </div>

      {/* SIDEBAR / CONTROL PANEL */}
      <aside className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-800 p-4 sm:p-6 flex flex-col flex-shrink-0 z-30 transition-all`}>
        <div className="hidden md:block text-left mb-6">
          <div className="text-2xl font-extrabold tracking-tight text-white mb-1 font-outfit">
            💸 My <span className="text-[#397ef7]">Munyun</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-300 font-bold">
            Personal Wealth Aggregator
          </div>
        </div>

        <hr className="border-zinc-800 my-4 hidden md:block" />

        {/* Plaid connection badges */}
        <div className="space-y-4 my-2">
          <div className="text-xs uppercase text-slate-300 font-bold tracking-wider">
            Connection Status
          </div>
          {status && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-medium">Bank of America:</span>
                {status.use_mock_data ? (
                  <span className="badge-demo">DEMO MODE</span>
                ) : status.boa_linked ? (
                  <span className="badge-linked">✓ LINKED</span>
                ) : (
                  <span className="badge-unlinked">✗ NOT LINKED</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-medium">Cash App:</span>
                {status.use_mock_data ? (
                  <span className="badge-demo">DEMO MODE</span>
                ) : status.cashapp_linked ? (
                  <span className="badge-linked">✓ LINKED</span>
                ) : (
                  <span className="badge-unlinked">✗ NOT LINKED</span>
                )}
              </div>
            </div>
          )}
        </div>

        <hr className="border-zinc-800 my-4" />

        {/* Actions */}
        <div className="space-y-3">
          <div className="text-xs uppercase text-slate-300 font-bold tracking-wider mb-1">
            Actions
          </div>
          
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleSyncData();
            }}
            disabled={isSyncing}
            className="btn-secondary w-full text-xs py-2 flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin text-[#397ef7]" : "text-[#397ef7]"} />
            <span>{isSyncing ? "Syncing..." : "Sync Account Data"}</span>
          </button>

          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleClearAll();
            }}
            disabled={isClearing}
            className="btn-danger w-full text-xs py-2 flex items-center justify-center gap-2"
          >
            <Trash2 size={14} />
            <span>{isClearing ? "Clearing..." : "Disconnect & Clear"}</span>
          </button>
        </div>

        <hr className="border-zinc-800 my-4" />

        {/* Manage Budgets Form */}
        <div className="space-y-3">
          <div className="text-xs uppercase text-slate-300 font-bold tracking-wider mb-1">
            Manage Budgets
          </div>
          <form onSubmit={(e) => {
            handleSaveBudget(e);
            setIsMobileMenuOpen(false);
          }} className="space-y-2">
            <select 
              value={budgetFormCat}
              onChange={(e) => setBudgetFormCat(e.target.value)}
              className="form-input text-xs py-2"
            >
              <option value="Groceries">Groceries</option>
              <option value="Dining">Dining</option>
              <option value="Subscriptions">Subscriptions</option>
              <option value="Transfers">Transfers</option>
              <option value="Shopping">Shopping</option>
              <option value="Utilities">Utilities</option>
              <option value="Travel">Travel</option>
            </select>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-300 font-bold">$</span>
              <input 
                type="number"
                value={budgetFormLimit}
                onChange={(e) => setBudgetFormLimit(Number(e.target.value))}
                placeholder="Monthly Limit" 
                className="form-input text-xs py-2 pl-6"
                min="0"
                step="10"
              />
            </div>
            <button type="submit" className="btn-primary w-full text-xs py-2">
              Save Budget
            </button>
          </form>
        </div>

        {/* Push to bottom push logout */}
        <div className="mt-6 md:mt-auto pt-4 border-t border-zinc-800 md:border-t-0">
          <button 
            onClick={handleLogout}
            className="btn-secondary w-full text-xs py-2 flex items-center justify-center gap-2 text-rose-400 hover:text-rose-300"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT VIEW */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto min-h-screen">
        {/* Link account dashboard helper if empty */}
        {accounts.length === 0 ? (
          <div className="max-w-4xl mx-auto space-y-8 py-6 sm:py-10">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#397ef7] via-white to-slate-200 mb-2">
                Link Your Financial Accounts
              </h1>
              <p className="text-slate-200 text-sm">
                To get started, securely link your Bank of America and Cash App accounts via Plaid.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="custom-card flex flex-col justify-between border-[#397ef7]/30">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <span>🏦</span> Bank of America
                  </h3>
                  <p className="text-xs text-slate-200 mb-6">
                    Connect your checking and savings accounts to sync balances and transactions automatically.
                  </p>
                </div>
                <button 
                  onClick={() => handleLinkInstitution('boa')}
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  🔌 Connect Bank of America (Demo Link)
                </button>
              </div>

              <div className="custom-card flex flex-col justify-between border-[#397ef7]/30">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <span>📱</span> Cash App Balance
                  </h3>
                  <p className="text-xs text-slate-200 mb-6">
                    Connect your Cash App account using Lincoln Savings Bank or Sutton Bank account details to monitor peer-to-peer transfers.
                  </p>
                </div>
                <button 
                  onClick={() => handleLinkInstitution('cashapp')}
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  🔌 Connect Cash App (Demo Link)
                </button>
              </div>
            </div>

            <hr className="border-zinc-800" />
            <div className="text-xs text-slate-300 flex items-center gap-2 justify-center">
              <Info size={14} className="text-[#397ef7]" />
              <span>💡 <em className="text-slate-200">Note: If you just want to evaluate the app, set USE_MOCK_DATA=True in your config.</em></span>
            </div>
          </div>
        ) : (
          /* REGULAR DASHBOARD RENDER */
          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#397ef7] via-white to-slate-200">
                Munyun Financial Control
              </h1>
            </div>

            {/* TAB CONTAINER */}
            <div className="border-b border-zinc-800 flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'overview', label: '📊 Dashboard Overview' },
                { id: 'ledger', label: '📝 Transaction Log' },
                { id: 'cashapp', label: '📱 Cash App Activity' },
                { id: 'budgets', label: '🎯 Budget Planner' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setEditingTx(null);
                  }}
                  className={`pb-2.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl border transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'border-[#397ef7] text-white bg-[#397ef7]/20 shadow-[0_0_15px_rgba(57,126,247,0.3)]' 
                      : 'border-zinc-800 text-slate-300 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6 sm:space-y-8">
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="custom-card flex flex-col justify-between border-[#397ef7]/30">
                    <span className="metric-label">Total Net Worth</span>
                    <span className="metric-val text-[#397ef7]">${totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span className="text-xs font-bold text-slate-300 mt-2 flex items-center gap-1">▲ Dynamic Aggregation</span>
                  </div>
                  <div className="custom-card flex flex-col justify-between border-[#397ef7]/30">
                    <span className="metric-label">Bank of America</span>
                    <span className="metric-val text-[#397ef7]">${bofABalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span className="text-xs font-bold text-slate-300 mt-2 flex items-center gap-1">▲ Linked OAuth</span>
                  </div>
                  <div className="custom-card flex flex-col justify-between border-emerald-500/30">
                    <span className="metric-label">Cash App Balance</span>
                    <span className="metric-val text-emerald-400">${cashAppBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span className="text-xs font-bold text-emerald-400 mt-2 flex items-center gap-1">▲ P2P Checking</span>
                  </div>
                </div>

                {/* 2 Charts side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="custom-card">
                    <h3 className="text-base font-bold text-white mb-4">Spending By Category (Last 30 Days)</h3>
                    {drawDoughnutChart()}
                  </div>
                  <div className="custom-card">
                    <h3 className="text-base font-bold text-white mb-4">Cumulative Net Worth History</h3>
                    {drawAreaChart() || (
                      <div className="h-48 flex items-center justify-center text-slate-300 font-semibold">
                        No historical line chart data available.
                      </div>
                    )}
                  </div>
                </div>

                {/* List of accounts */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Linked Accounts</h3>
                  <div className="space-y-3">
                    {accounts.map(acc => (
                      <div key={acc.id} className="custom-card py-3.5 flex justify-between items-center border border-zinc-800 hover:border-[#397ef7]/40 bg-zinc-950/60">
                        <div>
                          <span className="font-bold text-sm sm:text-base text-white">{acc.name}</span>
                          <span className="text-xs text-slate-300 font-medium ml-2">
                            {acc.mask ? `•••• ${acc.mask}` : ''} ({acc.institution})
                          </span>
                        </div>
                        <div className={`font-extrabold text-sm sm:text-base ${acc.institution.includes("Cash App") ? "text-emerald-400" : "text-[#397ef7]"}`}>
                          ${(acc.balance_available ?? acc.balance_current ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TRANSACTION LEDGER */}
            {activeTab === 'ledger' && (
              <div className="space-y-6 sm:space-y-8">
                <div className="custom-card space-y-4">
                  <h3 className="text-lg font-bold text-white">Transaction Ledger</h3>
                  
                  {/* Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 text-slate-300" size={16} />
                      <input 
                        type="text"
                        placeholder="Search Merchant / Name / Notes"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="form-input pl-9 py-2.5 text-xs" 
                      />
                    </div>
                    
                    <select 
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="form-input py-2.5 text-xs cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      {uniqueCategories.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    <select 
                      value={institutionFilter}
                      onChange={(e) => setInstitutionFilter(e.target.value)}
                      className="form-input py-2.5 text-xs cursor-pointer"
                    >
                      <option value="All">All Institutions</option>
                      {uniqueInstitutions.filter(i => i !== 'All').map(i => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ledger Table */}
                  {filteredTxs.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-300 font-semibold">No matching transactions found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Account</th>
                            <th>Notes</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTxs.map(t => (
                            <tr key={t.id}>
                              <td className="whitespace-nowrap font-medium text-slate-200">{t.date}</td>
                              <td className="font-bold text-white">{t.name}</td>
                              <td>
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold" style={{
                                  backgroundColor: `${CATEGORY_COLORS[t.category] || CATEGORY_COLORS.Other}30`,
                                  color: CATEGORY_COLORS[t.category] || CATEGORY_COLORS.Other,
                                  border: `1px solid ${CATEGORY_COLORS[t.category] || CATEGORY_COLORS.Other}60`
                                }}>
                                  {t.category}
                                </span>
                              </td>
                              <td className={`font-bold ${t.amount >= 0 ? 'text-slate-100' : 'text-emerald-400'}`}>
                                {t.amount >= 0 ? `$${t.amount.toFixed(2)}` : `-$${Math.abs(t.amount).toFixed(2)}`}
                              </td>
                              <td className="text-slate-200">{t.account_name || 'Checking'}</td>
                              <td className="text-xs text-slate-300 max-w-xs truncate">{t.notes || '—'}</td>
                              <td>
                                <button 
                                  onClick={() => {
                                    setEditingTx(t);
                                    setEditCategory(t.category);
                                    setEditNotes(t.notes || '');
                                  }}
                                  className="text-[#397ef7] hover:text-[#5b96ff] flex items-center gap-1 text-xs font-bold cursor-pointer"
                                >
                                  <Edit size={12} />
                                  <span>Edit</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Edit Form Modal/Drawer */}
                {editingTx && (
                  <div className="custom-card space-y-4 border-[#397ef7]/40 shadow-[0_0_25px_rgba(57,126,247,0.2)]">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Edit size={16} className="text-[#397ef7]" />
                        <span>✏️ Edit Transaction Details</span>
                      </h3>
                      <button 
                        onClick={() => setEditingTx(null)}
                        className="text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                      >
                        Cancel ✕
                      </button>
                    </div>
                    <form onSubmit={handleUpdateTx} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-xs uppercase font-bold text-slate-200 mb-2">Change Category</label>
                        <select 
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="form-input text-xs py-2"
                        >
                          {["Income", "Groceries", "Dining", "Subscriptions", "Transfers", "Shopping", "Utilities", "Travel", "Other"].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs uppercase font-bold text-slate-200 mb-2">Edit Notes</label>
                        <input 
                          type="text" 
                          value={editNotes} 
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="form-input text-xs py-2" 
                          placeholder="Add transaction notes..."
                        />
                      </div>
                      <button type="submit" className="btn-primary py-2 text-xs font-bold w-full">
                        Save Transaction Updates
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CASH APP */}
            {activeTab === 'cashapp' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Cash App Transactions & P2P Transfers</h3>
                  <p className="text-xs text-slate-200">This tab isolates Cash App accounts to track direct payments, deposits, and cash outs.</p>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="custom-card flex flex-col justify-between border-rose-500/30">
                    <span className="metric-label">Total Sent via Cash App</span>
                    <span className="metric-val text-rose-400">${cashAppFlow.sent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="custom-card flex flex-col justify-between border-emerald-500/30">
                    <span className="metric-label">Total Received via Cash App</span>
                    <span className="metric-val text-emerald-400">${cashAppFlow.received.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="custom-card flex flex-col justify-between border-[#397ef7]/30">
                    <span className="metric-label">Net Cash App Flow</span>
                    <span className={`metric-val ${cashAppFlow.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {cashAppFlow.net >= 0 ? '+' : ''}${cashAppFlow.net.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                  </div>
                </div>

                {/* Cash App ledger list */}
                <div className="custom-card space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Cash App Detailed History</h4>
                  {cashAppTxs.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-300 font-semibold">No Cash App transactions found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Type</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cashAppTxs.map(t => (
                            <tr key={t.id}>
                              <td className="whitespace-nowrap font-medium text-slate-200">{t.date}</td>
                              <td className="font-bold text-white">{t.name}</td>
                              <td>
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold" style={{
                                  backgroundColor: `${CATEGORY_COLORS[t.category] || CATEGORY_COLORS.Other}30`,
                                  color: CATEGORY_COLORS[t.category] || CATEGORY_COLORS.Other,
                                  border: `1px solid ${CATEGORY_COLORS[t.category] || CATEGORY_COLORS.Other}60`
                                }}>
                                  {t.category}
                                </span>
                              </td>
                              <td className={`font-bold ${t.amount >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {t.amount >= 0 ? `$${t.amount.toFixed(2)}` : `-$${Math.abs(t.amount).toFixed(2)}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: BUDGET PLANNER */}
            {activeTab === 'budgets' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Budget Progress Tracker</h3>
                  <p className="text-xs text-slate-200">Compare your monthly limits against transactions from the last 30 days.</p>
                </div>

                {Object.keys(budgets).length === 0 ? (
                  <div className="custom-card text-center py-10 text-xs text-slate-200 flex flex-col items-center justify-center gap-3 border-[#397ef7]/20">
                    <HelpCircle size={36} className="text-[#397ef7]" />
                    <span className="font-semibold text-slate-100">No budgets configured yet. Use the sidebar/control panel to set category spending limits!</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(budgets).map(([cat, limit]) => {
                      // Sum expense transactions of this category
                      const spent = transactions
                        .filter(t => t.category === cat && t.amount > 0)
                        .reduce((sum, t) => sum + t.amount, 0);

                      const percent = limit > 0 ? spent / limit : 0;
                      const displayPercent = Math.min(percent * 100, 100);

                      let statusBadge = null;
                      if (percent < 0.70) {
                        statusBadge = <span className="text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-1 border border-emerald-500/40 rounded-lg">Under Budget</span>;
                      } else if (percent < 0.95) {
                        statusBadge = <span className="text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 border border-amber-500/40 rounded-lg">Approaching Limit</span>;
                      } else {
                        statusBadge = <span className="text-xs font-bold text-rose-300 bg-rose-950/60 px-2.5 py-1 border border-rose-500/40 rounded-lg">OVER BUDGET</span>;
                      }

                      return (
                        <div key={cat} className="custom-card flex flex-col justify-between border-[#397ef7]/25">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-base font-bold text-white">{cat} Budget</h4>
                            {statusBadge}
                          </div>
                          
                          {/* Progress bar container */}
                          <div className="space-y-2 mt-4">
                            <div className="w-full bg-zinc-950 h-3.5 rounded-full overflow-hidden border border-zinc-800 flex">
                              <div 
                                style={{ 
                                  width: `${displayPercent}%`,
                                  background: percent >= 0.95 
                                    ? 'linear-gradient(90deg, #dc2626, #ef4444)' 
                                    : percent >= 0.70 
                                      ? 'linear-gradient(90deg, #d97706, #f59e0b)' 
                                      : 'linear-gradient(90deg, #2b66d0, #397ef7)'
                                }} 
                                className="h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(57,126,247,0.5)]"
                              />
                            </div>
                            <div className="flex justify-between text-xs text-slate-200 font-bold pt-1">
                              <span>Spent: ${spent.toFixed(2)}</span>
                              <span>Limit: ${limit.toFixed(2)} ({Math.round(percent * 100)}%)</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
