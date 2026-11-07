'use client';

import { useState, useEffect, useRef, MouseEvent } from 'react';
import {
  Download,
  Share2,
  Trash2,
  Play,
  RotateCcw,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Smartphone,
  Eye,
  EyeOff,
  X,
  Compass,
  CheckCircle2,
  Layers,
  Terminal,
  Cpu,
  BookmarkX,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Flame,
  Search,
  Filter,
  Check,
  Zap,
  ShieldCheck,
  WifiOff,
  Database
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
  // Auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // 3D Spatial Mouse Perspective for Hero Card and Canvas
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [heroCardTilt, setHeroCardTilt] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  // Horizontal Scroll Carousel Refs & Controls
  const carousel1Ref = useRef<HTMLDivElement>(null);
  const carousel2Ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft1, setCanScrollLeft1] = useState(false);
  const [canScrollRight1, setCanScrollRight1] = useState(true);
  const [canScrollLeft2, setCanScrollLeft2] = useState(false);
  const [canScrollRight2, setCanScrollRight2] = useState(true);

  // Interactive 3D Reel Simulation Stage
  const [activeNiche, setActiveNiche] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(14);
  const [liveReels, setLiveReels] = useState([
    {
      id: 'r1',
      creator: '@alex_creates',
      category: 'Design Engineering',
      sub: 'Concentric Radii in CSS',
      takeaway: 'Formula: R_inner = R_outer - padding. Eliminates harsh nested visual friction.',
      time: '34s ago',
      watched: false,
      tagColor: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/20'
    },
    {
      id: 'r2',
      creator: '@cheftony',
      category: 'Culinary Craft',
      sub: 'Pan-Roasting Emulsions',
      takeaway: 'Cold butter mount at 60°C prevents fat breakage in high acid pan reductions.',
      time: '2m ago',
      watched: false,
      tagColor: 'border-amber-500/30 text-amber-400 bg-amber-950/20'
    },
    {
      id: 'r3',
      creator: '@ai_accelerator',
      category: 'Machine Intelligence',
      sub: 'KV Cache Compression',
      takeaway: 'Rotary embeddings with 4-bit grouped-query attention drop context VRAM by 62%.',
      time: '8m ago',
      watched: false,
      tagColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20'
    },
    {
      id: 'r4',
      creator: '@cinema_rigs',
      category: 'Film & Lighting',
      sub: 'Anamorphic Flare Control',
      takeaway: 'Tiffen Black Pro-Mist 1/8 paired with 50mm vintage glass rolls off digital harshness.',
      time: '19m ago',
      watched: false,
      tagColor: 'border-purple-500/30 text-purple-400 bg-purple-950/20'
    }
  ]);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Detect Reduced Motion
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Global Mouse tracking for 3D Perspective Plane
  useEffect(() => {
    if (reducedMotion) return;
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x: normX, y: normY });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [reducedMotion]);

  // Card Tilt Handler
  const handleCardMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setHeroCardTilt({ x, y });
  };

  const handleCardMouseLeave = () => {
    setHeroCardTilt({ x: 0, y: 0 });
  };

  // Carousel scroll listeners
  const checkScrollState = (ref: React.RefObject<HTMLDivElement>, setLeft: (b: boolean) => void, setRight: (b: boolean) => void) => {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    setLeft(scrollLeft > 10);
    setRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollContainer = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (!ref.current) return;
    const amount = direction === 'left' ? -360 : 360;
    ref.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Trigger simulate capture
  const triggerSimulatedCapture = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setTimeout(() => {
      const newReel = {
        id: 'r' + Date.now(),
        creator: '@motion_craft',
        category: 'Motion Dynamics',
        sub: 'Spring Curve Physics',
        takeaway: 'Zero-bounce critically damped springs prevent visual overshoot in interactive cards.',
        time: 'Just now',
        watched: false,
        tagColor: 'border-pink-500/30 text-pink-400 bg-pink-950/20'
      };
      setLiveReels((prev) => [newReel, ...prev]);
      setCapturedCount((c) => c + 1);
      setIsCapturing(false);
    }, 700);
  };

  // Mark watched & auto-prune
  const markWatched = (id: string) => {
    setLiveReels((prev) => prev.filter((r) => r.id !== id));
  };

  // Auth Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setShowAuthModal(false);
        onSignInSuccess?.();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setShowAuthModal(false);
        onSignInSuccess?.();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Horizontal Scroll Track 1: The 4-Step Autonomous Machine
  const pipelineSteps = [
    {
      num: '01',
      title: 'Silent Intent Interception',
      desc: 'You tap Share on Instagram. Select Watch Later. No screen opens, no popups disrupt your scroll. ShareCaptureActivity captures the URL in 20ms flat.',
      meta: 'ANDROID INTENT // 20ms',
      badge: 'ZERO FRICTION',
      color: 'from-blue-500/20 to-transparent'
    },
    {
      num: '02',
      title: 'Offline-First Room Queue',
      desc: 'Stuck on a subway? The URL is immediately written to encrypted local SQLite. ReelSyncWorker waits for network callback before batching uploads.',
      meta: 'ROOM DB // WORKMANAGER',
      badge: 'OFFLINE RESILIENT',
      color: 'from-emerald-500/20 to-transparent'
    },
    {
      num: '03',
      title: 'Groq AI Knowledge Extraction',
      desc: 'The Cloudflare edge worker unpacks the Reel, parses audio transcripts, OCRs on-screen diagrams, and structures findings with Llama-3 in 400ms.',
      meta: 'GROQ LLAMA-3 // PARSER',
      badge: 'AUTO-CATEGORIZE',
      color: 'from-amber-500/20 to-transparent'
    },
    {
      num: '04',
      title: 'Autonomous Shelf Cleanup',
      desc: 'Unlike dead bookmark dumps, items you watch auto-retire immediately. Unused niches and empty collections fade away without manual sorting.',
      meta: 'CLEAN QUEUE // ZERO STALE',
      badge: 'SELF-PRUNING',
      color: 'from-purple-500/20 to-transparent'
    }
  ];

  // Horizontal Scroll Track 2: The Living Knowledge Shelves
  const nicheShelves = [
    {
      title: 'Frontend Architecture',
      count: '38 Reels',
      subcategories: ['React Server Components', 'Shader Pipelines', 'Concentric Radii', 'Spring Physics'],
      sampleTakeaway: 'CSS container queries eliminate window resize listener bottlenecks.',
      accent: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/15'
    },
    {
      title: 'Machine Intelligence',
      count: '24 Reels',
      subcategories: ['Local GGUF Models', 'LoRA Fine-tuning', 'Agent Tool Calling', 'Whisper Transcripts'],
      sampleTakeaway: 'Grouped-query attention reduces KV-cache memory pressure by 75%.',
      accent: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/15'
    },
    {
      title: 'Culinary Craft',
      count: '19 Reels',
      subcategories: ['Sourdough Hydration', 'Pan Emulsions', 'Wok Hei Dynamics', 'Dry Brining'],
      sampleTakeaway: 'Cold butter mount at 60°C creates stable glossy glaze without splitting.',
      accent: 'border-amber-500/40 text-amber-400 bg-amber-950/15'
    },
    {
      title: 'Cinema & Studio Rigs',
      count: '15 Reels',
      subcategories: ['Anamorphic Ratios', 'Hazer Atmospheric Diffusion', 'Three-Point Ratios', 'Color Grading'],
      sampleTakeaway: '1/8 Black Pro-Mist rolls off digital sensor clipping organically.',
      accent: 'border-purple-500/40 text-purple-400 bg-purple-950/15'
    },
    {
      title: 'Physical Conditioning',
      count: '29 Reels',
      subcategories: ['Posterior Chain Loading', 'Eccentric Overload', 'Hip Hinge Mobility', 'Grip Endurance'],
      sampleTakeaway: 'Paused Romanian Deadlifts target hamstring fascial stretch under load.',
      accent: 'border-rose-500/40 text-rose-400 bg-rose-950/15'
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#07080a] text-[#f4f4f6] font-sans antialiased overflow-x-hidden selection:bg-white/20 selection:text-white">
      {/* 1. Fluid WebGL Cursor Simulation (Preserved with Hardware Clamp & Reduced-Motion Safety) */}
      <SplashCursor
        colors={['#ffffff', '#808080', '#c0c0c0']}
        rainbow={false}
        intensity={0.4}
        size={0.65}
        force={0.4}
        swirl={4.5}
        trail={1.8}
        momentum={0.6}
        shading={1}
        glow={0.12}
        quality="medium"
        intro={false}
        theme="dark"
        zIndex={0}
      />

      {/* Subtle Background Radial Gradient Spotlight */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-40 transition-transform duration-700 ease-out"
        style={{
          background: `radial-gradient(1000px circle at ${50 + mousePos.x * 15}% ${40 + mousePos.y * 15}%, rgba(255, 255, 255, 0.04), transparent 60%)`
        }}
      />

      {/* Micro-dot Grid Layer */}
      <div className="pointer-events-none fixed inset-0 z-[1] opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Content Stacking Context Layer (z-10 above canvas) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#07080a]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 transition-all">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-[10px] overflow-hidden border border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                <img src="/logo.jpg" alt="Watch Later" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-zolo text-lg font-black tracking-tight text-white leading-none">
                  Watch Later
                </span>
                <span className="font-mono text-[9px] tracking-widest text-[#71717a] uppercase mt-0.5">
                  Knowledge Vault
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <a
                href="/watch-later.apk"
                download="watch-later.apk"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-xs font-mono text-[#a1a1aa] hover:text-white hover:border-white/30 transition-all active:scale-[0.98]"
              >
                <Download className="h-3 w-3" />
                <span>v1.0 APK</span>
              </a>

              {hasSession ? (
                <button
                  type="button"
                  onClick={onEnterDashboard}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-[#e8e8e8] transition-all shadow-[0_4px_14px_rgba(255,255,255,0.15)] active:scale-[0.98]"
                >
                  <span>Open Library</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-[#e8e8e8] transition-all shadow-[0_4px_14px_rgba(255,255,255,0.15)] active:scale-[0.98]"
                >
                  <span>Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* =========================================================================
            SECTION 1: 3D SPATIAL HERO WITH INTERACTIVE DEVICE TILT
           ========================================================================= */}
        <section className="relative pt-16 sm:pt-28 pb-20 px-4 sm:px-8 overflow-hidden">
          <div className="mx-auto max-w-6xl flex flex-col items-center text-center">
            {/* Micro Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur text-[11px] font-mono text-[#a1a1aa] mb-6 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-white font-medium">AUTONOMOUS REEL ORGANIZER</span>
              <span className="text-[#52525b]">•</span>
              <span>ANDROID + CLOUDFLARE + GROQ</span>
            </div>

            {/* Kinetic Display Headline */}
            <h1 className="font-zolo text-4xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[0.92] text-balance max-w-4xl mb-6">
              Saved reels shouldn’t go to die.
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-xl text-[#a1a1aa] max-w-2xl font-normal leading-relaxed text-balance mb-10">
              One tap in your Instagram share sheet. Captured in 20ms, transcribed, and structured by AI into clean personal knowledge pillars.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 mb-16">
              <a
                href="/watch-later.apk"
                download="watch-later.apk"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-[#e8e8e8] transition-all shadow-[0_10px_25px_rgba(255,255,255,0.2)] active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                <span>Download Android APK</span>
                <span className="text-[11px] font-mono text-zinc-500 font-normal">v1.0 (17MB)</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-white/15 bg-white/[0.04] text-white font-medium text-sm hover:border-white/35 hover:bg-white/[0.08] transition-all backdrop-blur active:scale-[0.98]"
              >
                <span>Launch Web Workspace</span>
                <ArrowUpRight className="h-4 w-4 text-[#71717a]" />
              </button>
            </div>

            {/* 3D TILT PRODUCT CARD (Spatial Depth on Mouse Hover) */}
            <div
              className="relative w-full max-w-4xl perspective-[1200px]"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div
                className="relative rounded-[28px] border border-white/15 bg-[#0e0e11]/90 p-3 sm:p-5 shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-transform duration-200 ease-out will-change-transform"
                style={{
                  transform: reducedMotion
                    ? 'none'
                    : `rotateX(${-heroCardTilt.y * 7}deg) rotateY(${heroCardTilt.x * 7}deg) translateZ(10px)`
                }}
              >
                {/* Concentric Inner Bezel (Outer 28px - Padding 16px = Inner 12px) */}
                <div className="relative rounded-[20px] border border-white/10 bg-[#09090b] overflow-hidden p-4 sm:p-6 text-left">
                  {/* Top Mock Window Bar */}
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#27272a]" />
                      <div className="h-3 w-3 rounded-full bg-[#27272a]" />
                      <div className="h-3 w-3 rounded-full bg-[#27272a]" />
                      <span className="font-mono text-xs text-[#71717a] ml-2">
                        watch-later://vault/live-pipeline
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={triggerSimulatedCapture}
                        disabled={isCapturing}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-white/[0.06] text-xs font-mono text-white hover:bg-white/[0.12] transition-all active:scale-[0.98]"
                      >
                        <Share2 className={`h-3 w-3 ${isCapturing ? 'animate-spin' : ''}`} />
                        <span>{isCapturing ? 'Ingesting Reel...' : 'Simulate Share Tap'}</span>
                      </button>
                      <span className="font-mono text-xs text-[#a1a1aa] bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/5 tabular-nums">
                        {capturedCount} Ingested
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Stream of Processed Reels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {liveReels.slice(0, 4).map((reel) => (
                      <div
                        key={reel.id}
                        className="group/item relative rounded-[14px] border border-white/10 bg-[#121215] p-3.5 transition-all duration-200 hover:border-white/25 hover:bg-[#16161a]"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${reel.tagColor}`}>
                              {reel.category}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-[#71717a]">{reel.time}</span>
                        </div>

                        <h3 className="font-zolo text-sm font-bold text-white mb-1 group-hover/item:text-cyan-400 transition-colors">
                          {reel.sub}
                        </h3>

                        <p className="text-xs text-[#a1a1aa] line-clamp-2 leading-relaxed mb-3">
                          {reel.takeaway}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] font-mono text-[11px]">
                          <span className="text-[#71717a]">{reel.creator}</span>
                          <button
                            type="button"
                            onClick={() => markWatched(reel.id)}
                            className="inline-flex items-center gap-1 text-[#71717a] hover:text-emerald-400 transition-colors active:scale-[0.98]"
                          >
                            <Check className="h-3 w-3" />
                            <span>Mark Watched</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: MANDATORY HORIZONTAL SCROLL SECTION #1 (THE 4-STEP PIPELINE)
           ========================================================================= */}
        <section className="relative py-20 px-4 sm:px-8 border-y border-white/[0.08] bg-[#090a0d]/60">
          <div className="mx-auto max-w-7xl">
            {/* Header + Nav Arrows */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="font-mono text-xs tracking-widest text-[#71717a] uppercase block mb-1">
                  HORIZONTAL JOURNEY // STEP 01 TO 04
                </span>
                <h2 className="font-zolo text-3xl sm:text-5xl font-black tracking-tight text-white text-balance">
                  How the silent mechanism operates.
                </h2>
              </div>

              {/* Arrow Nav Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollContainer(carousel1Ref, 'left')}
                  disabled={!canScrollLeft1}
                  className="p-2.5 rounded-full border border-white/10 bg-white/[0.04] text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollContainer(carousel1Ref, 'right')}
                  disabled={!canScrollRight1}
                  className="p-2.5 rounded-full border border-white/10 bg-white/[0.04] text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Horizontal Drag/Scroll Strip */}
            <div
              ref={carousel1Ref}
              onScroll={() => checkScrollState(carousel1Ref, setCanScrollLeft1, setCanScrollRight1)}
              className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {pipelineSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="w-[300px] sm:w-[360px] shrink-0 snap-start rounded-[24px] border border-white/15 bg-[#0f1013] p-6 flex flex-col justify-between transition-all duration-300 hover:border-white/35 hover:bg-[#131418] group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <span className="font-mono text-3xl font-black text-white/30 group-hover:text-white transition-colors">
                        {step.num}
                      </span>
                      <span className="font-mono text-[10px] tracking-wider px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-[#a1a1aa]">
                        {step.badge}
                      </span>
                    </div>

                    <h3 className="font-zolo text-xl font-bold text-white mb-3 text-balance leading-snug">
                      {step.title}
                    </h3>

                    <p className="text-sm text-[#a1a1aa] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/[0.08] mt-8 flex items-center justify-between font-mono text-[11px] text-[#71717a]">
                    <span>{step.meta}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#52525b] group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: EMBEDDED H.264 NATIVE LAUNCH VIDEO SHOWCASE
           ========================================================================= */}
        <section className="relative py-24 px-4 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <span className="font-mono text-xs tracking-widest text-[#71717a] block mb-2">
                  OFFICIAL LAUNCH FILM // 18s 1080P
                </span>
                <h2 className="font-zolo text-3xl sm:text-5xl font-black tracking-tight text-white text-balance">
                  See the mechanism in action.
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#a1a1aa] max-w-sm text-balance">
                Watch how a single tap replaces cluttered bookmark folders forever. Transcribed, categorized, auto-purged.
              </p>
            </div>

            {/* Native H.264 MP4 Player Stage */}
            <div className="relative rounded-[28px] border border-white/15 bg-[#0e0e11] p-3.5 sm:p-4 shadow-2xl overflow-hidden group transition-all duration-300 hover:border-white/30">
              <div className="relative aspect-video w-full rounded-[20px] bg-black border border-white/10 overflow-hidden shadow-inner">
                <video
                  src="/watch-later-launch.mp4"
                  poster="/watch-later-poster.jpg"
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Video metadata strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 px-2 font-mono text-xs text-[#71717a]">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white font-medium">watch-later-launch.mp4</span>
                  <span className="text-[#52525b]">•</span>
                  <span className="text-[#a1a1aa]">1080p 30fps H.264</span>
                  <span className="text-[#52525b]">•</span>
                  <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-[#d4d4d8] tabular-nums">
                    00:18 STEREO
                  </span>
                </div>
                <a
                  href="/watch-later-launch.mp4"
                  download="watch-later-launch.mp4"
                  className="inline-flex items-center gap-1.5 text-white hover:text-emerald-400 font-semibold transition-colors duration-200 active:scale-[0.98]"
                >
                  <span>Download MP4 Video</span>
                  <Download className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: MANDATORY HORIZONTAL SCROLL SECTION #2 (THE LIVING NICHE SHELVES)
           ========================================================================= */}
        <section className="relative py-20 px-4 sm:px-8 border-t border-white/[0.08] bg-[#090a0d]/60">
          <div className="mx-auto max-w-7xl">
            {/* Header + Nav Arrows */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="font-mono text-xs tracking-widest text-[#71717a] uppercase block mb-1">
                  HORIZONTAL EXPLORATION // KNOWLEDGE NICHES
                </span>
                <h2 className="font-zolo text-3xl sm:text-5xl font-black tracking-tight text-white text-balance">
                  Your library, auto-indexed by topic.
                </h2>
              </div>

              {/* Arrow Nav Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollContainer(carousel2Ref, 'left')}
                  disabled={!canScrollLeft2}
                  className="p-2.5 rounded-full border border-white/10 bg-white/[0.04] text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollContainer(carousel2Ref, 'right')}
                  disabled={!canScrollRight2}
                  className="p-2.5 rounded-full border border-white/10 bg-white/[0.04] text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Horizontal Drag/Scroll Strip */}
            <div
              ref={carousel2Ref}
              onScroll={() => checkScrollState(carousel2Ref, setCanScrollLeft2, setCanScrollRight2)}
              className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {nicheShelves.map((shelf, idx) => (
                <div
                  key={idx}
                  className="w-[300px] sm:w-[350px] shrink-0 snap-start rounded-[24px] border border-white/15 bg-[#0f1013] p-6 flex flex-col justify-between transition-all duration-300 hover:border-white/35 hover:bg-[#131418] group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-zolo text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {shelf.title}
                      </span>
                      <span className="font-mono text-xs text-[#a1a1aa] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full tabular-nums">
                        {shelf.count}
                      </span>
                    </div>

                    {/* Subcategories tags */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {shelf.subcategories.map((sub, sidx) => (
                        <span
                          key={sidx}
                          className="font-mono text-[10px] text-[#a1a1aa] bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded-md"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-[#a1a1aa] leading-relaxed italic border-l-2 border-white/20 pl-3">
                      &ldquo;{shelf.sampleTakeaway}&rdquo;
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/[0.08] mt-6 flex items-center justify-between font-mono text-[11px] text-[#71717a]">
                    <span>Extracted via Llama-3</span>
                    <Compass className="h-3.5 w-3.5 text-[#52525b] group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: SPECIFICATIONS & ENGINEERING HIGHLIGHTS (BENTO GRID)
           ========================================================================= */}
        <section className="relative py-24 px-4 sm:px-8 border-t border-white/[0.08]">
          <div className="mx-auto max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="font-mono text-xs tracking-widest text-[#71717a] uppercase block mb-2">
                SYSTEM INTEGRITY // TECHNICAL HIGHLIGHTS
              </span>
              <h2 className="font-zolo text-3xl sm:text-5xl font-black tracking-tight text-white text-balance">
                Built for speed, privacy, and zero friction.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1 */}
              <div className="rounded-[22px] border border-white/15 bg-[#0e0f13] p-6 transition-all hover:border-white/30">
                <Smartphone className="h-6 w-6 text-emerald-400 mb-4" />
                <h3 className="font-zolo text-lg font-bold text-white mb-2">20ms Silent Capture</h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Transparent windowless activity intercepts ACTION_SEND intents from Instagram with no foreground freeze or modal prompt.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-[22px] border border-white/15 bg-[#0e0f13] p-6 transition-all hover:border-white/30">
                <WifiOff className="h-6 w-6 text-cyan-400 mb-4" />
                <h3 className="font-zolo text-lg font-bold text-white mb-2">Offline-First Queue</h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Room SQLite local persistence buffers every save immediately. WorkManager retries automatically when connectivity restores.
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-[22px] border border-white/15 bg-[#0e0f13] p-6 transition-all hover:border-white/30">
                <Cpu className="h-6 w-6 text-purple-400 mb-4" />
                <h3 className="font-zolo text-lg font-bold text-white mb-2">Llama-3 Edge Extraction</h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Cloudflare Worker calls Groq API to distill captions, audio transcripts, and OCR text into actionable takeaways in 400ms.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 6: FREQUENTLY ASKED QUESTIONS
           ========================================================================= */}
        <section className="relative py-20 px-4 sm:px-8 border-t border-white/[0.08] bg-[#090a0d]/60">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <span className="font-mono text-xs tracking-widest text-[#71717a] uppercase block mb-1">
                QUESTIONS & ANSWERS
              </span>
              <h2 className="font-zolo text-3xl sm:text-4xl font-black tracking-tight text-white">
                Everything you need to know.
              </h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: 'Does Watch Later require my Instagram password or cookies?',
                  a: 'No. Watch Later never asks for your Instagram credentials. It utilizes native Android share sheet interception and public OpenGraph resolvers at the edge.'
                },
                {
                  q: 'What happens when I save a Reel while offline?',
                  a: 'Your phone saves the Reel locally in an encrypted Room SQLite database in under 20ms. The background WorkManager syncs it automatically once connection returns.'
                },
                {
                  q: 'How does self-cleaning work?',
                  a: 'Once you click "Mark Watched" or finish reviewing a reel, it is automatically archived out of your active backlog. Shelves that have no active reels retire from your dashboard view.'
                },
                {
                  q: 'Can I access my saved knowledge on desktop or laptop?',
                  a: 'Yes. The web workspace is responsive and syncs in real-time with your Android app via Supabase PostgreSQL.'
                }
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-[18px] border border-white/10 bg-[#0e0f13] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-zolo text-sm sm:text-base font-bold text-white hover:text-cyan-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="font-mono text-xs text-[#71717a] ml-4">
                      {openFaq === idx ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed border-t border-white/[0.05]">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 7: FINAL CALL TO ACTION
           ========================================================================= */}
        <section className="relative py-24 px-4 sm:px-8 border-t border-white/[0.08] text-center overflow-hidden">
          <div className="mx-auto max-w-4xl relative z-10 flex flex-col items-center">
            <h2 className="font-zolo text-4xl sm:text-6xl font-black tracking-tight text-white text-balance mb-6">
              Turn your saves into a second brain.
            </h2>
            <p className="text-base sm:text-lg text-[#a1a1aa] max-w-xl text-balance mb-10 leading-relaxed">
              Download the APK for your phone or launch the web workspace on your desktop right now.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3.5">
              <a
                href="/watch-later.apk"
                download="watch-later.apk"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full bg-white text-black font-semibold text-sm hover:bg-[#e8e8e8] transition-all shadow-[0_10px_30px_rgba(255,255,255,0.25)] active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                <span>Download Android APK</span>
                <span className="text-[11px] font-mono text-zinc-500 font-normal">v1.0 (17MB)</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full border border-white/20 bg-white/[0.04] text-white font-medium text-sm hover:border-white/40 hover:bg-white/[0.08] transition-all backdrop-blur active:scale-[0.98]"
              >
                <span>Launch Web Workspace</span>
                <ArrowUpRight className="h-4 w-4 text-[#71717a]" />
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.08] py-8 px-4 sm:px-8 font-mono text-xs text-[#71717a]">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold font-zolo">Watch Later</span>
              <span>© 2026 Ryan Keshary. MIT License.</span>
            </div>

            <div className="flex items-center gap-4">
              <a href="https://github.com/RyanKeshary/Watch-Later" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                GitHub Repo
              </a>
              <a href="/watch-later-launch.mp4" download className="hover:text-white transition-colors">
                Launch Film (1080p)
              </a>
              <a href="/watch-later.apk" download className="hover:text-white transition-colors">
                Android Binary
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* =========================================================================
          AUTH MODAL
         ========================================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-up">
          <div className="relative w-full max-w-md rounded-[28px] border border-white/15 bg-[#0e0f13] p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.8)]">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-[#71717a] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center mb-6">
              <h3 className="font-zolo text-2xl font-black text-white mb-2">
                {authMode === 'signin' ? 'Welcome Back' : 'Create Your Vault'}
              </h3>
              <p className="text-xs text-[#a1a1aa]">
                {authMode === 'signin'
                  ? 'Access your categorized Reels and personal library.'
                  : 'Start extracting knowledge from your saves in seconds.'}
              </p>
            </div>

            {authError && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300 font-mono">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#a1a1aa] mb-1.5 uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-[#52525b] focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#a1a1aa] mb-1.5 uppercase">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-[#52525b] focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all font-sans pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black hover:bg-[#e8e8e8] disabled:opacity-50 transition-all active:scale-[0.98] shadow-md"
              >
                {authLoading ? (
                  <span>Processing...</span>
                ) : (
                  <span>{authMode === 'signin' ? 'Sign In' : 'Create Free Account'}</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#71717a]">
              {authMode === 'signin' ? (
                <p>
                  Don&apos;t have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className="text-white hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="text-white hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
