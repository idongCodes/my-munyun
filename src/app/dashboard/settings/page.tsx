"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Shield, 
  ArrowLeft, 
  CheckCircle, 
  Loader2, 
  Trash2, 
  AlertTriangle, 
  Lock, 
  Mail, 
  Phone,
  AlertCircle
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Profile state fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Password state fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status and loader flags
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Account deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);

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
      setErrorMsg('');
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.first_name !== undefined) setFirstName(data.first_name);
      if (data.last_name !== undefined) setLastName(data.last_name);
      if (data.preferred_name !== undefined) setPreferredName(data.preferred_name);
      if (data.email !== undefined) setEmail(data.email);
      if (data.mobile_number !== undefined) setPhone(data.mobile_number);
    } catch (err) {
      console.error('Failed to load user settings:', err);
      setErrorMsg('Failed to load profile details from database.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Profile values (First Name, Last Name, Email, and Phone) cannot be empty.');
      return;
    }

    if (password && password !== confirmPassword) {
      setErrorMsg('New password values do not match. Please verify.');
      return;
    }

    try {
      setSavingSettings(true);
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          firstName,
          lastName,
          preferredName,
          email,
          mobileNumber: phone,
          password: password || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Settings saved successfully!');
        setPassword('');
        setConfirmPassword('');
        // Refetch profile to check name update timestamps
        fetchProfile();
      } else {
        setErrorMsg(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      setErrorMsg('Failed to update credentials. Please check database connectivity.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmCheckbox) return;

    try {
      setDeletingAccount(true);
      setErrorMsg('');
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_account' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.removeItem('munyun_logged_in');
        sessionStorage.removeItem('munyun_login_time');
        router.push('/login?account_deleted=true');
      } else {
        setErrorMsg('Failed to delete user account database records.');
        setDeletingAccount(false);
        setShowDeleteModal(false);
      }
    } catch (err) {
      setErrorMsg('Error dispatching deletion query.');
      setDeletingAccount(false);
      setShowDeleteModal(false);
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
              Portal <span className="text-[#397ef7]">Settings</span>
            </h1>
          </div>
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 px-4 py-2 rounded-full border border-slate-700/60 transition-colors shadow-sm"
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
          <div className="space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Form Warnings/Notifications */}
              {errorMsg && (
                <div className="bg-red-950/40 border border-red-500/40 text-red-300 p-4 rounded-xl text-xs flex items-center gap-2.5 shadow-lg">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl text-xs flex items-center gap-2.5 shadow-lg">
                  <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Account Profile Section */}
              <div className="custom-card p-6 sm:p-8 border-[#397ef7]/30 space-y-5">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-outfit border-b border-slate-800 pb-3">
                  <User className="text-[#397ef7]" size={18} />
                  <span>Profile Credentials</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 text-left">
                    <label className="block text-xs uppercase font-bold text-slate-300 tracking-wide">First Name</label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-input text-sm py-2.5 px-3.5"
                      placeholder="First Name"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="block text-xs uppercase font-bold text-slate-300 tracking-wide">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="form-input text-sm py-2.5 px-3.5"
                      placeholder="Last Name"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-amber-400/80 -mt-2 text-left font-semibold">
                  ⚠️ Note: First and Last name values can only be updated once every 72 hours.
                </p>

                <div className="space-y-2 text-left">
                  <label className="block text-xs uppercase font-bold text-slate-300 tracking-wide">Display / Preferred Name</label>
                  <input 
                    type="text" 
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    className="form-input text-sm py-2.5 px-3.5"
                    placeholder="Nickname or preferred name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 text-left">
                    <label className="block text-xs uppercase font-bold text-slate-300 tracking-wide flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-400" />
                      <span>Email Address</span>
                    </label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input text-sm py-2.5 px-3.5 text-slate-300"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="block text-xs uppercase font-bold text-slate-300 tracking-wide flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      <span>Phone Number</span>
                    </label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-input text-sm py-2.5 px-3.5 text-slate-300"
                      placeholder="+1XXXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="custom-card p-6 sm:p-8 border-[#397ef7]/30 space-y-5">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-outfit border-b border-slate-800 pb-3">
                  <Lock className="text-[#397ef7]" size={18} />
                  <span>Update Password</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 text-left">
                    <label className="block text-xs uppercase font-bold text-slate-300 tracking-wide">New Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input text-sm py-2.5 px-3.5"
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="block text-xs uppercase font-bold text-slate-300 tracking-wide">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-input text-sm py-2.5 px-3.5"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={savingSettings}
                  className="btn-primary py-3 px-8 text-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Settings</span>
                  )}
                </button>
              </div>
            </form>

            {/* Danger Zone Account Deletion */}
            <div className="custom-card p-6 sm:p-8 border-red-500/30 hover:border-red-500/50 bg-red-950/5 space-y-4 text-left transition-all">
              <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 font-outfit border-b border-red-900/20 pb-3">
                <AlertTriangle className="text-red-400" size={18} />
                <span>Danger Zone</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Deleting your account will wipe all transaction statements, Linked Plaid credentials, and login profile parameters permanently from the database. This action is irreversible.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="btn-danger py-2.5 px-5 text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete My Account Entirely</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Deletion Confirmation Modal Overlay */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c0d16] border border-red-500/40 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white font-outfit">Confirm Account Deletion</h3>
            </div>
            
            <div className="space-y-3 text-left">
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold">
                This action is permanent and cannot be undone. 
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                By deleting your account, you will erase your entire user profile, linked Plaid credentials, transaction logs, and security keys. You will be logged out and returned to the authentication portal.
              </p>
            </div>

            <div className="space-y-4">
              {/* Checkbox confirmation */}
              <label className="flex items-start gap-3 cursor-pointer text-left select-none p-3.5 bg-slate-950/60 rounded-xl border border-slate-900">
                <input 
                  type="checkbox" 
                  checked={confirmCheckbox}
                  onChange={(e) => setConfirmCheckbox(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-red-500 border-slate-800 bg-slate-900 focus:ring-red-500"
                />
                <span className="text-[11px] font-bold text-slate-300 leading-normal">
                  I understand this action is permanent and completely erases all my database registers.
                </span>
              </label>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setConfirmCheckbox(false);
                  }}
                  disabled={deletingAccount}
                  className="btn-secondary py-3 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={!confirmCheckbox || deletingAccount}
                  className="btn-danger py-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {deletingAccount ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Delete Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
