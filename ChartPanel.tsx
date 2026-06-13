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

  // --- TRADINGVIEW ENGINE (High Performance Refs) ---
  const scrollXRef = useRef(0);
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
      zoomRef.current = 1;
      initializedPair.current = activePair;
    }
  }, [activePair]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

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

    const sy = (v: number) => pad.t + (1 - (v - paddedMnL) / paddedRng) * chartH;
    const getPriceAtY = (y: number) => paddedMnL + paddedRng * (1 - (y - pad.t) / chartH);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + chartH * i / 5;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      const pv = getPriceAtY(y);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px "JetBrains Mono"'; ctx.textAlign = 'left';
      ctx.fillText(pv.toFixed(activePair?.includes("BTC") ? 1 : 4), W - pad.r + 8, y + 4);
    }

    const mxV = Math.max(...visibleCandles.map(c => c.v), 1);
    const maxVolHeight = chartH * 0.25; 
    
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const x = getX(i);
      if (x < pad.l - cW || x > W - pad.r) continue;

      const vH = (c.v / mxV) * maxVolHeight;
      ctx.fillStyle = c.c >= c.o ? 'rgba(0,255,157,0.35)' : 'rgba(255,42,109,0.35)';
      ctx.fillRect(x - cW * 0.4, H - pad.b - vH, cW * 0.8, vH);
    }

    if (showSignalsRef.current && currentSignal) {
      const targetLevels = [
        { label: 'ENTRY', price: currentSignal.entryPrice, color: 'rgba(0, 212, 255, 0.65)' },
        { label: 'STOP', price: currentSignal.sl, color: 'rgba(255, 42, 109, 0.65)' },
        { label: 'TP 1', price: currentSignal.tp1, color: 'rgba(0, 255, 157, 0.65)' },
        { label: 'TP 2', price: currentSignal.tp2, color: 'rgba(0, 255, 157, 0.65)' },
        { label: 'TP 3', price: currentSignal.tp3, color: 'rgba(0, 255, 157, 0.65)' },
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
          
          ctx.fillStyle = 'rgba(0,0,0,0.85)';
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
      const col = bull ? '#00ff9d' : '#ff2a6d';
      const oY = sy(c.o), clY = sy(c.c), hiY = sy(c.h), loY = sy(c.l);
      const top = Math.min(oY, clY), bh = Math.max(1.5, Math.abs(clY - oY));

      ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, hiY); ctx.lineTo(x, loY); ctx.stroke();
      
      ctx.shadowBlur = 6; ctx.shadowColor = col;
      ctx.fillStyle = bull ? 'rgba(0,255,157,0.9)' : 'rgba(255,42,109,0.9)';
      ctx.fillRect(x - cW * 0.4, top, cW * 0.8, bh);
      ctx.shadowBlur = 0;
    }

    if (hoverPos.current) {
      const { x, y } = hoverPos.current;
      
      if (x >= pad.l && x <= W - pad.r && y >= pad.t && y <= H - pad.b) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; 
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
        ctx.fillStyle = '#0a0c10'; 
        ctx.fillRect(W - pad.r, y - 10, pad.r, 20);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.strokeRect(W - pad.r, y - 10, pad.r, 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "JetBrains Mono"';
        ctx.fillText(crossPrice.toFixed(activePair?.includes("BTC") ? 1 : 4), W - pad.r + 8, y + 4);
      }
    }

    // ─── UPGRADED DYNAMIC LIVE PRICE & CANDLE COUNTDOWN ───
    const p = LIVE_PRICES[activePair || "BTC/USDT"];
    if (p && p >= paddedMnL && p <= paddedMxH) {
      const py = sy(p);
      
      // Determine color based on current candle direction
      const currentCandle = candles[candles.length - 1];
      const isLiveBullish = currentCandle ? p >= currentCandle.o : true;
      
      const liveLineColor = isLiveBullish ? 'rgba(0, 255, 157, 0.4)' : 'rgba(255, 42, 109, 0.4)';
      const liveBgColor = isLiveBullish ? 'rgba(0, 255, 157, 0.15)' : 'rgba(255, 42, 109, 0.15)';
      const liveTextColor = isLiveBullish ? '#00ff9d' : '#ff2a6d';

      // Draw lighter, wider-spaced dashed line
      ctx.strokeStyle = liveLineColor; 
      ctx.lineWidth = 1; 
      ctx.setLineDash([4, 4]); 
      ctx.beginPath(); ctx.moveTo(pad.l, py); ctx.lineTo(W - pad.r, py); ctx.stroke();
      ctx.setLineDash([]);
      
      let ms = 15 * 60000;
      if (timeframe === "5m") ms = 5 * 60000;
      else if (timeframe === "30m") ms = 30 * 60000;
      else if (timeframe === "1h") ms = 60 * 60000;
      else if (timeframe === "4h") ms = 240 * 60000;

      const rem = ms - (Date.now() % ms);
      const h = Math.floor(rem / 3600000);
      const m = Math.floor((rem % 3600000) / 60000);
      const s = Math.floor((rem % 60000) / 1000);
      const timerStr = `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

      // Live Tag Background
      ctx.fillStyle = liveBgColor; 
      ctx.fillRect(W - pad.r + 2, py - 14, pad.r - 4, 28);
      
      // Live Price Label
      ctx.fillStyle = liveTextColor; 
      ctx.font = 'bold 11px "JetBrains Mono"'; 
      ctx.textAlign = 'left';
      ctx.fillText(p.toFixed(activePair?.includes("BTC") ? 1 : 4), W - pad.r + 8, py - 1);
      
      // Countdown Timer Label
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillText(timerStr, W - pad.r + 8, py + 10);
    }
  }, [candles, activePair, timeframe, isFullscreen, currentSignal]);

  useEffect(() => {
    if (containerRef.current) requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => requestAnimationFrame(draw));
    if (containerRef.current) ro.observe(containerRef.current);
    
    const interval = setInterval(() => requestAnimationFrame(draw), 50);
    return () => {
      ro.disconnect();
      clearInterval(interval);
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
        scrollXRef.current += dx; 
      }
      
      lastMouse.current = { x: e.clientX, y: e.clientY };
      requestAnimationFrame(draw);
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onMouseLeave = () => {
      hoverPos.current = null;
      requestAnimationFrame(draw);
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [draw]);

  return (
    <div className={isFullscreen ? "fixed inset-0 z-[9999] p-4 bg-black/90 backdrop-blur-md flex items-center justify-center" : "w-full h-full relative"}>
      <div 
        ref={containerRef} 
        className="w-full h-full relative rounded-[16px] bg-[#040608] border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,1)] overflow-hidden"
      >
        <div className="absolute top-4 right-[90px] z-50 flex items-center gap-2">
          <button 
            onClick={toggleSignals}
            className={`flex items-center gap-2 px-3 py-1.5 backdrop-blur-md border rounded-[6px] font-mono text-[10px] font-bold tracking-[1px] transition-all shadow-md ${showSignalLevels ? 'bg-[#00d4ff]/10 border-[#00d4ff]/40 text-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.2)]' : 'bg-[#0a0c10]/80 border-white/10 text-[#8b99ae] hover:text-white'}`}
          >
            {showSignalLevels ? <Eye size={12} /> : <EyeOff size={12} />}
            {showSignalLevels ? "SIGNAL TARGETS" : "TARGETS HIDDEN"}
          </button>

          <button 
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              scrollXRef.current = 0;
              zoomRef.current = 1;
              setTimeout(() => requestAnimationFrame(draw), 50);
            }}
            className="p-1.5 bg-[#0a0c10]/80 backdrop-blur-md border border-white/10 hover:border-[#00d4ff]/50 rounded-[6px] text-[#8b99ae] hover:text-[#00d4ff] transition-all shadow-md"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>

        <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-screen" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
        
        <canvas ref={canvasRef} className="w-full h-full absolute inset-0 z-10 cursor-crosshair active:cursor-grabbing" />
      </div>
    </div>
  );
}