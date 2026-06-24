"use client";

import { useEffect, useRef, useState } from "react";
import { useTradingStore, LIVE_PRICES } from "./useTradingState";
import { formatPrice } from "./utils";

export default function OrderBook() {
  const activePair = useTradingStore((s) => s.activePair) || "BTC/USDT";
  const currentPrice = LIVE_PRICES[activePair] || 0;

  const rawAsks = useTradingStore((s) => s.asks) || [];
  const rawBids = useTradingStore((s) => s.bids) || [];

  const storeBuyVol = useTradingStore((s: any) => s.candleBuyVol) || 0;
  const storeSellVol = useTradingStore((s: any) => s.candleSellVol) || 0;

  // ── CORE COLORS ──
  const C_GREEN = "var(--neon-green)";
  const C_RED = "var(--neon-red)";
  const C_CYAN = "var(--neon-cyan)";

  // ── ORDERBOOK ACCUMULATION ──
  let askTotal = 0;
  const asks = rawAsks.slice(0, 10).map((a) => {
    askTotal += a[1];
    return { price: a[0], size: a[1], total: askTotal };
  }).reverse();

  let bidTotal = 0;
  const bids = rawBids.slice(0, 10).map((b) => {
    bidTotal += b[1];
    return { price: b[0], size: b[1], total: bidTotal };
  });

  const totalBidVol = bids.length > 0 ? bids[bids.length - 1].total : 0;
  const totalAskVol = asks.length > 0 ? asks[0].total : 0;
  const maxTotal = Math.max(totalAskVol, totalBidVol);

  const totalVol = totalBidVol + totalAskVol;
  const buyPct = totalVol > 0 ? Math.round((totalBidVol / totalVol) * 100) : 50;
  const sellPct = 100 - buyPct;

  const extremeBuy = buyPct > 84;
  const extremeSell = sellPct > 84;

  const bestAsk = rawAsks.length > 0 ? rawAsks[0][0] : 0;
  const bestBid = rawBids.length > 0 ? rawBids[0][0] : 0;
  const spreadAmt = bestAsk - bestBid;

  // ── 1. IMPLIED VOLUME ENGINE ──
  const [impliedBuyVol, setImpliedBuyVol] = useState(0);
  const [impliedSellVol, setImpliedSellVol] = useState(0);
  const prevPriceRef = useRef(currentPrice);

  useEffect(() => {
    if (currentPrice === 0) return; 

    const diff = currentPrice - prevPriceRef.current;
    if (prevPriceRef.current > 0 && diff !== 0) {
      const topBidSize = rawBids[0] ? rawBids[0][1] : 0.5;
      const topAskSize = rawAsks[0] ? rawAsks[0][1] : 0.5;
      
      if (diff > 0) {
        setImpliedBuyVol((v) => v + (diff * topAskSize));
      } else {
        setImpliedSellVol((v) => v + (Math.abs(diff) * topBidSize));
      }
    }
    prevPriceRef.current = currentPrice;
  }, [currentPrice, rawBids, rawAsks]);

  const activeBuyVol = storeBuyVol > 0 ? storeBuyVol : impliedBuyVol;
  const activeSellVol = storeSellVol > 0 ? storeSellVol : impliedSellVol;
  const activeTotalVol = activeBuyVol + activeSellVol;

  // ── 2. MACRO CLUSTER ALGORITHM (REWRITTEN) ──
  const allOrders = [
    ...rawBids.map(b => ({ price: b[0], volume: b[1], type: "BUY" as const })),
    ...rawAsks.map(a => ({ price: a[0], volume: a[1], type: "SELL" as const }))
  ].sort((a, b) => b.volume - a.volume); 

  let keyVolumeLevels: typeof allOrders = [];
  
  let minDistance = currentPrice * 0.003; 
  let separation = currentPrice * 0.004;  
  
  for (const order of allOrders) {
    if (keyVolumeLevels.length >= 5) break;
    if (Math.abs(order.price - currentPrice) < minDistance) continue;
    if (!keyVolumeLevels.some(c => Math.abs(c.price - order.price) < separation)) {
      keyVolumeLevels.push(order);
    }
  }

  if (keyVolumeLevels.length < 5) {
    keyVolumeLevels = [];
    minDistance = currentPrice * 0.001; 
    separation = currentPrice * 0.0015; 
    for (const order of allOrders) {
      if (keyVolumeLevels.length >= 5) break;
      if (Math.abs(order.price - currentPrice) < minDistance) continue;
      if (!keyVolumeLevels.some(c => Math.abs(c.price - order.price) < separation)) {
        keyVolumeLevels.push(order);
      }
    }
  }

  if (keyVolumeLevels.length < 5) {
    keyVolumeLevels = [];
    for (const order of allOrders) {
      if (keyVolumeLevels.length >= 5) break;
      if (!keyVolumeLevels.some(c => c.price === order.price)) {
        keyVolumeLevels.push(order);
      }
    }
  }

  const maxKeyVol = keyVolumeLevels.length > 0 ? keyVolumeLevels[0].volume : 1;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ob-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes flare-green {
          0%, 100% { opacity: 0.3; box-shadow: 0 0 8px var(--neon-green); }
          50% { opacity: 0.85; box-shadow: 0 0 20px var(--neon-green), inset 0 0 10px var(--neon-green); }
        }
        @keyframes flare-red {
          0%, 100% { opacity: 0.3; box-shadow: 0 0 8px var(--neon-red); }
          50% { opacity: 0.85; box-shadow: 0 0 20px var(--neon-red), inset 0 0 10px var(--neon-red); }
        }
        .ob-scroll::-webkit-scrollbar { width: 3px; }
        .ob-scroll::-webkit-scrollbar-track { background: transparent; }
        .ob-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        .ob-scroll::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
      `}} />

      <div className="h-full w-full rounded-[16px] flex flex-col overflow-hidden bg-[var(--panel)] border border-[var(--border)] shadow-md relative transition-colors duration-300">
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)', backgroundSize: '6px 6px' }}
        />

        {/* HEADER */}
        <div className="px-3 py-3 border-b border-[var(--border)] flex items-center justify-center relative shrink-0 bg-[var(--surface)]">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(90deg,transparent,var(--neon-cyan),transparent)`, opacity: 0.05, animation: "ob-shimmer 3s linear infinite" }} />
          <span className="font-display text-[12px] tracking-[0.3em] font-bold z-10 uppercase" style={{ color: C_CYAN, textShadow: `0 0 10px var(--neon-cyan)` }}>
            ORDER BOOK
          </span>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto ob-scroll flex flex-col pb-2 relative z-10">
          
          {/* IMBALANCE BAR */}
          <div className="px-3 pt-2 pb-1.5 shrink-0">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-mono text-[9px] font-bold tracking-[1px]" style={{ color: C_GREEN, textShadow: extremeBuy ? `0 0 10px ${C_GREEN}` : 'none' }}>BUY {buyPct}%</span>
              <span className="font-mono text-[9px] font-bold tracking-[1px]" style={{ color: C_RED, textShadow: extremeSell ? `0 0 10px ${C_RED}` : 'none' }}>{sellPct}% SELL</span>
            </div>
            <div className="h-[4px] rounded-full overflow-hidden flex bg-[var(--border)]">
              <div className="h-full transition-all duration-300" style={{ width: `${buyPct}%`, background: C_GREEN, boxShadow: `0 0 10px ${C_GREEN}` }} />
              <div className="h-full transition-all duration-300" style={{ width: `${sellPct}%`, background: C_RED, boxShadow: `0 0 10px ${C_RED}` }} />
            </div>
          </div>

          <div className="flex justify-between px-3 py-1.5 shrink-0 border-b border-[var(--border)]">
            <span className="font-mono text-[9px] font-bold tracking-[2px] text-[var(--text-muted)]">PRICE</span>
            <span className="font-mono text-[9px] font-bold tracking-[2px] text-[var(--text-muted)]">SIZE</span>
            <span className="font-mono text-[9px] font-bold tracking-[2px] text-[var(--text-muted)]">TOTAL</span>
          </div>

          {/* ASKS */}
          <div className="flex flex-col gap-[1px] px-1 mt-1 shrink-0">
            {asks.length === 0 && <div className="text-center font-mono text-[10px] text-[var(--text-muted)] py-4">SYNCING L2...</div>}
            {asks.map((ask, i) => {
              const depthPct = Math.min((ask.total / maxTotal) * 100, 100);
              return (
                <div key={`ask-${i}`} className="flex justify-between items-center px-2 py-[2px] rounded relative hover:bg-[var(--surface)] transition-colors cursor-crosshair group">
                  <div 
                    className={`absolute right-0 top-0 bottom-0 rounded-r pointer-events-none transition-all duration-300 ${!extremeSell ? 'opacity-[0.15] group-hover:opacity-30' : ''}`} 
                    style={{ width: `${depthPct}%`, background: C_RED, animation: extremeSell ? 'flare-red 1s infinite ease-in-out' : 'none' }} 
                  />
                  <span className="font-mono text-[11px] font-bold z-10" style={{ color: C_RED }}>{formatPrice(ask.price)}</span>
                  <span className="font-mono text-[10px] text-[var(--text-primary)] z-10">{ask.size.toFixed(3)}</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] z-10">{ask.total.toFixed(3)}</span>
                </div>
              );
            })}
          </div>

          {/* LIVE PRICE */}
          <div className="mx-2 my-2 py-1.5 flex items-center justify-center relative overflow-hidden rounded-[8px] border-y border-[var(--border)] bg-[var(--surface)] shrink-0 shadow-sm">
            <span className="font-num text-[18px] font-bold tracking-wide z-10" style={{ color: C_CYAN, textShadow: `0 0 15px var(--neon-cyan)` }}>
              {formatPrice(currentPrice)}
            </span>
          </div>

          {/* BIDS */}
          <div className="flex flex-col gap-[1px] px-1 mb-2 shrink-0">
            {bids.map((bid, i) => {
              const depthPct = Math.min((bid.total / maxTotal) * 100, 100);
              return (
                <div key={`bid-${i}`} className="flex justify-between items-center px-2 py-[2px] rounded relative hover:bg-[var(--surface)] transition-colors cursor-crosshair group">
                  <div 
                    className={`absolute right-0 top-0 bottom-0 rounded-r pointer-events-none transition-all duration-300 ${!extremeBuy ? 'opacity-[0.15] group-hover:opacity-30' : ''}`} 
                    style={{ width: `${depthPct}%`, background: C_GREEN, animation: extremeBuy ? 'flare-green 1s infinite ease-in-out' : 'none' }} 
                  />
                  <span className="font-mono text-[11px] font-bold z-10" style={{ color: C_GREEN }}>{formatPrice(bid.price)}</span>
                  <span className="font-mono text-[10px] text-[var(--text-primary)] z-10">{bid.size.toFixed(3)}</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] z-10">{bid.total.toFixed(3)}</span>
                </div>
              );
            })}
          </div>

          {/* ── LIVE CANDLE & INSTITUTIONAL CLUSTERS ── */}
          <div className="mt-2 flex flex-col shrink-0 px-2 pb-1 gap-2 pt-2 border-t border-[var(--border)]">
            
            <div className="flex flex-col px-3 py-2.5 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-mono text-[9px] font-bold tracking-[1.5px] text-[var(--text-muted)] uppercase">
                  ⚡ Candle Volume
                </span>
                <span className="font-mono text-[11px] font-bold text-[var(--text-primary)] tracking-wide">
                  {activeTotalVol > 0 ? activeTotalVol.toFixed(2) : "0.00"} Vol
                </span>
              </div>

              <div className="h-[5px] rounded-full overflow-hidden flex bg-[var(--border)] relative my-1">
                <div 
                  className="h-full transition-all duration-300 ease-out" 
                  style={{ 
                    width: `${activeTotalVol > 0 ? (activeBuyVol / activeTotalVol) * 100 : 50}%`, 
                    background: C_GREEN,
                    boxShadow: activeBuyVol > activeSellVol ? `0 0 8px var(--neon-green)` : "none"
                  }} 
                />
                <div 
                  className="h-full transition-all duration-300 ease-out" 
                  style={{ 
                    width: `${activeTotalVol > 0 ? (activeSellVol / activeTotalVol) * 100 : 50}%`, 
                    background: C_RED,
                    boxShadow: activeSellVol > activeBuyVol ? `0 0 8px var(--neon-red)` : "none"
                  }} 
                />
              </div>

              <div className="flex justify-between items-center mt-1">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] font-bold leading-none" style={{ color: C_GREEN }}>
                    {activeBuyVol.toFixed(2)}
                  </span>
                  <span className="font-mono text-[7px] text-[var(--text-muted)] font-bold tracking-[0.5px] mt-0.5">BUY VOL</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-mono text-[10px] font-bold leading-none" style={{ color: C_RED }}>
                    {activeSellVol.toFixed(2)}
                  </span>
                  <span className="font-mono text-[7px] text-[var(--text-muted)] font-bold tracking-[0.5px] mt-0.5">SELL VOL</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 px-1">
              <div className="flex justify-between items-center px-1 py-0.5 mb-1">
                <span className="font-mono text-[9px] font-bold tracking-[1.5px] text-[var(--text-muted)] uppercase">
                  Macro Clusters
                </span>
                <span className="font-mono text-[8px] font-bold text-[var(--text-muted)] tracking-[0.5px] uppercase">
                  Live Spread: {spreadAmt > 0 ? spreadAmt.toFixed(activePair.includes('SHIB') || activePair.includes('PEPE') ? 8 : 4) : '0.00'} USDT
                </span>
              </div>

              <div className="flex flex-col gap-[3px]">
                {keyVolumeLevels.map((level, idx) => {
                  const isBuyNode = level.type === "BUY";
                  const concentrationPct = Math.min((level.volume / maxKeyVol) * 100, 100);

                  return (
                    <div 
                      key={`key-vol-${idx}`} 
                      className="flex justify-between items-center px-2.5 py-1.5 rounded-[6px] bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden group hover:border-[var(--neon-cyan)] transition-colors"
                    >
                      <div 
                        className="absolute left-0 top-0 bottom-0 opacity-10 transition-all duration-300 pointer-events-none" 
                        style={{ width: `${concentrationPct}%`, background: isBuyNode ? C_GREEN : C_RED }} 
                      />
                      <div className="flex items-center gap-2 z-10">
                        <span className="w-1 h-3 rounded-full shrink-0" style={{ background: isBuyNode ? C_GREEN : C_RED, boxShadow: `0 0 6px ${isBuyNode ? 'var(--neon-green)' : 'var(--neon-red)'}` }} />
                        <span className="font-mono text-[11px] font-bold text-[var(--text-primary)]">
                          {formatPrice(level.price)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 z-10 font-mono text-[10px]">
                        <span className="text-[var(--text-primary)] font-medium">{level.volume.toFixed(2)}</span>
                        <span 
                          className="text-[8px] font-bold px-1 rounded-sm bg-[var(--panel)] border border-[var(--border)] uppercase"
                          style={{ color: isBuyNode ? C_GREEN : C_RED }}
                        >
                          {level.type}
                        </span>
                      </div>
                    </div>
                  );
                })}
                
                {keyVolumeLevels.length === 0 && (
                  <div className="text-center font-mono text-[10px] text-[var(--text-muted)] py-3 bg-[var(--surface)] rounded-[6px] border border-[var(--border)]">
                    AWAITING ORDERBOOK CLUSTERS...
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}