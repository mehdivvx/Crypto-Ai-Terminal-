"use client";

import { useState, useEffect } from "react";
import { useTradingStore } from "./useTradingState";
import { motion, AnimatePresence } from "framer-motion";
import { TerminalSquare, PieChart, Flame, Moon, Sun, ChevronRight, ChevronLeft } from "lucide-react";

export interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;
}

export default function Sidebar({ isExpanded, setIsExpanded }: SidebarProps) {
  const currentTab = useTradingStore((s) => s.currentTab) as any;
  const setTab = useTradingStore((s) => s.setTab) as (tab: any) => void;
  
  // Direct simple toggle state: false = dark, true = light
  const [isLightMode, setIsLightMode] = useState(false);

  // Directly sets the HTML attribute that global.css listens to
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isLightMode ? 'light' : 'dark');
  }, [isLightMode]);

  const navItems = [
    { id: "TERMINAL", label: "Terminal", icon: TerminalSquare },
    { id: "PORTFOLIO", label: "Portfolio", icon: PieChart },
    { id: "HEATMAP", label: "Heatmap", icon: Flame }
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ 
        width: isExpanded ? 240 : 0,
        opacity: isExpanded ? 1 : 0,
        marginRight: isExpanded ? 8 : 0
      }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="h-full flex flex-col justify-between items-center bg-[var(--panel)] border border-white/5 rounded-[12px] py-4 select-none flex-shrink-0 relative z-50 shadow-[5px_0_25px_rgba(0,0,0,0.5)] overflow-hidden"
    >
      {/* Navigation Links */}
      <div className="flex flex-col items-center w-full gap-8 px-2">
        <nav className="flex flex-col items-start w-full gap-2 mt-4">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  setIsExpanded(false);
                }}
                className="relative w-full h-12 flex items-center px-4 rounded-xl group transition-all duration-300 outline-none"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarTab"
                    className="absolute inset-0 bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 rounded-xl shadow-[inset_0_0_15px_rgba(0,212,255,0.15)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="flex items-center gap-4 relative z-10 w-full">
                  <item.icon 
                    size={20} 
                    className={`shrink-0 ${isActive ? item.id === "HEATMAP" ? "text-[var(--neon-orange)]" : "text-[var(--neon-cyan)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"}`} 
                  />
                  <span className={`font-display text-[12px] font-bold tracking-[2px] uppercase whitespace-nowrap ${isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"}`}>
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Direct Light/Dark Mode Switcher */}
      <div className={`relative flex flex-col items-center w-full px-4 mb-4 ${isExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <button
          onClick={() => setIsLightMode(!isLightMode)}
          className="w-full h-12 flex items-center justify-center gap-3 rounded-xl transition-all duration-300 border bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--neon-cyan)]/50"
        >
          {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
          <span className="font-mono text-[10px] font-bold tracking-[1.5px] uppercase whitespace-nowrap">
            {isLightMode ? "SWITCH TO DARK" : "SWITCH TO LIGHT"}
          </span>
        </button>
      </div>
    </motion.aside>
  );
}