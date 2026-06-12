"use client";

import { useState } from "react";
import { useTradingStore, LIVE_PRICES } from "./useTradingState";
import { formatPrice } from "./utils";
import { motion, AnimatePresence } from "framer-motion"; 
import { ChevronDown, TerminalSquare, PieChart, Flame } from "lucide-react";

const TARGET_PAIRS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", 
  "ADA/USDT", "DOGE/USDT", "AVAX/USDT", "LINK/USDT", 
  "ENA/USDT", "TAO/USDT", "ZEC/USDT", "SUI/USDT", "XAUT/USDT"
];

export default function MasterHeader() {
  const currentTab = useTradingStore((s) => s.currentTab) as any;
  const setTab = useTradingStore((s) => s.setTab) as (tab: any) => void;
  
  // Terminal Mode State
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
  const C_PINK = "#ff2a6d";
  const activeColor = isUp ? C_GREEN : C_RED;

  const tabIndex = currentTab === "TERMINAL" ? 0 : currentTab === "PORTFOLIO" ? 1 : 2;

  const formattedPriceRaw = formatPrice(currentPrice, activePair);
  const displayPrice = formattedPriceRaw.startsWith('$') ? formattedPriceRaw : `$${formattedPriceRaw}`;

  const formatVol = (v: number) => {
    if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
    if (v >= 1e3) return (v / 1e3).toFixed(2) + "K";
    return v.toFixed(2);
  };

  return (
    <header className="relative flex-shrink-0 flex flex-col bg-[#040608] rounded-[12px] border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.05)] z-50 mb-2 px-3 py-2">
      
      <style>{`
        @keyframes neonWave {
          0% { transform: translateX(-150%) skewX(-15deg); }
          100% { transform: translateX(250%) skewX(-15deg); }
        }
      `}</style>
      
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[12px] mix-blend-screen opacity-20">
        <div 
          className="absolute top-0 bottom-0 w-[150%] blur-[40px]"
          style={{ background: `linear-gradient(90deg, transparent, ${C_CYAN}40, transparent)`, animation: 'neonWave 7s infinite linear' }} 
        />
      </div>

      {/* ── ROW 1 ── */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1.5 relative z-10 gap-3 flex-nowrap whitespace-nowrap">
        
        {/* Left: Logo & Tabs */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <span className="font-display text-[17px] font-bold tracking-[1.5px] drop-shadow-md flex-shrink-0">
            <span className="text-white">CRYPTO</span>
            <span className="text-[#00d4ff] drop-shadow-[0_0_10px_rgba(0,212,255,0.6)]"> TERMINAL</span>
          </span>

          <div className="flex items-center bg-[#0d0f14] p-1 rounded-lg border border-[#00d4ff]/10 shadow-[0_0_1px_1px_rgba(0,0,0,0.8)] relative overflow-hidden flex-shrink-0 select-none">
            <motion.div
              className="absolute top-1 bottom-1 z-0 bg-[#1c2a38] rounded-md shadow-[0_0_15px_rgba(0,212,255,0.4)]"
              initial={false}
              animate={{ left: `${(tabIndex * 100) / 3}%`, width: '33.333%' }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
            />

            <div className="relative z-10 flex items-center w-full">
              <button 
                onClick={() => setTab("TERMINAL")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[9px] font-bold tracking-[1.5px] uppercase transition-colors duration-300 ${currentTab === "TERMINAL" ? "text-white" : "text-[#4f5b70] hover:text-white"}`}
              >
                <TerminalSquare size={11} className={currentTab === "TERMINAL" ? "text-white" : "text-[#4f5b70]"} />
                TERMINAL
              </button>
              
              <button 
                onClick={() => setTab("PORTFOLIO")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[9px] font-bold tracking-[1.5px] uppercase transition-colors duration-300 ${currentTab === "PORTFOLIO" ? "text-white" : "text-[#4f5b70] hover:text-white"}`}
              >
                <PieChart size={11} className={currentTab === "PORTFOLIO" ? "text-white" : "text-[#4f5b70]"} />
                PORTFOLIO
              </button>

              <button 
                onClick={() => setTab("HEATMAP")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[9px] font-bold tracking-[1.5px] uppercase transition-colors duration-300 ${currentTab === "HEATMAP" || currentTab === "LIQUIDATIONS" ? "text-white" : "text-[#4f5b70] hover:text-white"}`}
              >
                <Flame size={11} className={currentTab === "HEATMAP" || currentTab === "LIQUIDATIONS" ? "text-[#ff6b00]" : "text-[#4f5b70]"} />
                HEATMAP
              </button>
            </div>
          </div>
        </div>

        {/* Center: Custom Dropdown & Timeframes Pill */}
        <div className="flex items-center gap-1.5 bg-[#0a0c10]/80 p-1 rounded-lg border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.6)] flex-shrink-0">
          
          <div className="relative flex items-center border-r border-white/5 pr-2 pl-2 h-full z-[100]">
            <button
              onClick={() => setIsPairDropdownOpen(!isPairDropdownOpen)}
              className="flex items-center justify-between gap-2 bg-transparent border-none outline-none font-display text-[12px] font-bold tracking-[1.5px] cursor-pointer transition-colors group"
            >
              <span className="text-white group-hover:text-[#00d4ff] transition-colors">{activePair}</span>
              <ChevronDown size={12} className={`text-[#8b99ae] group-hover:text-[#00d4ff] transition-all duration-300 ${isPairDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isPairDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[998]" 
                    onClick={() => setIsPairDropdownOpen(false)} 
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-[calc(100%+10px)] left-[-10px] w-[140px] z-[999]"
                  >
                    <div className="bg-[#0a0c10]/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-1 flex flex-col">
                      <div className="max-h-[250px] overflow-y-auto custom-scrollbar flex flex-col relative z-10">
                        {TARGET_PAIRS.map(pair => (
                          <button
                            key={pair}
                            onClick={() => {
                              setActivePair(pair);
                              setIsPairDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 font-display text-[11px] font-bold tracking-[1px] transition-all flex items-center justify-between group ${activePair === pair ? 'bg-[#00d4ff]/10 text-[#00d4ff]' : 'text-[#8b99ae] hover:bg-white/5 hover:text-white'}`}
                          >
                            {pair}
                            {activePair === pair && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" />
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

          <div className="flex gap-0.5 px-0.5">
            {["5m", "15m", "30m", "1h", "4h"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded-[4px] font-mono text-[9px] font-bold tracking-[1px] uppercase transition-all duration-300 ${timeframe === tf ? "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 shadow-[0_0_10px_rgba(0,212,255,0.3)]" : "text-[#4f5b70] hover:text-white hover:bg-white/5 border border-transparent"}`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Live Price */}
        <div className="flex items-center justify-end flex-shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="font-num text-[24px] font-bold tracking-wide drop-shadow-md" style={{ color: activeColor, textShadow: `0 0 15px ${activeColor}80` }}>
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
        
        {/* Row 2 Left */}
        <div className="flex items-center gap-4 font-mono text-[9px] font-bold tracking-[1.5px] uppercase flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[#00ff9d] drop-shadow-[0_0_8px_rgba(0,255,157,0.8)]">
            <span className={`w-1.5 h-1.5 rounded-full ${initialized ? 'bg-[#00ff9d] animate-pulse shadow-[0_0_8px_#00ff9d]' : 'bg-[#ff2a6d]'}`} />
            {initialized ? "LIVE DATA" : "CONNECTING..."}
          </div>
          <span className="text-[#4f5b70]">LATENCY: <span className="text-white drop-shadow-md">0MS</span></span>
          <span className="text-[#4f5b70]">SIGNALS: <span className="text-white drop-shadow-md">{signals.length}</span></span>
          <span className="text-[#4f5b70]">MY WIN: <span className="text-[#00ff9d] drop-shadow-[0_0_8px_rgba(0,255,157,0.8)]">{analytics.totalTrades > 0 ? `${analytics.userWinrate.toFixed(1)}%` : "--%"}</span></span>
          <span className="text-[#4f5b70]">AI WIN: <span className="text-[#00d4ff] drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]">{displayAiWinrate}</span></span>
        </div>

        {/* ── ROW 2 CENTER: FIXED & SMOOTH VIEW TOGGLE ── */}
        <div className="flex items-center bg-[#0d0f14]/80 p-0.5 rounded-[6px] border border-white/5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.4)] mx-auto shrink-0 relative overflow-hidden w-44">
          <button 
            onClick={() => setTerminalMode('MAIN')} 
            className={`w-1/2 text-center py-1 rounded-[4px] font-mono text-[9px] font-bold tracking-[2px] uppercase transition-all duration-300 z-10 relative ${terminalMode === 'MAIN' ? 'text-white' : 'text-[#4f5b70] hover:text-white/70'}`}
          >
            MAIN
          </button>
          <button 
            onClick={() => setTerminalMode('TECHNICAL')} 
            className={`w-1/2 text-center py-1 rounded-[4px] font-mono text-[9px] font-bold tracking-[2px] uppercase transition-all duration-300 z-10 relative ${terminalMode === 'TECHNICAL' ? 'text-white' : 'text-[#4f5b70] hover:text-white/70'}`}
          >
            TECHNICAL
          </button>
          
          {/* Gliding Background Indicator with Color Interpolation */}
          <motion.div
            className="absolute top-0.5 bottom-0.5 z-0 rounded-[4px] border"
            initial={false}
            animate={{ 
               left: terminalMode === 'MAIN' ? '2px' : 'calc(50% + 1px)', 
               width: 'calc(50% - 3px)',
               backgroundColor: terminalMode === 'MAIN' ? 'rgba(0, 212, 255, 0.12)' : 'rgba(255, 42, 109, 0.12)',
               borderColor: terminalMode === 'MAIN' ? 'rgba(0, 212, 255, 0.35)' : 'rgba(255, 42, 109, 0.35)',
               boxShadow: terminalMode === 'MAIN' ? '0 0 12px rgba(0, 212, 255, 0.4)' : '0 0 12px rgba(255, 42, 109, 0.4)'
            }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
          />
        </div>

        {/* Row 2 Right */}
        <div className="flex items-center gap-3 font-mono text-[9px] font-bold tracking-[1px] uppercase flex-shrink-0">
          <span className="text-[#4f5b70]">O: <span className="text-white">{formatPrice(lastCandle.o, activePair)}</span></span>
          <span className="text-[#4f5b70]">H: <span className="text-[#00ff9d] drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]">{formatPrice(lastCandle.h, activePair)}</span></span>
          <span className="text-[#4f5b70]">L: <span className="text-[#ff2a6d] drop-shadow-[0_0_5px_rgba(255,42,109,0.5)]">{formatPrice(lastCandle.l, activePair)}</span></span>
          <span className="text-[#4f5b70]">C: <span className="text-[#00d4ff] drop-shadow-[0_0_5px_rgba(0,212,255,0.5)]">{formatPrice(lastCandle.c, activePair)}</span></span>
          <span className="text-[#4f5b70]">VOL: <span className="text-white">{formatVol(lastCandle.v)}</span></span>
          <span className="text-[#b026ff] drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]">RSI: {rsi.toFixed(0)}</span>
        </div>

      </div>
    </header>
  );
}