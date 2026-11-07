'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Smartphone,
  FolderTree,
  Zap,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Play,
  Film,
  Download,
  CheckCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  X,
  Compass,
  Database,
  Lock,
  Bookmark
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NumberTicker } from '@/components/NumberTicker';

interface ServicePageProps {
  onSignInSuccess?: () => void;
  onEnterDashboard?: () => void;
  hasSession?: boolean;
}

interface HeroInteractiveCardProps {
  children: (props: {
    tilt: { x: number; y: number };
    isHovered: boolean;
    heroCardRef: React.RefObject<HTMLDivElement>;
    handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    handleMouseEnter: () => void;
    handleMouseLeave: () => void;
    prefersReducedMotion: boolean;
  }) => React.ReactNode;
}

function HeroInteractiveCard({ children }: HeroInteractiveCardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const heroCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -9;
    const rotateY = ((x - centerX) / centerX) * 9;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => {
    if (!prefersReducedMotion) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <>
      {children({
        tilt: prefersReducedMotion ? { x: 0, y: 0 } : tilt,
        isHovered: prefersReducedMotion ? false : isHovered,
        heroCardRef,
        handleMouseMove,
        handleMouseEnter,
        handleMouseLeave,
        prefersReducedMotion
      })}
    </>
  );
}

