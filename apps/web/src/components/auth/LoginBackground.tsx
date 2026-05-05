"use client";

import { useEffect, useRef } from "react";

/**
 * Animated Fibonacci sphere background for the login page.
 * - Pure Canvas 2D, no dependencies
 * - Respects prefers-reduced-motion
 * - Pauses when tab is hidden (visibility API)
 * - DPR-aware for crisp rendering on retina displays
 */
export function LoginBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ─── Config ────────────────────────────────────────
    const NUM_POINTS = 2500;
    const ROTATION_SPEED_Y = 0.0008; // radians per ms
    const ROTATION_SPEED_X = 0.00018; // very subtle drift
    const POINT_RADIUS = 0.9; // base dot size in px
    const SPHERE_SCALE = 0.42; // sphere fills 42% of min(w,h)
    const MIN_OPACITY = 0.08; // back-facing points
    const MAX_OPACITY = 1.0; // front-facing points
    const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ─── Generate Fibonacci sphere points ──────────────
    // Even distribution of N points across a unit sphere surface
    const points: { x: number; y: number; z: number }[] = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = Math.PI * 2 * goldenRatio;

    for (let i = 0; i < NUM_POINTS; i++) {
      const t = i / NUM_POINTS;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleIncrement * i;
      points.push({
        x: Math.sin(inclination) * Math.cos(azimuth),
        y: Math.sin(inclination) * Math.sin(azimuth),
        z: Math.cos(inclination),
      });
    }

    // ─── Resize handling (DPR-aware) ───────────────────
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x for perf
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // ─── Render loop ───────────────────────────────────
    let rotY = 0;
    let rotX = 0;
    let lastTime = performance.now();
    let isVisible = !document.hidden;

    const onVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const tick = () => {
      if (!isVisible) return;

      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;

      if (!REDUCE_MOTION) {
        rotY += ROTATION_SPEED_Y * dt;
        rotX += ROTATION_SPEED_X * dt;
      }

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Sphere center + radius
      const cx = width / 2;
      const cy = height / 2;
      const sphereRadius = Math.min(width, height) * SPHERE_SCALE;

      // Precompute rotation matrices
      const sinY = Math.sin(rotY);
      const cosY = Math.cos(rotY);
      const sinX = Math.sin(rotX);
      const cosX = Math.cos(rotX);

      // Project + draw each point
      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // Rotate Y
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;

        // Rotate X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        // Project to 2D (orthographic)
        const sx = cx + x1 * sphereRadius;
        const sy = cy + y2 * sphereRadius;

        // Depth-based opacity (z2 ranges -1 to 1; -1 is back, 1 is front)
        const depth = (z2 + 1) / 2; // 0..1
        const opacity = MIN_OPACITY + (MAX_OPACITY - MIN_OPACITY) * depth;

        // Slight size variation by depth (front points slightly larger)
        const radius = POINT_RADIUS * (0.6 + depth * 0.6);

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!REDUCE_MOTION) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    // Initial render (always at least one frame, even with reduce-motion)
    tick();

    // ─── Cleanup ───────────────────────────────────────
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 block" />
      {/* Optional: radial vignette so the form has more breathing room */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.85) 100%)",
        }}
      />
    </div>
  );
}
