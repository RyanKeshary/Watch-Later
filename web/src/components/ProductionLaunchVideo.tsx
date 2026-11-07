'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Share2,
  CheckCircle2,
  Sparkles,
  Zap,
  FolderTree,
  Trash2,
  Download,
  Film,
  Smartphone,
  ChevronRight,
  Maximize2
} from 'lucide-react';

export default function ProductionLaunchVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 20; // 20-second cinematic story
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Synthesized Web Audio Sound Effects & Music Drone
  const playSound = (type: 'beat' | 'whoosh' | 'ping' | 'success' | 'drop') => {
    if (isMuted || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'beat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.16);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'whoosh') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.22);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'ping') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'drop') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      // Audio not permitted yet
    }
  };

  // Sound triggering on scene cues
  const lastCueRef = useRef<number>(-1);
  useEffect(() => {
    if (!isPlaying) return;
    const currentSecond = Math.floor(currentTime);
    if (currentSecond !== lastCueRef.current) {
      lastCueRef.current = currentSecond;
      if (currentSecond === 0) playSound('beat');
      if (currentSecond === 4) { playSound('whoosh'); playSound('beat'); }
      if (currentSecond === 8) { playSound('ping'); }
      if (currentSecond === 13) { playSound('success'); }
      if (currentSecond === 17) { playSound('drop'); }
    }
  }, [currentTime, isPlaying]);

  // Main playback loop
  useEffect(() => {
    if (isPlaying) {
      let lastTime = performance.now();
      const tick = (now: number) => {
        const delta = (now - lastTime) / 1000;
        lastTime = now;
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, duration]);

  const togglePlay = () => {
    if (!isPlaying && currentTime >= duration - 0.1) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setCurrentTime(pos * duration);
  };

  // Determine current active scene
  // Scene 1: 0.0s - 4.0s (The Scattered Problem)
  // Scene 2: 4.0s - 8.5s (The Single Habit: Share, Don't Save)
  // Scene 3: 8.5s - 13.0s (The Real Engine: Extraction & Categorization)
  // Scene 4: 13.0s - 17.0s (The Payoff: Curated Library & Auto-Clean)
  // Scene 5: 17.0s - 20.0s (Signature Outro & Download Call)
  const isScene1 = currentTime < 4.0;
  const isScene2 = currentTime >= 4.0 && currentTime < 8.5;
  const isScene3 = currentTime >= 8.5 && currentTime < 13.0;
  const isScene4 = currentTime >= 13.0 && currentTime < 17.0;
  const isScene5 = currentTime >= 17.0;

  return (
    <div className="relative w-full rounded-2xl border border-[#2b2b2b] bg-[#0c0c0c] p-2 shadow-2xl overflow-hidden group">
      {/* 16:9 Production Stage */}
      <div className="relative aspect-video w-full rounded-xl bg-[#070707] border border-[#1e1e1e] overflow-hidden flex flex-col justify-between select-none">
        {/* Subtle Ambient Grain & Film Light Source */}
        <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-white/[0.04] via-transparent to-black/80" />

        {/* Top Video Header Bar */}
        <div className="relative z-20 flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono-micro text-white tracking-widest">WATCH LATER // PRODUCTION LAUNCH</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
              className="p-1.5 rounded-lg bg-black/60 border border-white/10 text-[#888888] hover:text-white transition"
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <span className="font-mono-micro text-[#888888] px-2 py-0.5 rounded bg-black/60 border border-white/10">
              4K 60FPS
            </span>
          </div>
        </div>

        {/* SCENE CANVAS PLAYGROUND */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-6 text-center overflow-hidden">
          {/* Pre-Play Cover Poster */}
          {!isPlaying && currentTime === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#121212]/90 to-[#070707]/95 backdrop-blur-sm animate-fade-up">
              <button
                type="button"
                onClick={togglePlay}
                aria-label="Play Launch Video"
                className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-black transition-transform duration-300 hover:scale-110 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.3)] mb-5 cursor-pointer"
              >
                <Play className="h-8 w-8 fill-black text-black ml-1 transition-transform group-hover:scale-110" />
              </button>
              <span className="font-mono-micro text-sky-400 block mb-1">OFFICIAL PRODUCT TRAILER</span>
              <h3 className="font-zolo text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
                The Death of Scattered Saves
              </h3>
              <p className="text-xs sm:text-sm text-[#888888] max-w-md leading-relaxed">
                Watch how a single share action replaces the junk drawer of Instagram bookmarks forever.
              </p>
            </div>
          )}

          {/* SCENE 1: The Problem (0 - 4s) */}
          {isScene1 && (
            <div className="animate-fade-up max-w-lg mx-auto">
              <span className="font-mono-micro text-rose-400 block mb-2">[ACT 01 // THE CLUTTER]</span>
              <h2 className="font-zolo text-2xl sm:text-4xl font-bold text-white tracking-tight mb-3">
                Saved reels go to die.
              </h2>
              <p className="text-xs sm:text-sm text-[#999999] leading-relaxed mb-6">
                Scattered across DMs to yourself, screenshots, and Instagram&apos;s bottomless Saved folder.
              </p>

              {/* Scattered Cards Visual */}
              <div className="flex items-center justify-center gap-3">
                <div className="rotate-[-6deg] p-3 rounded-xl border border-red-500/20 bg-red-950/20 text-left text-[11px] text-red-300 w-36 shadow-lg">
                  <p className="font-semibold text-white">DM to myself</p>
                  <p className="text-[#888888] text-[10px] mt-0.5">&quot;Watch this tonight&quot;</p>
                </div>
                <div className="rotate-[4deg] p-3 rounded-xl border border-amber-500/20 bg-amber-950/20 text-left text-[11px] text-amber-300 w-36 shadow-lg">
                  <p className="font-semibold text-white">IG Saved Folder</p>
                  <p className="text-[#888888] text-[10px] mt-0.5">842 unorganized posts</p>
                </div>
              </div>
            </div>
          )}

          {/* SCENE 2: The Action — Share, Don't Save (4 - 8.5s) */}
          {isScene2 && (
            <div className="animate-fade-up max-w-lg mx-auto">
              <span className="font-mono-micro text-sky-400 block mb-2">[ACT 02 // ONE HABIT]</span>
              <h2 className="font-zolo text-2xl sm:text-4xl font-bold text-white tracking-tight mb-3">
                Share, don&apos;t save.
              </h2>
              <p className="text-xs sm:text-sm text-[#999999] leading-relaxed mb-6">
                Tap share on Instagram and choose Watch Later. No forms, no popups. Instant background capture.
              </p>

              {/* Mobile Share Sheet Simulation */}
              <div className="mx-auto w-64 rounded-xl border border-[#333333] bg-[#141414] p-3.5 shadow-2xl text-left scale-105 transition-transform">
                <div className="flex items-center gap-2 mb-2 text-white font-mono text-[11px]">
                  <Share2 className="h-3.5 w-3.5 text-sky-400" />
                  <span>Share Reel to...</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white text-black font-semibold text-xs shadow-md">
                  <div className="flex items-center gap-2">
                    <img src="/logo.jpg" alt="Icon" className="h-5 w-5 rounded object-cover" />
                    <span>Watch Later</span>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            </div>
          )}

          {/* SCENE 3: The Engine — Real Substance Extraction (8.5 - 13s) */}
          {isScene3 && (
            <div className="animate-fade-up max-w-lg mx-auto">
              <span className="font-mono-micro text-purple-400 block mb-2">[ACT 03 // THE ENGINE]</span>
              <h2 className="font-zolo text-2xl sm:text-4xl font-bold text-white tracking-tight mb-3">
                Substance over screenshots.
              </h2>
              <p className="text-xs sm:text-sm text-[#999999] leading-relaxed mb-6">
                Transcripts, captions, and creators parsed automatically into clean, dedicated pillars.
              </p>

              {/* Autonomous Parsing Terminal */}
              <div className="mx-auto w-72 rounded-xl border border-purple-500/30 bg-[#0f0f15] p-3.5 text-left font-mono text-[11px] shadow-2xl">
                <div className="flex items-center justify-between text-[#888888] mb-2 border-b border-purple-500/20 pb-1.5">
                  <span>PARSER DAEMON</span>
                  <span className="text-emerald-400">ACTIVE</span>
                </div>
                <p className="text-purple-300">✓ Audio speech-to-text extracted</p>
                <p className="text-purple-300">✓ Creator: @tech_insights</p>
                <p className="text-emerald-400 font-semibold mt-1">✓ Category: Systems Design</p>
              </div>
            </div>
          )}

          {/* SCENE 4: The Payoff — Curated Library & Auto-Clean (13 - 17s) */}
          {isScene4 && (
            <div className="animate-fade-up max-w-lg mx-auto">
              <span className="font-mono-micro text-emerald-400 block mb-2">[ACT 04 // THE PAYOFF]</span>
              <h2 className="font-zolo text-2xl sm:text-4xl font-bold text-white tracking-tight mb-3">
                Watch it. It disappears.
              </h2>
              <p className="text-xs sm:text-sm text-[#999999] leading-relaxed mb-6">
                Once watched, reels auto-purge so clutter never piles up. Unused categories retire naturally.
              </p>

              <div className="flex items-center justify-center gap-3">
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-left text-xs w-44 shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Trash2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-white font-semibold">Self-Cleaning</span>
                  </div>
                  <p className="text-[#888888] text-[10px]">Zero backlog guaranteed</p>
                </div>

                <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-950/20 text-left text-xs w-44 shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FolderTree className="h-4 w-4 text-sky-400" />
                    <span className="text-white font-semibold">Curated Pillars</span>
                  </div>
                  <p className="text-[#888888] text-[10px]">No manual tagging</p>
                </div>
              </div>
            </div>
          )}

          {/* SCENE 5: The Outro — Signature Call to Action (17 - 20s) */}
          {isScene5 && (
            <div className="animate-fade-up max-w-lg mx-auto">
              <span className="font-mono-micro text-white block mb-2">[WATCH LATER]</span>
              <h2 className="font-zolo text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
                Never lose a reel worth revisiting.
              </h2>
              <div className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black shadow-[0_0_35px_rgba(255,255,255,0.25)]">
                <Download className="h-4 w-4 text-black" />
                <span>Get the Android App (APK)</span>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM VIDEO SCRUBBER & CONTROLS */}
        <div className="relative z-20 p-4 border-t border-white/5 bg-gradient-to-t from-black/90 to-transparent backdrop-blur-sm">
          {/* Progress Timeline Scrubber */}
          <div
            onClick={handleSeek}
            role="progressbar"
            aria-valuenow={Math.round((currentTime / duration) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="group/seek relative h-1.5 w-full cursor-pointer rounded-full bg-white/10 hover:h-2.5 transition-all mb-3"
          >
            <div
              className="h-full rounded-full bg-white transition-all duration-75 relative"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-md opacity-0 group-hover/seek:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#888888] font-mono">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="text-white hover:text-[#cccccc] transition"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentTime(0);
                  setIsPlaying(true);
                }}
                aria-label="Restart video"
                className="hover:text-white transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <span>
                {Math.floor(currentTime).toString().padStart(2, '0')}:
                {Math.floor((currentTime % 1) * 60).toString().padStart(2, '0')} / 00:20
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-block text-[#666666]">
                {isScene1 && 'Act 01 · The Clutter'}
                {isScene2 && 'Act 02 · One Habit'}
                {isScene3 && 'Act 03 · Extraction'}
                {isScene4 && 'Act 04 · Self-Cleaning'}
                {isScene5 && 'Act 05 · Install Now'}
              </span>

              <a
                href="/watch-later.apk"
                download="watch-later.apk"
                className="flex items-center gap-1.5 text-white hover:underline text-[11px] font-semibold"
              >
                <span>Download APK</span>
                <Download className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

