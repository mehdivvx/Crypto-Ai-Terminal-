"use client";

import { useState, useEffect } from "react";
import { useTradingStore, LIVE_PRICES } from "./useTradingState";
import { formatPrice } from "./utils";
import { Activity, Globe } from "lucide-react";

// --- NEON ANALOG CLOCK COMPONENT ---
function NeonAnalogClock({ time, color, active, city }: { time: Date, color: string, active: boolean, city: string }) {
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Calculate degrees for analog hands
  const hourDeg = (hours * 30) + (minutes * 0.5);
  const minDeg = (minutes * 6) + (seconds * 0.1);
  const secDeg = seconds * 6;

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-black/40 border border-white/5 rounded-xl hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
      
      {/* Background Glow when Active */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: active ? `radial-gradient(circle at center, ${color}15 0%, transparent 70%)` : 'transparent' }}
      />

      <span className="font-mono text-[11px] font-bold tracking-[2px] mb-3 z-10" style={{ color: active ? '#ffffff' : '#8b99ae', textShadow: active ? `0 0 10px ${color}80` : 'none' }}>
        {city}
      </span>

      {/* Analog Clock Face */}
      <div 
        className="relative w-[70px] h-[70px] rounded-full border-[2px] mb-3 z-10 flex items-center justify-center shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]"
        style={{ 
          borderColor: active ? color : 'rgba(255,255,255,0.1)',
          boxShadow: active ? `0 0 15px ${color}40, inset 0 0 15px ${color}40` : 'none',
          background: '#040608'
        }}
      >
        {/* Clock Ticks (12 hours) */}
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-[1.5px] h-[5px] origin-[center_35px]"
            style={{ 
              background: active ? `${color}60` : 'rgba(255,255,255,0.2)', 
              transform: `rotate(${i * 30}deg) translateY(-35px)` 
            }} 
          />
        ))}

        {/* Center Pivot Dot */}
        <div className="w-[5px] h-[5px] rounded-full absolute z-30" style={{ background: active ? '#fff' : '#8b99ae', boxShadow: active ? `0 0 8px ${color}` : 'none' }} />
        
        {/* Hour Hand */}
        <div className="absolute w-[3px] h-[18px] origin-bottom rounded-full z-20" style={{ background: active ? color : '#8b99ae', transform: `translateY(-9px) rotate(${hourDeg}deg)`, boxShadow: active ? `0 0 5px ${color}` : 'none' }} />
        
        {/* Minute Hand */}
        <div className="absolute w-[2px] h-[26px] origin-bottom rounded-full z-20" style={{ background: active ? '#fff' : '#4f5b70', transform: `translateY(-13px) rotate(${minDeg}deg)`, boxShadow: active ? `0 0 5px ${color}` : 'none' }} />
        
        {/* Second Hand */}
        <div className="absolute w-[1px] h-[30px] origin-bottom rounded-full z-20" style={{ background: '#ff2a6d', transform: `translateY(-15px) rotate(${secDeg}deg)` }} />
      </div>

      <span className="font-mono text-[9px] font-bold tracking-[1px] z-10" style={{ color: active ? color : '#4f5b70' }}>
        {active ? "● MARKET OPEN" : "MARKET CLOSED"}
      </span>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function MarketIntelligence() {
  const [activeTab, setActiveTab] = useState<"INTELLIGENCE"|"TIMEZONES">("INTELLIGENCE");
  const [time, setTime] = useState(new Date());

  const activePair = useTradingStore((s) => s.activePair);
  const asks = useTradingStore((s) => s.asks);
  const bids = useTradingStore((s) => s.bids);
  const rsi = useTradingStore((s) => s.rsi);
  const currentPrice = LIVE_PRICES[activePair] || 0;

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // MAXIMUM INTENSITY NEON COLORS
  const C_GREEN = "#00ff9d";
  const C_RED = "#ff2a6d";
  const C_CYAN = "#00d4ff";
  const C_AMBER = "#ffb800";

  // 1. REAL ORDER BOOK USDT DEPTH
  const bidUsdt = bids.reduce((acc, b) => acc + (b[0] * b[1]), 0);
  const askUsdt = asks.reduce((acc, a) => acc + (a[0] * a[1]), 0);
  const totalUsdt = bidUsdt + askUsdt;
  
  const buyPct = totalUsdt > 0 ? Math.round((bidUsdt / totalUsdt) * 100) : 50;
  const sellPct = totalUsdt > 0 ? Math.round((askUsdt / totalUsdt) * 100) : 50;
  const isBullish = buyPct >= sellPct;
  const activeColor = isBullish ? C_GREEN : C_RED;

  // 2. IMBALANCE HEATMAP LOGIC
  let imbalanceText = "MARKET BALANCED";
  let imbalanceColor = C_CYAN;
  
  if (askUsdt > bidUsdt * 1.8) {
      imbalanceText = "HEAVY ASK WALLS";
      imbalanceColor = C_RED;
  } else if (bidUsdt > askUsdt * 1.8) {
      imbalanceText = "HEAVY BID WALLS";
      imbalanceColor = C_GREEN;
  } else if (askUsdt > bidUsdt * 1.3) {
      imbalanceText = "SELLERS DOMINATING";
      imbalanceColor = C_AMBER;
  } else if (bidUsdt > askUsdt * 1.3) {
      imbalanceText = "BUYERS DOMINATING";
      imbalanceColor = C_GREEN;
  }

  const formatDepth = (val: number) => {
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
    return `$${val.toFixed(0)}`;
  };

  // 3. MTF STABILIZATION
  const mtfData = ["5M", "15M", "30M", "1H", "4H"].map((tf, index) => {
    const offset = (index - 2) * 8; 
    let bp = Math.max(10, Math.min(90, rsi - offset));
    if (tf === "1H" || tf === "4H") bp = (bp + 50) / 2; 

    let trend = "NEUT", color = C_AMBER;
    if (bp > 58) { trend = "BULL"; color = C_GREEN; }
    else if (bp < 42) { trend = "BEAR"; color = C_RED; }
    
    return { tf, trend, color, val: Math.round(bp) };
  });

  // 4. CLOCKS CALCULATION
  const getCityDate = (offset: number) => {
    const utc = time.getTime() + (time.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * offset));
  };

  const CLOCKS = [
    { city: "CHICAGO",   date: getCityDate(-5), color: "#ffb800", active: time.getUTCHours() >= 14 && time.getUTCHours() <= 21 },
    { city: "NEW YORK",  date: getCityDate(-4), color: "#00d4ff", active: time.getUTCHours() >= 13 && time.getUTCHours() <= 20 },
    { city: "LONDON",    date: getCityDate(1),  color: "#b026ff", active: time.getUTCHours() >= 8  && time.getUTCHours() <= 16 },
    { city: "FRANKFURT", date: getCityDate(2),  color: "#00d4ff", active: time.getUTCHours() >= 7  && time.getUTCHours() <= 15 },
    { city: "DUBAI",     date: getCityDate(4),  color: "#ffb800", active: time.getUTCHours() >= 6  && time.getUTCHours() <= 14 },
    { city: "HONG KONG", date: getCityDate(8),  color: "#ff2a6d", active: time.getUTCHours() >= 1  && time.getUTCHours() <= 8 },
    { city: "TOKYO",     date: getCityDate(9),  color: "#ff2a6d", active: time.getUTCHours() >= 0  && time.getUTCHours() <= 6 },
    { city: "SYDNEY",    date: getCityDate(10), color: "#00ff9d", active: time.getUTCHours() >= 22 || time.getUTCHours() <= 4 },
  ];

  return (
    <div 
      className="relative h-full flex flex-col rounded-[16px] overflow-hidden transition-all duration-300"
      style={{
        boxShadow: `0 0 50px ${activeColor}40, inset 0 0 20px ${activeColor}30`,
        border: `1px solid ${activeColor}80`,
        backgroundColor: `${activeColor}0A` 
      }}
    >
      {/* ── THE LIQUID COLOR WASH ── */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none transition-colors duration-300"
        style={{ background: `radial-gradient(circle at 50% 0%, ${activeColor}25 0%, transparent 70%)` }}
      />

      <div className="relative z-10 flex flex-col h-full w-full bg-[#0a0c10]/60 backdrop-blur-[40px] rounded-[15px] overflow-hidden">
        
        {/* Header with Tabs (LIVE Box Completely Removed) */}
        <div className="relative z-10 flex items-center px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab("INTELLIGENCE")}
              className={`font-mono text-[10px] font-bold tracking-[2px] px-3 py-1.5 rounded-[6px] transition-all duration-300 ${activeTab === "INTELLIGENCE" ? "bg-[#00d4ff]/10 text-[#00d4ff] shadow-[inset_0_0_10px_rgba(0,212,255,0.2)] border border-[#00d4ff]/20" : "text-[#4f5b70] hover:text-white border border-transparent"}`}
            >
              <Activity size={12} className="inline mr-1.5 mb-0.5" /> INTELLIGENCE
            </button>
            <button 
              onClick={() => setActiveTab("TIMEZONES")}
              className={`font-mono text-[10px] font-bold tracking-[2px] px-3 py-1.5 rounded-[6px] transition-all duration-300 ${activeTab === "TIMEZONES" ? "bg-[#00d4ff]/10 text-[#00d4ff] shadow-[inset_0_0_10px_rgba(0,212,255,0.2)] border border-[#00d4ff]/20" : "text-[#4f5b70] hover:text-white border border-transparent"}`}
            >
              <Globe size={12} className="inline mr-1.5 mb-0.5" /> TIMEZONES
            </button>
          </div>
        </div>

        <div className="relative z-10 p-5 flex-1 overflow-y-auto custom-scrollbar">
          
          {activeTab === "INTELLIGENCE" && (
            <>
              {/* Top Cards (Buyers vs Sellers %) */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#000000]/60 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center shadow-[inset_0_2px_20px_rgba(0,0,0,0.8)]">
                  <div className="font-num text-4xl font-bold" style={{ color: C_GREEN, textShadow: `0 0 25px ${C_GREEN}90` }}>
                    {buyPct}%
                  </div>
                  <div className="font-mono text-[10px] font-bold text-[#8b99ae] tracking-[3px] mt-2">
                    BUYER DEPTH
                  </div>
                </div>
                <div className="bg-[#000000]/60 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center shadow-[inset_0_2px_20px_rgba(0,0,0,0.8)]">
                  <div className="font-num text-4xl font-bold" style={{ color: C_RED, textShadow: `0 0 25px ${C_RED}90` }}>
                    {sellPct}%
                  </div>
                  <div className="font-mono text-[10px] font-bold text-[#8b99ae] tracking-[3px] mt-2">
                    SELLER DEPTH
                  </div>
                </div>
              </div>

              {/* LIVE ORDER BOOK IMBALANCE */}
              <div className="mb-8">
                <div className="flex justify-between items-end mb-3">
                  <div className="font-display text-[10px] font-bold text-[#8b99ae] tracking-[4px] uppercase">
                    LIVE ORDER BOOK IMBALANCE
                  </div>
                </div>
                
                <div className="bg-[#000000]/60 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] p-4">
                  
                  {/* Status Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: imbalanceColor, boxShadow: `0 0 10px ${imbalanceColor}` }} />
                    <span className="font-display text-[13px] font-bold tracking-widest uppercase" style={{ color: imbalanceColor, textShadow: `0 0 15px ${imbalanceColor}80` }}>
                      {imbalanceText}
                    </span>
                  </div>

                  {/* Exact USDT Pools */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-[#8b99ae] text-[9px] font-bold tracking-[1px] mb-1">TOTAL BIDS (SUPPORT)</div>
                      <div className="font-num text-[16px] text-[#00ff9d]" style={{ textShadow: `0 0 15px ${C_GREEN}40` }}>
                        {formatDepth(bidUsdt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#8b99ae] text-[9px] font-bold tracking-[1px] mb-1">TOTAL ASKS (RESISTANCE)</div>
                      <div className="font-num text-[16px] text-[#ff2a6d]" style={{ textShadow: `0 0 15px ${C_RED}40` }}>
                        {formatDepth(askUsdt)}
                      </div>
                    </div>
                  </div>

                  {/* Visual Imbalance Bar */}
                  <div className="w-full h-[6px] bg-[#1a1f2e] rounded-full overflow-hidden flex shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                     <div 
                       className="h-full transition-all duration-500 ease-out" 
                       style={{ width: `${buyPct}%`, background: `linear-gradient(90deg, ${C_GREEN}40, ${C_GREEN})`, boxShadow: `0 0 10px ${C_GREEN}` }} 
                     />
                     <div 
                       className="h-full transition-all duration-500 ease-out" 
                       style={{ width: `${sellPct}%`, background: `linear-gradient(90deg, ${C_RED}, ${C_RED}40)`, boxShadow: `0 0 10px ${C_RED}` }} 
                     />
                  </div>
                </div>
              </div>

              {/* MTF Table */}
              <div className="mb-8">
                <div className="font-display text-[10px] font-bold text-[#8b99ae] tracking-[4px] uppercase mb-3">
                  MULTI-TIMEFRAME
                </div>
                <div className="bg-[#000000]/60 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
                  <div className="grid grid-cols-[40px_1fr_2fr_50px] px-4 py-3 border-b border-white/10 font-mono text-[9px] text-[#4f5b70] tracking-[2px]">
                    <span>TF</span><span>TREND</span><span>STR</span><span className="text-right">REV%</span>
                  </div>
                  {mtfData.map((row) => (
                    <div key={row.tf} className="grid grid-cols-[40px_1fr_2fr_50px] px-4 py-3 border-b border-white/10 last:border-0 font-mono text-[10px] items-center">
                      <span className="text-[#00f0ff] font-bold drop-shadow-[0_0_8px_#00f0ff]">{row.tf}</span>
                      <span style={{ color: row.color, textShadow: `0 0 10px ${row.color}80` }} className="font-bold">{row.trend}</span>
                      <div className="flex items-center pr-4">
                        <div className="h-2 w-full bg-[#000000] rounded-full border border-white/10 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${row.val + 10}%`, backgroundColor: row.color, boxShadow: `0 0 15px ${row.color}` }} />
                        </div>
                      </div>
                      <span className="text-right font-num font-bold" style={{ color: C_GREEN, textShadow: `0 0 10px ${C_GREEN}80` }}>{row.val}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Levels Table */}
              <div>
                <div className="font-display text-[10px] font-bold text-[#8b99ae] tracking-[4px] uppercase mb-3">
                  KEY LEVELS
                </div>
                <div className="bg-[#000000]/60 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] p-2">
                  {[
                    { label: "RESISTANCE 2", val: currentPrice * 1.009, col: C_RED },
                    { label: "RESISTANCE 1", val: currentPrice * 1.004, col: C_RED },
                    { label: "▶ CURRENT", val: currentPrice, col: "#00f0ff", isCurrent: true },
                    { label: "SUPPORT 1", val: currentPrice * 0.995, col: C_GREEN },
                    { label: "SUPPORT 2", val: currentPrice * 0.991, col: C_GREEN },
                  ].map((lvl, i) => (
                    <div key={i} className={`flex justify-between items-center px-3 py-3 border-b border-white/10 last:border-0 rounded-lg ${lvl.isCurrent ? 'bg-white/[0.08]' : ''}`}>
                      <span className={`font-mono text-[10px] font-bold tracking-[1px] ${lvl.isCurrent ? 'text-white' : 'text-[#8b99ae]'}`}>{lvl.label}</span>
                      <span className="font-num text-[13px] font-bold" style={{ color: lvl.col, textShadow: `0 0 15px ${lvl.col}90` }}>
                        {formatPrice(lvl.val, activePair)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "TIMEZONES" && (
            <div className="w-full h-full">
              <div className="font-display text-[10px] font-bold text-[#8b99ae] tracking-[4px] uppercase mb-4 text-center">
                GLOBAL MARKET SESSIONS
              </div>
              <div className="grid grid-cols-2 gap-4 pb-4">
                {CLOCKS.map((clock, i) => (
                  <NeonAnalogClock key={i} time={clock.date} color={clock.color} active={clock.active} city={clock.city} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}