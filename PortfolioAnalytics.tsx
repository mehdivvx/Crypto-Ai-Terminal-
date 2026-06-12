"use client";

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

  return (
    <div className="h-full flex flex-col gap-4 p-2 animate-fade-in-up">
      
      {/* ── TOP STATS ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        
        {/* Risk Management Panel */}
        <div className="bg-[#0D1017]/70 backdrop-blur-xl rounded-[10px] border border-[#283044]/60 p-5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Settings size={12} className="text-[#00f0ff]" />
            <span className="font-mono text-[9px] font-bold text-[#8b99ae] tracking-[3px] uppercase">RISK PARAMETERS</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="font-mono text-[8px] text-[#4f5b70] uppercase tracking-wider block mb-1">Starting Balance ($)</label>
              <input 
                type="number" 
                value={settings.startingBalance}
                onChange={(e) => updateSettings({ startingBalance: parseFloat(e.target.value) })}
                className="w-full bg-black/40 border border-[#283044] rounded px-2 py-1 font-num text-sm text-white focus:border-[#00f0ff] outline-none"
              />
            </div>
            <div>
              <label className="font-mono text-[8px] text-[#4f5b70] uppercase tracking-wider block mb-1">Risk per Trade (%)</label>
              <input 
                type="number" 
                value={settings.riskValue}
                onChange={(e) => updateSettings({ riskValue: parseFloat(e.target.value) })}
                className="w-full bg-black/40 border border-[#283044] rounded px-2 py-1 font-num text-sm text-[#00f0ff] focus:border-[#00f0ff] outline-none"
              />
            </div>
          </div>
        </div>
        
        {/* Session Return */}
        <div className="bg-[#0D1017]/70 backdrop-blur-xl rounded-[10px] border border-[#283044]/60 p-6 flex flex-col justify-center">
          <div className="font-mono text-[10px] font-bold text-[#8b99ae] tracking-[3px] uppercase mb-2">SESSION PNL</div>
          <div className={`font-num text-3xl font-bold flex items-center gap-3 ${isUp ? 'text-[#00ff9d]' : 'text-[#ff2a6d]'}`}>
            {isUp ? "+" : ""}${formatUsdt(Math.abs(sessionPnl))}
          </div>
          <div className="font-mono text-[10px] mt-2 tracking-wider opacity-60">
            {formatPct(sessionPct)} RETURN ON EQUITY
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-[#0D1017]/70 backdrop-blur-xl rounded-[10px] border border-[#283044]/60 p-6 flex flex-col justify-center">
          <div className="font-mono text-[10px] font-bold text-[#8b99ae] tracking-[3px] uppercase mb-2">MY WIN RATE</div>
          <div className="font-num text-3xl font-bold text-[#00f0ff]">
            {analytics.userWinrate.toFixed(1)}%
          </div>
        </div>

        {/* Trade Execution Stats */}
        <div className="bg-[#0D1017]/70 backdrop-blur-xl rounded-[10px] border border-[#283044]/60 p-6 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-2">
            <div className="font-mono text-[10px] font-bold text-[#8b99ae] tracking-[3px] uppercase">TOTAL TRADES</div>
            <div className="font-num text-lg font-bold text-white">{analytics.totalTrades}</div>
          </div>
          <div className="flex justify-between items-center border-t border-[#283044]/40 pt-2 mt-2">
            <div className="font-mono text-[10px] font-bold text-[#8b99ae] tracking-[3px] uppercase">W/L RATIO</div>
            <div className="font-num text-sm font-bold">
              <span className="text-[#00ff9d]">{analytics.winCount}W</span> / <span className="text-[#ff2a6d]">{analytics.lossCount}L</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── MIDDLE ROW (TABLES) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        
        {/* ACTIVE POSITIONS TABLE */}
        <div className="bg-[#0D1017]/70 backdrop-blur-xl rounded-[10px] border border-[#283044]/60 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-[#283044]/60 bg-gradient-to-b from-white/[0.03] to-transparent flex items-center gap-2">
            <Shield size={14} className="text-[#00ff9d]" />
            <span className="font-mono text-[11px] font-bold text-[#8b99ae] tracking-[3px] uppercase">ACTIVE POSITIONS</span>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#283044]/40">
                  <th className="py-3 px-4 font-mono text-[10px] text-[#4f5b70] tracking-[2px]">ASSET</th>
                  <th className="py-3 px-4 font-mono text-[10px] text-[#4f5b70] tracking-[2px]">TYPE</th>
                  <th className="py-3 px-4 font-mono text-[10px] text-[#4f5b70] tracking-[2px] text-right">LIVE PNL</th>
                </tr>
              </thead>
              <tbody>
                {activeTrades.map((t) => (
                  <tr key={t.id} className="border-b border-[#283044]/20 hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-ui font-bold text-white">{t.symbol}</td>
                    <td className="py-3 px-4">
                      <span className={`font-mono text-[10px] font-bold px-2 py-1 rounded ${t.direction === "LONG" ? "bg-[#00ff9d]/10 text-[#00ff9d]" : "bg-[#ff2a6d]/10 text-[#ff2a6d]"}`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className={`py-3 px-4 font-num text-sm font-bold text-right ${t.pnlUsdt >= 0 ? 'text-[#00ff9d]' : 'text-[#ff2a6d]'}`}>
                      {t.pnlUsdt >= 0 ? "+" : ""}${t.pnlUsdt.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CLOSED TRADE LEDGER */}
        <div className="bg-[#0D1017]/70 backdrop-blur-xl rounded-[10px] border border-[#283044]/60 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-[#283044]/60 bg-gradient-to-b from-white/[0.03] to-transparent flex items-center gap-2">
            <Layers size={14} className="text-[#00f0ff]" />
            <span className="font-mono text-[11px] font-bold text-[#8b99ae] tracking-[3px] uppercase">EXECUTION LEDGER</span>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#283044]/40">
                  <th className="py-3 px-4 font-mono text-[10px] text-[#4f5b70] tracking-[2px]">ASSET</th>
                  <th className="py-3 px-4 font-mono text-[10px] text-[#4f5b70] tracking-[2px] text-right">NET PNL</th>
                </tr>
              </thead>
              <tbody>
                {closedTrades.map((t) => (
                  <tr key={t.id} className="border-b border-[#283044]/20 hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-ui font-bold text-white">{t.symbol}</td>
                    <td className={`py-3 px-4 font-num text-sm font-bold text-right ${t.pnlUsdt >= 0 ? 'text-[#00ff9d]' : 'text-[#ff2a6d]'}`}>
                      {t.pnlUsdt >= 0 ? "+" : ""}${t.pnlUsdt.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}