"use client";

import { useMemo } from "react";

interface Props {
  data:    { ts: number; balance: number }[];
  width?:  number;
  height?: number;
}

export default function MiniEquityCurve({ data, width = 240, height = 48 }: Props) {
  const path = useMemo(() => {
    if (data.length < 2) return "";
    const vals = data.map(d => d.balance);
    const min  = Math.min(...vals);
    const max  = Math.max(...vals);
    const rng  = max - min || 1;
    const PAD  = { x: 2, y: 4 };
    const W    = width  - PAD.x * 2;
    const H    = height - PAD.y * 2;

    return data.map((d, i) => {
      const x = PAD.x + (i / (data.length - 1)) * W;
      const y = PAD.y + H - ((d.balance - min) / rng) * H;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }, [data, width, height]);

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-12 font-mono text-[9px] text-[#3D5A6E]">
        Awaiting trades…
      </div>
    );
  }

  const first = data[0]?.balance ?? 0;
  const last  = data[data.length - 1]?.balance ?? 0;
  const isUp  = last >= first;
  const color = isUp ? "#00FF88" : "#FF3366";
  const glow  = isUp ? "rgba(0,255,136,0.3)" : "rgba(255,51,102,0.3)";

  // Fill area
  const fillPath = path + ` L${(width - 2).toFixed(1)},${height} L2,${height} Z`;

  return (
    <svg width={width} height={height} className="w-full overflow-visible">
      <defs>
        <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0"   />
        </linearGradient>
        <filter id="curve-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Fill */}
      <path d={fillPath} fill="url(#curve-fill)" />

      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#curve-glow)"
      />

      {/* End dot */}
      {data.length >= 2 && (() => {
        const last = data[data.length - 1];
        const vals = data.map(d => d.balance);
        const min  = Math.min(...vals);
        const max  = Math.max(...vals);
        const rng  = max - min || 1;
        const x    = width - 2;
        const y    = 4 + (height - 8) - ((last.balance - min) / rng) * (height - 8);
        return (
          <>
            <circle cx={x} cy={y} r={3} fill={color} />
            <circle cx={x} cy={y} r={5} fill={color} fillOpacity="0.2">
              <animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" />
              <animate attributeName="fill-opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
          </>
        );
      })()}
    </svg>
  );
}
