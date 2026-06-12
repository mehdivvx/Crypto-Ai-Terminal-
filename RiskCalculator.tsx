"use client";

import { motion } from "framer-motion";
import { ShieldCheck, DollarSign, Percent } from "lucide-react";
import type { Signal, PortfolioSettings } from "@/hooks/useTradingState";
import { formatUsdt, formatPrice, cn } from "@/lib/utils";

interface RiskCalculatorProps {
  signal:           Signal;
  settings:         PortfolioSettings;
  availableBalance: number;
  className?:       string;
}

function calcAllocated(settings: PortfolioSettings, avail: number): number {
  const raw = settings.riskMode === "FLAT"
    ? settings.riskValue
    : (settings.riskValue / 100) * avail;
  return +Math.min(raw, avail * 0.95).toFixed(2);
}

function Row({
  label, value, sub, accent,
}: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#0F1820]">
      <span className="font-mono text-[10px] text-[#3D5A6E] tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-mono text-[11px] font-600"
          style={{ color: accent ?? "#C8DDE8" }}
        >
          {value}
        </span>
        {sub && <span className="font-mono text-[9px] text-[#3D5A6E]">{sub}</span>}
      </div>
    </div>
  );
}

export default function RiskCalculator({
  signal, settings, availableBalance, className,
}: RiskCalculatorProps) {
  const allocated  = calcAllocated(settings, availableBalance);
  const riskUsdt   = allocated * (signal.slPct / 100);
  const rewardUsdt = allocated * (signal.tpPct / 100);
  const rrRatio    = signal.slPct > 0 ? (signal.tpPct / signal.slPct) : 0;
  const canAfford  = allocated >= 5 && allocated <= availableBalance;

  return (
    <motion.div
      className={cn("rounded-[4px] overflow-hidden", className)}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        background: "linear-gradient(135deg, rgba(0,245,255,0.03) 0%, rgba(0,0,0,0) 100%)",
        border:     "1px solid rgba(0,245,255,0.1)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: "1px solid rgba(0,245,255,0.08)" }}
      >
        <ShieldCheck size={11} className="text-[#00F5FF]" strokeWidth={2} />
        <span className="font-display text-[9px] font-700 tracking-[0.2em] uppercase text-[#00F5FF]">
          Risk Calculator
        </span>
      </div>

      <div className="px-3 py-1">
        <Row
          label="Allocated"
          value={`$${formatUsdt(allocated)}`}
          sub="USDT"
          accent={canAfford ? "#00F5FF" : "#FF3366"}
        />
        <Row
          label="Max Risk"
          value={`-$${formatUsdt(riskUsdt)}`}
          sub={`(${signal.slPct.toFixed(2)}%)`}
          accent="#FF3366"
        />
        <Row
          label="Max Reward"
          value={`+$${formatUsdt(rewardUsdt)}`}
          sub={`(${signal.tpPct.toFixed(2)}%)`}
          accent="#00FF88"
        />
        <Row
          label="R:R Ratio"
          value={`1 : ${rrRatio.toFixed(2)}`}
          accent={rrRatio >= 2 ? "#00FF88" : rrRatio >= 1.5 ? "#FFD700" : "#FF6B35"}
        />
        <Row
          label="Entry"
          value={formatPrice(signal.entryPrice, signal.symbol)}
          sub="USDT"
        />
      </div>

      {/* TP/SL strip */}
      <div className="grid grid-cols-2 divide-x divide-[#0F1820] border-t border-[#0F1820]">
        <div className="px-3 py-2 flex flex-col gap-0.5">
          <span className="font-mono text-[8px] text-[#3D5A6E] tracking-wider">TAKE PROFIT</span>
          <span className="font-mono text-[11px] font-600 text-[#00FF88]">
            {formatPrice(signal.tp, signal.symbol)}
          </span>
          <span className="font-mono text-[9px] text-[#00FF88] opacity-70">
            +{signal.tpPct.toFixed(2)}%
          </span>
        </div>
        <div className="px-3 py-2 flex flex-col gap-0.5">
          <span className="font-mono text-[8px] text-[#3D5A6E] tracking-wider">STOP LOSS</span>
          <span className="font-mono text-[11px] font-600 text-[#FF3366]">
            {formatPrice(signal.sl, signal.symbol)}
          </span>
          <span className="font-mono text-[9px] text-[#FF3366] opacity-70">
            -{signal.slPct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Insufficient balance warning */}
      {!canAfford && (
        <div
          className="px-3 py-2 text-center font-mono text-[9px] tracking-wider"
          style={{ background: "rgba(255,51,102,0.08)", color: "#FF3366", borderTop: "1px solid rgba(255,51,102,0.15)" }}
        >
          ⚠ INSUFFICIENT BALANCE TO TAKE POSITION
        </div>
      )}
    </motion.div>
  );
}
