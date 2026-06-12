"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { SignalStrength } from "@/hooks/useTradingState";
import { cn } from "@/lib/utils";

interface ConfidenceBarProps {
  confidence: number;       // 0–100
  strength:   SignalStrength;
  animated?:  boolean;
  className?: string;
}

const STRENGTH_CONFIG = {
  STRONG:   { color: "#00FF88", glow: "rgba(0,255,136,0.5)",   label: "STRONG",   segments: 12 },
  MODERATE: { color: "#FFD700", glow: "rgba(255,215,0,0.5)",   label: "MODERATE", segments: 12 },
  WEAK:     { color: "#FF6B35", glow: "rgba(255,107,53,0.45)", label: "WEAK",     segments: 12 },
} as const;

/** Individual bar segment */
function Segment({
  active, color, glow, index, total,
}: {
  active: boolean; color: string; glow: string; index: number; total: number;
}) {
  return (
    <motion.div
      className="flex-1 rounded-[1px] relative overflow-hidden"
      style={{
        height: 10,
        background: active ? color : "rgba(255,255,255,0.04)",
        boxShadow: active ? `0 0 6px ${glow}` : "none",
      }}
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{
        duration: 0.25,
        delay:    active ? index * 0.035 : 0,
        ease:     "easeOut",
      }}
    >
      {/* Shimmer on active */}
      {active && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)`,
          }}
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 0.6, delay: index * 0.035 + 0.15, ease: "easeOut" }}
        />
      )}
    </motion.div>
  );
}

export default function ConfidenceBar({
  confidence, strength, animated = true, className,
}: ConfidenceBarProps) {
  const cfg      = STRENGTH_CONFIG[strength];
  const { color } = cfg;
  const filled   = Math.round((confidence / 100) * cfg.segments);

  // Animated number counter
  const motionVal = useMotionValue(animated ? 0 : confidence);
  const spring    = useSpring(motionVal, { stiffness: 80, damping: 18 });
  const displayed = useTransform(spring, v => Math.round(v));
  const displayedRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!animated) return;
    motionVal.set(confidence);
  }, [confidence, animated, motionVal]);

  useEffect(() => {
    if (!animated) return;
    return displayed.on("change", v => {
      if (displayedRef.current) displayedRef.current.textContent = String(v);
    });
  }, [displayed, animated]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#3D5A6E]">
            AI Confidence
          </span>
          {/* Strength badge */}
          <span
            className="font-display text-[8px] font-700 tracking-[0.12em] px-1.5 py-0.5 rounded-[2px]"
            style={{
              color:      color,
              background: `${color}18`,
              border:     `1px solid ${color}40`,
            }}
          >
            {cfg.label}
          </span>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span
            ref={displayedRef}
            className="font-display text-[18px] font-800 leading-none tabular-nums"
            style={{ color: cfg.color, textShadow: `0 0 12px ${cfg.glow}` }}
          >
            {animated ? 0 : confidence}
          </span>
          <span className="font-mono text-[11px] text-[#3D5A6E]">%</span>
        </div>
      </div>

      {/* Segmented bar */}
      <div className="flex gap-[3px]">
        {Array.from({ length: cfg.segments }).map((_, i) => (
          <Segment
            key={i}
            index={i}
            total={cfg.segments}
            active={i < filled}
            color={cfg.color}
            glow={cfg.glow}
          />
        ))}
      </div>

      {/* Sub-label row */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] text-[#3D5A6E] tracking-wider">LOW CONF</span>
        <div className="flex-1 mx-2 h-px" style={{ background: "linear-gradient(90deg, #1A2430, #1A2430)" }} />
        <span className="font-mono text-[8px] text-[#3D5A6E] tracking-wider">HIGH CONF</span>
      </div>
    </div>
  );
}
