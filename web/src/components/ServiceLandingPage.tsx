'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Download,
  ArrowRight,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Smartphone,
  Globe,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import HeroParticleMesh from '@/components/HeroParticleMesh';
import TiltCard from '@/components/TiltCard';
import MagneticButton from '@/components/MagneticButton';

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
      note: 'Native share sheet you use daily',
      body: 'No copying links into a notes file or texting yourself. Tap the Instagram share sheet, choose Watch Later, and continue reading.',
      detail: 'Direct OS share'
    },
    {
      num: '02',
      title: 'Captured silently',
      note: 'No dialogue box, zero interruption',
      body: 'Captured in milliseconds. If your reception drops, the share queues safely in local storage and syncs once signal returns.',
      detail: 'Offline queue'
    },
    {
      num: '03',
      title: 'Filed by topic',
      note: 'Transcripts parsed immediately',
      body: 'No manual folders. Machine intelligence extracts spoken speech and categorises each clip into structured libraries.',
      detail: 'Smart speech filter'
    },
    {
      num: '04',
      title: 'Ready for viewing',
      note: 'Organised library, never buried',
      body: 'A single calm surface instead of an endless saved backlog. Open a category, review key insights, and mark complete.',
      detail: 'Auto-cleaned queue'
    }
  ];

  return (
    <div className="relative min-h-dvh bg-canvas text-ink font-sans selection:bg-cyanbrand/20 selection:text-ink antialiased">
      {/* ========================================================================= */}
      {/* 2.1 NAV: Pure Wordmark + Optical Alignment + Single Secondary CTA        */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-10">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-cyanbrand" />
            <span className="font-oughter text-lg font-bold tracking-tight text-ink">Watch Later</span>
          </div>

          <div className="flex items-center gap-4">
            {hasSession ? (
              <button
                type="button"
                onClick={onEnterDashboard}
                className="inline-flex items-center justify-center rounded-full bg-ink text-black px-4 py-1.5 text-xs font-semibold hover:bg-ink-muted transition-colors active:scale-[0.98]"
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
                className="inline-flex items-center justify-center rounded-full bg-ink text-black px-4 py-1.5 text-xs font-semibold hover:bg-ink-muted transition-colors active:scale-[0.98]"
              >
                Sign In
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownloadClick}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-1.5 text-xs font-medium text-ink transition-colors active:scale-[0.98]"
              >
                <Download className="h-3.5 w-3.5 text-cyanbrand" />
                <span>Download</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2.2 HERO: Flagship Release Posture & High-Contrast Headline               */}
      {/* ========================================================================= */}
      <section
        ref={heroRef}
        className="relative min-h-dvh flex flex-col justify-center items-center px-6 sm:px-10 overflow-hidden pt-16 pb-24 border-b border-white/[0.08]"
      >
        {/* Interactive WebGL / Canvas Reactive Mesh (§scroll-craft) */}
        <HeroParticleMesh />

        {/* Subtle Depth Lighting */}
        <div
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
          style={{ perspective: '1100px' }}
        >
          <div
            className="relative transition-transform duration-200 ease-out will-change-transform motion-reduce:transform-none"
            style={{
              transform: `rotateX(${-mousePos.y * 10}deg) rotateY(${mousePos.x * 12}deg) translateZ(-50px)`
            }}
          >
            <div className="h-72 w-72 sm:h-96 sm:w-96 rounded-[44px] border border-white/[0.09] bg-panel [transform:rotate(12deg)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
            </div>
            <div
              className="absolute -inset-5 rounded-[36px] border border-white/[0.07] bg-white/[0.01] [transform:rotate(-8deg)]"
            />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-3xl text-center flex flex-col items-center">
          {/* Flagship Release Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-panel border border-white/10 text-xs text-ink-muted mb-6">
            <span className="flex h-2 w-2 rounded-full bg-cyanbrand" />
            <span className="font-medium">Version 1.0 Flagship Release</span>
            <span className="text-ink-tertiary">|</span>
            <span className="text-ink-subtle">Android APK &amp; Web</span>
          </div>

          <h1 className="font-sans text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-ink text-balance leading-[1.08] mb-6">
            Never lose a reel worth revisiting.
          </h1>

          <p className="text-base sm:text-lg text-ink-muted max-w-xl text-balance leading-relaxed mb-8">
            Reels sent to Watch Later are gathered silently and filed into focus queues.
          </p>

          {/* Single Hero CTA with §1.6 morphing */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {downloadSuccess ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-8 py-4 text-sm font-semibold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>APK Download initiated… Check notifications.</span>
                </div>
              ) : hasDownloaded ? (
                <MagneticButton
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                  className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 text-sm font-bold text-black transition-colors hover:bg-ink-muted"
                >
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </MagneticButton>
              ) : (
                <MagneticButton
                  type="button"
                  onClick={handleDownloadClick}
                  className="group relative inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-8 py-4 text-sm font-bold text-black transition-colors hover:bg-ink-muted"
                >
                  <Download className="h-4 w-4 text-cyanbrand" />
                  <span>Download APK (Android)</span>
                </MagneticButton>
              )}
            </div>

            <p
              className={`text-xs text-ink-subtle transition-opacity duration-300 ${hasDownloaded || downloadSuccess ? 'opacity-100' : 'opacity-0'
                }`}
            >
              First download complete. Sign in with the account you share clips from.
            </p>
          </div>

          {/* Release Specifications Bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-ink-subtle border-t border-white/[0.08] pt-6">
            <div className="flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5 text-cyanbrand" />
              <span>Android 8.0+ (Universal ARM64)</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Verified Package Signature</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-amberbrand" />
              <span>Instant Cloud Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.3 HOW IT WORKS: Horizontal Scroll Narrative                              */}
      {/* ========================================================================= */}
      <section
        ref={horizontalSectionRef}
        className="relative md:h-[185vh] bg-canvas border-b border-white/[0.08]"
      >
        <div className="md:sticky md:top-0 md:h-screen md:flex md:flex-col md:justify-center overflow-hidden py-20 md:py-0">
          <div className="mx-auto max-w-6xl px-6 sm:px-10 mb-6 md:mb-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-panel border border-white/10 text-xs text-cyanbrand mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-cyanbrand" />
                <span>Process sequence</span>
              </div>
              <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-ink mb-2 text-balance leading-[1.12]">
                One tap. Everything else is on autopilot.
              </h2>
              <p className="text-sm text-ink-subtle text-balance">
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
                  className={`h-8 px-3 rounded-full text-xs transition-colors flex items-center gap-1.5 ${activeBeat === i
                      ? 'bg-cyanbrand text-black font-bold'
                      : 'bg-panel text-ink-subtle hover:bg-raised hover:text-ink border border-white/[0.08]'
                    }`}
                >
                  <span className="tabular-nums">{s.num}</span>
                  <span className="hidden lg:inline text-[11px] font-medium">{s.title.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Horizontal Sliding Track */}
          <div className="hidden md:block w-full overflow-hidden">
            <div
              className="flex gap-8 px-10 transition-transform duration-75 ease-out will-change-transform motion-reduce:transform-none"
              style={{
                transform: `translateX(calc(${-(scrollProgress * 1180)}px + 2vw))`
              }}
            >
              {steps.map((step, idx) => {
                const isCurrent = activeBeat === idx;
                return (
                  <article
                    key={step.num}
                    className={`w-[440px] shrink-0 border-t-2 pt-6 pb-8 flex flex-col justify-between transition-colors ${isCurrent
                        ? 'border-cyanbrand bg-panel/90 px-6 backdrop-blur-sm'
                        : 'border-white/15 bg-panel/40 hover:border-white/30'
                      }`}
                  >
                    <div>
                      <div className="flex items-baseline justify-between mb-8">
                        <span className={`text-3xl font-light tracking-tighter tabular-nums ${isCurrent ? 'text-cyanbrand' : 'text-ink-tertiary'}`}>
                          {step.num}
                        </span>
                        <span className="text-xs text-ink-muted bg-white/[0.06] px-2.5 py-1 rounded-full border border-white/[0.08]">
                          {step.detail}
                        </span>
                      </div>

                      <h3 className="font-sans text-2xl font-bold text-ink mb-2 tracking-tight text-balance">
                        {step.title}
                      </h3>
                      <p className="text-sm text-amberbrand mb-4 font-medium">{step.note}</p>
                      <p className="text-sm text-ink-muted leading-relaxed">{step.body}</p>
                    </div>

                    <div className="pt-8 text-xs text-ink-subtle flex items-center justify-between">
                      <span className="tabular-nums">Phase {idx + 1} of 4</span>
                      <span className="text-[11px]">{isCurrent ? 'Active' : 'Queued'}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Mobile Touch Native Horizontal Swipe Strip */}
          <div className="md:hidden relative">
            <div className="flex gap-4 overflow-x-auto px-6 pb-6 pt-2 snap-x snap-mandatory scrollbar-none pr-12">
              {steps.map((step, idx) => (
                <article
                  key={step.num}
                  className="w-[82vw] max-w-[340px] shrink-0 snap-center border-t-2 border-cyanbrand/60 pt-5 pb-6 flex flex-col justify-between bg-panel px-4"
                >
                  <div>
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="text-2xl text-cyanbrand tabular-nums">{step.num}</span>
                      <span className="text-[11px] text-ink-muted bg-white/[0.06] px-2 py-0.5 rounded-full">{step.detail}</span>
                    </div>
                    <h3 className="font-sans text-xl font-bold text-ink mb-1.5 text-balance">{step.title}</h3>
                    <p className="text-xs text-amberbrand mb-2.5 font-medium">{step.note}</p>
                    <p className="text-xs text-ink-muted leading-relaxed">{step.body}</p>
                  </div>
                  <div className="pt-4 text-[10px] text-ink-subtle">
                    Phase {idx + 1} of 4 (Swipe to continue)
                  </div>
                </article>
              ))}
            </div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-6 w-10 bg-gradient-to-l from-canvas to-transparent" />
          </div>

          {/* Desktop Progress Line Indicator */}
          <div className="hidden md:flex items-center gap-3 px-10 mt-8 max-w-6xl mx-auto w-full">
            <div className="h-[2px] flex-1 bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-cyanbrand"
                style={{ width: `${Math.max(10, scrollProgress * 100)}%` }}
              />
            </div>
            <span className="text-xs text-ink-subtle tabular-nums">
              {activeBeat + 1} / 4
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.35 INTERACTIVE HORIZONTAL PRODUCT SHOWCASE                              */}
      {/* ========================================================================= */}
      <section className="relative py-24 px-6 sm:px-10 bg-canvas border-b border-white/[0.08] overflow-hidden">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-panel border border-white/10 text-xs text-amberbrand mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-amberbrand" />
                <span>Live reel processing</span>
              </div>
              <h2 className="font-sans text-3xl sm:text-5xl font-black text-ink tracking-tight text-balance leading-[1.1]">
                Inside the parsing engine.
              </h2>
              <p className="text-sm sm:text-base text-ink-subtle mt-2 max-w-xl text-balance">
                Zero clutter. Reels arrive quietly, audio transcripts generate, and essential takeaways are extracted.
              </p>
            </div>

            {/* Category Selector Buttons */}
            <div className="flex items-center gap-2 bg-panel p-1.5 rounded-full border border-white/[0.08] w-fit">
              {(['design', 'cooking', 'fitness'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setShowcaseCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${showcaseCategory === cat
                      ? 'bg-ink text-black'
                      : 'text-ink-subtle hover:text-ink'
                    }`}
                >
                  {cat === 'design' ? 'Design & Visual' : cat === 'cooking' ? 'Cooking & Food' : 'Fitness & Form'}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Horizontal Reel Rail with 3D Tilt & Specular Reflections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {showcaseCategory === 'design' && (
              <>
                <TiltCard className="rounded-2xl border border-white/[0.08] bg-panel p-6 flex flex-col justify-between hover:border-cyanbrand/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-xs text-ink-subtle mb-4">
                      <span>@studiodesign</span>
                      <span className="text-amberbrand">Captured 14m ago</span>
                    </div>
                    <h3 className="font-sans text-lg font-bold text-ink mb-2 text-balance">Concentric Radii in Mobile UI</h3>
                    <p className="text-xs text-ink-muted leading-relaxed mb-4">
                      Nested surfaces appear distorted when outer and inner containers share identical radius. Radius inner equals radius outer minus padding.
                    </p>
                    <div className="rounded-xl bg-canvas p-3 border border-white/[0.06] text-[11px] text-ink-subtle">
                      <span className="font-semibold text-ink">Key takeaway:</span> Inner radius must subtract padding to preserve concentricity.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Transcribed
                    </span>
                    <span className="text-ink-tertiary tabular-nums">0:48 duration</span>
                  </div>
                </TiltCard>

                <TiltCard className="rounded-2xl border border-white/[0.08] bg-panel p-6 flex flex-col justify-between hover:border-cyanbrand/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-xs text-ink-subtle mb-4">
                      <span>@motioncrafter</span>
                      <span className="text-amberbrand">Captured 2h ago</span>
                    </div>
                    <h3 className="font-sans text-lg font-bold text-ink mb-2 text-balance">Spring Physics vs Linear Easing</h3>
                    <p className="text-xs text-ink-muted leading-relaxed mb-4">
                      Linear transitions feel mechanical. Damped springs with stiffness 280 and damping 26 deliver physical weight.
                    </p>
                    <div className="rounded-xl bg-canvas p-3 border border-white/[0.06] text-[11px] text-ink-subtle">
                      <span className="font-semibold text-ink">Key takeaway:</span> Reserve spring curves for gesture tracking; use bezier curves for simple opacity.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Transcribed
                    </span>
                    <span className="text-ink-tertiary tabular-nums">1:12 duration</span>
                  </div>
                </TiltCard>

                <TiltCard className="rounded-2xl border border-white/[0.08] bg-panel p-6 flex flex-col justify-between hover:border-cyanbrand/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-xs text-ink-subtle mb-4">
                      <span>@typefoundry</span>
                      <span className="text-amberbrand">Captured 1d ago</span>
                    </div>
                    <h3 className="font-sans text-lg font-bold text-ink mb-2 text-balance">Editorial Line Heights &amp; Contrast</h3>
                    <p className="text-xs text-ink-muted leading-relaxed mb-4">
                      Display headers require tight leading paired with generous line spacing across continuous body text.
                    </p>
                    <div className="rounded-xl bg-canvas p-3 border border-white/[0.06] text-[11px] text-ink-subtle">
                      <span className="font-semibold text-ink">Key takeaway:</span> Display sizes perform best with negative letter spacing and compact vertical rhythm.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Transcribed
                    </span>
                    <span className="text-ink-tertiary tabular-nums">0:56 duration</span>
                  </div>
                </TiltCard>
              </>
            )}

            {showcaseCategory === 'cooking' && (
              <>
                <TiltCard className="rounded-2xl border border-white/[0.08] bg-panel p-6 flex flex-col justify-between hover:border-amberbrand/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-xs text-ink-subtle mb-4">
                      <span>@pasta.craft</span>
                      <span className="text-amberbrand">Captured 3h ago</span>
                    </div>
                    <h3 className="font-sans text-lg font-bold text-ink mb-2 text-balance">The Real Carbonara Emulsion</h3>
                    <p className="text-xs text-ink-muted leading-relaxed mb-4">
                      Avoid heavy dairy. Combine starchy pasta water with cured pork fat and grated pecorino off the flame for velvet texture.
                    </p>
                    <div className="rounded-xl bg-canvas p-3 border border-white/[0.06] text-[11px] text-ink-subtle">
                      <span className="font-semibold text-ink">Core components:</span> Guanciale, Egg yolks, Pecorino Romano, Coarse black pepper.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Recipe Extracted
                    </span>
                    <span className="text-ink-tertiary tabular-nums">0:45 duration</span>
                  </div>
                </TiltCard>

                <TiltCard className="rounded-2xl border border-white/[0.08] bg-panel p-6 flex flex-col justify-between hover:border-amberbrand/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-xs text-ink-subtle mb-4">
                      <span>@breadlab</span>
                      <span className="text-amberbrand">Captured 5h ago</span>
                    </div>
                    <h3 className="font-sans text-lg font-bold text-ink mb-2 text-balance">No-Knead Overnight Focaccia</h3>
                    <p className="text-xs text-ink-muted leading-relaxed mb-4">
                      Eighty percent hydration dough resting twenty-four hours chilled. Deep oil indentation generates open crumb and blistered crust.
                    </p>
                    <div className="rounded-xl bg-canvas p-3 border border-white/[0.06] text-[11px] text-ink-subtle">
                      <span className="font-semibold text-ink">Rest schedule:</span> 24h cold ferment in refrigerator, 2h room rise prior to baking.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Recipe Extracted
                    </span>
                    <span className="text-ink-tertiary tabular-nums">1:04 duration</span>
                  </div>
                </TiltCard>

                <TiltCard className="rounded-2xl border border-white/[0.08] bg-panel p-6 flex flex-col justify-between hover:border-amberbrand/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-xs text-ink-subtle mb-4">
                      <span>@culinarytechnique</span>
                      <span className="text-amberbrand">Captured 1d ago</span>
                    </div>
                    <h3 className="font-sans text-lg font-bold text-ink mb-2 text-balance">Steak Pan Sauce Deglaze</h3>
                    <p className="text-xs text-ink-muted leading-relaxed mb-4">
                      Dissolve fond with shallots and dry wine. Remove heat completely before incorporating cold cubed butter.
                    </p>
                    <div className="rounded-xl bg-canvas p-3 border border-white/[0.06] text-[11px] text-ink-subtle">
                      <span className="font-semibold text-ink">Technique:</span> Cold butter mount stabilises the emulsion without splitting.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Recipe Extracted
                    </span>
                    <span className="text-ink-tertiary tabular-nums">0:52 duration</span>
                  </div>
                </TiltCard>
              </>
            )}

            {showcaseCategory === 'fitness' && (
              <>
                <TiltCard className="rounded-2xl border border-white/[0.08] bg-panel p-6 flex flex-col justify-between hover:border-emerald-400/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-xs text-ink-subtle mb-4">
                      <span>@biomechanics</span>
                      <span className="text-amberbrand">Captured 4h ago</span>
                    </div>
                    <h3 className="font-sans text-lg font-bold text-ink mb-2 text-balance">Hip Wedge Setup for Deadlifts</h3>
                    <p className="text-xs text-ink-muted leading-relaxed mb-4">
                      Draw barbell slack out before initiating ground drive. Wedge hips into the bar instead of sinking into deep squat.
                    </p>
                    <div className="rounded-xl bg-canvas p-3 border border-white/[0.06] text-[11px] text-ink-subtle">
                      <span className="font-semibold text-ink">Movement cue:</span> Engage latissimus dorsi as if protecting armpits before pull.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Form Cues Extracted
                    </span>
                    <span className="text-ink-tertiary tabular-nums">0:39 duration</span>
                  </div>
                </TiltCard>

                <TiltCard className="rounded-2xl border border-white/[0.08] bg-panel p-6 flex flex-col justify-between hover:border-emerald-400/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-xs text-ink-subtle mb-4">
                      <span>@mobilityproject</span>
                      <span className="text-amberbrand">Captured 8h ago</span>
                    </div>
                    <h3 className="font-sans text-lg font-bold text-ink mb-2 text-balance">Thoracic Spine Rotation Drills</h3>
                    <p className="text-xs text-ink-muted leading-relaxed mb-4">
                      Counter seated desk posture quickly. Quadruped reach-throughs restore upper spinal mobility for overhead movements.
                    </p>
                    <div className="rounded-xl bg-canvas p-3 border border-white/[0.06] text-[11px] text-ink-subtle">
                      <span className="font-semibold text-ink">Prescription:</span> 8 controlled rotations per side with full exhalations.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Form Cues Extracted
                    </span>
                    <span className="text-ink-tertiary tabular-nums">0:49 duration</span>
                  </div>
                </TiltCard>

                <TiltCard className="rounded-2xl border border-white/[0.08] bg-panel p-6 flex flex-col justify-between hover:border-emerald-400/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-xs text-ink-subtle mb-4">
                      <span>@rehabspecialist</span>
                      <span className="text-amberbrand">Captured 2d ago</span>
                    </div>
                    <h3 className="font-sans text-lg font-bold text-ink mb-2 text-balance">Shoulder External Rotator Cue</h3>
                    <p className="text-xs text-ink-muted leading-relaxed mb-4">
                      Flared elbows impinge rotator cuff tendons. Keep elbow path near forty-five degrees and engage lower traps.
                    </p>
                    <div className="rounded-xl bg-canvas p-3 border border-white/[0.06] text-[11px] text-ink-subtle">
                      <span className="font-semibold text-ink">Movement cue:</span> Maintain neutral wrists and pull through the elbow joint.
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Form Cues Extracted
                    </span>
                    <span className="text-ink-tertiary tabular-nums">0:41 duration</span>
                  </div>
                </TiltCard>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.38 HORIZONTAL PLATFORM REEL STRIP (Curated drag & wheel inertia)        */}
      {/* ========================================================================= */}
      <section className="py-20 bg-canvas border-b border-white/[0.08] overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-panel border border-white/10 text-xs text-cyanbrand mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-cyanbrand" />
                <span>Cross-platform capture</span>
              </div>
              <h3 className="font-sans text-2xl sm:text-3xl font-bold text-ink tracking-tight text-balance">
                One library for every format you consume.
              </h3>
            </div>
            <p className="text-xs text-ink-subtle">
              Drag or scroll horizontally to explore formats
            </p>
          </div>
        </div>

        {/* Inertia Rail */}
        <div className="flex gap-6 overflow-x-auto px-6 sm:px-10 pb-6 pt-2 snap-x snap-mandatory scrollbar-none cursor-grab active:cursor-grabbing">
          {[
            {
              platform: 'Instagram Reels',
              tag: 'Reels',
              color: 'text-rose-400',
              accent: 'border-rose-500/20',
              sample: 'Visual recipes & restaurant techniques',
              speed: '0.2s capture',
              meta: 'Native share sheet hook'
            },
            {
              platform: 'TikTok Videos',
              tag: 'TikTok',
              color: 'text-cyanbrand',
              accent: 'border-cyanbrand/20',
              sample: 'Engineering breakdowns & fast UI micro-tutorials',
              speed: 'Immediate offline queue',
              meta: 'Watermark-clean link ingestion'
            },
            {
              platform: 'YouTube Shorts',
              tag: 'Shorts',
              color: 'text-red-400',
              accent: 'border-red-500/20',
              sample: 'Biomechanics, exercise form cues & strength setup',
              speed: 'Transcript parsed',
              meta: 'Closed caption sync'
            },
            {
              platform: 'Longform YouTube',
              tag: 'YouTube',
              color: 'text-amberbrand',
              accent: 'border-amberbrand/20',
              sample: 'Deep architectural walkthroughs & podcast chapters',
              speed: 'Chapter indexation',
              meta: 'Full chaptering breakdown'
            }
          ].map((item) => (
            <TiltCard
              key={item.platform}
              className={`w-[320px] sm:w-[360px] shrink-0 snap-center rounded-2xl border ${item.accent} bg-panel p-6 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className={`text-xs font-semibold ${item.color}`}>
                    {item.tag}
                  </span>
                  <span className="text-[11px] text-ink-subtle bg-white/[0.05] px-2.5 py-0.5 rounded-full border border-white/5">
                    {item.speed}
                  </span>
                </div>
                <h4 className="font-sans text-xl font-bold text-ink mb-2">
                  {item.platform}
                </h4>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {item.sample}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-ink-subtle">
                <span>{item.meta}</span>
                <span className="text-ink-tertiary">Ready</span>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.4 THE DASHBOARD / PAYOFF: Editorial List Layout                         */}
      {/* ========================================================================= */}
      <section className="py-32 px-6 sm:px-10 bg-canvas border-t border-white/[0.08]">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-xl mb-16">
            <h2 className="font-sans text-3xl sm:text-5xl font-black text-ink tracking-tight mb-4 text-balance leading-[1.1]">
              No endless saved list. Just what matters.
            </h2>
            <p className="text-base text-ink-muted text-balance">
              Instead of scrolling past hundreds of saved reels, select a dedicated subject and review what you saved.
            </p>
          </div>

          {/* Editorial Pillar Directory */}
          <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
            <div className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline group">
              <div className="md:col-span-4 flex items-baseline gap-3">
                <span className="text-xs text-cyanbrand tabular-nums">01</span>
                <h3 className="font-sans text-xl font-bold text-ink group-hover:text-cyanbrand transition-colors">
                  Cooking &amp; Food
                </h3>
              </div>
              <p className="md:col-span-6 text-sm text-ink-muted leading-relaxed">
                Italian pasta technique, 3-minute sourdough prep, homemade bone broth.
              </p>
              <div className="md:col-span-2 text-left md:text-right text-xs text-ink-subtle tabular-nums">
                4 reels queued
              </div>
            </div>

            <div className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline group">
              <div className="md:col-span-4 flex items-baseline gap-3">
                <span className="text-xs text-cyanbrand tabular-nums">02</span>
                <h3 className="font-sans text-xl font-bold text-ink group-hover:text-cyanbrand transition-colors">
                  Design &amp; Visual
                </h3>
              </div>
              <p className="md:col-span-6 text-sm text-ink-muted leading-relaxed">
                Typography hierarchies, spatial motion principles, tactile interfaces.
              </p>
              <div className="md:col-span-2 text-left md:text-right text-xs text-ink-subtle tabular-nums">
                7 reels queued
              </div>
            </div>

            <div className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline group">
              <div className="md:col-span-4 flex items-baseline gap-3">
                <span className="text-xs text-cyanbrand tabular-nums">03</span>
                <h3 className="font-sans text-xl font-bold text-ink group-hover:text-cyanbrand transition-colors">
                  Fitness &amp; Recovery
                </h3>
              </div>
              <p className="md:col-span-6 text-sm text-ink-muted leading-relaxed">
                Shoulder mobility cues, deadlift mechanics, deep tissue recovery routines.
              </p>
              <div className="md:col-span-2 text-left md:text-right text-xs text-ink-subtle tabular-nums">
                3 reels queued
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.5 FINAL CTA: Flagship Download Card & Create Account                    */}
      {/* ========================================================================= */}
      <section className="py-28 px-6 sm:px-10 border-t border-white/[0.08] bg-canvas text-center relative overflow-hidden">
        <div className="mx-auto max-w-2xl flex flex-col items-center">
          {/* Hardware & Release Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-panel border border-white/10 text-xs text-ink-muted mb-6">
            <Cpu className="h-3.5 w-3.5 text-cyanbrand" />
            <span>Ready for Android devices and web companions</span>
          </div>

          <h2 className="font-sans text-3xl sm:text-5xl font-black text-ink tracking-tight mb-4 text-balance leading-[1.1]">
            Never lose a reel worth revisiting.
          </h2>
          <p className="text-sm sm:text-base text-ink-muted mb-8 text-balance max-w-lg">
            Create an account to activate your personal library before sharing your next clip.
          </p>

          <MagneticButton
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setShowAuthModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 text-sm font-bold text-black transition-colors hover:bg-ink-muted"
          >
            <span>Create account</span>
            <ArrowRight className="h-4 w-4" />
          </MagneticButton>

          {/* Direct verification specs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-ink-subtle">
            <span className="tabular-nums">Direct APK: 18.4 MB</span>
            <span className="text-white/10">/</span>
            <span>SHA-256 Verified</span>
            <span className="text-white/10">/</span>
            <span>Zero advertising trackers</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.6 FOOTER: One line Wordmark + Tagline                                   */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/[0.08] py-8 px-6 sm:px-10 bg-canvas">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-subtle">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyanbrand" />
            <span className="font-oughter font-bold text-sm text-ink">Watch Later</span>
          </div>
          <span className="text-ink-subtle">Never lose a reel worth revisiting.</span>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-2xl animate-fade-in"
        >
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[32px] overflow-hidden border border-white/25 bg-gradient-to-b from-white/[0.12] via-[#141414]/95 to-[#0A0A0A]/98 backdrop-blur-3xl p-6 sm:p-8 text-left shadow-[0_32px_90px_rgba(0,0,0,0.85),inset_0_1.5px_2px_rgba(255,255,255,0.4)] text-white animate-in zoom-in-95 duration-200">
            {/* Ambient Refraction Glow */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-tr from-cyan-400/15 via-white/10 to-purple-500/15 pointer-events-none rounded-t-[32px] blur-xl" />

            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-6 right-6 p-1.5 rounded-full bg-white/[0.1] hover:bg-white/[0.2] border border-white/20 text-white/80 hover:text-white transition active:scale-90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] z-10"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 id="auth-modal-title" className="relative z-10 font-sans text-2xl font-bold text-white mb-1">
              {authMode === 'signin' ? 'Welcome back' : 'Create account'}
            </h3>
            <p className="relative z-10 text-xs text-white/70 mb-6">
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
                <label htmlFor="auth-email-input" className="block text-xs text-ink-subtle mb-1.5">
                  Email address
                </label>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-white/[0.1] bg-canvas px-4 py-2.5 text-sm text-ink placeholder-ink-tertiary focus:border-cyanbrand focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="auth-password-input" className="block text-xs text-ink-subtle mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="auth-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/[0.1] bg-canvas px-4 py-2.5 text-sm text-ink placeholder-ink-tertiary focus:border-cyanbrand focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-ink-subtle hover:text-ink"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-ink py-3 text-sm font-bold text-black hover:bg-ink-muted transition-colors disabled:opacity-50 active:scale-[0.98]"
              >
                {authLoading ? 'Authenticating…' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-ink-subtle">
              {authMode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className="text-ink hover:underline font-semibold"
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
                    className="text-ink hover:underline font-semibold"
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
