'use client';

import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Share2,
  FolderTree,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  RotateCcw,
  Film,
  Zap,
  BookmarkCheck,
  Smartphone
} from 'lucide-react';

interface GameOnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function GameOnboardingGuide({
  isOpen,
  onClose,
  onComplete
}: GameOnboardingGuideProps) {
  const [step, setStep] = useState(0);
  const [demoState, setDemoState] = useState<{
    m1Shared: boolean;
    m2Nested: boolean;
    m3Watched: boolean;
  }>({
    m1Shared: false,
    m2Nested: false,
    m3Watched: false
  });
  const [xp, setXp] = useState(50);

  // Reset progress whenever guide opens
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setDemoState({ m1Shared: false, m2Nested: false, m3Watched: false });
      setXp(50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && step < 2) {
        setStep(s => s + 1);
      } else if (e.key === 'ArrowLeft' && step > 0) {
        setStep(s => s - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, onClose]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
      setXp(prev => Math.min(150, prev + 50));
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-2xl animate-fade-in"
      onClick={onClose}
    >
      {/* Apple Liquid Glass Floating Vessel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-[32px] overflow-hidden border border-white/25 bg-gradient-to-b from-white/[0.14] via-white/[0.06] to-white/[0.02] backdrop-blur-3xl shadow-[0_32px_90px_rgba(0,0,0,0.85),inset_0_1.5px_2px_rgba(255,255,255,0.5)] flex flex-col max-h-[92vh] select-none text-white animate-in zoom-in-95 duration-250"
      >
        {/* Specular Ambient Refraction Top Glow */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-tr from-cyan-400/15 via-white/10 to-purple-500/15 pointer-events-none rounded-t-[32px] blur-xl" />

        {/* Modal Glass Header / HUD */}
        <div className="relative z-10 px-6 pt-5 pb-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-white/[0.12] border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] text-white">
              <Gamepad2 className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/70">TUTORIAL QUEST</span>
                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h3 className="font-oughter text-sm font-bold tracking-tight text-white">How to Play Watch Later</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* XP Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/15 text-[11px] font-mono tabular-nums text-white/90">
              <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" />
              <span>{xp} XP</span>
            </div>

            {/* Frosted Glass Close Pill */}
            <button
              onClick={onClose}
              aria-label="Close guide"
              className="p-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/15 text-white/70 hover:text-white transition active:scale-90"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Liquid Glass Segmented Step Tracker */}
        <div className="px-6 pt-3 pb-1 flex items-center gap-2">
          {[0, 1, 2].map((idx) => {
            const isActive = step === idx;
            const isCompleted = step > idx;
            return (
              <button
                key={idx}
                onClick={() => setStep(idx)}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]'
                    : isCompleted
                    ? 'bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                    : 'bg-white/15'
                }`}
                title={`Mission ${idx + 1}`}
              />
            );
          })}
        </div>

        {/* Quest Stage Content */}
        <div className="relative z-10 px-6 py-5 overflow-y-auto space-y-4">
          {/* MISSION 1: 1-Tap Mobile Capture */}
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300 font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                  MISSION 01 // 1-TAP CAPTURE
                </span>
                <span className="text-[11px] font-mono text-white/50">Level 1 of 3</span>
              </div>

              <div>
                <h4 className="font-oughter text-lg sm:text-xl font-bold text-white tracking-tight">
                  Share from Instagram in 1 Tap
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                  Never copy-paste URLs or switch apps. Whenever you find a Reel, tap <strong>Share</strong> ➔ tap <strong>&quot;Watch Later&quot;</strong>. It automatically syncs into your private vault with AI classification.
                </p>
              </div>

              {/* Interactive Mini-Simulation HUD */}
              <div className="rounded-2xl border border-white/20 bg-white/[0.05] backdrop-blur-2xl p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] space-y-3">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Smartphone className="h-3.5 w-3.5 text-zinc-400" />
                    Interactive Simulator
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {demoState.m1Shared ? '+50 XP EARNED ✓' : 'TAP BELOW TO TEST'}
                  </span>
                </div>

                {/* Simulated Phone Share Sheet */}
                <div className="rounded-xl border border-white/15 bg-black/40 p-3 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Film className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">Viral Coding Reel</p>
                      <p className="text-[10px] text-white/60 font-mono">@devworld · Instagram</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setDemoState(prev => ({ ...prev, m1Shared: true }));
                      setXp(prev => Math.min(150, prev + 50));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 shadow-md shrink-0 ${
                      demoState.m1Shared
                        ? 'bg-emerald-500 text-black border border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                        : 'bg-white text-black hover:bg-zinc-200 border border-white/50'
                    }`}
                  >
                    <Share2 className="h-3 w-3" />
                    <span>{demoState.m1Shared ? 'Saved to Vault!' : 'Share ➔ Vault'}</span>
                  </button>
                </div>

                {demoState.m1Shared && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 text-center animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-[11px] text-emerald-300 font-mono">
                      ✓ Instant ping received! AI parsed title, topic &amp; tags automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MISSION 2: Drag, Drop & Nesting */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-300 font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-400/20">
                  MISSION 02 // DRAG &amp; NEST
                </span>
                <span className="text-[11px] font-mono text-white/50">Level 2 of 3</span>
              </div>

              <div>
                <h4 className="font-oughter text-lg sm:text-xl font-bold text-white tracking-tight">
                  Drag Videos &amp; Nest Folders
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                  Drag saved reels straight into categories. You can also drag <strong>folders onto folders</strong> to nest sub-niches infinitely. Clicking any folder instantly opens it.
                </p>
              </div>

              {/* Interactive Mini-Simulation HUD */}
              <div className="rounded-2xl border border-white/20 bg-white/[0.05] backdrop-blur-2xl p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] space-y-3">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <FolderTree className="h-3.5 w-3.5 text-zinc-400" />
                    Nesting Playground
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {demoState.m2Nested ? 'NESTED SUCCESSFULLY ✓' : 'CLICK TO SIMULATE DRAG'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-white/15 bg-black/40 p-3 text-center">
                    <span className="text-[10px] font-mono text-white/60 block mb-1">Parent Folder</span>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs font-semibold text-white border border-white/15">
                      <FolderTree className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Design</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setDemoState(prev => ({ ...prev, m2Nested: true }));
                      setXp(prev => Math.min(150, prev + 50));
                    }}
                    className={`rounded-xl border p-3 text-center transition active:scale-95 ${
                      demoState.m2Nested
                        ? 'border-emerald-400/50 bg-emerald-500/15 ring-1 ring-emerald-400'
                        : 'border-white/20 bg-black/40 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-white/60 block mb-1">Sub-folder</span>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs font-semibold text-white">
                      <span>{demoState.m2Nested ? 'Nested in Design ✓' : '➔ Drop into Design'}</span>
                    </div>
                  </button>
                </div>

                {demoState.m2Nested && (
                  <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/30 p-2 text-center animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-[11px] text-indigo-300 font-mono">
                      ✓ Hierarchy organized! Breadcrumbs let you jump between levels in 1 click.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MISSION 3: Zero Clutter Auto-Watched & Purge */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/20">
                  MISSION 03 // ZERO CLUTTER
                </span>
                <span className="text-[11px] font-mono text-white/50">Level 3 of 3</span>
              </div>

              <div>
                <h4 className="font-oughter text-lg sm:text-xl font-bold text-white tracking-tight">
                  Auto-Watched &amp; Retention Cap
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                  Clicking any reel marks it as <strong>Watched</strong> automatically. Archived posts are queued for auto-purging based on your retention choice (1 Day, 1 Week, or 1 Month Cap) so your vault never rots.
                </p>
              </div>

              {/* Interactive Mini-Simulation HUD */}
              <div className="rounded-2xl border border-white/20 bg-white/[0.05] backdrop-blur-2xl p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] space-y-3">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <BookmarkCheck className="h-3.5 w-3.5 text-zinc-400" />
                    Auto-Clear Trigger
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {demoState.m3Watched ? 'REEL WATCHED ✓' : 'CLICK CARD TO TEST'}
                  </span>
                </div>

                <div
                  onClick={() => {
                    setDemoState(prev => ({ ...prev, m3Watched: true }));
                    setXp(150);
                  }}
                  className={`rounded-xl border p-3 flex items-center justify-between cursor-pointer transition active:scale-98 ${
                    demoState.m3Watched
                      ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.2)]'
                      : 'border-white/20 bg-black/40 hover:bg-white/10 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${demoState.m3Watched ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white'}`}>
                      <Play className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold block">Megaamerican Viral Strategy</span>
                      <span className="text-[10px] text-white/60 font-mono">
                        {demoState.m3Watched ? 'Status: Watched ✓' : 'Status: Unwatched (Tap me)'}
                      </span>
                    </div>
                  </div>

                  <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                    demoState.m3Watched
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-white/10 text-white/70 border-white/15'
                  }`}>
                    {demoState.m3Watched ? 'COMPLETED' : 'PLAY'}
                  </span>
                </div>

                {demoState.m3Watched && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 text-center animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-[11px] text-emerald-300 font-mono">
                      🎉 Quest Completed! You are ready to curate with zero friction.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Liquid Glass Bottom Controls */}
        <div className="relative z-10 px-6 py-4 flex items-center justify-between border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition active:scale-95"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="text-xs text-white/50 hover:text-white px-2 py-1.5 transition"
              >
                Skip
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-black font-semibold text-xs transition active:scale-95 shadow-[0_4px_24px_rgba(255,255,255,0.25)]"
            >
              <span>{step === 2 ? 'Start Playing 🚀' : 'Next Mission'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

