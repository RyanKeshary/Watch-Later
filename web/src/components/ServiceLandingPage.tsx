'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import {
  Download,
  Share2,
  Trash2,
  AlertOctagon,
  Play,
  RotateCcw,
  Check,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  Smartphone,
  Eye,
  EyeOff,
  X,
  Folder,
  ArrowRight
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
  // Auth modal state for existing account sign-in
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Magnetic CTA button coordinates
  const [ctaOffset, setCtaOffset] = useState({ x: 0, y: 0 });
  const [isCtaHovered, setIsCtaHovered] = useState(false);

  // 3D Tilt for Hero Phone Demo Card
  const [phoneTilt, setPhoneTilt] = useState({ x: 0, y: 0 });
  const heroCardRef = useRef<HTMLDivElement>(null);

  // Demo Video / Interactive Showcase state
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Reduced motion preference
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Demo timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (demoPlaying) {
      interval = setInterval(() => {
        setDemoStep((prev) => (prev + 1) % 4);
      }, 2600);
    }
    return () => clearInterval(interval);
  }, [demoPlaying]);

  const handleCtaMouseMove = (e: MouseEvent<HTMLAnchorElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setCtaOffset({ x: x * 0.22, y: y * 0.22 });
  };

  const handleCtaMouseLeave = () => {
    setCtaOffset({ x: 0, y: 0 });
    setIsCtaHovered(false);
  };

  const handlePhoneMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setPhoneTilt({ x: -y * 14, y: x * 14 });
  };

  const handlePhoneMouseLeave = () => {
    setPhoneTilt({ x: 0, y: 0 });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      setShowAuthModal(false);
      onSignInSuccess?.();
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const pipelineStages = [
    {
      num: '01',
      title: 'Share the Reel',
      action: 'Native share sheet',
      detail: 'Tap share on Instagram and choose Watch Later. Exactly like sharing a link to a friend, but this time it actually gets handled.',
      badge: 'Zero new habits',
      renderVisual: () => (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-3.5 text-left">
          <div className="flex items-center gap-2 mb-2.5">
            <Share2 className="h-4 w-4 text-white" />
            <span className="font-mono-micro text-[#888888]">Instagram share sheet</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg border border-[#262626] bg-[#161616] p-2">
            <img src="/logo.jpg" alt="Icon" className="h-6 w-6 rounded-md object-cover" />
            <div className="text-[11px] leading-tight">
              <span className="font-semibold text-white block">Watch Later</span>
              <span className="text-[#666666] text-[10px]">One tap · Instant dismiss</span>
            </div>
          </div>
        </div>
      )
    },
    {
      num: '02',
      title: 'Silent Background Capture',
      action: 'No UI interrupts',
      detail: 'The app catches the reel silently in the background. No popup form, no folder picking, no screen interruption.',
      badge: 'Background worker',
      renderVisual: () => (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-3.5 text-left">
          <div className="flex items-center justify-between font-mono-micro mb-2">
            <span className="text-[#888888]">Capture status</span>
            <span className="text-emerald-400 font-semibold">200 captured</span>
          </div>
          <p className="text-xs text-white font-medium">Silent background queue verified</p>
          <div className="mt-2.5 h-1 w-full rounded-full bg-[#1e1e1e] overflow-hidden">
            <div className="h-full w-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      )
    },
    {
      num: '03',
      title: 'Real Substance Extraction',
      action: 'Captions, transcript, creator',
      detail: 'We pull the caption, transcript, and creator details, then automatically sort the reel into focused categories without manual tagging.',
      badge: 'Automatic sorting',
      renderVisual: () => (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-3.5 text-left">
          <span className="font-mono-micro text-[#888888] block mb-1.5">Parsed entity</span>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#1a1a1a] border border-[#333333] text-white">Folder: Systems</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#1a1a1a] border border-[#333333] text-[#aaaaaa]">Transcript synced</span>
          </div>
        </div>
      )
    },
    {
      num: '04',
      title: 'Centralized Clean Library',
      action: 'Pick a niche and watch',
      detail: 'Your dashboard is an organized library ready for browsing, not an overwhelming junk drawer you avoid opening.',
      badge: 'Direct library',
      renderVisual: () => (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-3.5 text-left">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-white font-medium">Library niches</span>
            <span className="font-mono-micro text-[#888888]">4 pillars</span>
          </div>
          <p className="text-[11px] text-[#777777]">Tech · Architecture · Cooking · Mobility</p>
        </div>
      )
    },
    {
      num: '05',
      title: 'Auto-Cleans Watched Posts',
      action: 'Zero stale backlog',
      detail: 'Once you watch a reel, it automatically purges from your active queue. Unused categories retire so dead folders never pile up.',
      badge: 'Auto-retire',
      renderVisual: () => (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] p-3.5 text-left flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-[#999999]" />
            <span className="text-xs text-white">Watched queue cleared</span>
          </div>
          <span className="font-mono-micro text-emerald-400">Zero backlog</span>
        </div>
      )
    }
  ];

  const libraryNiches = [
    { title: 'Engineering & Architecture', count: 18, desc: 'Systems design, database indexes, and concurrency models worth studying.' },
    { title: 'Craft & Kinetic Design', count: 14, desc: 'Concentric radii, physical spring curves, and typography scale rules.' },
    { title: 'Culinary Techniques', count: 9, desc: 'Sourdough starter hydration, dough proofing curves, and wok techniques.' },
    { title: 'Health & Movement', count: 11, desc: 'Desk posture rehab, thoracic mobility, and wrist decompression routines.' }
  ];

  const realFaqs = [
    {
      q: 'Does the app open every time I share a reel?',
      a: 'No. Watch Later registers a silent Android share intent. When you tap share on Instagram, the capture activity intercepts the URL in the background and immediately finishes. You stay right where you were in your feed.'
    },
    {
      q: 'What happens if a reel cannot be extracted or is private?',
      a: 'Watch Later never guesses, fakes, or hallucinates categories or summaries for unreachable media. If a reel is deleted, private, or blocked, it lands in a clearly labeled Failed folder so you always know its real status.'
    },
    {
      q: 'How is this different from Instagram’s own Saved folder?',
      a: 'Instagram Saved is a chronological junk drawer where saves go to die. Watch Later extracts the actual substance — transcripts, captions, key ideas — categorizes it automatically, provides search across what was spoken, and auto-purges reels once you’ve watched them so you never drown in backlog.'
    },
    {
      q: 'Is iOS supported?',
      a: 'Watch Later is built Android-first with native background share sheet capture. The web dashboard works across all modern mobile and desktop browsers. An iOS native share extension using the same backend infrastructure is on the roadmap.'
    },
    {
      q: 'Does Watch Later keep dead categories forever?',
      a: 'No. When completed reels are watched and cleaned up, categories that no longer contain active reels get retired automatically. Your dashboard stays current with what you care about now, not dead folders from six months ago.'
    }
  ];

  return (
    <div className="relative min-h-screen bg-fabric text-[#d9d9d9] font-sans antialiased selection:bg-[#333333] selection:text-white">
      {/* SplashCursor ambient fluid in dark ink mode with #9b9b9b tone */}
      <SplashCursor
        colors={['#ffffff', '#9b9b9b', '#d9d9d9']}
        rainbow={false}
        size={0.65}
        force={0.3}
        swirl={13.5}
        trail={2.8}
        clickSplash
        colorSpeed={0.45}
        intensity={0.38}
        momentum={0.7}
        glow={0.25}
        shading={0.8}
        quality="low"
        intro={false}
        zIndex={0}
      />

      {/* 2.1 Nav */}
      <header className="sticky top-0 z-40 w-full border-b border-[#222222] bg-[#0b0b0b]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Watch Later" className="h-8 w-8 rounded-lg object-cover border border-[#2a2a2a]" />
            <div>
              <span className="font-zolo text-base font-bold tracking-tight text-white block leading-none">Watch Later</span>
              <span className="font-mono-micro text-[#666666] block mt-0.5">Share, don&apos;t save</span>
            </div>
          </div>

          <nav className="flex items-center gap-4 sm:gap-6">
            <a href="#how-it-works" className="hidden sm:inline-block text-xs font-mono text-[#888888] hover:text-white transition">
              How it works
            </a>
            <a href="#faq" className="hidden sm:inline-block text-xs font-mono text-[#888888] hover:text-white transition">
              FAQ
            </a>
            {hasSession ? (
              <button
                onClick={onEnterDashboard}
                className="flex items-center gap-1.5 rounded-lg border border-[#333333] bg-[#141414] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#202020] active:scale-[0.98]"
              >
                <span>Open Library</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-[#333333] bg-[#141414] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#202020] active:scale-[0.98]"
              >
                <span>Sign in</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* 2.2 Hero: Exactly ONE Primary CTA Button (Install APK) */}
        <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-24 border-b border-[#222222]">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Tagline treated as headline */}
            <h1 className="font-zolo text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.06] text-balance">
              Never lose a reel worth revisiting.
            </h1>

            {/* One supporting line explaining the real mechanism */}
            <p className="mt-6 text-base sm:text-lg text-[#999999] max-w-2xl mx-auto leading-relaxed">
              Share reels from Instagram straight to Watch Later. They are captured silently in the background, categorized into a clean library, and auto-cleaned once watched.
            </p>

            {/* Exactly ONE Hero CTA Button: Download Android APK */}
            <div className="mt-8 flex flex-col items-center justify-center">
              <a
                href="/watch-later.apk"
                download="watch-later.apk"
                onMouseMove={handleCtaMouseMove}
                onMouseEnter={() => setIsCtaHovered(true)}
                onMouseLeave={handleCtaMouseLeave}
                style={reducedMotion ? undefined : {
                  transform: `translate3d(${ctaOffset.x}px, ${ctaOffset.y}px, 0)`,
                  transition: isCtaHovered ? 'transform 0.08s ease-out' : 'transform 0.3s ease-out'
                }}
                className="group relative inline-flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-base font-bold text-black transition-colors hover:bg-[#ececec] active:scale-[0.98] shadow-[0_0_35px_rgba(255,255,255,0.18)]"
              >
                <Download className="h-5 w-5 text-black transition-transform duration-200 group-hover:-translate-y-0.5" />
                <span>Download Android App (APK)</span>
              </a>
              <span className="mt-3 text-[11px] font-mono text-[#666666]">
                Direct APK download · Silent share-sheet capture · Free
              </span>
            </div>

            {/* SECTION 1.2: EXACTLY ONE VIDEO ON THE ENTIRE PAGE (THE BRAG DEMO MOMENT) */}
            <div className="mt-14 max-w-2xl mx-auto">
              <div
                ref={heroCardRef}
                onMouseMove={handlePhoneMouseMove}
                onMouseLeave={handlePhoneMouseLeave}
                style={reducedMotion ? undefined : {
                  transform: `perspective(1000px) rotateX(${phoneTilt.x}deg) rotateY(${phoneTilt.y}deg)`,
                  transition: 'transform 0.15s ease-out'
                }}
                className="relative rounded-2xl border border-[#2b2b2b] bg-[#121212] p-2 shadow-2xl"
              >
                <div className="relative aspect-video w-full rounded-xl bg-[#090909] border border-[#202020] flex flex-col justify-between overflow-hidden">
                  {!demoPlaying ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#141414] to-[#090909]">
                      <button
                        type="button"
                        onClick={() => setDemoPlaying(true)}
                        aria-label="Play interactive demo of silent capture"
                        className="h-16 w-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 transition transform hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
                      >
                        <Play className="h-7 w-7 text-white fill-white ml-1" />
                      </button>
                      <span className="font-mono-micro text-[#888888] block mb-1">Product demo</span>
                      <h3 className="font-zolo text-lg font-bold text-white mb-1">Watch the 10-Second Mechanism</h3>
                      <p className="text-xs text-[#888888] max-w-md">
                        Tap play to see how sharing directly from Instagram organizes your reels without clutter.
                      </p>
                    </div>
                  ) : (
                    <div className="w-full h-full p-5 sm:p-6 flex flex-col justify-between bg-black/95 text-left">
                      <div className="flex items-center justify-between border-b border-[#222222] pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="font-mono-micro text-white">Live demo walkthrough</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDemoPlaying(false);
                            setDemoStep(0);
                          }}
                          className="flex items-center gap-1 text-[11px] font-mono text-[#888888] hover:text-white transition"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Reset</span>
                        </button>
                      </div>

                      <div className="my-auto py-2">
                        {demoStep === 0 && (
                          <div className="animate-fade-up">
                            <span className="font-mono-micro text-[#888888] block mb-1">01 / Share sheet</span>
                            <h4 className="font-zolo text-xl font-bold text-white mb-1.5">You tap &quot;Share to Watch Later&quot;</h4>
                            <p className="text-xs text-[#888888]">No popup forms or dialogs appear. You stay in your Instagram feed.</p>
                          </div>
                        )}
                        {demoStep === 1 && (
                          <div className="animate-fade-up">
                            <span className="font-mono-micro text-[#888888] block mb-1">02 / Background capture</span>
                            <h4 className="font-zolo text-xl font-bold text-white mb-1.5">Silent metadata &amp; transcript parse</h4>
                            <p className="text-xs text-[#888888]">Extracts creator handle, source caption, and spoken audio in the background.</p>
                          </div>
                        )}
                        {demoStep === 2 && (
                          <div className="animate-fade-up">
                            <span className="font-mono-micro text-[#888888] block mb-1">03 / Automatic sorting</span>
                            <h4 className="font-zolo text-xl font-bold text-white mb-1.5">Categorized into &quot;Systems Design&quot;</h4>
                            <p className="text-xs text-[#888888]">No manual tagging required. Similar topics cluster together cleanly.</p>
                          </div>
                        )}
                        {demoStep === 3 && (
                          <div className="animate-fade-up">
                            <span className="font-mono-micro text-[#888888] block mb-1">04 / Auto-cleanup</span>
                            <h4 className="font-zolo text-xl font-bold text-white mb-1.5">Watched reel cleared from queue</h4>
                            <p className="text-xs text-[#888888]">Completed items auto-purge so an overwhelming backlog never accumulates.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#222222]">
                        {[0, 1, 2, 3].map((step) => (
                          <button
                            key={step}
                            type="button"
                            onClick={() => setDemoStep(step)}
                            aria-label={`Demo step ${step + 1} of 4`}
                            aria-current={demoStep === step ? 'step' : undefined}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${demoStep === step ? 'bg-white' : 'bg-[#2b2b2b]'}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2.3 The Problem: Brief, Honest, Human */}
        <section className="py-20 border-b border-[#222222] bg-[#0c0c0c]/60">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="font-mono-micro text-[#777777] block mb-2">The problem</span>
            <h2 className="font-zolo text-2xl sm:text-4xl font-bold text-white tracking-tight">
              You save reels to watch later. You never watch them.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#999999] leading-relaxed max-w-2xl mx-auto">
              Saves get scattered across Instagram&apos;s own Saved folder, random DM threads to yourself, screenshots, and notes apps. Nothing is organized, nothing gets revisited, and eventually it&apos;s just clutter you avoid opening.
            </p>
          </div>
        </section>

        {/* 2.4 How It Works: Real Mechanism in Order with Horizontal Scroll Strip */}
        <section id="how-it-works" className="py-20 border-b border-[#222222]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="font-mono-micro text-[#777777] block mb-1">How it works</span>
              <h2 className="font-zolo text-2xl sm:text-4xl font-bold text-white tracking-tight">
                The 5-Step Pipeline
              </h2>
            </div>
            <span className="font-mono-micro text-[#777777]">Swipe horizontally →</span>
          </div>

          {/* Mandatory Horizontal Scroll Strip */}
          <div
            role="region"
            tabIndex={0}
            aria-label="How Watch Later works pipeline sequence"
            className="flex gap-5 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-6 pt-2 no-scrollbar scroll-smooth snap-x focus:outline-none focus:ring-1 focus:ring-[#444444]"
          >
            {pipelineStages.map((stage) => (
              <div
                key={stage.num}
                className="snap-center min-w-[280px] sm:min-w-[320px] max-w-[340px] shrink-0 rounded-2xl border border-[#262626] bg-[#121212] p-5 flex flex-col justify-between hover:border-[#444444] transition-colors shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-zolo text-xl font-bold text-white">{stage.num}</span>
                    <span className="font-mono-micro text-[#aaaaaa] bg-[#1c1c1c] px-2 py-0.5 rounded border border-[#2b2b2b]">
                      {stage.badge}
                    </span>
                  </div>
                  <h3 className="font-zolo text-base font-bold text-white mb-1">{stage.title}</h3>
                  <span className="font-mono-micro text-[#888888] block mb-3">{stage.action}</span>
                  <p className="text-xs text-[#999999] leading-relaxed mb-6">{stage.detail}</p>
                </div>

                {stage.renderVisual()}
              </div>
            ))}
          </div>

          {/* Explicit Trust Signal: Never Hallucinates a Category */}
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 mt-12">
            <div className="rounded-2xl border border-[#2b2b2b] bg-[#121212] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center justify-center shrink-0">
                <AlertOctagon className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white mb-1">
                  Honest Failed Folder — Never Fake Summaries
                </h4>
                <p className="text-xs text-[#888888] leading-relaxed">
                  If extraction genuinely fails because a reel was deleted, set to private, or blocked, Watch Later <span className="text-white font-medium">never guesses or hallucinates a category or summary</span>. It lands in a clearly labeled Failed folder so you always see what happened honestly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2.5 The Dashboard / What You Get */}
        <section className="py-20 border-b border-[#222222] bg-[#0c0c0c]/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-3">
              <div>
                <span className="font-mono-micro text-[#777777] block mb-1">The dashboard</span>
                <h2 className="font-zolo text-2xl sm:text-4xl font-bold text-white tracking-tight">
                  A Library, Not a Dump
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#888888] max-w-md">
                Pick a niche, extract knowledge, and actually digest what you saved.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {libraryNiches.map((niche, idx) => (
                <div key={idx} className="rounded-2xl border border-[#262626] bg-[#121212] p-5 transition hover:border-[#3a3a3a]">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="font-zolo text-base font-bold text-white">{niche.title}</h3>
                    <span className="font-mono-micro text-[#888888] px-2 py-0.5 rounded bg-[#1a1a1a] border border-[#262626]">
                      {niche.count} posts
                    </span>
                  </div>
                  <p className="text-xs text-[#888888] leading-relaxed">{niche.desc}</p>
                </div>
              ))}
            </div>

            {/* Subtle interest insights mention */}
            <div className="mt-6 rounded-2xl border border-[#262626] bg-[#121212] p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <p className="text-xs font-semibold text-white">Lightweight interest insights</p>
                <p className="text-[11px] text-[#777777]">Over time, your library surfaces subtle reflections of what you genuinely gravitate toward.</p>
              </div>
              <span className="font-mono-micro text-[#666666] shrink-0">Derived automatically</span>
            </div>
          </div>
        </section>

        {/* 2.6 Proof & Credibility: Honest Targets (No Fabricated Stats) */}
        <section className="py-20 border-b border-[#222222]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="font-mono-micro text-[#777777] block mb-1">Architecture</span>
              <h2 className="font-zolo text-2xl sm:text-4xl font-bold text-white tracking-tight">
                Engineering Targets, Not Fake Stats
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 text-center">
                <span className="font-mono-micro text-[#888888] block mb-2">Target capture time</span>
                <div className="font-zolo text-3xl font-bold text-white mb-2">~3-4s</div>
                <p className="text-xs text-[#888888]">Typical round-trip target from phone share sheet to parsed cloud library entry.</p>
              </div>

              <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 text-center">
                <span className="font-mono-micro text-[#888888] block mb-2">Data security</span>
                <div className="font-zolo text-3xl font-bold text-white mb-2">Row-Level</div>
                <p className="text-xs text-[#888888]">PostgreSQL RLS ensures every saved reel and category is isolated strictly to you.</p>
              </div>

              <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 text-center">
                <span className="font-mono-micro text-[#888888] block mb-2">Queue maintenance</span>
                <div className="font-zolo text-3xl font-bold text-white mb-2">Auto-Clean</div>
                <p className="text-xs text-[#888888]">Watched posts auto-purge so an overwhelming backlog never piles up.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2.7 FAQ Grounded in Actual Mechanics */}
        <section id="faq" className="py-20 border-b border-[#222222] bg-[#0c0c0c]/60">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="font-mono-micro text-[#777777] block mb-1">FAQ</span>
              <h2 className="font-zolo text-2xl sm:text-4xl font-bold text-white tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {realFaqs.map((faq, idx) => (
                <div key={idx} className="rounded-2xl border border-[#262626] bg-[#121212] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-white transition hover:text-[#cccccc]"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-[#777777] transition-transform ${openFaq === idx ? 'rotate-180 text-white' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 pt-1 text-xs text-[#888888] leading-relaxed border-t border-[#1e1e1e]">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2.8 Final CTA: Exact Same Install Action Echoing Tagline */}
        <section className="py-24 text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-zolo text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4 text-balance">
              Never lose a reel worth revisiting.
            </h2>
            <p className="text-sm sm:text-base text-[#888888] max-w-xl mx-auto mb-8 leading-relaxed">
              Replace scattered DMs to yourself with a single action: share it once, and actually watch it later.
            </p>
            <div className="flex flex-col items-center justify-center">
              <a
                href="/watch-later.apk"
                download="watch-later.apk"
                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-base font-bold text-black transition hover:bg-[#ececec] active:scale-[0.98] shadow-2xl"
              >
                <Download className="h-5 w-5 text-black transition-transform duration-200 group-hover:-translate-y-0.5" />
                <span>Download Android App (APK)</span>
              </a>
              <span className="mt-3 text-[11px] font-mono text-[#666666]">
                Android APK · Free · Instant background capture
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* 2.9 Minimal Footer */}
      <footer className="border-t border-[#222222] py-8 text-center text-xs text-[#666666]">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Logo" className="h-5 w-5 rounded object-cover" />
            <span className="font-zolo font-semibold text-white">Watch Later</span>
            <span>— Never lose a reel worth revisiting.</span>
          </div>
          <span className="font-mono-micro">Silent share-sheet capture</span>
        </div>
      </footer>

      {/* Sign-in Modal for returning users */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-up"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#2b2b2b] bg-[#141414] p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <img src="/logo.jpg" alt="Logo" className="h-7 w-7 rounded-lg object-cover" />
                <span className="font-zolo text-lg font-bold text-white">Watch Later</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-[#666666] hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="font-zolo text-lg font-bold text-white mb-1">
              {authMode === 'signin' ? 'Sign in to your library' : 'Create an account'}
            </h3>
            <p className="text-xs text-[#888888] mb-5">
              Enter your credentials to access your synced library.
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#888888]">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1 w-full rounded-lg border border-[#2b2b2b] bg-[#0c0c0c] px-3 py-2 text-sm text-white placeholder-[#555555] focus:border-[#777777] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#888888]">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#2b2b2b] bg-[#0c0c0c] px-3 py-2 pr-10 text-sm text-white placeholder-[#555555] focus:border-[#777777] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#666666] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="rounded-lg bg-red-950/40 p-3 text-xs text-red-400 border border-red-800/40">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-lg bg-white text-black py-2.5 text-sm font-semibold transition hover:bg-[#eaeaea] active:scale-[0.98] disabled:opacity-50"
              >
                {authLoading ? 'Authenticating...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                  setAuthError(null);
                }}
                className="text-xs text-[#888888] hover:text-white transition"
              >
                {authMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
