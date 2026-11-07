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
  Bookmark,
  Share2,
  Trash2,
  AlertOctagon,
  Clock,
  Sparkle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SplashCursor from '@/components/SplashCursor';

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
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
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

  // Video Demo interactive state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

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

  // Pipeline steps for the interactive horizontal scroll
  const pipelineSteps = [
    {
      step: '01',
      title: 'Share the Reel',
      action: 'Native Share Sheet',
      desc: 'Tap share on any Instagram Reel and pick Watch Later. Exactly like sharing to a friend, but this time it actually gets handled.',
      badge: 'Zero New Habits',
      color: 'from-blue-500/20 to-sky-500/5',
      stateVisual: (
        <div className="rounded-xl border border-[#333333] bg-[#0B0B0B] p-3 text-left">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="h-4 w-4 text-sky-400" />
            <span className="font-mono-micro text-white">SYSTEM SHARE SHEET</span>
          </div>
          <div className="flex items-center gap-2 bg-[#1A1A1A] p-2 rounded-lg border border-[#333333]">
            <img src="/logo.jpg" alt="App" className="h-6 w-6 rounded object-cover" />
            <div className="text-[11px] leading-tight">
              <p className="text-white font-medium">Watch Later</p>
              <p className="text-[#6B6B6B] text-[10px]">Tap once → Back to Instagram</p>
            </div>
          </div>
        </div>
      )
    },
    {
      step: '02',
      title: 'Silent Background Capture',
      action: 'No Screens Opened',
      desc: 'The Android app captures the URL silently. No form pops up, no tagging prompts interrupt your flow. You never leave your feed.',
      badge: 'Target ~3-4s',
      color: 'from-purple-500/20 to-violet-500/5',
      stateVisual: (
        <div className="rounded-xl border border-[#333333] bg-[#0B0B0B] p-3 text-left">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#6B6B6B] mb-2">
            <span>INTENT STATUS</span>
            <span className="text-emerald-400 font-semibold">200 OK</span>
          </div>
          <p className="text-xs text-white font-medium">Capture confirmed silently</p>
          <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-400 h-full w-full animate-pulse" />
          </div>
        </div>
      )
    },
    {
      step: '03',
      title: 'Extraction & Automatic Sorting',
      action: 'Captions, Audio & AI',
      desc: 'Our engine extracts the real transcript, creator info, and key takeaways, placing the reel into clean categories without manual tags.',
      badge: 'Zero Manual Tagging',
      color: 'from-emerald-500/20 to-teal-500/5',
      stateVisual: (
        <div className="rounded-xl border border-[#333333] bg-[#0B0B0B] p-3 text-left">
          <span className="font-mono-micro text-[#6B6B6B] block mb-1">PARSED METADATA</span>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300">Category: Engineering</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800 text-blue-300">Transcript Synced</span>
          </div>
        </div>
      )
    },
    {
      step: '04',
      title: 'Centralized Clean Library',
      action: 'Pick a Niche & Learn',
      desc: 'Your dashboard is a clean library, not a messy dumping ground. Pick a niche, extract knowledge, and actually digest what you saved.',
      badge: 'Curated Dashboard',
      color: 'from-amber-500/20 to-orange-500/5',
      stateVisual: (
        <div className="rounded-xl border border-[#333333] bg-[#0B0B0B] p-3 text-left">
          <div className="flex items-center justify-between text-[11px] text-white font-medium mb-1">
            <span>Library Status</span>
            <span className="text-amber-400">Organized</span>
          </div>
          <p className="text-[11px] text-[#6B6B6B]">Insight: 45% Tech, 30% Architecture, 25% Cooking</p>
        </div>
      )
    },
    {
      step: '05',
      title: 'Auto-Cleans Watched Posts',
      action: 'Zero Stale Backlog',
      desc: 'Once watched or archived, reels get automatically cleared out so clutter never accumulates. Dead categories retire naturally.',
      badge: 'Self-Cleaning',
      color: 'from-rose-500/20 to-red-500/5',
      stateVisual: (
        <div className="rounded-xl border border-[#333333] bg-[#0B0B0B] p-3 text-left flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-rose-400" />
            <span className="text-xs text-white">Watched Items Purged</span>
          </div>
          <span className="font-mono-micro text-[#6B6B6B]">Cap: 1 Week</span>
        </div>
      )
    }
  ];

  // Curated niches preview for The Dashboard section
  const dashboardNiches = [
    { name: 'Engineering & Systems', count: 18, desc: 'Distributed queues, Rust concurrency, database indexing', color: 'border-blue-500/30 bg-blue-500/5' },
    { name: 'Design Craft & Motion', count: 14, desc: 'Kinetic typography, concentric radii, spatial depth', color: 'border-purple-500/30 bg-purple-500/5' },
    { name: 'Culinary Techniques', count: 9, desc: 'Sourdough starter ratios, high-heat wok tossing', color: 'border-amber-500/30 bg-amber-500/5' },
    { name: 'Strength & Mobility', count: 11, desc: 'Desk posture decompression, rotator cuff rehab', color: 'border-emerald-500/30 bg-emerald-500/5' }
  ];

  const faqs = [
    {
      q: 'Does the app open every time I share a reel?',
      a: 'No. Watch Later registers a silent Android share intent. When you tap share on Instagram, our capture activity immediately intercepts the link in the background and dismisses itself instantly. You remain right where you were in your feed.'
    },
    {
      q: 'What happens if a reel cannot be extracted or is private?',
      a: 'Watch Later never guesses, fakes, or hallucinates categories or summaries for unreachable media. If a reel is private, deleted, or blocked by Instagram, it is placed directly into a clearly marked "Failed" folder so you know the honest status rather than seeing fabricated data.'
    },
    {
      q: 'How is this different from Instagram’s own Saved folder?',
      a: 'Instagram Saved is a chronological junk drawer where saves go to die. Watch Later extracts the actual substance — transcripts, captions, key ideas — categorizes it automatically, provides search across what was spoken, and auto-purges reels once you’ve watched them so you never drown in backlog.'
    },
    {
      q: 'Is iOS currently supported?',
      a: 'Watch Later is built Android-first with native background share sheet capture. The web dashboard works across all modern mobile and desktop browsers. An iOS native share extension using the same backend infrastructure is on the roadmap.'
    },
    {
      q: 'Does Watch Later keep dead categories forever?',
      a: 'No. As completed reels are watched and automatically cleaned up, categories that no longer contain active reels get retired automatically. Your dashboard stays current with what you care about now, not dead folders from six months ago.'
    }
  ];

  // Play video demo sequence
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVideoPlaying) {
      timer = setInterval(() => {
        setDemoStep((prev) => (prev + 1) % 4);
      }, 2400);
    }
    return () => clearInterval(timer);
  }, [isVideoPlaying]);

  return (
    <div className="relative min-h-screen bg-fabric text-[#D9D9D9] font-sans antialiased selection:bg-[#333333] selection:text-white">
      {/* Interactive Fluid SplashCursor background effect */}
      <SplashCursor
        rainbow
        size={0.65}
        force={0.3}
        swirl={13.5}
        trail={2.8}
        clickSplash
        colorSpeed={0.45}
        intensity={0.5}
        momentum={0.7}
        glow={0.15}
        quality="low"
        intro={false}
      />

      {/* 2.1 Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#333333] bg-[#0B0B0B]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Watch Later" className="h-8 w-8 rounded-lg object-cover" />
            <div>
              <span className="font-zolo text-lg font-bold tracking-tight text-white block leading-none">Watch Later</span>
              <span className="font-mono-micro text-[#6B6B6B] block mt-0.5">SHARE, DON&apos;T SAVE</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#how-it-works"
              className="hidden sm:inline-block text-xs font-mono text-[#999999] hover:text-white transition"
            >
              How It Works
            </a>
            <a
              href="#faq"
              className="hidden sm:inline-block text-xs font-mono text-[#999999] hover:text-white transition"
            >
              FAQ
            </a>

            {hasSession ? (
              <button
                onClick={onEnterDashboard}
                className="flex items-center gap-2 rounded-lg border border-[#333333] bg-[#1A1A1A] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#252525] active:scale-[0.98]"
              >
                <span>Open Vault</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-2 rounded-lg border border-[#333333] bg-[#1A1A1A] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#252525] active:scale-[0.98]"
              >
                <span>Sign In</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2.2 HERO SECTION: Exactly One Primary CTA (Install APK) + Tagline */}
      <section className="relative overflow-hidden border-b border-[#333333] pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#333333] bg-[#1A1A1A]/80 px-3.5 py-1 mb-6 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono-micro text-[#D9D9D9]">ANDROID APK v1.0 • SILENT SHARE SHEET INTERCEPT</span>
          </div>

          {/* Exact Tagline treated as hero headline */}
          <h1 className="font-zolo text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.08] text-balance">
            Never lose a reel worth revisiting.
          </h1>

          {/* One supporting line explaining the actual mechanism */}
          <p className="mt-6 text-sm sm:text-base lg:text-lg text-[#999999] max-w-2xl mx-auto leading-relaxed">
            Share reels straight from Instagram into Watch Later with a single tap. They are captured silently, transcribed, organized into clean categories, and auto-cleaned once watched.
          </p>

          {/* EXACTLY ONE PRIMARY HERO CTA BUTTON: DOWNLOAD / INSTALL ANDROID APK */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3">
            <a
              href="/watch-later.apk"
              download="watch-later.apk"
              className="group relative inline-flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-base font-bold text-black transition-all duration-200 hover:bg-[#E5E5E5] hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]"
            >
              <Download className="h-5 w-5 text-black transition-transform group-hover:-translate-y-0.5" />
              <span>Download Android App (APK)</span>
            </a>
            <span className="text-[11px] font-mono text-[#6B6B6B]">
              Direct APK • Native background capture • No forms or screens
            </span>
          </div>

          {/* SECTION 1.2: THE ONE SINGLE REAL DEMO VIDEO (THE BRAG MOMENT) */}
          <div className="mt-14 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/95 p-2 shadow-2xl backdrop-blur overflow-hidden">
              <div className="relative aspect-video w-full rounded-xl bg-[#0B0B0B] border border-[#222222] flex flex-col items-center justify-center overflow-hidden">
                {!isVideoPlaying ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#111111] to-[#0B0B0B]">
                    <div className="h-16 w-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 transition transform hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
                      onClick={() => setIsVideoPlaying(true)}
                    >
                      <Play className="h-7 w-7 text-white fill-white ml-1" />
                    </div>
                    <span className="font-mono-micro text-[#6B6B6B] block mb-1">PRODUCT DEMO // ZERO-UI CAPTURE</span>
                    <h3 className="font-zolo text-lg font-bold text-white mb-2">Watch the 10-Second Mechanism in Action</h3>
                    <p className="text-xs text-[#999999] max-w-md">
                      See how sharing directly from Instagram instantly categorizes a post and cleans it once watched.
                    </p>
                    <button
                      onClick={() => setIsVideoPlaying(true)}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#222222] hover:bg-[#333333] px-3.5 py-1.5 rounded-lg border border-[#333333] transition"
                    >
                      <span>Play Interactive Demo</span>
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full p-6 flex flex-col justify-between bg-black/90 text-left">
                    <div className="flex items-center justify-between border-b border-[#333333] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-mono-micro text-white">LIVE DEMO SIMULATION</span>
                      </div>
                      <button
                        onClick={() => {
                          setIsVideoPlaying(false);
                          setDemoStep(0);
                        }}
                        className="text-xs text-[#6B6B6B] hover:text-white font-mono"
                      >
                        Reset Demo ✕
                      </button>
                    </div>

                    <div className="my-auto py-4">
                      {demoStep === 0 && (
                        <div className="animate-fade-up">
                          <span className="font-mono-micro text-sky-400 block mb-1">01 // INSTAGRAM SHARE SHEET</span>
                          <h4 className="font-zolo text-xl font-bold text-white mb-2">User taps &quot;Share to Watch Later&quot;</h4>
                          <p className="text-xs text-[#999999]">No dialog or folder picker opens. App returns directly to your Instagram feed.</p>
                        </div>
                      )}
                      {demoStep === 1 && (
                        <div className="animate-fade-up">
                          <span className="font-mono-micro text-purple-400 block mb-1">02 // BACKGROUND ENGINE</span>
                          <h4 className="font-zolo text-xl font-bold text-white mb-2">Silent Metadata &amp; Transcript Parse</h4>
                          <p className="text-xs text-[#999999]">Captures caption, author handle, and audio transcript without waking user UI.</p>
                        </div>
                      )}
                      {demoStep === 2 && (
                        <div className="animate-fade-up">
                          <span className="font-mono-micro text-emerald-400 block mb-1">03 // AUTOMATIC TAXONOMY</span>
                          <h4 className="font-zolo text-xl font-bold text-white mb-2">Sorted into &quot;Architecture &amp; Systems&quot;</h4>
                          <p className="text-xs text-[#999999]">AI assigns existing parent pillar without creating duplicate or hallucinated tags.</p>
                        </div>
                      )}
                      {demoStep === 3 && (
                        <div className="animate-fade-up">
                          <span className="font-mono-micro text-amber-400 block mb-1">04 // WATCHED &amp; AUTO-CLEANED</span>
                          <h4 className="font-zolo text-xl font-bold text-white mb-2">Reel marked watched → cleared from queue</h4>
                          <p className="text-xs text-[#999999]">Queue stays pristine. No backlog piles up to haunt you later.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#333333]">
                      {[0, 1, 2, 3].map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setDemoStep(step)}
                          aria-label={`Demo step ${step + 1} of 4`}
                          aria-current={demoStep === step ? 'step' : undefined}
                          className={`h-1.5 flex-1 rounded-full transition-all ${demoStep === step ? 'bg-white' : 'bg-[#333333]'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3D Spatial Interactive Card with Perspective Tilt */}
          <HeroInteractiveCard>
            {({ tilt, isHovered, heroCardRef, handleMouseMove, handleMouseEnter, handleMouseLeave, prefersReducedMotion }) => (
              <div
                className={`mt-10 max-w-4xl mx-auto ${prefersReducedMotion ? '' : '[perspective:1200px]'}`}
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
                  <div className="flex items-center justify-between border-b border-[#333333] pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#333333]" />
                      <div className="h-3 w-3 rounded-full bg-[#333333]" />
                      <div className="h-3 w-3 rounded-full bg-[#333333]" />
                      <span className="font-mono-micro text-[#6B6B6B] ml-2">INTERACTIVE PIPELINE // PERSPECTIVE VIEW</span>
                    </div>
                    <span className="font-mono-micro text-white bg-[#0B0B0B] px-2.5 py-0.5 rounded border border-[#333333] flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      SILENT CAPTURE READY
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl border border-[#333333] bg-[#0B0B0B] transition hover:border-[#6B6B6B]">
                      <span className="font-mono-micro text-[#6B6B6B] block mb-1">01 • ONE SINGLE ACTION</span>
                      <p className="text-xs font-semibold text-white">Share from Instagram</p>
                      <p className="text-[11px] text-[#6B6B6B] mt-1">Silent background intercept; no popup forms or interrupted scrolling</p>
                    </div>

                    <div className="p-4 rounded-xl border border-[#333333] bg-[#0B0B0B] transition hover:border-[#6B6B6B]">
                      <span className="font-mono-micro text-[#6B6B6B] block mb-1">02 • SUBSTANCE EXTRACTION</span>
                      <p className="text-xs font-semibold text-white">Automatic Categorization</p>
                      <p className="text-[11px] text-[#6B6B6B] mt-1">Extracts caption, transcript &amp; author into clean niches</p>
                    </div>

                    <div className="p-4 rounded-xl border border-[#333333] bg-[#0B0B0B] transition hover:border-[#6B6B6B]">
                      <span className="font-mono-micro text-[#6B6B6B] block mb-1">03 • ZERO ACCUMULATION</span>
                      <p className="text-xs font-semibold text-white">Self-Cleaning Library</p>
                      <p className="text-[11px] text-[#6B6B6B] mt-1">Watched items auto-clear; inactive categories retire automatically</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#333333]/80 flex flex-wrap items-center justify-between text-[11px] text-[#6B6B6B] font-mono">
                    <span className="flex items-center gap-1">
                      <span className="text-white">●</span> Direct Android APK
                    </span>
                    <span className="text-[#999999]">
                      {prefersReducedMotion ? 'Spatial tilt disabled' : 'Tilt mouse to inspect physical depth'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </HeroInteractiveCard>
        </div>
      </section>

      {/* 2.3 THE PROBLEM: Brief, Honest, Human */}
      <section className="border-b border-[#333333] py-20 bg-[#0B0B0B]/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="font-mono-micro text-[#6B6B6B] block mb-2">[THE PAIN]</span>
          <h2 className="font-zolo text-3xl sm:text-4xl font-bold text-white tracking-tight">
            You save reels to watch later. You never watch them.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#999999] leading-relaxed max-w-2xl mx-auto">
            Your saves end up scattered across Instagram&apos;s own Saved folder, random DM threads to yourself, screenshots, and notes apps. Nothing is organized, nothing gets revisited, and eventually it&apos;s just clutter you avoid opening.
          </p>
        </div>
      </section>

      {/* 2.4 HOW IT WORKS: Horizontal Scroll Pipeline */}
      <section id="how-it-works" className="border-b border-[#333333] py-20 bg-[#0B0B0B]/80 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="font-mono-micro text-[#6B6B6B] block mb-1">[THE PIPELINE]</span>
            <h2 className="font-zolo text-2xl sm:text-4xl font-bold text-white tracking-tight">
              How It Actually Works
            </h2>
            <p className="text-xs sm:text-sm text-[#999999] mt-1">
              One simple habit replacement. Move through the 5-step pipeline.
            </p>
          </div>
          <span className="font-mono-micro text-[#6B6B6B]">Swipe horizontally →</span>
        </div>

        {/* Horizontal scroll container with scroll snap */}
        <div
          role="region"
          tabIndex={0}
          aria-label="How it works pipeline sequence"
          className="flex gap-5 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-6 pt-2 no-scrollbar scroll-smooth snap-x focus:outline-none focus:ring-1 focus:ring-zinc-700"
        >
          {pipelineSteps.map((step) => (
            <div
              key={step.step}
              className={`snap-center min-w-[300px] sm:min-w-[340px] max-w-[360px] shrink-0 rounded-2xl border border-[#333333] bg-gradient-to-b ${step.color} to-[#141414] p-6 flex flex-col justify-between hover:border-[#6B6B6B] transition-transform duration-200 hover:scale-[1.02] shadow-lg`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-zolo text-2xl font-bold text-white">{step.step}</span>
                  <span className="font-mono-micro text-white bg-black/60 px-2 py-0.5 rounded border border-[#333333]">
                    {step.badge}
                  </span>
                </div>
                <h3 className="font-zolo text-lg font-bold text-white mb-1">{step.title}</h3>
                <span className="font-mono-micro text-sky-400 block mb-3">{step.action}</span>
                <p className="text-xs text-[#999999] leading-relaxed mb-6">{step.desc}</p>
              </div>

              {step.stateVisual}
            </div>
          ))}
        </div>

        {/* Explicit Honest Trust Signal: Failed Folder (Never Hallucinates) */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-12">
          <div className="rounded-2xl border border-[#333333] bg-[#141414] p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="h-12 w-12 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center justify-center shrink-0">
              <AlertOctagon className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono-micro text-red-400">INTEGRITY POLICY</span>
                <span className="font-mono-micro text-[#6B6B6B]">•</span>
                <span className="text-xs font-semibold text-white">Never Guessing, Never Hallucinating</span>
              </div>
              <p className="text-xs sm:text-sm text-[#999999] leading-relaxed">
                If extraction genuinely fails for a reel because it was deleted, set to private, or blocked by Instagram, Watch Later will <span className="text-white font-medium">never fabricate or hallucinate a summary or fake category</span>. It is placed in a clearly labeled <span className="text-red-400 font-mono font-medium">Failed</span> folder so you always know the exact truth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 THE DASHBOARD / WHAT YOU GET */}
      <section className="border-b border-[#333333] py-20 bg-[#0B0B0B]/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="font-mono-micro text-[#6B6B6B] block mb-2">[THE DESTINATION]</span>
              <h2 className="font-zolo text-3xl sm:text-4xl font-bold text-white tracking-tight">
                A Library You Actually Want to Open
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#999999] max-w-md">
              Not a dumping ground. Pick a niche, extract knowledge, and get on with your day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {dashboardNiches.map((niche, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border p-6 transition-all hover:scale-[1.01] ${niche.color}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-zolo text-lg font-bold text-white">{niche.name}</h3>
                  <span className="font-mono-micro px-2 py-0.5 rounded bg-black/60 border border-white/10 text-white">
                    {niche.count} Active Posts
                  </span>
                </div>
                <p className="text-xs text-[#999999] leading-relaxed">{niche.desc}</p>
              </div>
            ))}
          </div>

          {/* Light personality insight callout */}
          <div className="mt-8 rounded-2xl border border-[#333333] bg-[#141414] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkle className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Lightweight Interest Insights</p>
                <p className="text-[11px] text-[#999999]">Over time, your library surfaces subtle reflections of what you genuinely gravitate toward.</p>
              </div>
            </div>
            <span className="font-mono-micro text-[#6B6B6B] shrink-0">AUTOMATIC DERIVATION</span>
          </div>
        </div>
      </section>

      {/* 2.6 PROOF / CREDIBILITY (Real targets & Honest Architecture) */}
      <section className="border-b border-[#333333] py-20 bg-[#0B0B0B]/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="font-mono-micro text-[#6B6B6B] block mb-2">[HONEST SPECIFICATIONS]</span>
            <h2 className="font-zolo text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Designed for Real-World Reliability
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#999999]">
              Engineered targets grounded in direct mobile hooks, not synthetic marketing claims.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-6 text-center">
              <span className="font-mono-micro text-sky-400 block mb-2">TARGET PERFORMANCE</span>
              <div className="font-zolo text-3xl font-bold text-white mb-2">~3-4s</div>
              <h4 className="text-xs font-semibold text-white mb-1">Capture &amp; Process Target</h4>
              <p className="text-[11px] text-[#6B6B6B]">Typical round-trip from mobile share sheet to parsed cloud library availability.</p>
            </div>

            <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-6 text-center">
              <span className="font-mono-micro text-purple-400 block mb-2">ISOLATION</span>
              <div className="font-zolo text-3xl font-bold text-white mb-2">Row-Level</div>
              <h4 className="text-xs font-semibold text-white mb-1">Postgres RLS Security</h4>
              <p className="text-[11px] text-[#6B6B6B]">Every reel, summary, and category is isolated strictly to your authenticated session.</p>
            </div>

            <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 p-6 text-center">
              <span className="font-mono-micro text-emerald-400 block mb-2">LIFECYCLE</span>
              <div className="font-zolo text-3xl font-bold text-white mb-2">Auto-Purge</div>
              <h4 className="text-xs font-semibold text-white mb-1">Self-Cleaning Queues</h4>
              <p className="text-[11px] text-[#6B6B6B]">Watched posts exit the queue, ensuring no permanent hoarding or dead categories.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2.7 FAQ: Grounded in real mechanics */}
      <section id="faq" className="border-b border-[#333333] py-20 bg-[#0B0B0B]/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="font-mono-micro text-[#6B6B6B] block mb-2">[CLEAR ANSWERS]</span>
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

      {/* 2.8 FINAL CTA: Echoing Tagline with Exact Same Install Action */}
      <section className="py-24 relative overflow-hidden text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="font-mono-micro text-[#6B6B6B] block mb-3">[GET STARTED]</span>
          <h2 className="font-zolo text-3xl sm:text-5xl font-bold text-white tracking-tight mb-6 text-balance">
            Never lose a reel worth revisiting.
          </h2>
          <p className="text-sm sm:text-base text-[#999999] max-w-xl mx-auto mb-10 leading-relaxed">
            Replace the endless clutter of scattered DMs and forgotten bookmarks with a single, silent share action.
          </p>
          <div className="flex flex-col items-center justify-center gap-3">
            <a
              href="/watch-later.apk"
              download="watch-later.apk"
              className="group relative inline-flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-base font-bold text-black transition-all duration-200 hover:bg-[#E5E5E5] hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
            >
              <Download className="h-5 w-5 text-black transition-transform group-hover:-translate-y-0.5" />
              <span>Download Android App (APK)</span>
            </a>
            <span className="text-[11px] font-mono text-[#6B6B6B]">
              Ready to install • Free • Instant background capture
            </span>
          </div>
        </div>
      </section>

      {/* 2.9 FOOTER */}
      <footer className="border-t border-[#333333] py-8 text-center text-xs text-[#6B6B6B]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Watch Later" className="h-5 w-5 rounded object-cover" />
            <span className="font-zolo font-semibold text-white">Watch Later</span>
            <span>— Never lose a reel worth revisiting.</span>
          </div>
          <span className="font-mono-micro">NATIVE ANDROID SHARE INTERCEPT &amp; LIBRARY</span>
        </div>
      </footer>

      {/* AUTHENTICATION MODAL (For existing users signing in to web dashboard) */}
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
