"use client";

import { useState } from "react";
import { useTradingStore } from "../useTradingState";
import Sidebar from "../Sidebar";
import MasterHeader from "../MasterHeader";
import OrderBook from "../OrderBook";
import ChartPanel from "../ChartPanel";
import SignalEnginePanel from "../SignalEnginePanel";
import MarketIntelligence from "../MarketIntelligence";
import PortfolioAnalytics from "../PortfolioAnalytics";
import BottomPanel from "../BottomPanel";
import LiquidationMap from "../LiquidationMap";
import TechnicalAnalysisPanel from "../TechnicalAnalysisPanel";

export default function Home() {
  const currentTab = (useTradingStore((s) => s.currentTab) as string) || "TERMINAL";
  const terminalMode = (useTradingStore((s) => s.terminalMode) as string) || "MAIN";
  
  // State hoisted to allow the Header button to open/close the adjacent Sidebar
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    // FIX: Updated background color to use CSS variables and added transition tracking
    <main className="flex h-screen w-screen p-2 bg-[var(--void)] overflow-hidden transition-colors duration-300">
      {/* ── LEFT: Persistent Navigation & Interface Theme Control ── */}
      <Sidebar isExpanded={isSidebarExpanded} setIsExpanded={setIsSidebarExpanded} />

      {/* ── RIGHT: Dashboard Workspace Content Arena ── */}
      <div className="flex-1 flex flex-col gap-2 min-w-0 h-full overflow-hidden">
        <MasterHeader isSidebarExpanded={isSidebarExpanded} setIsSidebarExpanded={setIsSidebarExpanded} />

        <div className="flex-1 overflow-y-auto custom-scrollbar relative pr-1">
          
          {/* ── 1. TERMINAL VIEW (MAIN MODE) ── */}
          {currentTab === "TERMINAL" && terminalMode === "MAIN" && (
            <div className="grid grid-cols-[280px_1fr_320px] gap-2 h-[888px] mb-4">
              
              {/* LEFT: Order Book */}
              <div className="h-full min-h-0">
                <OrderBook />
              </div>

              {/* CENTER: Unified Viewport Stack */}
              <div className="flex flex-col gap-2 h-full min-w-0">
                
                {/* TOP: Chart & Signals Engine */}
                <div className="flex gap-2 h-[600px] shrink-0">
                  <div className="flex-1 h-full min-w-0">
                    <ChartPanel />
                  </div>
                  <div className="w-[300px] shrink-0 h-full">
                    <SignalEnginePanel />
                  </div>
                </div>

                {/* BOTTOM: Performance Tracking Matrices */}
                <div className="h-[280px] shrink-0 w-full">
                  <BottomPanel />
                </div>
                
              </div>

              {/* RIGHT: Market Intelligence Data Node */}
              <div className="h-full min-h-0">
                <MarketIntelligence />
              </div>
              
            </div>
          )}

          {/* ── 1.5 TERMINAL VIEW (TECHNICAL MODE) ── */}
          {currentTab === "TERMINAL" && terminalMode === "TECHNICAL" && (
            <div className="flex gap-2 h-full w-full min-h-[600px]">
              <div className="flex-1 h-full min-w-0">
                <ChartPanel />
              </div>
              <div className="flex-1 h-full min-w-0">
                <TechnicalAnalysisPanel />
              </div>
            </div>
          )}

          {/* ── 2. PORTFOLIO ANALYTICS VIEW ── */}
          {currentTab === "PORTFOLIO" && (
            <div className="w-full h-full">
              <PortfolioAnalytics />
            </div>
          )}

          {/* ── 3. LIQUIDATION RISK HEATMAP VIEW ── */}
          {currentTab === "HEATMAP" && (
            <div className="w-full h-full">
              <LiquidationMap />
            </div>
          )}

        </div>
      </div>
    </main>
  );
}