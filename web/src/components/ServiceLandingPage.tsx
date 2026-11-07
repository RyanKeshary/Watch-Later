'use client';

/* Hallmark · shape: Split Studio · genre: atmospheric · theme: Darkroom (deal 3/3, seed watch-later-instagram-reel-3de1·ed64a5cf·2026-11-07·r0) · job: try · draw: 9606ea
 * hero: Counter · nav: edge-aligned · footer: statement · imagery: the product · signature: the mechanical contact strip and edition ledger · darkroom: amber
 * axes: dark/display-condensed/chromatic-amber · posture: restrained · contrast: pass · fold: pass · v2.0.0 */
/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 · weakest: H, ensured display heads run at huge scale with zero border radius */

import React, { useState } from 'react';
import { 
  ArrowRight, 
  Download, 
  Copy, 
  Terminal
} from 'lucide-react';
import SplashCursor from './SplashCursor';

interface ServiceLandingPageProps {
  hasSession?: boolean;
  onSignInSuccess?: () => void;
  onEnterDashboard?: () => void;
  onSignIn?: (email: string) => void;
  onSignUp?: (email: string) => void;
  onDownloadApk?: () => void;
}

export default function ServiceLandingPage({
  onSignIn,
  onSignUp
}: ServiceLandingPageProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activePlate, setActivePlate] = useState(0);

  const plates = [
    {
      num: '01',
      title: 'Silent interception',
      desc: 'Instagram share sheet routes to Watch Later in twenty milliseconds without popup or interruption.',
      spec: 'ACTION_SEND // 20ms'
    },
    {
      num: '02',
      title: 'Offline queueing',
      desc: 'Room database enqueues the URL locally. When cellular service drops, saves persist securely.',
      spec: 'ROOM SQLITE // ENCRYPTED'
    },
    {
      num: '03',
      title: 'AI extraction',
      desc: 'Worker ingests the reel, parses transcripts and captions, and assigns niche categories via Groq Llama-3.',
      spec: 'EDGE LLAMA-3 // ZERO-TAG'
    },
    {
      num: '04',
      title: 'Auto-purge retirement',
      desc: 'Once marked watched, reels vanish from the active queue so your library remains lean.',
      spec: 'PURGE // CLUTTER-FREE'
    }
  ];

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText('https://watchlatertool.vercel.app');
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (authMode === 'signin' && onSignIn) onSignIn(email);
    else if (authMode === 'signup' && onSignUp) onSignUp(email);
  };

  return (
    <div className="relative min-h-screen bg-paper text-ink font-darkroom-body">
      {/* Background WebGL Fluid Simulation */}
      <SplashCursor
        contained
        rainbow={false}
        colors={['#f59e0b', '#d97706', '#b45309']}
        size={0.5}
        force={0.25}
        swirl={4}
        trail={1.2}
        clickSplash
        intensity={0.4}
        momentum={0.6}
        glow={0.08}
        quality="medium"
        intro={false}
        zIndex={0}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Edge-Aligned Nav */}
        <header className="border-b border-rule bg-paper sticky top-0 z-50">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-darkroom-head text-3xl text-ink flex items-center gap-2">
                <span className="inline-block w-3.5 h-3.5 bg-accent" />
                WATCH LATER
              </span>
              <span className="hidden sm:inline-block border-l border-rule pl-4 text-xs text-muted">
                Edition 2026
              </span>
            </div>

            <nav className="flex items-center gap-6">
              <a href="#mechanism" className="text-sm text-muted hover:text-ink hover:underline underline-offset-4 decoration-accent focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]">
                Mechanism
              </a>
              <a href="#ledger" className="text-sm text-muted hover:text-ink hover:underline underline-offset-4 decoration-accent focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]">
                Ledger
              </a>
              <a href="#film" className="text-sm text-muted hover:text-ink hover:underline underline-offset-4 decoration-accent focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]">
                Film
              </a>
              <a
                href="/watch-later.apk"
                download="watch-later.apk"
                className="hidden md:inline-flex items-center gap-2 bg-accent text-accent-ink px-5 py-2.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Get APK (17MB)</span>
              </a>
            </nav>
          </div>
        </header>

        {/* HERO SECTION — Split Studio Posture */}
        <section className="relative pt-16 sm:pt-24 pb-20 border-b border-rule">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
            
            {/* Left 7 Columns: Poster Head */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <h1 className="font-darkroom-head text-6xl sm:text-8xl xl:text-9xl text-ink mb-6">
                  SAVED REELS GO TO DIE.
                </h1>

                <p className="text-lg sm:text-xl text-muted max-w-xl font-light mb-10">
                  Silent capture, automatic transcript extraction, and zero backlog clutter.
                </p>
              </div>

              {/* Action Pair */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 border-t border-rule">
                <a
                  href="/watch-later.apk"
                  download="watch-later.apk"
                  className="inline-flex items-center justify-center gap-3 bg-accent text-accent-ink h-14 px-8 font-semibold text-sm focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Android APK</span>
                </a>
                <a
                  href="#mechanism"
                  className="inline-flex items-center justify-center gap-2 border border-rule bg-paper-2 text-ink h-14 px-8 text-sm focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]"
                >
                  <span>Inspect specification</span>
                  <ArrowRight className="w-4 h-4 text-accent" />
                </a>
              </div>
            </div>

            {/* Right 5 Columns: Working Screen */}
            <div className="lg:col-span-5 bg-paper-2 border border-rule p-6 sm:p-8 flex flex-col justify-between">
              <div className="border-b border-rule pb-6 mb-6">
                <div className="flex items-center justify-between text-xs text-muted mb-3">
                  <span>Plate ref // 01-A</span>
                  <span className="text-accent">Live terminal</span>
                </div>
                <div className="font-mono text-xs text-muted space-y-1.5 bg-paper p-4 border border-rule">
                  <p className="text-ink">$ adb shell am start -a android.intent.action.SEND</p>
                  <p className="text-ink-2">&gt; Target: com.reelvault.app/.ShareCaptureActivity</p>
                  <p className="text-muted">&gt; Intercepted: instagram.com/reel/C8XYZ123</p>
                  <p className="text-muted">&gt; Status: 200 OK (Queued in Room DB: 18ms)</p>
                  <p className="text-accent">&gt; Groq AI: Category assigned &rarr; [Architecture]</p>
                </div>
              </div>

              {/* Dashboard Auth Form */}
              <div className="border-t border-rule pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-ink font-medium">Access Web Dashboard</span>
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                    className="text-xs text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]"
                  >
                    Switch to {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email to launch dashboard"
                    className="w-full bg-paper border border-rule px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={!email.trim()}
                    className="w-full bg-ink text-accent-ink py-3 text-xs font-semibold hover:bg-ink-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {authMode === 'signin' ? 'Open Dashboard' : 'Create Free Account'}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: THE PROCESS AS A CONTACT STRIP */}
        <section id="mechanism" className="py-20 border-b border-rule bg-paper-2">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 border-b border-rule pb-8">
              <div>
                <h2 className="font-darkroom-head text-5xl sm:text-7xl text-ink">THE DISCIPLINE OF ZERO FRICTION.</h2>
              </div>
              <p className="text-sm text-muted max-w-md mt-4 md:mt-0 font-light">
                Every friction point in traditional bookmarking has been stripped out. The entire loop executes without interrupting your feed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-rule">
              {plates.map((plate, idx) => (
                <div 
                  key={plate.num}
                  onClick={() => setActivePlate(idx)}
                  className={`p-8 border-b sm:border-b-0 sm:border-r border-rule last:border-r-0 cursor-pointer transition-colors ${
                    activePlate === idx ? 'bg-paper-3 border-t-2 border-t-accent' : 'bg-paper hover:bg-paper-2'
                  }`}
                >
                  <div className="flex items-center justify-between mb-8">
                    <span className="font-darkroom-head text-4xl text-muted">{plate.num}</span>
                    <span className="text-[10px] font-mono text-accent border border-accent/30 px-2 py-0.5">
                      {plate.spec}
                    </span>
                  </div>
                  <h3 className="font-darkroom-head text-2xl text-ink tracking-wide mb-3">{plate.title}</h3>
                  <p className="text-xs text-muted leading-relaxed font-light">{plate.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* SECTION 3: THE EDITION LEDGER */}
        <section id="ledger" className="py-20 border-b border-rule">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5">
                <h2 className="font-darkroom-head text-5xl sm:text-6xl text-ink mb-6">BUILT FOR LIFETIME CURATION.</h2>
                <p className="text-sm text-muted leading-relaxed mb-8 font-light">
                  Watch Later was not designed as another bookmark bucket. It functions as a structured editorial press for your intellectual diet.
                </p>
                <div className="space-y-4 text-xs font-mono border-t border-rule pt-6">
                  <div className="flex justify-between py-2 border-b border-rule">
                    <span className="text-muted">Mobile protocol</span>
                    <span className="text-ink">Android Native Intent Filter</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-rule">
                    <span className="text-muted">AI inference speed</span>
                    <span className="text-ink">&lt; 1.2s via Groq Edge Llama-3</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-rule">
                    <span className="text-muted">Synchronization</span>
                    <span className="text-ink">Encrypted Supabase PostgreSQL</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-rule">
                    <span className="text-muted">License</span>
                    <span className="text-ink">MIT Open-Source</span>
                  </div>
                </div>
              </div>

              {/* Large Metric Display Hairlines */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-px bg-rule border border-rule">
                <div className="bg-paper p-10 flex flex-col justify-between">
                  <span className="font-darkroom-head text-8xl sm:text-9xl text-ink font-extralight tracking-tight num">20ms</span>
                  <span className="text-xs text-muted mt-4">Average Android intercept latency</span>
                </div>
                <div className="bg-paper p-10 flex flex-col justify-between">
                  <span className="font-darkroom-head text-8xl sm:text-9xl text-accent font-extralight tracking-tight num">0</span>
                  <span className="text-xs text-muted mt-4">Manual tags or folders required</span>
                </div>
                <div className="bg-paper p-10 flex flex-col justify-between">
                  <span className="font-darkroom-head text-8xl sm:text-9xl text-ink font-extralight tracking-tight num">100%</span>
                  <span className="text-xs text-muted mt-4">Offline enqueue survivability</span>
                </div>
                <div className="bg-paper p-10 flex flex-col justify-between">
                  <span className="font-darkroom-head text-8xl sm:text-9xl text-ink font-extralight tracking-tight num">60fps</span>
                  <span className="text-xs text-muted mt-4">Hardware accelerated WebGL surface</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 4: THE LAUNCH FILM */}
        <section id="film" className="py-24 border-b border-rule bg-paper">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 border-b border-rule pb-6">
              <div>
                <h2 className="font-darkroom-head text-4xl sm:text-6xl text-ink">THE ARCHITECTURE IN MOTION.</h2>
              </div>
              <p className="text-xs text-muted max-w-sm">
                Watch how silent share capture transforms a chaotic Instagram feed into an organized personal knowledge base.
              </p>
            </div>

            <div className="relative border border-rule bg-black overflow-hidden">
              <video
                src="/watch-later-launch.mp4"
                poster="/watch-later-poster.jpg"
                controls
                playsInline
                preload="metadata"
                className="w-full aspect-video object-cover"
              />
              
              <div className="p-4 border-t border-rule flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted bg-paper-2">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-ink">watch-later-launch.mp4</span>
                  <span>1080p H.264 Stereo</span>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href="/watch-later-launch.mp4"
                    download="watch-later-launch.mp4"
                    className="text-accent hover:underline flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]"
                  >
                    <span>Download MP4</span>
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="text-ink hover:underline flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]"
                  >
                    <span>{copiedUrl ? 'Copied Link!' : 'Share Tool'}</span>
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* FOOTER: STATEMENT */}
        <footer className="py-20 bg-paper text-muted text-xs">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12 grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-rule pb-16 mb-12">
            
            <div className="md:col-span-6 space-y-4">
              <span className="font-darkroom-head text-3xl text-ink block">WATCH LATER</span>
              <p className="max-w-md font-light leading-relaxed">
                An open-source personal curation engine. Built for people who learn from social video but refuse to let knowledge rot in scattered bookmark folders.
              </p>
              <div className="text-[11px] text-muted">
                Release v1.0.0 / Android SDK 34 / Next.js 14 / Cloudflare
              </div>
            </div>

            <div className="md:col-span-3 space-y-3">
              <span className="text-ink block font-medium">Repository & Media</span>
              <ul className="space-y-2">
                <li><a href="https://github.com/RyanKeshary/Watch-Later" target="_blank" rel="noreferrer" className="hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]">GitHub Repository</a></li>
                <li><a href="/watch-later.apk" download className="hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]">Direct APK Binary</a></li>
                <li><a href="/watch-later-launch.mp4" download className="hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]">Launch Video (1080p)</a></li>
                <li><a href="https://watch-later-worker.onrender.com/health" target="_blank" rel="noreferrer" className="hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]">Worker Health API</a></li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <span className="text-ink block font-medium">Architecture</span>
              <ul className="space-y-2">
                <li><span className="text-ink">Android:</span> Jetpack Compose & Room</li>
                <li><span className="text-ink">Worker:</span> Node.js & Cloudflare</li>
                <li><span className="text-ink">AI Engine:</span> Groq Edge Llama-3</li>
                <li><span className="text-ink">Database:</span> Supabase PostgreSQL</li>
              </ul>
            </div>

          </div>

          <div className="max-w-[1440px] mx-auto px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted">
            <p>&copy; 2026 Ryan Keshary. Released under the MIT License.</p>
            <p>Designed with Hallmark Darkroom discipline.</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
