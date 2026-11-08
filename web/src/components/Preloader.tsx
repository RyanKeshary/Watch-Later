'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Play, Volume2, Menu, RefreshCw } from 'lucide-react';

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete();
      return;
    }

    // 2.4s total animation split smoothly
    const t1 = setTimeout(() => setStep(1), 500);
    const t2 = setTimeout(() => setStep(2), 1100);
    const t3 = setTimeout(() => setStep(3), 1700);
    const t4 = setTimeout(() => onComplete(), 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white overflow-hidden select-none">
      <div
        className={`relative flex flex-col items-center justify-center transition-all duration-700 ease-out ${
          step >= 2 ? 'scale-[1.35] -translate-y-8' : step >= 1 ? 'scale-110' : 'scale-90 opacity-90'
        }`}
      >
        {/* Outlined Phone Device Mockup */}
        <div className="relative w-48 h-80 rounded-[36px] border-2 border-white/90 p-3 flex flex-col justify-between overflow-hidden shadow-2xl">
          {/* Top Speaker / Dynamic Notch */}
          <div className="mx-auto h-1.5 w-16 rounded-full border border-white/60 bg-transparent mb-2" />

          {/* Screen Content Cycling */}
          <div className="flex-1 w-full rounded-[24px] border border-white/40 flex flex-col justify-between p-3 relative overflow-hidden bg-black">
            {/* Reel Header / Profile outline */}
            <div className="flex items-center justify-between text-white/80">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full border border-white/80" />
                <div className="w-12 h-1.5 rounded-full border border-white/60" />
              </div>
              <Menu className="w-3.5 h-3.5 stroke-[1.5]" />
            </div>

            {/* Reel Central Play & Audio Animation */}
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-2xl border-2 border-white flex items-center justify-center">
                <Play className="w-4 h-4 fill-white stroke-none ml-0.5" />
              </div>
              <div className="flex items-center gap-1">
                <Volume2 className="w-3 h-3 stroke-[1.5]" />
                <div className="w-8 h-1 rounded-full border border-white/60" />
              </div>
            </div>

            {/* Bottom Reel Scroller Bar & Sync Status */}
            <div className="flex items-center justify-between text-white/70 pt-2 border-t border-white/20">
              <div className="w-16 h-1 rounded-full border border-white/40" />
              <RefreshCw className={`w-3 h-3 stroke-[1.5] ${step >= 1 ? 'animate-spin' : ''}`} />
            </div>

            {/* Rising content sweep cue */}
            <div
              className={`absolute inset-x-0 bottom-0 h-full border-t border-white/30 bg-white/[0.04] transition-transform duration-700 ${
                step >= 2 ? '-translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              }`}
            />
          </div>

          {/* Bottom Home Indicator */}
          <div className="mx-auto h-1 w-20 rounded-full border border-white/60 mt-2" />
        </div>

        {/* Scaled brand mark outline */}
        <div className="mt-6 flex items-center gap-2 text-xs font-mono tracking-widest text-white/60 uppercase">
          <Smartphone className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Syncing Reel Library…</span>
        </div>
      </div>
    </div>
  );
}

