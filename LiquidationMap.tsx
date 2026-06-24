"use client";

import React, { useState, useEffect } from 'react';
import { useTradingStore, LIVE_PRICES } from "./useTradingState";
import { formatPrice } from "./utils";
import {
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Activity, RefreshCw } from 'lucide-react';

const COLORS = {
  bidWall: "#00ff9d",   // Support (Green)
  askWall: "#ff2a6d",   // Resistance (Red)
  cumBid: "#00ff9d",
  cumAsk: "#ff2a6d",
};

function formatLargeNumber(val: number) {
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return val.toFixed(2);
}

function formatUsdt(val: number) {
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toFixed(0)}`;
}

export default function Heatmap() {
  const activePair = useTradingStore((s) => s.activePair);
  const currentPrice = LIVE_PRICES[activePair] || 0;

  const [depthData, setDepthData] = useState<any[]>([]);
  const [totals, setTotals] = useState({ bidUsdt: 0, askUsdt: 0 });
  const [isFetching, setIsFetching] = useState(true);

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

  // Readability adjusted colors for Light Mode text
  const T_GREEN = isLight ? "#00b36e" : COLORS.bidWall;
  const T_RED = isLight ? "#e60045" : COLORS.askWall;

  useEffect(() => {
    const fetchLiveDepth = async () => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/depth?symbol=${activePair.replace("/", "")}&limit=5000`);
        const data = await res.json();

        if (!data.bids || !data.asks || data.bids.length === 0) return;

        const midPrice = (parseFloat(data.bids[0][0]) + parseFloat(data.asks[0][0])) / 2;
        
        const tickSize = midPrice * 0.001; 
        
        const minPrice = midPrice * 0.90;
        const maxPrice = midPrice * 1.10;

        const binnedBids = new Map<number, number>();
        const binnedAsks = new Map<number, number>();

        data.bids.forEach((b: string[]) => {
          const p = parseFloat(b[0]);
          if (p < minPrice) return;
          const vol = parseFloat(b[1]);
          const bin = Math.round(p / tickSize) * tickSize;
          binnedBids.set(bin, (binnedBids.get(bin) || 0) + vol);
        });

        data.asks.forEach((a: string[]) => {
          const p = parseFloat(a[0]);
          if (p > maxPrice) return;
          const vol = parseFloat(a[1]);
          const bin = Math.round(p / tickSize) * tickSize;
          binnedAsks.set(bin, (binnedAsks.get(bin) || 0) + vol);
        });

        const sortedBids = Array.from(binnedBids.entries())
          .map(([price, vol]) => ({ price, vol }))
          .sort((a, b) => a.price - b.price);

        const sortedAsks = Array.from(binnedAsks.entries())
          .map(([price, vol]) => ({ price, vol }))
          .sort((a, b) => a.price - b.price);

        let tBidsUsdt = 0;
        let tAsksUsdt = 0;

        let cumB = 0;
        for (let i = sortedBids.length - 1; i >= 0; i--) {
          cumB += sortedBids[i].vol;
          (sortedBids[i] as any).cumBid = cumB;
          (sortedBids[i] as any).bidVol = sortedBids[i].vol;
          tBidsUsdt += sortedBids[i].vol * sortedBids[i].price;
        }

        let cumA = 0;
        for (let i = 0; i < sortedAsks.length; i++) {
          cumA += sortedAsks[i].vol;
          (sortedAsks[i] as any).cumAsk = cumA;
          (sortedAsks[i] as any).askVol = sortedAsks[i].vol;
          tAsksUsdt += sortedAsks[i].vol * sortedAsks[i].price;
        }

        setDepthData([...sortedBids, ...sortedAsks]);
        setTotals({ bidUsdt: tBidsUsdt, askUsdt: tAsksUsdt });
        setIsFetching(false);
      } catch (e) {
        console.error("Depth fetch error");
      }
    };

    setIsFetching(true);
    fetchLiveDepth();
    
    const int = setInterval(fetchLiveDepth, 6000);
    return () => clearInterval(int);
  }, [activePair]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-xl font-mono text-[11px] z-50 border ${isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-[#11141a] border-white/10'}`}>
          <p className={`mb-2 font-bold border-b pb-1 ${isLight ? 'text-slate-800 border-slate-100' : 'text-white border-white/10'}`}>
            Price: {formatPrice(label, activePair)}
          </p>
          {payload.map((entry: any, index: number) => {
            if(entry.name.includes("Cumulative")) return null; 
            return (
              <div key={index} className="flex justify-between gap-4 py-0.5">
                <span style={{ color: isLight && entry.name.includes("Ask") ? T_RED : isLight && entry.name.includes("Bid") ? T_GREEN : entry.color }}>{entry.name}:</span>
                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{formatLargeNumber(entry.value)} {activePair.split('/')[0]}</span>
              </div>
            )
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full h-full flex flex-col rounded-[16px] border overflow-hidden transition-colors duration-300 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0b0e14] border-white/5'}`}>
      
      <div className={`flex flex-col border-b shrink-0 transition-colors duration-300 ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-md flex items-center gap-2 font-mono text-[12px] font-bold border transition-colors ${
              isLight ? 'bg-cyan-50 text-cyan-600 border-cyan-200 shadow-sm' : 'bg-[#1c2128] text-[#00f0ff] border-[#00f0ff]/20 shadow-[0_0_10px_rgba(0,240,255,0.1)]'
            }`}>
              <Activity size={14} />
              Macro Depth Map
            </div>
            <h2 className={`font-display text-[16px] md:text-[18px] font-bold tracking-wide ml-2 transition-colors ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Binance {activePair} Heatmap
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button className={`p-1.5 rounded-md border transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50' : 'bg-[#1c2128] border-white/5 text-[#a0a8b3] hover:text-white hover:bg-white/5'
            }`}>
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className={`flex justify-center items-center gap-16 px-6 py-4 border-t transition-colors duration-300 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0c10] border-white/5'}`}>
           <div className="flex flex-col items-center">
              <span className={`text-[10px] font-mono tracking-wider mb-1 transition-colors ${isLight ? 'text-slate-500' : 'text-[#8b99ae]'}`}>
                MACRO BIDS <span className="opacity-60">(Support Walls)</span>
              </span>
              <span className="text-[20px] font-num font-bold" style={{ color: T_GREEN, textShadow: isLight ? 'none' : '0 0 15px rgba(0,255,157,0.3)' }}>
                {formatUsdt(totals.bidUsdt)}
              </span>
           </div>
           
           <div className={`w-px h-[35px] mx-2 transition-colors ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}></div>
           
           <div className="flex flex-col items-center">
              <span className={`text-[10px] font-mono tracking-wider mb-1 transition-colors ${isLight ? 'text-slate-500' : 'text-[#8b99ae]'}`}>
                MACRO ASKS <span className="opacity-60">(Resistance Walls)</span>
              </span>
              <span className="text-[20px] font-num font-bold" style={{ color: T_RED, textShadow: isLight ? 'none' : '0 0 15px rgba(255,42,109,0.3)' }}>
                {formatUsdt(totals.askUsdt)}
              </span>
           </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 relative p-4 pl-0">
        {depthData.length === 0 ? (
           <div className={`w-full h-full flex items-center justify-center font-mono text-[12px] animate-pulse transition-colors ${isLight ? 'text-slate-400' : 'text-[#4f5b70]'}`}>
             FETCHING MACRO ORDER BOOK FOR {activePair}...
           </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={depthData} margin={{ top: 45, right: 20, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isLight ? T_GREEN : COLORS.cumBid} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isLight ? T_GREEN : COLORS.cumBid} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAsk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isLight ? T_RED : COLORS.cumAsk} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isLight ? T_RED : COLORS.cumAsk} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#000000" : "#ffffff"} strokeOpacity={0.05} vertical={false} />
              
              <XAxis 
                dataKey="price" 
                type="number"
                domain={['dataMin', 'dataMax']}
                stroke={isLight ? "#cbd5e1" : "#545f73"} 
                tick={{ fill: isLight ? '#64748b' : '#545f73', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={false} axisLine={false} dy={10} minTickGap={50}
                tickFormatter={(val) => activePair.includes('BTC') ? val.toFixed(0) : val.toFixed(4)}
              />
              
              <YAxis 
                yAxisId="left" orientation="left" stroke={isLight ? "#cbd5e1" : "#545f73"}
                tick={{ fill: isLight ? '#64748b' : '#545f73', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={false} axisLine={false}
                tickFormatter={(value) => formatLargeNumber(value)}
                dx={-10}
              />

              <YAxis 
                yAxisId="right" orientation="right" stroke={isLight ? "#cbd5e1" : "#545f73"}
                tick={{ fill: isLight ? '#64748b' : '#545f73', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={false} axisLine={false}
                tickFormatter={(value) => formatLargeNumber(value)}
                dx={10}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ fill: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }} />

              <Bar dataKey="bidVol" name="Bid Wall (Buyers)" fill={isLight ? T_GREEN : COLORS.bidWall} yAxisId="right" maxBarSize={6} />
              <Bar dataKey="askVol" name="Ask Wall (Sellers)" fill={isLight ? T_RED : COLORS.askWall} yAxisId="right" maxBarSize={6} />

              <Area type="monotone" dataKey="cumBid" name="Cumulative Bids" stroke={isLight ? T_GREEN : COLORS.cumBid} strokeWidth={2} fill="url(#colorBid)" yAxisId="left" dot={false} activeDot={false} connectNulls />
              <Area type="monotone" dataKey="cumAsk" name="Cumulative Asks" stroke={isLight ? T_RED : COLORS.cumAsk} strokeWidth={2} fill="url(#colorAsk)" yAxisId="left" dot={false} activeDot={false} connectNulls />

              {/* ── CUSTOM CURRENT PRICE ARROW & LABEL ── */}
              <ReferenceLine 
                x={Number(currentPrice.toFixed(4))} 
                stroke={isLight ? "#334155" : "#ffffff"} 
                strokeDasharray="4 4" 
                yAxisId="right"
                label={({ viewBox }: any) => {
                  if (!viewBox) return null;
                  return (
                    <g transform={`translate(${viewBox.x}, ${viewBox.y})`}>
                      {/* Price Text */}
                      <text x={0} y={-18} fill={isLight ? "#0f172a" : "#ffffff"} fontSize={14} fontFamily="monospace" fontWeight="bold" textAnchor="middle" style={{ textShadow: isLight ? 'none' : '0 0 10px rgba(0,0,0,0.8)' }}>
                        {formatPrice(currentPrice, activePair)}
                      </text>
                      {/* Arrow Pointing Down */}
                      <text x={0} y={-4} fill={isLight ? "#334155" : "#ffffff"} fontSize={12} textAnchor="middle" style={{ textShadow: isLight ? 'none' : '0 0 10px rgba(0,0,0,0.8)' }}>
                        ▼
                      </text>
                    </g>
                  );
                }} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}