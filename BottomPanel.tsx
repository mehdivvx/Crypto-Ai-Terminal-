"use client";

import { useState, useEffect } from "react";
import { useTradingStore, LIVE_PRICES } from "./useTradingState";
import { formatPrice } from "./utils";
import { Activity, ShieldCheck, AlertTriangle, Newspaper, ExternalLink, Clock } from "lucide-react";

function formatNumber(num: number) {
  if (isNaN(num)) return "--";
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toFixed(2);
}

function analyzeSentiment(title: string) {
  const text = title.toLowerCase();
  const bullWords = ['surge', 'jump', 'bull', 'adopt', 'approve', 'launch', 'partner', 'growth', 'buy', 'up', 'soar', 'record', 'etf', 'upgrade', 'breakout'];
  const bearWords = ['drop', 'fall', 'bear', 'ban', 'hack', 'scam', 'sec', 'sue', 'sell', 'down', 'crash', 'plunge', 'fear', 'lawsuit', 'probe', 'delay', 'reject'];
  
  let score = 0;
  bullWords.forEach(w => { if(text.includes(w)) score++; });
  bearWords.forEach(w => { if(text.includes(w)) score--; });
  
  if (score > 0) return { label: 'BULLISH', color: 'var(--neon-green)' };
  if (score < 0) return { label: 'BEARISH', color: 'var(--neon-red)' };
  return { label: 'NEUTRAL', color: 'var(--neon-gold)' };
}

