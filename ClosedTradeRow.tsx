"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, MinusCircle, TrendingUp, TrendingDown } from "lucide-react";
import { type ClosedTrade } from "@/hooks/useTradingState";
import { TokenIcon } from "@/components/header/TokenIcons";
import { formatUsdt, formatDuration } from "@/lib/utils";

const STATUS_CFG = {
  CLOSED_TP:     { label: "TP HIT",  color: "#00FF88", Icon: CheckCircle2 },
  CLOSED_SL:     { label: "SL HIT",  color: "#FF3366", Icon: XCircle      },
  CLOSED_MANUAL: { label: "MANUAL",  color: "#FFD700", Icon: MinusCircle  },
} as const;

interface Props { trade: ClosedTrade; index: number; }

export default function ClosedTradeRow({ trade, index }: Props) {
  const cfg       = STATUS_CFG[trade.status];
  const isProfit  = trade.pnlUsdt >= 0;
  const pnlColor  = isProfit ? "#00FF88" : "#FF3366";
  const isLong    = trade.direction === "LONG";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      className="flex items-center gap-2 px-2 py-2 rounded-[4px] group transition-colors duration-100 hover:bg-[rgba(255,255,255,0.015)]"
    >
      {/* Token icon */}
      <div className="shrink-0">
        <TokenIcon symbol={trade.symbol} size={18} />
      </div>

      {/* Symbol + direction */}
      <div className="flex flex-col gap-0.5 leading-none min-w-0 w-[68px]">
        <span className="font-display text-[9px] font-700 text-[#C8DDE8] tracking-wider truncate">
          {trade.symbol.split("/")[0]}
        </span>
        <span className="flex items-center gap-0.5 font-mono text-[8px]"
              style={{ color: isLong ? "#00FF88" : "#FF3366" }}>
          {isLong
            ? <TrendingUp  size={7} strokeWidth={3} />
            : <TrendingDown size={7} strokeWidth={3} />
          }
          {trade.direction}
        </span>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-1 shrink-0">
        <cfg.Icon size={9} style={{ color: cfg.color }} strokeWidth={2} />
        <span className="font-mono text-[8px] tracking-wider" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      <div className="flex-1" />

      {/* PNL */}
      <div className="flex flex-col items-end gap-0.5 leading-none shrink-0">
        <span className="font-mono text-[10px] font-600 tabular-nums"
              style={{ color: pnlColor }}>
          {isProfit ? "+" : ""}${formatUsdt(Math.abs(trade.pnlUsdt))}
        </span>
        <span className="font-mono text-[8px] tabular-nums"
              style={{ color: pnlColor, opacity: 0.65 }}>
          {isProfit ? "+" : ""}{trade.pnlPct.toFixed(2)}%
        </span>
      </div>

      {/* Duration */}
      <span className="font-mono text-[8px] text-[#3D5A6E] shrink-0 w-10 text-right">
        {formatDuration(trade.durationMs)}
      </span>
    </motion.div>
  );
}
