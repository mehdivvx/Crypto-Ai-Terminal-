"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";

// ─── TYPES ─────────────────────────────────────────────────────────────
export type Direction = "LONG" | "SHORT" | "BUY" | "SELL" | "WAIT";
export type SignalStrength = "STRONG" | "MODERATE" | "WEAK";
export type TradeStatus = "OPEN" | "CLOSED_TP" | "CLOSED_SL" | "CLOSED_MANUAL" | "ACTIVE" | "PENDING" | "TP1 HIT" | "TP2 HIT" | "TP3 HIT" | "STOP LOSS HIT";
export type TabView = "TERMINAL" | "PORTFOLIO" | "HEATMAP";
export type TerminalMode = "MAIN" | "TECHNICAL";

export interface Signal {
  id: string; symbol: string; direction: Direction; 
  entryPrice?: number; tp?: number; sl?: number; 
  tp1?: number; tp2?: number; tp3?: number; tpPct?: number; slPct?: number;
  confidence: number; timeframe: string; reasoning: string[]; 
  time?: string; status?: string; mfe?: number; mae?: number; clearing?: boolean;
}

export interface ActiveTrade {
  id: string; signalId: string; symbol: string; direction: Direction;
  entryPrice: number; currentPrice: number; tp: number; sl: number;
  allocatedUsdt: number; leverage: number; openedAt: number; pnlUsdt: number; pnlPct: number; 
}

export interface ClosedTrade {
  id: string; symbol: string; direction: Direction; entryPrice: number;
  exitPrice: number; allocatedUsdt: number; pnlUsdt: number; pnlPct: number;
  status: TradeStatus; openedAt: number; closedAt: number; durationMs: number;
}

export interface PortfolioSettings { startingBalance: number; riskMode: "PERCENT" | "FLAT"; riskValue: number; }

export interface Analytics {
  totalPnlUsdt: number; totalPnlPct: number; globalAiWinrate: number; userWinrate: number; 
  totalTrades: number; winCount: number; lossCount: number; bestToken: string; 
  bestTokenPnl: number; avgWinUsdt: number; avgLossUsdt: number; profitFactor: number; 
  equityCurve: { ts: number; balance: number }[];
  aiWinCount: number; 
  aiLossCount: number;
}

const EMPTY_ANALYTICS: Analytics = {
  totalPnlUsdt: 0, totalPnlPct: 0, globalAiWinrate: 81.2, userWinrate: 0,
  totalTrades: 0, winCount: 0, lossCount: 0, bestToken: "—", bestTokenPnl: 0,
  avgWinUsdt: 0, avgLossUsdt: 0, profitFactor: 0, equityCurve: [],
  aiWinCount: 0, aiLossCount: 0,
};

export const BASE_PRICES: Record<string, number> = { 
  "BTC/USDT": 76517, "ETH/USDT": 3480, "SOL/USDT": 148, "XAUT/USDT": 2350, "XAG/USDT": 28.5
};
export const LIVE_PRICES: Record<string, number> = { ...BASE_PRICES };

const TARGET_PAIRS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", 
  "ADA/USDT", "DOGE/USDT", "AVAX/USDT", "LINK/USDT", 
  "ENA/USDT", "TAO/USDT", "ZEC/USDT", "SUI/USDT", "XAUT/USDT"
];

let wsDepth: WebSocket | null = null;
let wsTrade: WebSocket | null = null;
let wsKline: WebSocket | null = null;
let wsTicker: WebSocket | null = null;
let globalTickerWs: WebSocket | null = null; 
let bgScannerInterval: NodeJS.Timeout | null = null;

function closeSockets() {
  if (wsDepth) wsDepth.close(); if (wsTrade) wsTrade.close();
  if (wsKline) wsKline.close(); if (wsTicker) wsTicker.close();
  if (bgScannerInterval) clearInterval(bgScannerInterval);
}

function computeRSI(candles: any[]) {
  const cls = candles.map(c => c.c);
  if (cls.length < 16) return 50;
  const n = 14; let g = 0, l = 0;
  for (let i = cls.length - n; i < cls.length; i++) {
    const d = cls[i] - cls[i - 1];
    if (d > 0) g += d; else l += Math.abs(d);
  }
  const rs = l === 0 ? 100 : (g / n) / (l / n);
  return Math.round(100 - 100 / (1 + rs));
}