export default function BottomPanel() {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "NEWS">("OVERVIEW");

  const activePair = useTradingStore((s) => s.activePair);
  const candles = useTradingStore((s) => s.candles) || [];
  const timeframe = useTradingStore((s) => s.timeframe) || "15m";
  const cvd = useTradingStore((s) => s.cvd) || 0;
  const aggrB = useTradingStore((s) => s.aggrB) || 0;
  const aggrS = useTradingStore((s) => s.aggrS) || 0;
  const vwap = useTradingStore((s) => s.vwap) || 0;
  const rsi = useTradingStore((s) => s.rsi) || 50;
  const bids = useTradingStore((s) => s.bids) || [];
  const asks = useTradingStore((s) => s.asks) || [];
  
  const currentPrice = LIVE_PRICES[activePair] || 0;

  const [vol24h, setVol24h] = useState<number | null>(null);
  useEffect(() => {
    if (!activePair) return;
    const fetchVol = async () => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${activePair.replace("/", "")}`);
        const data = await res.json();
        setVol24h(parseFloat(data.quoteVolume));
      } catch (e) {}
    };
    fetchVol();
    const int = setInterval(fetchVol, 15000);
    return () => clearInterval(int);
  }, [activePair]);

  const [news, setNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    if (activeTab !== "NEWS") return;
    const fetchNews = async () => {
      try {
        setLoadingNews(true);
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss`);
        const data = await res.json();
        if (data && data.items) {
          setNews(data.items.slice(0, 10)); 
        }
      } catch (e) {
        console.error("News fetch error", e);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, [activeTab]);

  let sentimentText = "AWAITING DATA";
  let sentimentColor = "var(--text-muted)";

  if (candles.length > 15) {
    const recent = candles.slice(-15);
    let greenVol = 0, redVol = 0;
    recent.forEach((c) => { if (c.c >= c.o) greenVol += c.v; else redVol += c.v; });
    const totalVol = greenVol + redVol;
    const buyPressure = totalVol > 0 ? (greenVol / totalVol) * 100 : 50;
    const priceDelta = ((recent[recent.length - 1].c - recent[0].o) / recent[0].o) * 100;

    if (buyPressure > 65 && priceDelta > 0.5) { sentimentText = "BUYERS ARE DOMINATING"; sentimentColor = "var(--neon-green)"; } 
    else if (buyPressure > 55) { sentimentText = "BUYERS ARE STEPPING IN"; sentimentColor = "var(--neon-green)"; } 
    else if (buyPressure < 35 && priceDelta < -0.5) { sentimentText = "SELLERS ARE DOMINATING"; sentimentColor = "var(--neon-red)"; } 
    else if (buyPressure < 45) { sentimentText = "SELLERS ARE STEPPING IN"; sentimentColor = "var(--neon-red)"; } 
    else { sentimentText = "MARKET IS STABLE"; sentimentColor = "var(--neon-cyan)"; }
  }

  let whaleText = "SAFE FROM MANIPULATION";
  let whaleColor = "var(--neon-green)";
  let WhaleIcon = ShieldCheck;
  let whaleTimeInfo = "NO RECENT ANOMALIES";

  if (candles.length > 50) {
    const avgVol = candles.slice(-50).reduce((acc, c) => acc + c.v, 0) / 50;
    let maxVolCandle = candles[0];
    candles.slice(-50).forEach(c => { if (c.v > maxVolCandle.v) maxVolCandle = c; });
    const priceMove = Math.abs(maxVolCandle.c - maxVolCandle.o) / maxVolCandle.o;

    if (maxVolCandle.v > avgVol * 2.5 && priceMove > 0.003) {
      const isPump = maxVolCandle.c > maxVolCandle.o;
      const timeDiffMs = Date.now() - maxVolCandle.t;
      const minsAgo = Math.floor(timeDiffMs / 60000);
      const hoursAgo = Math.floor(minsAgo / 60);
      
      let timeString = hoursAgo > 0 ? `${hoursAgo} HOUR${hoursAgo > 1 ? 'S' : ''} AGO` : `${minsAgo} MINS AGO`;
      whaleText = isPump ? "YES, WHALE IS PUMPING" : "YES, WHALE IS DUMPING";
      whaleColor = isPump ? "var(--neon-green)" : "var(--neon-red)";
      whaleTimeInfo = `LAST ANOMALY: ${timeString}`;
      WhaleIcon = AlertTriangle;
    }
  }

  const totalAggr = aggrB + aggrS;
  const buyRatio = totalAggr > 0 ? Math.round((aggrB / totalAggr) * 100) : 50;
  const vwapDev = (vwap > 0 && currentPrice > 0) ? ((currentPrice - vwap) / vwap) * 100 : 0;
  
  let momentumText = "NEUT";
  let momentumColor = "var(--neon-gold)";
  if (candles.length >= 5) {
    const recent = candles.slice(-5);
    const bullC = recent.filter(c => c.c > c.o).length;
    const momScore = Math.round(((bullC / 5) - 0.5) * 200 + (rsi - 50));
    if (momScore > 30) { momentumText = "BULL"; momentumColor = "var(--neon-green)"; }
    else if (momScore < -30) { momentumText = "BEAR"; momentumColor = "var(--neon-red)"; }
  }

  let revScore = 0;
  if (rsi > 75 || rsi < 25) revScore += 30; else if (rsi > 65 || rsi < 35) revScore += 15;
  if (Math.abs(vwapDev) > 2) revScore += 25; else if (Math.abs(vwapDev) > 1) revScore += 12;
  if (Math.abs(cvd) > 500) revScore += 15;
  
  const bV = bids.reduce((acc, b) => acc + b[1], 0);
  const aV = asks.reduce((acc, a) => acc + a[1], 0);
  const imb = (bV + aV) > 0 ? Math.abs(bV - aV) / (bV + aV) * 100 : 0;
  if (imb > 40) revScore += 20; else if (imb > 25) revScore += 10;
  
  const revProb = Math.min(95, Math.round(revScore));
  const revColor = revProb > 70 ? "var(--neon-red)" : revProb > 45 ? "var(--neon-gold)" : "var(--neon-green)";
  const cvdColor = cvd > 0 ? "var(--neon-green)" : cvd < 0 ? "var(--neon-red)" : "var(--text-primary)";

  return (
    <div className="w-full h-full min-h-[190px] rounded-[18px] flex flex-col overflow-hidden bg-[var(--panel)] border border-[var(--border)] shadow-md relative transition-colors duration-300">
      
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)', backgroundSize: '8px 8px' }}
      />

      <div className="flex items-center justify-center px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)] relative z-10 shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab("OVERVIEW")}
            className={`font-mono text-[10px] font-bold tracking-[2px] px-3 py-1.5 rounded-[6px] transition-all duration-300 ${activeTab === "OVERVIEW" ? "bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] shadow-[inset_0_0_10px_rgba(0,212,255,0.2)] border border-[var(--neon-cyan)]/20" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent"}`}
          >
            <Activity size={12} className="inline mr-1.5 mb-0.5" /> MARKET OVERVIEW
          </button>
          <button 
            onClick={() => setActiveTab("NEWS")}
            className={`font-mono text-[10px] font-bold tracking-[2px] px-3 py-1.5 rounded-[6px] transition-all duration-300 ${activeTab === "NEWS" ? "bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] shadow-[inset_0_0_10px_rgba(0,212,255,0.2)] border border-[var(--neon-cyan)]/20" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent"}`}
          >
            <Newspaper size={12} className="inline mr-1.5 mb-0.5" /> GLOBAL NEWS
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative z-10 h-full overflow-hidden">
        
        {activeTab === "OVERVIEW" && (
          <>
            <div className="flex flex-1 w-full items-stretch divide-x divide-[var(--border)] bg-[var(--surface)] border-b border-[var(--border)]">
              <div className="flex-1 flex flex-col justify-center px-6 py-2 relative group hover:bg-[var(--panel)] transition-colors">
                <span className="font-mono text-[9px] font-bold text-[var(--text-muted)] tracking-[2px] mb-1.5">24H VOLUME</span>
                <span className="font-num text-[22px] font-bold text-[var(--text-primary)] drop-shadow-md leading-none mb-1.5">
                  {vol24h ? formatNumber(vol24h) : "--"}
                </span>
                <span className="font-mono text-[9px] text-[var(--text-secondary)]">USDT</span>
              </div>
              <div className="flex-1 flex flex-col justify-center px-6 py-2 relative group hover:bg-[var(--panel)] transition-colors">
                <span className="font-mono text-[9px] font-bold text-[var(--text-muted)] tracking-[2px] mb-1.5">CVD</span>
                <span className="font-num text-[22px] font-bold leading-none mb-1.5" style={{ color: cvdColor }}>
                  {cvd > 0 ? '+' : ''}{formatNumber(cvd)}
                </span>
                <span className="font-mono text-[9px] text-[var(--text-secondary)]">CUM DELTA</span>
              </div>
              <div className="flex-1 flex flex-col justify-center px-6 py-2 relative group hover:bg-[var(--panel)] transition-colors">
                <span className="font-mono text-[9px] font-bold text-[var(--text-muted)] tracking-[2px] mb-1.5">AGGRESSION</span>
                <span className="font-num text-[22px] font-bold leading-none mb-1.5" style={{ color: buyRatio > 55 ? 'var(--neon-green)' : buyRatio < 45 ? 'var(--neon-red)' : 'var(--neon-gold)' }}>
                  {buyRatio}%
                </span>
                <span className="font-mono text-[9px] text-[var(--text-secondary)]">BUY RATIO</span>
              </div>
              <div className="flex-1 flex flex-col justify-center px-6 py-2 relative group hover:bg-[var(--panel)] transition-colors">
                <span className="font-mono text-[9px] font-bold text-[var(--text-muted)] tracking-[2px] mb-1.5">MOMENTUM</span>
                <span className="font-mono text-[22px] font-bold leading-none mb-1.5" style={{ color: momentumColor }}>
                  {momentumText}
                </span>
                <span className="font-mono text-[9px] text-[var(--text-secondary)]">BIAS</span>
              </div>
              <div className="flex-1 flex flex-col justify-center px-6 py-2 relative group hover:bg-[var(--panel)] transition-colors">
                <span className="font-mono text-[9px] font-bold text-[var(--text-muted)] tracking-[2px] mb-1.5">REVERSAL PROB</span>
                <span className="font-num text-[22px] font-bold leading-none mb-1.5" style={{ color: revColor }}>
                  {revProb}%
                </span>
                <span className="font-mono text-[9px] text-[var(--text-secondary)]">SCORE</span>
              </div>
              <div className="flex-1 flex flex-col justify-center px-6 py-2 relative group hover:bg-[var(--panel)] transition-colors">
                <span className="font-mono text-[9px] font-bold text-[var(--text-muted)] tracking-[2px] mb-1.5">VWAP DEV</span>
                <span className="font-num text-[22px] font-bold leading-none mb-1.5" style={{ color: vwapDev > 0 ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                  {vwapDev > 0 ? '+' : ''}{vwapDev.toFixed(2)}%
                </span>
                <span className="font-mono text-[9px] text-[var(--text-secondary)]">DEVIATION %</span>
              </div>
            </div>

            <div className="flex w-full h-[87px] shrink-0 divide-x divide-[var(--border)]">
              <div className="flex-1 flex items-center justify-between px-6 bg-[var(--surface)]">
                <span className="font-mono text-[10px] text-[var(--text-secondary)] tracking-[2px] uppercase">
                  {timeframe} Candle Sentiment
                </span>
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ background: sentimentColor, boxShadow: `0 0 10px ${sentimentColor}` }} />
                  <span className="font-display text-[15px] font-bold tracking-widest uppercase" style={{ color: sentimentColor }}>
                    {sentimentText}
                  </span>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-between px-6 bg-[var(--surface)]">
                <span className="font-mono text-[10px] text-[var(--text-secondary)] tracking-[2px] uppercase">
                  Whale & Manipulation Radar
                </span>
                <div className="flex flex-col items-end justify-center">
                  <div className="flex items-center gap-2">
                    <WhaleIcon size={14} style={{ color: whaleColor }} />
                    <span className="font-display text-[15px] font-bold tracking-widest uppercase" style={{ color: whaleColor }}>
                      {whaleText}
                    </span>
                  </div>
                  <span className="font-mono text-[8px] font-bold tracking-[1px] opacity-80 mt-0.5" style={{ color: whaleColor }}>
                    {whaleTimeInfo}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "NEWS" && (
          <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar p-3 space-y-3 bg-[var(--surface)]">
            {loadingNews ? (
              <div className="w-full h-full flex items-center justify-center font-mono text-[11px] text-[var(--neon-cyan)] animate-pulse">
                FETCHING LATEST MARKET CATALYSTS...
              </div>
            ) : news.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center font-mono text-[var(--text-muted)]">
                <AlertTriangle size={24} className="mb-2 text-[var(--neon-red)]" />
                <span className="text-[11px] font-bold tracking-[1px] text-[var(--text-primary)]">CONNECTION BLOCKED</span>
                <span className="text-[9px] mt-1">Please disable AdBlocker to view live news feeds.</span>
              </div>
            ) : (
              news.map((item, i) => {
                const sentiment = analyzeSentiment(item.title);
                let timeStr = "LIVE";
                if (item.pubDate) {
                  timeStr = item.pubDate.split(' ')[1]?.slice(0, 5) || "LIVE"; 
                }
                
                return (
                  <a 
                    key={i} 
                    href={item.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block bg-[var(--panel)] border border-[var(--border)] hover:border-[var(--neon-cyan)] rounded-[8px] p-3 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="font-mono text-[9px] font-bold text-[var(--text-secondary)] tracking-[1px] flex items-center gap-1">
                            <Clock size={10} /> {timeStr}
                          </span>
                          <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-[4px]" style={{ color: sentiment.color, background: `${sentiment.color}15`, border: `1px solid ${sentiment.color}40` }}>
                            {sentiment.label}
                          </span>
                          <span className="font-mono text-[9px] font-bold text-[var(--text-muted)] uppercase">
                            COINTELEGRAPH
                          </span>
                        </div>
                        <h3 className="font-display text-[13px] font-bold text-[var(--text-primary)] group-hover:text-[var(--neon-cyan)] transition-colors leading-snug">
                          {item.title}
                        </h3>
                      </div>
                      <ExternalLink size={14} className="text-[var(--text-muted)] group-hover:text-[var(--neon-cyan)] shrink-0 mt-1" />
                    </div>
                  </a>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
}