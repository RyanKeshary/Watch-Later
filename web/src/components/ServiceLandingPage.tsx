'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Download,
  Share2,
  Trash2,
  Play,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Smartphone,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  Layers,
  Terminal,
  Cpu,
  BookmarkX,
  Database,
  Search,
  Zap,
  ShieldCheck,
  ChevronRight,
  FolderSync,
  Bot
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

  // Motion & Mouse Tracking for 3D Hero
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Horizontal Scroll Section Ref & Scroll Progress
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const horizontalSectionRef = useRef<HTMLDivElement>(null);
  const [horizontalProgress, setHorizontalProgress] = useState(0);

  // Active Category demo in Showcase
  const [activeTab, setActiveTab] = useState<'design' | 'engineering' | 'culinary' | 'cinema'>('engineering');

  // Motion preference listener
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Global mouse coordinates for spatial tilt
  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: globalThis.MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [reducedMotion]);

  // Window Scroll tracking for pinned Horizontal Scroll conversion & Parallax
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrollY(currentY);

      if (!horizontalSectionRef.current) return;
      const rect = horizontalSectionRef.current.getBoundingClientRect();
      const sectionHeight = horizontalSectionRef.current.offsetHeight - window.innerHeight;
      if (sectionHeight > 0) {
        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / sectionHeight));
        setHorizontalProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auth Submit Handler
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: email.split('@')[0] } }
        });
        if (error) throw error;
        setShowAuthModal(false);
        if (onSignInSuccess) onSignInSuccess();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setShowAuthModal(false);
        if (onSignInSuccess) onSignInSuccess();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Horizontal scroll journey cards
  const journeyCards = useMemo(() => [
    {
      step: '01',
      title: 'The Silent Share Habit',
      tagline: 'Zero UI Interruption',
      desc: 'You are scrolling Instagram. You see something exceptional. You tap Share ➔ Watch Later. In 20ms, an invisible Android activity captures the link and drops back to Instagram. No popups, no tag pickers, no notes.',
      icon: Share2,
      accent: '#5E6AD2',
      metrics: '20ms capture',
      sample: 'https://instagram.com/reel/C9Xk2...'
    },
    {
      step: '02',
      title: 'Offline Resilient Queue',
      tagline: 'Room SQLite + WorkManager',
      desc: 'On a flight or in the subway with zero cellular reception? Every link is persisted to an encrypted local Room SQLite database with retry policies, syncing autonomously the microsecond connectivity returns.',
      icon: Database,
      accent: '#10B981',
      metrics: '100% offline-ready',
      sample: 'LocalReel state: PENDING_SYNC'
    },
    {
      step: '03',
      title: 'Edge AI Synthesis',
      tagline: 'Llama-3 Structured Taxonomy',
      desc: 'Our Cloudflare edge worker extracts audio transcripts, captions, and visual frame cues, passing them to Groq AI to infer high-level pillars, niche subcategories, and structured actionable takeaways.',
      icon: Bot,
      accent: '#8B5CF6',
      metrics: 'Llama-3 70B inference',
      sample: 'Taxonomy: System Design / RSC Streams'
    },
    {
      step: '04',
      title: 'Kinetic Knowledge Vault',
      tagline: 'A Library, Not a Graveyard',
      desc: 'Log in on desktop or mobile web. Search across full transcripts, filter by auto-curated pillars, and review instant executive bullet points without scrubbing 90-second video noise.',
      icon: Search,
      accent: '#38BDF8',
      metrics: 'Full-text indexed',
      sample: 'Search: "raft consensus algorithms"'
    },
    {
      step: '05',
      title: 'Autonomous Self-Purge',
      tagline: 'Zero Stale Clutter',
      desc: 'Traditional bookmarkers rot because items accumulate forever. Watch Later automatically archives completed reels and peacefully retires unused categories so your workspace stays spotless.',
      icon: Trash2,
      accent: '#F43F5E',
      metrics: 'Zero-clutter guarantee',
      sample: 'Status: WATCHED ➔ Auto-Archived'
    }
  ], []);

  // Category showcase content
  const categoryShowcase = {
    engineering: {
      category: 'Software Architecture',
      subcategory: 'React Server Components',
      creator: '@dan_abramov_fan',
      summary: 'Breakdown of flight data protocol streaming serialization in RSC and why client boundaries matter for bundle elimination.',
      tags: ['React 19', 'Next.js 14', 'Performance', 'Bundling'],
      badge: '98% relevance'
    },
    design: {
      category: 'Design Systems',
      subcategory: 'Spatial Micro-Physics',
      creator: '@craft_ui',
      summary: 'Mathematical formulation of concentric radii (R_inner = R_outer - p) and spring curve timing for fluid tactile interfaces.',
      tags: ['Figma', 'UI/UX', 'Concentric Radii', 'Animation'],
      badge: '99% relevance'
    },
    culinary: {
      category: 'Culinary Craft',
      subcategory: 'French Pastry Lamination',
      creator: '@chef_julien',
      summary: 'Precise butter block temperature management (16°C) for achieving 27 distinct layers without gluten tearing in laminated dough.',
      tags: ['Baking', 'Croissants', 'Temperature', 'Technique'],
      badge: '95% relevance'
    },
    cinema: {
      category: 'Cinematography',
      subcategory: 'Anamorphic Lighting',
      creator: '@roger_deakins_study',
      summary: 'Practical light source diffusion placement using unbleached muslin bounced through Hampshire frost for cinematic skin tones.',
      tags: ['Lighting', 'Color Grading', 'Film', 'Composition'],
      badge: '97% relevance'
    }
  };

  return (
    <div className="relative min-h-screen bg-[#010102] text-[#F7F8F8] font-sans selection:bg-[#5E6AD2]/30 selection:text-white overflow-x-hidden">
      {/* 
        ========================================================================
        1. BACKGROUND FLUID CURSOR SIMULATION
        ========================================================================
      */}
      <SplashCursor
        colors={['#5E6AD2', '#828FFF', '#27A644', '#38BDF8']}
        rainbow={false}
        intensity={0.55}
        size={0.65}
        force={0.4}
        swirl={4}
        trail={1.8}
        glow={0.2}
        contained={false}
        zIndex={0}
      />

      {/* Subtle Linear Design System Grid Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(#F7F8F8 1px, transparent 1px), linear-gradient(90deg, #F7F8F8 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* 
        ========================================================================
        2. LUXURIOUS NAVIGATION HEADER
        ========================================================================
      */}
      <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b border-[#23252A]/80 bg-[#010102]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#5E6AD2] to-[#34343A] p-0.5 shadow-lg shadow-[#5E6AD2]/20">
              <img
                src="/logo.jpg"
                alt="Watch Later Logo"
                className="h-full w-full object-cover rounded-[10px]"
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold tracking-tight text-white text-base">Watch Later</span>
              <span className="hidden sm:inline-block font-mono text-[10px] text-[#8A8F98] uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#23252A] bg-[#0F1011]">
                v1.0 Pro
              </span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-6 font-mono text-xs text-[#8A8F98]">
            <a href="#how-it-works" className="hover:text-white transition-colors duration-150">Mechanism</a>
            <a href="#journey" className="hover:text-white transition-colors duration-150">Horizontal Journey</a>
            <a href="#demo" className="hover:text-white transition-colors duration-150">Launch Video</a>
            <a href="#taxonomy" className="hover:text-white transition-colors duration-150">AI Taxonomy</a>
          </nav>

          {/* CTA Group */}
          <div className="flex items-center gap-3">
            <a
              href="/watch-later.apk"
              download="watch-later.apk"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#23252A] bg-[#0F1011] text-xs font-medium text-[#D0D6E0] hover:border-[#34343A] hover:text-white transition-all duration-150 active:scale-[0.98]"
            >
              <Download className="h-3.5 w-3.5 text-[#5E6AD2]" />
              <span>Get APK</span>
            </a>

            {hasSession ? (
              <button
                onClick={onEnterDashboard}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold shadow-md shadow-[#5E6AD2]/25 transition-all duration-150 active:scale-[0.98]"
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
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold shadow-md shadow-[#5E6AD2]/25 transition-all duration-150 active:scale-[0.98]"
              >
                <span>Sign In</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-24 sm:pt-32">
        {/* 
          ========================================================================
          3. 3D HERO SECTION (Interactive Depth Plane Behind Content)
          ========================================================================
        */}
        <section className="relative px-4 sm:px-8 max-w-7xl mx-auto min-h-[82vh] flex flex-col justify-center items-center text-center overflow-hidden">
          {/* Spatial 3D Reactive Background Cards (Transforms on mouse movement) */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center transition-transform duration-700 ease-out"
            style={{
              transform: reducedMotion
                ? 'none'
                : `perspective(1200px) rotateX(${mousePos.y * -6}deg) rotateY(${mousePos.x * 6}deg) translateY(${scrollY * 0.1}px)`
            }}
          >
            {/* 3D Floating Left Pill: Silent Capture */}
            <div 
              className="absolute -left-12 sm:left-6 top-1/4 w-60 sm:w-72 p-4 rounded-2xl border border-[#23252A] bg-[#0F1011]/80 backdrop-blur-md shadow-2xl shadow-black/80 transition-transform duration-500 hidden md:block"
              style={{ transform: `translateZ(60px) rotate(-6deg)` }}
            >
              <div className="flex items-center gap-2 mb-2 font-mono text-[10px] text-[#10B981]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-ping" />
                <span>ANDROID SHARE INTERCEPT</span>
              </div>
              <p className="text-xs text-[#D0D6E0] font-mono truncate">instagram.com/reel/C8a9X...</p>
              <p className="text-[11px] text-[#8A8F98] mt-1">Saved to Room DB in 18ms</p>
            </div>

            {/* 3D Floating Right Pill: AI Taxonomy Node */}
            <div 
              className="absolute -right-12 sm:right-6 bottom-1/4 w-64 sm:w-80 p-4 rounded-2xl border border-[#23252A] bg-[#0F1011]/80 backdrop-blur-md shadow-2xl shadow-black/80 transition-transform duration-500 hidden md:block"
              style={{ transform: `translateZ(80px) rotate(4deg)` }}
            >
              <div className="flex items-center justify-between mb-2 font-mono text-[10px] text-[#5E6AD2]">
                <span>LLAMA-3 70B EDGE AGENT</span>
                <span className="text-[#8A8F98]">0.84s</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#5E6AD2]/15 text-[#828FFF] border border-[#5E6AD2]/30">
                  Engineering
                </span>
                <span className="text-xs text-[#F7F8F8] font-medium truncate">RSC Flight Serialization</span>
              </div>
            </div>

            {/* Central Glow Light Core */}
            <div className="h-96 w-96 rounded-full bg-gradient-to-tr from-[#5E6AD2]/20 via-[#27A644]/10 to-transparent blur-3xl opacity-60" />
          </div>

          {/* Hero Content Stack */}
          <div className="max-w-4xl mx-auto">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#23252A] bg-[#0F1011]/90 backdrop-blur-md mb-6 animate-fade-up">
              <span className="h-2 w-2 rounded-full bg-[#5E6AD2] shadow-sm shadow-[#5E6AD2]" />
              <span className="font-mono text-[11px] text-[#D0D6E0] tracking-wider uppercase">
                The Autonomous Reel Knowledge Vault
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08] text-balance mb-6">
              Saved reels go to die. <br />
              <span className="bg-gradient-to-r from-white via-[#D0D6E0] to-[#5E6AD2] bg-clip-text text-transparent">
                Watch Later cures it.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg md:text-xl text-[#8A8F98] max-w-2xl mx-auto leading-relaxed text-balance mb-10">
              One single share action silently captures Instagram reels on Android, enriches them with AI transcripts &amp; niche pillars at the edge, and auto-purges them once watched.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {hasSession ? (
                <button
                  onClick={onEnterDashboard}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#5E6AD2] hover:bg-[#828FFF] text-white font-semibold text-sm shadow-xl shadow-[#5E6AD2]/30 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>Launch Dashboard Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#5E6AD2] hover:bg-[#828FFF] text-white font-semibold text-sm shadow-xl shadow-[#5E6AD2]/30 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>Get Started — Free Vault</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              <a
                href="/watch-later.apk"
                download="watch-later.apk"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-[#23252A] bg-[#0F1011] hover:border-[#34343A] hover:bg-[#141516] text-[#F7F8F8] font-medium text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Smartphone className="h-4 w-4 text-[#8A8F98]" />
                <span>Download Android APK</span>
              </a>
            </div>

            {/* Trust & Spec Micro-stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 pt-8 border-t border-[#23252A]/60 max-w-3xl mx-auto text-left font-mono">
              <div>
                <p className="text-xl font-bold text-white tracking-tight">0.02s</p>
                <p className="text-[11px] text-[#8A8F98] uppercase">Capture Latency</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white tracking-tight">100%</p>
                <p className="text-[11px] text-[#8A8F98] uppercase">Offline-First Room</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white tracking-tight">Llama-3</p>
                <p className="text-[11px] text-[#8A8F98] uppercase">Autonomous Tagging</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white tracking-tight">0 Clutter</p>
                <p className="text-[11px] text-[#8A8F98] uppercase">Auto-Purge Engine</p>
              </div>
            </div>
          </div>
        </section>

        {/* 
          ========================================================================
          4. MANDATORY PINNED HORIZONTAL SCROLL JOURNEY SECTION
          (Scrolls sideways as user scrolls vertically down)
          ========================================================================
        */}
        <section
          id="journey"
          ref={horizontalSectionRef}
          className="relative min-h-[350vh] bg-[#010102]"
        >
          {/* Sticky Pin Container: locks in place for 350vh while tracking sideways */}
          <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden">
            {/* Header above the sliding track */}
            <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 font-mono text-[11px] text-[#5E6AD2] uppercase tracking-wider mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5E6AD2]" />
                  <span>Interactive Architecture Journey // Pinned Horizontal Track</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
                  How one tap replaces 5 apps.
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#8A8F98] max-w-sm">
                Scroll down naturally to watch the Reel journey across your phone, edge workers, and knowledge vault.
              </p>
            </div>

            {/* The Horizontal Slide Track */}
            <div className="w-full relative px-4 sm:px-8">
              <div
                ref={horizontalTrackRef}
                className="flex gap-6 will-change-transform transition-transform duration-100 ease-out"
                style={{
                  transform: `translateX(calc(-${horizontalProgress * 70}%))`
                }}
              >
                {journeyCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.step}
                      className="w-[85vw] sm:w-[480px] shrink-0 rounded-2xl border border-[#23252A] bg-[#0F1011] p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative group hover:border-[#34343A] transition-all duration-300"
                    >
                      {/* Top Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-[#141516] text-[#8A8F98] border border-[#23252A]">
                            PHASE {card.step}
                          </span>
                          <span
                            className="font-mono text-xs px-2.5 py-0.5 rounded-full"
                            style={{
                              color: card.accent,
                              backgroundColor: `${card.accent}15`,
                              borderColor: `${card.accent}30`
                            }}
                          >
                            {card.metrics}
                          </span>
                        </div>

                        {/* Title & Tagline */}
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: `${card.accent}10`,
                              borderColor: `${card.accent}30`,
                              color: card.accent
                            }}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">{card.title}</h3>
                            <p className="font-mono text-xs text-[#8A8F98]">{card.tagline}</p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-[#8A8F98] leading-relaxed mt-4">
                          {card.desc}
                        </p>
                      </div>

                      {/* Code/Mock Telemetry Output */}
                      <div className="mt-6 pt-4 border-t border-[#23252A] font-mono text-[11px] text-[#62666D] flex items-center justify-between">
                        <span className="truncate">{card.sample}</span>
                        <ChevronRight className="h-4 w-4 text-[#8A8F98] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Horizontal Progress Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full mt-8">
              <div className="h-1 w-full bg-[#141516] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5E6AD2] transition-all duration-100 ease-out"
                  style={{ width: `${horizontalProgress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 
          ========================================================================
          5. PRODUCT LAUNCH VIDEO SHOWCASE (1080P MP4)
          ========================================================================
        */}
        <section id="demo" className="py-24 sm:py-32 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-[11px] text-[#828FFF] uppercase tracking-wider mb-2">
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Production Launch Film // 1080p 60fps</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
                Watch the mechanism in motion.
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#8A8F98] max-w-sm">
              See the exact seconds from Instagram share-sheet intent to automated edge taxonomy.
            </p>
          </div>

          {/* Native High-Fidelity MP4 Video Player */}
          <div className="relative rounded-[28px] border border-[#23252A] bg-[#0F1011] p-3.5 sm:p-5 shadow-2xl overflow-hidden group hover:border-[#34343A] transition-all duration-300">
            <div className="relative aspect-video w-full rounded-[20px] bg-black border border-[#23252A] overflow-hidden shadow-inner">
              <video
                src="/watch-later-launch.mp4"
                poster="/watch-later-poster.jpg"
                controls
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Video Meta & Direct Download Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 px-2 font-mono text-xs text-[#8A8F98]">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-white font-medium">watch-later-launch.mp4</span>
                <span className="text-[#34343A]">•</span>
                <span>1080p H.264 Stereo</span>
                <span className="text-[#34343A]">•</span>
                <span className="px-2 py-0.5 rounded bg-[#141516] border border-[#23252A] text-[10px] text-[#D0D6E0] tabular-nums">
                  00:18 RUNTIME
                </span>
              </div>
              <a
                href="/watch-later-launch.mp4"
                download="watch-later-launch.mp4"
                className="inline-flex items-center gap-1.5 text-white hover:text-[#5E6AD2] font-semibold transition-colors duration-150 active:scale-[0.98]"
              >
                <span>Download Launch Video</span>
                <Download className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* 
          ========================================================================
          6. INTERACTIVE AI TAXONOMY & DASHBOARD SIMULATION
          ========================================================================
        */}
        <section id="taxonomy" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto border-t border-[#23252A]">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-[11px] text-[#5E6AD2] uppercase tracking-wider block mb-2">
              Autonomous Intelligence
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
              Substance over screenshots.
            </h2>
            <p className="text-sm sm:text-base text-[#8A8F98]">
              Watch Later doesn&apos;t dump links into a pile. It reads the audio, caption, and visuals to build clean knowledge pillars.
            </p>
          </div>

          {/* Interactive Pillar Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {(['engineering', 'design', 'culinary', 'cinema'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl font-mono text-xs transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-[#5E6AD2] text-white shadow-lg shadow-[#5E6AD2]/30'
                    : 'border border-[#23252A] bg-[#0F1011] text-[#8A8F98] hover:text-white hover:border-[#34343A]'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Active Category Intelligence Card Display */}
          <div className="max-w-4xl mx-auto rounded-2xl border border-[#23252A] bg-[#0F1011] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#23252A]">
              <div>
                <span className="font-mono text-[11px] text-[#5E6AD2] uppercase">Deduced Pillar</span>
                <h3 className="text-2xl font-bold text-white tracking-tight">{categoryShowcase[activeTab].category}</h3>
                <p className="font-mono text-xs text-[#8A8F98]">Subcategory: {categoryShowcase[activeTab].subcategory}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full font-mono text-xs bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25">
                  {categoryShowcase[activeTab].badge}
                </span>
                <span className="font-mono text-xs text-[#62666D]">{categoryShowcase[activeTab].creator}</span>
              </div>
            </div>

            <div className="py-6">
              <span className="font-mono text-[11px] text-[#62666D] uppercase block mb-2">Synthesized Executive Takeaways</span>
              <p className="text-base text-[#D0D6E0] leading-relaxed">
                &ldquo;{categoryShowcase[activeTab].summary}&rdquo;
              </p>
            </div>

            <div className="pt-6 border-t border-[#23252A] flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[#62666D] mr-2">Entities:</span>
              {categoryShowcase[activeTab].tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg bg-[#141516] border border-[#23252A] font-mono text-xs text-[#D0D6E0]"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 
          ========================================================================
          7. FINAL CALL TO ACTION HERO CARD
          ========================================================================
        */}
        <section className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="rounded-3xl border border-[#23252A] bg-gradient-to-b from-[#0F1011] to-[#010102] p-8 sm:p-16 text-center relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
                Never lose a reel worth revisiting.
              </h2>
              <p className="text-sm sm:text-base text-[#8A8F98] mb-8">
                Install the native Android companion app and access your knowledge library from any desktop or mobile browser.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/watch-later.apk"
                  download="watch-later.apk"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#5E6AD2] hover:bg-[#828FFF] text-white font-semibold text-sm shadow-xl shadow-[#5E6AD2]/30 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download APK (17MB)</span>
                </a>
                {hasSession ? (
                  <button
                    onClick={onEnterDashboard}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-[#23252A] bg-[#141516] hover:border-[#34343A] text-white font-medium text-sm transition-all duration-200 active:scale-[0.98]"
                  >
                    Open Web Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAuthMode('signin');
                      setShowAuthModal(true);
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-[#23252A] bg-[#141516] hover:border-[#34343A] text-white font-medium text-sm transition-all duration-200 active:scale-[0.98]"
                  >
                    Sign In to Web Library
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 
        ========================================================================
        8. FOOTER
        ========================================================================
      */}
      <footer className="border-t border-[#23252A] bg-[#010102] py-12 px-4 sm:px-8 text-xs font-mono text-[#62666D]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-white font-sans font-semibold">Watch Later</span>
            <span>•</span>
            <span>The Autonomous Reel Knowledge Vault</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/RyanKeshary/Watch-Later" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              GitHub
            </a>
            <a href="/watch-later.apk" download className="hover:text-white transition-colors">
              Android APK
            </a>
            <a href="https://watch-later-worker.onrender.com/health" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              API Status
            </a>
          </div>
        </div>
      </footer>

      {/* 
        ========================================================================
        9. AUTHENTICATION MODAL (Supabase Credentials)
        ========================================================================
      */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-up">
          <div className="w-full max-w-md rounded-2xl border border-[#23252A] bg-[#0F1011] p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-[#8A8F98] hover:text-white hover:bg-[#141516] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-white tracking-tight">
                {authMode === 'signin' ? 'Sign in to Watch Later' : 'Create your Vault Account'}
              </h3>
              <p className="text-xs text-[#8A8F98] mt-1">
                Access your synced reel library across all web and mobile devices.
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-lg border border-[#F43F5E]/30 bg-[#F43F5E]/10 text-xs text-[#F43F5E]">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] text-[#8A8F98] uppercase mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#23252A] bg-[#141516] text-white text-sm focus:outline-none focus:border-[#5E6AD2] transition-colors placeholder:text-[#62666D]"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] text-[#8A8F98] uppercase mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#23252A] bg-[#141516] text-white text-sm focus:outline-none focus:border-[#5E6AD2] transition-colors placeholder:text-[#62666D]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8F98] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-sm font-semibold shadow-lg shadow-[#5E6AD2]/25 transition-all duration-150 disabled:opacity-50"
              >
                {authLoading ? 'Authenticating...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#23252A] text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                  setAuthError(null);
                }}
                className="text-xs text-[#8A8F98] hover:text-white transition-colors"
              >
                {authMode === 'signin'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
