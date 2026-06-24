"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTradingStore, LIVE_PRICES } from "./useTradingState";
import { Maximize, Minimize, Eye, EyeOff } from "lucide-react";

export default function ChartPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const activePair = useTradingStore(s => s.activePair) || "BTC/USDT";
  const timeframe = useTradingStore(s => s.timeframe) || "15m";
  const candles = useTradingStore(s => s.candles) || [];
  const signals = useTradingStore(s => s.signals) || [];
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSignalLevels, setShowSignalLevels] = useState(true);

  const currentSignal = signals.find(s => s.symbol === activePair && s.status === 'ACTIVE');

  // --- TRADINGVIEW ENGINE ---
  const scrollXRef = useRef(0);
  const scrollYRef = useRef(0);
  const zoomRef = useRef(1);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const hoverPos = useRef<{ x: number, y: number } | null>(null);
  const showSignalsRef = useRef(true); 

  const toggleSignals = () => {
    const newState = !showSignalLevels;
    setShowSignalLevels(newState);
    showSignalsRef.current = newState;
    requestAnimationFrame(draw);
  };

  const initializedPair = useRef("");
  useEffect(() => {
    if (initializedPair.current !== activePair) {
      scrollXRef.current = 0;
      scrollYRef.current = 0;
      zoomRef.current = 1;
      initializedPair.current = activePair;
    }
  }, [activePair]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

    // Detect Theme dynamically for Canvas API
    const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
    const textColor = isLightMode ? '#0F172A' : '#ffffff';
    const gridColor = isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
    const tooltipBg = isLightMode ? '#ffffff' : '#0a0c10';
    const tooltipBorder = isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

    const dpr = window.devicePixelRatio || 1;
    const W = container.clientWidth;
    const H = container.clientHeight;
    
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const pad = { t: 30, b: 50, l: 10, r: 80 };
    const chartW = W - pad.l - pad.r;
    const chartH = H - pad.t - pad.b;

    const baseCW = 8;
    const cW = baseCW * zoomRef.current;
    const maxIndex = candles.length - 1;

    const getX = (i: number) => pad.l + chartW - (maxIndex - i) * cW + scrollXRef.current;

    const visibleCandles: typeof candles = [];
    for (let i = 0; i < candles.length; i++) {
      const cx = getX(i);
      if (cx > pad.l - cW && cx < W - pad.r + cW) {
        visibleCandles.push(candles[i]);
      }
    }

    if (visibleCandles.length === 0) visibleCandles.push(candles[candles.length - 1]);

    let mxH = Math.max(...visibleCandles.map(c => c.h));
    let mnL = Math.min(...visibleCandles.map(c => c.l));
    const rng = (mxH - mnL) || 1;
    
    const paddedMnL = mnL - rng * 0.1;
    const paddedMxH = mxH + rng * 0.1;
    const paddedRng = paddedMxH - paddedMnL;

    const sy = (v: number) => pad.t + (1 - (v - paddedMnL) / paddedRng) * chartH + scrollYRef.current;
    const getPriceAtY = (y: number) => paddedMnL + paddedRng * (1 - (y - pad.t - scrollYRef.current) / chartH);

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + chartH * i / 5;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      const pv = getPriceAtY(y);
      ctx.fillStyle = isLightMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)'; 
      ctx.font = '10px "JetBrains Mono"'; 
      ctx.textAlign = 'left';
      ctx.fillText(pv.toFixed(activePair?.includes("BTC") ? 1 : 4), W - pad.r + 8, y + 4);
    }

    const mxV = Math.max(...visibleCandles.map(c => c.v), 1);
    const maxVolHeight = chartH * 0.25; 
    
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const x = getX(i);
      if (x < pad.l - cW || x > W - pad.r) continue;

      const vH = (c.v / mxV) * maxVolHeight;
      // Use crisp colors for Light Mode volume bars
      ctx.fillStyle = isLightMode 
        ? (c.c >= c.o ? 'rgba(5, 150, 105, 0.4)' : 'rgba(225, 29, 72, 0.4)')
        : (c.c >= c.o ? 'rgba(0,255,157,0.35)' : 'rgba(255,42,109,0.35)');
      ctx.fillRect(x - cW * 0.4, H - pad.b - vH, cW * 0.8, vH);
    }

    if (showSignalsRef.current && currentSignal) {
      const targetLevels = [
        { label: 'ENTRY', price: currentSignal.entryPrice, color: isLightMode ? '#0284c7' : 'rgba(0, 212, 255, 0.85)' },
        { label: 'STOP', price: currentSignal.sl, color: isLightMode ? '#e11d48' : 'rgba(255, 42, 109, 0.85)' },
        { label: 'TP 1', price: currentSignal.tp1, color: isLightMode ? '#059669' : 'rgba(0, 255, 157, 0.85)' },
        { label: 'TP 2', price: currentSignal.tp2, color: isLightMode ? '#059669' : 'rgba(0, 255, 157, 0.85)' },
        { label: 'TP 3', price: currentSignal.tp3, color: isLightMode ? '#059669' : 'rgba(0, 255, 157, 0.85)' },
      ];

      targetLevels.forEach(lvl => {
        if (!lvl.price) return;
        const zy = sy(lvl.price);
        
        if (zy > pad.t && zy < H - pad.b) {
          ctx.strokeStyle = lvl.color; 
          ctx.lineWidth = 1.2; 
          ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(pad.l, zy); ctx.lineTo(W - pad.r, zy); ctx.stroke();
          ctx.setLineDash([]);
          
          ctx.fillStyle = tooltipBg;
          ctx.fillRect(pad.l, zy - 10, 42, 20);

          ctx.fillStyle = lvl.color; 
          ctx.font = 'bold 9px "JetBrains Mono"'; 
          ctx.textAlign = 'left';
          ctx.fillText(lvl.label, pad.l + 6, zy + 3);
        }
      });
    }

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const x = getX(i);
      if (x < pad.l - cW || x > W - pad.r) continue;

      const bull = c.c >= c.o;
      
      // FIX: Solid crisp tailwind colors for Light Mode instead of neon blurs
      let col = bull ? '#00ff9d' : '#ff2a6d';
      let fillCol = bull ? 'rgba(0,255,157,0.9)' : 'rgba(255,42,109,0.9)';
      
      if (isLightMode) {
        col = bull ? '#059669' : '#e11d48';
        fillCol = col;
      }

      const oY = sy(c.o), clY = sy(c.c), hiY = sy(c.h), loY = sy(c.l);
      const top = Math.min(oY, clY), bh = Math.max(1.5, Math.abs(clY - oY));

      ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, hiY); ctx.lineTo(x, loY); ctx.stroke();
      
      // FIX: Strip shadowBlur entirely in Light Mode to remove fuzziness
      ctx.shadowBlur = isLightMode ? 0 : 6; 
      ctx.shadowColor = col;
      ctx.fillStyle = fillCol;
      ctx.fillRect(x - cW * 0.4, top, cW * 0.8, bh);
      ctx.shadowBlur = 0;
    }

    if (hoverPos.current) {
      const { x, y } = hoverPos.current;
      
      if (x >= pad.l && x <= W - pad.r && y >= pad.t && y <= H - pad.b) {
        ctx.strokeStyle = isLightMode ? 'rgba(0,0,0,0.2)' : 'rgba(255, 255, 255, 0.15)'; 
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]); 

        ctx.beginPath();
        ctx.moveTo(x, pad.t);
        ctx.lineTo(x, H - pad.b);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(W - pad.r, y);
        ctx.stroke();
        
        ctx.setLineDash([]); 

        const crossPrice = getPriceAtY(y);
        ctx.fillStyle = tooltipBg; 
        ctx.fillRect(W - pad.r, y - 10, pad.r, 20);
        ctx.strokeStyle = tooltipBorder;
        ctx.strokeRect(W - pad.r, y - 10, pad.r, 20);
        
        ctx.fillStyle = textColor;
        ctx.font = '10px "JetBrains Mono"';
        ctx.fillText(crossPrice.toFixed(activePair?.includes("BTC") ? 1 : 4), W - pad.r + 8, y + 4);
      }
    }

    const p = LIVE_PRICES[activePair || "BTC/USDT"];
    if (p) {
      const py = sy(p);
      if (py >= pad.t && py <= H - pad.b) {
        const currentCandle = candles[candles.length - 1];
        const isLiveBullish = currentCandle ? p >= currentCandle.o : true;
        
        const liveLineColor = isLiveBullish ? 'rgba(0, 255, 157, 0.6)' : 'rgba(255, 42, 109, 0.6)';
        const liveBgColor = isLiveBullish ? 'rgba(0, 255, 157, 0.15)' : 'rgba(255, 42, 109, 0.15)';
        const liveTextColor = isLiveBullish ? '#059669' : '#e11d48';

        ctx.strokeStyle = isLightMode ? liveTextColor : liveLineColor; 
        ctx.lineWidth = 1; 
        ctx.setLineDash([4, 4]); 
        ctx.beginPath(); ctx.moveTo(pad.l, py); ctx.lineTo(W - pad.r, py); ctx.stroke();
        ctx.setLineDash([]);
        
        // FIX: Added '1m' into the countdown math
        let ms = 15 * 60000;
        if (timeframe === "1m") ms = 60000;
        else if (timeframe === "5m") ms = 5 * 60000;
        else if (timeframe === "30m") ms = 30 * 60000;
        else if (timeframe === "1h") ms = 60 * 60000;
        else if (timeframe === "4h") ms = 240 * 60000;

        const rem = ms - (Date.now() % ms);
        const h = Math.floor(rem / 3600000);
        const m = Math.floor((rem % 3600000) / 60000);
        const s = Math.floor((rem % 60000) / 1000);
        const timerStr = `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        ctx.fillStyle = isLightMode ? (isLiveBullish ? 'rgba(5,150,105,0.1)' : 'rgba(225,29,72,0.1)') : liveBgColor; 
        ctx.fillRect(W - pad.r + 2, py - 14, pad.r - 4, 28);
        
        ctx.fillStyle = isLightMode ? liveTextColor : (isLiveBullish ? '#00ff9d' : '#ff2a6d'); 
        ctx.font = 'bold 11px "JetBrains Mono"'; 
        ctx.textAlign = 'left';
        ctx.fillText(p.toFixed(activePair?.includes("BTC") ? 1 : 4), W - pad.r + 8, py - 1);
        
        ctx.font = '10px "JetBrains Mono"';
        ctx.fillText(timerStr, W - pad.r + 8, py + 10);
      }
    }
  }, [candles, activePair, timeframe, isFullscreen, currentSignal]);

  useEffect(() => {
    const observer = new MutationObserver(() => requestAnimationFrame(draw));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    if (containerRef.current) requestAnimationFrame(draw);
    const ro = new ResizeObserver(() => requestAnimationFrame(draw));
    if (containerRef.current) ro.observe(containerRef.current);
    
    const interval = setInterval(() => requestAnimationFrame(draw), 50);
    return () => {
      ro.disconnect();
      clearInterval(interval);
      observer.disconnect();
    };
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.97 : 1.03; 
      zoomRef.current = Math.max(0.1, Math.min(zoomRef.current * zoomFactor, 10));
      requestAnimationFrame(draw);
    };

    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        hoverPos.current = { x, y };
      } else {
        hoverPos.current = null;
      }

      if (isDragging.current) {
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        scrollXRef.current += dx; 
        scrollYRef.current += dy;
      }
      
      lastMouse.current = { x: e.clientX, y: e.clientY };
      requestAnimationFrame(draw);
    };

    const onMouseUp = () => isDragging.current = false;
    const onMouseLeave = () => { hoverPos.current = null; requestAnimationFrame(draw); };
    const onDoubleClick = () => { scrollXRef.current = 0; scrollYRef.current = 0; zoomRef.current = 1; requestAnimationFrame(draw); };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("dblclick", onDoubleClick);

    return () => {
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("dblclick", onDoubleClick);
    };
  }, [draw]);

  return (
    <div className={isFullscreen ? "fixed inset-0 z-[9999] p-4 bg-black/90 backdrop-blur-md flex items-center justify-center" : "w-full h-full relative"}>
      <div 
        ref={containerRef} 
        className="w-full h-full relative rounded-[16px] bg-[var(--panel)] border border-[var(--border)] shadow-md overflow-hidden transition-colors duration-300"
      >
        <div className="absolute top-4 right-[90px] z-50 flex items-center gap-2">
          <button 
            onClick={toggleSignals}
            className={`flex items-center gap-2 px-3 py-1.5 backdrop-blur-md border rounded-[6px] font-mono text-[10px] font-bold tracking-[1px] transition-all shadow-md ${showSignalLevels ? 'bg-[var(--neon-cyan)]/10 border-[var(--neon-cyan)]/40 text-[var(--neon-cyan)] shadow-[0_0_10px_rgba(0,212,255,0.2)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            {showSignalLevels ? <Eye size={12} /> : <EyeOff size={12} />}
            {showSignalLevels ? "SIGNAL TARGETS" : "TARGETS HIDDEN"}
          </button>

          <button 
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              scrollXRef.current = 0;
              scrollYRef.current = 0;
              zoomRef.current = 1;
              setTimeout(() => requestAnimationFrame(draw), 50);
            }}
            className="p-1.5 bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] hover:border-[var(--neon-cyan)]/50 rounded-[6px] text-[var(--text-secondary)] hover:text-[var(--neon-cyan)] transition-all shadow-md"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>

        <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-screen" style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
        
        <canvas ref={canvasRef} className="w-full h-full absolute inset-0 z-10 cursor-crosshair active:cursor-grabbing" />
      </div>
    </div>
  );
}