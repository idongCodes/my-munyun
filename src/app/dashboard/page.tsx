"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Landmark, 
  CreditCard, 
  TrendingUp, 
  Wallet, 
  AlertCircle, 
  CheckCircle,
  Database,
  ArrowRight,
  Shield,
  Loader2,
  X,
  Lock,
  Search,
  LogOut
} from 'lucide-react';

const loadPlaidScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Plaid) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const POPULAR_BANKS = [
  { id: 'chase', name: 'Chase Bank', logo: '🏦', desc: 'Simulates personal checking, savings & sapphire credit card' },
  { id: 'boa', name: 'Bank of America', logo: '🏛️', desc: 'Simulates Advantage checking, savings & rewards card' },
  { id: 'wells', name: 'Wells Fargo', logo: '🐎', desc: 'Simulates Everyday checking & Way2Save savings' },
  { id: 'citi', name: 'Citibank', logo: '💳', desc: 'Simulates Access Checking & Double Cash credit card' },
  { id: 'capone', name: 'Capital One', logo: '🔴', desc: 'Simulates 360 Checking & Venture X credit card' },
  { id: 'usbank', name: 'U.S. Bank', logo: '🔵', desc: 'Simulates Smartly Checking portal' },
  { id: 'fidelity', name: 'Fidelity', logo: '📈', desc: 'Simulates personal Brokerage account assets' },
  { id: 'usaa', name: 'USAA', logo: '🎖️', desc: 'Simulates military member classic checking' },
  { id: 'td', name: 'TD Bank', logo: '🟢', desc: 'Simulates Convenience Checking portal' },
  { id: 'navyfederal', name: 'Navy Federal Credit Union', logo: '⚓', desc: 'Simulates active duty military checking' },
  { id: 'schwab', name: 'Charles Schwab', logo: '🦁', desc: 'Simulates Schwab One brokerage checking' },
  { id: 'pnc', name: 'PNC Bank', logo: '🟧', desc: 'Simulates Virtual Wallet account balance' },
  { id: 'cashapp', name: 'Cash App', logo: '💸', desc: 'Simulates Cash App mobile depository balance' }
];

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [plaidLoading, setPlaidLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Authentication Gate check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedIn = sessionStorage.getItem('munyun_logged_in') === 'true';
      if (!loggedIn) {
        setIsAuthenticated(false);
        router.push('/login');
      } else {
        setIsAuthenticated(true);
        fetchData();
      }
    }
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const resStatus = await fetch('/api/status');
      const dataStatus = await resStatus.json();
      setStatus(dataStatus);

      const resTxs = await fetch('/api/transactions');
      const dataTxs = await resTxs.json();
      if (dataTxs.accounts) {
        setAccounts(dataTxs.accounts);
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setErrorMsg('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setErrorMsg('');
      setSuccessMsg('');
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setSuccessMsg('Telemetry successfully refreshed!');
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to disconnect all linked bank accounts? This will wipe your account balances and transaction history.')) {
      return;
    }
    try {
      setClearing(true);
      setErrorMsg('');
      setSuccessMsg('');
      const res = await fetch('/api/clear', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setSuccessMsg('All connections disconnected successfully.');
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to clear data.');
    } finally {
      setClearing(false);
    }
  };

  const handleConnectMock = async (institution: string, bankName: string) => {
    try {
      setSyncing(true);
      setShowConnectModal(false);
      setErrorMsg('');
      setSuccessMsg('');
      
      const resExchange = await fetch('/api/exchange_public_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token: 'mock_public_token',
          institution,
        }),
      });
      const dataExchange = await resExchange.json();
      if (dataExchange.error) {
        throw new Error(dataExchange.error);
      }

      setSuccessMsg(`Successfully connected sandbox ${bankName}!`);
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to exchange mock token.');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleMock = async () => {
    if (!status?.is_plaid_configured) {
      setErrorMsg('Plaid credentials are not configured in your env file. Cannot switch to Live Plaid.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    
    try {
      setSyncing(true);
      setErrorMsg('');
      setSuccessMsg('');
      
      const newMockState = !status.use_mock_data;
      const res = await fetch('/api/toggle_mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ use_mock: newMockState }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      setSuccessMsg(newMockState ? 'Switched to Demo Sandbox Mode' : 'Switched to Live Plaid Mode');
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle mode.');
    } finally {
      setSyncing(false);
    }
  };

  const handleConnectPlaid = async () => {
    try {
      setPlaidLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const resToken = await fetch('/api/create_link_token', { method: 'POST' });
      const dataToken = await resToken.json();
      
      if (dataToken.error) {
        throw new Error(dataToken.error);
      }

      const linkToken = dataToken.link_token;
      
      if (linkToken === 'mock_link_token') {
        setShowConnectModal(true);
        setPlaidLoading(false);
        return;
      }

      const scriptLoaded = await loadPlaidScript();
      if (!scriptLoaded || !(window as any).Plaid) {
        throw new Error('Could not load Plaid Link SDK. Please check your internet connection.');
      }

      const handler = (window as any).Plaid.create({
        token: linkToken,
        onSuccess: async (public_token: string, metadata: any) => {
          try {
            setPlaidLoading(true);
            
            const instName = metadata.institution?.name || '';
            const instNameLower = instName.toLowerCase();
            let institution = 'boa';
            
            if (instNameLower.includes('chase')) institution = 'chase';
            else if (instNameLower.includes('america') || instNameLower.includes('boa')) institution = 'boa';
            else if (instNameLower.includes('wells')) institution = 'wells';
            else if (instNameLower.includes('citi')) institution = 'citi';
            else if (instNameLower.includes('cap') || instNameLower.includes('one')) institution = 'capone';
            else if (instNameLower.includes('us bank') || instNameLower.includes('u.s. bank')) institution = 'usbank';
            else if (instNameLower.includes('fidelity')) institution = 'fidelity';
            else if (instNameLower.includes('usaa')) institution = 'usaa';
            else if (instNameLower.includes('td')) institution = 'td';
            else if (instNameLower.includes('navy')) institution = 'navyfederal';
            else if (instNameLower.includes('schwab')) institution = 'schwab';
            else if (instNameLower.includes('pnc')) institution = 'pnc';
            else if (instNameLower.includes('cash')) institution = 'cashapp';

            const resExchange = await fetch('/api/exchange_public_token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                public_token,
                institution,
              }),
            });
            const dataExchange = await resExchange.json();
            if (dataExchange.error) {
              throw new Error(dataExchange.error);
            }

            setSuccessMsg(`Successfully connected ${metadata.institution?.name || 'Bank Account'}!`);
            await fetchData();
            setTimeout(() => setSuccessMsg(''), 4000);
          } catch (err: any) {
            setErrorMsg(err.message || 'Token exchange failed.');
          } finally {
            setPlaidLoading(false);
          }
        },
        onExit: (err: any) => {
          setPlaidLoading(false);
          if (err) {
            setErrorMsg(err.message || 'Plaid connection exited.');
          }
        },
      });

      handler.open();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start Plaid Link.');
      setPlaidLoading(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#397ef7] animate-spin" />
        <p className="text-sm text-slate-400 font-medium font-sans">Verifying security credentials...</p>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null;
  }

  const depositoryAccounts = accounts.filter(acc => acc.type === 'depository');
  const creditAccounts = accounts.filter(acc => acc.type === 'credit');

  const totalDepository = depositoryAccounts.reduce((sum, acc) => sum + (acc.balance_current || 0), 0);
  const totalDebt = creditAccounts.reduce((sum, acc) => sum + (acc.balance_current || 0), 0);
  const netWorth = totalDepository - totalDebt;

  const groupedAccounts = accounts.reduce((groups: Record<string, any[]>, acc) => {
    const inst = acc.institution || 'Other Account';
    if (!groups[inst]) {
      groups[inst] = [];
    }
    groups[inst].push(acc);
    return groups;
  }, {});

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const filteredBanks = POPULAR_BANKS.filter(bank => 
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0e2a5e] via-[#040c1b] to-black text-white p-4 sm:p-8 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#397ef7]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/80 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">📊</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit tracking-tight">
                My <span className="text-[#397ef7]">Munyun</span> Dashboard
              </h1>
              <p className="text-xs text-slate-400">
                Welcome back, <span className="text-white font-bold">{status?.preferred_name || 'User'}</span> • Goal: <span className="text-[#397ef7] capitalize">{status?.primary_goal || 'budget'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {accounts.length > 0 && (
              <>
                <button
                  onClick={handleSync}
                  disabled={syncing || clearing}
                  className="btn-secondary py-2 px-4 text-xs font-bold w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} className={syncing ? 'animate-spin text-[#397ef7]' : 'text-slate-300'} />
                  <span>{syncing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                <button
                  onClick={handleClear}
                  disabled={syncing || clearing}
                  className="btn-danger py-2 px-4 text-xs font-bold w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  <span>Disconnect All</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="bg-red-950/40 border border-red-500/40 text-red-300 p-4 rounded-xl text-xs flex items-center gap-2.5 shadow-lg animate-pulse">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{errorMsg}</span>
            <button className="ml-auto hover:text-white" onClick={() => setErrorMsg('')}>
              <X size={14} />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl text-xs flex items-center gap-2.5 shadow-lg">
            <CheckCircle size={16} className="text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
            <button className="ml-auto hover:text-white" onClick={() => setSuccessMsg('')}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Mode Toggle Status Bar */}
        <section className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
            <div className="flex flex-wrap gap-x-2 gap-y-1 items-center">
              <span className="text-slate-400 font-medium">Database Node:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Database size={12} /> Local SQLite (Active)
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 font-medium">Mode:</span>
              <span className={`font-extrabold px-2 py-0.5 rounded ${status?.use_mock_data ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-[#397ef7] border border-blue-500/20'}`}>
                {status?.use_mock_data ? 'Demo Sandbox' : 'Live Plaid (' + status?.plaid_env + ')'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMock}
              disabled={syncing || !status?.is_plaid_configured}
              className={`text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg border transition-all ${
                !status?.is_plaid_configured
                  ? 'bg-slate-900/50 text-slate-500 border-slate-800/80 cursor-not-allowed'
                  : 'bg-[#397ef7]/10 text-slate-200 border-[#397ef7]/35 hover:bg-[#397ef7]/20'
              }`}
              title={!status?.is_plaid_configured ? "Configure Plaid keys in your .env.local file to unlock Live Plaid Mode" : ""}
            >
              {!status?.is_plaid_configured ? 'Plaid API Locked' : status?.use_mock_data ? 'Switch to Live Plaid' : 'Switch to Demo Mock'}
            </button>
            
            <div className="relative group">
              <Link 
                href="/dashboard/settings"
                className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-[#397ef7] border border-slate-700/60 hover:border-[#397ef7]/60 transition-all flex items-center"
              >
                <Settings size={14} className="group-hover:rotate-45 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 text-[#397ef7] animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Booting financial telemetry feed...</p>
          </div>
        ) : accounts.length === 0 ? (
          /* Empty Connected State */
          <section className="relative flex flex-col items-center justify-center min-h-[420px] rounded-3xl border border-dashed border-slate-800/90 bg-slate-950/25 p-8 sm:p-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-[#397ef7]/10 flex items-center justify-center text-4xl shadow-inner border border-[#397ef7]/20 animate-pulse">
              🏦
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-outfit">
                No Financial Portals Linked
              </h2>
              <p className="text-sm text-slate-400">
                Securely aggregate your checking accounts, savings plans, and credit cards using Plaid to analyze your net worth and cash flow in real-time.
              </p>
            </div>

            <button
              onClick={handleConnectPlaid}
              disabled={plaidLoading}
              className="btn-primary py-3.5 px-8 font-bold text-sm tracking-wide shadow-[0_0_30px_rgba(57,126,247,0.3)] flex items-center gap-2"
            >
              {plaidLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Configuring Plaid Link...</span>
                </>
              ) : (
                <>
                  <Lock size={15} />
                  <span>Connect Bank Account via Plaid</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-500 max-w-xs flex items-center justify-center gap-1">
              <Shield size={12} className="text-[#397ef7]" />
              <span>Uses bank-grade 256-bit AES encryption standard.</span>
            </div>
          </section>
        ) : (
          /* Active Connected State */
          <div className="space-y-8 animate-login-instant">
            {/* Metrics Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="custom-card p-6 border-[#397ef7]/30 bg-gradient-to-br from-[#0e2a5e]/30 via-slate-950/90 to-slate-950/90 relative overflow-hidden group hover:border-[#397ef7]/60">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#397ef7]/5 rounded-full blur-xl pointer-events-none group-hover:bg-[#397ef7]/10 transition-colors"></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="metric-label">Net Worth</span>
                  <TrendingUp className="text-emerald-400 w-5 h-5" />
                </div>
                <div className="metric-val text-white">{formatCurrency(netWorth)}</div>
                <p className="text-[10px] text-slate-400 mt-1">Aggregated assets minus credit card debt</p>
              </div>

              <div className="custom-card p-6 border-[#397ef7]/30 bg-gradient-to-br from-[#0e2a5e]/30 via-slate-950/90 to-slate-950/90 relative overflow-hidden group hover:border-[#397ef7]/60">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#397ef7]/5 rounded-full blur-xl pointer-events-none group-hover:bg-[#397ef7]/10 transition-colors"></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="metric-label">Total Cash Assets</span>
                  <Wallet className="text-[#397ef7] w-5 h-5" />
                </div>
                <div className="metric-val text-white">{formatCurrency(totalDepository)}</div>
                <p className="text-[10px] text-slate-400 mt-1">Checking + Savings balances combined</p>
              </div>

              <div className="custom-card p-6 border-[#397ef7]/30 bg-gradient-to-br from-[#0e2a5e]/30 via-slate-950/90 to-slate-950/90 relative overflow-hidden group hover:border-[#397ef7]/60">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-red-500/10 transition-colors"></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="metric-label">Credit Card Debt</span>
                  <CreditCard className="text-red-400 w-5 h-5" />
                </div>
                <div className="metric-val text-red-400">{formatCurrency(totalDebt)}</div>
                <p className="text-[10px] text-slate-400 mt-1">Total outstanding credit card balances</p>
              </div>
            </div>

            {/* Banks and Cards Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-outfit tracking-tight">
                Connected Institutions & Accounts
              </h2>
              <button
                onClick={handleConnectPlaid}
                disabled={plaidLoading}
                className="btn-secondary py-1.5 px-3.5 text-xs font-bold flex items-center gap-1.5"
              >
                {plaidLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Plus size={13} />
                )}
                <span>Link Another Bank</span>
              </button>
            </div>

            {/* Connected Institutions List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(groupedAccounts).map(([institutionName, instAccounts]) => {
                const isCreditOnly = instAccounts.every(acc => acc.type === 'credit');
                const isBoa = institutionName.toLowerCase().includes('america') || institutionName.toLowerCase().includes('boa');
                const totalInstBalance = instAccounts.reduce((sum, acc) => {
                  if (acc.type === 'credit') return sum - (acc.balance_current || 0);
                  return sum + (acc.balance_current || 0);
                }, 0);

                return (
                  <div 
                    key={institutionName} 
                    className="custom-card border-[#397ef7]/30 bg-slate-950/60 relative p-6 flex flex-col justify-between space-y-4 hover:border-[#397ef7]/50"
                  >
                    <div>
                      <div className="flex items-start justify-between pb-4 border-b border-slate-800/80">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#397ef7]/10 flex items-center justify-center text-[#397ef7]">
                            {isCreditOnly ? <CreditCard size={20} /> : <Landmark size={20} />}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm sm:text-base text-slate-200 font-outfit">
                              {institutionName}
                            </h3>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                              <span>Connection:</span>
                              {status?.use_mock_data ? (
                                <span className="text-amber-400 font-semibold uppercase tracking-wider text-[9px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Demo Sandbox</span>
                              ) : (
                                <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Verified Plaid</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Net Balance</span>
                          <span className={`font-extrabold text-sm sm:text-base font-outfit ${totalInstBalance >= 0 ? 'text-[#397ef7]' : 'text-red-400'}`}>
                            {formatCurrency(totalInstBalance)}
                          </span>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-900/60 mt-3">
                        {instAccounts.map((account) => {
                          const isCredit = account.type === 'credit';
                          return (
                            <div key={account.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-900/30 px-2 rounded-lg transition-colors">
                              <div className="space-y-1">
                                <div className="font-bold text-slate-200 flex items-center gap-2">
                                  <span>{account.name}</span>
                                  {account.mask && (
                                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                                      •••• {account.mask}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold uppercase text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                                    {account.subtype || account.type || 'account'}
                                  </span>
                                  {account.balance_available !== null && account.balance_available !== undefined && (
                                    <span className="text-[9px] text-slate-500 font-medium">
                                      Avail: {formatCurrency(account.balance_available)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`font-extrabold text-sm font-outfit ${isCredit ? 'text-red-400' : 'text-slate-100'}`}>
                                  {formatCurrency(account.balance_current || 0)}
                                </span>
                                <span className="block text-[9px] text-slate-500 mt-0.5">Current Balance</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sandbox Mock Connection Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full mx-4 shadow-[0_0_50px_rgba(57,126,247,0.35)] relative flex flex-col max-h-[90vh]">
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  setSearchTerm('');
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-900 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4 shrink-0">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-100 font-outfit text-lg">
                    Link Bank Account
                  </h3>
                  <p className="text-xs text-amber-500 font-medium">
                    Demo Sandbox Mode • Simulated Plaid Portal
                  </p>
                </div>
              </div>

              <div className="relative mb-4 shrink-0">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search popular Plaid institutions..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input text-xs pl-10 pr-4 py-3 border-slate-800 bg-slate-900/60 focus:bg-slate-900"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar scrollbar-thin max-h-[320px]">
                {filteredBanks.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-12">
                    No sandbox institutions match "{searchTerm}"
                  </div>
                ) : (
                  filteredBanks.map(bank => {
                    const isLinked = accounts.some(acc => {
                      const matched = acc.institution?.toLowerCase() || '';
                      return matched.replace(/\s/g, '').includes(bank.id) || 
                             bank.name.toLowerCase().includes(matched) ||
                             matched.includes(bank.name.toLowerCase());
                    });

                    return (
                      <button
                        key={bank.id}
                        onClick={() => handleConnectMock(bank.id, bank.name)}
                        className={`w-full bg-slate-900 hover:bg-[#397ef7]/10 border p-3.5 rounded-xl flex items-center justify-between text-left transition-all group ${
                          isLinked 
                            ? 'border-[#397ef7]/30 hover:border-[#397ef7]/50' 
                            : 'border-slate-800/80 hover:border-slate-700/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="text-2xl w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800">
                            {bank.logo}
                          </span>
                          <div>
                            <span className="font-extrabold text-xs sm:text-sm text-slate-200 block group-hover:text-[#397ef7] transition-colors">
                              {bank.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block leading-tight mt-0.5 max-w-[280px]">
                              {bank.desc}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isLinked ? (
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              Connected
                            </span>
                          ) : (
                            <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-1 transition-transform group-hover:text-[#397ef7]" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-4 border-t border-slate-850 mt-4 shrink-0">
                <Lock size={11} className="text-[#397ef7]" />
                <span>Simulating secure OAuth tokens for {POPULAR_BANKS.length} Plaid cores.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
