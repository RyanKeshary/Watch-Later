'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Download,
  Share2,
  Cpu,
  Layers,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Play,
  X,
  Eye,
  EyeOff,
  FolderSync
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SplashCursor from '@/components/SplashCursor';

interface ServicePageProps {
  onSignInSuccess?: () => void;
  onEnterDashboard?: () => void;
  hasSession?: boolean;
}

export default function ServiceLandingPage({
  onSignInSuccess,
  onEnterDashboard,
  hasSession = false
}: ServicePageProps) {
  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Download CTA state (§1.6: Download -> confirmation -> morph to Sign In)
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Check if previously downloaded in this session
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('wl_downloaded') === 'true') {
      setHasDownloaded(true);
    }
  }, []);

  const handleDownloadClick = () => {
    if (hasDownloaded) {
      setShowAuthModal(true);
      return;
    }

    // Trigger APK download
    const link = document.createElement('a');
    link.href = '/watch-later.apk';
    link.download = 'watch-later.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Save in session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('wl_downloaded', 'true');
    }

    setDownloadSuccess(true);
    setTimeout(() => {
      setHasDownloaded(true);
    }, 1800);
  };

  // Auth submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setShowAuthModal(false);
        onSignInSuccess?.();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          setShowAuthModal(false);
          onSignInSuccess?.();
        } else {
          setAuthError('Check your inbox to confirm your account, then sign in.');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 3D Hero Parallax Tilt state
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Horizontal Scroll Section Ref & Logic (Desktop Scroll-Hijack)
  const horizontalSectionRef = useRef<HTMLDivElement>(null);
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      if (!horizontalSectionRef.current) return;
      const rect = horizontalSectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollable = horizontalSectionRef.current.offsetHeight - windowHeight;

      if (totalScrollable <= 0) return;

      const topOffset = -rect.top;
      const progress = Math.max(0, Math.min(1, topOffset / totalScrollable));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const steps = [
    {
      num: '01',
      title: 'Share the reel',
      subtitle: 'Same share button you already use',
      desc: 'No copying links. No switching apps. Just hit the paper airplane in Instagram, tap Watch Later, and keep scrolling. Zero friction.',
      tag: 'ONE TAP',
      badge: 'Instagram Native'
    },
    {
      num: '02',
      title: 'It gets grabbed silently',
      subtitle: 'No app opens, nothing to fill out',
      desc: 'Our Android listener catches the link in under 20 milliseconds, queues it offline if your signal drops, and slips back into the dark. No popups, no forms.',
      tag: '20MS CAPTURE',
      badge: 'Zero Interrupt'
    },
    {
      num: '03',
      title: 'It gets sorted automatically',
      subtitle: 'AI reads it and files it into the right category',
      desc: 'Transcripts, captions, and creators parsed on the fly. No manual tagging ever. Your reels auto-file into clean pillars like Cooking, AI, or Fitness.',
      tag: 'AI AUTONOMY',
      badge: 'Smart Indexing'
    },
    {
      num: '04',
      title: 'Ready to actually watch',
      subtitle: 'Sitting in your dashboard — organized, not buried',
      desc: 'One clean dashboard instead of a 300-reel junk drawer. Pick a mood or category, extract the insight, and once watched, it auto-cleans out.',
      tag: 'THE PAYOFF',
      badge: 'Zero Clutter'
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#0B0B0B] text-[#D9D9D9] font-sans selection:bg-[#333333] selection:text-white overflow-x-hidden antialiased">
      {/* Custom Fluid Cursor Effect (reused from existing codebase, hidden on touch devices via CSS) */}
      <div className="hidden md:block pointer-events-none">
        <SplashCursor
          contained={false}
          colors={['#ffffff', '#d4d4d8', '#a1a1aa']}
          rainbow={false}
          size={0.55}
          force={0.25}
          swirl={12}
          trail={2.2}
          clickSplash
          colorSpeed={0}
          intensity={0.42}
          momentum={0.65}
          glow={0.08}
          quality="medium"
          intro={false}
          zIndex={1}
        />
      </div>

      {/* ========================================================================= */}
      {/* 2.1 NAV: Wordmark only + secondary CTA mirroring the hero state           */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0B0B0B]/80 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-white/20 to-white/5 border border-white/20 flex items-center justify-center shadow-inner">
              <span className="font-zolo font-black text-sm text-white tracking-tighter">W</span>
            </div>
            <span className="font-zolo text-lg font-bold tracking-tight text-white">Watch Later</span>
          </div>

          <div className="flex items-center gap-4">
            {hasSession ? (
              <button
                type="button"
                onClick={onEnterDashboard}
                className="inline-flex items-center justify-center rounded-full bg-white text-black px-4 py-2 text-xs font-semibold hover:bg-neutral-200 transition active:scale-[0.98]"
              >
                Go to Dashboard
              </button>
            ) : hasDownloaded ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="inline-flex items-center justify-center rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold hover:bg-neutral-200 transition active:scale-[0.98]"
              >
                Sign In
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownloadClick}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-1.5 text-xs font-medium text-white transition active:scale-[0.98]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2.2 HERO: Headline + 1-sentence plain pitch + Reactive 3D Background      */}
      {/* ========================================================================= */}
      <section
        ref={heroRef}
        className="relative min-h-[88vh] flex flex-col justify-center items-center px-6 overflow-hidden pt-12 pb-24"
      >
        {/* Reactive 3D Hero Background (§3.1) */}
        <div
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
          style={{ perspective: '1200px' }}
        >
          {/* Ambient Lighting Gradients */}
          <div
            className="absolute h-[420px] w-[420px] rounded-full bg-amber-600/[0.07] blur-[120px] transition-transform duration-700 ease-out"
            style={{
              transform: `translate3d(${mousePos.x * 40}px, ${mousePos.y * 40 - scrollY * 0.15}px, 0)`
            }}
          />
          <div
            className="absolute h-[340px] w-[340px] rounded-full bg-rose-900/[0.06] blur-[100px] transition-transform duration-700 ease-out"
            style={{
              transform: `translate3d(${-mousePos.x * 30}px, ${-mousePos.y * 30 - scrollY * 0.2}px, 0)`
            }}
          />

          {/* 3D Geometric Depth Rig */}
          <div
            className="relative transition-transform duration-200 ease-out will-change-transform"
            style={{
              transform: `rotateX(${-mousePos.y * 14}deg) rotateY(${mousePos.x * 16}deg) translateZ(-60px) translateY(${-scrollY * 0.12}px)`
            }}
          >
            {/* Outer 3D Glass Layer */}
            <div className="h-80 w-80 sm:h-96 sm:w-96 rounded-[48px] border border-white/[0.08] bg-gradient-to-tr from-white/[0.03] to-white/[0.01] backdrop-blur-[2px] shadow-2xl [transform:rotate(15deg)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent opacity-60" />
            </div>

            {/* Inner Floating Offset Cube */}
            <div
              className="absolute -inset-6 rounded-[40px] border border-white/[0.12] bg-white/[0.015] [transform:rotate(-10deg)_translateZ(40px)] transition-transform duration-300"
              style={{
                transform: `rotate(-10deg) translateZ(${30 + Math.abs(mousePos.x) * 20}px)`
              }}
            />
          </div>
        </div>

        {/* Hero Content Layer */}
        <div className="relative z-10 mx-auto max-w-3xl text-center flex flex-col items-center">
          {/* Tagline Headline */}
          <h1 className="font-zolo text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white text-balance leading-[1.08] mb-6">
            Never lose a reel worth revisiting.
          </h1>

          {/* Plain Talk / Friend-Style Pitch */}
          <p className="text-base sm:text-lg text-[#A1A1AA] max-w-xl text-balance leading-relaxed mb-10">
            Stop letting reels rot in your saved folder. Just share the reel to Watch Later — it gets grabbed silently, sorted by AI into clean categories, and stays ready to actually watch.
          </p>

          {/* Single Hero CTA with §1.6 morphing logic */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {downloadSuccess ? (
                <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-8 py-4 text-sm font-semibold text-emerald-300 shadow-lg">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Downloading APK... Check your notifications.</span>
                </div>
              ) : hasDownloaded ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                  className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-black shadow-2xl transition-all duration-300 hover:bg-neutral-200 active:scale-[0.98]"
                >
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  className="group relative inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm font-bold text-black shadow-[0_0_40px_rgba(255,255,255,0.18)] transition-all duration-300 hover:bg-neutral-200 active:scale-[0.98]"
                >
                  <Download className="h-4 w-4" />
                  <span>Download App (Android)</span>
                </button>
              )}
            </div>

            {/* Post-Download Confirmation Hint */}
            <p
              className={`text-xs text-[#71717A] transition-opacity duration-500 ${
                hasDownloaded || downloadSuccess ? 'opacity-100' : 'opacity-0'
              }`}
            >
              You&apos;re in — sign in with the account you shared your first reel from.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.3 HOW IT WORKS: Horizontal-Scroll Sequence (Desktop Hijack + Mobile Swipe)*/}
      {/* ========================================================================= */}
      <section
        ref={horizontalSectionRef}
        className="relative md:h-[300vh] bg-[#070707] border-y border-white/[0.06]"
      >
        {/* Desktop Sticky Container for Horizontal Track */}
        <div className="md:sticky md:top-0 md:h-screen md:flex md:flex-col md:justify-center overflow-hidden py-20 md:py-0">
          <div className="mx-auto max-w-6xl px-6 mb-8 md:mb-12">
            <span className="font-mono text-xs tracking-widest text-[#71717A] uppercase block mb-2">
              HOW IT WORKS
            </span>
            <h2 className="font-zolo text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              One tap. Everything else is on autopilot.
            </h2>
          </div>

          {/* Desktop Horizontal Sliding Track (§3.2) */}
          <div className="hidden md:block w-full overflow-hidden">
            <div
              ref={horizontalTrackRef}
              className="flex gap-6 px-6 transition-transform duration-100 ease-out will-change-transform"
              style={{
                transform: `translateX(calc(${-(scrollProgress * (steps.length - 1) * 380)}px + 5vw))`
              }}
            >
              {steps.map((step, idx) => (
                <div
                  key={step.num}
                  className="w-[420px] shrink-0 rounded-[24px] border border-white/[0.1] bg-[#121214] p-8 shadow-xl flex flex-col justify-between transition-all duration-300 hover:border-white/25"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-xs font-semibold tracking-wider text-[#A1A1AA] border border-white/10 px-2.5 py-1 rounded-full bg-white/[0.03]">
                        {step.num} {'//'} {step.tag}
                      </span>
                      <span className="text-xs text-[#71717A] font-medium">{step.badge}</span>
                    </div>

                    <h3 className="font-zolo text-2xl font-bold text-white mb-2 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm font-medium text-amber-500/90 mb-4">{step.subtitle}</p>
                    <p className="text-sm text-[#A1A1AA] leading-relaxed">{step.desc}</p>
                  </div>

                  <div className="pt-8 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#71717A] font-mono">
                    <span>STEP {idx + 1} OF 4</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Touch Native Horizontal Swipe Strip (§3.5) */}
          <div className="md:hidden flex gap-4 overflow-x-auto px-6 pb-6 pt-2 snap-x snap-mandatory scrollbar-none">
            {steps.map((step) => (
              <div
                key={step.num}
                className="w-[82vw] shrink-0 snap-center rounded-[20px] border border-white/[0.1] bg-[#121214] p-6 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[11px] font-semibold text-[#A1A1AA] border border-white/10 px-2 py-0.5 rounded-full">
                      {step.num}
                    </span>
                    <span className="text-[11px] text-[#71717A]">{step.badge}</span>
                  </div>
                  <h3 className="font-zolo text-xl font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-xs font-medium text-amber-500/90 mb-3">{step.subtitle}</p>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress dots indicator */}
          <div className="hidden md:flex items-center justify-center gap-2 mt-8">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  scrollProgress >= i / (steps.length - 1) - 0.1 &&
                  scrollProgress <= i / (steps.length - 1) + 0.1
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.4 THE DASHBOARD / PAYOFF: Clean, minimal visual of sorted categories    */}
      {/* ========================================================================= */}
      <section className="py-28 px-6 bg-[#0B0B0B]">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-mono text-xs tracking-widest text-[#71717A] uppercase block mb-3">
              THE PAYOFF
            </span>
            <h2 className="font-zolo text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 text-balance">
              No endless saved list. Just what matters.
            </h2>
            <p className="text-sm sm:text-base text-[#A1A1AA] text-balance">
              Instead of scrolling past the same 200 saved reels forever, pick a category and actually watch what you saved.
            </p>
          </div>

          {/* Minimalist Dashboard Preview Frame (Clean Mockup, No Fake Code) */}
          <div className="relative rounded-[28px] border border-white/10 bg-[#121214] p-5 sm:p-8 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-5 mb-8">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-white/20" />
                <div className="h-3 w-3 rounded-full bg-white/10" />
                <div className="h-3 w-3 rounded-full bg-white/10" />
                <span className="ml-3 font-mono text-xs text-[#71717A]">library.watchlater.internal</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                AI Auto-Synced
              </span>
            </div>

            {/* Category Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-[#18181B] p-5 transition hover:border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-[#A1A1AA]">4 REELS READY</span>
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                </div>
                <h4 className="font-zolo font-bold text-lg text-white mb-1">Cooking & Food</h4>
                <p className="text-xs text-[#71717A] leading-relaxed">
                  Italian pasta technique, 3-minute sourdough, homemade ramen broth.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#18181B] p-5 transition hover:border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-[#A1A1AA]">7 REELS READY</span>
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                </div>
                <h4 className="font-zolo font-bold text-lg text-white mb-1">Design & Visual</h4>
                <p className="text-xs text-[#71717A] leading-relaxed">
                  Typography hierarchies, spatial motion principles, tactile interfaces.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#18181B] p-5 transition hover:border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-[#A1A1AA]">3 REELS READY</span>
                  <span className="h-2 w-2 rounded-full bg-purple-400" />
                </div>
                <h4 className="font-zolo font-bold text-lg text-white mb-1">Fitness & Recovery</h4>
                <p className="text-xs text-[#71717A] leading-relaxed">
                  Shoulder mobility cues, deadlift mechanics, recovery routines.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.5 FINAL CTA: One line pitch + exactly one CTA: "Create account"         */}
      {/* ========================================================================= */}
      <section className="py-24 px-6 border-t border-white/[0.06] bg-[#070707] text-center">
        <div className="mx-auto max-w-xl flex flex-col items-center">
          <h2 className="font-zolo text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 text-balance">
            Never lose a reel worth revisiting.
          </h2>
          <p className="text-sm sm:text-base text-[#A1A1AA] mb-8 text-balance">
            Get your personal dashboard ready before sharing your next reel.
          </p>

          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setShowAuthModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-black shadow-xl hover:bg-neutral-200 transition active:scale-[0.98]"
          >
            <span>Create account</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.6 FOOTER: Wordmark + tagline only, one line                             */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/[0.06] py-8 px-6 bg-[#070707]">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <span className="font-zolo font-bold text-sm text-white">Watch Later</span>
          <span>Never lose a reel worth revisiting.</span>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* AUTH MODAL (Clean minimal login / register)                               */}
      {/* ========================================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-[24px] border border-white/15 bg-[#121214] p-8 shadow-2xl text-left">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-6 right-6 text-[#71717A] hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-zolo text-2xl font-bold text-white mb-1">
              {authMode === 'signin' ? 'Welcome back' : 'Create account'}
            </h3>
            <p className="text-xs text-[#A1A1AA] mb-6">
              {authMode === 'signin'
                ? 'Sign in to access your categorized reel library.'
                : 'Create your account to start auto-sorting your saved reels.'}
            </p>

            {authError && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#A1A1AA] mb-1.5">EMAIL</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-[#52525B] focus:border-white/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A1A1AA] mb-1.5">PASSWORD</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-[#52525B] focus:border-white/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-[#71717A] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-white py-3 text-sm font-bold text-black hover:bg-neutral-200 transition disabled:opacity-50 active:scale-[0.98]"
              >
                {authLoading ? 'Authenticating...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#71717A]">
              {authMode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className="text-white hover:underline font-semibold"
                  >
                    Create account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="text-white hover:underline font-semibold"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
