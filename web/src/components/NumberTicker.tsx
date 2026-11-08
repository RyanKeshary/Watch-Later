'use client';

import { useEffect, useRef } from 'react';

interface NumberTickerProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function NumberTicker({
  value,
  duration = 1000,
  className = '',
  prefix = '',
  suffix = ''
}: NumberTickerProps) {
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = numberRef.current;
    if (!el) return;

    let startTimestamp: number | null = null;
    let animId: number | null = null;
    const startValue = 0;
    const endValue = value;

    if (endValue === 0) {
      el.textContent = '0';
      return;
    }

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easedProgress);
      el.textContent = String(current);

      if (progress < 1) {
        animId = window.requestAnimationFrame(step);
      }
    };

    animId = window.requestAnimationFrame(step);
    return () => {
      if (animId !== null) {
        window.cancelAnimationFrame(animId);
      }
    };
  }, [value, duration]);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      <span ref={numberRef}>0</span>
      {suffix}
    </span>
  );
}

