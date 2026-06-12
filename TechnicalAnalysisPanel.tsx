"use client";

import React, { useEffect, useRef } from "react";
import { useTradingStore } from "./useTradingState";
import { TrendingUp, TrendingDown, Zap, Gauge, Activity } from "lucide-react";

export default function TechnicalAnalysisPanel() {
  const candles = useTradingStore((s) => s.candles) || [];
  const fundingRate = useTradingStore((s) => s.fundingRate) || 0.0015;
  const coinMetrics = useTradingStore((s) => s.coinMetrics) || {};

  const C_GREEN = "#00ff9d";
  const C_PINK = "#ff2a6d";
  const C_CYAN = "#00d4ff";
  
  // TradingView standard colors for MACD lines
  const MACD_BLUE = "#2962FF";
  const SIGNAL_ORANGE = "#FF6D00";

  // Auto-scroll ref for the MACD chart
  const scrollRef = useRef<HTMLDivElement>(null);

  // ─── 1. TRUE MACD CALCULATION (Lines + Histogram) ───
  let macdHist: number[] = [];
  let renderMacd: number[] = [];
  let renderSignal: number[] = [];

  if (candles.length > 30) {
    const closes = candles.map((c) => c.c);
    const calcEMA = (data: number[], period: number) => {
      const k = 2 / (period + 1);
      let ema = data[0];
      const res = [ema];
      for (let i = 1; i < data.length; i++) {
        ema = data[i] * k + ema * (1 - k);
        res.push(ema);
      }
      return res;
    };
    
    const ema12 = calcEMA(closes, 12);
    const ema26 = calcEMA(closes, 26);
    const macdLine = ema12.map((v, i) => v - ema26[i]);
    const signalLine = calcEMA(macdLine, 9);
    const histLine = macdLine.map((v, i) => v - signalLine[i]);

    // Slice 150 periods so the user has plenty of scrollable history
    const limit = Math.min(150, histLine.length);
    renderMacd = macdLine.slice(-limit);
    renderSignal = signalLine.slice(-limit);
    macdHist = histLine.slice(-limit);
  }

  // Auto-scroll to the right-most edge (latest data) whenever a new candle forms
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [candles.length]);

  // Extract latest values for the header like TradingView does
  const lastMacd = renderMacd[renderMacd.length - 1] || 0;
  const lastSignal = renderSignal[renderSignal.length - 1] || 0;
  const lastHist = macdHist[macdHist.length - 1] || 0;

  // Calculate dynamic scaling bounds
  const maxAbs = Math.max(
    ...renderMacd.map(Math.abs),
    ...renderSignal.map(Math.abs),
    ...macdHist.map(Math.abs),
    0.0001 // prevent division by zero
  );

  // ─── 2. TOP RSI SCANNERS ───
  const metricsArr = Object.entries(coinMetrics).map(([sym, data]) => ({ sym, ...data }));
  const bullishCoins = [...metricsArr].sort((a, b) => b.rsi - a.rsi).slice(0, 3);
  const bearishCoins = [...metricsArr].sort((a, b) => a.rsi - b.rsi).slice(0, 3);

  // ─── 3. FUNDING DIAL RADIAL MAPPED VALUES ───
  const clampedFunding = Math.max(-0.1, Math.min(0.1, fundingRate));
  const needleRotation = (clampedFunding / 0.1) * 90;
  const isBullishFunding = fundingRate >= 0;

  // ─── SVG CHART CONFIGURATION ───
  const step = 10; // 10px width per data point cell
  const rightPadding = 120; // Extra blank space to the right (allows dragging past the current candle)
  const dataWidth = macdHist.length * step;
  const totalChartWidth = Math.max(800, dataWidth + rightPadding);

  return (
    <div className="w-full h-full flex flex-col gap-3 overflow-hidden select-none p-0.5">
      
      {/* ── TOP SECTION: FULL WIDTH SCROLLABLE MACD ── */}
      <div className="flex-[1.4] min-h-0 bg-[#040608] rounded-[16px] border border-white/5 shadow-[inset_0_0_25px_rgba(0,0,0,0.9)] flex flex-col relative overflow-hidden">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] bg-[#2962FF] opacity-[0.06] blur-[80px] pointer-events-none rounded-full" />
        
        {/* Header with Dynamic TV-Style Legend */}
        <div className="flex items-center gap-3 p-3 shrink-0 relative z-10 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-[#ff2a6d]" style={{ filter: `drop-shadow(0 0 6px ${C_PINK})` }} />
            <span className="font-display text-[12px] font-bold tracking-[2px] uppercase text-white">MACD Histogram</span>
          </div>
          <span className="font-mono text-[10px] text-[#4f5b70] tracking-[1px] ml-1">12 26 9</span>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold ml-2">
            <span style={{ color: lastHist > 0 ? C_CYAN : C_PINK }}>{lastHist.toFixed(2)}</span>
            <span style={{ color: MACD_BLUE }}>{lastMacd.toFixed(2)}</span>
            <span style={{ color: SIGNAL_ORANGE }}>{lastSignal.toFixed(2)}</span>
          </div>
        </div>

        {/* Custom SVG MACD Render Engine (Scrollable) */}
        <div 
          ref={scrollRef}
          className="flex-1 w-full overflow-x-auto overflow-y-hidden custom-scrollbar relative px-1 pb-1 scroll-smooth"
        >
          {macdHist.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-[#4f5b70] tracking-[1px]">
              CALCULATING MACD MATRICES...
            </div>
          ) : (
            <div style={{ width: `${totalChartWidth}px`, height: "100%", position: "relative" }}>
              <svg 
                width="100%" 
                height="100%" 
                viewBox={`0 0 ${totalChartWidth} 100`} 
                preserveAspectRatio="none" 
                className="overflow-visible block"
              >
                {/* Zero Line extending into the padding */}
                <line x1="0" y1="50" x2={totalChartWidth} y2="50" stroke="#ffffff" strokeOpacity="0.15" strokeDasharray="2 2" strokeWidth="0.5" />
                
                {/* Histogram Bars */}
                {macdHist.map((val, i) => {
                  const isPos = val > 0;
                  const isGrowing = i === 0 ? true : (isPos ? val > macdHist[i - 1] : val < macdHist[i - 1]);
                  
                  // Map value to 0-45 scale to fit within 0-100 viewBox (leaves 5% padding)
                  const height = (Math.abs(val) / maxAbs) * 45; 
                  const y = isPos ? 50 - height : 50;
                  const x = i * step + 3; // +3 to center the thinner bars inside the step cell

                  let barColor = isPos
                    ? isGrowing ? C_CYAN : `${C_CYAN}60`
                    : isGrowing ? C_PINK : `${C_PINK}60`;

                  return (
                    <rect 
                      key={`hist-${i}`} 
                      x={x} 
                      y={y} 
                      width={step - 6} // Made bars noticeably thinner (4px width in a 10px step)
                      height={Math.max(0.5, height)} 
                      fill={barColor} 
                      rx="1" 
                    />
                  );
                })}

                {/* MACD Line (Blue) */}
                <polyline
                  points={renderMacd.map((val, i) => {
                    const x = i * step + (step / 2);
                    const y = 50 - (val / maxAbs) * 45;
                    return `${x},${y}`;
                  }).join(" ")}
                  fill="none"
                  stroke={MACD_BLUE}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />

                {/* Signal Line (Orange) */}
                <polyline
                  points={renderSignal.map((val, i) => {
                    const x = i * step + (step / 2);
                    const y = 50 - (val / maxAbs) * 45;
                    return `${x},${y}`;
                  }).join(" ")}
                  fill="none"
                  stroke={SIGNAL_ORANGE}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM SECTION: RSI SCANNERS & UPGRADED FUNDING DIAL ── */}
      <div className="flex-[1] min-h-0 flex flex-row gap-3 overflow-hidden">
        
        {/* LEFT COMPONENT: MARKET STRENGTH (RSI) */}
        <div className="flex-1 bg-[#040608] rounded-[16px] border border-white/5 p-4 flex flex-col relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden">
          <span className="font-display text-[10px] font-bold text-[#8b99ae] tracking-[2px] uppercase mb-3 flex items-center gap-1.5 shrink-0 z-10">
            <Zap size={12} className="text-[#00d4ff]" /> Market Strength (RSI)
          </span>
          <div className="flex-1 flex flex-col justify-between z-10 min-h-0">
            {bullishCoins.map((c) => (
              <div key={c.sym} className="flex items-center justify-between px-3 py-1.5 rounded-[6px] bg-gradient-to-r from-[#00d4ff]/10 to-transparent border border-[#00d4ff]/15">
                <div className="flex items-center gap-2">
                  <TrendingUp size={12} className="text-[#00d4ff]" />
                  <span className="font-mono text-[10px] font-bold text-white">{c.sym.replace("/USDT", "")}</span>
                </div>
                <span className="font-num text-[12px] font-bold text-[#00d4ff]" style={{ textShadow: `0 0 8px ${C_CYAN}` }}>
                  {c.rsi.toFixed(1)}
                </span>
              </div>
            ))}
            <div className="h-[2px] w-full bg-white/5 my-1.5 shrink-0 rounded-full" />
            {bearishCoins.map((c) => (
              <div key={c.sym} className="flex items-center justify-between px-3 py-1.5 rounded-[6px] bg-gradient-to-r from-[#ff2a6d]/10 to-transparent border border-[#ff2a6d]/15">
                <div className="flex items-center gap-2">
                  <TrendingDown size={12} className="text-[#ff2a6d]" />
                  <span className="font-mono text-[10px] font-bold text-white">{c.sym.replace("/USDT", "")}</span>
                </div>
                <span className="font-num text-[12px] font-bold text-[#ff2a6d]" style={{ textShadow: `0 0 8px ${C_PINK}` }}>
                  {c.rsi.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COMPONENT: EXPANDED HIGH-VIS FUNDING RATE GAUGE */}
        <div className="flex-[1.2] bg-[#040608] rounded-[16px] border border-white/5 p-4 flex flex-col items-center justify-between relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className={`absolute -bottom-8 w-32 h-32 blur-[40px] rounded-full pointer-events-none ${isBullishFunding ? 'bg-[#00ff9d]/10' : 'bg-[#ff2a6d]/10'}`} />
          
          <div className="w-full flex justify-between items-center shrink-0 mb-2">
            <span className="font-display text-[10px] font-bold text-[#8b99ae] tracking-[2px] uppercase flex items-center gap-1.5">
              <Gauge size={13} className={isBullishFunding ? "text-[#00ff9d]" : "text-[#ff2a6d]"} /> 
              Funding Rate
            </span>
            <span className="font-num text-[14px] font-black tracking-wide text-white bg-black/40 px-2.5 py-0.5 rounded-[4px] border border-white/5" style={{ textShadow: `0 0 15px ${isBullishFunding ? C_GREEN : C_PINK}` }}>
              {isBullishFunding ? "+" : ""}{fundingRate.toFixed(4)}%
            </span>
          </div>

          {/* Neon SVG Semi-Circular Meter with Upgraded Needle Arrow */}
          <div className="relative w-full max-w-[200px] aspect-[2/1] flex items-end justify-center mt-auto mb-3">
            <svg className="w-full h-full absolute bottom-0 left-0 overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="xMidYMax meet">
              <defs>
                <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={C_PINK} />
                  <stop offset="50%" stopColor="#b026ff" />
                  <stop offset="100%" stopColor={C_GREEN} />
                </linearGradient>
                <filter id="lightningArc">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              {/* Thick Background Arc track */}
              <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="#11161d" strokeWidth="8" strokeLinecap="round" />
              {/* Active Neon Lightning Track */}
              <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" filter="url(#lightningArc)" opacity="0.95" />
              
              {/* Zero Marker Tick */}
              <line x1="50" y1="5" x2="50" y2="12" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
            </svg>
            
            {/* Highly Visible Arrow-tipped Needle */}
            <div 
              className="absolute bottom-[2px] w-4 h-[95%] origin-bottom transition-transform duration-700 ease-out z-10 flex flex-col items-center"
              style={{ transform: `rotate(${needleRotation}deg)` }}
            >
              {/* Prominent White Arrow Head Tip */}
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-white" style={{ filter: `drop-shadow(0 0 6px ${isBullishFunding ? C_GREEN : C_PINK})` }} />
              {/* Thick Glowing Needle Body */}
              <div 
                className="w-[3px] flex-1 bg-white"
                style={{ boxShadow: `0 0 10px ${isBullishFunding ? C_GREEN : C_PINK}` }}
              />
              {/* Center Pivot Anchor */}
              <div className="w-3 h-3 bg-white rounded-full absolute -bottom-1.5" style={{ boxShadow: `0 0 10px ${isBullishFunding ? C_GREEN : C_PINK}` }} />
            </div>
          </div>

          {/* Large, Explicit Range Numbers */}
          <div className="w-full flex justify-between font-mono text-[10px] font-black text-slate-300 tracking-wider px-2 shrink-0 mt-2 relative z-10">
            <span className="text-[#ff2a6d] bg-[#ff2a6d]/10 px-2 py-0.5 rounded-[4px] border border-[#ff2a6d]/20">-0.1%</span>
            <span className="text-slate-400 font-bold self-center opacity-50">0.00%</span>
            <span className="text-[#00ff9d] bg-[#00ff9d]/10 px-2 py-0.5 rounded-[4px] border border-[#00ff9d]/20">+0.1%</span>
          </div>
        </div>

      </div>
    </div>
  );
}