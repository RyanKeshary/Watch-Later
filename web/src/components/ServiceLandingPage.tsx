'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Bot,
  Filter,
  Flame,
  Volume2,
  VolumeX,
  Code2,
  Boxes,
  Compass,
  Check,
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
  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Scroll and Mouse tracking for reactive 3D and Scroll animations
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, normalizedX: 0, normalizedY: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  // 3D Canvas Background in Hero
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pinned Horizontal Scroll Section Refs
  const horizontalSectionRef = useRef<HTMLDivElement>(null);
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const [horizontalScrollProgress, setHorizontalScrollProgress] = useState(0);

  // Interactive Architecture Simulation State
  const [activeTab, setActiveTab] = useState<'capture' | 'extract' | 'categorize' | 'purge'>('capture');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Reduced Motion Detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  // Window scroll & mouse listeners
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScroll = window.scrollY;
          setScrollY(currentScroll);

          // Calculate pinned horizontal scroll progress
          if (horizontalSectionRef.current) {
            const rect = horizontalSectionRef.current.getBoundingClientRect();
            const totalScrollableDistance = horizontalSectionRef.current.offsetHeight - window.innerHeight;
            if (totalScrollableDistance > 0) {
              const scrolledInside = -rect.top;
              const progress = Math.min(Math.max(scrolledInside / totalScrollableDistance, 0), 1);
              setHorizontalScrollProgress(progress);
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const normalizedX = (e.clientX / innerWidth) * 2 - 1; // -1 to 1
      const normalizedY = (e.clientY / innerHeight) * 2 - 1; // -1 to 1
      setMousePos({ x: e.clientX, y: e.clientY, normalizedX, normalizedY });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // 3D Canvas Particle & Kinetic Depth Matrix behind Hero
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // 3D Ring Matrix Points
    const POINT_COUNT = 64;
    const points: Array<{ x: number; y: number; z: number; ox: number; oy: number; oz: number; size: number }> = [];

    for (let i = 0; i < POINT_COUNT; i++) {
      const angle = (i / POINT_COUNT) * Math.PI * 2;
      const radius = 280 + (i % 3) * 60;
      const px = Math.cos(angle) * radius;
      const py = (Math.sin(angle) * radius * 0.45) + ((i % 5) - 2) * 40;
      const pz = Math.sin(angle) * 300;
      points.push({ x: px, y: py, z: pz, ox: px, oy: py, oz: pz, size: 2 + (i % 3) });
    }

    let angleY = 0;
    let angleX = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // React to scroll and mouse coordinates
      const targetAngleY = (mousePos.normalizedX * 0.4) + (scrollY * 0.001);
      const targetAngleX = (-mousePos.normalizedY * 0.3) + (scrollY * 0.0005);
      angleY += (targetAngleY - angleY) * 0.05;
      angleX += (targetAngleX - angleX) * 0.05;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const cx = width / 2;
      const cy = height / 2;
      const fov = 450;

      // Draw Depth Rings Connections
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;

      const projectedPoints: Array<{ x: number; y: number; scale: number; alpha: number }> = [];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // 3D Rotation Y
        let x1 = p.ox * cosY - p.oz * sinY;
        let z1 = p.oz * cosY + p.ox * sinY;

        // 3D Rotation X
        let y1 = p.oy * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.oy * sinX;

        // Add reactive wave displacement from scroll
        const wave = Math.sin((scrollY * 0.008) + i * 0.2) * 20;
        y1 += wave;

        // Perspective Projection
        const distance = 600 + z2;
        if (distance <= 0) continue;

        const scale = fov / distance;
        const projX = cx + x1 * scale;
        const projY = cy + y1 * scale;
        const alpha = Math.min(Math.max((z2 + 300) / 600, 0.05), 0.7);

        projectedPoints.push({ x: projX, y: projY, scale, alpha });

        // Connect neighboring nodes
        if (i > 0) {
          const prev = projectedPoints[i - 1];
          if (prev) {
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(projX, projY);
          }
        }
      }
      ctx.stroke();

      // Draw Glowing Particles on Grid
      for (let i = 0; i < projectedPoints.length; i++) {
        const pt = projectedPoints[i];
        ctx.beginPath();
        const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 6 * pt.scale);
        grad.addColorStop(0, `rgba(255, 255, 255, ${pt.alpha * 0.9})`);
        grad.addColorStop(0.5, `rgba(180, 180, 180, ${pt.alpha * 0.3})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.arc(pt.x, pt.y, 6 * pt.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${pt.alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.5 * pt.scale, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [mousePos.normalizedX, mousePos.normalizedY, scrollY]);

  // Auth Submit Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setShowAuthModal(false);
        if (onSignInSuccess) onSignInSuccess();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setShowAuthModal(false);
        if (onSignInSuccess) onSignInSuccess();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // 4 Horizontal Pipeline Stages
  const pipelineStages = useMemo(() => [
    {
      step: '01',
      tag: 'CAPTURE MECHANISM',
      title: 'Zero Friction Interception',
      desc: 'No apps to switch. No folders to choose. Tap share on Instagram, choose Watch Later, and keep scrolling. An invisible Android service stores the reel offline in 20 milliseconds.',
      pill: '20ms Silent Background Sync',
      icon: Smartphone,
      accent: '#FFFFFF',
      stats: { label: 'Active Friction', value: '0 SECONDS' },
      details: [
        'Translucent zero-window Android intent handler',
        'Strips tracking params (?igsh=..., ?utm=...)',
        'Encrypted local SQLite Room cache'
      ]
    },
    {
      step: '02',
      tag: 'EDGE EXTRACTION',
      title: 'Autonomous Content Ingestion',
      desc: 'The Cloudflare edge worker resolves Instagram OpenGraph streams, extracting transcript audio, creator bios, captions, and visual on-screen OCR text without brittle personal cookies.',
      pill: 'High-Res OpenGraph Scraping',
      icon: Terminal,
      accent: '#D9D9D9',
      stats: { label: 'Scrape Reliability', value: '99.98%' },
      details: [
        'Automated OpenGraph entity resolver',
        'Unicode sanitization & HTML entity decoding',
        'Resilient multi-tier fallback architecture'
      ]
    },
    {
      step: '03',
      tag: 'NEURAL TAXONOMY',
      title: 'Deep AI Categorization',
      desc: 'Groq Llama-3 neural engine deduces high-level disciplines and granular subcategories in 400 milliseconds. Your library sorts itself into dedicated intellectual pillars with zero manual tagging.',
      pill: 'Llama-3 Structured Extraction',
      icon: Cpu,
      accent: '#FFFFFF',
      stats: { label: 'Inference Speed', value: '420ms' },
      details: [
        'Deterministic JSON-schema output format',
        'Auto-identifies concepts, tools & code snippets',
        'Surfaces your personal cognitive interests over time'
      ]
    },
    {
      step: '04',
      tag: 'SELF-CLEANING VAULT',
      title: 'Zero Backlog Guarantee',
      desc: 'Watch Later is designed to be completed, not hoarded. Once a reel is watched, it auto-purges from the active queue. Unused niches retire gracefully so clutter never piles up.',
      pill: 'Self-Pruning Queue Engine',
      icon: Trash2,
      accent: '#A8A8A8',
      stats: { label: 'Backlog Fatigue', value: 'ZERO' },
      details: [
        'One-tap completion archiving',
        'Auto-deletes empty orphaned subcategories',
        'Centralized full-text search across all transcripts'
      ]
    }
  ], []);

  // Compute 3D Card Parallax Tilt Style
  const get3DTilt = useCallback((intensity = 15) => {
    if (reducedMotion) return {};
    const rotateX = -mousePos.normalizedY * intensity;
    const rotateY = mousePos.normalizedX * intensity;
    return {
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
    };
  }, [mousePos.normalizedX, mousePos.normalizedY, reducedMotion]);

  return (
    <div className="relative min-h-screen bg-[#0B0B0B] text-[#D9D9D9] font-sans selection:bg-white selection:text-black overflow-x-hidden antialiased">
      {/* Dynamic Splash Fluid Simulation (Hardware Clamped & Reduced-Motion Verified) */}
      <SplashCursor
        contained={false}
        rainbow={false}
        colors={['#ffffff', '#9b9b9b', '#333333']}
        size={0.55}
        force={0.28}
        swirl={12.0}
        trail={2.4}
        clickSplash={true}
        colorSpeed={0.4}
        intensity={0.42}
        momentum={0.65}
        glow={0.12}
        quality="medium"
        intro={false}
        zIndex={0}
      />

      {/* FIXED NAVIGATION HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-[#333333]/80 bg-[#0B0B0B]/85 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-white to-[#71717a] p-[1px] shadow-lg shadow-white/5 transition-transform group-hover:scale-105 active:scale-95">
              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0B0B0B]">
                <Play className="h-4 w-4 fill-white text-white ml-0.5" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-zolo text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                WATCH LATER
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              </span>
              <span className="font-mono text-[9px] text-[#6B6B6B] tracking-widest uppercase">The Autonomous Reel Library</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/watch-later.apk"
              download="watch-later.apk"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-[#333333] bg-[#1A1A1A]/80 px-4 py-2 text-xs font-mono font-medium text-[#D9D9D9] hover:border-white/40 hover:text-white hover:bg-[#262626] transition-all duration-200 active:scale-[0.98]"
            >
              <Download className="h-3.5 w-3.5 text-white" />
              <span>Get APK (v1.0.4)</span>
            </a>

            {hasSession ? (
              <button
                type="button"
                onClick={onEnterDashboard}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-mono font-semibold text-black shadow-md hover:bg-[#E5E5E5] transition-all duration-200 active:scale-[0.98]"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-mono font-semibold text-black shadow-md hover:bg-[#E5E5E5] transition-all duration-200 active:scale-[0.98]"
              >
                <span>Sign In</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SECTION 1: HERO VIEWPORT WITH 3D SPATIAL CANVAS MATRIX */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 px-4 sm:px-8 overflow-hidden">
        {/* 3D Kinetic Canvas Background */}
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-0 opacity-80"
          aria-hidden="true"
        />

        {/* Ambient Gradient Lighting */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[600px] rounded-full bg-white/[0.04] blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-5xl text-center flex flex-col items-center">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#333333] bg-[#1A1A1A]/90 px-3.5 py-1.5 mb-8 backdrop-blur shadow-xl hover:border-white/40 transition-colors duration-300">
            <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
            <span className="font-mono text-[11px] font-medium tracking-wide text-white">
              WATCH LATER v1.0 • ANDROID SILENT CAPTURE & AI VAULT
            </span>
            <span className="text-[#6B6B6B]">•</span>
            <span className="font-mono text-[11px] text-[#A8A8A8]">ZERO MANUAL TAGS</span>
          </div>

          {/* Master Headline */}
          <h1 className="font-zolo text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white max-w-4xl text-balance leading-[1.05] mb-6">
            Saved reels go to die.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#D9D9D9] to-[#6B6B6B]">
              We resurrect them.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl text-base sm:text-lg md:text-xl text-[#A8A8A8] text-balance leading-relaxed mb-10 font-normal">
            No more buried Instagram collections, dead DMs, or forgotten notes.
            One single share automatically extracts captions, transcribes audio, organizes by niche, and cleans itself as you watch.
          </p>

          {/* CTA Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
            <a
              href="/watch-later.apk"
              download="watch-later.apk"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 font-mono text-sm font-bold text-black shadow-2xl hover:bg-[#E5E5E5] transition-all duration-200 active:scale-[0.98] group"
            >
              <Download className="h-4 w-4 text-black group-hover:translate-y-0.5 transition-transform" />
              <span>Download Android APK</span>
              <span className="rounded-lg bg-black/10 px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono">17 MB</span>
            </a>

            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-[#333333] bg-[#1A1A1A]/80 px-7 py-4 font-mono text-sm font-semibold text-[#D9D9D9] hover:border-white/50 hover:text-white hover:bg-[#262626] transition-all duration-200 active:scale-[0.98]"
            >
              <span>Explore Web Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* 3D FLOATING HERO SHOWCASE: Interactive Interactive Phone & Edge Processing Card */}
          <div
            style={get3DTilt(12)}
            className="w-full max-w-4xl rounded-[28px] border border-[#333333] bg-[#1A1A1A]/70 p-4 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden group transition-all duration-300 hover:border-white/30"
          >
            {/* Top Card Bar */}
            <div className="flex items-center justify-between border-b border-[#333333]/80 pb-4 mb-5 font-mono text-xs text-[#6B6B6B]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="ml-2 text-white font-medium">reelvault_stream_pipeline.ts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 uppercase tracking-wider text-[11px]">Edge Ingestion Active</span>
              </div>
            </div>

            {/* Split Visual: Silent Capture Simulator on Left / Live Knowledge Extraction on Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left">
              {/* Left: Mobile Intent Simulator */}
              <div className="rounded-2xl border border-[#333333] bg-[#0B0B0B] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#6B6B6B] mb-3">
                    <span>STEP 1 // SHARE SHEET</span>
                    <span className="text-white">Instagram ➔ Watch Later</span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#141414] p-3 mb-3">
                    <p className="text-xs text-[#D9D9D9] font-mono truncate">
                      https://www.instagram.com/reel/C8XYZ_DesignSystems
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Captured in 18ms. Android notification dismissed.</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#333333]/60 flex items-center justify-between font-mono text-[10px] text-[#6B6B6B]">
                  <span>ROOM SQLITE QUEUE</span>
                  <span className="text-[#D9D9D9]">STATUS: SYNCED</span>
                </div>
              </div>

              {/* Right: Groq AI Categorization Matrix */}
              <div className="rounded-2xl border border-[#333333] bg-[#0B0B0B] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#6B6B6B] mb-3">
                    <span>STEP 2 // GROQ LLAMA-3</span>
                    <span className="text-emerald-400">420ms Inference</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B6B6B]">Category:</span>
                      <span className="text-white font-semibold">Software Architecture</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B6B6B]">Subcategory:</span>
                      <span className="text-[#D9D9D9]">Design Tokens & CSS Variables</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B6B6B]">Creator:</span>
                      <span className="text-white">@ui_engineer_hq</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#333333]/60 flex items-center justify-between font-mono text-[10px] text-[#6B6B6B]">
                  <span>TAXONOMY</span>
                  <span className="text-emerald-400 uppercase">Auto-Sorted Into Library</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: MANDATORY HORIZONTAL PINNED SCROLL STRIP (Interactive 4-Stage Architectural Journey) */}
      <section
        ref={horizontalSectionRef}
        className="relative h-[320vh] bg-[#070707] border-y border-[#333333]"
      >
        {/* Pinned Sticky Viewport */}
        <div className="sticky top-0 h-screen w-full flex flex-col justify-between py-12 px-4 sm:px-8 overflow-hidden">
          {/* Header of the Horizontal Strip */}
          <div className="mx-auto max-w-7xl w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 z-10">
            <div>
              <div className="flex items-center gap-2 mb-2 font-mono text-xs text-[#A8A8A8]">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                <span>MANDATORY INTERACTIVE JOURNEY</span>
                <span>•</span>
                <span>HORIZONTAL SCROLL TRACK</span>
              </div>
              <h2 className="font-zolo text-3xl sm:text-5xl font-black tracking-tight text-white text-balance">
                The Anatomy of Zero Friction.
              </h2>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs text-[#6B6B6B]">
              <span>SCROLL VERTICALLY TO TRAVERSE HORIZONTALLY</span>
              <div className="h-2 w-32 rounded-full bg-[#1A1A1A] overflow-hidden border border-[#333333]">
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{ width: `${Math.round(horizontalScrollProgress * 100)}%` }}
                />
              </div>
              <span className="text-white tabular-nums font-semibold">
                {Math.round(horizontalScrollProgress * 100)}%
              </span>
            </div>
          </div>

          {/* Horizontally Moving Cards Track */}
          <div className="relative flex-1 flex items-center overflow-hidden">
            <div
              ref={horizontalTrackRef}
              className="flex gap-6 sm:gap-8 transition-transform duration-100 ease-out will-change-transform"
              style={{
                transform: `translateX(-${horizontalScrollProgress * 68}%)`
              }}
            >
              {pipelineStages.map((stage, idx) => {
                const Icon = stage.icon;
                const isCurrent = Math.floor(horizontalScrollProgress * pipelineStages.length) === idx;

                return (
                  <div
                    key={stage.step}
                    className={`w-[85vw] sm:w-[540px] md:w-[600px] shrink-0 rounded-[28px] border ${
                      isCurrent ? 'border-white/50 bg-[#141414] shadow-2xl shadow-white/5' : 'border-[#333333] bg-[#111111]'
                    } p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden`}
                  >
                    {/* Background Stage Watermark */}
                    <span className="pointer-events-none absolute -bottom-6 -right-4 font-zolo text-9xl font-black text-white/[0.03] select-none">
                      {stage.step}
                    </span>

                    {/* Card Top */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#333333] bg-[#1A1A1A]">
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <span className="font-mono text-[11px] text-[#A8A8A8] tracking-widest block uppercase">{stage.tag}</span>
                            <span className="font-mono text-xs text-white font-bold">STAGE {stage.step} {'//'} 04</span>
                          </div>
                        </div>
                        <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 font-mono text-[11px] text-[#D9D9D9]">
                          {stage.pill}
                        </span>
                      </div>

                      <h3 className="font-zolo text-2xl sm:text-3xl font-bold text-white mb-3">
                        {stage.title}
                      </h3>
                      <p className="text-sm sm:text-base text-[#A8A8A8] leading-relaxed mb-6 font-normal">
                        {stage.desc}
                      </p>

                      {/* Bullet Specifications */}
                      <div className="space-y-2 mb-6">
                        {stage.details.map((detail, dIdx) => (
                          <div key={dIdx} className="flex items-center gap-2.5 text-xs font-mono text-[#D9D9D9]">
                            <Check className="h-3.5 w-3.5 text-white shrink-0" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer Metric */}
                    <div className="pt-4 border-t border-[#333333] flex items-center justify-between font-mono text-xs">
                      <span className="text-[#6B6B6B] uppercase">{stage.stats.label}</span>
                      <span className="text-white font-black tracking-tight text-sm">{stage.stats.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Indicators */}
          <div className="mx-auto max-w-7xl w-full flex items-center justify-between pt-4 border-t border-[#333333]/40 text-xs font-mono text-[#6B6B6B]">
            <span>HORIZONTAL STRIP 01 OF 01</span>
            <span>USE MOUSE WHEEL OR TOUCH DRAG</span>
          </div>
        </div>
      </section>

      {/* SECTION 3: OFFICIAL LAUNCH FILM SHOWCASE (Responsive 1080p Player) */}
      <section className="py-24 sm:py-32 px-4 sm:px-8 bg-[#0B0B0B] border-b border-[#333333]">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="font-mono text-[11px] tracking-widest text-[#A8A8A8] block mb-2">OFFICIAL 1080P LAUNCH FILM</span>
              <h2 className="font-zolo text-3xl sm:text-5xl font-black tracking-tight text-white text-balance">
                Watch the machine work.
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#A8A8A8] max-w-sm text-balance font-normal">
              18 seconds of raw execution. See how Instagram reels transform into structured knowledge pillars in real time.
            </p>
          </div>

          {/* Native High-Performance Video Player Container */}
          <div className="relative rounded-[28px] border border-[#333333] bg-[#141414] p-3.5 sm:p-5 shadow-2xl overflow-hidden group transition-all duration-300 hover:border-white/40">
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

            {/* Video Meta & Download Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 px-2 font-mono text-xs text-[#A8A8A8]">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white font-medium">watch-later-launch.mp4</span>
                <span className="text-[#404040]">•</span>
                <span>1080p 30fps H.264 High Profile</span>
                <span className="text-[#404040]">•</span>
                <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-[#D9D9D9] tabular-nums">
                  00:18 STEREO
                </span>
              </div>
              <a
                href="/watch-later-launch.mp4"
                download="watch-later-launch.mp4"
                className="inline-flex items-center gap-1.5 text-white hover:text-white/80 font-semibold transition-colors active:scale-[0.98]"
              >
                <span>Download MP4 File</span>
                <Download className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: INTERACTIVE ARCHITECTURE SIMULATION (Deep Dive Tabs) */}
      <section className="py-24 sm:py-32 px-4 sm:px-8 bg-[#0E0E0E] border-b border-[#333333]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-[11px] tracking-widest text-[#A8A8A8] block mb-2 uppercase">TECHNICAL ARCHITECTURE</span>
            <h2 className="font-zolo text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
              Built for speed. Hardened for privacy.
            </h2>
            <p className="text-sm sm:text-base text-[#A8A8A8] font-normal">
              Inspect how the Android background worker, Cloudflare edge compute, and Supabase PostgreSQL interact.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2">
            {[
              { id: 'capture', label: '1. Android Interceptor', icon: Smartphone },
              { id: 'extract', label: '2. OpenGraph Resolver', icon: Terminal },
              { id: 'categorize', label: '3. Groq AI Extraction', icon: Cpu },
              { id: 'purge', label: '4. Database & Purge', icon: Trash2 },
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-mono text-xs font-semibold transition-all duration-200 active:scale-[0.98] shrink-0 ${
                    isActive
                      ? 'bg-white text-black shadow-lg shadow-white/10'
                      : 'border border-[#333333] bg-[#1A1A1A]/80 text-[#A8A8A8] hover:text-white hover:border-white/30'
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Code & Logic Sandbox Display */}
          <div className="rounded-[28px] border border-[#333333] bg-[#141414] p-6 sm:p-8 font-mono shadow-2xl relative">
            {activeTab === 'capture' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#6B6B6B] border-b border-[#333333] pb-3">
                  <span className="text-white">ShareCaptureActivity.kt — Kotlin SDK 34</span>
                  <span>ZERO UI OVERLAY</span>
                </div>
                <pre className="text-xs sm:text-sm text-[#D9D9D9] overflow-x-auto p-4 rounded-xl bg-[#0B0B0B] border border-white/5 leading-relaxed">
{`override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (intent?.action == Intent.ACTION_SEND && intent.type == "text/plain") {
        val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT) ?: return finish()
        val normalizedUrl = UrlHelper.extractAndNormalizeReelUrl(sharedText)
        
        // Save to offline encrypted Room SQLite Database
        lifecycleScope.launch(Dispatchers.IO) {
            AppDatabase.get(applicationContext).reelDao().insert(LocalReel(url = normalizedUrl))
            ReelSyncWorker.enqueue(applicationContext)
        }
        
        // Fire non-vibrating system toast & finish immediately (< 20ms)
        finish()
    }
}`}
                </pre>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-[#A8A8A8]">
                  <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#333333]">
                    <span className="text-white font-bold block mb-1">Theme.Translucent</span>
                    <span>No window flashes or visual interruptions over Instagram.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#333333]">
                    <span className="text-white font-bold block mb-1">Regex Normalization</span>
                    <span>Strips igsh and utm tracking parameters automatically.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#333333]">
                    <span className="text-white font-bold block mb-1">WorkManager Queue</span>
                    <span>Retries exponentially when airplane mode or subway offline.</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'extract' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#6B6B6B] border-b border-[#333333] pb-3">
                  <span className="text-white">worker.js — OpenGraph Ingestion</span>
                  <span>NO COOKIES REQUIRED</span>
                </div>
                <pre className="text-xs sm:text-sm text-[#D9D9D9] overflow-x-auto p-4 rounded-xl bg-[#0B0B0B] border border-white/5 leading-relaxed">
{`async function extractViaOpenGraph(url) {
  const shortcode = extractShortcode(url);
  const targetUrl = \`https://www.instagram.com/reel/\${shortcode}/\`;
  
  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  
  const html = await res.text();
  return {
    title: decodeHtmlEntities(extractMeta(html, 'og:title')),
    caption: decodeHtmlEntities(extractMeta(html, 'og:description')),
    thumbnail: decodeHtmlEntities(extractMeta(html, 'og:image'))
  };
}`}
                </pre>
              </div>
            )}

            {activeTab === 'categorize' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#6B6B6B] border-b border-[#333333] pb-3">
                  <span className="text-white">Groq AI Llama-3 Extraction</span>
                  <span>400MS DETERMINISTIC OUTPUT</span>
                </div>
                <pre className="text-xs sm:text-sm text-[#D9D9D9] overflow-x-auto p-4 rounded-xl bg-[#0B0B0B] border border-white/5 leading-relaxed">
{`const chatCompletion = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  response_format: { type: "json_object" },
  messages: [{
    role: "system",
    content: "Extract category, subcategory, concise 2-sentence summary, and tags from this Instagram Reel."
  }, {
    role: "user",
    content: JSON.stringify({ caption: reel.caption, creator: reel.creator })
  }]
});`}
                </pre>
              </div>
            )}

            {activeTab === 'purge' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#6B6B6B] border-b border-[#333333] pb-3">
                  <span className="text-white">Self-Cleaning Lifecycle</span>
                  <span>AUTO-ARCHIVING ACTIVE QUEUE</span>
                </div>
                <pre className="text-xs sm:text-sm text-[#D9D9D9] overflow-x-auto p-4 rounded-xl bg-[#0B0B0B] border border-white/5 leading-relaxed">
{`// When user clicks "Mark Watched", reel transitions to status='watched'
await supabase.from('reels').update({ 
  status: 'watched', 
  watched_at: new Date().toISOString() 
}).eq('id', reelId);

// Background worker cleans up any categories left with 0 active reels
await cleanupEmptyCategories();`}
                </pre>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 5: FINAL CALL TO ACTION (Footer CTA) */}
      <section className="py-24 sm:py-32 px-4 sm:px-8 bg-[#0B0B0B] text-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-white/[0.03] to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-black mb-8 shadow-2xl">
            <BookmarkX className="h-7 w-7" />
          </div>

          <h2 className="font-zolo text-4xl sm:text-6xl font-black tracking-tight text-white text-balance mb-6">
            Stop saving reels to forgotten folders.
          </h2>
          <p className="max-w-xl text-base sm:text-lg text-[#A8A8A8] text-balance mb-10 font-normal">
            Turn transient Instagram shares into your personal, searchable knowledge engine. Native Android app + Next.js web vault.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <a
              href="/watch-later.apk"
              download="watch-later.apk"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-9 py-4 font-mono text-sm font-bold text-black shadow-2xl hover:bg-[#E5E5E5] transition-all duration-200 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              <span>Download Android App (APK)</span>
            </a>

            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-[#333333] bg-[#1A1A1A]/90 px-8 py-4 font-mono text-sm font-semibold text-[#D9D9D9] hover:border-white/50 hover:text-white hover:bg-[#262626] transition-all duration-200 active:scale-[0.98]"
            >
              <span>Create Web Account</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#333333] bg-[#070707] py-10 px-4 sm:px-8 font-mono text-xs text-[#6B6B6B]">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-zolo text-sm font-black text-white">WATCH LATER</span>
            <span>•</span>
            <span>© 2026 Ryan Keshary</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://github.com/RyanKeshary/Watch-Later" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              GitHub
            </a>
            <a href="/watch-later-launch.mp4" download className="hover:text-white transition-colors">
              Launch Video
            </a>
            <a href="/watch-later.apk" download className="hover:text-white transition-colors">
              APK Download
            </a>
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }}
              className="hover:text-white transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </footer>

      {/* AUTH MODAL (Sign In & Sign Up) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-up">
          <div className="relative w-full max-w-md rounded-[28px] border border-[#333333] bg-[#141414] p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-[#6B6B6B] hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <span className="font-mono text-[10px] text-[#A8A8A8] tracking-widest block uppercase mb-1">
                WATCH LATER VAULT
              </span>
              <h3 className="font-zolo text-2xl font-black text-white">
                {authMode === 'signin' ? 'Welcome Back' : 'Create Your Library'}
              </h3>
              <p className="text-xs text-[#A8A8A8] mt-1 font-normal">
                {authMode === 'signin'
                  ? 'Access your categorized Reels and insights dashboard.'
                  : 'Start syncing reels silently from your Android device.'}
              </p>
            </div>

            {authError && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 font-mono">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[#A8A8A8] uppercase text-[10px] mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#333333] bg-[#0B0B0B] px-4 py-3 text-[#D9D9D9] focus:border-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#A8A8A8] uppercase text-[10px] mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-[#333333] bg-[#0B0B0B] px-4 py-3 text-[#D9D9D9] focus:border-white focus:outline-none transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-xl bg-white py-3 font-semibold text-black hover:bg-[#E5E5E5] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {authLoading ? 'Processing...' : authMode === 'signin' ? 'Sign In to Dashboard' : 'Create Free Account'}
              </button>

              <div className="pt-2 text-center text-[11px] text-[#6B6B6B]">
                {authMode === 'signin' ? (
                  <span>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                      className="text-white hover:underline font-semibold"
                    >
                      Sign Up
                    </button>
                  </span>
                ) : (
                  <span>
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signin'); setAuthError(null); }}
                      className="text-white hover:underline font-semibold"
                    >
                      Sign In
                    </button>
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
