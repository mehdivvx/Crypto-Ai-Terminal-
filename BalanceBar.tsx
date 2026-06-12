"use client";

import { motion, useSpring, useTransform, useMotionValue, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { useTradingStore } from "@/hooks/useTradingState";
import { formatUsdt, pnlColor, cn } from "@/lib/utils";

function AnimCounter({ value, prefix = "", suffix = "", decimals = 2, color }: {
  value: number; prefix?: string; suffix?: string; decimals?: number; color?: string;
}) {
  const ref      = useRef<HTMLSpanElement>(null);
  const displayed = useRef(value);

  useEffect(() => {
    const from = displayed.current;
    displayed.current = value;
    const ctrl = animate(from, value, {
      duration: 0.4,
      ease: "easeOut",
      onUpdate: v => {
        if (ref.current) ref.current.textContent = prefix + v.toFixed(decimals) + suffix;
      },
    });
    return ctrl.stop;
  }, [value, prefix, suffix, decimals]);

  return (
    <span
      ref={ref}
      className="tabular-nums font-mono"
      style={{ color: color ?? "#E8F4F8" }}
    >
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  );
}

export default function BalanceBar() {
  const totalBalance    = useTradingStore(s => s.totalBalance);
  const availableBalance= useTradingStore(s => s.availableBalance);
  const activeMargin    = useTradingStore(s => s.activeMargin);
  const settings        = useTradingStore(s => s.settings);
  const activeTrades    = useTradingStore(s => s.activeTrades);

  const pnl        = totalBalance - settings.startingBalance;
  const isUp       = pnl >= 0;
  const marginPct  = totalBalance > 0 ? (activeMargin / totalBalance) * 100 : 0;
  const availPct   = totalBalance > 0 ? (availableBalance / totalBalance) * 100 : 100;
  const openPnl    = activeTrades.reduce((a, t) => a + t.pnlUsdt, 0);

  return (
    <div
      className="rounded-[5px] overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0C1118, #08101A)",
        border:     "1px solid #141C24",
      }}
    >
      {/* Top row: total + PNL */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={13} className="text-[#00F5FF]" />
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-mono text-[8px] text-[#3D5A6E] tracking-wider uppercase">Portfolio Value</span>
            <span className="font-display text-[17px] font-700 text-[#E8F4F8] tabular-nums">
              ${formatUsdt(totalBalance)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5 leading-none">
          <span className="font-mono text-[8px] text-[#3D5A6E] tracking-wider uppercase">Session</span>
          <div className="flex items-center gap-1">
            {isUp
              ? <TrendingUp  size={10} className="text-[#00FF88]" />
              : <TrendingDown size={10} className="text-[#FF3366]" />
            }
            <span
              className="font-mono text-[12px] font-600 tabular-nums"
              style={{ color: isUp ? "#00FF88" : "#FF3366" }}
            >
              {pnl >= 0 ? "+" : ""}${formatUsdt(Math.abs(pnl))}
            </span>
          </div>
        </div>
      </div>

      {/* Segmented balance bar */}
      <div className="px-4 pb-2">
        <div
          className="w-full h-2 rounded-full overflow-hidden flex"
          style={{ background: "#060A0E" }}
        >
          {/* Available — cyan */}
          <motion.div
            className="h-full rounded-l-full"
            style={{ background: "linear-gradient(90deg, #00B4CC, #00F5FF)" }}
            animate={{ width: `${availPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
          {/* Margin — gold */}
          <motion.div
            className="h-full"
            style={{ background: "linear-gradient(90deg, #CC9900, #FFD700)" }}
            animate={{ width: `${marginPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
          {/* Remainder gap (should be 0 in normal state) */}
          <div className="flex-1 h-full" />
        </div>
      </div>

      {/* Sub-row: available + margin */}
      <div
        className="grid grid-cols-3 divide-x divide-[#0F1820] border-t border-[#0F1820]"
      >
        <div className="px-3 py-2 flex flex-col gap-0.5">
          <span className="font-mono text-[8px] text-[#3D5A6E] uppercase tracking-wider">Available</span>
          <span className="font-mono text-[11px] font-600 text-[#00F5FF] tabular-nums">
            ${formatUsdt(availableBalance)}
          </span>
        </div>
        <div className="px-3 py-2 flex flex-col gap-0.5">
          <span className="font-mono text-[8px] text-[#3D5A6E] uppercase tracking-wider">In Trades</span>
          <span
            className="font-mono text-[11px] font-600 tabular-nums"
            style={{ color: activeMargin > 0 ? "#FFD700" : "#3D5A6E" }}
          >
            ${formatUsdt(activeMargin)}
          </span>
        </div>
        <div className="px-3 py-2 flex flex-col gap-0.5">
          <span className="font-mono text-[8px] text-[#3D5A6E] uppercase tracking-wider">Open PNL</span>
          <span
            className="font-mono text-[11px] font-600 tabular-nums"
            style={{ color: openPnl > 0 ? "#00FF88" : openPnl < 0 ? "#FF3366" : "#3D5A6E" }}
          >
            {openPnl >= 0 ? "+" : ""}${formatUsdt(Math.abs(openPnl))}
          </span>
        </div>
      </div>
    </div>
  );
}
