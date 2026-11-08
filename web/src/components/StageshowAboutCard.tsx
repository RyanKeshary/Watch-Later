'use client';

import { useState, useEffect } from 'react';
import { Film, CheckCircle2, Bookmark, Folder, Sparkles } from 'lucide-react';

export default function StageshowAboutCard() {
  const [activeItem, setActiveItem] = useState(0);

  const reels = [
    {
      title: 'Knead-Free Sourdough Hydration',
      creator: '@baker.notes',
      category: 'Culinary Skills',
      time: '14 min review'
    },
    {
      title: 'Spring Physics in Micro-Interactions',
      creator: '@design.tokens',
      category: 'Design Systems',
      time: '6 min review'
    },
    {
      title: 'PostgreSQL JSONB Indexing Tricks',
      creator: '@dev.tips',
      category: 'Coding & Dev',
      time: '9 min review'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveItem((prev) => (prev + 1) % reels.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [reels.length]);

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-[#333333] bg-[#0B0B0B]/90 backdrop-blur-sm p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-left relative overflow-hidden select-none">
      {/* Top Window Bar */}
      <div className="flex items-center justify-between border-b border-[#333333] pb-3 mb-4 text-xs text-[#6B6B6B]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFFFFF]" />
          <span className="font-mono text-[#D9D9D9] uppercase text-[11px] tracking-wider">
            Curated Knowledge Vault
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#6B6B6B]">
          <Sparkles className="w-3 h-3 text-[#FFFFFF]" />
          <span>AUTONOMOUS</span>
        </div>
      </div>

      {/* Reel Vault Live Cycle */}
      <div className="space-y-2.5">
        {reels.map((item, idx) => {
          const isSelected = activeItem === idx;
          return (
            <div
              key={item.title}
              className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                isSelected
                  ? 'border-[#D9D9D9] bg-[#1A1A1A] scale-[1.01] shadow-lg'
                  : 'border-[#333333]/60 bg-[#0B0B0B] opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'border-[#FFFFFF] bg-[#333333] text-[#FFFFFF]'
                      : 'border-[#333333] bg-[#1A1A1A] text-[#6B6B6B]'
                  }`}
                >
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs sm:text-sm font-semibold text-[#FFFFFF] truncate max-w-[220px] sm:max-w-xs">
                    {item.title}
                  </h5>
                  <p className="text-[11px] text-[#6B6B6B] flex items-center gap-2 mt-0.5">
                    <span>{item.creator}</span>
                    <span>&bull;</span>
                    <span className="text-[#D9D9D9]">{item.time}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all ${
                    isSelected
                      ? 'border-[#333333] bg-[#0B0B0B] text-[#FFFFFF]'
                      : 'border-transparent text-[#6B6B6B]'
                  }`}
                >
                  {item.category}
                </span>
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-[#FFFFFF]" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5 text-[#333333]" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-[#333333]/60 flex items-center justify-between text-[11px] text-[#6B6B6B] font-mono">
        <span className="flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5 text-[#D9D9D9]" />
          <span>Active Archive: 3 shelves</span>
        </span>
        <span className="text-[#D9D9D9]">Ready for deliberate viewing</span>
      </div>
    </div>
  );
}

