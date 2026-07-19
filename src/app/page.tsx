"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, DollarSign, CalendarCheck, Landmark, Target, ChevronDown, ChevronsRight } from 'lucide-react';

const CLI_MESSAGES = [
  "initializing quantum_munyun_engine.sh ... [OK]",
  "encrypting vault with AES-256-GCM ... [OK]",
  "connecting to secure financial node ... [OK]",
  "fetching latest portfolio telemetry ... [OK]",
  "munyun digital advisor ready."
];

const FAQ_ITEMS = [
  {
    question: "Is my financial data safe with My Munyun?",
    answer: "Yes. We utilize bank-grade 256-bit AES encryption and read-only data access. Your login credentials are encrypted and never stored on our servers."
  },
  {
    question: "How does My Munyun connect to my bank accounts?",
    answer: "My Munyun integrates securely with Plaid—trusted by over 11,000 financial institutions across North America—to aggregate your balances, direct deposits, and transactions smoothly."
  },
  {
    question: "Can I track income, recurring bills, and subscriptions automatically?",
    answer: "Absolutely. My Munyun automatically detects paychecks, incoming deposits, recurring monthly bill due dates, and active subscriptions so you never miss a payment."
  },
  {
    question: "Is there a free trial or monthly fee?",
    answer: "My Munyun offers a 100% free starter tier with core tracking features. You can sign up and explore your dashboard without entering a credit card."
  },
  {
    question: "Can I set and monitor custom financial goals?",
    answer: "Yes. You can define personalized savings goals, set monthly spending budgets, and track your long-term net worth milestones directly from your account dashboard."
  }
];

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [cliIndex, setCliIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSkipSplash = () => {
    setShowSplash(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('munyun_splash_active', 'false');
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useEffect(() => {
    // Always play splash screen animation when visiting '/'
    setShowSplash(true);
    setCliIndex(0);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('munyun_splash_active', 'true');
    }

    // Cycle through all 5 CLI messages over 5 seconds (1000ms per step)
    const messageInterval = setInterval(() => {
      setCliIndex((prev) => {
        if (prev < CLI_MESSAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    // Guarantee splash screen plays for at least 5 seconds (5000ms)
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('munyun_splash_active', 'false');
      }
    }, 5000);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(splashTimer);
    };
  }, []);

  if (showSplash) {
    return (
      <div className="fixed inset-0 h-screen min-h-screen w-screen bg-gradient-to-b from-[#0e2a5e] via-[#040c1b] to-black flex flex-col justify-center items-center z-50 animate-splash px-4 py-6 sm:p-12 relative">
        {/* Top Right Skip Button */}
        <button
          onClick={handleSkipSplash}
          className="absolute top-4 right-4 sm:top-6 sm:right-8 z-50 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-300 hover:text-white bg-slate-900/70 hover:bg-[#397ef7]/20 px-4 py-2 rounded-full border border-[#397ef7]/35 backdrop-blur-md shadow-lg transition-all hover:scale-105 cursor-pointer active:scale-95 group"
        >
          <span>tap here skip</span>
          <ChevronsRight className="w-4 h-4 text-[#397ef7] group-hover:translate-x-0.5 transition-transform" />
        </button>
        <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 text-center max-w-lg mx-auto w-full h-full px-4 sm:px-6 py-2">
          {/* Main Title Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-outfit leading-tight px-4 py-1 mb-1 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <span>💸 My</span>
            <span className="text-[#397ef7]">Munyun</span>
          </h1>
          
          {/* Subheading Advisor Badge */}
          <div className="p-1 mb-5 sm:mb-7">
            <p className="text-xs sm:text-sm font-bold text-slate-200 tracking-[0.2em] uppercase bg-[#397ef7]/10 px-7 py-3.5 rounded-full shadow-[0_0_25px_rgba(57,126,247,0.25)] inline-block border border-[#397ef7]/30">
              Your Digital Munyun Advisor 💰️
            </p>
          </div>

          {/* Witty CLI Terminal Box */}
          <div className="w-full max-w-md bg-slate-950/95 border border-[#397ef7]/45 rounded-2xl p-4 sm:p-5 shadow-[0_0_35px_rgba(57,126,247,0.2)] text-left font-mono text-xs sm:text-sm my-2">
            <div className="flex items-center gap-2 mb-2.5 border-b border-slate-800/90 pb-2 px-1">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
              <span className="text-[10px] text-slate-400 font-sans ml-auto uppercase tracking-wider font-semibold px-1">munyun-cli v2.4</span>
            </div>
            <div className="text-[#397ef7] font-semibold flex items-center gap-2 min-h-[40px] py-2.5 px-3 sm:px-4 bg-slate-900/50 rounded-xl border border-slate-800/60 shadow-inner overflow-hidden">
              <span className="text-emerald-400 font-bold text-base px-1 flex-shrink-0">$</span>
              <span className="text-slate-100 flex-1 leading-relaxed px-1.5 break-words overflow-hidden">{CLI_MESSAGES[cliIndex]}</span>
              <span className="w-2.5 h-4 bg-[#397ef7] animate-pulse inline-block flex-shrink-0 rounded-xs mx-0.5"></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0e2a5e] via-[#040c1b] to-black text-white flex flex-col items-center overflow-x-hidden pb-16">
      {/* Top Full-Width Hero Image Banner */}
      <div className="w-full relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#0e2a5e]/80 to-[#0e2a5e] border-b border-[#397ef7]/30 shadow-[0_10px_40px_rgba(57,126,247,0.25)] animate-login-instant">
        <div className="w-full h-64 sm:h-80 md:h-[420px] lg:h-[500px] relative flex items-center justify-center">
          <Image
            src="/image_4f7c657f.png"
            alt="My Munyun Hero Banner"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center w-full h-full opacity-90 transition-transform duration-700 hover:scale-105"
          />
          {/* Gradient overlays for seamless blend & visual contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e2a5e] via-transparent to-slate-950/60 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e2a5e]/40 via-transparent to-[#0e2a5e]/40 pointer-events-none"></div>
        </div>
      </div>

      {/* Main Content Area Below Full-Width Banner */}
      <div className="max-w-5xl mx-auto w-full px-6 py-10 sm:py-14 space-y-16 text-center animate-login-instant">
        {/* Main Title Heading */}
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-outfit leading-tight flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <span>💸 My</span>
            <span className="text-[#397ef7]">Munyun</span>
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-200 tracking-[0.2em] uppercase bg-[#397ef7]/10 px-7 py-3 rounded-full shadow-[0_0_25px_rgba(57,126,247,0.25)] inline-block border border-[#397ef7]/30">
            Your Digital Munyun Advisor 💰️
          </p>
        </div>

        {/* App Intro Paragraph */}
        <div className="max-w-2xl mx-auto space-y-3 text-left">
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
            My Munyun is your all-in-one digital wealth advisor, designed to simplify money management by aggregating your bank accounts, income streams, recurring bills, and spending into effortless real-time insights.
          </p>
          <div className="pt-1">
            <Link 
              href="/about" 
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#397ef7] hover:text-[#5b96ff] transition-colors bg-[#397ef7]/10 hover:bg-[#397ef7]/20 border border-[#397ef7]/30 px-5 py-2.5 rounded-full shadow-sm"
            >
              <span>Read More</span>
              <span className="text-base leading-none">→</span>
            </Link>
          </div>
        </div>

        {/* How It Works Section */}
        <section className="space-y-6 max-w-5xl mx-auto w-full">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit tracking-tight">
              How It Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Three simple steps to take full control of your financial life
            </p>
          </div>

          <div className="custom-card p-8 sm:p-10 border-[#397ef7]/30 shadow-[0_0_50px_rgba(57,126,247,0.2)] w-full relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {/* Step 1 */}
              <div className="flex flex-col items-start text-left gap-3 group">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#397ef7] text-white font-extrabold text-xs flex items-center justify-center shadow-[0_0_15px_rgba(57,126,247,0.5)]">
                    01
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#397ef7]">Setup</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white font-outfit">Connect Your Accounts</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Securely link your checking, savings, and credit accounts in under 2 minutes with bank-grade 256-bit AES encryption.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-start text-left gap-3 group">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#397ef7] text-white font-extrabold text-xs flex items-center justify-center shadow-[0_0_15px_rgba(57,126,247,0.5)]">
                    02
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#397ef7]">Automation</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white font-outfit">Automate Intelligence</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  My Munyun automatically categorizes income streams, tracks recurring subscriptions, and monitors budgets in real time.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-start text-left gap-3 group">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#397ef7] text-white font-extrabold text-xs flex items-center justify-center shadow-[0_0_15px_rgba(57,126,247,0.5)]">
                    03
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#397ef7]">Growth</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white font-outfit">Reach Goals & Build Wealth</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Set personalized wealth targets, monitor net worth milestones, and make confident financial decisions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-6 max-w-5xl mx-auto w-full pt-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit tracking-tight">
              Features
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Everything you need to aggregate, track, and grow your wealth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
            <div className="custom-card p-6 border-[#397ef7]/30 flex flex-col items-start text-left gap-3 group hover:border-[#397ef7]/60 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#397ef7]/15 border border-[#397ef7]/30 flex items-center justify-center text-[#397ef7] group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-outfit">Monthly Income & Deposits</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Track salary paychecks, direct deposits, and incoming cash flows automatically in one unified feed.
              </p>
            </div>

            <div className="custom-card p-6 border-[#397ef7]/30 flex flex-col items-start text-left gap-3 group hover:border-[#397ef7]/60 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#397ef7]/15 border border-[#397ef7]/30 flex items-center justify-center text-[#397ef7] group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-outfit">Spending & Budgeting</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Categorize expenses, monitor daily spending habits, and get real-time alerts when near budget limits.
              </p>
            </div>

            <div className="custom-card p-6 border-[#397ef7]/30 flex flex-col items-start text-left gap-3 group hover:border-[#397ef7]/60 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#397ef7]/15 border border-[#397ef7]/30 flex items-center justify-center text-[#397ef7] group-hover:scale-110 transition-transform">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-outfit">Recurring Bills & Subscriptions</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Keep tabs on recurring bill due dates, active subscriptions, and upcoming automated payments.
              </p>
            </div>

            <div className="custom-card p-6 border-[#397ef7]/30 flex flex-col items-start text-left gap-3 group hover:border-[#397ef7]/60 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#397ef7]/15 border border-[#397ef7]/30 flex items-center justify-center text-[#397ef7] group-hover:scale-110 transition-transform">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-outfit">Connect Bank Accounts</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Securely link multiple financial institutions, checking, savings, and credit cards via bank integrations.
              </p>
            </div>

            <div className="custom-card p-6 border-[#397ef7]/30 flex flex-col items-start text-left gap-3 group hover:border-[#397ef7]/60 transition-all duration-300 md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 rounded-xl bg-[#397ef7]/15 border border-[#397ef7]/30 flex items-center justify-center text-[#397ef7] group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-outfit">Set & Track Goals</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Define custom financial goals, monitor savings milestones, and track your long-term wealth progression.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="space-y-6 max-w-4xl mx-auto w-full pt-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Got questions? We have answers.
            </p>
          </div>

          <div className="space-y-3 text-left">
            {FAQ_ITEMS.map((item, index) => (
              <div 
                key={index}
                className="custom-card border-[#397ef7]/30 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between text-left gap-4 font-bold text-white text-sm sm:text-base hover:text-[#397ef7] transition-colors focus:outline-none"
                  aria-expanded={openFaq === index}
                >
                  <span className="font-outfit">{item.question}</span>
                  <ChevronDown className={`w-5 h-5 text-[#397ef7] shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-[#397ef7]/15 pt-4 animate-fadeIn">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Final Bottom CTA Banner */}
        <section className="w-full pt-6 pb-4">
          <div className="custom-card p-8 sm:p-12 border-[#397ef7]/40 bg-gradient-to-r from-[#0e2a5e]/90 via-[#040c1b]/95 to-[#0e2a5e]/90 shadow-[0_0_60px_rgba(57,126,247,0.25)] rounded-3xl relative overflow-hidden flex flex-col items-center text-center gap-6">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-outfit tracking-tight leading-tight">
                Ready to Take Control of Your <span className="text-[#397ef7]">Munyun</span>?
              </h2>
              <p className="text-xs sm:text-base text-slate-200 leading-relaxed font-normal">
                Join thousands of smart spenders tracking direct deposits, recurring bills, and savings goals in real time. No credit card required.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full max-w-md">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#397ef7] hover:bg-[#286ae6] text-white font-bold text-sm sm:text-base px-8 py-3.5 rounded-full shadow-[0_0_25px_rgba(57,126,247,0.4)] transition-all hover:scale-105"
              >
                <span>Get Started Free</span>
                <span className="text-lg leading-none">→</span>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#397ef7]/10 hover:bg-[#397ef7]/20 border border-[#397ef7]/40 text-slate-200 hover:text-white font-bold text-sm sm:text-base px-8 py-3.5 rounded-full transition-all"
              >
                <span>Sign In to Account</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
