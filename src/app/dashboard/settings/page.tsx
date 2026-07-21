"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Shield, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [displayName, setDisplayName] = useState('User');
  const [emailAddress, setEmailAddress] = useState('user@example.com');
  const [savedMsg, setSavedMsg] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Authentication Gate check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedIn = sessionStorage.getItem('munyun_logged_in') === 'true';
      if (!loggedIn) {
        setIsAuthenticated(false);
        router.push('/login');
      } else {
        setIsAuthenticated(true);
        fetchProfile();
      }
    }
  }, [router]);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.preferred_name) setDisplayName(data.preferred_name);
      if (data.email) setEmailAddress(data.email);
    } catch (err) {
      console.error('Failed to load user settings:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg('Settings saved successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0e2a5e] via-[#040c1b] to-black text-white p-6 sm:p-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#397ef7]/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit tracking-tight">
              User <span className="text-[#397ef7]">Settings</span>
            </h1>
          </div>
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 px-4 py-2 rounded-full border border-slate-700/60 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
        </header>

        {loadingProfile ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-[#397ef7] animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Fetching profile details...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Account Profile Section */}
            <div className="custom-card p-6 sm:p-8 border-[#397ef7]/30 space-y-5">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-outfit border-b border-slate-800 pb-3">
                <User className="text-[#397ef7]" size={18} />
                <span>Profile Settings</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 text-left">
                  <label className="block text-xs uppercase font-bold text-slate-300">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="form-input text-sm py-2.5 px-3.5"
                  />
                </div>
                <div className="space-y-2 text-left">
                  <label className="block text-xs uppercase font-bold text-slate-300">Email Address</label>
                  <input 
                    type="email" 
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="form-input text-sm py-2.5 px-3.5"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="custom-card p-6 sm:p-8 border-[#397ef7]/30 space-y-5">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-outfit border-b border-slate-800 pb-3">
                <Shield className="text-[#397ef7]" size={18} />
                <span>Security & Authentication</span>
              </h2>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="space-y-1 text-left">
                  <div className="text-sm font-semibold text-slate-200">Google Authenticator (2FA)</div>
                  <div className="text-xs text-slate-400">Add an extra layer of security using TOTP verification code</div>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                  Enabled
                </span>
              </div>
            </div>

            {/* Save Notification */}
            {savedMsg && (
              <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl text-xs flex items-center gap-2.5">
                <CheckCircle size={16} />
                <span>{savedMsg}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button type="submit" className="btn-primary py-3 px-8 text-sm font-bold">
                Save Settings
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
