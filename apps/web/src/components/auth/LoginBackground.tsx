"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive Fibonacci sphere background.
 * - Static sphere by default (no auto-rotation)
 * - Cursor-repulsion: dots within REPULSION_RADIUS of the mouse are
 *   pushed outward; closer dots are pushed harder
 * - Smooth easing on both push-out and return-to-rest
 * - Respects prefers-reduced-motion
 * - Pauses when tab is hidden
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
    const POINT_RADIUS = 0.9;
    const SPHERE_SCALE = 0.42;        // fills 42% of min(w,h)
    const MIN_OPACITY = 0.08;
    const MAX_OPACITY = 1.0;

    // Cursor repulsion
    const REPULSION_RADIUS = 180;     // px around cursor that affects dots
    const REPULSION_STRENGTH = 90;    // max displacement in px
    const EASE_IN = 0.18;             // how fast displacement ramps up (0..1)
    const EASE_OUT = 0.08;            // how fast it returns to rest (0..1)
    const FALLOFF_POWER = 1.8;        // higher = sharper hole edge

    const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ─── Generate Fibonacci sphere ─────────────────────
    type Point = {
      x: number; y: number; z: number;
      // current displacement from rest position (eased)
      dx: number; dy: number;
    };

    const points: Point[] = [];
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
        dx: 0,
        dy: 0,
      });
    }

    // ─── Resize handling ───────────────────────────────
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // ─── Pointer tracking ──────────────────────────────
    // We track on window so events still register over the form card on top.
    const mouse = {
      x: -9999,
      y: -9999,
      active: false,
    };

    const onPointerMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onPointerLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    // For touch: same listener since pointermove covers touch
    window.addEventListener("blur", onPointerLeave);

    // ─── Visibility (pause when tab hidden) ────────────
    let isVisible = !document.hidden;
    const onVisibility = () => {
      const wasHidden = !isVisible;
      isVisible = !document.hidden;
      if (wasHidden && isVisible) tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // ─── Render loop ───────────────────────────────────
    const tick = () => {
      if (!isVisible) return;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const sphereRadius = Math.min(width, height) * SPHERE_SCALE;

      const repulsionRadiusSq = REPULSION_RADIUS * REPULSION_RADIUS;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // Project to 2D (orthographic, no rotation by default)
        // The sphere is static — it's the depth (z) that gives the 3D look.
        const baseX = cx + p.x * sphereRadius;
        const baseY = cy + p.y * sphereRadius;
        const z = p.z;

        // Compute target displacement based on cursor proximity
        let targetDx = 0;
        let targetDy = 0;

        if (mouse.active) {
          // Use the dot's current displaced position when checking distance
          // so dots that are already pushed don't snap back if mouse is right on them
          const currentX = baseX + p.dx;
          const currentY = baseY + p.dy;
          const ddx = currentX - mouse.x;
          const ddy = currentY - mouse.y;
          const distSq = ddx * ddx + ddy * ddy;

          if (distSq < repulsionRadiusSq && distSq > 0.5) {
            const dist = Math.sqrt(distSq);
            // Falloff: 1 at center, 0 at edge of repulsion radius
            const t = 1 - dist / REPULSION_RADIUS;
            const force = Math.pow(t, FALLOFF_POWER) * REPULSION_STRENGTH;
            // Push direction = away from mouse
            targetDx = (ddx / dist) * force;
            targetDy = (ddy / dist) * force;
          }
        }

        // Ease toward target (faster ramp-up than ramp-down for tactile feel)
        const ease = (Math.abs(targetDx) + Math.abs(targetDy) >
                      Math.abs(p.dx) + Math.abs(p.dy)) ? EASE_IN : EASE_OUT;

        p.dx += (targetDx - p.dx) * ease;
        p.dy += (targetDy - p.dy) * ease;

        // Final draw position
        const sx = baseX + p.dx;
        const sy = baseY + p.dy;

        // Depth-based opacity + size
        const depth = (z + 1) / 2; // 0..1
        const opacity = MIN_OPACITY + (MAX_OPACITY - MIN_OPACITY) * depth;
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

    // Initial render — always at least one frame
    tick();

    // ─── Cleanup ───────────────────────────────────────
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block" />
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
