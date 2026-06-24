"use client";

import { useState, useEffect } from "react";
import { useTradingStore } from "./useTradingState";
import { formatUsdt, formatPct, pnlColor } from "./utils";
import { Shield, Layers, Settings, Wallet } from "lucide-react";

export default function PortfolioAnalytics() {
  const activeTrades = useTradingStore((s) => s.activeTrades);
  const closedTrades = useTradingStore((s) => s.closedTrades);
  const analytics = useTradingStore((s) => s.analytics);
  const settings = useTradingStore((s) => s.settings);
  const totalBalance = useTradingStore((s) => s.totalBalance);
  const updateSettings = useTradingStore((s) => s.updateSettings);

  const sessionPnl = totalBalance - settings.startingBalance;
  const sessionPct = (sessionPnl / settings.startingBalance) * 100;
  const isUp = sessionPnl >= 0;

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

  // ─── THEME CONSTANTS ───
  const themeCardBg = isLight 
    ? "bg-white/70 border-slate-200 shadow-sm" 
    : "bg-[#0D1017]/70 border-[#283044]/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]";
  
  const themeTextMuted = isLight ? "text-slate-500" : "text-[#8b99ae]";
  const themeTextSubMuted = isLight ? "text-slate-400" : "text-[#4f5b70]";
  const themeTextPrimary = isLight ? "text-slate-800" : "text-white";
  
  const themeCyan = isLight ? "text-cyan-600" : "text-[#00f0ff]";
  const themeGreen = isLight ? "text-emerald-600" : "text-[#00ff9d]";
  const themeRed = isLight ? "text-rose-600" : "text-[#ff2a6d]";
  
  const themeInput = isLight 
    ? "bg-white border-slate-300 text-slate-800 focus:border-cyan-500" 
    : "bg-black/40 border-[#283044] text-white focus:border-[#00f0ff]";

  return (
    <div className="h-full flex flex-col gap-4 p-2 animate-fade-in-up">
      
      {/* ── TOP STATS ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        
        {/* Risk Management Panel */}
        <div className={`backdrop-blur-xl rounded-[10px] border p-5 flex flex-col gap-3 transition-colors duration-300 ${themeCardBg}`}>
          <div className="flex items-center gap-2 mb-1">
            <Settings size={12} className={themeCyan} />
            <span className={`font-mono text-[9px] font-bold tracking-[3px] uppercase ${themeTextMuted}`}>RISK PARAMETERS</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={`font-mono text-[8px] uppercase tracking-wider block mb-1 ${themeTextSubMuted}`}>Starting Balance ($)</label>
              <input 
                type="number" 
                value={settings.startingBalance}
                onChange={(e) => updateSettings({ startingBalance: parseFloat(e.target.value) })}
                className={`w-full border rounded px-2 py-1 font-num text-sm outline-none transition-colors ${themeInput}`}
              />
            </div>
            <div>
              <label className={`font-mono text-[8px] uppercase tracking-wider block mb-1 ${themeTextSubMuted}`}>Risk per Trade (%)</label>
              <input 
                type="number" 
                value={settings.riskValue}
                onChange={(e) => updateSettings({ riskValue: parseFloat(e.target.value) })}
                className={`w-full border rounded px-2 py-1 font-num text-sm outline-none transition-colors ${themeInput} ${isLight ? 'text-cyan-600' : 'text-[#00f0ff]'}`}
              />
            </div>
          </div>
        </div>
        
        {/* Session Return */}
        <div className={`backdrop-blur-xl rounded-[10px] border p-6 flex flex-col justify-center transition-colors duration-300 ${themeCardBg}`}>
          <div className={`font-mono text-[10px] font-bold tracking-[3px] uppercase mb-2 ${themeTextMuted}`}>SESSION PNL</div>
          <div className={`font-num text-3xl font-bold flex items-center gap-3 ${isUp ? themeGreen : themeRed}`}>
            {isUp ? "+" : ""}${formatUsdt(Math.abs(sessionPnl))}
          </div>
          <div className={`font-mono text-[10px] mt-2 tracking-wider opacity-60 ${themeTextPrimary}`}>
            {formatPct(sessionPct)} RETURN ON EQUITY
          </div>
        </div>

        {/* Win Rate */}
        <div className={`backdrop-blur-xl rounded-[10px] border p-6 flex flex-col justify-center transition-colors duration-300 ${themeCardBg}`}>
          <div className={`font-mono text-[10px] font-bold tracking-[3px] uppercase mb-2 ${themeTextMuted}`}>MY WIN RATE</div>
          <div className={`font-num text-3xl font-bold ${themeCyan}`}>
            {analytics.userWinrate.toFixed(1)}%
          </div>
        </div>

        {/* Trade Execution Stats */}
        <div className={`backdrop-blur-xl rounded-[10px] border p-6 flex flex-col justify-center transition-colors duration-300 ${themeCardBg}`}>
          <div className="flex justify-between items-center mb-2">
            <div className={`font-mono text-[10px] font-bold tracking-[3px] uppercase ${themeTextMuted}`}>TOTAL TRADES</div>
            <div className={`font-num text-lg font-bold ${themeTextPrimary}`}>{analytics.totalTrades}</div>
          </div>
          <div className={`flex justify-between items-center border-t pt-2 mt-2 ${isLight ? 'border-slate-200' : 'border-[#283044]/40'}`}>
            <div className={`font-mono text-[10px] font-bold tracking-[3px] uppercase ${themeTextMuted}`}>W/L RATIO</div>
            <div className="font-num text-sm font-bold">
              <span className={themeGreen}>{analytics.winCount}W</span> / <span className={themeRed}>{analytics.lossCount}L</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── MIDDLE ROW (TABLES) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        
        {/* ACTIVE POSITIONS TABLE */}
        <div className={`backdrop-blur-xl rounded-[10px] border flex flex-col overflow-hidden transition-colors duration-300 ${themeCardBg}`}>
          <div className={`px-6 py-4 border-b flex items-center gap-2 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#283044]/60 bg-gradient-to-b from-white/[0.03] to-transparent'}`}>
            <Shield size={14} className={themeGreen} />
            <span className={`font-mono text-[11px] font-bold tracking-[3px] uppercase ${themeTextMuted}`}>ACTIVE POSITIONS</span>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${isLight ? 'border-slate-200' : 'border-[#283044]/40'}`}>
                  <th className={`py-3 px-4 font-mono text-[10px] tracking-[2px] ${themeTextSubMuted}`}>ASSET</th>
                  <th className={`py-3 px-4 font-mono text-[10px] tracking-[2px] ${themeTextSubMuted}`}>TYPE</th>
                  <th className={`py-3 px-4 font-mono text-[10px] tracking-[2px] text-right ${themeTextSubMuted}`}>LIVE PNL</th>
                </tr>
              </thead>
              <tbody>
                {activeTrades.map((t) => (
                  <tr key={t.id} className={`border-b transition-colors ${isLight ? 'border-slate-100 hover:bg-slate-50' : 'border-[#283044]/20 hover:bg-white/[0.02]'}`}>
                    <td className={`py-3 px-4 font-ui font-bold ${themeTextPrimary}`}>{t.symbol}</td>
                    <td className="py-3 px-4">
                      <span className={`font-mono text-[10px] font-bold px-2 py-1 rounded ${
                        t.direction === "LONG" 
                          ? (isLight ? "bg-emerald-100 text-emerald-700" : "bg-[#00ff9d]/10 text-[#00ff9d]") 
                          : (isLight ? "bg-rose-100 text-rose-700" : "bg-[#ff2a6d]/10 text-[#ff2a6d]")
                      }`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className={`py-3 px-4 font-num text-sm font-bold text-right ${t.pnlUsdt >= 0 ? themeGreen : themeRed}`}>
                      {t.pnlUsdt >= 0 ? "+" : ""}${t.pnlUsdt.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {activeTrades.length === 0 && (
                  <tr>
                    <td colSpan={3} className={`py-8 text-center font-mono text-[11px] ${themeTextSubMuted}`}>No active positions.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CLOSED TRADE LEDGER */}
        <div className={`backdrop-blur-xl rounded-[10px] border flex flex-col overflow-hidden transition-colors duration-300 ${themeCardBg}`}>
          <div className={`px-6 py-4 border-b flex items-center gap-2 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#283044]/60 bg-gradient-to-b from-white/[0.03] to-transparent'}`}>
            <Layers size={14} className={themeCyan} />
            <span className={`font-mono text-[11px] font-bold tracking-[3px] uppercase ${themeTextMuted}`}>EXECUTION LEDGER</span>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${isLight ? 'border-slate-200' : 'border-[#283044]/40'}`}>
                  <th className={`py-3 px-4 font-mono text-[10px] tracking-[2px] ${themeTextSubMuted}`}>ASSET</th>
                  <th className={`py-3 px-4 font-mono text-[10px] tracking-[2px] text-right ${themeTextSubMuted}`}>NET PNL</th>
                </tr>
              </thead>
              <tbody>
                {closedTrades.map((t) => (
                  <tr key={t.id} className={`border-b transition-colors ${isLight ? 'border-slate-100 hover:bg-slate-50' : 'border-[#283044]/20 hover:bg-white/[0.02]'}`}>
                    <td className={`py-3 px-4 font-ui font-bold ${themeTextPrimary}`}>{t.symbol}</td>
                    <td className={`py-3 px-4 font-num text-sm font-bold text-right ${t.pnlUsdt >= 0 ? themeGreen : themeRed}`}>
                      {t.pnlUsdt >= 0 ? "+" : ""}${t.pnlUsdt.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {closedTrades.length === 0 && (
                  <tr>
                    <td colSpan={2} className={`py-8 text-center font-mono text-[11px] ${themeTextSubMuted}`}>No closed trades yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}