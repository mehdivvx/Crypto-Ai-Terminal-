"use client";

import { useTradingStore } from "../useTradingState";
import MasterHeader from "../MasterHeader";
import OrderBook from "../OrderBook";
import ChartPanel from "../ChartPanel";
import SignalEnginePanel from "../SignalEnginePanel";
import MarketIntelligence from "../MarketIntelligence";
import PortfolioAnalytics from "../PortfolioAnalytics";
import BottomPanel from '../BottomPanel';
import LiquidationMap from '../LiquidationMap';
import TechnicalAnalysisPanel from "../TechnicalAnalysisPanel";

export default function Home() {
  const currentTab = (useTradingStore((s) => s.currentTab) as string) || "TERMINAL";
  const terminalMode = (useTradingStore((s) => s.terminalMode) as string) || "MAIN";

  return (
    <main className="flex flex-col h-screen p-2 gap-2 bg-[#020305] overflow-hidden">
      <MasterHeader />

      <div className="flex-1 overflow-y-auto custom-scrollbar relative pr-1">
        
        {/* ── 1. TERMINAL VIEW (MAIN MODE) ── */}
        {currentTab === "TERMINAL" && terminalMode === "MAIN" && (
          // FIX: Hard-locked height to exactly 888px (600px chart + 8px gap + 280px bottom panel)
          // This guarantees OrderBook and MarketIntelligence end at the EXACT same pixel.
          <div className="grid grid-cols-[280px_1fr_320px] gap-2 h-[888px] mb-4">
            
            {/* LEFT: Order Book */}
            <div className="h-full min-h-0">
              <OrderBook />
            </div>

            {/* CENTER: Unified Flex Column */}
            <div className="flex flex-col gap-2 h-full min-w-0">
              
              {/* TOP: Chart & Signal Engine side-by-side */}
              <div className="flex gap-2 h-[600px] shrink-0">
                <div className="flex-1 h-full min-w-0">
                  <ChartPanel />
                </div>
                <div className="w-[300px] shrink-0 h-full">
                  <SignalEnginePanel />
                </div>
              </div>

              {/* BOTTOM: Expanded for Clocks and Metrics */}
              <div className="h-[280px] shrink-0 w-full">
                <BottomPanel />
              </div>
              
            </div>

            {/* RIGHT: Market Intelligence */}
            <div className="h-full min-h-0">
              <MarketIntelligence />
            </div>
            
          </div>
        )}

        {/* ── 1.5 TERMINAL VIEW (TECHNICAL MODE) ── */}
        {currentTab === "TERMINAL" && terminalMode === "TECHNICAL" && (
          <div className="flex gap-2 h-full w-full min-h-[600px]">
            
            {/* LEFT: Chart Panel takes EXACTLY 50% of the screen */}
            <div className="flex-1 h-full min-w-0">
              <ChartPanel />
            </div>

            {/* RIGHT: Technical Panel takes EXACTLY 50% of the screen */}
            <div className="flex-1 h-full min-w-0">
              <TechnicalAnalysisPanel />
            </div>
            
          </div>
        )}

        {/* ── 2. PORTFOLIO VIEW ── */}
        {currentTab === "PORTFOLIO" && (
          <div className="w-full h-full">
            <PortfolioAnalytics />
          </div>
        )}

        {/* ── 3. HEATMAP VIEW ── */}
        {currentTab === "HEATMAP" && (
          <div className="w-full h-full">
            <LiquidationMap />
          </div>
        )}

      </div>
    </main>
  );
}