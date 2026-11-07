'use client';

import { useState, useEffect, useRef, MouseEvent } from 'react';
import {
  Download,
  Share2,
  Trash2,
  AlertOctagon,
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
  BookmarkX
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

  // Interactive Live Pipeline simulator
  const [pipelineState, setPipelineState] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [autoPlayPipeline, setAutoPlayPipeline] = useState(true);

  // Video Demo state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoTimeline, setVideoTimeline] = useState(0);

  // Mouse coords for spatial perspective
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // FAQ accordion
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Motion preference
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Global mouse tracking for spatial tilt
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

  // Automated pipeline cycle
  useEffect(() => {
    if (!autoPlayPipeline) return;
    const t = setInterval(() => {
      setPipelineState((prev) => ((prev + 1) % 5) as 0 | 1 | 2 | 3 | 4);
    }, 3200);
    return () => clearInterval(t);
  }, [autoPlayPipeline]);

  // Video demo timeline ticker
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (isVideoPlaying) {
      t = setInterval(() => {
        setVideoTimeline((prev) => (prev + 1) % 4);
      }, 2500);
    }
    return () => clearInterval(t);
  }, [isVideoPlaying]);

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
      index: 0,
      number: '01',
      title: 'Instagram Share',
      subtitle: 'Native share sheet hook',
      description: 'Tap share on Instagram and choose Watch Later. Exactly like sending to a friend, but this time it actually gets digested.',
      tag: 'CLIENT HOOK',
      preview: {
        badge: 'INSTAGRAM INTENT',
        primary: 'Share to Watch Later',
        detail: 'Instant background capture · 0 UI dialogs'
      }
    },
    {
      index: 1,
      number: '02',
      title: 'Silent Intercept',
      subtitle: 'No popup forms or UI',
      description: 'The app catches the reel silently and dismisses. You never leave your feed, and no clumsy tagging dialog interrupts your flow.',
      tag: 'DAEMON WORKER',
      preview: {
        badge: 'BACKGROUND DAEMON',
        primary: 'Queue confirmed [200 OK]',
        detail: 'Target ~3-4s roundtrip availability'
      }
    },
    {
      index: 2,
      number: '03',
      title: 'Substance Extraction',
      subtitle: 'Audio, captions & transcripts',
      description: 'We pull the spoken transcript, caption text, and creator handle, clustering it automatically into logical pillars.',
      tag: 'AI PARSER',
      preview: {
        badge: 'TRANSCRIPTION',
        primary: 'Spoken speech converted to text',
        detail: 'Category: Systems Architecture'
      }
    },
    {
      index: 3,
      number: '04',
      title: 'Central Library',
      subtitle: 'Organized niche pillars',
      description: 'Your dashboard is a clean library, not a graveyard. Pick a niche, extract knowledge, and actually digest what you saved.',
      tag: 'KNOWLEDGE BASE',
      preview: {
        badge: 'PILLAR SYSTEM',
        primary: '4 Active Curated Pillars',
        detail: 'Tech · Design Craft · Culinary · Mobility'
      }
    },
    {
      index: 4,
      number: '05',
      title: 'Auto-Cleans Watched',
      subtitle: 'Zero stale backlog forever',
      description: 'Once watched, reels auto-purge from the active queue. Dead categories retire naturally so stale clutter never accumulates.',
      tag: 'QUEUE PURGE',
      preview: {
        badge: 'SELF-CLEANING',
        primary: 'Watched post purged',
        detail: 'Queue stays pristine · No hoarding guilt'
      }
    }
  ];

  const editorialNiches = [
    { id: '01', title: 'Systems & Architecture', count: '18 SAVED', description: 'Distributed consensus, write-ahead logs, database locking internals.' },
    { id: '02', title: 'Kinetic UI & Physics', count: '14 SAVED', description: 'Spring easing curves, concentric radii, subpixel font smoothing.' },
    { id: '03', title: 'Culinary Techniques', count: '09 SAVED', description: 'Sourdough starter hydration, dough hydration curves, wok tossing.' },
    { id: '04', title: 'Movement & Mobility', count: '11 SAVED', description: 'Desk posture rehab, thoracic mobility, wrist decompression.' }
  ];

  const faqs = [
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
    <div className="relative min-h-screen bg-[#09090b] text-[#f4f4f5] selection:bg-white selection:text-black antialiased font-sans overflow-x-clip">
      {/* Dynamic Fluid Ink Canvas */}
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

      {/* Grid Pattern Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035]"
        style={{
          backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />

      {/* Top Editorial Nav Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="h-8 w-8 rounded-lg border border-white/10 object-cover" />
            <div>
              <span className="font-zolo text-base font-bold tracking-tight text-white block leading-none">Watch Later</span>
              <span className="font-mono text-[10px] tracking-widest text-[#71717a] block mt-0.5">SHARE, DON&apos;T SAVE</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href="#pipeline" className="hidden sm:inline-block font-mono text-xs text-[#a1a1aa] hover:text-white transition">
              The Pipeline
            </a>
            <a href="#library" className="hidden sm:inline-block font-mono text-xs text-[#a1a1aa] hover:text-white transition">
              Library
            </a>
            <a href="#faq" className="hidden sm:inline-block font-mono text-xs text-[#a1a1aa] hover:text-white transition">
              FAQ
            </a>

            {hasSession ? (
              <button
                type="button"
                onClick={onEnterDashboard}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 hover:border-white/40 active:scale-[0.98]"
              >
                <span>Enter Library</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 hover:border-white/40 active:scale-[0.98]"
              >
                <span>Sign in</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO SECTION: Monumental Typography & Kinetic Architecture */}
        <section className="relative pt-24 pb-20 sm:pt-36 sm:pb-32 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            {/* Top Status Capsule */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 mb-8 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] tracking-wider text-[#d4d4d8]">ANDROID APK v1.0 • SILENT SHARE SHEET INTERCEPT</span>
            </div>

            {/* Monumental Headline */}
            <h1 className="font-zolo text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[-0.05em] text-white leading-[0.92] text-balance max-w-6xl">
              Never lose a reel worth revisiting.
            </h1>

            {/* Editorial Lead Paragraph */}
            <div className="mt-8 sm:mt-12 flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8 border-t border-white/10">
              <p className="text-lg sm:text-xl md:text-2xl font-light text-[#a1a1aa] max-w-2xl leading-relaxed text-balance">
                Share reels from Instagram straight to Watch Later with one tap. They are captured silently, transcribed into text, grouped into focused pillars, and auto-cleaned once watched.
              </p>

              {/* EXACTLY ONE HERO CTA BUTTON: DOWNLOAD ANDROID APK */}
              <div className="shrink-0 flex flex-col items-start md:items-end gap-2.5">
                <a
                  href="/watch-later.apk"
                  download="watch-later.apk"
                  className="group relative inline-flex items-center gap-3 rounded-full bg-white px-8 py-5 text-base font-bold text-black transition-all duration-300 hover:bg-[#e4e4e7] hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_50px_rgba(255,255,255,0.2)]"
                >
                  <Download className="h-5 w-5 text-black transition-transform duration-300 group-hover:-translate-y-0.5" />
                  <span>Download Android App (APK)</span>
                </a>
                <span className="font-mono text-[11px] text-[#71717a]">
                  Direct APK · Silent Background Capture · Free
                </span>
              </div>
            </div>

            {/* HERO 3D TILT PRODUCT CARD (Spatial Interaction) */}
            <div className="mt-16 sm:mt-24 max-w-5xl mx-auto">
              <div
                style={reducedMotion ? undefined : {
                  transform: `perspective(1200px) rotateX(${mousePos.y * -4}deg) rotateY(${mousePos.x * 4}deg)`,
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                className="relative rounded-3xl border border-white/15 bg-gradient-to-b from-[#18181b]/90 to-[#09090b]/95 p-6 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
              >
                {/* Visual Glass Sheen */}
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/[0.03] via-transparent to-transparent" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 font-mono text-xs text-[#71717a]">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    <span className="text-white font-medium">REEL_INGESTION_PIPELINE</span>
                  </div>
                  <span className="text-[#a1a1aa] bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    REALTIME HOOK: ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <span className="font-mono text-[10px] tracking-wider text-[#71717a] block mb-2">01 // THE TRIGGER</span>
                    <h4 className="font-zolo text-lg font-bold text-white mb-1">Single Share Action</h4>
                    <p className="text-xs text-[#a1a1aa] leading-relaxed">
                      Tap share inside Instagram. Intercepted silently with zero popup windows.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <span className="font-mono text-[10px] tracking-wider text-[#71717a] block mb-2">02 // THE EXTRACTION</span>
                    <h4 className="font-zolo text-lg font-bold text-white mb-1">Spoken Transcripts &amp; Audio</h4>
                    <p className="text-xs text-[#a1a1aa] leading-relaxed">
                      Full speech-to-text, creator details, and semantic topics extracted automatically.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <span className="font-mono text-[10px] tracking-wider text-[#71717a] block mb-2">03 // THE CLEANUP</span>
                    <h4 className="font-zolo text-lg font-bold text-white mb-1">Self-Purging Library</h4>
                    <p className="text-xs text-[#a1a1aa] leading-relaxed">
                      Completed reels auto-purge. Unused categories retire so backlog never accumulates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1.2: EXACTLY ONE VIDEO ON THE ENTIRE PAGE (THE BRAG DEMO MOMENT) */}
        <section className="py-24 sm:py-32 border-b border-white/10 bg-black/40">
          <div className="mx-auto max-w-5xl px-4 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <span className="font-mono text-[11px] tracking-widest text-[#71717a] block mb-2">THE 10-SECOND DEMO</span>
                <h2 className="font-zolo text-3xl sm:text-5xl font-black tracking-tight text-white">
                  See the mechanism in action.
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#a1a1aa] max-w-sm">
                Watch how a single tap replaces cluttered bookmark folders forever.
              </p>
            </div>

            {/* Standalone Video Player Stage */}
            <div className="relative rounded-3xl border border-white/15 bg-[#0e0e11] p-3 sm:p-4 shadow-2xl overflow-hidden">
              <div className="relative aspect-video w-full rounded-2xl bg-[#050507] border border-white/10 overflow-hidden flex flex-col justify-between">
                {!isVideoPlaying ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-white/[0.04] to-transparent">
                    <button
                      type="button"
                      onClick={() => setIsVideoPlaying(true)}
                      aria-label="Play Product Launch Video"
                      className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-black transition-transform duration-300 hover:scale-110 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.3)] mb-4 cursor-pointer"
                    >
                      <Play className="h-8 w-8 fill-black text-black ml-1 transition-transform group-hover:scale-110" />
                    </button>
                    <span className="font-mono text-[11px] text-[#71717a] tracking-wider block mb-1">INTERACTIVE WALKTHROUGH</span>
                    <h3 className="font-zolo text-xl font-bold text-white mb-1">The 4-Stage Reel Pipeline</h3>
                    <p className="text-xs text-[#a1a1aa] max-w-md">
                      Share Sheet → Background Worker → Automatic Pillar Sort → Auto-Clean
                    </p>
                  </div>
                ) : (
                  <div className="w-full h-full p-6 sm:p-8 flex flex-col justify-between bg-black/95 text-left">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-mono text-xs text-white">INTERACTIVE SIMULATION</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsVideoPlaying(false);
                          setVideoTimeline(0);
                        }}
                        className="flex items-center gap-1.5 text-xs font-mono text-[#a1a1aa] hover:text-white transition"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Reset Walkthrough</span>
                      </button>
                    </div>

                    <div className="my-auto py-4">
                      {videoTimeline === 0 && (
                        <div className="animate-fade-up max-w-lg">
                          <span className="font-mono text-xs text-sky-400 block mb-1">STAGE 01 // INSTAGRAM SHARE SHEET</span>
                          <h4 className="font-zolo text-2xl sm:text-3xl font-bold text-white mb-2">User taps &quot;Share to Watch Later&quot;</h4>
                          <p className="text-sm text-[#a1a1aa] leading-relaxed">No dialogs or folder pickers open. You stay right where you were in your Instagram feed.</p>
                        </div>
                      )}
                      {videoTimeline === 1 && (
                        <div className="animate-fade-up max-w-lg">
                          <span className="font-mono text-xs text-purple-400 block mb-1">STAGE 02 // BACKGROUND CAPTURE</span>
                          <h4 className="font-zolo text-2xl sm:text-3xl font-bold text-white mb-2">Silent Metadata &amp; Transcript Parse</h4>
                          <p className="text-sm text-[#a1a1aa] leading-relaxed">Extracts captions, author details, and spoken speech into searchable text silently.</p>
                        </div>
                      )}
                      {videoTimeline === 2 && (
                        <div className="animate-fade-up max-w-lg">
                          <span className="font-mono text-xs text-emerald-400 block mb-1">STAGE 03 // AUTOMATIC TAXONOMY</span>
                          <h4 className="font-zolo text-2xl sm:text-3xl font-bold text-white mb-2">Assigned to &quot;Systems Architecture&quot;</h4>
                          <p className="text-sm text-[#a1a1aa] leading-relaxed">AI assigns existing parent pillars without creating duplicate or hallucinated folders.</p>
                        </div>
                      )}
                      {videoTimeline === 3 && (
                        <div className="animate-fade-up max-w-lg">
                          <span className="font-mono text-xs text-amber-400 block mb-1">STAGE 04 // AUTO-CLEANUP ON COMPLETION</span>
                          <h4 className="font-zolo text-2xl sm:text-3xl font-bold text-white mb-2">Watched reel cleared from queue</h4>
                          <p className="text-sm text-[#a1a1aa] leading-relaxed">No backlog accumulates to haunt you. Categories that fall out of use retire automatically.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                      {[0, 1, 2, 3].map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setVideoTimeline(step)}
                          aria-label={`Demo step ${step + 1} of 4`}
                          aria-current={videoTimeline === step ? 'step' : undefined}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${videoTimeline === step ? 'bg-white' : 'bg-white/20'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2.3 THE PROBLEM: Brutally Honest & Human */}
        <section className="py-24 sm:py-32 border-b border-white/10">
          <div className="mx-auto max-w-4xl px-4 sm:px-8 text-center">
            <span className="font-mono text-[11px] tracking-widest text-rose-400 block mb-3">[THE REAL PROBLEM]</span>
            <h2 className="font-zolo text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 text-balance leading-tight">
              You save reels to watch later. You never watch them.
            </h2>
            <p className="text-base sm:text-xl text-[#a1a1aa] leading-relaxed max-w-2xl mx-auto font-light">
              Your saves end up scattered across Instagram&apos;s own Saved folder, random DM threads to yourself, screenshots, and notes apps. Nothing is organized, nothing gets revisited, and eventually it&apos;s just clutter no one has the energy to sort through.
            </p>
          </div>
        </section>

        {/* 2.4 HOW IT WORKS: Horizontal Scroll Pipeline Track */}
        <section id="pipeline" className="py-24 sm:py-32 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-8 mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="font-mono text-[11px] tracking-widest text-[#71717a] block mb-2">THE PIPELINE</span>
              <h2 className="font-zolo text-3xl sm:text-5xl font-black tracking-tight text-white">
                How It Actually Works
              </h2>
            </div>
            <span className="font-mono text-xs text-[#71717a]">Scroll horizontally to inspect each stage →</span>
          </div>

          {/* Mandatory Horizontal Scroll Strip */}
          <div
            role="region"
            tabIndex={0}
            aria-label="5-step reel processing pipeline"
            className="flex gap-6 overflow-x-auto px-4 sm:px-8 pb-8 pt-2 no-scrollbar scroll-smooth snap-x focus:outline-none focus:ring-1 focus:ring-white/20"
          >
            {pipelineStages.map((stage) => {
              const isCurrent = pipelineState === stage.index;
              return (
                <div
                  key={stage.number}
                  onClick={() => {
                    setPipelineState(stage.index as any);
                    setAutoPlayPipeline(false);
                  }}
                  className={`snap-center min-w-[320px] sm:min-w-[380px] max-w-[400px] shrink-0 rounded-3xl border p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                    isCurrent
                      ? 'border-white bg-[#18181b] shadow-[0_20px_50px_rgba(0,0,0,0.8)] scale-[1.01]'
                      : 'border-white/10 bg-[#121215] hover:border-white/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-zolo text-3xl font-black text-white">{stage.number}</span>
                      <span className="font-mono text-[10px] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-[#d4d4d8]">
                        {stage.tag}
                      </span>
                    </div>

                    <h3 className="font-zolo text-2xl font-bold text-white mb-1">{stage.title}</h3>
                    <span className="font-mono text-xs text-[#a1a1aa] block mb-4">{stage.subtitle}</span>
                    <p className="text-sm text-[#71717a] leading-relaxed mb-8">{stage.description}</p>
                  </div>

                  {/* Stage Visual Card */}
                  <div className="rounded-2xl border border-white/10 bg-[#09090b] p-4 text-left">
                    <span className="font-mono text-[10px] text-[#71717a] block mb-1">{stage.preview.badge}</span>
                    <p className="text-xs font-semibold text-white">{stage.preview.primary}</p>
                    <p className="text-[11px] text-[#71717a] mt-0.5">{stage.preview.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explicit Trust Signal: Never Hallucinates */}
          <div className="mx-auto max-w-4xl px-4 sm:px-8 mt-16">
            <div className="rounded-3xl border border-red-500/20 bg-red-950/10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="h-12 w-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertOctagon className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <span className="font-mono text-xs text-red-400 block mb-1">HONEST FAILURE POLICY</span>
                <h4 className="font-zolo text-lg font-bold text-white mb-1.5">
                  Never Guessing, Never Hallucinating
                </h4>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">
                  If extraction genuinely fails because a reel was deleted, set to private, or blocked by Instagram, Watch Later <span className="text-white font-medium">never fabricates a fake category or summary</span>. It gets placed in a clearly labeled <span className="text-red-400 font-mono font-medium">Failed</span> folder instead — visible and separate, never silently discarded and never faked.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2.5 THE DASHBOARD / WHAT YOU GET: Centralized Library */}
        <section id="library" className="py-24 sm:py-32 border-b border-white/10 bg-[#0c0c0e]/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-16">
              <div>
                <span className="font-mono text-[11px] tracking-widest text-[#71717a] block mb-2">THE DESTINATION</span>
                <h2 className="font-zolo text-3xl sm:text-5xl font-black tracking-tight text-white">
                  A library, not a dump.
                </h2>
              </div>
              <p className="text-sm text-[#a1a1aa] max-w-md">
                Pick a niche, extract knowledge, and actually digest what you saved without the distraction of algorithmic feeds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {editorialNiches.map((niche) => (
                <div
                  key={niche.id}
                  className="rounded-3xl border border-white/10 bg-[#121215] p-8 transition-colors hover:border-white/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-[#71717a]">{niche.id} &bull; PILLAR</span>
                    <span className="font-mono text-xs px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white">
                      {niche.count}
                    </span>
                  </div>
                  <h3 className="font-zolo text-2xl font-bold text-white mb-2">{niche.title}</h3>
                  <p className="text-sm text-[#71717a] leading-relaxed">{niche.description}</p>
                </div>
              ))}
            </div>

            {/* Light personality insights callout */}
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-zolo text-lg font-bold text-white mb-1">Lightweight Interest Insights</h4>
                <p className="text-sm text-[#a1a1aa]">
                  As a natural side effect of what you curate over time, the dashboard surfaces gentle insights into your evolving interests.
                </p>
              </div>
              <span className="font-mono text-xs text-[#71717a] shrink-0 border border-white/10 px-4 py-2 rounded-full">
                DERIVED AUTOMATICALLY
              </span>
            </div>
          </div>
        </section>

        {/* 2.6 PROOF & CREDIBILITY: Honest Targets, No Synthetic Claims */}
        <section className="py-24 sm:py-32 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="font-mono text-[11px] tracking-widest text-[#71717a] block mb-2">SYSTEM SPECIFICATIONS</span>
              <h2 className="font-zolo text-3xl sm:text-5xl font-black tracking-tight text-white">
                Honest engineering targets.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-white/10 bg-[#121215] p-8 text-center">
                <span className="font-mono text-xs text-[#71717a] block mb-2">TYPICAL ROUNDTRIP</span>
                <div className="font-zolo text-4xl sm:text-5xl font-black text-white mb-2">~3-4s</div>
                <h4 className="text-sm font-semibold text-white mb-1">Capture to Cloud Availability</h4>
                <p className="text-xs text-[#71717a] leading-relaxed">
                  Design target from tapping share in Instagram to the parsed post appearing in your web library.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#121215] p-8 text-center">
                <span className="font-mono text-xs text-[#71717a] block mb-2">ISOLATION</span>
                <div className="font-zolo text-4xl sm:text-5xl font-black text-white mb-2">Row-Level</div>
                <h4 className="text-sm font-semibold text-white mb-1">PostgreSQL Security</h4>
                <p className="text-xs text-[#71717a] leading-relaxed">
                  Postgres Row Level Security ensures every reel, summary, and category is isolated strictly to your account.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#121215] p-8 text-center">
                <span className="font-mono text-xs text-[#71717a] block mb-2">HYGIENE</span>
                <div className="font-zolo text-4xl sm:text-5xl font-black text-white mb-2">Auto-Purge</div>
                <h4 className="text-sm font-semibold text-white mb-1">Queue Self-Cleaning</h4>
                <p className="text-xs text-[#71717a] leading-relaxed">
                  Watched reels clean out automatically so stale backlogs never accumulate or overwhelm you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2.7 FAQ Grounded in Actual Mechanism */}
        <section id="faq" className="py-24 sm:py-32 border-b border-white/10 bg-[#0c0c0e]/40">
          <div className="mx-auto max-w-4xl px-4 sm:px-8">
            <div className="text-center mb-16">
              <span className="font-mono text-[11px] tracking-widest text-[#71717a] block mb-2">FAQ</span>
              <h2 className="font-zolo text-3xl sm:text-5xl font-black tracking-tight text-white">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="rounded-3xl border border-white/10 bg-[#121215] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-left text-base font-semibold text-white transition hover:text-[#d4d4d8]"
                  >
                    <span>{faq.q}</span>
                    <span className="font-mono text-lg text-[#71717a] ml-4 shrink-0">
                      {activeFaq === idx ? '−' : '+'}
                    </span>
                  </button>
                  {activeFaq === idx && (
                    <div className="px-6 pb-6 pt-1 text-sm text-[#a1a1aa] leading-relaxed border-t border-white/5 font-light">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2.8 FINAL CTA: Echoing Tagline with Exact Same Install Action */}
        <section className="py-32 sm:py-44 text-center relative overflow-hidden">
          <div className="mx-auto max-w-4xl px-4 sm:px-8 relative z-10">
            <span className="font-mono text-xs tracking-widest text-[#71717a] block mb-4">[GET THE APP]</span>
            <h2 className="font-zolo text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 text-balance leading-tight">
              Never lose a reel worth revisiting.
            </h2>
            <p className="text-base sm:text-xl text-[#a1a1aa] max-w-xl mx-auto mb-10 font-light leading-relaxed">
              Replace scattered DMs and forgotten saves with one silent habit. Share it once, and actually watch it later.
            </p>
            <div className="flex flex-col items-center justify-center gap-3">
              <a
                href="/watch-later.apk"
                download="watch-later.apk"
                className="group relative inline-flex items-center gap-3 rounded-full bg-white px-9 py-5 text-lg font-bold text-black transition-all duration-300 hover:bg-[#e4e4e7] hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_60px_rgba(255,255,255,0.25)]"
              >
                <Download className="h-5 w-5 text-black transition-transform duration-300 group-hover:-translate-y-0.5" />
                <span>Download Android App (APK)</span>
              </a>
              <span className="font-mono text-xs text-[#71717a]">
                Android APK · Free · Instant Background Capture
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* 2.9 MINIMAL FOOTER */}
      <footer className="border-t border-white/10 py-10 text-xs text-[#71717a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="h-6 w-6 rounded-md object-cover border border-white/10" />
            <span className="font-zolo font-bold text-white text-sm">Watch Later</span>
            <span>— Never lose a reel worth revisiting.</span>
          </div>
          <span className="font-mono text-[11px]">NATIVE ANDROID SHARE INTERCEPT &amp; LIBRARY</span>
        </div>
      </footer>

      {/* Sign-in Modal for returning users */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-up"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/15 bg-[#141417] p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/logo.jpg" alt="Logo" className="h-8 w-8 rounded-lg object-cover border border-white/10" />
                <span className="font-zolo text-lg font-bold text-white">Watch Later</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-[#71717a] hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="font-zolo text-xl font-bold text-white mb-1">
              {authMode === 'signin' ? 'Sign in to your library' : 'Create an account'}
            </h3>
            <p className="text-xs text-[#a1a1aa] mb-6">
              Enter your credentials to access your synced library.
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#a1a1aa]">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#09090b] px-4 py-2.5 text-sm text-white placeholder-[#52525b] focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#a1a1aa]">Password</label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-[#09090b] px-4 py-2.5 pr-10 text-sm text-white placeholder-[#52525b] focus:border-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#71717a] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="rounded-xl bg-red-950/40 p-3 text-xs text-red-400 border border-red-800/40">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-xl bg-white text-black py-3 text-sm font-bold transition hover:bg-[#e4e4e7] active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {authLoading ? 'Authenticating...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                  setAuthError(null);
                }}
                className="text-xs text-[#a1a1aa] hover:text-white transition"
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
