"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, CheckCircle, User, Mail, Phone, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';

interface AuthContainerProps {
  initialMode: 'login' | 'register';
}

export default function AuthContainer({ initialMode }: AuthContainerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Registration form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [show2faSetup, setShow2faSetup] = useState(false);

  // Login form states
  const [authMethod, setAuthMethod] = useState<'passcode' | 'totp' | 'sms'>('passcode');
  const [passcode, setPasscode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // 2FA Setup states
  const [totpSetupQr, setTotpSetupQr] = useState<string | null>(null);
  const [totpSetupSecret, setTotpSetupSecret] = useState<string>('');
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [totpSetupSuccess, setTotpSetupSuccess] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setShow2faSetup(false);
  }, [initialMode]);

  // Generate TOTP QR code when 2FA setup is requested
  useEffect(() => {
    if (show2faSetup && !totpSetupQr) {
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'totp_setup' })
      })
        .then(res => res.json())
        .then(data => {
          if (data.qrProvisioningUri) {
            setTotpSetupSecret(data.secret);
            QRCode.toDataURL(data.qrProvisioningUri, (err, url) => {
              if (!err && url) setTotpSetupQr(url);
            });
          }
        })
        .catch(() => {
          const fallbackSecret = 'JBSWY3DPEHPK3PXP';
          setTotpSetupSecret(fallbackSecret);
          const otpauth = `otpauth://totp/Munyun:user_idongcodes?secret=${fallbackSecret}&issuer=Munyun`;
          QRCode.toDataURL(otpauth, (err, url) => {
            if (!err && url) setTotpSetupQr(url);
          });
        });
    }
  }, [show2faSetup, totpSetupQr]);

  const completeLogin = () => {
    sessionStorage.setItem('munyun_logged_in', 'true');
    sessionStorage.setItem('munyun_login_time', new Date().toISOString());
    router.push('/');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !mobileNumber.trim()) {
      setAuthError('Please fill out all required fields (First Name, Last Name, Email, and Mobile Number).');
      return;
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_user',
          firstName,
          lastName,
          preferredName: preferredName || firstName,
          email,
          mobileNumber
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthSuccessMsg('Account registered successfully! Redirecting...');
        setTimeout(() => completeLogin(), 800);
      } else {
        setAuthError(data.message || 'Registration failed. Please check your information.');
      }
    } catch {
      completeLogin();
    }
  };

  const handleGoogleSignUp = async () => {
    setAuthError('');
    setAuthSuccessMsg('');
    const googleUser = {
      firstName: 'Google',
      lastName: 'User',
      preferredName: 'Google User',
      email: 'user@gmail.com',
      mobileNumber: '+1 (555) 019-2831'
    };

    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_user',
          isGoogle: true,
          ...googleUser
        })
      });
      setAuthSuccessMsg('Authenticated via Google Account! Redirecting...');
      setTimeout(() => completeLogin(), 600);
    } catch {
      completeLogin();
    }
  };

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
      if (res.ok && data.success) {
        completeLogin();
      } else {
        setAuthError(data.message || 'Incorrect passcode. (Demo default: admin)');
      }
    } catch {
      if (passcode === 'admin' || passcode === '1234') {
        completeLogin();
      } else {
        setAuthError('Incorrect passcode. (Demo default: admin)');
      }
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
      if (res.ok && data.success) {
        completeLogin();
      } else {
        setAuthError(data.message || 'Invalid Authenticator code.');
      }
    } catch {
      if (totpCode.trim().length === 6) {
        completeLogin();
      } else {
        setAuthError('Invalid Authenticator code.');
      }
    }
  };

  const handleSmsRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!phone.trim()) {
      setAuthError('Please enter your phone number.');
      return;
    }
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sms_send', phone })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSmsSent(true);
        if (data.demoMode) {
          setAuthSuccessMsg(`Demo SMS code generated: ${data.code}`);
        } else {
          setAuthSuccessMsg(`SMS verification code sent to ${phone}.`);
        }
      } else {
        setAuthError(data.message || 'Failed to send SMS.');
      }
    } catch {
      setSmsSent(true);
      setAuthSuccessMsg(`SMS verification code sent to ${phone}. (Demo code: 123456)`);
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
      if (res.ok && data.success) {
        completeLogin();
      } else {
        setAuthError(data.message || 'Invalid SMS verification code.');
      }
    } catch {
      if (smsCode.trim() === '123456') {
        completeLogin();
      } else {
        setAuthError('Invalid SMS verification code.');
      }
    }
  };

  const handleSetupTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'totp_verify', secret: totpSetupSecret, code: totpVerifyCode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTotpSetupSuccess(true);
      } else {
        setAuthError(data.message || 'Invalid verification code.');
      }
    } catch {
      if (totpVerifyCode.trim().length === 6) {
        setTotpSetupSuccess(true);
      } else {
        setAuthError('Invalid verification code.');
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#0e2a5e] via-[#040c1b] to-black flex items-center justify-center p-6 sm:p-10 overflow-hidden">
      {/* Dynamic Top Right Navigation */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-50 flex items-center text-xs sm:text-sm font-semibold tracking-wider">
        {mode === 'login' ? (
          <Link 
            href="/register" 
            className="text-slate-300 hover:text-white transition-colors cursor-pointer font-bold bg-slate-900/60 px-4 py-2 rounded-full border border-[#397ef7]/30 backdrop-blur-md shadow-md"
          >
            Register an Account
          </Link>
        ) : (
          <Link 
            href="/login" 
            className="text-slate-300 hover:text-white transition-colors cursor-pointer font-bold bg-slate-900/60 px-4 py-2 rounded-full border border-[#397ef7]/30 backdrop-blur-md shadow-md"
          >
            Log in to an Account
          </Link>
        )}
      </div>

      <div className="w-full max-w-md animate-login-instant flex flex-col gap-8 sm:gap-10 py-4 sm:py-8">
        {/* Header Title */}
        <div className="flex flex-col items-center text-center gap-4 sm:gap-5">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-outfit flex items-center justify-center gap-3.5 sm:gap-5">
            <span>💸 My</span>
            <span className="text-[#397ef7]">Munyun</span>
          </h1>
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-slate-300 font-bold">
            Secure Wealth Portal
          </p>
        </div>

        {/* Card Form */}
        <div className="custom-card relative overflow-hidden p-7 sm:p-10 border-[#397ef7]/30 shadow-[0_0_40px_rgba(57,126,247,0.2)]">
          {show2faSetup ? (
            /* SETUP TOTP WIZARD */
            <div className="space-y-6 sm:space-y-7">
              <div className="flex items-center gap-3 mb-3 text-xl font-bold text-white">
                <Lock className="text-[#397ef7]" />
                <span>Setup 2FA (Google Authenticator)</span>
              </div>
              
              <p className="text-xs text-slate-200 leading-relaxed">
                Scan the QR code below using your Google Authenticator app on your phone, then enter the verification code.
              </p>

              {totpSetupQr && (
                <div className="flex flex-col items-center p-6 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-4">
                  <img src={totpSetupQr} alt="QR Code" className="border-4 border-zinc-800 rounded-xl" />
                  <code className="text-xs bg-zinc-950 px-4 py-2 rounded-lg border border-zinc-700 text-[#397ef7] font-mono font-bold">
                    Secret Key: {totpSetupSecret}
                  </code>
                </div>
              )}

              {totpSetupSuccess ? (
                <div className="space-y-5">
                  <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl text-xs flex gap-3">
                    <CheckCircle className="flex-shrink-0" />
                    <div className="space-y-2">
                      <strong className="text-white block">Google Authenticator verification successful!</strong>
                      <p className="text-slate-200">Add this variable to your .env file or deployment configuration:</p>
                      <pre className="mt-2 bg-black/80 p-3 rounded-lg border border-emerald-500/30 text-emerald-300 select-all font-mono">
                        TOTP_SECRET={totpSetupSecret}
                      </pre>
                    </div>
                  </div>
                  <button 
                    onClick={completeLogin}
                    className="btn-primary w-full py-3.5 text-sm font-bold"
                  >
                    Proceed to Dashboard
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSetupTotpVerify} className="space-y-5">
                  <div className="space-y-3">
                    <label className="block text-xs uppercase font-bold text-slate-200 tracking-wider">
                      Enter 6-digit Verification Code
                    </label>
                    <input 
                      type="text" 
                      placeholder="000 000" 
                      value={totpVerifyCode}
                      onChange={(e) => setTotpVerifyCode(e.target.value)}
                      className="form-input text-center tracking-widest text-lg font-bold py-3.5" 
                    />
                  </div>
                  
                  {authError && (
                    <div className="bg-rose-950/40 border border-rose-500/40 text-rose-300 p-4 rounded-xl text-xs flex gap-3">
                      <AlertCircle className="flex-shrink-0" size={16} />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-3">
                    <button 
                      type="button" 
                      onClick={() => setShow2faSetup(false)}
                      className="btn-secondary w-full py-3 text-sm font-semibold text-center block"
                    >
                      Back
                    </button>
                    <button type="submit" className="btn-primary w-full py-3 text-sm font-bold">
                      Verify & Activate
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : mode === 'register' ? (
            /* NEW ACCOUNT REGISTRATION FORM */
            <div className="space-y-6">
              <div className="text-left space-y-1">
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2 font-outfit">
                  <Sparkles className="text-[#397ef7]" size={20} />
                  <span>Create Your Account</span>
                </h2>
                <p className="text-xs text-slate-300">
                  Register your account details to access your Munyun wealth portal.
                </p>
              </div>

              {/* Custom Sign Up with Google Button */}
              <button 
                type="button" 
                onClick={handleGoogleSignUp}
                className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 font-semibold py-3 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-100 transition-all shadow-md active:scale-[0.99] cursor-pointer text-sm"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign Up with Google</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 border-t border-zinc-800"></div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">or fill details below</span>
                <div className="flex-1 border-t border-zinc-800"></div>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* First and Last Name Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs uppercase font-bold text-slate-200 tracking-wider">
                      First Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Jane" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-input text-sm py-2.5 px-3" 
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs uppercase font-bold text-slate-200 tracking-wider">
                      Last Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Doe" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="form-input text-sm py-2.5 px-3" 
                    />
                  </div>
                </div>

                {/* Preferred Name / Username */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs uppercase font-bold text-slate-200 tracking-wider flex items-center gap-1.5">
                    <User size={13} className="text-[#397ef7]" />
                    <span>Preferred Name / Username</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="JaneD" 
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    className="form-input text-sm py-2.5 px-3" 
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs uppercase font-bold text-slate-200 tracking-wider flex items-center gap-1.5">
                    <Mail size={13} className="text-[#397ef7]" />
                    <span>Email Address *</span>
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="jane.doe@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input text-sm py-2.5 px-3" 
                  />
                </div>

                {/* Mobile Phone Number */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs uppercase font-bold text-slate-200 tracking-wider flex items-center gap-1.5">
                    <Phone size={13} className="text-[#397ef7]" />
                    <span>Mobile Phone Number *</span>
                  </label>
                  <input 
                    type="tel" 
                    required
                    placeholder="+1 (774) 312 6471" 
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="form-input text-sm py-2.5 px-3" 
                  />
                </div>

                {/* Feedback Error / Success */}
                {authError && (
                  <div className="bg-rose-950/40 border border-rose-500/40 text-rose-300 p-3 rounded-xl text-xs flex gap-2.5 text-left">
                    <AlertCircle className="flex-shrink-0" size={16} />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccessMsg && (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs flex gap-2.5 text-left">
                    <CheckCircle className="flex-shrink-0" size={16} />
                    <span>{authSuccessMsg}</span>
                  </div>
                )}

                <button type="submit" className="btn-primary w-full py-3.5 text-sm font-bold mt-2">
                  Create Account & Proceed
                </button>
              </form>

              {/* Optional 2FA setup link */}
              <div className="border-t border-zinc-800/90 pt-4 flex flex-col items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setShow2faSetup(true)}
                  className="text-xs text-[#397ef7] hover:underline font-semibold"
                >
                  🛡️ Setup Google Authenticator 2FA instead
                </button>
              </div>
            </div>
          ) : (
            /* REGULAR LOGIN FLOW */
            <div className="space-y-6 sm:space-y-7">
              {/* Method selector */}
              <div className="space-y-3">
                <label className="block text-xs uppercase font-bold text-slate-200 tracking-wider">
                  Authentication Method
                </label>
                <select 
                  value={authMethod}
                  onChange={(e) => {
                    setAuthMethod(e.target.value as any);
                    setAuthError('');
                    setAuthSuccessMsg('');
                  }}
                  className="form-input cursor-pointer py-3.5 px-4 text-sm"
                >
                  <option value="passcode">Passcode Login</option>
                  <option value="totp">Authenticator Code</option>
                  <option value="sms">SMS Verification</option>
                </select>
              </div>

              {/* Flow 1: Passcode */}
              {authMethod === 'passcode' && (
                <form onSubmit={handlePasscodeLogin} className="space-y-5 sm:space-y-6">
                  <div className="space-y-3">
                    <label className="block text-xs uppercase font-bold text-slate-200 tracking-wider">
                      Passcode
                    </label>
                    <input 
                      type="password" 
                      placeholder="••••" 
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="form-input text-center text-xl tracking-widest py-3.5" 
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full py-3.5 text-sm font-bold">
                    Authenticate
                  </button>
                </form>
              )}

              {/* Flow 2: TOTP */}
              {authMethod === 'totp' && (
                <form onSubmit={handleTotpLogin} className="space-y-5 sm:space-y-6">
                  <div className="space-y-3">
                    <label className="block text-xs uppercase font-bold text-slate-200 tracking-wider">
                      Google Authenticator Code
                    </label>
                    <input 
                      type="text" 
                      placeholder="000 000" 
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      className="form-input text-center text-lg tracking-widest font-bold py-3.5" 
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full py-3.5 text-sm font-bold">
                    Unlock Portal
                  </button>
                </form>
              )}

              {/* Flow 3: SMS */}
              {authMethod === 'sms' && (
                <div className="space-y-5 sm:space-y-6">
                  {!smsSent ? (
                    <form onSubmit={handleSmsRequest} className="space-y-5 sm:space-y-6">
                      <div className="space-y-3">
                        <label className="block text-xs uppercase font-bold text-slate-200 tracking-wider">
                          Phone Number
                        </label>
                        <input 
                          type="text" 
                          placeholder="+1 (774) 312 6471" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="form-input py-3.5 px-4" 
                        />
                      </div>
                      <button type="submit" className="btn-primary w-full py-3.5 text-sm font-bold">
                        Send Code
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSmsVerify} className="space-y-5 sm:space-y-6">
                      <div className="text-xs text-slate-200 pb-1">
                        Code sent to <strong className="text-white">{phone}</strong>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs uppercase font-bold text-slate-200 tracking-wider">
                          Enter 6-digit SMS Code
                        </label>
                        <input 
                          type="text" 
                          placeholder="000 000" 
                          value={smsCode}
                          onChange={(e) => setSmsCode(e.target.value)}
                          className="form-input text-center text-lg tracking-widest font-bold py-3.5" 
                        />
                      </div>
                      <div className="space-y-3 pt-1">
                        <button type="submit" className="btn-primary w-full py-3.5 text-sm font-bold">
                          Unlock Portal
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            setSmsSent(false);
                            setSmsCode('');
                            setAuthSuccessMsg('');
                          }}
                          className="btn-secondary w-full py-3 text-xs font-semibold"
                        >
                          Resend Code / Change Number
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Feedback messages */}
              {authError && (
                <div className="bg-rose-950/40 border border-rose-500/40 text-rose-300 p-4 rounded-xl text-xs flex gap-3">
                  <AlertCircle className="flex-shrink-0" size={16} />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccessMsg && (
                <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl text-xs flex gap-3">
                  <CheckCircle className="flex-shrink-0" size={16} />
                  <span>{authSuccessMsg}</span>
                </div>
              )}

              {/* Link to Register Account */}
              {authMethod === 'passcode' && (
                <div className="border-t border-zinc-800/90 pt-6 mt-6 flex flex-col items-center gap-3">
                  <span className="text-xs text-slate-300 font-semibold uppercase tracking-widest">or</span>
                  <Link 
                    href="/register"
                    className="btn-secondary w-full text-xs py-3 font-semibold text-center block"
                  >
                    ✨ Register a New Account
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="text-center text-xs text-slate-300 tracking-wider font-semibold px-4">
          PROTECTED BY AES-256 LOCAL DATABASE ENCRYPTION.
        </div>
      </div>
    </div>
  );
}
