'use client';

import { useEffect, useRef } from 'react';

/**
 * Canvas-based ambient particle background.
 * Renders floating dots that drift slowly — gives the app a "live data" feel.
 * Extremely lightweight: ~60 particles, requestAnimationFrame-driven.
 */
export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let W = 0, H = 0;

    const COLORS: string[] = ['#6366F1', '#FDB913', '#C8102E', '#22C55E', '#38BDF8'];

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      r: number;
      color: string;
      alpha: number;
      alphaDir: number;
    }

    const particles: Particle[] = [];

    function resize() {
      W = canvas!.width  = window.innerWidth;
      H = canvas!.height = window.innerHeight;
    }

    function spawn(): Particle {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1 + Math.random() * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#6366F1',
        alpha: Math.random() * 0.3,
        alphaDir: (Math.random() > 0.5 ? 1 : -1) * 0.003,
      };
    }

    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 55; i++) particles.push(spawn());

    function draw() {
      ctx!.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.alphaDir;
        if (p.alpha <= 0 || p.alpha >= 0.35) p.alphaDir *= -1;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = p.color as string;
        ctx!.globalAlpha = p.alpha;
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
