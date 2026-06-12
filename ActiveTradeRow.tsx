"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, X, Clock, Target, ShieldOff } from "lucide-react";
import { useTradingStore, type ActiveTrade } from "@/hooks/useTradingState";
import { TokenIcon } from "@/components/header/TokenIcons";
import { formatPrice, formatUsdt, formatDuration } from "@/lib/utils";

interface Props { trade: ActiveTrade; index: number; }

export default function ActiveTradeRow({ trade, index }: Props) {
  const closeTradeManual = useTradingStore(s => s.closeTradeManual);
  const [closing, setClosing] = useState(false);
  const [age,     setAge]     = useState(0);

  // Live age ticker
  useEffect(() => {
    const id = setInterval(() => setAge(Date.now() - trade.openedAt), 1000);
    return () => clearInterval(id);
  }, [trade.openedAt]);

  const isLong   = trade.direction === "LONG";
  const isProfit = trade.pnlUsdt >= 0;
  const dirColor = isLong ? "#00FF88" : "#FF3366";
  const pnlColor = isProfit ? "#00FF88" : "#FF3366";
  const pnlGlow  = isProfit
    ? "rgba(0,255,136,0.3)"
    : "rgba(255,51,102,0.3)";

  // ─── FIX: DYNAMICALLY CALCULATE TP/SL PERCENTAGES FROM ABSOLUTE PRICES ───
  const tradeTpPct = Math.abs(((trade.tp - trade.entryPrice) / trade.entryPrice) * 100);
  const tradeSlPct = Math.abs(((trade.sl - trade.entryPrice) / trade.entryPrice) * 100);

  const totalMove  = Math.abs(tradeTpPct + tradeSlPct);
  const currentPct = Math.abs(trade.pnlPct);
  const progress   = totalMove > 0 ? Math.min(100, (currentPct / (isProfit ? tradeTpPct : tradeSlPct)) * 100) : 0;

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => closeTradeManual(trade.id), 400);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: closing ? 0 : 1, x: closing ? 30 : 0, scale: closing ? 0.97 : 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.97, transition: { duration: 0.3 } }}
      transition={{ type: "spring", stiffness: 300, damping: 28, delay: index * 0.05 }}
      className="relative rounded-[5px] overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0C1320 0%, #090E16 100%)",
        border:     `1px solid ${isProfit ? "rgba(0,255,136,0.15)" : "rgba(255,51,102,0.12)"}`,
        boxShadow:  `0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)`,
      }}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px"
           style={{ background: `linear-gradient(90deg, transparent, ${pnlColor}60, transparent)` }} />

      {/* ── Header row ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
        <TokenIcon symbol={trade.symbol} size={20} />

        <div className="flex flex-col gap-0.5 leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[11px] font-[700] text-[#E8F4F8] tracking-wider">
              {trade.symbol}
            </span>
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[2px] font-display text-[8px] font-[700] tracking-wider"
              style={{
                color:      dirColor,
                background: `${dirColor}15`,
                border:     `1px solid ${dirColor}30`,
              }}
            >
              {isLong
                ? <TrendingUp  size={7} strokeWidth={3} />
                : <TrendingDown size={7} strokeWidth={3} />
              }
              {trade.direction}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[#3D5A6E]">
            <Clock size={8} />
            <span className="font-mono text-[9px]">{formatDuration(age)}</span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Live PNL */}
        <div className="flex flex-col items-end gap-0.5 leading-none">
          <motion.span
            key={trade.pnlUsdt.toFixed(1)}
            initial={{ y: -3, opacity: 0.6 }}
            animate={{ y: 0,  opacity: 1   }}
            className="font-display text-[13px] font-[800] tabular-nums"
            style={{ color: pnlColor, textShadow: `0 0 10px ${pnlGlow}` }}
          >
            {isProfit ? "+" : ""}${formatUsdt(Math.abs(trade.pnlUsdt))}
          </motion.span>
          <span className="font-mono text-[9px] tabular-nums"
                style={{ color: pnlColor, opacity: 0.7 }}>
            {isProfit ? "+" : ""}{trade.pnlPct.toFixed(2)}%
          </span>
        </div>

        {/* Close button */}
        <motion.button
          onClick={handleClose}
          disabled={closing}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className="ml-1 flex items-center justify-center w-6 h-6 rounded-[3px] cursor-pointer disabled:opacity-40"
          style={{
            background: "rgba(255,51,102,0.1)",
            border:     "1px solid rgba(255,51,102,0.25)",
            color:      "#FF3366",
          }}
          title="Close Position"
        >
          <X size={10} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* ── Progress bar toward TP/SL ───────────────────────────── */}
      <div className="px-3 pb-1">
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "#0D1520" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${pnlColor}80, ${pnlColor})` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Entry / TP / SL details ─────────────────────────────── */}
      <div className="grid grid-cols-3 divide-x divide-[#0D1520] border-t border-[#0D1520]">
        <div className="px-2 py-1.5 flex flex-col gap-0.5">
          <span className="font-mono text-[7px] text-[#3D5A6E] tracking-wider uppercase">Entry</span>
          <span className="font-mono text-[9px] text-[#7A9BB5] tabular-nums">
            {formatPrice(trade.entryPrice, trade.symbol)}
          </span>
        </div>
        <div className="px-2 py-1.5 flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <Target size={7} className="text-[#00FF88]" />
            <span className="font-mono text-[7px] text-[#3D5A6E] tracking-wider">TP</span>
          </div>
          <span className="font-mono text-[9px] text-[#00FF88] tabular-nums">
            {formatPrice(trade.tp, trade.symbol)}
          </span>
        </div>
        <div className="px-2 py-1.5 flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <ShieldOff size={7} className="text-[#FF3366]" />
            <span className="font-mono text-[7px] text-[#3D5A6E] tracking-wider">SL</span>
          </div>
          <span className="font-mono text-[9px] text-[#FF3366] tabular-nums">
            {formatPrice(trade.sl, trade.symbol)}
          </span>
        </div>
      </div>

      {/* ── Allocated margin ────────────────────────────────────── */}
      <div className="px-3 py-1.5 border-t border-[#0D1520] flex items-center justify-between">
        <span className="font-mono text-[8px] text-[#3D5A6E]">
          Margin: <span className="text-[#7A9BB5]">${formatUsdt(trade.allocatedUsdt)}</span>
        </span>
        <span className="font-mono text-[8px] text-[#3D5A6E]">
          Live: <span className="font-[600]" style={{ color: "#00F5FF" }}>
            {formatPrice(trade.currentPrice, trade.symbol)}
          </span>
        </span>
      </div>
    </motion.div>
  );
}