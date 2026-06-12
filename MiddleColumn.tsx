"use client";

import ChartPanel from "./ChartPanel";
import OrderBook from "./OrderBook";
import { useTradingStore } from "./useTradingState";

export default function MiddleColumn() {
  const activePair = useTradingStore((s) => s.activePair) || "BTC/USDT";

  return (
    <div className="flex flex-col gap-3 h-full w-full">
      {/* Top Controls Row */}
      <div className="flex items-center justify-between px-2 bg-[#080C10]/50 backdrop-blur-md border border-[#141C24] py-2 rounded-md shadow-[0_0_15px_rgba(0,245,255,0.05)]">
        <div className="flex gap-2">
           <button className="px-3 py-1 bg-[rgba(0,245,255,0.1)] border border-[#00F5FF]/30 rounded text-[10px] font-mono text-[#00F5FF] shadow-[0_0_8px_rgba(0,245,255,0.2)]">15m</button>
           <button className="px-3 py-1 bg-[#040608] border border-[#141C24] rounded text-[10px] font-mono text-[#3D5A6E] hover:text-white transition-colors">1h</button>
           <button className="px-3 py-1 bg-[#040608] border border-[#141C24] rounded text-[10px] font-mono text-[#3D5A6E] hover:text-white transition-colors">4h</button>
        </div>
        <div className="font-display text-[11px] text-[#3D5A6E] tracking-widest">
           EXECUTION ENGINE // <span className="text-white font-700">{activePair}</span>
        </div>
      </div>

      {/* Main Trading Stage - 70% Chart / 30% Orderbook */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-[600px]">
        {/* Clean Candlestick Chart */}
        <div className="lg:col-span-3 h-full rounded-lg border border-[#141C24] bg-[#080C10] shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden">
           <div className="relative z-10 h-full p-2">
              <ChartPanel />
           </div>
        </div>

        {/* The new Glass RGB Order Book */}
        <div className="lg:col-span-1 h-full">
           <OrderBook />
        </div>
      </div>
    </div>
  );
}