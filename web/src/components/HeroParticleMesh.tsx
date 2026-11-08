'use client';

import { useEffect, useRef } from 'react';

export default function HeroParticleMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates with smooth spring lerping
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Constellation particle network
    const particleCount = Math.min(85, Math.floor((width * height) / 16000));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.8 + 0.8,
      baseRadius: Math.random() * 1.8 + 0.8,
      pulseSpeed: Math.random() * 0.02 + 0.015,
      phase: Math.random() * Math.PI * 2
    }));

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Spring lerp mouse towards target
      mouse.x += (mouse.targetX - mouse.x) * 0.045;
      mouse.y += (mouse.targetY - mouse.y) * 0.045;

      // Dynamic breathing audio waveform mesh
      for (let waveIndex = 0; waveIndex < 2; waveIndex++) {
        ctx.beginPath();
        const baseAlpha = waveIndex === 0 ? 0.045 : 0.025;
        ctx.strokeStyle = `rgba(0, 240, 255, ${baseAlpha})`;
        ctx.lineWidth = waveIndex === 0 ? 1.5 : 1;

        const offset = waveIndex * 40;
        for (let x = 0; x <= width; x += 16) {
          const wave1 = Math.sin(x * 0.004 + time + waveIndex) * 38;
          const wave2 = Math.cos(x * 0.007 - time * 0.7) * 22;
          const distToMouse = Math.abs(x - mouse.x);
          const mouseLift = Math.max(0, 1 - distToMouse / 450) * 55;
          const y = height * 0.5 + offset + wave1 + wave2 - mouseLift;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Draw subtle radial glow near cursor location
      const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 10, mouse.x, mouse.y, 280);
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.06)');
      gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.025)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Update & render particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries smoothly
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;

        // Mouse attraction with spring inertia
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 260) {
          const force = (1 - dist / 260) * 0.5;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }

        // Audio breathing oscillation
        p.radius = p.baseRadius + Math.sin(time * 1.5 + p.phase) * 0.7;

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.2, p.radius), 0, Math.PI * 2);
        ctx.fillStyle = i % 5 === 0 
          ? 'rgba(0, 240, 255, 0.75)' 
          : i % 8 === 0 
          ? 'rgba(245, 158, 11, 0.65)' 
          : 'rgba(247, 248, 248, 0.35)';
        ctx.fill();

        // Connect nearby particles with subtle hairlines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist2 < 145) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.14 * (1 - dist2 / 145)})`;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 opacity-70"
    />
  );
}