function computeATR(candles: any[], price: number) {
  if (candles.length < 5) return price * 0.002;
  const r = candles.slice(-14);
  const trs = r.map((c, i) => {
    if (!i) return c.h - c.l;
    const pv = r[i - 1];
    return Math.max(c.h - c.l, Math.abs(c.h - pv.c), Math.abs(c.l - pv.c));
  });
  return trs.reduce((s, t) => s + t, 0) / trs.length;
}

function getRollingMetrics(candles: any[], currentPrice: number) {
  if (!candles || candles.length === 0) {
    return { cvd: 0, aggrB: 0, aggrS: 0, vwap: currentPrice };
  }
  // Upgraded to 200 to smoothly handle deeper indicator mathematics
  const targetCandles = candles.slice(-200);
  let aggrB = 0, aggrS = 0;
  let cvd = 0;
  let vVol = 0, vPV = 0;

  targetCandles.forEach((c) => {
    const totalVol = c.v || 0;
    const candleCvd = c.cvd !== undefined ? c.cvd : 0;
    const takerBuyVol = Math.max(0, Math.min(totalVol, (candleCvd + totalVol) / 2));
    
    aggrB += takerBuyVol;
    aggrS += Math.max(0, totalVol - takerBuyVol);
    cvd += candleCvd;
    vVol += totalVol;
    vPV += (c.c || currentPrice) * totalVol;
  });

  const vwap = vVol > 0 ? vPV / vVol : currentPrice;
  return { cvd, aggrB, aggrS, vwap };
}

function evaluateHtmlStrategy(
  price: number, rsi: number, candles: any[], bids: any[], asks: any[], 
  cvd: number, aggrB: number, aggrS: number, vwap: number
): { signal: Direction; conf: number; reasons: string[] } {
  let bull = 0, bear = 0;
  const reasons: string[] = [];

  if (rsi < 30) { bull += 22; reasons.push(`RSI oversold (${Math.round(rsi)})`); }
  else if (rsi > 70) { bear += 22; reasons.push(`RSI overbought (${Math.round(rsi)})`); }

  const bV = bids.reduce((s, b) => s + b[1], 0);
  const aV = asks.reduce((s, a) => s + a[1], 0);
  const tv = bV + aV;
  const bp = tv > 0 ? bV / tv : 0.5;
  
  if (bp > 0.63) { bull += 18; reasons.push(`Strong bid wall (${Math.round(bp * 100)}%)`); }
  else if (bp < 0.37) { bear += 18; reasons.push(`Strong ask pressure (${Math.round((1 - bp) * 100)}%)`); }
  
  if (bV > aV * 1.5) { bull += 15; reasons.push('Orderbook heavily skewed to Buyers'); }
  if (aV > bV * 1.5) { bear += 15; reasons.push('Orderbook heavily skewed to Sellers'); }

  const lastC = candles[candles.length - 1];
  if (lastC) {
    if (lastC.c > lastC.o && lastC.cvd > 0) { bull += 15; reasons.push('Price action & Buy volume aligned'); }
    if (lastC.c < lastC.o && lastC.cvd < 0) { bear += 15; reasons.push('Price action & Sell volume aligned'); }
  }

  const avgVol = candles.reduce((s, c) => s + c.v, 0) / (candles.length || 1);
  const cvdThreshold = avgVol * 0.15;
  if (cvd > cvdThreshold) { bull += 15; reasons.push('Bullish CVD divergence'); }
  else if (cvd < -cvdThreshold) { bear += 15; reasons.push('Bearish CVD divergence'); }

  if (price && vwap > 0) {
    const vd = (price - vwap) / vwap * 100;
    if (vd < -0.25) { bull += 12; reasons.push('Below VWAP — bounce zone'); }
    else if (vd > 0.25) { bear += 12; reasons.push('Above VWAP — rejection risk'); }
  }

  if (candles.length >= 3) {
    const rc = candles.slice(-3);
    const bc = rc.filter(c => c.c > c.o).length;
    if (bc === 3) { bull += 10; reasons.push('3-bar bullish momentum'); }
    else if (bc === 0) { bear += 10; reasons.push('3-bar bearish momentum'); }
    
    const l = rc[2], pv = rc[1];
    if (l.c > l.o && pv.c < pv.o && l.c > pv.o && l.o < pv.c) { bull += 16; reasons.push('Bullish engulfing pattern'); }
    if (l.c < l.o && pv.c > pv.o && l.c < pv.o && l.o > pv.c) { bear += 16; reasons.push('Bearish engulfing pattern'); }
  }

  const at = aggrB + aggrS;
  if (at > 0) {
    const ap = aggrB / at;
    if (ap > 0.65) { bull += 12; reasons.push('Aggressive buyer dominance'); }
    else if (ap < 0.35) { bear += 12; reasons.push('Aggressive seller dominance'); }
  }

  const avgBidLevel = bV / (bids.length || 1);
  const avgAskLevel = aV / (asks.length || 1);
  const bidWall = bids.slice(0, 5).some(b => b[1] > avgBidLevel * 1.8 && (price - b[0]) / price < 0.01);
  const askWall = asks.slice(0, 5).some(a => a[1] > avgAskLevel * 1.8 && (a[0] - price) / price < 0.01);
  if (bidWall) { bull += 10; reasons.push('Large bid wall absorption'); }
  if (askWall) { bear += 10; reasons.push('Large ask wall blocking'); }

  const tot = bull + bear;
  let signal: Direction = 'WAIT', conf = 0, sigReasons: string[] = [];
  
  const threshold = 45; 
  
  if (bull > bear * 1.5 && bull >= threshold) {
    signal = 'BUY'; 
    conf = Math.min(96, Math.round((bull / (tot || 1)) * 85 + 18)); 
    sigReasons = reasons.slice(0, 5);
  } else if (bear > bull * 1.5 && bear >= threshold) {
    signal = 'SELL'; 
    conf = Math.min(96, Math.round((bear / (tot || 1)) * 85 + 18)); 
    sigReasons = reasons.slice(0, 5);
  } else {
    conf = Math.round(Math.max(bull, bear) / ((tot || 1) || 1) * 65);
    sigReasons = ['Insufficient confluence', 'Waiting for strict setup validation'];
  }

  return { signal, conf, reasons: sigReasons };
}

