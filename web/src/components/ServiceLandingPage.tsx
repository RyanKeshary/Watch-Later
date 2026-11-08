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

  // Active category tab for the Product Showcase
  const [showcaseCategory, setShowcaseCategory] = useState<'cooking' | 'design' | 'fitness'>('design');
  const [activeBeat, setActiveBeat] = useState(0);

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
      setActiveBeat(Math.min(3, Math.floor(progress * 3.99)));
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
    <div className="relative min-h-screen bg-[#090A0F] text-[#F7F8F8] font-sans selection:bg-[#00F0FF]/20 selection:text-white overflow-x-hidden antialiased">
      {/* Custom Fluid Cursor Effect (preserved on desktop, hidden on touch devices) */}
      <div className="hidden md:block pointer-events-none">
        <SplashCursor
          contained={false}
          colors={['#00F0FF', '#F59E0B', '#D0D6E0']}
          rainbow={false}
          size={0.55}
          force={0.25}
          swirl={12}
          trail={2.2}
          clickSplash
          colorSpeed={0}
          intensity={0.45}
          momentum={0.65}
          glow={0.12}
          quality="medium"
          intro={false}
          zIndex={1}
        />
      </div>

      {/* ========================================================================= */}
      {/* 2.1 NAV: Pure Wordmark + Optical Alignment + Single Secondary CTA        */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#090A0F]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-10">
          <div className="relative flex items-center">
            {/* Ambient Logo Glow */}
            <div className="absolute -left-3 h-8 w-24 bg-gradient-to-r from-cyan-500/25 via-amber-500/15 to-transparent blur-xl pointer-events-none" />
            <div className="relative flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]" />
              <span className="font-zolo text-lg font-bold tracking-tight text-[#F7F8F8]">Watch Later</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {hasSession ? (
              <button
                type="button"
                onClick={onEnterDashboard}
                className="inline-flex items-center justify-center rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold hover:bg-[#D0D6E0] transition active:scale-[0.98]"
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
                className="inline-flex items-center justify-center rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold hover:bg-[#D0D6E0] transition active:scale-[0.98]"
              >
                Sign In
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownloadClick}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-1.5 text-xs font-medium text-white transition active:scale-[0.98]"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
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
        className="relative min-h-[90vh] flex flex-col justify-center items-center px-6 sm:px-10 overflow-hidden pt-16 pb-28 border-b border-white/[0.08]"
      >
        {/* Reactive 3D Background (§3.1) */}
        <div
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
          style={{ perspective: '1100px' }}
        >
          {/* Subtle Ambient Depth Lighting */}
          <div
            className="absolute h-[520px] w-[520px] rounded-full bg-cyan-600/[0.07] blur-[150px] transition-transform duration-700 ease-out"
            style={{
              transform: `translate3d(${mousePos.x * 45}px, ${mousePos.y * 45 - scrollY * 0.15}px, 0)`
            }}
          />
          <div
            className="absolute h-[420px] w-[420px] rounded-full bg-amber-600/[0.06] blur-[130px] transition-transform duration-700 ease-out"
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
            {/* Monolithic Editorial Slate Panel */}
            <div className="h-72 w-72 sm:h-96 sm:w-96 rounded-[44px] border border-white/[0.09] bg-gradient-to-br from-[#12151F]/80 to-[#090A0F]/60 [transform:rotate(12deg)] shadow-2xl relative overflow-hidden backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/[0.05] to-transparent opacity-90" />
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
          <h1 className="font-zolo text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#F7F8F8] text-balance leading-[1.08] mb-6">
            Never lose a reel worth revisiting.
          </h1>

          <p className="text-base sm:text-lg text-[#D0D6E0] max-w-xl text-balance leading-relaxed mb-10">
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
                  className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-black shadow-2xl transition-all duration-200 hover:bg-[#D0D6E0] active:scale-[0.98]"
                >
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  className="group relative inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm font-bold text-black shadow-[0_0_35px_rgba(0,240,255,0.22)] transition-all duration-200 hover:bg-[#D0D6E0] active:scale-[0.98]"
                >
                  <Download className="h-4 w-4" />
                  <span>Download App (Android)</span>
                </button>
              )}
            </div>

            <p
              className={`text-xs text-[#8A8F98] transition-opacity duration-300 ${
                hasDownloaded || downloadSuccess ? 'opacity-100' : 'opacity-0'
              }`}
            >
              You&apos;re in — sign in with the account you shared your first reel from.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.3 HOW IT WORKS: Horizontal Scroll Narrative (Tightly Calibrated Travel)  */}
      {/* ========================================================================= */}
      <section
        ref={horizontalSectionRef}
        className="relative md:h-[185vh] bg-[#090A0F] border-b border-white/[0.08]"
      >
        <div className="md:sticky md:top-0 md:h-screen md:flex md:flex-col md:justify-center overflow-hidden py-20 md:py-0">
          <div className="mx-auto max-w-6xl px-6 sm:px-10 mb-6 md:mb-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-400 font-mono mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span>01 — 04 SEQUENCE</span>
              </div>
              <h2 className="font-zolo text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F7F8F8] mb-2 text-balance leading-[1.12]">
                One tap. Everything else is on autopilot.
              </h2>
              <p className="text-sm text-[#8A8F98] text-balance">
                Follow the physical path from Instagram share sheet to clean library.
              </p>
            </div>

            {/* Interactive Beat Jumpers */}
            <div className="hidden md:flex items-center gap-2">
              {steps.map((s, i) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (!horizontalSectionRef.current) return;
                    const el = horizontalSectionRef.current;
                    const totalScrollable = el.offsetHeight - window.innerHeight;
                    const targetScroll = el.offsetTop + (i / (steps.length - 1)) * totalScrollable;
                    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
                  }}
                  className={`h-8 px-3 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 ${
                    activeBeat === i
                      ? 'bg-cyan-400 text-black font-bold shadow-[0_0_16px_rgba(0,240,255,0.4)]'
                      : 'bg-[#12151F] text-[#8A8F98] hover:bg-[#181C2A] hover:text-[#F7F8F8] border border-white/[0.08]'
                  }`}
                >
                  <span>{s.num}</span>
                  <span className="hidden lg:inline text-[11px] font-sans font-medium">{s.title.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Horizontal Sliding Track (§3.2 / scroll-craft pan) */}
          <div className="hidden md:block w-full overflow-hidden">
            <div
              className="flex gap-8 px-10 transition-transform duration-75 ease-out will-change-transform"
              style={{
                // Calibrated strictly to travel exactly the rail overflow
                transform: `translateX(calc(${-(scrollProgress * 1180)}px + 2vw))`
              }}
            >
              {steps.map((step, idx) => {
                const isCurrent = activeBeat === idx;
                return (
                  <article
                    key={step.num}
                    className={`w-[440px] shrink-0 border-t-2 pt-6 pb-8 flex flex-col justify-between transition-all duration-300 ${
                      isCurrent
                        ? 'border-cyan-400 bg-[#12151F]/90 px-6 shadow-2xl backdrop-blur-sm'
                        : 'border-white/15 bg-[#12151F]/40 hover:border-white/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-baseline justify-between mb-8">
                        <span className={`font-mono text-3xl font-light tracking-tighter ${isCurrent ? 'text-cyan-400' : 'text-[#5C616B]'}`}>
                          {step.num}
                        </span>
                        <span className="text-xs text-[#D0D6E0] bg-white/[0.06] px-2.5 py-1 rounded-full border border-white/[0.08]">
                          {step.detail}
                        </span>
                      </div>

                      <h3 className="font-zolo text-2xl font-bold text-[#F7F8F8] mb-2 tracking-tight text-balance">
                        {step.title}
                      </h3>
                      <p className="text-sm text-amber-400 mb-4 font-medium">{step.note}</p>
                      <p className="text-sm text-[#D0D6E0] leading-relaxed">{step.body}</p>
                    </div>

                    <div className="pt-8 text-xs text-[#8A8F98] font-mono flex items-center justify-between">
                      <span>BEAT {idx + 1} OF 4</span>
                      <span className="text-[11px] font-mono">{isCurrent ? '● ACTIVE' : '○'}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Mobile Touch Native Horizontal Swipe Strip (§3.5) */}
          <div className="md:hidden relative">
            <div className="flex gap-4 overflow-x-auto px-6 pb-6 pt-2 snap-x snap-mandatory scrollbar-none pr-12">
              {steps.map((step, idx) => (
                <article
                  key={step.num}
                  className="w-[82vw] max-w-[340px] shrink-0 snap-center border-t-2 border-cyan-400/60 pt-5 pb-6 flex flex-col justify-between bg-[#12151F] px-4"
                >
                  <div>
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="font-mono text-2xl text-cyan-400">{step.num}</span>
                      <span className="text-[11px] text-[#D0D6E0] bg-white/[0.06] px-2 py-0.5 rounded-full">{step.detail}</span>
                    </div>
                    <h3 className="font-zolo text-xl font-bold text-[#F7F8F8] mb-1.5 text-balance">{step.title}</h3>
                    <p className="text-xs text-amber-400 mb-2.5 font-medium">{step.note}</p>
                    <p className="text-xs text-[#D0D6E0] leading-relaxed">{step.body}</p>
                  </div>
                  <div className="pt-4 text-[10px] text-[#8A8F98] font-mono">
                    BEAT {idx + 1} OF 4 • SWIPE →
                  </div>
                </article>
              ))}
            </div>
            {/* Visual fade cue on mobile edge */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-6 w-10 bg-gradient-to-l from-[#090A0F] to-transparent" />
          </div>

          {/* Desktop Progress Line Indicator */}
          <div className="hidden md:flex items-center gap-3 px-10 mt-8 max-w-6xl mx-auto w-full">
            <div className="h-[2px] flex-1 bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 shadow-[0_0_8px_#00F0FF] transition-all duration-100 ease-out"
                style={{ width: `${Math.max(10, scrollProgress * 100)}%` }}
              />
            </div>
            <span className="font-mono text-xs text-[#8A8F98]">
              {activeBeat + 1} / 4
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.35 INTERACTIVE HORIZONTAL PRODUCT SHOWCASE                              */}
      {/* ========================================================================= */}
      <section className="relative py-24 px-6 sm:px-10 bg-[#090A0F] border-b border-white/[0.08] overflow-hidden">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs text-amber-400 font-mono mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>INTERACTIVE SHOWCASE</span>
              </div>
              <h2 className="font-zolo text-3xl sm:text-5xl font-black text-[#F7F8F8] tracking-tight text-balance leading-[1.1]">
                Inside the actual engine.
              </h2>
              <p className="text-sm sm:text-base text-[#8A8F98] mt-2 max-w-xl text-balance">
                Zero clutter. Reels land silently, get transcribed, and show up ready to watch with the key takeaway extracted.
              </p>
            </div>

            {/* Category Selector Buttons */}
            <div className="flex items-center gap-2 bg-[#12151F] p-1.5 rounded-full border border-white/[0.08] w-fit">
              {(['design', 'cooking', 'fitness'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setShowcaseCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                    showcaseCategory === cat
                      ? 'bg-white text-black shadow-lg'
                      : 'text-[#8A8F98] hover:text-[#F7F8F8]'
                  }`}
                >
                  {cat === 'design' ? 'Design & Visual' : cat === 'cooking' ? 'Cooking & Food' : 'Fitness & Form'}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Horizontal Reel Rail */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {showcaseCategory === 'design' && (
              <>
                <div className="rounded-2xl border border-white/[0.08] bg-[#12151F] p-6 flex flex-col justify-between hover:border-cyan-400/40 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,240,255,0.08)]">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8A8F98] mb-4 font-mono">
                      <span>@studiodesign</span>
                      <span className="text-amber-400">Captured 14m ago</span>
                    </div>
                    <h4 className="font-zolo text-lg font-bold text-[#F7F8F8] mb-2 text-balance">Concentric Radii in Mobile UI</h4>
                    <p className="text-xs text-[#D0D6E0] leading-relaxed mb-4">
                      Why nested containers look warped when outer and inner borders share the same radius. R_inner = R_outer - padding.
                    </p>
                    <div className="rounded-xl bg-[#090A0F] p-3 border border-white/[0.06] text-[11px] text-[#8A8F98] font-mono">
                      💡 AI Takeaway: Inner radius must subtract padding to maintain visual harmony.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" /> Transcribed
                    </span>
                    <span className="text-[#5C616B] font-mono">0:48 duration</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#12151F] p-6 flex flex-col justify-between hover:border-cyan-400/40 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,240,255,0.08)]">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8A8F98] mb-4 font-mono">
                      <span>@motioncrafter</span>
                      <span className="text-amber-400">Captured 2h ago</span>
                    </div>
                    <h4 className="font-zolo text-lg font-bold text-[#F7F8F8] mb-2 text-balance">Spring Physics vs Linear Easing</h4>
                    <p className="text-xs text-[#D0D6E0] leading-relaxed mb-4">
                      Linear transitions feel robotic. Damped springs (stiffness 280, damping 26) create physical weight users expect.
                    </p>
                    <div className="rounded-xl bg-[#090A0F] p-3 border border-white/[0.06] text-[11px] text-[#8A8F98] font-mono">
                      💡 AI Takeaway: Use spring physics for gestures, bezier easing for simple fades.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" /> Transcribed
                    </span>
                    <span className="text-[#5C616B] font-mono">1:12 duration</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#12151F] p-6 flex flex-col justify-between hover:border-cyan-400/40 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,240,255,0.08)]">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8A8F98] mb-4 font-mono">
                      <span>@typefoundry</span>
                      <span className="text-amber-400">Captured 1d ago</span>
                    </div>
                    <h4 className="font-zolo text-lg font-bold text-[#F7F8F8] mb-2 text-balance">Editorial Line Heights & Contrast</h4>
                    <p className="text-xs text-[#D0D6E0] leading-relaxed mb-4">
                      Tight display leading (1.05 to 1.1) paired with relaxed body leading (1.6) creates immediate editorial polish.
                    </p>
                    <div className="rounded-xl bg-[#090A0F] p-3 border border-white/[0.06] text-[11px] text-[#8A8F98] font-mono">
                      💡 AI Takeaway: Display headers want negative tracking and tight leading.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" /> Transcribed
                    </span>
                    <span className="text-[#5C616B] font-mono">0:56 duration</span>
                  </div>
                </div>
              </>
            )}

            {showcaseCategory === 'cooking' && (
              <>
                <div className="rounded-2xl border border-white/[0.08] bg-[#12151F] p-6 flex flex-col justify-between hover:border-amber-400/40 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(245,158,11,0.08)]">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8A8F98] mb-4 font-mono">
                      <span>@pasta.craft</span>
                      <span className="text-amber-400">Captured 3h ago</span>
                    </div>
                    <h4 className="font-zolo text-lg font-bold text-[#F7F8F8] mb-2 text-balance">The Real Carbonara Emulsion</h4>
                    <p className="text-xs text-[#D0D6E0] leading-relaxed mb-4">
                      Never add cream. Use warm pasta water and pecorino romano off the heat to create glossy velvet emulsification.
                    </p>
                    <div className="rounded-xl bg-[#090A0F] p-3 border border-white/[0.06] text-[11px] text-[#8A8F98] font-mono">
                      💡 Ingredients: Guanciale, Egg yolks, Pecorino Romano, Black pepper.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" /> Recipe Extracted
                    </span>
                    <span className="text-[#5C616B] font-mono">0:45 duration</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#12151F] p-6 flex flex-col justify-between hover:border-amber-400/40 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(245,158,11,0.08)]">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8A8F98] mb-4 font-mono">
                      <span>@breadlab</span>
                      <span className="text-amber-400">Captured 5h ago</span>
                    </div>
                    <h4 className="font-zolo text-lg font-bold text-[#F7F8F8] mb-2 text-balance">No-Knead Overnight Focaccia</h4>
                    <p className="text-xs text-[#D0D6E0] leading-relaxed mb-4">
                      80% hydration, cold ferment for 24 hours. Generous olive oil dimpling creates cloud-like interior and blistered crust.
                    </p>
                    <div className="rounded-xl bg-[#090A0F] p-3 border border-white/[0.06] text-[11px] text-[#8A8F98] font-mono">
                      💡 Proofing: 24h in fridge, 2h room temp before bake.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" /> Recipe Extracted
                    </span>
                    <span className="text-[#5C616B] font-mono">1:04 duration</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#12151F] p-6 flex flex-col justify-between hover:border-amber-400/40 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(245,158,11,0.08)]">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8A8F98] mb-4 font-mono">
                      <span>@culinarytechnique</span>
                      <span className="text-amber-400">Captured 1d ago</span>
                    </div>
                    <h4 className="font-zolo text-lg font-bold text-[#F7F8F8] mb-2 text-balance">Steak Pan Sauce Deglaze</h4>
                    <p className="text-xs text-[#D0D6E0] leading-relaxed mb-4">
                      Scrape the browned fond with dry shallots and red wine. Kill the heat before whisking cold cubed butter to finish.
                    </p>
                    <div className="rounded-xl bg-[#090A0F] p-3 border border-white/[0.06] text-[11px] text-[#8A8F98] font-mono">
                      💡 Technique: Cold butter mount (monter au beurre) locks the gloss.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" /> Recipe Extracted
                    </span>
                    <span className="text-[#5C616B] font-mono">0:52 duration</span>
                  </div>
                </div>
              </>
            )}

            {showcaseCategory === 'fitness' && (
              <>
                <div className="rounded-2xl border border-white/[0.08] bg-[#12151F] p-6 flex flex-col justify-between hover:border-emerald-400/40 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)]">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8A8F98] mb-4 font-mono">
                      <span>@biomechanics</span>
                      <span className="text-amber-400">Captured 4h ago</span>
                    </div>
                    <h4 className="font-zolo text-lg font-bold text-[#F7F8F8] mb-2 text-balance">Hip Wedge Setup for Deadlifts</h4>
                    <p className="text-xs text-[#D0D6E0] leading-relaxed mb-4">
                      Pull the slack out of the bar before pushing the floor away. Wedge your hips forward rather than squatting down.
                    </p>
                    <div className="rounded-xl bg-[#090A0F] p-3 border border-white/[0.06] text-[11px] text-[#8A8F98] font-mono">
                      💡 Form Cue: &apos;Protect your armpits&apos; to lock lats before initiation.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" /> Form Cues Extracted
                    </span>
                    <span className="text-[#5C616B] font-mono">0:39 duration</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#12151F] p-6 flex flex-col justify-between hover:border-emerald-400/40 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)]">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8A8F98] mb-4 font-mono">
                      <span>@mobilityproject</span>
                      <span className="text-amber-400">Captured 8h ago</span>
                    </div>
                    <h4 className="font-zolo text-lg font-bold text-[#F7F8F8] mb-2 text-balance">Thoracic Spine Rotation Drills</h4>
                    <p className="text-xs text-[#D0D6E0] leading-relaxed mb-4">
                      Fix rounded desk posture in 3 minutes. Quadruped reach-throughs unlock overhead press range of motion.
                    </p>
                    <div className="rounded-xl bg-[#090A0F] p-3 border border-white/[0.06] text-[11px] text-[#8A8F98] font-mono">
                      💡 Reps: 8 slow rotations per side with deep exhalations.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" /> Form Cues Extracted
                    </span>
                    <span className="text-[#5C616B] font-mono">0:49 duration</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#12151F] p-6 flex flex-col justify-between hover:border-emerald-400/40 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)]">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8A8F98] mb-4 font-mono">
                      <span>@rehabspecialist</span>
                      <span className="text-amber-400">Captured 2d ago</span>
                    </div>
                    <h4 className="font-zolo text-lg font-bold text-[#F7F8F8] mb-2 text-balance">Shoulder External Rotator Cue</h4>
                    <p className="text-xs text-[#D0D6E0] leading-relaxed mb-4">
                      Why high-elbow rows pinch the supraspinatus. Tuck elbows to 45 degrees and squeeze lower traps at peak contraction.
                    </p>
                    <div className="rounded-xl bg-[#090A0F] p-3 border border-white/[0.06] text-[11px] text-[#8A8F98] font-mono">
                      💡 Form Cue: Keep wrists neutral and drive with elbows, not biceps.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" /> Form Cues Extracted
                    </span>
                    <span className="text-[#5C616B] font-mono">0:41 duration</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.4 THE DASHBOARD / PAYOFF: Editorial List Layout (Replaces AI cards)     */}
      {/* ========================================================================= */}
      <section className="py-32 px-6 sm:px-10 bg-[#090A0F] border-t border-white/[0.08]">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-xl mb-16">
            <h2 className="font-zolo text-3xl sm:text-5xl font-black text-[#F7F8F8] tracking-tight mb-4 text-balance leading-[1.1]">
              No endless saved list. Just what matters.
            </h2>
            <p className="text-base text-[#D0D6E0] text-balance">
              Instead of scrolling past the same 200 saved reels forever, pick a category and actually watch what you saved.
            </p>
          </div>

          {/* Editorial Pillar Directory (Clean typographic layout) */}
          <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
            <div className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline group">
              <div className="md:col-span-4 flex items-baseline gap-3">
                <span className="font-mono text-xs text-cyan-400">01</span>
                <h3 className="font-zolo text-xl font-bold text-[#F7F8F8] group-hover:text-cyan-300 transition-colors">
                  Cooking & Food
                </h3>
              </div>
              <p className="md:col-span-6 text-sm text-[#D0D6E0] leading-relaxed">
                Italian pasta technique, 3-minute sourdough prep, homemade bone broth.
              </p>
              <div className="md:col-span-2 text-left md:text-right font-mono text-xs text-[#8A8F98]">
                4 reels queued
              </div>
            </div>

            <div className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline group">
              <div className="md:col-span-4 flex items-baseline gap-3">
                <span className="font-mono text-xs text-cyan-400">02</span>
                <h3 className="font-zolo text-xl font-bold text-[#F7F8F8] group-hover:text-cyan-300 transition-colors">
                  Design & Visual
                </h3>
              </div>
              <p className="md:col-span-6 text-sm text-[#D0D6E0] leading-relaxed">
                Typography hierarchies, spatial motion principles, tactile interfaces.
              </p>
              <div className="md:col-span-2 text-left md:text-right font-mono text-xs text-[#8A8F98]">
                7 reels queued
              </div>
            </div>

            <div className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline group">
              <div className="md:col-span-4 flex items-baseline gap-3">
                <span className="font-mono text-xs text-cyan-400">03</span>
                <h3 className="font-zolo text-xl font-bold text-[#F7F8F8] group-hover:text-cyan-300 transition-colors">
                  Fitness & Recovery
                </h3>
              </div>
              <p className="md:col-span-6 text-sm text-[#D0D6E0] leading-relaxed">
                Shoulder mobility cues, deadlift mechanics, deep tissue recovery routines.
              </p>
              <div className="md:col-span-2 text-left md:text-right font-mono text-xs text-[#8A8F98]">
                3 reels queued
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.5 FINAL CTA: Single Action "Create account"                             */}
      {/* ========================================================================= */}
      <section className="py-28 px-6 sm:px-10 border-t border-white/[0.08] bg-[#090A0F] text-center relative overflow-hidden">
        {/* Soft radial glow background */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-96 w-96 rounded-full bg-cyan-500/[0.05] blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-xl flex flex-col items-center">
          <h2 className="font-zolo text-3xl sm:text-5xl font-black text-[#F7F8F8] tracking-tight mb-4 text-balance leading-[1.1]">
            Never lose a reel worth revisiting.
          </h2>
          <p className="text-sm sm:text-base text-[#D0D6E0] mb-8 text-balance">
            Get your personal dashboard ready before sharing your next reel.
          </p>

          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setShowAuthModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-black shadow-[0_0_35px_rgba(0,240,255,0.22)] hover:bg-[#D0D6E0] transition active:scale-[0.98]"
          >
            <span>Create account</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.6 FOOTER: One line Wordmark + Tagline                                   */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/[0.08] py-8 px-6 sm:px-10 bg-[#090A0F]">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A8F98]">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00F0FF]" />
            <span className="font-zolo font-bold text-sm text-[#F7F8F8]">Watch Later</span>
          </div>
          <span className="text-[#8A8F98]">Never lose a reel worth revisiting.</span>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* AUTH MODAL                                                                */}
      {/* ========================================================================= */}
      {showAuthModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[24px] border border-white/[0.12] bg-[#12151F] p-6 sm:p-8 shadow-2xl text-left">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-6 right-6 text-[#8A8F98] hover:text-[#F7F8F8] transition"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 id="auth-modal-title" className="font-zolo text-2xl font-bold text-[#F7F8F8] mb-1">
              {authMode === 'signin' ? 'Welcome back' : 'Create account'}
            </h3>
            <p className="text-xs text-[#D0D6E0] mb-6">
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
                <label htmlFor="auth-email-input" className="block text-xs font-mono text-[#8A8F98] mb-1.5">
                  EMAIL
                </label>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#090A0F]/80 px-4 py-2.5 text-sm text-[#F7F8F8] placeholder-[#5C616B] focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="auth-password-input" className="block text-xs font-mono text-[#8A8F98] mb-1.5">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="auth-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/[0.1] bg-[#090A0F]/80 px-4 py-2.5 text-sm text-[#F7F8F8] placeholder-[#5C616B] focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-[#8A8F98] hover:text-[#F7F8F8]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-white py-3 text-sm font-bold text-black hover:bg-[#D0D6E0] transition disabled:opacity-50 active:scale-[0.98] shadow-lg"
              >
                {authLoading ? 'Authenticating...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#8A8F98]">
              {authMode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className="text-[#F7F8F8] hover:underline font-semibold"
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
                    className="text-[#F7F8F8] hover:underline font-semibold"
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
