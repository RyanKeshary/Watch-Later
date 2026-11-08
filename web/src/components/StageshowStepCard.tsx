'use client';

import { useState, useEffect } from 'react';
import { Share2, Zap, Sparkles, LayoutGrid, Check, ArrowRight } from 'lucide-react';

interface StageCardProps {
  stepIndex: number;
}

export default function StageshowStepCard({ stepIndex }: StageCardProps) {
  // 0: Share Sheet Trigger
  // 1: Background Capture Notification
  // 2: AI Categorizer Pipeline
  // 3: Dashboard Grid Live Revisit

  // Step 0 State: Share Sheet Simulated Tap
  const [sheetTapped, setSheetTapped] = useState(false);

  // Step 1 State: Capture Toast / Progress bar
  const [captureProgress, setCaptureProgress] = useState(25);

  // Step 2 State: AI Categorization tag generation
  const [tagStep, setTagStep] = useState(0);

  // Step 3 State: Dashboard Card Check / Watched
  const [revisitWatched, setRevisitWatched] = useState(false);

  useEffect(() => {
    if (stepIndex === 0) {
      const interval = setInterval(() => {
        setSheetTapped((prev) => !prev);
      }, 2200);
      return () => clearInterval(interval);
    }
    if (stepIndex === 1) {
      const interval = setInterval(() => {
        setCaptureProgress((prev) => (prev >= 100 ? 15 : prev + 28));
      }, 700);
      return () => clearInterval(interval);
    }
    if (stepIndex === 2) {
      const interval = setInterval(() => {
        setTagStep((prev) => (prev + 1) % 4);
      }, 1400);
      return () => clearInterval(interval);
    }
    if (stepIndex === 3) {
      const interval = setInterval(() => {
        setRevisitWatched((prev) => !prev);
      }, 2400);
      return () => clearInterval(interval);
    }
  }, [stepIndex]);

  return (
    <div className="w-full h-44 rounded-2xl bg-[#0B0B0B] border border-[#333333] p-4 flex flex-col justify-between overflow-hidden relative select-none">
      {/* Top Device Header Bar */}
      <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] border-b border-[#333333]/60 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#6B6B6B]" />
          <span className="font-mono uppercase text-[10px] tracking-wider text-[#D9D9D9]">
            {stepIndex === 0 && 'System Share Sheet'}
            {stepIndex === 1 && 'Background Daemon'}
            {stepIndex === 2 && 'Semantic Classifier'}
            {stepIndex === 3 && 'Revisit Queue'}
          </span>
        </div>
        <span className="font-mono text-[9px] text-[#6B6B6B]">
          {stepIndex === 0 && 'tap: watch_later'}
          {stepIndex === 1 && '<20ms'}
          {stepIndex === 2 && 'groq-llama3'}
          {stepIndex === 3 && 'synced'}
        </span>
      </div>

      {/* Main Interactive Stage Body */}
      <div className="flex-1 flex flex-col justify-center my-1 relative">
        {/* ========================================================================= */}
        {/* STEP 0: System Share Sheet Selection                                     */}
        {/* ========================================================================= */}
        {stepIndex === 0 && (
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] border border-[#333333] flex items-center justify-center">
                <Share2 className="w-4 h-4 text-[#D9D9D9]" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-[#FFFFFF]">Instagram Share Sheet</p>
                <p className="text-[10px] text-[#6B6B6B]">Target: Watch Later</p>
              </div>
            </div>

            {/* Target Button with animated faux tap cursor & state */}
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all duration-300 flex items-center gap-1.5 ${
                sheetTapped
                  ? 'border-[#FFFFFF] bg-[#FFFFFF] text-[#0B0B0B] scale-105 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                  : 'border-[#333333] bg-[#1A1A1A] text-[#D9D9D9]'
              }`}
            >
              <span>Watch Later</span>
              {sheetTapped && <Check className="w-3 h-3 text-[#0B0B0B]" />}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: Silent Background Capture Notification                           */}
        {/* ========================================================================= */}
        {stepIndex === 1 && (
          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] border border-[#333333] flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-[#FFFFFF]" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-[#FFFFFF] block text-[11px]">
                    Reel Intercepted Silently
                  </span>
                  <span className="text-[10px] text-[#6B6B6B] font-mono">
                    Enqueued to offline Room DB
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#D9D9D9]">{captureProgress}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden border border-[#333333]/50">
              <div
                className="h-full bg-[#FFFFFF] transition-all duration-300 ease-out"
                style={{ width: `${captureProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: Auto-Categorization Transcript Streaming                          */}
        {/* ========================================================================= */}
        {stepIndex === 2 && (
          <div className="space-y-2 px-1 text-left">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FFFFFF] animate-pulse" />
              <span className="text-[11px] text-[#D9D9D9] font-mono">
                {tagStep === 0 && 'Transcribing spoken dialog…'}
                {tagStep === 1 && 'Extracting semantic themes…'}
                {tagStep === 2 && 'Categorizing: Design & Interfaces'}
                {tagStep >= 3 && 'Classified into Design Systems'}
              </span>
            </div>

            {/* Simulated pills flowing in */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all duration-300 ${
                  tagStep >= 1
                    ? 'border-[#D9D9D9] bg-[#1A1A1A] text-[#FFFFFF]'
                    : 'border-[#333333] bg-[#0B0B0B] text-[#6B6B6B] opacity-50'
                }`}
              >
                Typography
              </span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all duration-300 ${
                  tagStep >= 2
                    ? 'border-[#D9D9D9] bg-[#1A1A1A] text-[#FFFFFF]'
                    : 'border-[#333333] bg-[#0B0B0B] text-[#6B6B6B] opacity-50'
                }`}
              >
                Design Systems
              </span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all duration-300 ${
                  tagStep >= 3
                    ? 'border-[#FFFFFF] bg-[#FFFFFF] text-[#0B0B0B] font-semibold'
                    : 'border-[#333333] bg-[#0B0B0B] text-[#6B6B6B] opacity-40'
                }`}
              >
                Revisit Ready
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: Ready in Dashboard Revisit Shelf                                  */}
        {/* ========================================================================= */}
        {stepIndex === 3 && (
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] border border-[#333333] flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-[#D9D9D9]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#FFFFFF] truncate max-w-[140px]">
                  @creative.archive
                </p>
                <p className="text-[10px] text-[#6B6B6B]">Saved today &bull; 4 queued</p>
              </div>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                revisitWatched
                  ? 'border-[#333333] bg-[#1A1A1A] text-[#6B6B6B] line-through'
                  : 'border-[#D9D9D9] bg-[#FFFFFF] text-[#0B0B0B] font-semibold shadow-[0_0_15px_rgba(255,255,255,0.15)]'
              }`}
            >
              <span>{revisitWatched ? 'Watched' : 'Watch'}</span>
              {!revisitWatched && <ArrowRight className="w-3 h-3 text-[#0B0B0B]" />}
            </div>
          </div>
        )}
      </div>

      {/* Subtle bottom indicator line */}
      <div className="w-full flex items-center justify-between text-[9px] text-[#6B6B6B] pt-1.5 border-t border-[#333333]/50">
        <span className="font-mono">STATUS: ACTIVE</span>
        <span className="font-mono">STEP 0{stepIndex + 1}</span>
      </div>
    </div>
  );
}

