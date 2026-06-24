"use client";

import { useState, useEffect } from "react";
import { useTradingStore, LIVE_PRICES } from "./useTradingState";
import { formatPrice } from "./utils";
import { motion, AnimatePresence } from "framer-motion"; 
import { ChevronDown, ChevronsRight, ChevronsLeft } from "lucide-react";

const TARGET_PAIRS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", 
  "ADA/USDT", "DOGE/USDT", "AVAX/USDT", "LINK/USDT", 
  "ENA/USDT", "TAO/USDT", "ZEC/USDT", "SUI/USDT", "XAUT/USDT"
];

export interface MasterHeaderProps {
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (v: boolean) => void;
}

export default function MasterHeader({ isSidebarExpanded, setIsSidebarExpanded }: MasterHeaderProps) {
  const terminalMode = useTradingStore((s) => s.terminalMode);
  const setTerminalMode = useTradingStore((s) => s.setTerminalMode);
  
  const activePair = useTradingStore((s) => s.activePair);
  const setActivePair = useTradingStore((s) => s.setActivePair);
  const timeframe = useTradingStore((s) => s.timeframe);
  const setTimeframe = useTradingStore((s) => s.setTimeframe);
  const candles = useTradingStore((s) => s.candles);
  const signals = useTradingStore((s) => s.signals);
  const analytics = useTradingStore((s) => s.analytics);
  const rsi = useTradingStore((s) => s.rsi);
  const initialized = useTradingStore((s) => s.initialized);
  
  const [isPairDropdownOpen, setIsPairDropdownOpen] = useState(false);

  // ─── THEME DETECTION ───
  const [isLight, setIsLight] = useState(false);
  const uiTheme = useTradingStore((s: any) => s.theme || s.isLightMode);

  useEffect(() => {
    const updateTheme = () => {
      const hasLightClass = document.documentElement.classList.contains("light") || document.documentElement.getAttribute('data-theme') === 'light';
      setIsLight(uiTheme === "light" || uiTheme === true || hasLightClass);
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, [uiTheme]);
  
  const currentPrice = LIVE_PRICES[activePair] || 0;

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : { o: 0, h: 0, l: 0, c: 0, v: 0 };
  const firstCandle = candles.length > 0 ? candles[0] : { c: currentPrice || 1 };
  const pctChange = ((currentPrice - firstCandle.c) / firstCandle.c) * 100;
  const isUp = pctChange >= 0;

  const hasActivity = signals.length > 0 || analytics.totalTrades > 0;
  const displayAiWinrate = hasActivity ? `${analytics.globalAiWinrate.toFixed(1)}%` : "--%";

  const C_GREEN = "#00ff9d";
  const C_RED = "#ff2a6d";
  const C_CYAN = "#00d4ff";
  
  // Theme-adaptive text colors
  const activeColor = isUp ? (isLight ? "#059669" : C_GREEN) : (isLight ? "#e11d48" : C_RED);
  const tCyan = isLight ? "#0284c7" : C_CYAN;

  const formattedPriceRaw = formatPrice(currentPrice, activePair);
  const displayPrice = formattedPriceRaw.startsWith('$') ? formattedPriceRaw : `$${formattedPriceRaw}`;

  const formatVol = (v: number) => {
    if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
    if (v >= 1e3) return (v / 1e3).toFixed(2) + "K";
    return v.toFixed(2);
  };

  return (
    <header className="relative flex-shrink-0 flex flex-col rounded-[12px] border transition-colors duration-300 mb-2 px-3 py-2 z-[100]"
      style={{
        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.6)' : 'var(--void)',
        borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.05)',
        boxShadow: isLight ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : '0 0 30px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.05)'
      }}
    >
      
      {/* Background Neon Wash (Disabled in Light Mode for cleaner look) */}
      {!isLight && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[12px] mix-blend-screen opacity-20">
          <div 
            className="absolute top-0 bottom-0 w-[150%] blur-[40px]"
            style={{ background: `linear-gradient(90deg, transparent, ${C_CYAN}40, transparent)`, animation: 'neonWave 7s infinite linear' }} 
          />
        </div>
      )}

      {/* ── ROW 1 ── */}
      <div className={`flex items-center justify-between border-b pb-2 mb-1.5 relative z-20 gap-3 flex-nowrap whitespace-nowrap transition-colors ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
        
        {/* Left Elements Wrapper */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <button 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${
              isLight 
                ? 'bg-white border-slate-200 text-slate-500 hover:text-cyan-600 shadow-sm' 
                : 'bg-[var(--surface)] border-white/5 text-[var(--text-secondary)] hover:text-[var(--neon-cyan)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.02)]'
            }`}
          >
            {isSidebarExpanded ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
          </button>
          
          {/* LOGO */}
          <span className="ml-10 font-sans text-[24px] font-bold tracking-[0.2em] flex-shrink-0 flex items-center">
            <span className={`drop-shadow-md ${isLight ? 'text-slate-800' : 'text-[var(--text-primary)]'}`}>CRYPTO</span>
            <span 
              className={`ml-3 font-normal ${isLight ? 'text-cyan-600' : 'text-[#e6ffff]'}`}
              style={{ textShadow: isLight ? 'none' : '0 0 5px var(--neon-cyan), 0 0 15px var(--neon-cyan)' }}
            >
              TERMINAL
            </span>
          </span>
        </div>

        {/* ── ENHANCED CENTER SECTION: PAIR & TIMEFRAMES ── */}
        <div className={`flex items-center gap-1.5 p-1 rounded-xl border flex-shrink-0 transition-all duration-300 ${
          isLight 
            ? 'bg-slate-200/60 border-slate-300 shadow-[inset_0_2px_5px_rgba(0,0,0,0.05)]' 
            : 'bg-[var(--surface)] border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.6)]'
        }`}>
          
          <div className={`relative flex items-center border-r pr-2 pl-2 h-full z-[100] transition-colors ${isLight ? 'border-slate-300' : 'border-white/5'}`}>
            <button
              onClick={() => setIsPairDropdownOpen(!isPairDropdownOpen)}
              className="flex items-center justify-between gap-3 bg-transparent border-none outline-none font-display text-[12px] tracking-[1.5px] cursor-pointer transition-colors group"
            >
              <span className={`font-black transition-colors ${isLight ? 'text-slate-800' : 'text-[var(--text-primary)] group-hover:text-[var(--neon-cyan)]'}`}>
                {activePair}
              </span>
              <ChevronDown size={12} className={`transition-all duration-300 ${isLight ? 'text-slate-500' : 'text-[var(--text-secondary)] group-hover:text-[var(--neon-cyan)]'} ${isPairDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isPairDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[998]" onClick={() => setIsPairDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-[calc(100%+12px)] left-[-5px] w-[140px] z-[999]"
                  >
                    <div className={`backdrop-blur-xl border rounded-lg overflow-hidden py-1 flex flex-col shadow-xl ${
                      isLight ? 'bg-white/95 border-slate-200' : 'bg-[var(--panel)]/95 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)]'
                    }`}>
                      <div className="max-h-[250px] overflow-y-auto custom-scrollbar flex flex-col relative z-10">
                        {TARGET_PAIRS.map(pair => (
                          <button
                            key={pair}
                            onClick={() => {
                              setActivePair(pair);
                              setIsPairDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 font-display text-[11px] font-bold tracking-[1px] transition-all flex items-center justify-between group ${
                              activePair === pair 
                                ? (isLight ? 'bg-cyan-50 text-cyan-600' : 'bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]') 
                                : (isLight ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white')
                            }`}
                          >
                            {pair}
                            {activePair === pair && (
                              <div className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-cyan-500' : 'bg-[var(--neon-cyan)] shadow-[0_0_8px_var(--neon-cyan)]'}`} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-0.5 px-1">
            {["1m", "5m", "15m", "30m", "1h", "4h"].map((tf) => {
              const isActive = timeframe === tf;
              return (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-[8px] font-mono text-[10px] font-bold tracking-[1px] uppercase transition-all duration-300 ${
                    isActive 
                      ? (isLight 
                          ? "bg-white text-cyan-600 shadow-sm border border-slate-200 scale-105" 
                          : "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/40 shadow-[0_0_10px_rgba(0,212,255,0.3)] scale-105")
                      : (isLight 
                          ? "text-slate-500 hover:text-slate-800 hover:bg-slate-300/50 border border-transparent"
                          : "text-[var(--text-secondary)] hover:text-white hover:bg-white/5 border border-transparent")
                  }`}
                >
                  {tf}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Section Price Tags */}
        <div className="flex items-center justify-end flex-shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="font-num text-[32px] font-bold tracking-wide" style={{ color: activeColor, textShadow: isLight ? 'none' : `0 0 15px ${activeColor}80` }}>
              {displayPrice}
            </span>
            <span className="font-mono text-[10px] font-bold" style={{ color: activeColor }}>
              {isUp ? "+" : ""}{pctChange.toFixed(2)}% 24H
            </span>
          </div>
        </div>
      </div>

      {/* ── ROW 2 ── */}
      <div className="flex items-center justify-between relative z-10 px-1 gap-4 overflow-x-auto select-none scrollbar-none whitespace-nowrap">
        
        <div className="flex items-center gap-4 font-mono text-[9px] font-bold tracking-[1.5px] uppercase flex-shrink-0">
          <div className={`flex items-center gap-1.5 ${isLight ? 'text-emerald-600' : 'text-[#00ff9d] drop-shadow-[0_0_8px_rgba(0,255,157,0.8)]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${initialized ? (isLight ? 'bg-emerald-500 animate-pulse' : 'bg-[#00ff9d] animate-pulse shadow-[0_0_8px_#00ff9d]') : (isLight ? 'bg-rose-500' : 'bg-[#ff2a6d]')}`} />
            {initialized ? "LIVE DATA" : "CONNECTING..."}
          </div>
          <span className={isLight ? "text-slate-400" : "text-[var(--text-secondary)]"}>LATENCY: <span className={isLight ? "text-slate-700" : "text-[var(--text-primary)]"}>0MS</span></span>
          <span className={isLight ? "text-slate-400" : "text-[var(--text-secondary)]"}>SIGNALS: <span className={isLight ? "text-slate-700" : "text-[var(--text-primary)]"}>{signals.length}</span></span>
          <span className={isLight ? "text-slate-400" : "text-[var(--text-secondary)]"}>MY WIN: <span className={isLight ? 'text-emerald-600' : "text-[#00ff9d] drop-shadow-[0_0_8px_rgba(0,255,157,0.8)]"}>{analytics.totalTrades > 0 ? `${analytics.userWinrate.toFixed(1)}%` : "--%"}</span></span>
          <span className={isLight ? "text-slate-400" : "text-[var(--text-secondary)]"}>AI WIN: <span className={isLight ? 'text-cyan-600' : "text-[var(--neon-cyan)] drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]"}>{displayAiWinrate}</span></span>
        </div>

        {/* ── ENHANCED MODE SWITCHER ── */}
        <div className={`flex items-center p-1 rounded-xl border mx-auto shrink-0 relative overflow-hidden w-56 transition-all duration-300 ${
          isLight 
            ? 'bg-slate-200/60 border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]' 
            : 'bg-[var(--surface)] border-white/5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.4)]'
        }`}>
          <button 
            onClick={() => setTerminalMode('MAIN')} 
            className={`w-1/2 text-center py-1.5 rounded-[8px] font-mono text-[9px] font-bold tracking-[2px] uppercase transition-all duration-300 z-10 relative ${
              terminalMode === 'MAIN' 
                ? (isLight ? 'text-cyan-600' : 'text-white') 
                : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]')
            }`}
          >
            MAIN
          </button>
          <button 
            onClick={() => setTerminalMode('TECHNICAL')} 
            className={`w-1/2 text-center py-1.5 rounded-[8px] font-mono text-[9px] font-bold tracking-[2px] uppercase transition-all duration-300 z-10 relative ${
              terminalMode === 'TECHNICAL' 
                ? (isLight ? 'text-cyan-600' : 'text-white') 
                : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]')
            }`}
          >
            TECHNICAL
          </button>
          
          <motion.div
            className={`absolute top-1 bottom-1 z-0 rounded-[8px] border`}
            initial={false}
            animate={{ 
               left: terminalMode === 'MAIN' ? '4px' : 'calc(50% + 2px)', 
               width: 'calc(50% - 6px)',
               backgroundColor: isLight ? '#ffffff' : (terminalMode === 'MAIN' ? 'rgba(0, 212, 255, 0.12)' : 'rgba(255, 42, 109, 0.12)'),
               borderColor: isLight ? '#e2e8f0' : (terminalMode === 'MAIN' ? 'rgba(0, 212, 255, 0.35)' : 'rgba(255, 42, 109, 0.35)'),
               boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.1)' : (terminalMode === 'MAIN' ? '0 0 12px rgba(0, 212, 255, 0.4)' : '0 0 12px rgba(255, 42, 109, 0.4)')
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        </div>

        <div className="flex items-center gap-3 font-mono text-[9px] font-bold tracking-[1px] uppercase flex-shrink-0">
          <span className={isLight ? "text-slate-400" : "text-[var(--text-secondary)]"}>O: <span className={isLight ? "text-slate-700" : "text-[var(--text-primary)]"}>{formatPrice(lastCandle.o, activePair)}</span></span>
          <span className={isLight ? "text-slate-400" : "text-[var(--text-secondary)]"}>H: <span className={isLight ? 'text-emerald-500' : "text-[#00ff9d] drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]"}>{formatPrice(lastCandle.h, activePair)}</span></span>
          <span className={isLight ? "text-slate-400" : "text-[var(--text-secondary)]"}>L: <span className={isLight ? 'text-rose-500' : "text-[#ff2a6d] drop-shadow-[0_0_5px_rgba(255,42,109,0.5)]"}>{formatPrice(lastCandle.l, activePair)}</span></span>
          <span className={isLight ? "text-slate-400" : "text-[var(--text-secondary)]"}>C: <span className={tCyan} style={{ textShadow: !isLight ? '0 0 5px rgba(0,212,255,0.5)' : 'none' }}>{formatPrice(lastCandle.c, activePair)}</span></span>
          <span className={isLight ? "text-slate-400" : "text-[var(--text-secondary)]"}>VOL: <span className={isLight ? "text-slate-700" : "text-[var(--text-primary)]"}>{formatVol(lastCandle.v)}</span></span>
          <span className={isLight ? "text-purple-600" : "text-[#b026ff] drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]"}>RSI: {rsi.toFixed(0)}</span>
        </div>
      </div>
    </header>
  );
}