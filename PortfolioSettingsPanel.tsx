"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings2, DollarSign, Percent, Save, RotateCcw } from "lucide-react";
import { useTradingStore } from "@/hooks/useTradingState";
import { cn } from "@/lib/utils";

export default function PortfolioSettingsPanel() {
  const settings       = useTradingStore(s => s.settings);
  const updateSettings = useTradingStore(s => s.updateSettings);

  const [localBalance, setLocalBalance] = useState(String(settings.startingBalance));
  const [localRisk,    setLocalRisk]    = useState(String(settings.riskValue));
  const [localMode,    setLocalMode]    = useState(settings.riskMode);
  const [saved,        setSaved]        = useState(false);

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

  const handleSave = () => {
    const bal  = parseFloat(localBalance);
    const risk = parseFloat(localRisk);
    if (isNaN(bal) || bal < 10)   return;
    if (isNaN(risk) || risk <= 0) return;
    updateSettings({ startingBalance: bal, riskValue: risk, riskMode: localMode });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setLocalBalance("1000");
    setLocalRisk("2");
    setLocalMode("PERCENT");
    updateSettings({ startingBalance: 1000, riskValue: 2, riskMode: "PERCENT" });
  };

  // Theme constants
  const txtMuted = isLight ? "text-slate-500" : "text-[#3D5A6E]";

  return (
    <div
      className="rounded-[5px] overflow-hidden transition-all duration-300"
      style={{
        background: isLight ? "linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)" : "linear-gradient(160deg, #0C1118 0%, #080C10 100%)",
        border:     isLight ? "1px solid #e2e8f0" : "1px solid #141C24",
        boxShadow:  isLight ? "0 1px 3px rgba(0,0,0,0.05)" : "inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 transition-colors"
        style={{ borderBottom: isLight ? "1px solid #e2e8f0" : "1px solid #141C24" }}
      >
        <Settings2 size={11} className={txtMuted} />
        <span className={`font-display text-[9px] font-600 tracking-[0.22em] uppercase ${txtMuted}`}>
          Portfolio Config
        </span>
        <div className="flex-1" />
        <button
          onClick={handleReset}
          className={`${txtMuted} ${isLight ? 'hover:text-slate-800' : 'hover:text-[#7A9BB5]'} transition-colors duration-150 cursor-pointer`}
          title="Reset defaults"
        >
          <RotateCcw size={10} />
        </button>
      </div>

      <div className="px-4 py-3 flex flex-col gap-3">
        {/* Starting Balance */}
        <div className="flex flex-col gap-1.5">
          <label className={`font-mono text-[9px] tracking-[0.15em] uppercase ${txtMuted}`}>
            Starting Balance (USDT)
          </label>
          <div className="relative flex items-center">
            <DollarSign size={11} className={`absolute left-2.5 ${txtMuted}`} />
            <input
              type="number"
              value={localBalance}
              onChange={e => setLocalBalance(e.target.value)}
              min={10}
              step={100}
              className={cn(
                "w-full rounded-[4px] pl-7 pr-3 py-2 font-mono text-[12px] outline-none transition-colors duration-150",
                isLight 
                  ? "bg-white border border-slate-300 text-slate-800 focus:border-cyan-500 placeholder:text-slate-400"
                  : "bg-[#060A0E] border border-[#141C24] text-[#E8F4F8] focus:border-[#00F5FF] placeholder:text-[#3D5A6E]"
              )}
              style={{ boxShadow: isLight ? "inset 0 1px 2px rgba(0,0,0,0.05)" : "inset 0 2px 4px rgba(0,0,0,0.3)" }}
              placeholder="1000"
            />
          </div>
          <p className={`font-mono text-[8px] ${txtMuted}`}>
            ⚠ Changing this resets your session
          </p>
        </div>

        {/* Risk Mode toggle */}
        <div className="flex flex-col gap-1.5">
          <label className={`font-mono text-[9px] tracking-[0.15em] uppercase ${txtMuted}`}>
            Risk Mode
          </label>
          <div
            className="grid grid-cols-2 rounded-[4px] overflow-hidden p-0.5 gap-0.5 transition-colors"
            style={{ 
              background: isLight ? "#f1f5f9" : "#060A0E", 
              border: isLight ? "1px solid #e2e8f0" : "1px solid #141C24" 
            }}
          >
            {(["PERCENT", "FLAT"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setLocalMode(mode)}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 rounded-[3px]",
                  "font-display text-[9px] font-600 tracking-[0.12em] uppercase",
                  "transition-all duration-200 cursor-pointer"
                )}
                style={{
                  background: localMode === mode 
                    ? (isLight ? "#ecfeff" : "rgba(0,245,255,0.1)") 
                    : "transparent",
                  color: localMode === mode 
                    ? (isLight ? "#0891b2" : "#00F5FF") 
                    : (isLight ? "#64748b" : "#3D5A6E"),
                  border: localMode === mode 
                    ? (isLight ? "1px solid #a5f3fc" : "1px solid rgba(0,245,255,0.25)") 
                    : "1px solid transparent",
                  boxShadow: localMode === mode 
                    ? (isLight ? "0 1px 2px rgba(0,0,0,0.05)" : "0 0 8px rgba(0,245,255,0.1)") 
                    : "none",
                }}
              >
                {mode === "PERCENT"
                  ? <><Percent size={9} /> % of Balance</>
                  : <><DollarSign size={9} /> Flat USDT</>
                }
              </button>
            ))}
          </div>
        </div>

        {/* Risk Value */}
        <div className="flex flex-col gap-1.5">
          <label className={`font-mono text-[9px] tracking-[0.15em] uppercase ${txtMuted}`}>
            Risk Per Trade {localMode === "PERCENT" ? "(%)" : "(USDT)"}
          </label>
          <div className="relative flex items-center">
            {localMode === "PERCENT"
              ? <Percent    size={11} className={`absolute left-2.5 ${txtMuted}`} />
              : <DollarSign size={11} className={`absolute left-2.5 ${txtMuted}`} />
            }
            <input
              type="number"
              value={localRisk}
              onChange={e => setLocalRisk(e.target.value)}
              min={0.1}
              max={localMode === "PERCENT" ? 100 : undefined}
              step={localMode === "PERCENT" ? 0.5 : 10}
              className={cn(
                "w-full rounded-[4px] pl-7 pr-3 py-2 font-mono text-[12px] outline-none transition-colors duration-150",
                isLight 
                  ? "bg-white border border-slate-300 text-slate-800 focus:border-amber-400 placeholder:text-slate-400"
                  : "bg-[#060A0E] border border-[#141C24] text-[#E8F4F8] focus:border-[#FFD700] placeholder:text-[#3D5A6E]"
              )}
              style={{ boxShadow: isLight ? "inset 0 1px 2px rgba(0,0,0,0.05)" : "inset 0 2px 4px rgba(0,0,0,0.3)" }}
              placeholder={localMode === "PERCENT" ? "2" : "20"}
            />
          </div>

          {/* Risk presets */}
          <div className="flex gap-1.5">
            {(localMode === "PERCENT"
              ? [["1%","1"],["2%","2"],["5%","5"],["10%","10"]]
              : [["$10","10"],["$25","25"],["$50","50"],["$100","100"]]
            ).map(([label, val]) => (
              <button
                key={val}
                onClick={() => setLocalRisk(val)}
                className={cn(
                  "flex-1 py-1 rounded-[3px] font-mono text-[8px] tracking-wider",
                  "transition-all duration-150 cursor-pointer border",
                  localRisk === val
                    ? (isLight ? "bg-amber-50 text-amber-600 border-amber-300" : "bg-[rgba(255,215,0,0.12)] text-[#FFD700] border-[rgba(255,215,0,0.3)]")
                    : (isLight ? "bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:border-slate-300" : "bg-[#060A0E] text-[#3D5A6E] border-[#141C24] hover:text-[#7A9BB5] hover:border-[#1A2430]")
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <motion.button
          onClick={handleSave}
          whileTap={{ scale: 0.97 }}
          className="relative overflow-hidden flex items-center justify-center gap-2 w-full py-2.5 rounded-[4px] font-display text-[10px] font-700 tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer"
          style={{
            background: saved
              ? (isLight ? "linear-gradient(135deg, #d1fae5, #ecfdf5)" : "linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.1))")
              : (isLight ? "linear-gradient(135deg, #ecfeff, #f8fafc)" : "linear-gradient(135deg, rgba(0,245,255,0.12), rgba(0,245,255,0.05))"),
            border: saved
              ? (isLight ? "1px solid #6ee7b7" : "1px solid rgba(0,255,136,0.4)")
              : (isLight ? "1px solid #67e8f9" : "1px solid rgba(0,245,255,0.2)"),
            color: saved 
              ? (isLight ? "#059669" : "#00FF88") 
              : (isLight ? "#0891b2" : "#00F5FF"),
            boxShadow: saved
              ? (isLight ? "0 1px 2px rgba(16,185,129,0.1)" : "0 0 12px rgba(0,255,136,0.2)")
              : (isLight ? "0 1px 2px rgba(8,145,178,0.1)" : "0 0 6px rgba(0,245,255,0.08)"),
          }}
        >
          {saved ? (
            <><motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.span> SAVED</>
          ) : (
            <><Save size={11} /> APPLY SETTINGS</>
          )}
        </motion.button>
      </div>
    </div>
  );
}