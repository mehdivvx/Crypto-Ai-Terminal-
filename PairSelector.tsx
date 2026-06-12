"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { useTradingStore, SYMBOLS, LIVE_PRICES, BASE_PRICES } from "@/hooks/useTradingState";
import { TokenIcon } from "./TokenIcons";
import { formatPrice, cn } from "@/lib/utils";

export default function PairSelector() {
  const activePair   = useTradingStore(s => s.activePair);
  const setActivePair= useTradingStore(s => s.setActivePair);

  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState("");
  const [prices, setPrices] = useState<Record<string, number>>({ ...LIVE_PRICES });

  const containerRef = useRef<HTMLDivElement>(null);

  // Refresh prices in dropdown every second
  useEffect(() => {
    const id = setInterval(() => setPrices({ ...LIVE_PRICES }), 1000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = SYMBOLS.filter(s =>
    s.toLowerCase().includes(query.toLowerCase())
  );

  const activePrice  = prices[activePair]  ?? BASE_PRICES[activePair] ?? 0;
  const activeBase   = BASE_PRICES[activePair] ?? activePrice;
  const activeChange = activeBase ? ((activePrice - activeBase) / activeBase) * 100 : 0;
  const isPos        = activeChange >= 0;

  const handleSelect = useCallback((sym: string) => {
    setActivePair(sym);
    setOpen(false);
    setQuery("");
  }, [setActivePair]);

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-2.5 px-3 py-1.5 rounded-[5px]",
          "border transition-all duration-200 cursor-pointer",
          "bg-[#0C1118] hover:bg-[#111822]",
          open
            ? "border-[#00F5FF] shadow-[0_0_12px_rgba(0,245,255,0.25)]"
            : "border-[#1A2430] hover:border-[#2A3A4A]"
        )}
      >
        <TokenIcon symbol={activePair} size={22} />

        <div className="flex flex-col items-start leading-none">
          <span className="font-display text-[13px] font-700 text-[#E8F4F8] tracking-wider">
            {(activePair || "BTC/USDT").replace("/", " / ")}
          </span>
          <span
            className="font-mono text-[10px] mt-0.5"
            style={{ color: isPos ? "#00FF88" : "#FF3366" }}
          >
            {isPos ? "+" : ""}{activeChange.toFixed(2)}%
          </span>
        </div>

        <ChevronDown
          size={14}
          strokeWidth={2}
          className={cn(
            "text-[#3D5A6E] transition-transform duration-200 ml-1",
            open && "rotate-180 text-[#00F5FF]"
          )}
        />
      </button>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0,  scaleY: 1    }}
            exit  ={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ transformOrigin: "top" }}
            className={cn(
              "absolute top-[calc(100%+6px)] left-0 z-[200]",
              "w-64 rounded-[6px] overflow-hidden",
              "bg-[#0C1118] border border-[#1A2430]",
              "shadow-[0_0_0_1px_rgba(0,245,255,0.06),0_20px_60px_rgba(0,0,0,0.7)]"
            )}
          >
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#141C24]">
              <Search size={12} className="text-[#3D5A6E] shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search pair…"
                className={cn(
                  "flex-1 bg-transparent text-[12px] font-mono text-[#E8F4F8]",
                  "placeholder:text-[#3D5A6E] outline-none"
                )}
              />
            </div>

            {/* List */}
            <ul className="max-h-64 overflow-y-auto py-1">
              {filtered.map(sym => {
                const price  = prices[sym]       ?? BASE_PRICES[sym] ?? 0;
                const base2  = BASE_PRICES[sym]  ?? price;
                const change = base2 ? ((price - base2) / base2) * 100 : 0;
                const pos    = change >= 0;
                const active = sym === activePair;

                return (
                  <li key={sym}>
                    <button
                      onClick={() => handleSelect(sym)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2",
                        "transition-colors duration-100 cursor-pointer",
                        active
                          ? "bg-[rgba(0,245,255,0.06)] text-[#00F5FF]"
                          : "hover:bg-[#111820] text-[#7A9BB5]"
                      )}
                    >
                      <TokenIcon symbol={sym} size={18} />

                      <span
                        className={cn(
                          "flex-1 text-left font-display text-[11px] font-600 tracking-wider",
                          active ? "text-[#00F5FF]" : "text-[#C8DDE8]"
                        )}
                      >
                        {sym.replace("/", " / ")}
                      </span>

                      <div className="flex flex-col items-end leading-none">
                        <span className="font-mono text-[10px] text-[#7A9BB5]">
                          {formatPrice(price, sym)}
                        </span>
                        <span
                          className="font-mono text-[9px] mt-0.5"
                          style={{ color: pos ? "#00FF88" : "#FF3366" }}
                        >
                          {pos ? "+" : ""}{change.toFixed(2)}%
                        </span>
                      </div>

                      {active && (
                        <div className="w-1 h-1 rounded-full bg-[#00F5FF] shadow-[0_0_4px_#00F5FF]" />
                      )}
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="py-6 text-center font-mono text-[11px] text-[#3D5A6E]">
                  No pairs found
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
