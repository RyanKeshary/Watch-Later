'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Download,
  ArrowRight,
  CheckCircle2,
  X,
  Eye,
  EyeOff
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

    const link = document.createElement('a');
    link.href = '/watch-later.apk';
    link.download = 'watch-later.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('wl_downloaded', 'true');
    }

    setDownloadSuccess(true);
    setTimeout(() => {
      setHasDownloaded(true);
    }, 1800);
  };

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
      const x = (e.clientX / innerWidth - 0.5) * 2;
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
      note: 'Same native share sheet you tap every day',
      body: 'No copying links into a notes app or texting yourself. Hit the paper airplane on Instagram, tap Watch Later, and keep scrolling.',
      detail: 'Zero app switching'
    },
    {
      num: '02',
      title: 'It gets grabbed silently',
      note: 'No window opens, nothing to fill out',
      body: 'Caught in under twenty milliseconds. If your cellular signal cuts out on the subway, it queues offline in local storage and syncs the second you reconnect.',
      detail: 'Offline-first queue'
    },
    {
      num: '03',
      title: 'It gets sorted automatically',
      note: 'Transcripts and captions parsed on arrival',
      body: 'No manual folders, no tagging chores. The engine reads what the creator actually said and sorts it into clean, dedicated pillars.',
      detail: 'Zero manual tagging'
    },
    {
      num: '04',
      title: 'Ready to actually watch',
      note: 'Sitting in your dashboard — organized, not buried',
      body: 'One focused library instead of an endless saved grave. Open a category, extract the insight, and once watched, it clears out.',
      detail: 'Auto-cleaned queue'
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#080809] text-[#E4E4E7] font-sans selection:bg-[#27272A] selection:text-white overflow-x-hidden antialiased">
      {/* Custom Fluid Cursor Effect (preserved on desktop, hidden on touch devices) */}
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
      {/* 2.1 NAV: Pure Wordmark + Single Secondary CTA                             */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#080809]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-10">
          <div className="flex items-center gap-2.5">
            <span className="font-zolo text-lg font-bold tracking-tight text-white">Watch Later</span>
          </div>

          <div className="flex items-center gap-4">
            {hasSession ? (
              <button
                type="button"
                onClick={onEnterDashboard}
                className="inline-flex items-center justify-center rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold hover:bg-[#E4E4E7] transition active:scale-[0.98]"
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
                className="inline-flex items-center justify-center rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold hover:bg-[#E4E4E7] transition active:scale-[0.98]"
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
      {/* 2.2 HERO: Editorial Stance + Reactive 3D Spatial Rig                      */}
      {/* ========================================================================= */}
      <section
        ref={heroRef}
        className="relative min-h-[90vh] flex flex-col justify-center items-center px-6 sm:px-10 overflow-hidden pt-16 pb-28 border-b border-white/[0.06]"
      >
        {/* Reactive 3D Background (§3.1) */}
        <div
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
          style={{ perspective: '1100px' }}
        >
          {/* Subtle Ambient Depth Lighting */}
          <div
            className="absolute h-[500px] w-[500px] rounded-full bg-amber-700/[0.06] blur-[140px] transition-transform duration-700 ease-out"
            style={{
              transform: `translate3d(${mousePos.x * 45}px, ${mousePos.y * 45 - scrollY * 0.15}px, 0)`
            }}
          />
          <div
            className="absolute h-[380px] w-[380px] rounded-full bg-rose-950/[0.05] blur-[120px] transition-transform duration-700 ease-out"
            style={{
              transform: `translate3d(${-mousePos.x * 35}px, ${-mousePos.y * 35 - scrollY * 0.2}px, 0)`
            }}
          />

          {/* 3D Geometric Depth Rig */}
          <div
            className="relative transition-transform duration-200 ease-out will-change-transform"
            style={{
              transform: `rotateX(${-mousePos.y * 12}deg) rotateY(${mousePos.x * 14}deg) translateZ(-50px) translateY(${-scrollY * 0.1}px)`
            }}
          >
            {/* Monolithic Editorial Panel */}
            <div className="h-72 w-72 sm:h-96 sm:w-96 rounded-[44px] border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-white/[0.005] [transform:rotate(12deg)] shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent opacity-80" />
            </div>

            {/* Inset Offset Depth Frame */}
            <div
              className="absolute -inset-5 rounded-[36px] border border-white/[0.07] bg-white/[0.01] [transform:rotate(-8deg)] transition-transform duration-300"
              style={{
                transform: `rotate(-8deg) translateZ(${25 + Math.abs(mousePos.x) * 15}px)`
              }}
            />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-3xl text-center flex flex-col items-center">
          <h1 className="font-zolo text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white text-balance leading-[1.08] mb-6">
            Never lose a reel worth revisiting.
          </h1>

          <p className="text-base sm:text-lg text-[#A1A1AA] max-w-xl text-balance leading-relaxed mb-10">
            Stop letting reels rot in your saved folder. Just share the reel to Watch Later — it gets grabbed silently, sorted by AI into clean categories, and stays ready to actually watch.
          </p>

          {/* Single Hero CTA with §1.6 morphing */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {downloadSuccess ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-8 py-4 text-sm font-semibold text-emerald-300 shadow-lg">
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
                  className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-black shadow-2xl transition-all duration-200 hover:bg-[#E4E4E7] active:scale-[0.98]"
                >
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  className="group relative inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm font-bold text-black shadow-[0_0_35px_rgba(255,255,255,0.15)] transition-all duration-200 hover:bg-[#E4E4E7] active:scale-[0.98]"
                >
                  <Download className="h-4 w-4" />
                  <span>Download App (Android)</span>
                </button>
              )}
            </div>

            <p
              className={`text-xs text-[#71717A] transition-opacity duration-300 ${
                hasDownloaded || downloadSuccess ? 'opacity-100' : 'opacity-0'
              }`}
            >
              You&apos;re in — sign in with the account you shared your first reel from.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.3 HOW IT WORKS: Horizontal Scroll Narrative (No AI card clichés)         */}
      {/* ========================================================================= */}
      <section
        ref={horizontalSectionRef}
        className="relative md:h-[280vh] bg-[#0A0A0C]"
      >
        <div className="md:sticky md:top-0 md:h-screen md:flex md:flex-col md:justify-center overflow-hidden py-24 md:py-0">
          <div className="mx-auto max-w-6xl px-6 sm:px-10 mb-8 md:mb-12">
            <h2 className="font-zolo text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 text-balance">
              One tap. Everything else is on autopilot.
            </h2>
            <p className="text-sm text-[#71717A]">
              Follow the physical path from Instagram share sheet to clean library.
            </p>
          </div>

          {/* Desktop Horizontal Sliding Track (§3.2) */}
          <div className="hidden md:block w-full overflow-hidden">
            <div
              className="flex gap-8 px-10 transition-transform duration-100 ease-out will-change-transform"
              style={{
                transform: `translateX(calc(${-(scrollProgress * (steps.length - 1) * 440)}px + 3vw))`
              }}
            >
              {steps.map((step, idx) => (
                <article
                  key={step.num}
                  className="w-[460px] shrink-0 border-t-2 border-white/20 pt-6 pb-8 flex flex-col justify-between transition-colors hover:border-white/50"
                >
                  <div>
                    <div className="flex items-baseline justify-between mb-8">
                      <span className="font-mono text-3xl font-light tracking-tighter text-[#71717A]">
                        {step.num}
                      </span>
                      <span className="text-xs text-[#A1A1AA]">{step.detail}</span>
                    </div>

                    <h3 className="font-zolo text-2xl font-bold text-white mb-2 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-amber-400/90 mb-4 font-medium">{step.note}</p>
                    <p className="text-sm text-[#A1A1AA] leading-relaxed">{step.body}</p>
                  </div>

                  <div className="pt-8 text-xs text-[#71717A] font-mono">
                    BEAT {idx + 1} OF 4
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Mobile Touch Native Horizontal Swipe Strip (§3.5) */}
          <div className="md:hidden flex gap-5 overflow-x-auto px-6 pb-6 pt-2 snap-x snap-mandatory scrollbar-none">
            {steps.map((step) => (
              <article
                key={step.num}
                className="w-[84vw] shrink-0 snap-center border-t-2 border-white/20 pt-5 pb-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="font-mono text-2xl text-[#71717A]">{step.num}</span>
                    <span className="text-[11px] text-[#A1A1AA]">{step.detail}</span>
                  </div>
                  <h3 className="font-zolo text-xl font-bold text-white mb-1.5">{step.title}</h3>
                  <p className="text-xs text-amber-400/90 mb-3 font-medium">{step.note}</p>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">{step.body}</p>
                </div>
              </article>
            ))}
          </div>

          {/* Desktop Progress Line Indicator */}
          <div className="hidden md:flex items-center gap-2 px-10 mt-10 max-w-6xl mx-auto w-full">
            <div className="h-[2px] flex-1 bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-150"
                style={{ width: `${Math.max(12, scrollProgress * 100)}%` }}
              />
            </div>
            <span className="font-mono text-xs text-[#71717A] ml-2">
              {Math.min(4, Math.floor(scrollProgress * 4) + 1)}/4
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.4 THE DASHBOARD / PAYOFF: Editorial List Layout (Replaces AI cards)     */}
      {/* ========================================================================= */}
      <section className="py-32 px-6 sm:px-10 bg-[#080809] border-t border-white/[0.06]">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-xl mb-16">
            <h2 className="font-zolo text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 text-balance">
              No endless saved list. Just what matters.
            </h2>
            <p className="text-base text-[#A1A1AA] text-balance">
              Instead of scrolling past the same 200 saved reels forever, pick a category and actually watch what you saved.
            </p>
          </div>

          {/* Editorial Pillar Directory (Clean typographic layout) */}
          <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
            <div className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline group">
              <div className="md:col-span-4 flex items-baseline gap-3">
                <span className="font-mono text-xs text-[#71717A]">01</span>
                <h3 className="font-zolo text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  Cooking & Food
                </h3>
              </div>
              <p className="md:col-span-6 text-sm text-[#A1A1AA] leading-relaxed">
                Italian pasta technique, 3-minute sourdough prep, homemade bone broth.
              </p>
              <div className="md:col-span-2 text-left md:text-right font-mono text-xs text-[#71717A]">
                4 reels queued
              </div>
            </div>

            <div className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline group">
              <div className="md:col-span-4 flex items-baseline gap-3">
                <span className="font-mono text-xs text-[#71717A]">02</span>
                <h3 className="font-zolo text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  Design & Visual
                </h3>
              </div>
              <p className="md:col-span-6 text-sm text-[#A1A1AA] leading-relaxed">
                Typography hierarchies, spatial motion principles, tactile interfaces.
              </p>
              <div className="md:col-span-2 text-left md:text-right font-mono text-xs text-[#71717A]">
                7 reels queued
              </div>
            </div>

            <div className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline group">
              <div className="md:col-span-4 flex items-baseline gap-3">
                <span className="font-mono text-xs text-[#71717A]">03</span>
                <h3 className="font-zolo text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  Fitness & Recovery
                </h3>
              </div>
              <p className="md:col-span-6 text-sm text-[#A1A1AA] leading-relaxed">
                Shoulder mobility cues, deadlift mechanics, deep tissue recovery routines.
              </p>
              <div className="md:col-span-2 text-left md:text-right font-mono text-xs text-[#71717A]">
                3 reels queued
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.5 FINAL CTA: Single Action "Create account"                             */}
      {/* ========================================================================= */}
      <section className="py-28 px-6 sm:px-10 border-t border-white/[0.06] bg-[#050506] text-center">
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
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-black shadow-xl hover:bg-[#E4E4E7] transition active:scale-[0.98]"
          >
            <span>Create account</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.6 FOOTER: One line Wordmark + Tagline                                   */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/[0.06] py-8 px-6 sm:px-10 bg-[#050506]">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <span className="font-zolo font-bold text-sm text-white">Watch Later</span>
          <span>Never lose a reel worth revisiting.</span>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* AUTH MODAL                                                                */}
      {/* ========================================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
                className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-white py-3 text-sm font-bold text-black hover:bg-[#E4E4E7] transition disabled:opacity-50 active:scale-[0.98]"
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
