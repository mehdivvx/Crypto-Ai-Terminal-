"use client";

import { useState, useEffect } from "react";
import { useTradingStore } from "@/hooks/useTradingState";
import { SignalCard } from "./SignalCard";

export default function SignalEnginePanel() {
  const [topTab, setTopTab] = useState<'SIGNAL' | 'HISTORY'>('SIGNAL');
  const [activeTab, setActiveTab] = useState<'CURRENT' | 'ALL' | 'ACTIVE'>('ALL');

  const rawSignals = useTradingStore(s => s.signals) || [];
  const signals = rawSignals as any[]; 
  const analysis = useTradingStore(s => s.marketAnalysis);
  const activePair = useTradingStore(s => s.activePair);
  const timeframe = useTradingStore(s => s.timeframe);
  const settings = useTradingStore(s => s.settings) || { riskMode: 'FLAT', riskValue: 10 };
  const totalBalance = useTradingStore(s => s.totalBalance) || 1000;
  
  // ── THEME DETECTION ──
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

  // ── FILTERED SIGNALS ──
  const realSignals = signals.filter(s => s.status === 'PENDING');
  const currentSignals = realSignals.filter(s => s.symbol === activePair);
  const activeTrades = signals.filter(s => s.status === 'ACTIVE');
  const historySignals = signals.filter(s => s.status && s.status !== 'PENDING' && s.direction !== 'WAIT');

  // ── VIRTUAL FALLBACKS ──
  const virtualSignal = {
    id: 'scanner-all',
    direction: 'WAIT',
    symbol: "MARKET",
    confidence: analysis?.conf || 0,
    reasoning: analysis?.reasons || ["Scanning all markets..."],
    timeframe: timeframe,
    status: 'SCANNING'
  };

  const virtualCurrentSignal = {
    ...virtualSignal,
    id: 'scanner-current',
    symbol: activePair,
    reasoning: [`Analyzing order flow for ${activePair}...`]
  };

  // ── STATS ──
  const wins = historySignals.filter(s => (s.status || "").includes("TP")).length;
  const losses = historySignals.filter(s => (s.status || "").includes("STOP")).length;
  const total = historySignals.length;

  return (
    <div 
      className={`flex flex-col h-full min-h-[450px] rounded-[16px] overflow-hidden transition-colors duration-300 ${
        isLight ? 'bg-white shadow-sm border border-slate-200' : 'border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,1)]'
      }`} 
      style={{ background: isLight ? '#f8fafc' : 'linear-gradient(180deg,#07090E 0%,#050709 100%)' }}
    >
      
      {/* ── TOP-LEVEL TAB NAVIGATION ── */}
      <div className={`flex gap-2 p-3 shrink-0 border-b transition-colors ${
        isLight ? 'bg-slate-100/50 border-slate-200' : 'bg-black/20 border-white/5'
      }`}>
        <button
          onClick={() => setTopTab('SIGNAL')}
          className={`flex-1 flex items-center justify-center py-2.5 rounded-[8px] transition-all duration-300 ${
            topTab === 'SIGNAL'
              ? (isLight 
                  ? "bg-cyan-50 border border-cyan-200 text-cyan-600 shadow-sm" 
                  : "bg-[#063b45] border border-[#00d4ff]/30 text-[#00d4ff] shadow-[0_4px_12px_rgba(0,212,255,0.1)]")
              : (isLight 
                  ? "border border-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-700" 
                  : "border border-transparent text-[#4f5b70] hover:bg-white/5 hover:text-[#8b99ae]")
          }`}
        >
          <span className="font-mono text-[11px] font-bold tracking-[2.5px]">SIGNAL</span>
        </button>

        <button
          onClick={() => setTopTab('HISTORY')}
          className={`flex-1 flex items-center justify-center py-2.5 rounded-[8px] transition-all duration-300 ${
            topTab === 'HISTORY'
              ? (isLight 
                  ? "bg-cyan-50 border border-cyan-200 text-cyan-600 shadow-sm" 
                  : "bg-[#063b45] border border-[#00d4ff]/30 text-[#00d4ff] shadow-[0_4px_12px_rgba(0,212,255,0.1)]")
              : (isLight 
                  ? "border border-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-700" 
                  : "border border-transparent text-[#4f5b70] hover:bg-white/5 hover:text-[#8b99ae]")
          }`}
        >
          <span className="font-mono text-[11px] font-bold tracking-[2.5px]">HISTORY</span>
        </button>
      </div>

      {/* ── SIGNAL VIEW ── */}
      {topTab === 'SIGNAL' && (
        <div className="flex-1 overflow-hidden flex flex-col pt-3">
          {/* Inner Tab Navigation */}
          <div className={`flex items-center p-1.5 mx-3 mb-3 rounded-[8px] border shrink-0 transition-colors ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-white/5'
          }`}>
            {['CURRENT', 'ALL', 'ACTIVE'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 text-center font-mono text-[10px] font-bold tracking-[2px] py-2 rounded-[6px] transition-all duration-300 ${
                  activeTab === tab
                    ? (isLight 
                        ? "bg-white text-cyan-600 shadow-sm" 
                        : "bg-[#00d4ff]/10 text-[#00d4ff] shadow-[inset_0_0_10px_rgba(0,212,255,0.2)]")
                    : (isLight 
                        ? "text-slate-500 hover:text-slate-800" 
                        : "text-[#4f5b70] hover:text-white hover:bg-white/5")
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col px-3 pb-3">
            {/* CURRENT TAB */}
            {activeTab === 'CURRENT' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-3">
                {currentSignals.length > 0 ? (
                  currentSignals.map(sig => <SignalCard key={sig.id} signal={sig} />)
                ) : (
                  <SignalCard signal={virtualCurrentSignal} />
                )}
              </div>
            )}

            {/* ALL TAB */}
            {activeTab === 'ALL' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-3">
                {realSignals.length > 0 ? (
                  realSignals.map(sig => <SignalCard key={sig.id} signal={sig} />)
                ) : (
                  <SignalCard signal={virtualSignal} />
                )}
              </div>
            )}

            {/* ACTIVE TAB */}
            {activeTab === 'ACTIVE' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-3">
                {activeTrades.length > 0 ? (
                  activeTrades.map(sig => <SignalCard key={sig.id} signal={sig} />)
                ) : (
                  <div className={`text-[11px] text-center mt-6 p-4 border rounded-[8px] transition-colors ${
                    isLight ? 'text-slate-500 border-slate-200 bg-slate-50' : 'text-[#8b99ae] border-white/5 bg-black/30'
                  }`}>
                    No active trades running.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HISTORY VIEW ── */}
      {topTab === 'HISTORY' && (
        <div className="flex flex-col h-full p-3 pt-4">
          {/* History Stats Row */}
          <div className="grid grid-cols-3 gap-2 mb-4 shrink-0">
            <div className={`border rounded-[6px] py-2.5 px-1.5 text-center transition-colors ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'}`}>
              <div className={`font-num text-[18px] font-bold leading-none ${isLight ? 'text-cyan-600' : 'text-[#00d4ff]'}`} style={{ textShadow: isLight ? 'none' : "0 0 15px rgba(0,212,255,0.4)" }}>{total}</div>
              <div className={`font-mono text-[9px] font-bold tracking-[2px] mt-1 ${isLight ? 'text-slate-400' : 'text-[#4f5b70]'}`}>TOTAL</div>
            </div>
            <div className={`border rounded-[6px] py-2.5 px-1.5 text-center transition-colors ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'}`}>
              <div className={`font-num text-[18px] font-bold leading-none ${isLight ? 'text-emerald-500' : 'text-[#00ff9d]'}`} style={{ textShadow: isLight ? 'none' : "0 0 15px rgba(0,255,157,0.4)" }}>{wins}</div>
              <div className={`font-mono text-[9px] font-bold tracking-[2px] mt-1 ${isLight ? 'text-slate-400' : 'text-[#4f5b70]'}`}>WINS</div>
            </div>
            <div className={`border rounded-[6px] py-2.5 px-1.5 text-center transition-colors ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'}`}>
              <div className={`font-num text-[18px] font-bold leading-none ${isLight ? 'text-rose-500' : 'text-[#ff2a6d]'}`} style={{ textShadow: isLight ? 'none' : "0 0 15px rgba(255,42,109,0.4)" }}>{losses}</div>
              <div className={`font-mono text-[9px] font-bold tracking-[2px] mt-1 ${isLight ? 'text-slate-400' : 'text-[#4f5b70]'}`}>LOSS</div>
            </div>
          </div>

          {/* History List Header */}
          <div className={`grid grid-cols-[35px_30px_1fr_60px_50px] gap-1.5 px-2 mb-2 font-mono text-[9px] font-bold tracking-[1px] uppercase transition-colors ${isLight ? 'text-slate-400' : 'text-[#4f5b70]'}`}>
            <span>DIR</span>
            <span>CNF</span>
            <span>ASSET</span>
            <span className="text-right">PROFIT</span>
            <span className="text-center">STATUS</span>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-3">
            {historySignals.length === 0 ? (
              <div className={`text-[11px] text-center mt-4 p-4 border rounded-[8px] transition-colors ${isLight ? 'text-slate-500 border-slate-200 bg-slate-50' : 'text-[#8b99ae] border-white/5 bg-black/30'}`}>
                No closed trades tracked yet.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {historySignals.map((s, i) => {
                  const isBuy = s.direction === "LONG" || s.direction === "BUY";
                  const timeDisplay = s.time || "Just Now";
                  const statusStr = s.status || "";
                  
                  let resCls = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
                  let resTxt = 'ACTIVE';
                  let resCol = isLight ? '#0284c7' : '#00d4ff';
                  let pnlStr = '--';
                  let pnlCol = isLight ? '#64748b' : '#8b99ae';
                  
                  if(statusStr.includes('TP')) { 
                    resCls = isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,255,157,0.15)'; 
                    resTxt = statusStr.replace(' HIT',''); 
                    resCol = isLight ? '#059669' : '#00ff9d';
                    pnlCol = isLight ? '#059669' : '#00ff9d';
                    pnlStr = s.pnl ? `+${s.pnl}%` : 'WIN';
                  }
                  else if(statusStr.includes('STOP')) { 
                    resCls = isLight ? 'rgba(225, 29, 72, 0.1)' : 'rgba(255,42,109,0.15)'; 
                    resTxt = 'SL'; 
                    resCol = isLight ? '#e11d48' : '#ff2a6d';
                    pnlCol = isLight ? '#e11d48' : '#ff2a6d';
                    pnlStr = s.pnl ? `${s.pnl}%` : 'LOSS';
                  }

                  // ── Calculate Real USDT PnL Amount ──
                  const allocated = settings.riskMode === 'FLAT' ? settings.riskValue : (settings.riskValue / 100) * totalBalance;
                  const pnlUsdtAmount = s.pnlUsdt !== undefined ? s.pnlUsdt : (s.pnl ? (s.pnl / 100) * allocated : 0);
                  const usdtPrefix = pnlUsdtAmount > 0 ? '+' : '';

                  return (
                    <div key={i} className={`grid grid-cols-[35px_30px_1fr_60px_50px] gap-1.5 items-center p-2 border text-[11px] rounded-[6px] transition-colors ${
                      isLight ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-black/20 border-white/5 hover:bg-white/5'
                    }`}>
                      <span className="font-mono font-bold tracking-[1px]" style={{ color: isBuy ? (isLight ? '#059669' : '#00ff9d') : (isLight ? '#e11d48' : '#ff2a6d') }}>
                        {isBuy ? "BUY" : "SELL"}
                      </span>
                      <span className={`font-num font-semibold ${isLight ? 'text-slate-500' : 'text-[#8b99ae]'}`}>
                        {s.confidence || 0}%
                      </span>
                      <span className={`font-num truncate ${isLight ? 'text-slate-700' : 'text-[#d1d4dc]'}`}>
                        {s.symbol.replace('/USDT', '')} <span className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-[#4f5b70]'}`}>{timeDisplay.split(' ')[0]}</span>
                      </span>
                      
                      {/* ── Displaying both USDT and % ── */}
                      <div className="flex flex-col items-end justify-center leading-tight">
                        <span className="font-num text-[10px] font-bold" style={{ color: pnlCol, textShadow: isLight ? 'none' : `0 0 10px ${pnlCol}40` }}>
                           {usdtPrefix}{pnlUsdtAmount.toFixed(2)}$
                        </span>
                        <span className="font-num text-[8px] font-bold opacity-70" style={{ color: pnlCol }}>
                           {pnlStr}
                        </span>
                      </div>

                      <span className="font-mono text-[9px] text-center font-bold p-1 rounded-[3px] tracking-[1px]" style={{ background: resCls, color: resCol }}>
                        {resTxt}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}