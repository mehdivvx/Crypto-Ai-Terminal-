"use client";

import { useTradingStore, LIVE_PRICES } from "./useTradingState";
import { formatPrice } from "./utils";
import { XCircle, CheckCircle2 } from "lucide-react";

export interface SignalCardProps {
  signal?: any; 
}

export function SignalCard({ signal }: SignalCardProps) {
  const candles = useTradingStore(s => s.candles) || [];
  const activePair = useTradingStore(s => s.activePair);
  const settings = useTradingStore(s => s.settings);
  const totalBalance = useTradingStore(s => s.totalBalance);
  
  const takeSignal = useTradingStore(s => s.takeSignal);
  const dismissSignal = useTradingStore(s => s.dismissSignal);
  const closeTradeManual = useTradingStore(s => s.closeTradeManual);

  const sig = signal || {};
  const isWait = !signal || (sig.status !== "PENDING" && sig.status !== "ACTIVE" && !sig.status?.includes("HIT"));
  const isBuy = sig.direction === "LONG" || sig.direction === "BUY";
  const displaySymbol = sig.symbol || activePair;
  
  // ─── LIVE PnL ANALYTICS ───
  let livePnlPct = 0;
  let livePnlUsdt = 0;
  let isProfitable = false;
  const currentPrice = LIVE_PRICES[displaySymbol] || sig.entryPrice || 0;

  if (sig.status === 'ACTIVE' && sig.entryPrice) {
    if (isBuy) livePnlPct = ((currentPrice - sig.entryPrice) / sig.entryPrice) * 100;
    else livePnlPct = ((sig.entryPrice - currentPrice) / sig.entryPrice) * 100;
    
    isProfitable = livePnlPct >= 0;
    const allocated = settings.riskMode === 'FLAT' ? settings.riskValue : (settings.riskValue / 100) * totalBalance;
    livePnlUsdt = (livePnlPct / 100) * allocated;
  }

  // ─── DYNAMIC COLORS & GLOWS ───
  const dirColor = isWait ? "#ffb800" : isBuy ? "#00ff9d" : "#ff2a6d"; 
  
  // Outer Edge is ALWAYS Neon Cyan for Active/Pending trades now
  let edgeColor = isWait ? "transparent" : dirColor;
  let isNeonPending = sig.status === 'PENDING';
  
  if (isNeonPending || sig.status === 'ACTIVE') {
    edgeColor = "#00d4ff"; // Locked to Neon Cyan
  }

  let cardGlow = isWait ? 'none' : `inset 0 0 20px ${edgeColor}15`;
  let cardBorder = isWait ? 'rgba(255,255,255,0.1)' : `${edgeColor}60`;

  // Make the glow solid and static when the trade is actively running
  if (sig.status === 'ACTIVE') {
    cardGlow = `0 0 20px ${edgeColor}40, inset 0 0 20px ${edgeColor}20`; 
    cardBorder = edgeColor;
  }

  const confColor = "#00d4ff";
  let conf = sig.confidence || 10; 
  if (isWait && candles.length > 5) conf = 35; 
  
  const entryDisp = isWait || !sig.entryPrice ? "--" : formatPrice(sig.entryPrice, sig.symbol);
  const slDisp    = isWait || !sig.sl ? "--" : formatPrice(sig.sl, sig.symbol);
  const tp1       = isWait || !sig.tp1 ? "--" : formatPrice(sig.tp1, sig.symbol);
  const tp2       = isWait || !sig.tp2 ? "--" : formatPrice(sig.tp2, sig.symbol);

  // Profit/Loss text color (internal only, doesn't affect the card glow)
  const pnlTextColor = isProfitable ? "#00ff9d" : "#ff2a6d";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan { 0% {transform:translateY(-100%) rotate(45deg);} 100% {transform:translateY(100%) rotate(45deg);} }
        @keyframes neon-pulse {
          0%, 100% { box-shadow: 0 0 8px var(--neon-color), inset 0 0 8px var(--neon-color); border-color: var(--neon-border); }
          50% { box-shadow: 0 0 25px var(--neon-color), inset 0 0 15px var(--neon-color); border-color: var(--neon-color); }
        }
        .neon-smooth-edges { animation: neon-pulse 2.5s ease-in-out infinite; }
      `}} />
      
      <div 
        className={`relative rounded-[8px] p-4 flex-shrink-0 overflow-hidden mb-3 ${isNeonPending ? 'neon-smooth-edges' : ''}`}
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          border: `1px solid ${cardBorder}`,
          boxShadow: cardGlow,
          transition: "all 0.3s ease",
          '--neon-color': edgeColor,
          '--neon-border': `${edgeColor}60`
        } as React.CSSProperties}
      >
        <div className="absolute pointer-events-none z-0" style={{ top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'linear-gradient(rgba(255,255,255,0), rgba(255,255,255,0.03), rgba(255,255,255,0))', animation: 'scan 4s linear infinite' }} />

        {/* ─── HEADER: FIXED CONGESTION/SPACING ─── */}
        <div className="flex justify-between items-center gap-4 mb-2 relative z-10">
          <div className="flex items-baseline gap-2 min-w-0">
             <div className="font-mono text-[26px] font-bold tracking-[4px] leading-none flex-shrink-0" style={{ color: dirColor, textShadow: isWait ? `0 0 15px rgba(255,184,0,0.3)` : `0 0 20px ${dirColor}` }}>
               {isWait ? "WAIT" : isBuy ? "BUY" : "SELL"}
             </div>
             {!isWait && (
               <div className="font-mono text-[13px] font-bold text-white truncate uppercase tracking-[0.5px]">
                 {displaySymbol}
               </div>
             )}
          </div>
          
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-1 rounded-[4px] tracking-[1px] uppercase flex-shrink-0" 
                style={{ background: `${edgeColor}15`, color: edgeColor, border: `1px solid ${edgeColor}50`, boxShadow: `inset 0 0 8px ${edgeColor}20` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: edgeColor }} />
            {sig.status || "SCANNING"}
          </span>
        </div>

        {!isWait && <div className="font-mono text-[10px] font-bold tracking-[2px] mb-2 text-[#00d4ff] relative z-10">{sig.timeframe} TIMEFRAME</div>}

        {/* ─── CONFIDENCE BAR ─── */}
        <div className="flex items-baseline gap-2 my-2 relative z-10">
          <span className="font-num text-[24px] font-bold" style={{ color: confColor }}>{conf}%</span>
          <span className="text-[11px] font-semibold text-[#8b99ae]">CONFIDENCE SCORE</span>
        </div>
        <div className="h-[4px] rounded-[2px] mb-3 relative z-10" style={{ background: 'rgba(0,0,0,0.6)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}>
          <div className="h-full rounded-[2px] transition-all duration-300 ease-out" style={{ width: `${conf}%`, background: `linear-gradient(90deg, ${confColor}40, ${confColor})`, boxShadow: `0 0 15px ${confColor}80` }} />
        </div>

        {/* ─── LEVELS GRID ─── */}
        <div className="grid grid-cols-2 gap-2 my-3 relative z-10">
          <div className="bg-black/30 border border-white/5 rounded-[6px] p-2">
            <div className="text-[9px] text-[#4f5b70] tracking-[2px] font-mono font-bold mb-0.5">ENTRY</div>
            <div className="font-num text-[14px] font-bold" style={{ color: isWait ? '#4f5b70' : confColor }}>{entryDisp}</div>
          </div>
          <div className="bg-black/30 border border-white/5 rounded-[6px] p-2">
            <div className="text-[9px] text-[#4f5b70] tracking-[2px] font-mono font-bold mb-0.5">STOP LOSS</div>
            <div className="font-num text-[14px] font-bold" style={{ color: isWait ? '#4f5b70' : '#ff2a6d' }}>{slDisp}</div>
          </div>
          <div className="bg-black/30 border border-white/5 rounded-[6px] p-2">
            <div className="text-[9px] text-[#4f5b70] tracking-[2px] font-mono font-bold mb-0.5">TP 1</div>
            <div className="font-num text-[14px] font-bold" style={{ color: isWait ? '#4f5b70' : '#00ff9d' }}>{tp1}</div>
          </div>
          <div className="bg-black/30 border border-white/5 rounded-[6px] p-2">
            <div className="text-[9px] text-[#4f5b70] tracking-[2px] font-mono font-bold mb-0.5">TP 2</div>
            <div className="font-num text-[14px] font-bold" style={{ color: isWait ? '#4f5b70' : '#00ff9d' }}>{tp2}</div>
          </div>
        </div>

        {/* ─── LIVE PnL ANALYTICS (Only when Active) ─── */}
        {sig.status === 'ACTIVE' && (
          <div className="flex justify-between items-center bg-black/50 border border-white/10 rounded-[6px] p-2 mb-3 relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col">
               <span className="font-mono text-[9px] text-[#8b99ae] tracking-[1px]">LIVE PnL</span>
               <span className="font-num text-[16px] font-bold" style={{ color: pnlTextColor, textShadow: `0 0 10px ${pnlTextColor}80` }}>
                 {isProfitable ? '+' : ''}{livePnlUsdt.toFixed(2)} USDT
               </span>
            </div>
            <div className="flex flex-col items-end">
               <span className="font-mono text-[9px] text-[#8b99ae] tracking-[1px]">ROI %</span>
               <span className="font-num text-[16px] font-bold" style={{ color: pnlTextColor, textShadow: `0 0 10px ${pnlTextColor}80` }}>
                 {isProfitable ? '+' : ''}{livePnlPct.toFixed(2)}%
               </span>
            </div>
          </div>
        )}

        {/* ─── NEON ACTION BUTTONS ─── */}
        {sig.status === 'PENDING' && (
          <div className="grid grid-cols-2 gap-2 mb-3 relative z-10">
            <button onClick={() => takeSignal(sig.id)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-[4px] font-mono text-[10px] font-bold tracking-[2px] transition-all hover:scale-[1.02]" style={{ background: `linear-gradient(90deg, #00d4ff15, #00d4ff30)`, color: '#00d4ff', border: `1px solid #00d4ff80`, boxShadow: `0 0 15px rgba(0,212,255,0.25)` }}>
              <CheckCircle2 size={12} /> TAKE TRADE
            </button>
            <button onClick={() => dismissSignal(sig.id)} className="py-2.5 rounded-[4px] font-mono text-[10px] font-bold tracking-[2px] text-[#8b99ae] border border-white/10 bg-black/40 hover:bg-white/5 transition-all hover:scale-[1.02]">
              PASS (10s)
            </button>
          </div>
        )}

        {sig.status === 'ACTIVE' && (
          <button onClick={() => closeTradeManual(sig.id)} className="w-full flex items-center justify-center gap-1.5 py-2.5 mb-3 rounded-[4px] font-mono text-[10px] font-bold tracking-[2px] transition-all hover:scale-[1.02] relative z-10" style={{ background: `linear-gradient(90deg, #00d4ff15, #00d4ff30)`, color: '#00d4ff', border: `1px solid #00d4ff80`, boxShadow: `0 0 15px rgba(0,212,255,0.25)` }}>
            <XCircle size={12} /> CANCEL TRADE NOW
          </button>
        )}

        {/* ─── REASON BOX ─── */}
        <div className="bg-[#05070a] border-l-[3px] py-2.5 px-3 mt-1 rounded-r-[4px] text-[11px] font-medium text-[#8b99ae] leading-relaxed shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)] relative z-10" style={{ borderLeftColor: confColor }}>
          {(sig.reasoning && sig.reasoning.length > 0 ? sig.reasoning : ["Monitoring live market feeds..."]).join(' • ')}
        </div>
      </div>
    </>
  );
}