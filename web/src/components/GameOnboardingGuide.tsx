'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Share2,
  FolderTree,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  Film,
  Check,
  Folder
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

  // Reset progress whenever guide opens
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setDemoState({ m1Shared: false, m2Nested: false, m3Watched: false });
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      {/* Apple Liquid Glass Floating Vessel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl overflow-hidden border border-white/20 bg-[#141414]/90 backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex flex-col max-h-[90vh] select-none text-white animate-in zoom-in-95 duration-200"
      >
        {/* Subtle Top Specular Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-3xl" />

        {/* Modal Header */}
        <div className="relative z-10 px-6 pt-5 pb-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 block">
                Feature Walkthrough
              </span>
              <h3 className="font-sans text-sm font-semibold tracking-tight text-white">
                Welcome to <span className="font-oughter font-bold">Watch Later</span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close guide"
            className="p-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/15 text-white/70 hover:text-white transition active:scale-90"
          >
            <X className="h-3.5 w-3.5" />
          </button>
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
                    ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]'
                    : isCompleted
                    ? 'bg-white/60'
                    : 'bg-white/15'
                }`}
                title={`Step ${idx + 1}`}
              />
            );
          })}
        </div>

        {/* Step Content */}
        <div className="relative z-10 px-6 py-5 overflow-y-auto space-y-4">
          {/* STEP 1: 1-Tap Mobile Capture */}
          {step === 0 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-300 font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
                  01 · 1-Tap Save
                </span>
                <span className="text-[11px] font-mono text-zinc-400">Step 1 of 3</span>
              </div>

              <div>
                <h4 className="font-sans text-lg font-bold text-white tracking-tight">
                  Share directly from Instagram
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                  Never copy links or switch apps. Tap <strong>Share</strong> ➔ <strong>&quot;Watch Later&quot;</strong> on any reel. It syncs to your private vault instantly.
                </p>
              </div>

              {/* Interactive Mini-Simulation */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-3.5 space-y-2.5">
                <div className="rounded-xl border border-white/10 bg-black/40 p-3 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                      <Film className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">Viral Coding Reel</p>
                      <p className="text-[10px] text-zinc-400 font-mono">@devworld · Instagram</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setDemoState(prev => ({ ...prev, m1Shared: true }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 shrink-0 ${
                      demoState.m1Shared
                        ? 'bg-white text-black shadow-sm'
                        : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                    }`}
                  >
                    {demoState.m1Shared ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
                    <span>{demoState.m1Shared ? 'Saved to Vault' : 'Share ➔ Vault'}</span>
                  </button>
                </div>

                {demoState.m1Shared && (
                  <p className="text-[11px] text-zinc-300 font-mono text-center animate-in fade-in duration-200">
                    ✓ Instant capture received. Categorized automatically.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Drag & Nest */}
          {step === 1 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-300 font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
                  02 · Folders &amp; Nesting
                </span>
                <span className="text-[11px] font-mono text-zinc-400">Step 2 of 3</span>
              </div>

              <div>
                <h4 className="font-sans text-lg font-bold text-white tracking-tight">
                  Drag reels &amp; nest folders
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                  Drag saved reels straight into folders. Drag folders onto each other to organize sub-niches with clean navigation breadcrumbs.
                </p>
              </div>

              {/* Interactive Mini-Simulation */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-3.5 space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 text-center">
                    <span className="text-[10px] font-mono text-zinc-400 block mb-1">Parent Folder</span>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs font-medium text-white border border-white/15">
                      <FolderTree className="h-3.5 w-3.5 text-zinc-300" />
                      <span>Design</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setDemoState(prev => ({ ...prev, m2Nested: true }))}
                    className={`rounded-xl border p-2.5 text-center transition active:scale-95 ${
                      demoState.m2Nested
                        ? 'border-white/50 bg-white/15'
                        : 'border-white/15 bg-black/40 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-zinc-400 block mb-1">Sub-folder</span>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs font-medium text-white">
                      <Folder className="h-3.5 w-3.5 text-zinc-300" />
                      <span>{demoState.m2Nested ? 'Nested in Design ✓' : 'Drop into Design'}</span>
                    </div>
                  </button>
                </div>

                {demoState.m2Nested && (
                  <p className="text-[11px] text-zinc-300 font-mono text-center animate-in fade-in duration-200">
                    ✓ Hierarchy updated. One-click breadcrumbs created.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Auto-Watched & Fresh Vault */}
          {step === 2 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-300 font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
                  03 · Auto-Watched
                </span>
                <span className="text-[11px] font-mono text-zinc-400">Step 3 of 3</span>
              </div>

              <div>
                <h4 className="font-sans text-lg font-bold text-white tracking-tight">
                  Clean, clutter-free library
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                  Clicking any reel marks it as <strong>Watched</strong>. Auto-purge retention options keep your vault fresh and relevant.
                </p>
              </div>

              {/* Interactive Mini-Simulation */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-3.5 space-y-2.5">
                <div
                  onClick={() => setDemoState(prev => ({ ...prev, m3Watched: true }))}
                  className={`rounded-xl border p-3 flex items-center justify-between cursor-pointer transition active:scale-98 ${
                    demoState.m3Watched
                      ? 'border-white/40 bg-white/10 text-white'
                      : 'border-white/15 bg-black/40 hover:bg-white/10 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white/10 text-white">
                      <Play className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold block">Tech Insights &amp; Architecture</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {demoState.m3Watched ? 'Status: Watched ✓' : 'Status: Unwatched (Tap to test)'}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/15 bg-white/10 text-zinc-200">
                    {demoState.m3Watched ? 'Watched' : 'Open'}
                  </span>
                </div>

                {demoState.m3Watched && (
                  <p className="text-[11px] text-zinc-300 font-mono text-center animate-in fade-in duration-200">
                    ✓ Clean organization complete. You&apos;re ready to go!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="relative z-10 px-6 py-4 flex items-center justify-between border-t border-white/10 bg-white/[0.02]">
          <div>
            {step > 0 ? (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="text-xs text-zinc-400 hover:text-white px-2 py-1.5 transition"
              >
                Skip
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-zinc-500">
              {step + 1} of 3
            </span>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition active:scale-95 shadow-sm"
            >
              <span>{step === 2 ? 'Done' : 'Next'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
