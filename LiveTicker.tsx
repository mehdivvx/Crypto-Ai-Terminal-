"use client";

import { useEffect, useState } from "react";
import { SYMBOLS, LIVE_PRICES, BASE_PRICES } from "@/hooks/useTradingState";
import { formatPrice } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TickerItem {
  symbol: string;
  price:  number;
  change: number; // % from base
}

function buildItems(): TickerItem[] {
  return SYMBOLS.map(sym => {
    const live   = LIVE_PRICES[sym]  ?? BASE_PRICES[sym] ?? 0;
    const base   = BASE_PRICES[sym]  ?? live;
    const change = ((live - base) / base) * 100;
    return { symbol: sym, price: live, change };
  });
}

export default function LiveTicker() {
  const [items, setItems] = useState<TickerItem[]>(buildItems);

  // Refresh ticker display every 800ms (less than tick to smooth rendering)
  useEffect(() => {
    const id = setInterval(() => setItems(buildItems()), 800);
    return () => clearInterval(id);
  }, []);

  // Duplicate the array so the seamless marquee loop works
  const doubled = [...items, ...items];

  return (
    <div
      className="relative h-8 bg-[#060A0E] border-b border-[#141C24] overflow-hidden flex items-center"
      style={{ boxShadow: "0 1px 0 rgba(0,245,255,0.06)" }}
    >
      {/* Left fade mask */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
           style={{ background: "linear-gradient(90deg, #060A0E, transparent)" }} />
      {/* Right fade mask */}
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
           style={{ background: "linear-gradient(270deg, #060A0E, transparent)" }} />

      <div className="ticker-track">
        {doubled.map((item, i) => {
          const isPos = item.change >= 0;
          const color = isPos ? "#00FF88" : "#FF3366";
          const base  = item.symbol.split("/")[0];

          return (
            <span
              key={`${item.symbol}-${i}`}
              className="inline-flex items-center gap-1.5 px-5 select-none"
            >
              {/* Separator dot */}
              <span className="w-0.5 h-0.5 rounded-full bg-[#1A2430] mr-3" />

              {/* Token name */}
              <span className="font-display text-[10px] font-600 tracking-widest text-[#7A9BB5]">
                {base}
              </span>

              {/* Price */}
              <span
                className="font-mono text-[11px] font-500"
                style={{ color: "#E8F4F8" }}
              >
                {formatPrice(item.price, item.symbol)}
              </span>

              {/* Change */}
              <span
                className="inline-flex items-center gap-0.5 font-mono text-[10px] font-500"
                style={{ color }}
              >
                {isPos
                  ? <TrendingUp  size={9} strokeWidth={2.5} />
                  : <TrendingDown size={9} strokeWidth={2.5} />
                }
                {isPos ? "+" : ""}{item.change.toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
