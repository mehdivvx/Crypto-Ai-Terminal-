"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useTradingStore } from "./useTradingState";
import { TrendingUp, TrendingDown, Zap, Gauge, Activity, Layers, Sliders, BarChart3, Target, Clock } from "lucide-react";

// Master list of all tracked market pairs
const TARGET_PAIRS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT",
  "ADA/USDT", "DOGE/USDT", "AVAX/USDT", "LINK/USDT",
  "ENA/USDT", "TAO/USDT", "ZEC/USDT", "SUI/USDT", "XAUT/USDT"
];

// ─── UN-WIPEABLE MODULE MEMORY CACHE ───
const PREDICTION_MEMORY = {
  liveAccuracy: [] as boolean[],
  lockedPred: null as {bias: string, prob: number} | null,
  context: { pair: "", tf: "", sig: null as string | null }
};

// Helper: Cubic Bezier Path Generator for Smooth Graphs
function generateSmoothPath(points: number[][]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0][0]},${points[0][1]}`;
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export default function TechnicalAnalysisPanel() {
  const candles = useTradingStore((s) => s.candles) || [];
  const fundingRate = useTradingStore((s) => s.fundingRate) || 0.0015;
  const coinMetrics = useTradingStore((s) => s.coinMetrics) || {};
  const activePair = useTradingStore((s) => s.activePair) || "BTC/USDT";
  const timeframe = useTradingStore((s) => s.timeframe) || "15m";

  const [activeTab, setActiveTab] = useState<"t1" | "t2">("t1");

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

  const C_GREEN = "#00ff9d";
  const C_PINK = "#ff2a6d";
  const C_CYAN = "#00d4ff";
  const MACD_BLUE = "#2962FF";
  const SIGNAL_ORANGE = "#FF6D00";

  // Light Mode Colors
  const T_GREEN = isLight ? "#059669" : C_GREEN;
  const T_RED = isLight ? "#e11d48" : C_PINK;
  const T_CYAN = isLight ? "#0284c7" : C_CYAN;

  const scrollRef = useRef<HTMLDivElement>(null);
  const volGraphScrollRef = useRef<HTMLDivElement>(null);

  // ─── 1. TRUE MACD CALCULATION ───
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

    const limit = Math.min(150, histLine.length);
    renderMacd = macdLine.slice(-limit);
    renderSignal = signalLine.slice(-limit);
    macdHist = histLine.slice(-limit);
  }

  useEffect(() => {
    if (activeTab === "t1" && scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    if (activeTab === "t2" && volGraphScrollRef.current) volGraphScrollRef.current.scrollLeft = volGraphScrollRef.current.scrollWidth;
  }, [candles.length, activeTab]);

  const lastMacd = renderMacd[renderMacd.length - 1] || 0;
  const lastSignal = renderSignal[renderSignal.length - 1] || 0;
  const lastHist = macdHist[macdHist.length - 1] || 0;
  const maxAbs = Math.max(...renderMacd.map(Math.abs), ...renderSignal.map(Math.abs), ...macdHist.map(Math.abs), 0.0001);

  // ─── 2. RSI SCANNERS & GAUGE ───
  const { bullishCoins, bearishCoins } = useMemo(() => {
    const metricsArr = TARGET_PAIRS.map(sym => ({
      sym,
      rsi: coinMetrics[sym]?.rsi ?? 50 
    }));

    const sortedMetrics = [...metricsArr].sort((a, b) => b.rsi - a.rsi);
    
    const halfIndex = Math.ceil(sortedMetrics.length / 2);
    const top = sortedMetrics.slice(0, halfIndex).slice(0, 3);
    const bottom = sortedMetrics.slice(halfIndex).reverse().slice(0, 3);
    
    return { bullishCoins: top, bearishCoins: bottom };
  }, [coinMetrics]);

  const clampedFunding = Math.max(-0.1, Math.min(0.1, fundingRate));
  const needleRotation = (clampedFunding / 0.1) * 90;
  const isBullishFunding = fundingRate >= 0;

  const step = 10;
  const totalChartWidth = Math.max(800, (macdHist.length * step) + 120);

  // ─── 3. TECHNICAL 2: PREDICTIVE ENGINE CORE ───
  const evaluatePrediction = (history: typeof candles, activeRsi: number) => {
    if (history.length < 10) return { bias: "GREEN", prob: 50, reasons: [] };
    const last = history[history.length - 1];
    let score = 50; 
    let criteria: string[] = [];

    const isCandleGreen = last.c >= last.o;
    const avgBodySize = history.slice(-10).reduce((acc, curr) => acc + Math.abs(curr.c - curr.o), 0) / 10;
    
    if (isCandleGreen) {
      score += (Math.abs(last.c - last.o) > avgBodySize) ? 14 : 7;
      criteria.push("Ask-side liquidity absorption forming structural baseline.");
    } else {
      score -= (Math.abs(last.c - last.o) > avgBodySize) ? 14 : 7;
      criteria.push("Supply compression forcing distribution beneath anchors.");
    }

    if (macdHist.length > 2) {
      if (macdHist[macdHist.length - 1] > macdHist[macdHist.length - 2]) {
        score += 16;
        criteria.push("MACD acceleration signals expanding positive vector.");
      } else {
        score -= 16;
        criteria.push("MACD decay signals systemic delta depletion.");
      }
    }

    const currentVol = last.v || 100;
    const avgVol = history.slice(-10).reduce((acc, curr) => acc + (curr.v || 0), 0) / 10;
    if (currentVol > avgVol) {
      if (isCandleGreen) {
        score += 12;
        criteria.push("High-volume delta confirmation validating buyer conviction.");
      } else {
        score -= 12;
        criteria.push("High-volume distribution confirming active liquidations.");
      }
    }

    if (activeRsi > 68) {
      score -= 10;
      criteria.push("RSI oscillator extension signals local top exhaustion.");
    } else if (activeRsi < 32) {
      score += 10;
      criteria.push("RSI mapping notes deeply exhausted seller pools.");
    } else {
      score += isCandleGreen ? 4 : -4;
    }

    const finalProb = Math.min(Math.max(score, 5), 95);
    return {
      bias: finalProb >= 50 ? "GREEN" : "RED",
      prob: finalProb >= 50 ? finalProb : 100 - finalProb,
      reasons: criteria.slice(0, 2)
    };
  };

  // ─── PERSISTENT STATE MEMORY ───
  const [renderTick, setRenderTick] = useState(0);

  useEffect(() => {
    if (candles.length < 2) return;

    const currentCandle = candles[candles.length - 1];
    const previousCandle = candles[candles.length - 2];
    const candleSig = `${candles.length}-${currentCandle.o}`;
    
    const ctx = PREDICTION_MEMORY.context;

    if (ctx.pair !== activePair || ctx.tf !== timeframe) {
      PREDICTION_MEMORY.liveAccuracy = [];
      PREDICTION_MEMORY.lockedPred = null;
      PREDICTION_MEMORY.context = { pair: activePair, tf: timeframe, sig: candleSig };
      setRenderTick(t => t + 1);
      return; 
    }

    if (ctx.sig === null) {
      PREDICTION_MEMORY.context.sig = candleSig;
      return; 
    }

    if (ctx.sig !== candleSig) {
      if (PREDICTION_MEMORY.lockedPred) {
        const actualBias = previousCandle.c >= previousCandle.o ? "GREEN" : "RED";
        const isCorrect = PREDICTION_MEMORY.lockedPred.bias === actualBias;
        PREDICTION_MEMORY.liveAccuracy = [...PREDICTION_MEMORY.liveAccuracy, isCorrect];
      }

      const liveRsi = coinMetrics[activePair]?.rsi || 50;
      const newLockedPred = evaluatePrediction(candles.slice(0, -1), liveRsi);
      PREDICTION_MEMORY.lockedPred = newLockedPred;

      PREDICTION_MEMORY.context.sig = candleSig;
      setRenderTick(t => t + 1);
    }
  }, [candles, activePair, timeframe, coinMetrics]); 

  const nextCandlePred = useMemo(() => {
    const liveRsi = coinMetrics[activePair]?.rsi || 50;
    return evaluatePrediction(candles, liveRsi);
  }, [candles, coinMetrics, activePair]);

  const correctCount = PREDICTION_MEMORY.liveAccuracy.filter(Boolean).length;
  const totalCount = PREDICTION_MEMORY.liveAccuracy.length;
  const accuracyPercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const lockedPrediction = PREDICTION_MEMORY.lockedPred;

  // ─── 4. ACTIVE LIQUID GLASS VOLUME CALCULATIONS ───
  const { buyRatio, sellRatio, buyUsd, sellUsd, buyVolumeHistory, sellVolumeHistory, maxVolVal } = useMemo(() => {
    if (candles.length === 0) return { buyRatio: 0.5, sellRatio: 0.5, buyUsd: 0, sellUsd: 0, buyVolumeHistory: [], sellVolumeHistory: [], maxVolVal: 1 };
    
    const last = candles[candles.length - 1];
    const totalV = last.v || 1;
    const denominator = (last.h - last.l) || 1;
    
    let buyV = totalV * ((last.c - last.l) / denominator);
    let sellV = totalV * ((last.h - last.c) / denominator);
    if (last.c === last.o) { buyV = totalV * 0.5; sellV = totalV * 0.5; }

    const totalCalculated = buyV + sellV;
    const bRatio = buyV / totalCalculated;
    const sRatio = sellV / totalCalculated;

    const subset = candles.slice(-50);
    const buyHist = subset.map(c => c.c >= c.o ? (c.v * ((c.c - c.l) / ((c.h - c.l)||1))) : (c.v * 0.4));
    const sellHist = subset.map(c => c.c < c.o ? (c.v * ((c.h - c.c) / ((c.h - c.l)||1))) : (c.v * 0.4));

    return {
      buyRatio: bRatio, sellRatio: sRatio,
      buyUsd: buyV * last.c, sellUsd: sellV * last.c,
      buyVolumeHistory: buyHist, sellVolumeHistory: sellHist,
      maxVolVal: Math.max(...buyHist, ...sellHist, 1)
    };
  }, [candles]);

  const compactUsd = (num: number) => Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);

  // ─── 5. DOMINANCE ILLUMINATION ENGINE ───
  const isBuyDom = buyRatio >= 0.9;
  const isSellDom = sellRatio >= 0.9;
  
  const containerGlowStyle = {
    boxShadow: isBuyDom ? `0 0 50px ${C_GREEN}40, inset 0 0 80px ${C_GREEN}30` :
               isSellDom ? `0 0 50px ${C_PINK}40, inset 0 0 80px ${C_PINK}30` :
               isLight ? 'none' : `-15px 0 30px ${C_GREEN}15, 15px 0 30px ${C_PINK}15, inset 0 0 20px rgba(0,0,0,0.8)`,
    borderColor: isBuyDom ? `${C_GREEN}90` : isSellDom ? `${C_PINK}90` : (isLight ? '#e2e8f0' : 'rgba(255,255,255,0.05)'),
    backgroundColor: isLight ? 'rgba(255, 255, 255, 0.7)' : '#040608',
    transition: 'all 0.8s ease'
  };

  const volStep = 15;
  const volDataWidth = Math.max(0, buyVolumeHistory.length - 1) * volStep;
  const volSvgWidth = Math.max(600, volDataWidth + 250);

  // Theme Constants
  const themeTextPrimary = isLight ? "text-slate-800" : "text-white";
  const themeTextSecondary = isLight ? "text-slate-500" : "text-[#4f5b70]";
  const themeTextMuted = isLight ? "text-slate-400" : "text-[#8b99ae]";
  const themeBorder = isLight ? "border-slate-200" : "border-white/5";
  const themePanelBg = isLight ? "bg-white/80 border-slate-200 shadow-sm" : "bg-[#040608] border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]";

  return (
    <div className={`w-full h-full flex flex-col gap-3 overflow-hidden select-none p-0.5 transition-colors ${isLight ? 'bg-slate-50' : 'bg-transparent'}`}>
      
      {/* ── HIGH TECH NAVIGATION TABS ── */}
      <div className={`flex shrink-0 p-1 border rounded-[8px] gap-1 relative z-20 transition-colors ${isLight ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-[#040608]/90 border-white/5'}`}>
        <button
          onClick={() => setActiveTab("t1")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-[6px] font-mono text-[8.5px] font-black tracking-[1.5px] uppercase transition-all duration-300 ${
            activeTab === "t1" 
              ? (isLight ? "bg-slate-100 border border-slate-200 text-slate-800 shadow-sm" : "bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)]")
              : (isLight ? "text-slate-500 hover:text-slate-700 hover:bg-slate-50" : "text-[#4f5b70] hover:text-slate-300 hover:bg-white/[0.02]")
          }`}
        >
          <Sliders size={11} className={activeTab === "t1" ? (isLight ? "text-cyan-600" : "text-[#00d4ff]") : ""} /> Technical Multipliers
        </button>
        <button
          onClick={() => setActiveTab("t2")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-[6px] font-mono text-[8.5px] font-black tracking-[1.5px] uppercase transition-all duration-300 ${
            activeTab === "t2" 
              ? (isLight ? "bg-slate-100 border border-slate-200 text-slate-800 shadow-sm" : "bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)]")
              : (isLight ? "text-slate-500 hover:text-slate-700 hover:bg-slate-50" : "text-[#4f5b70] hover:text-slate-300 hover:bg-white/[0.02]")
          }`}
        >
          <Zap size={11} className={activeTab === "t2" ? (isLight ? "text-emerald-500" : "text-[#00ff9d]") : ""} /> Predictive Vectors
        </button>
      </div>

      {/* ── TAB CONTENT DISPLAY AREA ── */}
      <div className="flex-1 min-h-0 w-full relative">
        {activeTab === "t1" ? (
          <div className="w-full h-full flex flex-col gap-3 absolute inset-0 overflow-y-auto custom-scrollbar pr-1 pb-2">
            
            {/* MACD HISTOGRAM ENGINE */}
            <div className={`h-[320px] min-h-[320px] shrink-0 rounded-[16px] border flex flex-col relative overflow-hidden transition-colors ${
              isLight ? 'bg-white shadow-sm border-slate-200' : 'bg-[#040608] shadow-[inset_0_0_25px_rgba(0,0,0,0.9)] border-white/5'
            }`}>
              <div className={`absolute top-[-50px] left-[-50px] w-[200px] h-[200px] bg-[#2962FF] blur-[80px] pointer-events-none rounded-full ${isLight ? 'opacity-[0.03]' : 'opacity-[0.06]'}`} />
              <div className={`flex items-center gap-3 p-3 shrink-0 relative z-10 border-b transition-colors ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-black/20 border-white/5'}`}>
                <div className="flex items-center gap-2">
                  <Activity size={15} className={isLight ? "text-rose-500" : "text-[#ff2a6d]"} style={{ filter: `drop-shadow(0 0 6px ${C_PINK})` }} />
                  <span className={`font-display text-[12px] font-bold tracking-[2px] uppercase ${themeTextPrimary}`}>MACD Histogram</span>
                </div>
                <span className={`font-mono text-[10px] tracking-[1px] ml-1 ${themeTextSecondary}`}>12 26 9</span>
                <div className="flex items-center gap-2 font-mono text-[11px] font-bold ml-2">
                  <span style={{ color: lastHist > 0 ? T_CYAN : T_RED }}>{lastHist.toFixed(2)}</span>
                  <span style={{ color: MACD_BLUE }}>{lastMacd.toFixed(2)}</span>
                  <span style={{ color: SIGNAL_ORANGE }}>{lastSignal.toFixed(2)}</span>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 w-full overflow-x-auto overflow-y-hidden custom-scrollbar relative px-1 pb-1 scroll-smooth">
                {macdHist.length === 0 ? (
                  <div className={`absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-[1px] ${themeTextSecondary}`}>CALCULATING MATRICES...</div>
                ) : (
                  <div style={{ width: `${totalChartWidth}px`, height: "100%", position: "relative" }}>
                    <svg width="100%" height="100%" viewBox={`0 0 ${totalChartWidth} 100`} preserveAspectRatio="none" className="overflow-visible block">
                      <line x1="0" y1="50" x2={totalChartWidth} y2="50" stroke={isLight ? "#000000" : "#ffffff"} strokeOpacity={isLight ? "0.05" : "0.15"} strokeDasharray="2 2" strokeWidth="0.5" />
                      {macdHist.map((val, i) => {
                        const isPos = val > 0;
                        const isGrowing = i === 0 ? true : (isPos ? val > macdHist[i - 1] : val < macdHist[i - 1]);
                        const height = (Math.abs(val) / maxAbs) * 45; 
                        const y = isPos ? 50 - height : 50;
                        const x = i * step + 3;
                        let barColor = isPos ? (isGrowing ? T_CYAN : `${T_CYAN}60`) : (isGrowing ? T_RED : `${T_RED}60`);
                        return <rect key={`hist-${i}`} x={x} y={y} width={step - 6} height={Math.max(0.5, height)} fill={barColor} rx="1" />;
                      })}
                      <polyline points={renderMacd.map((val, i) => `${i * step + (step / 2)},${50 - (val / maxAbs) * 45}`).join(" ")} fill="none" stroke={MACD_BLUE} strokeWidth="1.2" strokeLinejoin="round" />
                      <polyline points={renderSignal.map((val, i) => `${i * step + (step / 2)},${50 - (val / maxAbs) * 45}`).join(" ")} fill="none" stroke={SIGNAL_ORANGE} strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* BOTTOM PANELS */}
            <div className="min-h-[300px] shrink-0 flex flex-row gap-3">
              {/* RSI PANEL */}
              <div className={`flex-[1.2] rounded-[16px] p-4 flex flex-col relative overflow-hidden transition-colors ${themePanelBg}`}>
                <span className={`font-display text-[10px] font-bold tracking-[2px] uppercase mb-3 flex items-center gap-1.5 shrink-0 z-10 ${themeTextMuted}`}>
                  <Zap size={12} className={isLight ? "text-cyan-600" : "text-[#00d4ff]"} /> Market Strength (RSI)
                </span>
                
                <div className="flex-1 flex flex-col justify-between z-10 min-h-0">
                  {bullishCoins.map((c) => (
                    <div key={c.sym} className={`flex items-center justify-between px-3 py-1.5 rounded-[6px] border shrink-0 transition-colors ${
                      isLight ? 'bg-cyan-50/50 border-cyan-100' : 'bg-gradient-to-r from-[#00d4ff]/10 to-transparent border-[#00d4ff]/15'
                    }`}>
                      <div className="flex items-center gap-2"><TrendingUp size={12} className={isLight ? "text-cyan-600" : "text-[#00d4ff]"} /><span className={`font-mono text-[10px] font-bold ${themeTextPrimary}`}>{c.sym.replace("/USDT", "")}</span></div>
                      <span className="font-num text-[12px] font-bold" style={{ color: T_CYAN, textShadow: !isLight ? `0 0 8px ${C_CYAN}` : 'none' }}>{c.rsi.toFixed(1)}</span>
                    </div>
                  ))}
                  <div className={`h-[2px] w-full my-1 shrink-0 rounded-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />
                  {bearishCoins.map((c) => (
                    <div key={c.sym} className={`flex items-center justify-between px-3 py-1.5 rounded-[6px] border shrink-0 transition-colors ${
                      isLight ? 'bg-rose-50/50 border-rose-100' : 'bg-gradient-to-r from-[#ff2a6d]/10 to-transparent border-[#ff2a6d]/15'
                    }`}>
                      <div className="flex items-center gap-2"><TrendingDown size={12} className={isLight ? "text-rose-500" : "text-[#ff2a6d]"} /><span className={`font-mono text-[10px] font-bold ${themeTextPrimary}`}>{c.sym.replace("/USDT", "")}</span></div>
                      <span className="font-num text-[12px] font-bold" style={{ color: T_RED, textShadow: !isLight ? `0 0 8px ${C_PINK}` : 'none' }}>{c.rsi.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FUNDING GAUGE */}
              <div className={`flex-[1] rounded-[16px] p-4 flex flex-col items-center justify-between relative overflow-hidden transition-colors ${themePanelBg}`}>
                <div className={`absolute -bottom-8 w-32 h-32 blur-[40px] rounded-full pointer-events-none ${isBullishFunding ? (isLight ? 'bg-emerald-400/10' : 'bg-[#00ff9d]/10') : (isLight ? 'bg-rose-400/10' : 'bg-[#ff2a6d]/10')}`} />
                <div className="w-full flex justify-between items-center shrink-0 mb-2">
                  <span className={`font-display text-[10px] font-bold tracking-[2px] uppercase flex items-center gap-1.5 ${themeTextMuted}`}><Gauge size={13} className={isBullishFunding ? T_GREEN : T_RED} /> Funding Rate</span>
                  <span className={`font-num text-[14px] font-black tracking-wide px-2.5 py-0.5 rounded-[4px] border ${isLight ? 'text-slate-800 bg-white/50 border-slate-200' : 'text-white bg-black/40 border-white/5'}`} style={{ textShadow: !isLight ? `0 0 15px ${isBullishFunding ? C_GREEN : C_PINK}` : 'none' }}>{isBullishFunding ? "+" : ""}{fundingRate.toFixed(4)}%</span>
                </div>
                <div className="relative w-full max-w-[200px] aspect-[2/1] flex items-end justify-center mt-auto mb-3">
                  <svg className="w-full h-full absolute bottom-0 left-0 overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="xMidYMax meet">
                    <defs><linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={C_PINK} /><stop offset="50%" stopColor="#b026ff" /><stop offset="100%" stopColor={C_GREEN} /></linearGradient></defs>
                    <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke={isLight ? '#e2e8f0' : '#11161d'} strokeWidth="8" strokeLinecap="round" />
                    <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="url(#neonGlow)" strokeWidth="4" strokeLinecap="round" opacity="0.95" />
                    <line x1="50" y1="5" x2="50" y2="12" stroke={isLight ? '#000000' : '#ffffff'} strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <div className="absolute bottom-[2px] w-4 h-[95%] origin-bottom transition-transform duration-700 ease-out z-10 flex flex-col items-center" style={{ transform: `rotate(${needleRotation}deg)` }}>
                    <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] ${isLight ? 'border-b-slate-800' : 'border-b-white'}`} style={{ filter: !isLight ? `drop-shadow(0 0 6px ${isBullishFunding ? C_GREEN : C_PINK})` : 'none' }} />
                    <div className={`w-[3px] flex-1 ${isLight ? 'bg-slate-800' : 'bg-white'}`} style={{ boxShadow: !isLight ? `0 0 10px ${isBullishFunding ? C_GREEN : C_PINK}` : 'none' }} />
                    <div className={`w-3 h-3 rounded-full absolute -bottom-1.5 ${isLight ? 'bg-slate-800' : 'bg-white'}`} style={{ boxShadow: !isLight ? `0 0 10px ${isBullishFunding ? C_GREEN : C_PINK}` : 'none' }} />
                  </div>
                </div>
                <div className="w-full flex justify-between font-mono text-[10px] font-black tracking-wider px-2 shrink-0 mt-2 relative z-10">
                  <span className={`px-2 py-0.5 rounded-[4px] border ${isLight ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-[#ff2a6d] bg-[#ff2a6d]/10 border-[#ff2a6d]/20'}`}>-0.1%</span>
                  <span className={`${themeTextMuted} self-center opacity-50`}>0.00%</span>
                  <span className={`px-2 py-0.5 rounded-[4px] border ${isLight ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-[#00ff9d] bg-[#00ff9d]/10 border-[#00ff9d]/20'}`}>+0.1%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── TECHNICAL 2: PREDICTIVE DASHBOARD AREA ── */
          <div className="w-full h-full flex flex-col gap-3 absolute inset-0 overflow-y-auto custom-scrollbar pr-0.5 pb-2">
            
            {/* ROW 1: EXPANDED TRI-PANEL CANDLE PREDICTION FRAME */}
            <div className={`rounded-[16px] border p-5 flex flex-col relative overflow-hidden min-h-[250px] shrink-0 transition-colors ${themePanelBg}`}>
              <div className="absolute top-0 right-0 w-[180px] h-[180px] blur-[50px] rounded-full pointer-events-none"
                   style={{ backgroundColor: nextCandlePred.bias === "GREEN" ? C_GREEN : C_PINK, opacity: isLight ? 0.15 : 0.05 }} />
              
              <div className={`flex items-center justify-between border-b pb-3 mb-4 ${themeBorder}`}>
                <span className={`font-display text-[12px] font-black tracking-[2px] uppercase flex items-center gap-2 ${themeTextMuted}`}>
                  <Layers size={16} className={isLight ? "text-purple-500" : "text-[#b026ff]"} /> AI Predictive Matrix
                </span>
                <span className={`font-mono text-[10px] px-2.5 py-1 rounded-[4px] tracking-widest border flex items-center gap-1.5 ${isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white/5 text-white/50 border-white/5'}`}>
                  <Target size={12} className={isLight ? "text-cyan-600" : "text-[#00d4ff]"} /> LIVE EVALUATION
                </span>
              </div>

              {/* Tri-Column Layout */}
              <div className={`grid grid-cols-3 gap-3 divide-x items-center w-full mb-2 ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                
                {/* 1. Locked Current Candle Prediction */}
                <div className="flex flex-col gap-1 pr-3">
                  <div className={`font-mono text-[9px] uppercase tracking-widest ${themeTextSecondary}`}>Current Candle</div>
                  {lockedPrediction ? (
                    <div className="font-display text-[16px] font-black uppercase flex items-center gap-1.5"
                         style={{ color: lockedPrediction.bias === "GREEN" ? T_GREEN : T_RED }}>
                      {lockedPrediction.bias === "GREEN" ? "BULLISH" : "BEARISH"}
                      {lockedPrediction.bias === "GREEN" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      <span className="text-[12px] opacity-60">({lockedPrediction.prob}%)</span>
                    </div>
                  ) : (
                    <div className={`font-display text-[12px] font-bold uppercase flex items-center h-[24px] gap-1.5 ${themeTextSecondary}`}>
                      <Clock size={12} /> AWAITING DATA...
                    </div>
                  )}
                </div>

                {/* 2. Live Next Candle Projection */}
                <div className="flex flex-col gap-1 px-4">
                  <div className={`font-mono text-[9px] uppercase tracking-widest ${themeTextSecondary}`}>Next Candle</div>
                  <div className="font-display text-[20px] font-black uppercase flex items-center gap-2"
                       style={{ color: nextCandlePred.bias === "GREEN" ? T_GREEN : T_RED, textShadow: !isLight ? `0 0 20px ${nextCandlePred.bias === "GREEN" ? C_GREEN : C_PINK}50` : 'none' }}>
                    {nextCandlePred.bias === "GREEN" ? "GREEN" : "RED"} 
                    <span className="text-[14px] opacity-70">({nextCandlePred.prob}%)</span>
                  </div>
                </div>

                {/* 3. True Live Accuracy Tracker */}
                <div className="flex flex-col gap-1 pl-4 text-right items-end justify-center">
                  <div className={`font-mono text-[9px] uppercase tracking-widest ${themeTextSecondary}`}>Predictions</div>
                  <div className="flex items-center justify-end gap-1.5">
                    <div className={`font-num text-[24px] font-black flex items-baseline gap-1 ${themeTextPrimary}`}>
                      <span className={isLight ? "text-cyan-600" : "text-[#00d4ff]"} style={{ textShadow: !isLight ? `0 0 12px ${C_CYAN}60` : 'none' }}>{correctCount}</span>
                      <span className="text-[14px] text-slate-400">/{totalCount}</span>
                    </div>
                    {totalCount > 0 ? (
                      <span className="font-num text-[14px] font-black" style={{ color: accuracyPercent >= 50 ? T_GREEN : T_RED }}>
                        ({accuracyPercent}%)
                      </span>
                    ) : (
                      <span className={`font-num text-[14px] font-black ${themeTextSecondary}`}>
                        (--%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={`mt-auto pt-4 border-t flex flex-col gap-2 ${themeBorder}`}>
                {nextCandlePred.reasons.map((reason, idx) => (
                  <div key={idx} className={`flex items-start gap-2 text-[10px] font-mono leading-relaxed py-2 px-3 rounded-[6px] ${isLight ? 'bg-slate-100/80 text-slate-600' : 'bg-white/[0.02] text-slate-300'}`}>
                    <span className={isLight ? 'text-slate-400 font-bold' : 'text-white/40 font-bold'}>0{idx + 1}.</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 2: VOLUME DELTA BARS WITH DOMINANCE ILLUMINATION */}
            <div className="rounded-[16px] p-5 flex flex-col shrink-0 min-h-[180px]" style={containerGlowStyle}>
              <span className={`font-display text-[11px] font-black tracking-[2px] uppercase mb-5 flex items-center gap-2 relative z-10 ${themeTextMuted}`}>
                <BarChart3 size={15} className={isLight ? "text-emerald-500" : "text-[#00ff9d]"} /> Volume Delta Bars
              </span>

              <div className={`w-full flex items-center justify-around gap-6 py-4 px-5 rounded-[12px] border relative z-10 ${isLight ? 'bg-white/80 border-slate-200 shadow-sm' : 'bg-black/40 border-white/5'}`}>
                
                {/* BUY VOLUME BAR */}
                <div className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                  <div className={`font-mono text-[10px] uppercase font-bold tracking-wider mb-1 ${themeTextSecondary}`}>Buy Vol</div>
                  <div className={`relative w-full h-[90px] border rounded-[10px] overflow-hidden backdrop-blur-md flex items-center justify-center transition-all duration-500 ${isLight ? 'bg-white border-slate-200' : 'bg-white/[0.02] border-white/10'}`}
                       style={{ boxShadow: !isLight ? `0 0 ${buyRatio * 50}px ${C_GREEN}${Math.floor(buyRatio * 70)}` : 'none' }}>
                    <div className="absolute bottom-0 left-0 w-full transition-all duration-700 ease-out" style={{ height: `${Math.max(5, buyRatio * 100)}%`, background: `linear-gradient(0deg, ${isLight ? '#6ee7b7' : `${C_CYAN}40`} 0%, ${T_GREEN} 100%)` }} />
                    <span className={`relative z-10 font-mono text-[12px] font-black tracking-wide ${isLight ? 'text-slate-900' : 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,1)]'}`}>
                      ${compactUsd(buyUsd)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center mt-1">
                    <span className="font-num text-[14px] font-black tracking-wide" style={{ color: T_GREEN }}>{(buyRatio * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className={`font-display text-[14px] font-black italic tracking-widest shrink-0 ${isLight ? 'text-slate-300' : 'text-white/20'}`}>VS</div>

                {/* SELL VOLUME BAR */}
                <div className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                  <div className={`font-mono text-[10px] uppercase font-bold tracking-wider mb-1 ${themeTextSecondary}`}>Sell Vol</div>
                  <div className={`relative w-full h-[90px] border rounded-[10px] overflow-hidden backdrop-blur-md flex items-center justify-center transition-all duration-500 ${isLight ? 'bg-white border-slate-200' : 'bg-white/[0.02] border-white/10'}`}
                       style={{ boxShadow: !isLight ? `0 0 ${sellRatio * 50}px ${C_PINK}${Math.floor(sellRatio * 70)}` : 'none' }}>
                    <div className="absolute bottom-0 left-0 w-full transition-all duration-700 ease-out" style={{ height: `${Math.max(5, sellRatio * 100)}%`, background: `linear-gradient(0deg, ${isLight ? '#fda4af' : '#50051e'} 0%, ${T_RED} 100%)` }} />
                    <span className={`relative z-10 font-mono text-[12px] font-black tracking-wide ${isLight ? 'text-slate-900' : 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,1)]'}`}>
                      ${compactUsd(sellUsd)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center mt-1">
                    <span className="font-num text-[14px] font-black tracking-wide" style={{ color: T_RED }}>{(sellRatio * 100).toFixed(1)}%</span>
                  </div>
                </div>

              </div>
            </div>

            {/* ROW 3: CUBIC BEZIER SMOOTHED DELTA VECTOR VOLUME GRAPH */}
            <div className={`rounded-[16px] p-4 flex flex-col flex-shrink-0 min-h-[260px] transition-colors ${themePanelBg}`}>
              <div className="flex items-center justify-between mb-3 shrink-0">
                <span className={`font-display text-[11px] font-black tracking-[2px] uppercase flex items-center gap-1.5 ${themeTextMuted}`}>
                  <Activity size={14} className={isLight ? "text-cyan-600" : "text-[#00d4ff]"} /> Delta Vector Volume Graph
                </span>
                <div className={`flex items-center gap-3 font-mono text-[9px] tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{background: T_GREEN, boxShadow: !isLight ? `0 0 6px ${C_GREEN}` : 'none'}}/> Buy Dominance</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{background: T_RED, boxShadow: !isLight ? `0 0 6px ${C_PINK}` : 'none'}}/> Sell Dominance</span>
                </div>
              </div>

              {/* Explicit X-Axis Scroll Container */}
              <div ref={volGraphScrollRef} className={`flex-1 w-full relative rounded-[8px] border p-1 overflow-x-auto overflow-y-hidden custom-scrollbar scroll-smooth ${isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-black/20 border-white/[0.03]'}`}>
                {buyVolumeHistory.length < 2 ? (
                  <div className={`absolute inset-0 flex items-center justify-center font-mono text-[10px] ${themeTextSecondary}`}>
                    SYNCHRONIZING VOLUME LINE DATASTREAM...
                  </div>
                ) : (
                  <div style={{ width: `${volSvgWidth}px`, height: "100%", position: "relative" }}>
                    <svg width="100%" height="100%" className="overflow-visible block" viewBox={`0 0 ${volSvgWidth} 100`} preserveAspectRatio="none">
                      {/* Grid wires */}
                      <line x1="0" y1="25" x2={volSvgWidth} y2="25" stroke={isLight ? "black" : "white"} strokeOpacity={isLight ? "0.05" : "0.02"} strokeWidth="0.5" />
                      <line x1="0" y1="50" x2={volSvgWidth} y2="50" stroke={isLight ? "black" : "white"} strokeOpacity={isLight ? "0.1" : "0.05"} strokeDasharray="3 3" strokeWidth="1" />
                      <line x1="0" y1="75" x2={volSvgWidth} y2="75" stroke={isLight ? "black" : "white"} strokeOpacity={isLight ? "0.05" : "0.02"} strokeWidth="0.5" />
                      
                      {/* Cubic Bezier Smoothed Buyer Line (Green) */}
                      <path
                        d={generateSmoothPath(buyVolumeHistory.map((val, idx) => [idx * volStep, 95 - (val / maxVolVal) * 85]))}
                        fill="none" stroke={T_GREEN} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{ filter: !isLight ? `drop-shadow(0 0 6px ${C_GREEN}60)` : 'none' }}
                      />

                      {/* Cubic Bezier Smoothed Seller Line (Red) */}
                      <path
                        d={generateSmoothPath(sellVolumeHistory.map((val, idx) => [idx * volStep, 95 - (val / maxVolVal) * 85]))}
                        fill="none" stroke={T_RED} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{ filter: !isLight ? `drop-shadow(0 0 6px ${C_PINK}60)` : 'none' }}
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}