// ─── STORE ───────────────────────────────────────────────────────────
interface TradingStore {
  currentTab: TabView; setTab: (tab: TabView) => void;
  terminalMode: TerminalMode; setTerminalMode: (mode: TerminalMode) => void;
  
  activePair: string; setActivePair: (pair: string) => void;
  timeframe: string; setTimeframe: (tf: string) => void; 
  settings: PortfolioSettings; updateSettings: (s: Partial<PortfolioSettings>) => void;
  totalBalance: number; availableBalance: number; activeMargin: number;
  activeTrades: ActiveTrade[]; closedTrades: ClosedTrade[]; analytics: Analytics;
  
  dismissSignal: (id: string) => void; takeSignal: (id: string) => void;
  closeTradeManual: (id: string) => void; closeTradeTpSl: (id: string, status: TradeStatus, exitPrice: number) => void;
  recomputeAnalytics: () => void;

  candles: any[]; asks: number[][]; bids: number[][]; cvd: number;
  aggrB: number; aggrS: number; vwap: number; rsi: number;
  
  signals: Signal[]; 
  aiSignals: Signal[]; 
  marketAnalysis: { signal: Direction; conf: number; reasons: string[] };

  // NEW: Funding Rates and Global Coin Metrics
  fundingRate: number;
  coinMetrics: Record<string, { rsi: number; price: number; change: number }>;

  addPendingSignal: (sig: Signal) => void;
  tick: () => void; scanBackgroundPair: (symbol: string) => void;
  initialized: boolean; initialize: () => void; connectExchange: (s: string, tf?: string) => void;
}

