'use client';

import { useState, useEffect, useRef, MouseEvent, useMemo } from 'react';
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
  CheckCircle2,
  Layers,
  Cpu,
  BookmarkX,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronLeft,
  Flame,
  Search,
  FolderTree,
  Filter,
  Check,
  Zap,
  ShieldCheck,
  Compass,
  Film
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
  // Auth state & modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // 3D Tilt calculation on mouse movement for hero canvas/cards
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  const handleHeroMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };

  const handleHeroMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Horizontal Scroll Track 1: Interactive Mechanism & Pipeline
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const horizontalContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Horizontal Scroll Track 2: Reel Knowledge Gallery
  const galleryTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!horizontalContainerRef.current || !horizontalTrackRef.current) return;
      const rect = horizontalContainerRef.current.getBoundingClientRect();
      const containerHeight = horizontalContainerRef.current.offsetHeight - window.innerHeight;
      if (containerHeight <= 0) return;
      
      const progress = Math.min(Math.max(-rect.top / containerHeight, 0), 1);
      setScrollProgress(progress);

      const maxScroll = horizontalTrackRef.current.scrollWidth - window.innerWidth + 80;
      horizontalTrackRef.current.style.transform = `translateX(-${progress * maxScroll}px)`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auth handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setShowAuthModal(false);
        onSignInSuccess?.();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
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

  // Stepper state for interactive mechanism simulation
  const [activeStep, setActiveStep] = useState(0);
  const steps = useMemo(() => [
    {
      num: '01',
      tag: 'CAPTURE',
      title: 'Silent Share-Sheet Intercept',
      desc: 'Browse Instagram normally. Tap share on any reel and choose Watch Later. No dialogs, zero screen switches, and under 20ms execution time.',
      status: 'Captured in 18ms',
      detail: 'Intent: android.intent.action.SEND -> Room SQLite'
    },
    {
      num: '02',
      tag: 'OFFLINE QUEUE',
      title: 'Room Persistence & Worker',
      desc: 'Saves queue into encrypted local storage. Even offline in subways, WorkManager resumes upload with exponential backoff on reconnection.',
      status: 'Enqueued Locally',
      detail: 'Table: local_reels (PENDING_SYNC)'
    },
    {
      num: '03',
      tag: 'EDGE ENRICHMENT',
      title: 'Groq AI Category Mining',
      desc: 'Cloudflare Worker strips tracking URLs, parses caption and audio transcripts, and generates clean thematic taxonomy using Llama-3.',
      status: 'Groq Llama-3 70B',
      detail: 'Category: Architecture / Subcategory: Frontend Design'
    },
    {
      num: '04',
      tag: 'PURGE & ROTATE',
      title: 'Zero-Backlog Ephemeral Library',
      desc: 'Watch the reel and extract the knowledge. Marking it completed immediately purges it from your active queue so stale clutter never accumulates.',
      status: 'Auto-Purged',
      detail: 'Status: WATCHED -> Database Auto-Tidy'
    }
  ], []);

  // Gallery items for horizontal track
  const galleryCards = [
    {
      title: 'High-Craft Design Systems',
      creator: '@peduarte',
      category: 'Design Engineering',
      takeaway: 'Concentric radii formula and optical padding in Radix UI primitives.',
      tag: 'UI/UX',
      views: '142k'
    },
    {
      title: 'Server Component Streaming',
      creator: '@leerob',
      category: 'Frontend Engineering',
      takeaway: 'How React flight data streams over HTTP chunk boundaries without hydration lock.',
      tag: 'Next.js',
      views: '89k'
    },
    {
      title: 'Sous Vide Duck Breast Sear',
      creator: '@kenjilopezalt',
      category: 'Culinary Arts',
      takeaway: 'Crosshatch skin score at 45° to render subcutaneous fat evenly.',
      tag: 'Cooking',
      views: '230k'
    },
    {
      title: 'Metal Shaders in Swift',
      creator: '@dimillian',
      category: 'Graphics & GPU',
      takeaway: 'Writing procedural fragment shaders using MSL on Apple Silicon.',
      tag: 'Metal / Swift',
      views: '67k'
    },
    {
      title: 'Zero-Waste Espresso Grinding',
      creator: '@jameshoffmann',
      category: 'Coffee Science',
      takeaway: 'Ross Droplet Technique (RDT) with ionizers drops static retention by 98%.',
      tag: 'Science',
      views: '512k'
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#070708] text-[#e4e4e7] font-sans antialiased selection:bg-white selection:text-black overflow-x-hidden">
      {/* Dynamic Fluid WebGL Canvas (contained at base stacking order) */}
      <SplashCursor
        rainbow={false}
        colors={['#ffffff', '#a1a1aa', '#71717a']}
        intensity={0.35}
        size={0.65}
        force={0.4}
        swirl={4}
        trail={1.8}
        momentum={0.7}
        shading={0.8}
        glow={0.2}
        quality="medium"
        intro={false}
        zIndex={0}
      />

      {/* Subtle Mesh Ambient Gradients */}
      <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
        <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-white/[0.04] via-transparent to-transparent blur-[140px]" />
        <div className="absolute top-[40%] -left-[200px] w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[160px]" />
        <div className="absolute top-[65%] -right-[200px] w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[180px]" />
      </div>

      {/* Main Content Viewport */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* ============================================================== */}
        {/* NAVIGATION BAR                                                 */}
        {/* ============================================================== */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070708]/75 border-b border-white/[0.08] transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-[10px] overflow-hidden border border-white/20 bg-black flex items-center justify-center shadow-lg group">
                <img
                  src="/logo.jpg"
                  alt="Watch Later Icon"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-zolo font-black tracking-tight text-white text-base leading-none">
                  Watch Later
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#71717a] mt-0.5">
                  Autonomous Knowledge Engine
                </span>
              </div>
            </div>

            {/* Middle Nav Links */}
            <nav className="hidden md:flex items-center gap-8 font-mono text-xs text-[#a1a1aa]">
              <a href="#mechanism" className="hover:text-white transition-colors">MECHANISM</a>
              <a href="#horizontal-journey" className="hover:text-white transition-colors">THE JOURNEY</a>
              <a href="#showcase" className="hover:text-white transition-colors">LAUNCH FILM</a>
              <a href="#gallery" className="hover:text-white transition-colors">LIBRARY</a>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {hasSession ? (
                <button
                  onClick={onEnterDashboard}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black font-semibold text-xs px-4 py-2 hover:bg-[#e4e4e7] transition-transform active:scale-[0.98] shadow-md"
                >
                  <span>Open Library</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }}
                    className="font-mono text-xs text-[#d4d4d8] hover:text-white px-3 py-1.5 transition-colors"
                  >
                    SIGN IN
                  </button>
                  <a
                    href="/watch-later.apk"
                    download="watch-later.apk"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white text-white hover:text-black font-medium text-xs px-4 py-2 transition-all duration-200 active:scale-[0.98] shadow-sm backdrop-blur"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download APK</span>
                  </a>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ============================================================== */}
        {/* HERO SECTION WITH 3D DEPTH & PERSPECTIVE TILT                  */}
        {/* ============================================================== */}
        <section
          ref={heroRef}
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
          className="relative pt-12 sm:pt-20 pb-20 md:pb-28 px-4 sm:px-6 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-8 justify-between"
          style={{ perspective: '1200px' }}
        >
          {/* Left Column: Headline & Action */}
          <div className="flex-1 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 mb-6 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#d4d4d8]">
                Native Android 14 • Edge AI Ingestion
              </span>
            </div>

            <h1 className="font-zolo text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.05] text-balance mb-6">
              Saved reels <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#d4d4d8] to-[#71717a]">
                don’t have to die.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#a1a1aa] leading-relaxed max-w-xl text-balance mb-8">
              Replace scattered DMs, screenshots, and forgotten bookmarks with one single gesture: 
              <strong> share the reel to Watch Later</strong>. Silent capture. AI auto-categorization. Ephemeral clean-up once watched.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a
                href="/watch-later.apk"
                download="watch-later.apk"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-white text-black font-semibold text-sm px-6 py-3.5 hover:bg-[#e4e4e7] transition-all duration-200 active:scale-[0.98] shadow-2xl"
              >
                <Smartphone className="h-4 w-4" />
                <span>Download Android App (APK)</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <button
                onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] hover:bg-white/10 text-white font-mono text-xs px-6 py-3.5 transition-all duration-200 active:scale-[0.98] backdrop-blur"
              >
                <span>OPEN WEB DASHBOARD</span>
                <ArrowUpRight className="h-4 w-4 text-[#71717a]" />
              </button>
            </div>

            {/* Metrics ticker row */}
            <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-3 gap-6 font-mono">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">0.02s</p>
                <p className="text-[10px] text-[#71717a] uppercase tracking-wider mt-1">Silent Save</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">100%</p>
                <p className="text-[10px] text-[#71717a] uppercase tracking-wider mt-1">AI Automated</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">0 KB</p>
                <p className="text-[10px] text-[#71717a] uppercase tracking-wider mt-1">Stale Clutter</p>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Interactive Dimensional Spatial Showcase */}
          <div
            className="flex-1 w-full max-w-lg lg:max-w-none flex justify-center items-center transition-transform duration-300 ease-out"
            style={{
              transform: `rotateY(${mousePos.x * 12}deg) rotateX(${-mousePos.y * 12}deg) scale3d(1, 1, 1)`
            }}
          >
            <div className="relative w-full max-w-md rounded-[32px] border border-white/20 bg-gradient-to-b from-[#18181b]/90 to-[#0c0c0e]/95 p-6 shadow-2xl backdrop-blur-2xl overflow-hidden group">
              {/* Top status bar simulation */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs font-mono text-[#71717a]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-white font-medium">REEL_INGEST_LIVE</span>
                </div>
                <span>LATENCY: 14MS</span>
              </div>

              {/* Holographic 3D Floating Reel Card */}
              <div className="mt-6 rounded-2xl border border-white/15 bg-black/60 p-4 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-white/30">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-white to-[#71717a] p-[1px] overflow-hidden">
                      <div className="h-full w-full bg-black rounded-full flex items-center justify-center font-mono text-xs text-white">
                        IG
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">@alex_craftsman</p>
                      <p className="text-[10px] font-mono text-[#71717a]">Instagram Reel • 00:48</p>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold">
                    AUTO-PARSED
                  </span>
                </div>

                {/* Mock Thumbnail with 3D Depth Lighting */}
                <div className="relative aspect-[16/10] w-full rounded-xl bg-[#121215] border border-white/10 overflow-hidden flex flex-col justify-end p-4">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                  <div className="relative z-20">
                    <span className="font-mono text-[10px] uppercase text-emerald-400 tracking-wider">
                      ARCHITECTURE / REACT 19
                    </span>
                    <h3 className="text-sm font-bold text-white leading-snug mt-1">
                      Action State hooks replace 80% of form handling boilerplate.
                    </h3>
                  </div>
                </div>

                {/* AI Extracted Pills */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#a1a1aa]">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                    <span>Key Takeaway Indexed</span>
                  </div>
                  <span className="text-white font-semibold">Ready to Watch</span>
                </div>
              </div>

              {/* Background Glow accent */}
              <div className="pointer-events-none absolute -bottom-10 -right-10 w-48 h-48 bg-white/[0.08] rounded-full blur-3xl" />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* MANDATORY HORIZONTAL SCROLL SECTION 1: THE MECHANISM PINNED    */}
        {/* ============================================================== */}
        <section
          id="horizontal-journey"
          ref={horizontalContainerRef}
          className="relative h-[280vh] bg-black border-y border-white/10"
        >
          {/* Pinned Sticky Window */}
          <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center px-4 sm:px-8">
            <div className="max-w-7xl mx-auto w-full mb-8">
              <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 block mb-2">
                HORIZONTAL LIFECYCLE TRACK // 01 TO 04
              </span>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <h2 className="font-zolo text-3xl sm:text-5xl font-black text-white tracking-tight">
                  Scroll vertically. Journey horizontally.
                </h2>
                <div className="flex items-center gap-3 font-mono text-xs text-[#71717a]">
                  <span>PROGRESS</span>
                  <div className="w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-150"
                      style={{ width: `${scrollProgress * 100}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-white">{Math.round(scrollProgress * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Sliding Track */}
            <div
              ref={horizontalTrackRef}
              className="flex items-stretch gap-6 will-change-transform transition-transform ease-out"
              style={{ width: 'max-content' }}
            >
              {steps.map((st, idx) => (
                <div
                  key={st.num}
                  className="w-[85vw] sm:w-[480px] rounded-[28px] border border-white/15 bg-gradient-to-b from-[#141417] to-[#09090b] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-white/30 transition-all duration-300"
                >
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <span className="font-mono text-3xl font-black text-white/30 group-hover:text-white transition-colors">
                        {st.num}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[#a1a1aa]">
                        {st.tag}
                      </span>
                    </div>

                    <h3 className="font-zolo text-2xl font-bold text-white mb-3">
                      {st.title}
                    </h3>
                    <p className="text-sm text-[#a1a1aa] leading-relaxed">
                      {st.desc}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/10 font-mono text-xs flex items-center justify-between">
                    <span className="text-[#71717a] truncate max-w-[240px]">{st.detail}</span>
                    <span className="text-emerald-400 font-semibold">{st.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* PRODUCTION VIDEO SHOWCASE SECTION (H.264 1080P LAUNCH FILM)   */}
        {/* ============================================================== */}
        <section id="showcase" className="py-24 sm:py-32 px-4 sm:px-6 max-w-6xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-[#71717a] block mb-2">
              SYSTEM LAUNCH FILM // 18 SECONDS
            </span>
            <h2 className="font-zolo text-3xl sm:text-5xl font-black text-white tracking-tight text-balance">
              Engineered with zero friction.
            </h2>
            <p className="text-sm sm:text-base text-[#a1a1aa] mt-3">
              Watch how one share-sheet gesture turns scattered video clips into a structured knowledge vault.
            </p>
          </div>

          {/* Real MP4 Player Container */}
          <div className="relative rounded-[32px] border border-white/20 bg-[#0e0e11] p-3 sm:p-5 shadow-2xl overflow-hidden group">
            <div className="relative aspect-video w-full rounded-[22px] bg-black border border-white/10 overflow-hidden shadow-2xl">
              <video
                src="/watch-later-launch.mp4"
                poster="/watch-later-poster.jpg"
                controls
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Video footer info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 px-2 font-mono text-xs text-[#71717a]">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white font-medium">watch-later-launch.mp4</span>
                <span className="text-[#3f3f46]">•</span>
                <span className="text-[#a1a1aa]">1080p 60fps AVFoundation Swift</span>
                <span className="text-[#3f3f46]">•</span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#d4d4d8] text-[10px]">
                  00:18 AUDIO SYNC
                </span>
              </div>
              <a
                href="/watch-later-launch.mp4"
                download="watch-later-launch.mp4"
                className="inline-flex items-center gap-1.5 text-white hover:text-emerald-400 font-semibold transition-colors active:scale-[0.98]"
              >
                <span>Download Video File</span>
                <Download className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* MANDATORY HORIZONTAL SCROLL SECTION 2: INTERACTIVE REEL DECK  */}
        {/* ============================================================== */}
        <section id="gallery" className="py-20 bg-[#09090b] border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#71717a] block mb-2">
                HORIZONTAL LIBRARY EXPLORER // SWIPEABLE
              </span>
              <h2 className="font-zolo text-3xl sm:text-4xl font-black text-white tracking-tight">
                Not a dump. A curated library.
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#a1a1aa] max-w-sm">
              Reels auto-sort into clean pillars. Once watched, they disappear from active memory.
            </p>
          </div>

          {/* Horizontal Drag/Scroll Gallery */}
          <div
            ref={galleryTrackRef}
            className="flex items-stretch gap-6 overflow-x-auto px-4 sm:px-6 pb-6 pt-2 scrollbar-none snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {galleryCards.map((c, i) => (
              <div
                key={c.title}
                className="w-[300px] sm:w-[360px] shrink-0 rounded-[24px] border border-white/15 bg-[#121215] p-6 snap-center flex flex-col justify-between hover:border-white/30 transition-all duration-200 group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 font-mono text-[11px]">
                    <span className="px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-[#a1a1aa]">
                      {c.tag}
                    </span>
                    <span className="text-[#71717a]">{c.views} saves</span>
                  </div>

                  <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider block mb-1">
                    {c.category}
                  </span>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {c.title}
                  </h3>
                  <p className="font-mono text-xs text-[#71717a] mt-1">{c.creator}</p>

                  <div className="mt-4 p-3.5 rounded-xl border border-white/10 bg-black/40 text-xs text-[#d4d4d8] leading-relaxed">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-[#71717a] mb-1">AI Takeaway:</p>
                    {c.takeaway}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between font-mono text-xs">
                  <span className="text-[#71717a]">Auto-Tidy on Watch</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================== */}
        {/* DOWNLOAD & GET STARTED CALL TO ACTION                          */}
        {/* ============================================================== */}
        <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto w-full text-center">
          <div className="rounded-[36px] border border-white/20 bg-gradient-to-b from-[#18181b] to-black p-10 sm:p-16 shadow-2xl relative overflow-hidden">
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 block mb-3">
              ZERO CONFIGURATION REQUIRED
            </span>
            <h2 className="font-zolo text-4xl sm:text-6xl font-black text-white tracking-tight text-balance mb-6">
              Start building your knowledge vault today.
            </h2>
            <p className="text-base text-[#a1a1aa] max-w-xl mx-auto mb-10 text-balance">
              Install the Android app, save with one tap, and access your organized knowledge library on any device.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/watch-later.apk"
                download="watch-later.apk"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-white text-black font-semibold text-sm px-8 py-4 hover:bg-[#e4e4e7] transition-all duration-200 active:scale-[0.98] shadow-2xl"
              >
                <Download className="h-4 w-4" />
                <span>Download APK File (Free)</span>
              </a>

              <button
                onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white font-mono text-xs px-8 py-4 transition-all duration-200 active:scale-[0.98] backdrop-blur"
              >
                <span>OPEN DASHBOARD</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* FOOTER                                                         */}
        {/* ============================================================== */}
        <footer className="border-t border-white/10 py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-6 font-mono text-xs text-[#71717a]">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md overflow-hidden bg-white/10">
              <img src="/logo.jpg" alt="Watch Later" className="h-full w-full object-cover" />
            </div>
            <span className="text-white font-semibold">Watch Later</span>
            <span>© 2026 Ryan Keshary. MIT License.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://watchlatertool.vercel.app" className="hover:text-white transition-colors">Vercel Live</a>
            <a href="https://watch-later-worker.onrender.com/health" className="hover:text-white transition-colors">Render Worker</a>
            <a href="https://github.com/RyanKeshary/Watch-Later" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </footer>

      </div>

      {/* ============================================================== */}
      {/* AUTH MODAL                                                     */}
      {/* ============================================================== */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-up">
          <div className="relative w-full max-w-md rounded-[28px] border border-white/20 bg-[#121215] p-8 shadow-2xl">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-[#71717a] hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h3 className="font-zolo text-2xl font-bold text-white">
                {authMode === 'signin' ? 'Sign in to Watch Later' : 'Create your account'}
              </h3>
              <p className="font-mono text-xs text-[#71717a] mt-1">
                Access your synced knowledge vault across all devices.
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-mono">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[#a1a1aa] mb-1.5 uppercase tracking-wider text-[10px]">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-white placeholder-[#52525b] focus:border-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] mb-1.5 uppercase tracking-wider text-[10px]">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-white placeholder-[#52525b] focus:border-white focus:outline-none transition-colors"
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
                className="w-full mt-2 rounded-full bg-white text-black font-sans font-semibold py-3 text-sm hover:bg-[#e4e4e7] transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
              >
                {authLoading ? 'Verifying...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center font-mono text-xs text-[#71717a]">
              {authMode === 'signin' ? (
                <p>
                  No account yet?{' '}
                  <button
                    onClick={() => setAuthMode('signup')}
                    className="text-white hover:underline font-semibold ml-1"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => setAuthMode('signin')}
                    className="text-white hover:underline font-semibold ml-1"
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