export default function ServiceLandingPage({
  onSignInSuccess,
  onEnterDashboard,
  hasSession = false
}: ServicePageProps) {
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
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

  const horizontalFeatures = [
    {
      num: '01',
      title: 'Silent Share Intercept',
      desc: 'Native Android and iOS share sheet integration captures reels in under 200ms without switching away from Instagram.',
      icon: Smartphone,
      tag: 'SYSTEM HOOK'
    },
    {
      num: '02',
      title: 'Lossless Metadata Extraction',
      desc: 'Retrieves complete transcripts, high-res posters, creator handles, and source captions even if the reel is archived.',
      icon: Film,
      tag: 'DEEP SCRAPE'
    },
    {
      num: '03',
      title: 'Autonomous Categorization',
      desc: 'Groq neural classification sorts incoming media into strict, curated domain pillars with zero manual tagging.',
      icon: FolderTree,
      tag: 'NEURAL CLUSTERING'
    },
    {
      num: '04',
      title: 'Curated Save Later Vault',
      desc: 'Star and bookmark reels for priority revisiting, with quick offline synchronization across all your registered devices.',
      icon: Bookmark,
      tag: 'OFFLINE CACHE'
    },
    {
      num: '05',
      title: 'Encrypted Row Level Security',
      desc: 'PostgreSQL RLS ensures complete isolation. Your saved media and personal taxonomy are strictly inaccessible to anyone else.',
      icon: ShieldCheck,
      tag: 'PRIVACY FIRST'
    }
  ];

  const horizontalGallery = [
    {
      badge: 'TECH & AI',
      title: 'Next-Gen Agent Workflows',
      creator: '@deeplearning_ai',
      time: 'Captured 2m ago',
      color: 'from-blue-600/20 to-sky-500/10'
    },
    {
      badge: 'DESIGN & ARCHITECTURE',
      title: 'Kinetic UI Physics & Shaders',
      creator: '@designcraft',
      time: 'Captured 14m ago',
      color: 'from-purple-600/20 to-pink-500/10'
    },
    {
      badge: 'FITNESS & HEALTH',
      title: 'Mobility Routine for Coders',
      creator: '@athleticlab',
      time: 'Captured 1h ago',
      color: 'from-emerald-600/20 to-teal-500/10'
    },
    {
      badge: 'CULINARY ARTS',
      title: 'Artisanal Sourdough Fermentation',
      creator: '@bakersvault',
      time: 'Captured 3h ago',
      color: 'from-amber-600/20 to-orange-500/10'
    },
    {
      badge: 'FINANCE & VENTURE',
      title: 'SaaS Multiples & Unit Economics',
      creator: '@foundersguide',
      time: 'Captured 6h ago',
      color: 'from-rose-600/20 to-red-500/10'
    }
  ];

  const deliverables = [
    {
      num: '01',
      title: 'Zero-Friction Android & iOS Intercept',
      desc: 'Seamless system share-sheet capture. Tap share once inside Instagram, and the native background worker quietly captures and parses the reel with zero interruptions.',
      tag: 'CLIENT CORE'
    },
    {
      num: '02',
      title: 'Strict Semantic Taxonomy',
      desc: 'No manual tagging required. Our AI scans captions, topics, and transcripts to organize content into clean, focused parent pillars with high fidelity.',
      tag: 'AI ENGINE'
    },
    {
      num: '03',
      title: 'Full Caption, Transcript & Title Extraction',
      desc: 'Never worry about deleted posts or altered links. All critical knowledge points, summaries, creators, and media thumbnails are permanently archived into your personal vault.',
      tag: 'EXTRACTION'
    },
    {
      num: '04',
      title: 'Adaptive Data Retention & Vault Cleansing',
      desc: 'Configurable automated life-cycles. Set automated 1-day, 1-week, or 1-month purge caps on watched archives, or perform single-click CSV ledger exports anytime.',
      tag: 'GOVERNANCE'
    }
  ];

  const processSteps = [
    {
      step: '01',
      title: 'Share from Instagram',
      description: 'Tap the standard share button on any Instagram Reel, Post, or Carousel and select Watch Later.',
      badge: 'Zero-UI'
    },
    {
      step: '02',
      title: 'Automated Extraction',
      description: 'Our backend resolves original source metadata, thumbnails, captions, audio summaries, and creators in seconds.',
      badge: 'Background Daemon'
    },
    {
      step: '03',
      title: 'Intelligent Categorization',
      description: 'The engine inspects existing categories first, clustering similar reels without creating redundant duplicates.',
      badge: 'Smart Clustering'
    },
    {
      step: '04',
      title: 'Access & Curate Anywhere',
      description: 'Review your vault across responsive desktop and mobile browsers with list/grid density toggles and offline sync.',
      badge: 'Universal Sync'
    }
  ];

  const proofMetrics = [
    { valueNum: 2, prefix: '< ', suffix: '.4s', label: 'End-to-End Extraction', sub: 'Average time from mobile share to vault availability' },
    { valueNum: 100, suffix: '%', label: 'Private & Isolated', sub: 'PostgreSQL Row Level Security bound strictly to your user ID' },
    { valueNum: 0, suffix: ' Clicks', label: 'Manual Tagging', sub: 'Autonomous categorization into logical pillars' },
    { valueNum: 60, suffix: ' FPS', label: 'Native Performance', sub: 'Fluid spring animations with minimal bundle overhead' }
  ];

  const faqs = [
    {
      q: 'How does Watch Later capture Instagram reels without opening the app?',
      a: 'Watch Later registers a silent Android share intent (`ShareCaptureActivity`) that immediately records the reel URL into your cloud database and finishes in the background, keeping you right where you were inside Instagram.'
    },
    {
      q: 'Will it create duplicate categories for similar reels?',
      a: 'No. Watch Later employs strict categorization checks that evaluate existing categories first. It groups related reels together and only generates a new category when the content represents a genuinely novel domain.'
    },
    {
      q: 'What happens if an Instagram Reel gets deleted or made private later?',
      a: 'Because Watch Later extracts and archives the title, creator handle, AI summary, full caption, and preview thumbnail upon share, your core knowledge and key points remain intact even if the original post is removed.'
    },
    {
      q: 'Can I export my curated library or clear out watched reels?',
      a: 'Yes. The Settings dashboard provides one-click CSV export of your entire library, configurable automated archive retention periods (1 Day / 1 Week / 1 Month), and safe bulk deletion tools.'
    }
  ];

  return (
    <div className="min-h-screen bg-fabric text-[#D9D9D9] font-sans antialiased selection:bg-[#333333] selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#333333] bg-[#0B0B0B]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Watch Later" className="h-8 w-8 rounded-lg object-cover" />
            <div>
              <span className="font-zolo text-lg font-bold tracking-tight text-white block leading-none">Watch Later</span>
              <span className="font-mono-micro text-[#6B6B6B] block mt-0.5">VAULT SERVICE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasSession ? (
              <button
                onClick={onEnterDashboard}
                className="flex items-center gap-2 rounded-lg bg-[#D9D9D9] px-4 py-2 text-xs font-semibold text-[#0B0B0B] transition hover:bg-white active:scale-95"
              >
                <span>Enter Vault</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-[#D9D9D9] px-4 py-2 text-xs font-semibold text-[#0B0B0B] transition hover:bg-white active:scale-95"
              >
                <span>Access Vault</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION: 3D Spatial Interactions & Value Proposition */}
      <section className="relative overflow-hidden border-b border-[#333333] pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#333333] bg-[#1A1A1A]/80 px-3.5 py-1 mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span className="font-mono-micro text-[#D9D9D9]">AUTONOMOUS CONTENT REEL VAULT &amp; EXTRACTION SERVICE</span>
          </div>

          <h1 className="font-zolo text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
            Never lose a reel worth revisiting.
          </h1>

          <p className="mt-6 text-sm sm:text-base lg:text-lg text-[#999999] max-w-2xl mx-auto leading-relaxed">
            The private archive service engineered to capture, scrape, and intelligently categorize Instagram media directly from your phone share sheet with zero friction.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                if (hasSession) onEnterDashboard?.();
                else {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-black transition hover:bg-[#D9D9D9] active:scale-95 shadow-lg"
            >
              <span>{hasSession ? 'Open Your Vault' : 'Start Archiving Free'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <a
              href="#deliverables"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-[#333333] bg-[#1A1A1A]/70 px-6 py-3.5 text-sm font-medium text-[#D9D9D9] transition hover:bg-[#1A1A1A] hover:border-[#6B6B6B]"
            >
              <span>Explore Deliverables</span>
              <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
            </a>
          </div>

          {/* 3D Spatial Interactive Card with Perspective Tilt & Reduced Motion Support */}
          <HeroInteractiveCard>
            {({ tilt, isHovered, heroCardRef, handleMouseMove, handleMouseEnter, handleMouseLeave, prefersReducedMotion }) => (
              <div
                className={`mt-14 max-w-4xl mx-auto ${prefersReducedMotion ? '' : '[perspective:1200px]'}`}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  ref={heroCardRef}
                  style={prefersReducedMotion ? undefined : {
                    transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                    transition: isHovered ? 'transform 0.12s ease-out' : 'transform 0.5s ease-out'
                  }}
                  className="relative rounded-2xl border border-[#333333] bg-[#1A1A1A]/95 p-5 sm:p-7 shadow-2xl text-left backdrop-blur transition-shadow hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                >
                  {/* Subtle dynamic shine overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/[0.04] to-transparent opacity-60"
                    style={prefersReducedMotion ? undefined : {
                      transform: `translate(${tilt.y * 2}px, ${tilt.x * 2}px)`
                    }}
                  />

                  <div className="flex items-center justify-between border-b border-[#333333] pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#333333]" />
                      <div className="h-3 w-3 rounded-full bg-[#333333]" />
                      <div className="h-3 w-3 rounded-full bg-[#333333]" />
                      <span className="font-mono-micro text-[#6B6B6B] ml-2">VAULT_ENGINE // SPATIAL_PIPELINE</span>
                    </div>
                    <span className="font-mono-micro text-white bg-[#0B0B0B] px-2.5 py-0.5 rounded border border-[#333333] flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      REALTIME SYNCHRONIZED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl border border-[#333333] bg-[#0B0B0B] transition hover:border-[#6B6B6B]">
                      <span className="font-mono-micro text-[#6B6B6B] block mb-1">INPUT SOURCE</span>
                      <p className="text-xs font-semibold text-white">Instagram Share Sheet</p>
                      <p className="text-[11px] text-[#6B6B6B] mt-1">Silent background intercept with zero UI friction</p>
                    </div>

                    <div className="p-4 rounded-xl border border-[#333333] bg-[#0B0B0B] transition hover:border-[#6B6B6B]">
                      <span className="font-mono-micro text-[#6B6B6B] block mb-1">SCRAPER PIPELINE</span>
                      <p className="text-xs font-semibold text-white">Captions, AI Summary, Tags</p>
                      <p className="text-[11px] text-[#6B6B6B] mt-1">First-class entity parsing &amp; poster retention</p>
                    </div>

                    <div className="p-4 rounded-xl border border-[#333333] bg-[#0B0B0B] transition hover:border-[#6B6B6B]">
                      <span className="font-mono-micro text-[#6B6B6B] block mb-1">STORAGE CLOUD</span>
                      <p className="text-xs font-semibold text-white">Curated Pillars &amp; Save Later</p>
                      <p className="text-[11px] text-[#6B6B6B] mt-1">Structured taxonomy with Postgres RLS</p>
                    </div>
                  </div>

                  {/* Bottom active status bar */}
                  <div className="mt-4 pt-3 border-t border-[#333333]/80 flex flex-wrap items-center justify-between text-[11px] text-[#6B6B6B] font-mono">
                    <span className="flex items-center gap-1">
                      <span className="text-white">●</span> Native Android Share Intent
                    </span>
                    <span className="text-[#999999]">
                      {prefersReducedMotion ? 'Spatial tilt disabled (reduced motion)' : 'Hover or tilt to explore spatial layers'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </HeroInteractiveCard>
        </div>
      </section>

      {/* 2. MANDATORY HORIZONTAL SCROLL SECTION 1: ARCHITECTURE CAPABILITIES */}
      <section className="border-b border-[#333333] py-16 bg-[#0B0B0B]/70 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="font-mono-micro text-[#6B6B6B] block mb-1">[INTERACTIVE CAROUSEL]</span>
            <h2 className="font-zolo text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Vault Engine Architecture
            </h2>
          </div>
          <span className="font-mono-micro text-[#6B6B6B]">Scroll horizontally →</span>
        </div>

        {/* Smooth horizontal scroll row */}
        <div
          role="region"
          tabIndex={0}
          aria-label="Vault engine architecture capabilities"
          className="flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 pt-2 no-scrollbar scroll-smooth motion-reduce:scroll-auto focus:outline-none focus:ring-1 focus:ring-zinc-700"
        >
          {horizontalFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.num}
                className="min-w-[280px] sm:min-w-[320px] max-w-[340px] shrink-0 rounded-2xl border border-[#333333] bg-[#1A1A1A]/90 p-5 flex flex-col justify-between hover:border-[#6B6B6B] transition shadow-sm hover:scale-[1.02] active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono-micro text-[#6B6B6B]">{feat.num}</span>
                    <span className="font-mono-micro text-white bg-[#0B0B0B] px-2 py-0.5 rounded border border-[#333333]">
                      {feat.tag}
                    </span>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-[#0B0B0B] border border-[#333333] flex items-center justify-center text-white mb-3">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-zolo text-base font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-xs text-[#999999] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. MANDATORY HORIZONTAL SCROLL SECTION 2: LIVE EXTRACTION REEL STREAM */}
      <section className="border-b border-[#333333] py-16 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="font-mono-micro text-[#6B6B6B] block mb-1">[CURATED REEL STREAM]</span>
            <h2 className="font-zolo text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Live Vault Stream &amp; Categorization
            </h2>
          </div>
          <span className="font-mono-micro text-[#6B6B6B]">Swipe to inspect items →</span>
        </div>

        {/* Gallery horizontal scroll row */}
        <div
          role="region"
          tabIndex={0}
          aria-label="Live vault stream and media extraction gallery"
          className="flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 pt-2 no-scrollbar scroll-smooth motion-reduce:scroll-auto focus:outline-none focus:ring-1 focus:ring-zinc-700"
        >
          {horizontalGallery.map((item, idx) => (
            <div
              key={idx}
              className={`min-w-[260px] sm:min-w-[300px] shrink-0 rounded-2xl border border-[#333333] bg-gradient-to-b ${item.color} to-[#1A1A1A] p-5 flex flex-col justify-between hover:border-[#D9D9D9] transition shadow-md hover:scale-[1.02]`}
            >
              <div>
                <span className="font-mono-micro px-2 py-0.5 rounded bg-black/60 border border-[#333333] text-white block w-fit mb-3">
                  {item.badge}
                </span>
                <div className="aspect-video w-full rounded-xl bg-black/40 border border-white/10 mb-3 flex items-center justify-center">
                  <Play className="h-6 w-6 text-white/80 fill-white/80" />
                </div>
                <h4 className="font-zolo text-sm font-bold text-white mb-1 line-clamp-2">{item.title}</h4>
                <p className="font-mono-micro text-[#999999]">{item.creator}</p>
              </div>
              <span className="font-mono-micro text-[9px] text-[#6B6B6B] mt-4 pt-2 border-t border-white/10 block">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CONCRETE DELIVERABLES */}
      <section id="deliverables" className="border-b border-[#333333] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-14 gap-4">
            <div>
              <span className="font-mono-micro text-[#6B6B6B] block mb-2">[CORE CAPABILITIES]</span>
              <h2 className="font-zolo text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Concrete Deliverables
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#999999] max-w-md">
              What you receive the moment you link your device to the Watch Later vault.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deliverables.map((item) => (
              <div
                key={item.num}
                className="group relative rounded-2xl border border-[#333333] bg-[#1A1A1A]/90 p-6 sm:p-8 hover:border-[#6B6B6B] transition shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono-micro text-[#6B6B6B]">{item.num} {'//'} DELIVERABLE</span>
                  <span className="font-mono-micro text-white bg-[#0B0B0B] px-2 py-0.5 rounded border border-[#333333]">
                    {item.tag}
                  </span>
                </div>
                <h3 className="font-zolo text-xl font-bold text-white tracking-tight mb-2 group-hover:text-white transition">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#999999] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PROCESS TRANSPARENCY: Step-by-Step Architecture */}
      <section className="border-b border-[#333333] py-20 bg-[#0B0B0B]/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono-micro text-[#6B6B6B] block mb-2">[WORKFLOW TRANSPARENCY]</span>
            <h2 className="font-zolo text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Our 4-Stage Extraction Process
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#999999]">
              How a single tap on your mobile phone turns into an organized knowledge library.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step) => (
              <div key={step.step} className="relative rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-zolo text-2xl font-bold text-white">{step.step}</span>
                    <span className="font-mono-micro text-[#6B6B6B] border border-[#333333] px-1.5 py-0.5 rounded bg-[#0B0B0B]">
                      {step.badge}
                    </span>
                  </div>
                  <h4 className="font-zolo text-base font-semibold text-white mb-2">{step.title}</h4>
                  <p className="text-xs text-[#999999] leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. RESULTS & PROOF */}
      <section className="border-b border-[#333333] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="font-mono-micro text-[#6B6B6B] block mb-2">[VERIFIED BENCHMARKS]</span>
            <h2 className="font-zolo text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Numbers &amp; Engineering Proof
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {proofMetrics.map((metric, i) => (
              <div key={i} className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-6 text-center">
                <div className="font-zolo text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
                  <span>{metric.prefix || ''}</span>
                  <NumberTicker value={metric.valueNum} />
                  <span>{metric.suffix || ''}</span>
                </div>
                <h4 className="font-zolo text-xs sm:text-sm font-semibold text-white mb-1">{metric.label}</h4>
                <p className="text-[11px] text-[#6B6B6B]">{metric.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="border-b border-[#333333] py-20 bg-[#0B0B0B]/70">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="font-mono-micro text-[#6B6B6B] block mb-2">[COMMON QUESTIONS]</span>
            <h2 className="font-zolo text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 overflow-hidden transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-white transition hover:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-[#6B6B6B] transition-transform ${openFaq === idx ? 'rotate-180 text-white' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-[#999999] leading-relaxed border-t border-[#333333]/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION */}
      <section className="py-24 relative overflow-hidden text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="font-mono-micro text-[#6B6B6B] block mb-3">[GET STARTED]</span>
          <h2 className="font-zolo text-3xl sm:text-5xl font-bold text-white tracking-tight mb-6">
            Build your private media brain today.
          </h2>
          <p className="text-sm sm:text-base text-[#999999] max-w-xl mx-auto mb-10 leading-relaxed">
            Stop losing valuable recipes, technical guides, architectural inspo, and workouts to Instagram&apos;s bottomless algorithm.
          </p>
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                if (hasSession) onEnterDashboard?.();
                else {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }
              }}
              className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-black transition hover:bg-[#D9D9D9] active:scale-95 shadow-2xl"
            >
              <span>{hasSession ? 'Go To Vault Dashboard' : 'Create Free Account'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#333333] py-8 text-center text-xs text-[#6B6B6B]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Watch Later" className="h-5 w-5 rounded object-cover" />
            <span className="font-zolo font-semibold text-white">Watch Later</span>
            <span>— Never lose a reel worth revisiting.</span>
          </div>
          <span className="font-mono-micro">AUTONOMOUS MEDIA ARCHIVING SERVICE</span>
        </div>
      </footer>

      {/* AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-up"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#333333] bg-[#1A1A1A] p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <img src="/logo.jpg" alt="Logo" className="h-7 w-7 rounded-lg object-cover" />
                <span className="font-zolo text-lg font-bold text-white">Watch Later</span>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-[#6B6B6B] hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="font-zolo text-xl font-bold text-white mb-1">
              {authMode === 'signin' ? 'Sign in to your Vault' : 'Create your Vault Account'}
            </h3>
            <p className="text-xs text-[#999999] mb-6">
              {authMode === 'signin' ? 'Enter your credentials to access your saved library.' : 'Free instant setup. Zero credit card required.'}
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#999999]">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1 w-full rounded-lg border border-[#333333] bg-[#0B0B0B] px-3 py-2 text-sm text-white placeholder-[#6B6B6B] focus:border-[#D9D9D9] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#999999]">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#333333] bg-[#0B0B0B] px-3 py-2 pr-10 text-sm text-white placeholder-[#6B6B6B] focus:border-[#D9D9D9] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#6B6B6B] hover:text-white"
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
                className="w-full rounded-lg bg-[#D9D9D9] text-[#0B0B0B] py-2.5 text-sm font-semibold transition hover:bg-white active:scale-[0.99] disabled:opacity-50"
              >
                {authLoading ? 'Authenticating...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                  setAuthError(null);
                }}
                className="text-xs text-[#999999] hover:text-white transition"
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
