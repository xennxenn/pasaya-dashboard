import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSales } from '../../context/SalesContext';

interface WaterRipple {
  id: number;
  x: number;
  y: number;
  size: number;
  scale: number;
  opacity: number;
  createdAt: number;
}

export const LiquidWaterDroplet: React.FC = () => {
  const { settings } = useSales();
  const isLight = settings.themeMode === 'light';
  const isEnabled = settings.waterDropletEffect ?? true;

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [ripples, setRipples] = useState<WaterRipple[]>([]);
  
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const idleTimerRef = useRef<number | null>(null);
  const nextRippleId = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Handle Mouse Movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isEnabled) return;

    const x = e.clientX;
    const y = e.clientY;

    setMousePos({ x, y });
    setIsVisible(true);

    // Calculate distance moved from last point
    const dx = x - lastPosRef.current.x;
    const dy = y - lastPosRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Spawn subtle trailing micro-droplet ripple when moved noticeably (> 18px)
    if (dist > 18) {
      lastPosRef.current = { x, y };
      
      const newRipple: WaterRipple = {
        id: nextRippleId.current++,
        x,
        y,
        size: Math.min(24, Math.max(12, dist * 0.4)),
        scale: 0.6,
        opacity: 0.65,
        createdAt: performance.now(),
      };

      setRipples((prev) => [...prev.slice(-12), newRipple]);
    }

    // Reset idle timer: fade out droplet when mouse stops moving after 500ms
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 550);
  }, [isEnabled]);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Animate and clean up ripples smoothly
  useEffect(() => {
    if (!isEnabled) return;

    let isRunning = true;
    const animateRipples = () => {
      if (!isRunning) return;
      const now = performance.now();

      setRipples((prev) => {
        if (prev.length === 0) return prev;
        return prev
          .map((r) => {
            const age = now - r.createdAt;
            const progress = age / 700; // 700ms lifetime
            if (progress >= 1) return null;

            return {
              ...r,
              scale: 0.6 + progress * 1.8,
              opacity: (1 - progress) * 0.6,
            };
          })
          .filter((r): r is WaterRipple => r !== null);
      });

      animFrameRef.current = requestAnimationFrame(animateRipples);
    };

    animFrameRef.current = requestAnimationFrame(animateRipples);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) {
      setIsVisible(false);
      setRipples([]);
      return;
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, [isEnabled, handleMouseMove, handleMouseLeave]);

  if (!isEnabled || !mousePos) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
      {/* 1. Trailing Water Ripples that expand and evaporate */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute rounded-full transition-transform will-change-transform"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${ripple.size * 2}px`,
            height: `${ripple.size * 2}px`,
            transform: `translate(-50%, -50%) scale(${ripple.scale})`,
            opacity: ripple.opacity,
            background: isLight
              ? 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(2,132,199,0.12) 60%, transparent 100%)'
              : 'radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(6,182,212,0.1) 60%, transparent 100%)',
            border: isLight
              ? '1px solid rgba(2, 132, 199, 0.25)'
              : '1px solid rgba(56, 189, 248, 0.35)',
            boxShadow: isLight
              ? '0 0 8px rgba(2, 132, 199, 0.15)'
              : '0 0 12px rgba(56, 189, 248, 0.25)',
          }}
        />
      ))}

      {/* 2. Primary Water Droplet Head at Cursor Location */}
      <div
        className="absolute transition-opacity duration-300 ease-out will-change-transform pointer-events-none"
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`,
          transform: 'translate(-50%, -50%)',
          opacity: isVisible ? 1 : 0,
        }}
      >
        {/* Outer Droplet Lens */}
        <div
          className="relative w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            background: isLight
              ? 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(240,249,255,0.55) 50%, rgba(224,242,254,0.7) 100%)'
              : 'linear-gradient(135deg, rgba(56,189,248,0.35) 0%, rgba(14,165,233,0.18) 50%, rgba(2,132,199,0.3) 100%)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border: isLight
              ? '1.5px solid rgba(255, 255, 255, 0.95)'
              : '1.5px solid rgba(255, 255, 255, 0.45)',
            boxShadow: isLight
              ? '0 4px 14px -2px rgba(2,132,199,0.25), inset 0 2px 3px rgba(255,255,255,0.95), inset 0 -2px 3px rgba(2,132,199,0.15)'
              : '0 6px 18px -2px rgba(0,0,0,0.6), 0 0 16px rgba(56,189,248,0.4), inset 0 2px 3px rgba(255,255,255,0.8), inset 0 -2px 3px rgba(56,189,248,0.3)',
          }}
        >
          {/* Specular White Glare Dot (Top-Left Light Reflection of Water Droplet) */}
          <div
            className="absolute top-1 left-1.5 w-2 h-1 rounded-full rotate-[-30deg]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 80%)',
            }}
          />

          {/* Secondary micro-glint */}
          <div
            className="absolute bottom-1 right-1.5 w-1 h-0.5 rounded-full"
            style={{
              background: 'rgba(255, 255, 255, 0.65)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
