'use client';

import { useState, useEffect, useRef } from 'react';
import { Smartphone, Play, Volume2, Menu, RefreshCw } from 'lucide-react';

interface PreloaderProps {
  onSequenceSettle?: () => void;
  onSequenceComplete: () => void;
}

export default function Preloader({ onSequenceSettle, onSequenceComplete }: PreloaderProps) {
  // Step 0: reel loads
  // Step 1: sync status spinning
  // Step 2: reel finishing
  // Step 3: reel & curtain exiting upward, phone 3d rotation & expansion
  // Step 4: centered transitional beat reached -> trigger settle -> exit preloader overlay
  const [step, setStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const onSequenceSettleRef = useRef(onSequenceSettle);
  onSequenceSettleRef.current = onSequenceSettle;

  const onSequenceCompleteRef = useRef(onSequenceComplete);
  onSequenceCompleteRef.current = onSequenceComplete;

  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onSequenceCompleteRef.current();
      return;
    }

    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setStep(2), 900);
    // 3. Upward exit & 3D rotation begins
    const t3 = setTimeout(() => {
      setStep(3);
      setIsExiting(true);
    }, 1500);
    // 4. Centered beat reached -> trigger hero phone takeover without pause
    const t4 = setTimeout(() => {
      setStep(4);
      onSequenceSettleRef.current?.();
    }, 2100);
    // 5. Complete removal of preloader overlay
    const t5 = setTimeout(() => {
      onSequenceCompleteRef.current();
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center bg-[#0B0B0B] text-[#FFFFFF] overflow-hidden select-none transition-transform duration-700 ease-in-out ${
        isExiting ? '-translate-y-full pointer-events-none' : 'translate-y-0'
      }`}
    >
      {/* Dark Curtain Pull Grid texture */}
      <div className="absolute inset-0 bg-fabric opacity-20 pointer-events-none" />

      <div
        className={`relative flex flex-col items-center justify-center transition-all duration-700 ease-out ${
          step >= 3
            ? 'scale-[2.2] md:scale-[2.6] -translate-y-16 opacity-0'
            : step >= 2
            ? 'scale-110'
            : 'scale-90 opacity-90'
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: step >= 3 ? 'perspective(1000px) rotateY(180deg) rotateX(15deg) translateY(-80px)' : undefined
        }}
      >
        {/* Outlined Phone Device Mockup */}
        <div className="relative w-48 h-80 rounded-[36px] border-2 border-[#D9D9D9] p-3 flex flex-col justify-between overflow-hidden shadow-2xl bg-[#0B0B0B]">
          {/* Top Speaker / Dynamic Notch */}
          <div className="mx-auto h-1.5 w-16 rounded-full border border-[#6B6B6B] bg-transparent mb-2" />

          {/* Screen Content Cycling */}
          <div
            className={`flex-1 w-full rounded-[24px] border border-[#333333] flex flex-col justify-between p-3 relative overflow-hidden bg-[#1A1A1A] transition-transform duration-600 ease-in ${
              step >= 3 ? '-translate-y-full opacity-40' : 'translate-y-0'
            }`}
          >
            {/* Reel Header / Profile outline */}
            <div className="flex items-center justify-between text-[#D9D9D9]">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full border border-[#D9D9D9] bg-[#333333]" />
                <div className="w-12 h-1.5 rounded-full border border-[#6B6B6B]" />
              </div>
              <Menu className="w-3.5 h-3.5 stroke-[1.5] text-[#D9D9D9]" />
            </div>

            {/* Reel Central Play & Audio Animation */}
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-2xl border-2 border-[#FFFFFF] bg-[#333333] flex items-center justify-center">
                <Play className="w-4 h-4 fill-[#FFFFFF] stroke-none ml-0.5" />
              </div>
              <div className="flex items-center gap-1">
                <Volume2 className="w-3 h-3 stroke-[1.5] text-[#D9D9D9]" />
                <div className="w-8 h-1 rounded-full border border-[#6B6B6B]" />
              </div>
            </div>

            {/* Bottom Reel Scroller Bar & Sync Status */}
            <div className="flex items-center justify-between text-[#6B6B6B] pt-2 border-t border-[#333333]">
              <div className="w-16 h-1 rounded-full border border-[#6B6B6B]" />
              <RefreshCw className={`w-3 h-3 stroke-[1.5] text-[#D9D9D9] ${step >= 1 ? 'animate-spin' : ''}`} />
            </div>

            {/* Rising content sweep cue */}
            <div
              className={`absolute inset-x-0 bottom-0 h-full border-t border-[#333333] bg-[#FFFFFF]/[0.05] transition-transform duration-700 ${
                step >= 2 ? '-translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              }`}
            />
          </div>

          {/* Bottom Home Indicator */}
          <div className="mx-auto h-1 w-20 rounded-full border border-[#6B6B6B] mt-2" />
        </div>

        {/* Scaled brand mark outline */}
        <div
          className={`mt-6 flex items-center gap-2 text-xs font-mono tracking-widest text-[#6B6B6B] uppercase transition-opacity duration-300 ${
            step >= 3 ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 stroke-[1.5] text-[#D9D9D9]" />
          <span>Syncing Reel Library…</span>
        </div>
      </div>
    </div>
  );
}
