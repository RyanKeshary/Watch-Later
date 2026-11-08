'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Download,
  ArrowRight,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Share2,
  Zap,
  Sparkles,
  LayoutGrid
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SplashCursor from '@/components/SplashCursor';
import Preloader from '@/components/Preloader';

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
  // Preloader state (§14)
  const [showPreloader, setShowPreloader] = useState(true);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Hero Download CTA state (§5.6)
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // 3D Hero Phone pointer & scroll tracking (§11.1 / §15.1)
  const heroRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  // Full-bleed horizontal scroll ref & progress (§10)
  const horizontalSectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('wl_downloaded') === 'true') {
      setHasDownloaded(true);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      setPointer({ x, y });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);

      if (horizontalSectionRef.current) {
        const rect = horizontalSectionRef.current.getBoundingClientRect();
        const totalScrollable = horizontalSectionRef.current.offsetHeight - window.innerHeight;
        if (totalScrollable > 0) {
          const topOffset = -rect.top;
          const p = Math.max(0, Math.min(1, topOffset / totalScrollable));
          setScrollProgress(p);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
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

  // How it works 4 full-bleed steps (§10)
  const steps = [
    {
      num: '01',
      title: 'Share the reel',
      body: 'Same share button you already use. Tap the Instagram share sheet, pick Watch Later, and keep scrolling.',
      icon: Share2,
      note: 'Zero disruption to your flow'
    },
    {
      num: '02',
      title: "It's grabbed silently",
      body: 'Nothing opens, nothing to fill in. Queued offline if you lose cell signal on the train, synced once online.',
      icon: Zap,
      note: 'Under 20ms background capture'
    },
    {
      num: '03',
      title: 'It gets sorted automatically',
      body: 'No manual tagging, ever. Spoken dialogue and caption transcripts are categorized by machine intelligence.',
      icon: Sparkles,
      note: 'Clean thematic categorization'
    },
    {
      num: '04',
      title: 'It lands in your dashboard',
      body: 'Sitting in your dashboard, ready to actually watch. An organized sanctuary where saves never rot.',
      icon: LayoutGrid,
      note: 'One focused revisit list'
    }
  ];

  // Hero Marquee Category Preview Cards (§7)
  const categoryMarquee = [
    'Cooking & Culinary',
    'Tactile Interface Design',
    'Deadlift Mechanics',
    'Architectural Principles',
    'Espresso Extraction',
    'Motion Graphics',
    'Typography Foundations',
    'Knead-Free Sourdough',
    'Hardware Tear-downs'
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 14. PRELOADER (§14)                                                       */}
      {/* ========================================================================= */}
      {showPreloader && <Preloader onComplete={() => setShowPreloader(false)} />}

      <div className="relative min-h-screen bg-[#0B0B0B] bg-fabric text-[#E4E4E7] font-sans selection:bg-[#333333] selection:text-white antialiased overflow-x-clip">
        {/* ========================================================================= */}
        {/* CUSTOM CURSOR (§5.7 / §15.4)                                              */}
        {/* ========================================================================= */}
        <div className="hidden md:block pointer-events-none">
          <SplashCursor
            contained={false}
            colors={['#D0D6E0', '#F59E0B', '#FFFFFF']}
            rainbow={false}
            size={0.5}
            force={0.25}
            swirl={12}
            trail={2.2}
            clickSplash
            colorSpeed={0}
            intensity={0.4}
            momentum={0.65}
            glow={0.1}
            quality="medium"
            intro={false}
            zIndex={1}
          />
        </div>

        {/* ========================================================================= */}
        {/* 6. HEADER / NAV (§6)                                                      */}
        {/* Fixed/sticky minimal nav. Left: Logo mark + Oughter wordmark side by side */}
        {/* Center: Nav links anchor-scrolling to #how-it-works & #about               */}
        {/* Far right: Exactly ONE Auth button (Sign In). NO Download button in nav.  */}
        {/* ========================================================================= */}
        <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0B0B0B]/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-10">
            {/* Logo mark + Oughter wordmark side by side */}
            <a href="#" className="flex items-center gap-2.5 group">
              <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/20 shadow-md">
                <Image
                  src="/logo.png"
                  alt="Watch Later Icon"
                  width={28}
                  height={28}
                  className="object-cover"
                />
              </div>
              <span className="font-oughter text-xl font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                Watch Later
              </span>
            </a>

            {/* Center Anchor Navigation Links */}
            <nav className="hidden sm:flex items-center gap-8 text-xs font-medium text-neutral-300">
              <a href="#how-it-works" className="hover:text-white transition-colors">
                How it works
              </a>
              <a href="#about" className="hover:text-white transition-colors">
                About
              </a>
              <a href="#mission" className="hover:text-white transition-colors">
                Mission
              </a>
            </nav>

            {/* Far Right: Standing Auth Button only (§5.1, §6) */}
            <div>
              {hasSession ? (
                <button
                  type="button"
                  onClick={onEnterDashboard}
                  className="rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold hover:bg-neutral-200 transition active:scale-[0.98]"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                  className="rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-1.5 text-xs font-medium text-white transition active:scale-[0.98]"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 7. HERO SECTION (§7)                                                      */}
        {/* Massive 3D tilted phone (~90vh) with looping save->sorted carousel.        */}
        {/* Headline typography wraps behind and in front of the phone.               */}
        {/* Exactly ONE CTA: Download button morphing to Sign In.                     */}
        {/* Continuous slow ambient auto-scrolling marquee cards at bottom.           */}
        {/* ========================================================================= */}
        <section
          ref={heroRef}
          className="relative min-h-[92vh] flex flex-col justify-center items-center px-6 overflow-hidden pt-12 pb-16"
        >
          {/* Top-Left & Bottom-Right Supporting Lines (§7) */}
          <div className="absolute top-10 left-6 sm:left-12 max-w-[200px] text-left pointer-events-none hidden md:block">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 block mb-1">
              Save in 1 tap
            </span>
            <p className="text-xs text-neutral-400 leading-snug">
              Stop letting saved reels pile up into a digital graveyard.
            </p>
          </div>

          <div className="absolute top-10 right-6 sm:right-12 max-w-[200px] text-right pointer-events-none hidden md:block">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 block mb-1">
              Curated library
            </span>
            <p className="text-xs text-neutral-400 leading-snug">
              Auto-categorized by AI transcripts ready for deliberate viewing.
            </p>
          </div>

          {/* Central 3D Layered Composition */}
          <div className="relative w-full max-w-5xl flex items-center justify-center my-6">
            {/* Background Headline Slice (Layered BEHIND Phone) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none">
              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white/[0.08] uppercase text-center leading-[0.95]">
                Never lose a reel
                <br />
                worth revisiting
              </h1>
            </div>

            {/* Giant Phone Mockup (~90vh scale, 3D pointer-reactive & tilted) */}
            <div
              className="relative z-10 w-[300px] sm:w-[350px] md:w-[380px] h-[580px] sm:h-[640px] rounded-[52px] border-[5px] border-white/20 bg-[#121214] p-3.5 shadow-[0_25px_80px_rgba(0,0,0,0.85)] transition-transform duration-200 ease-out will-change-transform"
              style={{
                transform: `perspective(1200px) rotateX(${
                  -pointer.y * 10
                }deg) rotateY(${pointer.x * 12}deg) rotateZ(-3.5deg) translateY(${
                  -scrollY * 0.08
                }px)`
              }}
            >
              {/* Phone Speaker Notch */}
              <div className="mx-auto h-5 w-28 rounded-full bg-black/80 border border-white/10 mb-2 flex items-center justify-center">
                <div className="w-10 h-1.5 rounded-full bg-white/20" />
              </div>

              {/* Looping Carousel Inside Phone: Save Action -> Clean Organized Library */}
              <div className="relative w-full h-[calc(100%-28px)] rounded-[40px] overflow-hidden bg-black border border-white/10 flex flex-col justify-between p-4">
                {/* Reel Header */}
                <div className="flex items-center justify-between text-xs text-white/80 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500" />
                    <span className="font-medium text-xs">@creative.archive</span>
                  </div>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">Reel #409</span>
                </div>

                {/* Looping Video Mock Illustration */}
                <div className="my-auto py-4 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full border border-white/30 bg-white/5 flex items-center justify-center mb-4 shadow-inner">
                    <div className="w-0 h-0 border-y-8 border-y-transparent border-l-12 border-l-white ml-1" />
                  </div>
                  <span className="text-xs font-semibold text-white mb-1">
                    Captured from Instagram Share Sheet
                  </span>
                  <p className="text-[11px] text-neutral-400 max-w-[200px] leading-tight">
                    Transcribing spoken audio… Categorized into Design &amp; Interfaces.
                  </p>
                </div>

                {/* Organized Library Mini Payoff Grid */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left">
                  <span className="text-[10px] font-mono uppercase text-amber-400/90 block mb-1">
                    Ready to watch in dashboard
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                      <p className="font-semibold text-white truncate">Design Systems</p>
                      <span className="text-neutral-400 text-[9px]">4 queued</span>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                      <p className="font-semibold text-white truncate">Culinary Skills</p>
                      <span className="text-neutral-400 text-[9px]">3 queued</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Foreground Headline Slice (Layered IN FRONT OF Phone) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 text-center px-4">
              <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] max-w-4xl text-balance leading-[1.05]">
                Never lose a reel worth revisiting.
              </h2>
            </div>
          </div>

          {/* Single Hero Primary CTA (§5.4, §5.6) */}
          <div className="relative z-30 mt-6 flex flex-col items-center gap-3">
            {downloadSuccess ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-8 py-3.5 text-sm font-semibold text-emerald-300 shadow-xl animate-fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>APK Download initiated… Check your notifications.</span>
              </div>
            ) : hasDownloaded ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-black shadow-2xl hover:bg-neutral-200 transition active:scale-[0.98]"
              >
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownloadClick}
                className="group relative inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-black shadow-[0_0_40px_rgba(245,158,11,0.25)] hover:bg-neutral-200 transition active:scale-[0.98]"
              >
                <Download className="h-4 w-4 text-amber-500" />
                <span>Download the app (APK)</span>
              </button>
            )}

            <p
              className={`text-xs text-neutral-400 transition-opacity duration-300 ${
                hasDownloaded || downloadSuccess ? 'opacity-100' : 'opacity-0'
              }`}
            >
              You&apos;re in — sign in with the account you shared your first reel from.
            </p>
          </div>

          {/* Slim Horizontal Auto-Scrolling Category Marquee (§7) */}
          <div className="relative w-full max-w-6xl mt-12 overflow-hidden py-3 border-y border-white/[0.08] [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
            <div className="flex gap-4 w-max animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused]">
              {[...categoryMarquee, ...categoryMarquee].map((category, idx) => (
                <div
                  key={`${category}-${idx}`}
                  className="rounded-full border border-white/15 bg-white/[0.03] px-4 py-1.5 text-xs text-neutral-300 whitespace-nowrap [transform:rotate(-1.5deg)]"
                >
                  {category}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. ABOUT SECTION (§8)                                                     */}
        {/* Saturated full-bleed accent color block (Watch Later amber/clay palette).  */}
        {/* Uppercase label + 3-line statement + simple line-art outline graphic.      */}
        {/* ========================================================================= */}
        <section
          id="about"
          className="relative py-28 px-6 sm:px-10 bg-amber-600 text-black border-y border-amber-500/40 text-center overflow-hidden"
        >
          {/* Subtle fabric texture blend on accent color (§4) */}
          <div className="absolute inset-0 bg-fabric opacity-15 pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-3xl flex flex-col items-center">
            {/* Small uppercase label */}
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-black/70 mb-8 block">
              ABOUT WATCH LATER
            </span>

            {/* Exact Centered Statement */}
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-black text-balance leading-snug mb-8">
              Good content deserves more than a forgotten save.
              <br />
              Every reel deserves a revisit.
              <br />
              This tool turns the content you save into a magical library worth revisiting.
            </h2>

            {/* Supporting Minimal Line-Art Graphic */}
            <div className="w-24 h-16 rounded-xl border-2 border-black/80 flex flex-col justify-between p-2.5 mb-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="w-2 h-2 rounded-full bg-black/80" />
                <div className="w-8 h-1 rounded-full bg-black/50" />
              </div>
              <div className="space-y-1">
                <div className="w-full h-1 rounded-full bg-black/50" />
                <div className="w-3/4 h-1 rounded-full bg-black/40" />
              </div>
            </div>

            {/* Low-emphasis pill scrolling to How It Works */}
            <a
              href="#how-it-works"
              className="rounded-full border border-black/30 bg-black/10 hover:bg-black/20 px-5 py-2 text-xs font-semibold text-black transition active:scale-[0.98]"
            >
              Learn how it works ↓
            </a>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. MISSION / AIM SECTION (§9)                                             */}
        {/* Text-forward on normal dark fabric background + minimal line-art icon.    */}
        {/* Exact copy from §9. NO CTA button here.                                   */}
        {/* ========================================================================= */}
        <section id="mission" className="py-28 px-6 sm:px-10 border-b border-white/[0.08] text-center">
          <div className="mx-auto max-w-2xl flex flex-col items-center">
            {/* Minimal line-art graphic: squiggle lines next to play icon */}
            <div className="flex items-center gap-3 mb-8 text-neutral-400">
              <div className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center">
                <div className="w-0 h-0 border-y-4 border-y-transparent border-l-6 border-l-white ml-0.5" />
              </div>
              <svg className="w-12 h-6 stroke-current stroke-[1.5] fill-none" viewBox="0 0 48 24">
                <path d="M2 12 Q 10 4, 18 12 T 34 12 T 46 12" />
              </svg>
            </div>

            {/* Exact Copy from §9 */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-6 text-balance leading-snug">
              No scroll should go to waste.
              <br />
              It transforms passive saves and bookmarking into an organized personal library.
              <br />
              <span className="text-neutral-400 text-lg sm:text-xl font-normal block mt-4">
                Save less time organizing, spend more time learning and enjoying.
              </span>
            </h2>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 10. HOW IT WORKS: FULL-BLEED HORIZONTAL SCROLL (§10, §15.2)               */}
        {/* True edge-to-edge max-screen stage with desktop scroll-hijack & 3D depth  */}
        {/* Mobile touch fallback: native full-width swipeable strip with snap.       */}
        {/* ========================================================================= */}
        <section
          id="how-it-works"
          ref={horizontalSectionRef}
          className="relative md:h-[220vh] bg-black border-b border-white/[0.08]"
        >
          <div className="md:sticky md:top-0 md:h-screen md:flex md:flex-col md:justify-center overflow-hidden py-20 md:py-0 w-full">
            {/* Full-bleed header caption */}
            <div className="w-full px-6 sm:px-12 mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 block mb-1">
                  How It Works — Full-Bleed Sequence
                </span>
                <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                  One tap. Everything else is on autopilot.
                </h3>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {Math.min(4, Math.floor(scrollProgress * 3.99) + 1)} / 4
              </span>
            </div>

            {/* Desktop Horizontal Sliding Stage (True Edge-to-Edge with 3D Depth) */}
            <div className="hidden md:block w-full overflow-hidden">
              <div
                className="flex gap-8 px-12 transition-transform duration-75 ease-out will-change-transform"
                style={{
                  transform: `translateX(calc(${-(scrollProgress * 3 * 620)}px + 4vw))`
                }}
              >
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = Math.floor(scrollProgress * 3.99) === idx;
                  return (
                    <article
                      key={step.num}
                      className={`w-[600px] shrink-0 rounded-3xl border p-10 flex flex-col justify-between transition-all duration-300 ${
                        isActive
                          ? 'border-white bg-[#141416] scale-100 shadow-[0_20px_60px_rgba(0,0,0,0.8)]'
                          : 'border-white/15 bg-[#0F0F11] scale-[0.96] opacity-75'
                      }`}
                      style={{
                        transform: `perspective(1000px) rotateY(${isActive ? 0 : 4}deg)`
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-8">
                          <span className="font-mono text-3xl font-light text-neutral-500">
                            {step.num}
                          </span>
                          <div className="w-12 h-12 rounded-2xl border border-white/20 bg-white/5 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-amber-400" />
                          </div>
                        </div>

                        <h4 className="text-3xl font-bold text-white mb-3 tracking-tight">
                          {step.title}
                        </h4>
                        <p className="text-sm text-neutral-300 leading-relaxed mb-6">
                          {step.body}
                        </p>
                      </div>

                      <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
                        <span>{step.note}</span>
                        <span className="font-mono text-white/60">STEP {step.num}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Mobile Touch Native Horizontal Swipe Strip (§10, §11.5) */}
            <div className="md:hidden flex gap-4 overflow-x-auto px-6 pb-6 pt-2 snap-x snap-mandatory scrollbar-none w-full">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.num}
                    className="w-[88vw] max-w-[360px] shrink-0 snap-center rounded-3xl border border-white/20 bg-[#121214] p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <span className="font-mono text-2xl text-neutral-500">{step.num}</span>
                        <div className="w-10 h-10 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-amber-400" />
                        </div>
                      </div>
                      <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                      <p className="text-xs text-neutral-300 leading-relaxed mb-4">{step.body}</p>
                    </div>
                    <div className="pt-4 border-t border-white/10 text-[11px] text-neutral-400">
                      {step.note}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Desktop Progress Line */}
            <div className="hidden md:block w-full px-12 mt-8">
              <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100 ease-out"
                  style={{ width: `${Math.max(12, scrollProgress * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 11. FINAL CTA SECTION (§11)                                               */}
        {/* Oversized cropped "Watch Later" wordmark in OUGHTER as background texture. */}
        {/* Centered statement + Exactly ONE CTA: Create account button.              */}
        {/* ========================================================================= */}
        <section className="relative py-36 px-6 sm:px-10 border-b border-white/[0.08] text-center overflow-hidden">
          {/* Oversized background cropped "Watch Later" wordmark in Oughter (§1, §11) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
            <span className="font-oughter text-[16vw] sm:text-[18vw] leading-none text-white/[0.04] whitespace-nowrap uppercase tracking-tight">
              Watch Later
            </span>
          </div>

          <div className="relative z-10 mx-auto max-w-xl flex flex-col items-center">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 text-balance leading-tight">
              Your next save starts here.
            </h2>
            <p className="text-base sm:text-lg text-neutral-300 mb-8 text-balance">
              Never lose a reel worth revisiting.
            </p>

            {/* Exactly ONE CTA: Create Account button (§5.3, §11) */}
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setShowAuthModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-black shadow-2xl hover:bg-neutral-200 transition active:scale-[0.98]"
            >
              <span>Create account</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 12. FOOTER (§12)                                                          */}
        {/* Minimal one line: Logo + "Watch Later" wordmark (Oughter) + Tagline.      */}
        {/* ========================================================================= */}
        <footer className="py-8 px-6 sm:px-10 border-t border-white/[0.08] bg-[#08080A]">
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded overflow-hidden">
                <Image src="/logo.png" alt="Logo" width={20} height={20} className="object-cover" />
              </div>
              <span className="font-oughter text-base font-bold text-white">Watch Later</span>
            </div>
            <span>Never lose a reel worth revisiting.</span>
          </div>
        </footer>

        {/* ========================================================================= */}
        {/* AUTH MODAL DIALOG                                                         */}
        {/* ========================================================================= */}
        {showAuthModal && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          >
            <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-[#141416] p-6 sm:p-8 text-left text-white shadow-2xl">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="absolute top-5 right-5 text-neutral-400 hover:text-white transition"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-2xl font-bold mb-1">
                {authMode === 'signin' ? 'Welcome back' : 'Create account'}
              </h3>
              <p className="text-xs text-neutral-400 mb-6">
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
                  <label className="block text-xs text-neutral-400 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-white/20 bg-black/50 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/20 bg-black/50 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-neutral-400 hover:text-white"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black hover:bg-neutral-200 transition disabled:opacity-50 active:scale-[0.98]"
                >
                  {authLoading ? 'Authenticating…' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="mt-5 text-center text-xs text-neutral-400">
                {authMode === 'signin' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className="text-white underline font-medium"
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
                      className="text-white underline font-medium"
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
    </>
  );
}