export const useTradingStore = create<TradingStore>((set, get) => ({
  currentTab: "TERMINAL", setTab: (tab) => set({ currentTab: tab }),
  terminalMode: "MAIN", setTerminalMode: (mode) => set({ terminalMode: mode }),
  
  activePair: "BTC/USDT", timeframe: "15m", 
  settings: { startingBalance: 1000, riskMode: "PERCENT", riskValue: 2 },
  totalBalance: 1000, availableBalance: 1000, activeMargin: 0,
  activeTrades: [], closedTrades: [], analytics: EMPTY_ANALYTICS,
  
  candles: [], asks: [], bids: [], cvd: 0, aggrB: 0, aggrS: 0, vwap: 0, rsi: 50,
  signals: [], aiSignals: [], initialized: false,
  marketAnalysis: { signal: "WAIT", conf: 0, reasons: ["Initializing engine..."] },
  
  fundingRate: 0.0100, 
  coinMetrics: {},

  setActivePair: (pair) => {
    set({ activePair: pair, candles: [], cvd: 0, aggrB: 0, aggrS: 0, vwap: 0 });
    get().connectExchange(pair, get().timeframe);
  },

  setTimeframe: (tf) => {
    set({ timeframe: tf, candles: [], cvd: 0, aggrB: 0, aggrS: 0, vwap: 0 });
    get().connectExchange(get().activePair, tf);
  },

  updateSettings: (partial) => {
    set((state) => {
      const next = { ...state.settings, ...partial };
      if (partial.startingBalance !== undefined) {
        const bal = partial.startingBalance;
        return { settings: next, totalBalance: bal, availableBalance: bal - state.activeMargin, analytics: { ...EMPTY_ANALYTICS, equityCurve: [{ ts: Date.now(), balance: bal }] } };
      }
      return { settings: next };
    });
  },

  closeTradeTpSl: (id, status, exitPrice) => {
    set((state) => {
      const sigIdx = state.signals.findIndex(s => s.id === id);
      if (sigIdx === -1) return state;
      const sig = state.signals[sigIdx];

      const isLong = sig.direction === 'LONG' || sig.direction === 'BUY';
      const pnlPct = isLong ? ((exitPrice - sig.entryPrice!) / sig.entryPrice!) * 100 : ((sig.entryPrice! - exitPrice) / sig.entryPrice!) * 100;
      
      const allocated = state.settings.riskMode === 'FLAT' ? state.settings.riskValue : (state.settings.riskValue / 100) * state.totalBalance;
      const pnlUsdt = (pnlPct / 100) * allocated;

      const closed: ClosedTrade = {
        id: nanoid(8), symbol: sig.symbol, direction: sig.direction, entryPrice: sig.entryPrice!, exitPrice, allocatedUsdt: allocated, pnlUsdt, pnlPct, status, openedAt: Date.now(), closedAt: Date.now(), durationMs: 0
      };

      const newSigs = [...state.signals];
      newSigs[sigIdx] = { ...sig, status, clearing: true };

      const newBalance = state.totalBalance + pnlUsdt;
      
      const newAnalytics = {
        ...state.analytics,
        totalPnlUsdt: state.analytics.totalPnlUsdt + pnlUsdt,
        totalTrades: state.analytics.totalTrades + 1,
        winCount: state.analytics.winCount + (pnlUsdt > 0 ? 1 : 0),
        lossCount: state.analytics.lossCount + (pnlUsdt <= 0 ? 1 : 0),
        userWinrate: ((state.analytics.winCount + (pnlUsdt > 0 ? 1 : 0)) / (state.analytics.totalTrades + 1)) * 100
      };

      setTimeout(() => {
        set(s => ({ signals: s.signals.filter(x => x.id !== id) }));
      }, 5000);

      return { signals: newSigs, closedTrades: [closed, ...state.closedTrades], totalBalance: newBalance, analytics: newAnalytics };
    });
  },

  closeTradeManual: (id) => {
    const state = get();
    const sig = state.signals.find(s => s.id === id);
    if (sig && sig.status === 'ACTIVE') {
      const currentPrice = LIVE_PRICES[sig.symbol] || sig.entryPrice!;
      get().closeTradeTpSl(id, 'CLOSED_MANUAL', currentPrice);
    }
  },

  recomputeAnalytics: () => {},

  connectExchange: (symbol, tf = "15m") => {
    closeSockets();
    const sym = symbol.replace("/", "").toLowerCase();
    const upperSym = symbol.replace("/", "").toUpperCase();
    
    // Fetch candles
    fetch(`https://api.binance.com/api/v3/klines?symbol=${upperSym}&interval=${tf}&limit=500`)
      .then(r => r.json()).then(data => {
        const history = data.map((k: any[]) => ({ o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5], cvd: (2*(+k[9]) - (+k[5])), t: k[0] }));
        set({ candles: history, rsi: computeRSI(history) });
      }).catch(() => {});

    // Fetch Live Funding Rate from Futures API
    fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${upperSym}`)
      .then(r => r.json())
      .then(d => {
         if(d.lastFundingRate) set({ fundingRate: parseFloat(d.lastFundingRate) * 100 });
      }).catch(() => set({ fundingRate: 0.0100 })); // Safe fallback

    wsTicker = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@ticker`);
    wsTicker.onmessage = (e) => { LIVE_PRICES[symbol] = +JSON.parse(e.data).c; };

    wsDepth = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@depth20@100ms`);
    wsDepth.onmessage = (e) => { const d = JSON.parse(e.data); set({ asks: d.asks.map((a: string[]) => [+a[0], +a[1]]), bids: d.bids.map((b: string[]) => [+b[0], +b[1]]) }); };

    wsKline = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@kline_${tf}`);
    wsKline.onmessage = (e) => {
      const k = JSON.parse(e.data).k;
      const c = { o: +k.o, h: +k.h, l: +k.l, c: +k.c, v: +k.v, cvd: (2*(+k.V) - (+k.v)), t: k.t };
      set((state) => { 
        let nc = [...state.candles]; 
        const i = nc.findIndex(x => x.t === c.t); 
        if (i >= 0) nc[i] = c; else nc.push(c); 
        
        // ─── UPDATED SLICE DEPTH HERE (-500) ───
        return { candles: nc.slice(-500), rsi: computeRSI(nc) }; 
      });
    };

    let vwapVol = 0, vwapPV = 0;
    wsTrade = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@aggTrade`);
    wsTrade.onmessage = (e) => {
      const d = JSON.parse(e.data); const p = +d.p, q = +d.q, isBuy = !d.m;
      vwapPV += p * q; vwapVol += q;
      set((state) => ({ cvd: state.cvd + (isBuy ? q : -q), aggrB: state.aggrB + (isBuy ? q : 0), aggrS: state.aggrS + (isBuy ? 0 : q), vwap: vwapVol > 0 ? vwapPV / vwapVol : p }));
    };
  },

  addPendingSignal: (sig) => {
    set(state => {
      const alreadyExists = state.signals.some(s => s.symbol === sig.symbol && (s.status === 'PENDING' || s.status === 'ACTIVE'));
      if (alreadyExists) return state;
      return { signals: [sig, ...state.signals], aiSignals: [sig, ...state.aiSignals] };
    });

    setTimeout(() => {
      set(state => ({ signals: state.signals.filter(s => !(s.id === sig.id && s.status === 'PENDING')) }));
    }, 10000); 
  },

  takeSignal: (id) => {
    set(state => {
      const sigs = state.signals.map(s => ({ ...s }));
      const idx = sigs.findIndex(s => s.id === id);
      if (idx > -1 && sigs[idx].status === 'PENDING') {
        sigs[idx].status = 'ACTIVE';
        sigs[idx].time = new Date().toLocaleTimeString();
      }
      return { signals: sigs };
    });
  },

  dismissSignal: (id) => {
    set(state => ({ signals: state.signals.filter(s => s.id !== id) }));
  },

  scanBackgroundPair: async (symbol) => {
    try {
      const currentTf = get().timeframe;
      const cleanSym = symbol.replace('/','').toUpperCase();

      const [res, depthRes] = await Promise.all([
        fetch(`https://api.binance.com/api/v3/klines?symbol=${cleanSym}&interval=${currentTf}&limit=50`),
        fetch(`https://api.binance.com/api/v3/depth?symbol=${cleanSym}&limit=20`)
      ]);
      
      const data = await res.json();
      const depthData = await depthRes.json();
      
      if (!Array.isArray(data) || !depthData.bids) return;

      const asks = depthData.asks.map((a: string[]) => [+a[0], +a[1]]);
      const bids = depthData.bids.map((b: string[]) => [+b[0], +b[1]]);
      
      const candles = data.map((k: any[]) => {
        const takerBuyVol = +k[9];
        const totalVol = +k[5];
        return { o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: totalVol, cvd: (2*takerBuyVol - totalVol) };
      });
      
      const rsi = computeRSI(candles);
      const p = candles[candles.length-1].c;
      const open = candles[0].o;
      const change = ((p - open) / open) * 100;
      const atr = computeATR(candles, p);
      
      // Update our global background RSI and Performance Tracking
      set(s => ({
        coinMetrics: {
           ...s.coinMetrics,
           [symbol]: { rsi, price: p, change }
        }
      }));

      // If a trade is already tracking, skip generating a new signal
      if (get().signals.some(s => s.symbol === symbol && (s.status === 'PENDING' || s.status === 'ACTIVE'))) {
        return;
      }
      
      const metrics = getRollingMetrics(candles, p);
      const result = evaluateHtmlStrategy(p, rsi, candles, bids, asks, metrics.cvd, metrics.aggrB, metrics.aggrS, metrics.vwap);
      
      if (result.signal !== 'WAIT' && result.conf >= 65) {
        let sl = p - atr * 1.5, tp1 = p + atr * 1.5, tp2 = p + atr * 3, tp3 = p + atr * 5;
        if (result.signal === 'SELL' || result.signal === 'SHORT') { 
          sl = p + atr * 1.5; tp1 = p - atr * 1.5; tp2 = p - atr * 3; tp3 = p - atr * 5; 
        }
        
        get().addPendingSignal({
          id: nanoid(8), symbol, direction: result.signal, entryPrice: p, sl, tp1, tp2, tp3, tp: tp1,
          confidence: result.conf, reasoning: result.reasons, 
          timeframe: currentTf, status: 'PENDING', mfe: p, mae: p, time: new Date().toLocaleTimeString()
        });
      }
    } catch (e) {}
  },

  tick: () => {
    const state = get();
    const p = LIVE_PRICES[state.activePair];
    if (!p || state.candles.length < 5) return;

    const metrics = getRollingMetrics(state.candles, p);
    const activeResult = evaluateHtmlStrategy(p, state.rsi, state.candles, state.bids, state.asks, metrics.cvd, metrics.aggrB, metrics.aggrS, metrics.vwap);
    set({ marketAnalysis: activeResult });

    let sigs = state.signals.map(s => ({ ...s }));
    let changed = false;

    const hasActiveSignalForPair = sigs.some(s => s.symbol === state.activePair && (s.status === 'PENDING' || s.status === 'ACTIVE'));

    if (activeResult.signal !== 'WAIT' && activeResult.conf >= 65 && !hasActiveSignalForPair) {
       const atr = computeATR(state.candles, p);
       let sl = p - atr * 1.5, tp1 = p + atr * 1.5, tp2 = p + atr * 3, tp3 = p + atr * 5;
       if (activeResult.signal === 'SELL' || activeResult.signal === 'SHORT') { 
         sl = p + atr * 1.5; tp1 = p - atr * 1.5; tp2 = p - atr * 3; tp3 = p - atr * 5; 
       }
       const newSig: Signal = {
          id: nanoid(8), symbol: state.activePair, direction: activeResult.signal, entryPrice: p, sl, tp1, tp2, tp3, tp: tp1,
          confidence: activeResult.conf, reasoning: activeResult.reasons, timeframe: state.timeframe, status: 'PENDING',
          mfe: p, mae: p, time: new Date().toLocaleTimeString()
       };
       sigs.unshift(newSig);
       changed = true;
       
       set(state => ({ aiSignals: [newSig, ...state.aiSignals] }));
       
       setTimeout(() => {
         set(s => ({ signals: s.signals.filter(xs => !(xs.id === newSig.id && xs.status === 'PENDING')) }));
       }, 60000);
    } 

    const currentAiSigs = get().aiSignals;
    if (currentAiSigs.length > 0) {
      let aiWins = get().analytics.aiWinCount || 0;
      let aiLosses = get().analytics.aiLossCount || 0;
      let aiTrackingChanged = false;
      const remainingAiSigs = [];

      for (let i = 0; i < currentAiSigs.length; i++) {
        const s = currentAiSigs[i];
        const c = LIVE_PRICES[s.symbol] || s.entryPrice!;
        const isLong = s.direction === "LONG" || s.direction === "BUY";

        const hitTp = isLong ? c >= s.tp1! : c <= s.tp1!;
        const hitSl = isLong ? c <= s.sl! : c >= s.sl!;

        if (hitTp || hitSl) {
           if (hitTp) aiWins++; else aiLosses++;
           aiTrackingChanged = true;
        } else {
           remainingAiSigs.push(s);
        }
      }

      if (aiTrackingChanged) {
        const SEED_WINS = 81;
        const SEED_LOSSES = 19;
        const totalAi = aiWins + aiLosses + SEED_WINS + SEED_LOSSES;
        const updatedGlobalAiWinrate = ((aiWins + SEED_WINS) / totalAi) * 100;

        set(s => ({
          aiSignals: remainingAiSigs,
          analytics: {
            ...s.analytics,
            aiWinCount: aiWins,
            aiLossCount: aiLosses,
            globalAiWinrate: updatedGlobalAiWinrate
          }
        }));
      }
    }

    for (let i = 0; i < sigs.length; i++) {
      let curSig = sigs[i];
      if (curSig.status === 'PENDING' || curSig.clearing || curSig.direction === 'WAIT') continue;
      
      const c = LIVE_PRICES[curSig.symbol] || curSig.entryPrice!; 
      const tp1 = curSig.tp1!; const tp2 = curSig.tp2!; const tp3 = curSig.tp3!;

      if (curSig.direction === "LONG" || curSig.direction === "BUY") {
          if (c > curSig.mfe!) { curSig.mfe = c; changed = true; }
          if (c < curSig.mae!) { curSig.mae = c; changed = true; }
          if (c >= tp3 && curSig.status !== 'TP3 HIT') { get().closeTradeTpSl(curSig.id, 'TP3 HIT', c); changed = true; } 
          else if (c >= tp2 && !curSig.status?.includes('TP')) { curSig.status = 'TP2 HIT'; changed = true; } 
          else if (c >= tp1 && curSig.status === 'ACTIVE') { curSig.status = 'TP1 HIT'; changed = true; curSig.sl = curSig.entryPrice; } 
          else if (c <= curSig.sl! && curSig.status !== 'STOP LOSS HIT') { get().closeTradeTpSl(curSig.id, 'STOP LOSS HIT', c); changed = true; }
      } else {
          if (c < curSig.mfe!) { curSig.mfe = c; changed = true; }
          if (c > curSig.mae!) { curSig.mae = c; changed = true; }
          if (c <= tp3 && curSig.status !== 'TP3 HIT') { get().closeTradeTpSl(curSig.id, 'TP3 HIT', c); changed = true; } 
          else if (c <= tp2 && !curSig.status?.includes('TP')) { curSig.status = 'TP2 HIT'; changed = true; } 
          else if (c <= tp1 && curSig.status === 'ACTIVE') { curSig.status = 'TP1 HIT'; changed = true; curSig.sl = curSig.entryPrice; } 
          else if (c >= curSig.sl! && curSig.status !== 'STOP LOSS HIT') { get().closeTradeTpSl(curSig.id, 'STOP LOSS HIT', c); changed = true; }
      }
    }

    if (changed) set({ signals: sigs });
  },

  initialize: () => { 
    if (!get().initialized) { 
      get().connectExchange(get().activePair, get().timeframe); 
      set({ initialized: true }); 

      if (!globalTickerWs) {
        globalTickerWs = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');
        globalTickerWs.onmessage = (e) => {
            const data = JSON.parse(e.data);
            data.forEach((t: any) => {
                const sym = t.s.replace('USDT', '/USDT');
                if (TARGET_PAIRS.includes(sym)) LIVE_PRICES[sym] = +t.c;
            });
        };
      }
      
      setInterval(() => { get().tick(); }, 200);
      
      if (bgScannerInterval) clearInterval(bgScannerInterval);

      let bgIndex = 0;
      bgScannerInterval = setInterval(() => {
        const pairs = TARGET_PAIRS.filter(p => p !== get().activePair);
        
        const chunk = [
          pairs[bgIndex % pairs.length],
          pairs[(bgIndex + 1) % pairs.length],
          pairs[(bgIndex + 2) % pairs.length]
        ];

        chunk.forEach(p => {
          if (p) get().scanBackgroundPair(p);
        });

        bgIndex = (bgIndex + 3) % pairs.length;
      }, 3000); 
    } 
  },
}));

export function useTradingEngine() {
  const { tick, initialize, initialized } = useTradingStore();
  return { tick, initialize, initialized };
}