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
  LayoutGrid,
  Play
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SplashCursor from '@/components/SplashCursor';
import Preloader from '@/components/Preloader';
import StageshowStepCard from '@/components/StageshowStepCard';

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
  // Preloader & Continuous Hero Sequence state (§4 & §5)
  const [showPreloader, setShowPreloader] = useState(true);
  // 'initial' | 'centered' | 'settled'
  const [heroLayoutPhase, setHeroLayoutPhase] = useState<'initial' | 'centered' | 'settled'>('initial');

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Hero Download CTA state
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('v1.0.1');

  useEffect(() => {
    fetch('/version.json')
      .then((res) => res.json())
      .then((data) => {
        if (data.versionName) {
          setAppVersion(`v${data.versionName}`);
        }
      })
      .catch(() => {});
  }, []);

  // 3D Hero Phone pointer & scroll tracking
  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const missionRef = useRef<HTMLElement>(null);
  const horizontalSectionRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  // Scroll Progresses for §6 & §7 & §8
  const [heroToAboutProgress, setHeroToAboutProgress] = useState(0);
  const [aboutToMissionProgress, setAboutToMissionProgress] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // §7 Mission collision snap state
  const [missionCollided, setMissionCollided] = useState(false);
  const prevAboutToMissionRef = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('wl_downloaded') === 'true') {
      setHasDownloaded(true);
    }
  }, []);

  // Handle continuous preloader -> hero sequence progression
  const settleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePreloaderSettle = () => {
    // 3. Phone settles centered behind headline as transitional beat
    setHeroLayoutPhase('centered');
    // 4. Immediately continue into §5 without holding
    if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    settleTimeoutRef.current = setTimeout(() => {
      setHeroLayoutPhase('settled');
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      setPointer({ x, y });
    };

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setScrollY(currentScroll);

      // Hero -> About boundary tracking (§6)
      if (heroRef.current && aboutRef.current) {
        const heroBottom = heroRef.current.offsetTop + heroRef.current.offsetHeight;
        const aboutTop = aboutRef.current.offsetTop;
        const triggerStart = heroBottom - window.innerHeight * 0.8;
        const triggerEnd = aboutTop + window.innerHeight * 0.5;
        const p = Math.max(0, Math.min(1, (currentScroll - triggerStart) / (triggerEnd - triggerStart)));
        setHeroToAboutProgress(p);
      }

      // About -> Mission boundary tracking (§7)
      if (missionRef.current) {
        const missionTop = missionRef.current.offsetTop;
        const triggerStart = missionTop - window.innerHeight * 0.7;
        const triggerEnd = missionTop + window.innerHeight * 0.2;
        const p = Math.max(0, Math.min(1, (currentScroll - triggerStart) / (triggerEnd - triggerStart)));
        setAboutToMissionProgress(p);
        const prev = prevAboutToMissionRef.current;
        if (prev <= 0.45 && p > 0.45) {
          setMissionCollided(true);
        } else if (prev >= 0.2 && p < 0.2) {
          setMissionCollided(false);
        }
        prevAboutToMissionRef.current = p;
      }

      // How it works horizontal progress (§8)
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

  // How it works steps (§8: Clean minimal cards, NO STEP 01 labels)
  const steps = [
    {
      id: 'step-share',
      title: 'Share the reel',
      body: 'Same share button you already use. Tap the Instagram share sheet, pick Watch Later, and keep scrolling.',
      icon: Share2,
      note: 'Zero disruption to your flow'
    },
    {
      id: 'step-grab',
      title: "It's grabbed silently",
      body: 'Nothing opens, nothing to fill in. Queued offline if you lose cell signal on the train, synced once online.',
      icon: Zap,
      note: 'Under 20ms background capture'
    },
    {
      id: 'step-sort',
      title: 'It gets sorted automatically',
      body: 'No manual tagging, ever. Spoken dialogue and caption transcripts are categorized by machine intelligence.',
      icon: Sparkles,
      note: 'Clean thematic categorization'
    },
    {
      id: 'step-revisit',
      title: 'It lands in your dashboard',
      body: 'Sitting in your dashboard, ready to actually watch. An organized sanctuary where saves never rot.',
      icon: LayoutGrid,
      note: 'One focused revisit list'
    }
  ];

  // Marquee categories - Clean 8 high-relevance topics (§6)
  const categoryMarquee = [
    'Coding & Dev',
    'Cooking & Recipes',
    'Fitness & Workouts',
    'Business & Finance',
    'Design Inspiration',
    'Travel & Places',
    'Movies & Shows',
    'DIY & Life Hacks'
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 4. PRELOADER CONTINUOUS SEQUENCE (§4)                                     */}
      {/* ========================================================================= */}
      {showPreloader && (
        <Preloader
          onSequenceSettle={handlePreloaderSettle}
          onSequenceComplete={() => {
            setShowPreloader(false);
            setHeroLayoutPhase((prev) => (prev === 'initial' ? 'settled' : prev));
          }}
        />
      )}

      <div className="relative min-h-screen bg-[#0B0B0B] bg-fabric text-[#D9D9D9] font-sans selection:bg-[#333333] selection:text-[#FFFFFF] antialiased overflow-x-clip">
        {/* ========================================================================= */}
        {/* 3. CUSTOM CURSOR (§3: Hard locked to white-ish grey #D9D9D9 / #FFFFFF)   */}
        {/* ========================================================================= */}
        <div className="hidden md:block pointer-events-none">
          <SplashCursor
            contained={false}
            colors={['#D9D9D9', '#FFFFFF', '#6B6B6B']}
            rainbow={false}
            size={0.45}
            force={0.22}
            swirl={10}
            trail={2.0}
            clickSplash
            colorSpeed={0}
            intensity={0.35}
            momentum={0.65}
            glow={0.08}
            quality="medium"
            intro={false}
            zIndex={2}
          />
        </div>

        {/* ========================================================================= */}
        {/* 10. HEADER / NAV (§10: Centered Nav Links, locked palette, hover effects) */}
        {/* ========================================================================= */}
        <header className="sticky top-0 z-40 border-b border-[#333333] bg-[#0B0B0B]/85 backdrop-blur-md transition-colors duration-300">
          <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 sm:px-10">
            {/* Left: Logo mark + Oughter wordmark */}
            <a href="#" className="flex items-center gap-2.5 group relative z-10">
              <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-[#333333] bg-[#1A1A1A] shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:border-[#D9D9D9]">
                <Image
                  src="/logo.png"
                  alt="Watch Later Icon"
                  width={28}
                  height={28}
                  className="object-cover transition-opacity duration-300 group-hover:opacity-90"
                />
              </div>
              <span className="font-oughter text-xl font-bold tracking-tight text-[#FFFFFF] transition-all duration-300 group-hover:text-[#D9D9D9] group-hover:tracking-normal">
                Watch Later
              </span>
            </a>

            {/* Absolute Center: Nav Links mathematically centered against viewport (§10) */}
            <nav className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8 text-xs font-medium text-[#6B6B6B]">
              <a
                href="#how-it-works"
                className="relative py-1 hover:text-[#FFFFFF] transition-colors duration-200 group"
              >
                <span>How it works</span>
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#FFFFFF] transition-all duration-250 ease-out group-hover:w-full" />
              </a>
              <a
                href="#about"
                className="relative py-1 hover:text-[#FFFFFF] transition-colors duration-200 group"
              >
                <span>About</span>
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#FFFFFF] transition-all duration-250 ease-out group-hover:w-full" />
              </a>
              <a
                href="#mission"
                className="relative py-1 hover:text-[#FFFFFF] transition-colors duration-200 group"
              >
                <span>Mission</span>
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#FFFFFF] transition-all duration-250 ease-out group-hover:w-full" />
              </a>
            </nav>

            {/* Far Right: Exactly ONE Auth button (Sign In) */}
            <div className="relative z-10 flex items-center">
              {hasSession ? (
                <button
                  type="button"
                  onClick={onEnterDashboard}
                  className="rounded-full bg-[#FFFFFF] text-[#0B0B0B] px-4 py-1.5 text-xs font-semibold hover:bg-[#D9D9D9] transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
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
                  className="rounded-full border border-[#333333] bg-[#1A1A1A] hover:bg-[#333333] hover:border-[#D9D9D9] px-4 py-1.5 text-xs font-medium text-[#FFFFFF] transition-all duration-200 active:scale-[0.98] shadow-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 5. HERO SECTION (§5: Left-aligned Column + Right Tilted Phone)            */}
        {/* ========================================================================= */}
        <section
          ref={heroRef}
          className="relative min-h-[92vh] flex flex-col justify-center px-6 sm:px-12 lg:px-16 overflow-hidden pt-12 pb-14"
        >
          {/* Subtle Ambient Depth Lighting within locked grayscale palette */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#FFFFFF]/[0.02] rounded-full blur-3xl pointer-events-none" />

          <div className="mx-auto w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10 my-auto">
            {/* LEFT COLUMN: Hero text content (Headline, two supporting lines, Download CTA) */}
            <div
              className={`lg:col-span-7 flex flex-col items-start text-left transition-all duration-700 ease-out ${
                heroLayoutPhase === 'centered'
                  ? 'opacity-30 translate-x-8 blur-[1px]'
                  : 'opacity-100 translate-x-0 blur-0'
              }`}
            >
              {/* Supporting micro tag line */}
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block w-2 h-2 rounded-full bg-[#FFFFFF] animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#D9D9D9]">
                  Silent capture &bull; Zero clutter
                </span>
              </div>

              {/* Confident Hero Display Headline (§5: Bold grotesque display face) */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-7xl font-extrabold tracking-[-0.04em] text-[#FFFFFF] leading-[1.02] mb-6 text-balance">
                Never lose a reel worth revisiting.
              </h1>

              {/* Two short supporting lines (§5) */}
              <div className="space-y-3 mb-8 max-w-xl">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-[#6B6B6B] mt-0.5">01/</span>
                  <p className="text-sm sm:text-base text-[#D9D9D9] leading-relaxed">
                    Stop letting saved reels pile up into a digital graveyard. Save in 1 tap from Instagram.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-[#6B6B6B] mt-0.5">02/</span>
                  <p className="text-sm sm:text-base text-[#6B6B6B] leading-relaxed">
                    Dialogue and captions auto-transcribed into an organized, thematic personal library.
                  </p>
                </div>
              </div>

              {/* Single Hero Primary CTA */}
              <div className="flex flex-col items-start gap-3 w-full sm:w-auto">
                {downloadSuccess ? (
                  <div className="inline-flex items-center gap-2.5 rounded-full border border-[#D9D9D9] bg-[#1A1A1A] px-7 py-4 text-sm font-semibold text-[#FFFFFF] shadow-xl">
                    <CheckCircle2 className="h-4 w-4 text-[#FFFFFF]" />
                    <span>APK Download initiated… Check your notifications.</span>
                  </div>
                ) : hasDownloaded ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setShowAuthModal(true);
                    }}
                    className="group relative inline-flex items-center justify-center gap-2.5 rounded-full bg-[#FFFFFF] px-8 py-4 text-sm font-bold text-[#0B0B0B] shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:bg-[#D9D9D9] hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDownloadClick}
                    className="group relative inline-flex items-center justify-center gap-2.5 rounded-full bg-[#FFFFFF] px-8 py-4 text-sm font-bold text-[#0B0B0B] shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:bg-[#D9D9D9] hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
                  >
                    <Download className="h-4 w-4 text-[#0B0B0B] transition-transform group-hover:translate-y-0.5" />
                    <span>Download the app ({appVersion})</span>
                  </button>
                )}

                <p
                  className={`text-xs text-[#6B6B6B] transition-opacity duration-300 ${
                    hasDownloaded || downloadSuccess ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  You&apos;re in — sign in with the account you shared your first reel from.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Giant Phone tilted rightwards (§5 resting tilt ~4.5deg) */}
            <div
              className={`lg:col-span-5 flex justify-center items-center relative transition-all duration-700 ease-out ${
                heroLayoutPhase === 'centered'
                  ? 'lg:-translate-x-48 scale-95 opacity-80'
                  : 'translate-x-0 scale-100 opacity-100'
              }`}
            >
              {/* Giant Phone Mockup */}
              <div
                className="relative z-10 w-[290px] sm:w-[330px] md:w-[350px] h-[580px] sm:h-[630px] rounded-[50px] border-[4px] border-[#333333] bg-[#1A1A1A] p-3 shadow-[0_25px_80px_rgba(0,0,0,0.9)] transition-transform duration-200 ease-out will-change-transform"
                style={{
                  transform: `perspective(1200px) rotateX(${
                    -pointer.y * 8
                  }deg) rotateY(${pointer.x * 10}deg) rotateZ(4.5deg) translateY(${
                    -scrollY * 0.05
                  }px)`
                }}
              >
                {/* Dynamic Notch */}
                <div className="mx-auto h-5 w-26 rounded-full bg-[#0B0B0B] border border-[#333333] mb-2 flex items-center justify-center">
                  <div className="w-9 h-1 rounded-full bg-[#6B6B6B]" />
                </div>

                {/* Looping Screen Content Inside Phone */}
                <div className="relative w-full h-[calc(100%-28px)] rounded-[38px] overflow-hidden bg-[#0B0B0B] border border-[#333333] flex flex-col justify-between p-4">
                  {/* Reel Header */}
                  <div className="flex items-center justify-between text-xs text-[#D9D9D9] pb-2 border-b border-[#333333]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#333333] border border-[#6B6B6B] flex items-center justify-center">
                        <span className="text-[9px] font-bold text-[#FFFFFF]">CA</span>
                      </div>
                      <span className="font-medium text-xs text-[#FFFFFF]">@creative.archive</span>
                    </div>
                    <span className="text-[10px] bg-[#1A1A1A] text-[#D9D9D9] border border-[#333333] px-2 py-0.5 rounded-full">
                      Reel #409
                    </span>
                  </div>

                  {/* Reel Center Mock */}
                  <div className="my-auto py-4 flex flex-col items-center justify-center text-center">
                    {/* The Reel Icon (§6: Traveling Reel Icon originates here) */}
                    <div
                      id="hero-play-icon"
                      className={`w-14 h-14 rounded-full border border-[#D9D9D9] bg-[#1A1A1A] flex items-center justify-center mb-3 shadow-inner transition-opacity duration-300 ${
                        heroToAboutProgress > 0.08 ? 'opacity-0' : 'opacity-100'
                      }`}
                    >
                      <Play className="w-5 h-5 fill-[#FFFFFF] stroke-none ml-0.5 text-[#FFFFFF]" />
                    </div>

                    <span className="text-xs font-semibold text-[#FFFFFF] mb-1">
                      Captured from Instagram Share Sheet
                    </span>
                    <p className="text-[11px] text-[#6B6B6B] max-w-[210px] leading-tight">
                      Transcribing spoken audio… Categorized into Design &amp; Interfaces.
                    </p>
                  </div>

                  {/* READY TO WATCH IN DASHBOARD Payoff Grid */}
                  <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A] p-3 text-left">
                    <span className="text-[10px] font-mono uppercase text-[#FFFFFF] tracking-wider block mb-1">
                      READY TO WATCH IN DASHBOARD
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#0B0B0B] p-2 border border-[#333333]">
                        <p className="font-semibold text-[#FFFFFF] truncate">Design Systems</p>
                        <span className="text-[#6B6B6B] text-[9px]">4 queued</span>
                      </div>
                      <div className="rounded-lg bg-[#0B0B0B] p-2 border border-[#333333]">
                        <p className="font-semibold text-[#FFFFFF] truncate">Culinary Skills</p>
                        <span className="text-[#6B6B6B] text-[9px]">3 queued</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* §6 Edge-to-Edge Continuous Category Tag Marquee */}
          <div className="relative w-screen -mx-6 sm:-mx-12 lg:-mx-16 mt-14 overflow-hidden py-3 border-y border-[#333333] [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="flex w-max animate-[marquee_32s_linear_infinite] motion-reduce:animate-none hover:[animation-play-state:paused]">
              {[...categoryMarquee, ...categoryMarquee, ...categoryMarquee].map((category, idx) => (
                <div
                  key={`${category}-${idx}`}
                  className="rounded-full border border-[#333333] bg-[#1A1A1A] px-4 py-1.5 mr-4 text-xs text-[#D9D9D9] whitespace-nowrap transition-colors hover:border-[#D9D9D9] hover:text-[#FFFFFF]"
                >
                  {category}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. ABOUT SECTION (White background, black text, clean & telling)         */}
        {/* ========================================================================= */}
        <section
          id="about"
          ref={aboutRef}
          className="relative min-h-screen flex flex-col justify-center items-center py-24 px-6 sm:px-12 bg-[#FFFFFF] text-[#0B0B0B] border-y border-[#D9D9D9] text-center overflow-hidden"
        >
          {/* Subtle light watermark / depth geometry in pale grey */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
            <span className="font-oughter text-[20vw] leading-none text-[#0B0B0B]/[0.03] whitespace-nowrap uppercase tracking-tight">
              Revisit
            </span>
          </div>

          <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
            {/* Bold, telling statement in high-contrast crisp black typography */}
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-[-0.03em] text-[#0B0B0B] text-balance leading-[1.12] mb-10">
              Good content deserves more than a forgotten save.
              <br />
              <span className="text-[#0B0B0B]/70 font-semibold">Every reel deserves a revisit.</span>
            </h2>

            {/* Clear, structured explanatory subtitle */}
            <p className="text-base sm:text-xl text-[#333333] max-w-2xl text-balance leading-relaxed font-normal">
              Turns passive Instagram saves into a structured, searchable personal library.
              Capture silently on mobile, browse organized shelves on web, and never let valuable knowledge rot.
            </p>

            {/* Clean three-column visual proof points */}
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
              <div className="rounded-2xl border border-[#D9D9D9] bg-[#FFFFFF] p-6 shadow-sm">
                <span className="font-mono text-xs text-[#6B6B6B] block mb-2">01 / CAPTURE</span>
                <h4 className="text-base font-bold text-[#0B0B0B] mb-1">Instant &amp; Silent</h4>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  One tap from the Instagram share sheet. Under 20ms local disk queue.
                </p>
              </div>

              <div className="rounded-2xl border border-[#D9D9D9] bg-[#FFFFFF] p-6 shadow-sm">
                <span className="font-mono text-xs text-[#6B6B6B] block mb-2">02 / STRUCTURE</span>
                <h4 className="text-base font-bold text-[#0B0B0B] mb-1">Autonomous Sort</h4>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  Audio transcripts and captions categorized by machine intelligence.
                </p>
              </div>

              <div className="rounded-2xl border border-[#D9D9D9] bg-[#FFFFFF] p-6 shadow-sm">
                <span className="font-mono text-xs text-[#6B6B6B] block mb-2">03 / DELIBERATE</span>
                <h4 className="text-base font-bold text-[#0B0B0B] mb-1">Revisit Shelf</h4>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  A focused dashboard queue with automated summaries and key takeaways.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. NEW MISSION SECTION (§7: Left Device Endless Scroll -> Snap Payoff)    */}
        {/* ========================================================================= */}
        <section
          id="mission"
          ref={missionRef}
          className="relative min-h-screen flex flex-col justify-center items-center py-20 px-6 sm:px-12 lg:px-16 border-b border-[#333333] bg-[#0B0B0B] overflow-hidden"
        >
          {/* Subtle traveling icon colliding into device animation (§7) */}
          <div
            className="absolute pointer-events-none z-20 transition-all duration-300"
            style={{
              opacity: aboutToMissionProgress > 0.1 && aboutToMissionProgress < 0.8 ? 0.35 : 0,
              left: `${Math.max(20, Math.min(50, 60 - aboutToMissionProgress * 40))}%`,
              top: `${Math.max(30, Math.min(65, 20 + aboutToMissionProgress * 45))}%`,
              transform: `scale(${1.2 - aboutToMissionProgress * 0.5}) rotate(${scrollY * 0.4}deg)`
            }}
          >
            <div className="w-16 h-16 rounded-full border-2 border-[#FFFFFF] bg-[#1A1A1A] flex items-center justify-center shadow-2xl">
              <Play className="w-6 h-6 fill-[#FFFFFF] stroke-none ml-0.5" />
            </div>
          </div>

          <div className="mx-auto w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center relative z-10 my-auto">
            {/* Left side: Phone device mockup with Endless Chaotic Scroll -> Clean Grid Snap */}
            <div className="lg:col-span-6 flex justify-center items-center">
              <div className="relative w-[280px] sm:w-[320px] h-[520px] sm:h-[560px] rounded-[44px] border-[3px] border-[#333333] bg-[#1A1A1A] p-3 shadow-[0_20px_70px_rgba(0,0,0,0.85)] overflow-hidden">
                {/* Notch */}
                <div className="mx-auto h-4 w-20 rounded-full bg-[#0B0B0B] border border-[#333333] mb-2" />

                {/* Device Inner Screen */}
                <div className="relative w-full h-[calc(100%-24px)] rounded-[34px] overflow-hidden bg-[#0B0B0B] border border-[#333333] flex flex-col">
                  {/* Top Status */}
                  <div className="px-4 py-2 border-b border-[#333333] flex items-center justify-between text-[11px] text-[#6B6B6B]">
                    <span className="font-mono">
                      {missionCollided ? 'ORGANIZED' : 'ENDLESS FEED'}
                    </span>
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        missionCollided ? 'bg-[#FFFFFF]' : 'bg-[#6B6B6B] animate-ping'
                      }`}
                    />
                  </div>

                  {/* Mode A: Chaotic Endless Auto-Scroll Blur (Brain Rot) */}
                  {!missionCollided ? (
                    <div className="flex-1 overflow-hidden relative p-3">
                      <div className="space-y-3 animate-[endlessScroll_3.5s_linear_infinite] motion-reduce:animate-none">
                        {[1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6].map((num, idx) => (
                          <div
                            key={`endless-${idx}-${num}`}
                            className="rounded-xl border border-[#333333] bg-[#1A1A1A] p-3 opacity-70 blur-[0.4px] transition-all"
                          >
                            <div className="h-2.5 w-16 bg-[#333333] rounded mb-2" />
                            <div className="h-16 w-full bg-[#0B0B0B] rounded-lg border border-[#333333]/50 flex items-center justify-center">
                              <span className="text-[10px] text-[#6B6B6B] font-mono">
                                #endless_scroll_{num}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Gradient overlay simulating velocity */}
                      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#0B0B0B] to-transparent pointer-events-none" />
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0B0B0B] to-transparent pointer-events-none" />
                    </div>
                  ) : (
                    /* Mode B: Snapped Organized Library Grid Payoff */
                    <div className="flex-1 p-3 flex flex-col justify-between animate-fade-in">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase text-[#FFFFFF] tracking-wider block">
                          Transformed Into Library
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="rounded-xl bg-[#1A1A1A] p-2.5 border border-[#333333] shadow-sm">
                            <p className="font-semibold text-[#FFFFFF] truncate">Coding &amp; Dev</p>
                            <span className="text-[#6B6B6B] text-[9px]">8 saved</span>
                          </div>
                          <div className="rounded-xl bg-[#1A1A1A] p-2.5 border border-[#333333] shadow-sm">
                            <p className="font-semibold text-[#FFFFFF] truncate">Recipes</p>
                            <span className="text-[#6B6B6B] text-[9px]">5 saved</span>
                          </div>
                          <div className="rounded-xl bg-[#1A1A1A] p-2.5 border border-[#333333] shadow-sm">
                            <p className="font-semibold text-[#FFFFFF] truncate">Fitness</p>
                            <span className="text-[#6B6B6B] text-[9px]">3 saved</span>
                          </div>
                          <div className="rounded-xl bg-[#1A1A1A] p-2.5 border border-[#333333] shadow-sm">
                            <p className="font-semibold text-[#FFFFFF] truncate">Design</p>
                            <span className="text-[#6B6B6B] text-[9px]">12 saved</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-[#333333] bg-[#1A1A1A] p-2 text-center text-[10px] text-[#D9D9D9]">
                        Zero effort. Filter by topic anytime.
                      </div>
                    </div>
                  )}

                  {/* Manual Toggle Hint for interactive feeling */}
                  <button
                    type="button"
                    onClick={() => setMissionCollided(!missionCollided)}
                    className="p-2 border-t border-[#333333] bg-[#1A1A1A] hover:bg-[#333333] text-[10px] text-[#D9D9D9] transition-colors font-mono"
                  >
                    {missionCollided ? 'Click to replay endless scroll' : 'Click or scroll to snap organize'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right side: Existing Mission copy unchanged (§7) */}
            <div className="lg:col-span-6 text-left flex flex-col items-start">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#6B6B6B] mb-4 block">
                OUR MISSION
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#FFFFFF] mb-6 leading-tight text-balance">
                No scroll should go to waste.
              </h2>
              <p className="text-base sm:text-lg text-[#D9D9D9] leading-relaxed mb-6">
                It transforms passive saves and bookmarking into an organized personal library.
              </p>
              <p className="text-sm sm:text-base text-[#6B6B6B] leading-relaxed">
                Save less time organizing, spend more time learning and enjoying.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. HOW IT WORKS (§8: 100vh viewport matching, clean minimal, magnetic)   */}
        {/* ========================================================================= */}
        <section
          id="how-it-works"
          ref={horizontalSectionRef}
          className="relative md:h-[230vh] bg-[#0B0B0B] border-b border-[#333333]"
        >
          <div className="md:sticky md:top-0 md:h-screen md:flex md:flex-col md:justify-center overflow-hidden py-20 md:py-0 w-full">
            {/* Header Caption */}
            <div className="w-full px-6 sm:px-12 mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 max-w-7xl mx-auto">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] block mb-1">
                  How It Works — Autopilot Pipeline
                </span>
                <h3 className="text-2xl sm:text-4xl font-bold text-[#FFFFFF] tracking-tight">
                  One tap. Everything else is on autopilot.
                </h3>
              </div>
              <span className="hidden md:inline-block text-xs text-[#6B6B6B] font-mono">
                {Math.min(4, Math.floor(scrollProgress * 3.99) + 1)} / 4
              </span>
            </div>

            {/* Desktop Horizontal Sliding Stage with magnetic weighted momentum */}
            <div className="hidden md:block w-full overflow-hidden">
              <div
                className="flex gap-8 px-12 transition-transform duration-300 ease-out will-change-transform max-w-7xl mx-auto"
                style={{
                  transform: `translateX(calc(${-(scrollProgress * 3 * 580)}px + 2vw))`
                }}
              >
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = Math.floor(scrollProgress * 3.99) === idx;
                  return (
                    <article
                      key={step.id}
                      className={`w-[540px] shrink-0 rounded-3xl border p-10 flex flex-col justify-between transition-all duration-300 ${
                        isActive
                          ? 'border-[#D9D9D9] bg-[#1A1A1A] scale-100 shadow-[0_20px_60px_rgba(0,0,0,0.85)]'
                          : 'border-[#333333] bg-[#0B0B0B] scale-[0.96] opacity-70'
                      }`}
                      style={{
                        transform: `perspective(1000px) rotateY(${isActive ? 0 : 3}deg)`
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-8">
                          {/* Clean minimal line-art frame without STEP 01 label */}
                          <div className="w-12 h-12 rounded-2xl border border-[#333333] bg-[#1A1A1A] flex items-center justify-center">
                            <Icon className="w-6 h-6 text-[#FFFFFF]" />
                          </div>
                          <div className="w-8 h-1 rounded-full bg-[#333333]" />
                        </div>

                        <h4 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF] mb-3 tracking-tight">
                          {step.title}
                        </h4>
                        <p className="text-sm text-[#D9D9D9] leading-relaxed mb-6">
                          {step.body}
                        </p>

                        {/* Interactive Stageshow Faux Product Simulation */}
                        <div className="mb-6">
                          <StageshowStepCard stepIndex={idx} />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-[#333333] flex items-center justify-between text-xs text-[#6B6B6B]">
                        <span>{step.note}</span>
                        <div className="flex items-center gap-1.5">
                          {[0, 1, 2, 3].map((dot) => (
                            <span
                              key={dot}
                              className={`w-1.5 h-1.5 rounded-full ${
                                dot === idx ? 'bg-[#FFFFFF]' : 'bg-[#333333]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Mobile Touch Native Horizontal Swipe Strip */}
            <div className="md:hidden flex gap-4 overflow-x-auto px-6 pb-6 pt-2 snap-x snap-mandatory scrollbar-none w-full">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.id}
                    className="w-[88vw] max-w-[340px] shrink-0 snap-center rounded-3xl border border-[#333333] bg-[#1A1A1A] p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-10 h-10 rounded-xl border border-[#333333] bg-[#0B0B0B] flex items-center justify-center">
                          <Icon className="w-5 h-5 text-[#FFFFFF]" />
                        </div>
                      </div>
                      <h4 className="text-xl font-bold text-[#FFFFFF] mb-2">{step.title}</h4>
                      <p className="text-xs text-[#D9D9D9] leading-relaxed mb-4">{step.body}</p>
                      <div className="mb-4">
                        <StageshowStepCard stepIndex={idx} />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-[#333333] text-[11px] text-[#6B6B6B]">
                      {step.note}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Desktop Magnetic Progress Track */}
            <div className="hidden md:block w-full max-w-7xl mx-auto px-12 mt-8">
              <div className="h-[2px] w-full bg-[#1A1A1A] rounded-full overflow-hidden border border-[#333333]">
                <div
                  className="h-full bg-[#FFFFFF] transition-all duration-150 ease-out"
                  style={{ width: `${Math.max(15, scrollProgress * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. FINAL CTA SECTION (§9: Staggered entrance, tactile CTA, wordmark depth)*/}
        {/* ========================================================================= */}
        <section
          ref={ctaRef}
          className="relative min-h-[85vh] flex flex-col justify-center items-center py-28 px-6 sm:px-10 border-b border-[#333333] text-center overflow-hidden bg-[#0B0B0B]"
        >
          {/* Oversized background cropped "Watch Later" wordmark in Oughter with Parallax Depth (§9) */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 transition-transform duration-100 ease-out"
            style={{
              transform: `translateY(${-scrollY * 0.04}px) scale(1.02)`
            }}
          >
            <span className="font-oughter text-[16vw] sm:text-[18vw] leading-none text-[#FFFFFF]/[0.03] whitespace-nowrap uppercase tracking-tight">
              Watch Later
            </span>
          </div>

          <div className="relative z-10 mx-auto max-w-xl flex flex-col items-center">
            {/* Staggered entrance 1: Headline */}
            <h2 className="text-3xl sm:text-5xl font-black text-[#FFFFFF] tracking-tight mb-4 text-balance leading-tight animate-fade-up">
              Your next save starts here.
            </h2>

            {/* Staggered entrance 2: Supporting Line */}
            <p className="text-base sm:text-lg text-[#D9D9D9] mb-8 text-balance animate-fade-up [animation-delay:150ms]">
              Never lose a reel worth revisiting.
            </p>

            {/* Tactile, alive Create Account CTA button */}
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setShowAuthModal(true);
              }}
              className="group relative inline-flex items-center justify-center gap-2.5 rounded-full bg-[#FFFFFF] px-9 py-4 text-sm font-bold text-[#0B0B0B] shadow-[0_0_35px_rgba(255,255,255,0.18)] hover:bg-[#D9D9D9] hover:scale-[1.03] transition-all duration-200 active:scale-[0.98] animate-fade-up [animation-delay:300ms]"
            >
              <span>Create account</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 12. FOOTER (§12: Oughter Wordmark, locked palette)                       */}
        {/* ========================================================================= */}
        <footer className="py-8 px-6 sm:px-10 border-t border-[#333333] bg-[#0B0B0B]">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6B6B]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded overflow-hidden border border-[#333333]">
                <Image src="/logo.png" alt="Logo" width={20} height={20} className="object-cover" />
              </div>
              <span className="font-oughter text-base font-bold text-[#FFFFFF]">Watch Later</span>
            </div>
            <span>Never lose a reel worth revisiting.</span>
          </div>
        </footer>

        {/* ========================================================================= */}
        {/* AUTH MODAL DIALOG (Locked palette #0B0B0B / #1A1A1A / #333333 / #FFFFFF)  */}
        {/* ========================================================================= */}
        {showAuthModal && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0B0B]/80 backdrop-blur-md animate-fade-in"
          >
            <div className="relative w-full max-w-md rounded-3xl border border-[#333333] bg-[#1A1A1A] p-6 sm:p-8 text-left text-[#FFFFFF] shadow-2xl">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="absolute top-5 right-5 text-[#6B6B6B] hover:text-[#FFFFFF] transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-2xl font-bold mb-1 text-[#FFFFFF]">
                {authMode === 'signin' ? 'Welcome back' : 'Create account'}
              </h3>
              <p className="text-xs text-[#6B6B6B] mb-6">
                {authMode === 'signin'
                  ? 'Sign in to access your categorized reel library.'
                  : 'Create your account to start auto-sorting your saved reels.'}
              </p>

              {authError && (
                <div className="mb-4 rounded-xl border border-[#6B6B6B] bg-[#0B0B0B] p-3 text-xs text-[#D9D9D9]">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-[#6B6B6B] mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-[#333333] bg-[#0B0B0B] px-4 py-2.5 text-sm text-[#FFFFFF] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#D9D9D9] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#6B6B6B] mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[#333333] bg-[#0B0B0B] px-4 py-2.5 text-sm text-[#FFFFFF] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#D9D9D9] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-[#6B6B6B] hover:text-[#FFFFFF] transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-xl bg-[#FFFFFF] py-3 text-sm font-semibold text-[#0B0B0B] hover:bg-[#D9D9D9] transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  {authLoading ? 'Authenticating…' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="mt-5 text-center text-xs text-[#6B6B6B]">
                {authMode === 'signin' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className="text-[#FFFFFF] underline font-medium hover:text-[#D9D9D9] transition-colors"
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
                      className="text-[#FFFFFF] underline font-medium hover:text-[#D9D9D9] transition-colors"
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
