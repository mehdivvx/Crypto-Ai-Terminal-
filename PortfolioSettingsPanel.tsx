"use client";

import { useState } from "react";
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

  return (
    <div
      className="rounded-[5px] overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0C1118 0%, #080C10 100%)",
        border:     "1px solid #141C24",
        boxShadow:  "inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: "1px solid #141C24" }}
      >
        <Settings2 size={11} className="text-[#3D5A6E]" />
        <span className="font-display text-[9px] font-600 tracking-[0.22em] text-[#3D5A6E] uppercase">
          Portfolio Config
        </span>
        <div className="flex-1" />
        <button
          onClick={handleReset}
          className="text-[#3D5A6E] hover:text-[#7A9BB5] transition-colors duration-150 cursor-pointer"
          title="Reset defaults"
        >
          <RotateCcw size={10} />
        </button>
      </div>

      <div className="px-4 py-3 flex flex-col gap-3">
        {/* Starting Balance */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[9px] tracking-[0.15em] text-[#3D5A6E] uppercase">
            Starting Balance (USDT)
          </label>
          <div className="relative flex items-center">
            <DollarSign size={11} className="absolute left-2.5 text-[#3D5A6E]" />
            <input
              type="number"
              value={localBalance}
              onChange={e => setLocalBalance(e.target.value)}
              min={10}
              step={100}
              className={cn(
                "w-full bg-[#060A0E] border border-[#141C24] rounded-[4px]",
                "pl-7 pr-3 py-2 font-mono text-[12px] text-[#E8F4F8]",
                "outline-none focus:border-[#00F5FF] transition-colors duration-150",
                "placeholder:text-[#3D5A6E]"
              )}
              style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)" }}
              placeholder="1000"
            />
          </div>
          <p className="font-mono text-[8px] text-[#3D5A6E]">
            ⚠ Changing this resets your session
          </p>
        </div>

        {/* Risk Mode toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[9px] tracking-[0.15em] text-[#3D5A6E] uppercase">
            Risk Mode
          </label>
          <div
            className="grid grid-cols-2 rounded-[4px] overflow-hidden p-0.5 gap-0.5"
            style={{ background: "#060A0E", border: "1px solid #141C24" }}
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
                  background: localMode === mode ? "rgba(0,245,255,0.1)" : "transparent",
                  color:      localMode === mode ? "#00F5FF" : "#3D5A6E",
                  border:     localMode === mode ? "1px solid rgba(0,245,255,0.25)" : "1px solid transparent",
                  boxShadow:  localMode === mode ? "0 0 8px rgba(0,245,255,0.1)" : "none",
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
          <label className="font-mono text-[9px] tracking-[0.15em] text-[#3D5A6E] uppercase">
            Risk Per Trade {localMode === "PERCENT" ? "(%)" : "(USDT)"}
          </label>
          <div className="relative flex items-center">
            {localMode === "PERCENT"
              ? <Percent    size={11} className="absolute left-2.5 text-[#3D5A6E]" />
              : <DollarSign size={11} className="absolute left-2.5 text-[#3D5A6E]" />
            }
            <input
              type="number"
              value={localRisk}
              onChange={e => setLocalRisk(e.target.value)}
              min={0.1}
              max={localMode === "PERCENT" ? 100 : undefined}
              step={localMode === "PERCENT" ? 0.5 : 10}
              className={cn(
                "w-full bg-[#060A0E] border border-[#141C24] rounded-[4px]",
                "pl-7 pr-3 py-2 font-mono text-[12px] text-[#E8F4F8]",
                "outline-none focus:border-[#FFD700] transition-colors duration-150"
              )}
              style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)" }}
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
                  "transition-all duration-150 cursor-pointer",
                  localRisk === val
                    ? "bg-[rgba(255,215,0,0.12)] text-[#FFD700] border border-[rgba(255,215,0,0.3)]"
                    : "bg-[#060A0E] text-[#3D5A6E] border border-[#141C24] hover:text-[#7A9BB5] hover:border-[#1A2430]"
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
              ? "linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.1))"
              : "linear-gradient(135deg, rgba(0,245,255,0.12), rgba(0,245,255,0.05))",
            border: saved
              ? "1px solid rgba(0,255,136,0.4)"
              : "1px solid rgba(0,245,255,0.2)",
            color: saved ? "#00FF88" : "#00F5FF",
            boxShadow: saved
              ? "0 0 12px rgba(0,255,136,0.2)"
              : "0 0 6px rgba(0,245,255,0.08)",
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
