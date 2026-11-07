'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Download,
  Share2,
  Trash2,
  Play,
  ArrowRight,
  Sparkles,
  Smartphone,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  Layers,
  Database,
  Search,
  Zap,
  ShieldCheck,
  ChevronRight,
  FolderSync,
  Bot,
  LogIn,
  Check
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

  // Download CTA Transition State
  // After download is clicked: show prompt message, then transition button into Sign In
  const [downloadClicked, setDownloadClicked] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  // Motion & Mouse Tracking for 3D Hero
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Horizontal Scroll Section Ref & Scroll Progress
  const horizontalSectionRef = useRef<HTMLDivElement>(null);
  const [horizontalProgress, setHorizontalProgress] = useState(0);

  // 3D Canvas Ref in Hero
  const canvas3dRef = useRef<HTMLCanvasElement>(null);

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

  // Interactive 3D Canvas in Hero (Spatial Floating Geometric Ring/Wireframe Matrix)
  useEffect(() => {
    const canvas = canvas3dRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const onResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', onResize);

    // 3D Nodes Matrix
    const points: { x: number; y: number; z: number; ox: number; oy: number; oz: number }[] = [];
    const count = 42;
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const radius = 180 + (i % 3) * 45;
      const x = Math.cos(theta) * radius;
      const y = (Math.sin(theta * 2) * radius) / 2;
      const z = Math.sin(theta) * radius;
      points.push({ x, y, z, ox: x, oy: y, oz: z });
    }

    let angleX = 0;
    let angleY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // React to scroll and mouse
      const targetAngleY = scrollY * 0.002 + mousePos.x * 0.4;
      const targetAngleX = -mousePos.y * 0.35 + Math.sin(scrollY * 0.001) * 0.2;

      angleY += (targetAngleY - angleY) * 0.05;
      angleX += (targetAngleX - angleX) * 0.05;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const fov = 380;
      const projected: { x: number; y: number; z: number }[] = [];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // Rotate Y
        let x1 = p.ox * cosY - p.oz * sinY;
        let z1 = p.oz * cosY + p.ox * sinY;

        // Rotate X
        let y2 = p.oy * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.oy * sinX;

        // Perspective
        const scale = fov / (fov + z2 + 250);
        const x2D = width / 2 + x1 * scale;
        const y2D = height / 2 + y2 * scale;

        projected.push({ x: x2D, y: y2D, z: z2 });
      }

      // Draw connective wireframe lines
      ctx.lineWidth = 1;
      for (let i = 0; i < projected.length; i++) {
        const next = projected[(i + 1) % projected.length];
        const cross = projected[(i + 4) % projected.length];

        const alpha = Math.max(0.04, Math.min(0.25, (projected[i].z + 200) / 400));
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;

        ctx.beginPath();
        ctx.moveTo(projected[i].x, projected[i].y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();

        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(projected[i].x, projected[i].y);
          ctx.lineTo(cross.x, cross.y);
          ctx.strokeStyle = `rgba(168, 168, 168, ${alpha * 0.3})`;
          ctx.stroke();
        }

        // Draw node glyph
        const pSize = Math.max(1.5, 3.5 * (fov / (fov + projected[i].z + 250)));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha + 0.2})`;
        ctx.beginPath();
        ctx.arc(projected[i].x, projected[i].y, pSize, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [mousePos, scrollY]);

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

  // Handle Hero Download Button Click
  const handleDownloadClick = () => {
    // Initiate actual APK file download
    const link = document.createElement('a');
    link.href = '/watch-later.apk';
    link.download = 'watch-later.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Transition state: show message and turn button into Sign In
    setShowSignInPrompt(true);
    setTimeout(() => {
      setDownloadClicked(true);
    }, 400);
  };

  // Horizontal Scroll Cards
  const horizontalCards = useMemo(
    () => [
      {
        tag: 'PHASE 01 // INTERCEPTION',
        title: 'Zero-UI Share Sheet Capture',
        description:
          'Tap Share on Instagram and select Watch Later. An invisible Android receiver handles the intent in under 20ms and terminates immediately. No popups, no forms, no interruption to your feed.',
        badge: 'Android Native Intent',
        highlight: '20ms Silent Execution'
      },
      {
        tag: 'PHASE 02 // PERSISTENCE',
        title: 'Offline Queueing with Room DB',
        description:
          'Even in an underground subway with zero connectivity, saved reels are written to encrypted local SQLite tables. Android WorkManager orchestrates synchronization with exponential backoff when signal returns.',
        badge: 'Offline-First Engine',
        highlight: 'Zero Lost Saves'
      },
      {
        tag: 'PHASE 03 // INTELLIGENCE',
        title: 'Edge Extraction & AI Taxonomy',
        description:
          'Cloudflare edge workers extract raw caption text, creator handles, and on-screen signals. Groq Llama-3 automatically synthesizes high-density summaries and assigns granular category tags.',
        badge: 'Groq Llama-3 Inference',
        highlight: 'Automated Pillars'
      },
      {
        tag: 'PHASE 04 // PURGE',
        title: 'Self-Cleaning Knowledge Queue',
        description:
          'Once a reel is marked as watched, it gracefully retires from your active library. Stale categories without unread items dissolve naturally, preventing endless digital backlog decay.',
        badge: 'Zero Backlog Clutter',
        highlight: 'Natural Retirement'
      }
    ],
    []
  );

  return (
    <div className="relative min-h-screen bg-[#0B0B0B] text-[#D9D9D9] font-sans selection:bg-white selection:text-black overflow-x-hidden antialiased">
      {/* Background Interactive Fluid Cursor Canvas */}
      <SplashCursor
        contained={false}
        rainbow={false}
        colors={['#ffffff', '#a1a1aa', '#71717a']}
        size={0.65}
        force={0.3}
        swirl={11}
        trail={2.2}
        clickSplash={true}
        colorSpeed={0}
        intensity={0.42}
        momentum={0.7}
        glow={0.12}
        quality="high"
        intro={false}
        zIndex={1}
      />

      {/* Primary Ambient Depth Lighting */}
      <div
        className="pointer-events-none fixed inset-0 z-[2] opacity-40 transition-transform duration-700 ease-out"
        style={{
          background: `radial-gradient(900px circle at ${50 + mousePos.x * 15}% ${
            35 + mousePos.y * 12
          }%, rgba(255, 255, 255, 0.05), transparent 70%)`
        }}
      />

      {/* Subtle Structural Noise Grid */}
      <div className="pointer-events-none fixed inset-0 z-[2] bg-fabric opacity-80" />

      {/* Main Content Layer */}
      <div className="relative z-10 flex flex-col">
        {/* Minimal Floating Brand Header */}
        <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0B0B0B]/70 border-b border-[#333333]/50 transition-all duration-300">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center text-black font-black text-sm">
                ▶
              </div>
              <span className="font-zolo text-lg font-bold tracking-tight text-white">Watch Later</span>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="text-[#a1a1aa] hover:text-white transition-colors duration-150 px-3 py-1.5 rounded-lg active:scale-[0.98]"
              >
                Sign In
              </button>
            </div>
          </div>
        </header>

        {/* HERO SECTION with 3D Spatial Canvas Behind Content */}
        <section className="relative min-h-[92vh] flex items-center justify-center px-6 sm:px-8 overflow-hidden pt-12 pb-24">
          {/* 3D Wireframe Canvas Container Positioned Directly Behind Hero Content */}
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 transition-transform duration-300 ease-out"
            style={{
              transform: `perspective(1000px) rotateX(${mousePos.y * -4}deg) rotateY(${
                mousePos.x * 6
              }deg) translateY(${scrollY * 0.18}px)`
            }}
          >
            <canvas ref={canvas3dRef} className="w-full h-full max-w-5xl opacity-75" />
          </div>

          {/* Hero Foreground Content */}
          <div
            className="relative z-10 mx-auto max-w-4xl text-center flex flex-col items-center"
            style={{
              transform: `translate3d(${mousePos.x * -6}px, ${mousePos.y * -6}px, 0px)`
            }}
          >
            <h1 className="font-zolo text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white text-balance leading-[0.98] mb-8">
              Saved reels <br />
              <span className="text-[#888888]">never get watched.</span>
            </h1>

            <p className="max-w-2xl text-base sm:text-xl text-[#A8A8A8] leading-relaxed mb-10 text-balance font-light">
              Replace scattered DMs, notes, and forgotten bookmarks with one seamless action. Share any Instagram Reel
              to Watch Later and let AI structure your personal knowledge vault in the background.
            </p>

            {/* ONLY 1 CTA BUTTON IN HERO: Download The App (With Smooth Transition to Sign In) */}
            <div className="flex flex-col items-center gap-3 w-full max-w-xs">
              {!downloadClicked ? (
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  className="w-full group relative inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#E5E5E5] hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-white/10"
                >
                  <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                  <span>Download Android App</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                  className="w-full group relative inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#E5E5E5] hover:scale-[1.02] active:scale-[0.98] animate-fade-up shadow-2xl shadow-white/10"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In To Your Vault</span>
                </button>
              )}

              {/* Feedback toast after download clicked */}
              {showSignInPrompt && (
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 animate-fade-up pt-1">
                  <Check className="h-3.5 w-3.5" />
                  <span>APK Downloaded! Now sign in to link your vault.</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* HORIZONTAL SCROLL INTERACTION SECTION */}
        {/* As the visitor scrolls vertically, this pinned 300vh section drives a horizontal track reveal */}
        <section ref={horizontalSectionRef} className="relative h-[300vh] bg-[#0B0B0B]">
          <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center px-6 sm:px-12 border-y border-[#333333]/60">
            {/* Section Header */}
            <div className="mx-auto w-full max-w-6xl mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="font-zolo text-3xl sm:text-5xl font-black tracking-tight text-white">
                  The Four Pillars of Silent Capture
                </h2>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs text-[#6B6B6B]">
                <span>HORIZONTAL JOURNEY</span>
                <div className="w-24 h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-150 ease-out"
                    style={{ width: `${Math.round(horizontalProgress * 100)}%` }}
                  />
                </div>
                <span className="tabular-nums text-white">{Math.round(horizontalProgress * 100)}%</span>
              </div>
            </div>

            {/* Horizontal Track Transforming along X Axis */}
            <div className="w-full overflow-hidden">
              <div
                className="flex gap-6 sm:gap-8 transition-transform duration-100 ease-out will-change-transform"
                style={{
                  transform: `translateX(calc(-${horizontalProgress * 65}% + 0px))`
                }}
              >
                {horizontalCards.map((card, i) => (
                  <div
                    key={card.tag}
                    className="w-[85vw] sm:w-[460px] shrink-0 rounded-2xl border border-[#333333] bg-[#141414] p-8 sm:p-10 flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-[#6B6B6B]"
                    style={{
                      transform: `perspective(1000px) rotateY(${
                        (1 - horizontalProgress) * (i - 1) * -3
                      }deg)`
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-6 font-mono text-xs text-[#6B6B6B]">
                        <span>{card.tag}</span>
                        <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] text-white">
                          {card.highlight}
                        </span>
                      </div>
                      <h3 className="font-zolo text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                        {card.title}
                      </h3>
                      <p className="text-sm sm:text-base text-[#A8A8A8] leading-relaxed font-light">
                        {card.description}
                      </p>
                    </div>

                    <div className="pt-8 border-t border-[#262626] flex items-center justify-between text-xs font-mono text-[#6B6B6B]">
                      <span>{card.badge}</span>
                      <ChevronRight className="h-4 w-4 text-white/40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ARCHITECTURAL SPECIFICATIONS SECTION */}
        <section className="py-28 px-6 sm:px-8 border-b border-[#333333]/50 bg-[#0B0B0B]">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl mb-16">
              <h2 className="font-zolo text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
                Built with precision.
              </h2>
              <p className="text-base text-[#A8A8A8] font-light">
                Engineered from hardware intent filters to distributed edge inference. Every layer is built for zero
                latency and continuous reliability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-[#333333] bg-[#141414] p-7 transition-colors hover:border-[#6B6B6B]">
                <Smartphone className="h-6 w-6 text-white mb-5" />
                <h3 className="font-zolo text-xl font-bold text-white mb-2">Android Jetpack Core</h3>
                <p className="text-sm text-[#A8A8A8] leading-relaxed font-light">
                  Direct ACTION_SEND intent interception running inside a 20ms transparent activity. Zero UI opens over
                  Instagram.
                </p>
              </div>

              <div className="rounded-2xl border border-[#333333] bg-[#141414] p-7 transition-colors hover:border-[#6B6B6B]">
                <Database className="h-6 w-6 text-white mb-5" />
                <h3 className="font-zolo text-xl font-bold text-white mb-2">Room & WorkManager</h3>
                <p className="text-sm text-[#A8A8A8] leading-relaxed font-light">
                  Encrypted local SQLite storage queue with network-constrained background synchronization and
                  exponential backoff.
                </p>
              </div>

              <div className="rounded-2xl border border-[#333333] bg-[#141414] p-7 transition-colors hover:border-[#6B6B6B]">
                <Bot className="h-6 w-6 text-white mb-5" />
                <h3 className="font-zolo text-xl font-bold text-white mb-2">Groq Llama-3 at the Edge</h3>
                <p className="text-sm text-[#A8A8A8] leading-relaxed font-light">
                  Cloudflare worker extracts OpenGraph data, captions, and creator metadata, synthesizing structured
                  JSON pillars.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRE-FOOTER CTA SECTION */}
        {/* Strictly contains ONLY 1 CTA BUTTON for Creating an Account */}
        <section className="py-32 px-6 sm:px-8 bg-[#0E0E0E] text-center relative overflow-hidden">
          <div className="mx-auto max-w-3xl relative z-10 flex flex-col items-center">
            <h2 className="font-zolo text-4xl sm:text-6xl font-black tracking-tight text-white text-balance mb-6">
              Ready to reclaim your saves?
            </h2>
            <p className="text-base sm:text-lg text-[#A8A8A8] max-w-xl font-light mb-10 text-balance">
              Create your account in seconds. Start transforming transient Instagram Reels into a lasting knowledge
              vault today.
            </p>

            {/* ONLY ONE CTA BUTTON RIGHT BEFORE FOOTER: Create Account */}
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setShowAuthModal(true);
              }}
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-9 py-4 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#E5E5E5] hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-white/10"
            >
              <span>Create Account</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[#333333] bg-[#0B0B0B] py-12 px-6 sm:px-8 font-mono text-xs text-[#6B6B6B]">
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-white font-zolo font-bold text-sm">
              <span>Watch Later</span>
              <span className="text-xs text-[#6B6B6B] font-mono">v1.0.0</span>
            </div>

            <div className="flex items-center gap-6">
              <a href="https://github.com/RyanKeshary/Watch-Later" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                GitHub Repository
              </a>
              <a href="/watch-later-launch.mp4" download className="hover:text-white transition-colors">
                Launch Video
              </a>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="hover:text-white transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-[#333333] bg-[#141414] p-8 shadow-2xl animate-fade-up">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-[#6B6B6B] hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-zolo text-2xl font-bold text-white mb-2">
              {authMode === 'signin' ? 'Sign in to your vault' : 'Create your vault account'}
            </h3>
            <p className="text-xs text-[#A8A8A8] mb-6">
              {authMode === 'signin'
                ? 'Access your categorized Reels and personal knowledge library.'
                : 'Get started with autonomous Reel categorization in seconds.'}
            </p>

            {authError && (
              <div className="mb-4 rounded-lg bg-red-950/40 border border-red-500/30 p-3 text-xs text-red-300">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#A8A8A8] mb-1.5 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-[#333333] bg-[#0B0B0B] px-3.5 py-2.5 text-sm text-white placeholder-[#525252] focus:border-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A8A8A8] mb-1.5 uppercase">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-[#333333] bg-[#0B0B0B] px-3.5 py-2.5 text-sm text-white placeholder-[#525252] focus:border-white focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#6B6B6B] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-lg bg-white py-3 text-sm font-semibold text-black hover:bg-[#E5E5E5] transition-colors disabled:opacity-50 mt-2 active:scale-[0.98]"
              >
                {authLoading ? 'Authenticating...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#6B6B6B]">
              {authMode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthError(null);
                    }}
                    className="text-white hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthError(null);
                    }}
                    className="text-white hover:underline font-medium"
                  >
                    Sign in
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
