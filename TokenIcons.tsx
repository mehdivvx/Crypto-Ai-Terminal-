/**
 * Inline SVG crypto token icons.
 * Kept minimal — single-colour fills that work on any dark background.
 * Add more as needed; unknown tokens fall back to a generic hex icon.
 */

import React from "react";

interface IconProps {
  size?: number;
  className?: string;
}

// ── Individual icons ─────────────────────────────────────────────────────────

export function BtcIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path
        d="M22.5 13.8c.3-2.1-1.3-3.2-3.5-4l.7-2.8-1.7-.4-.7 2.7-1.4-.3.7-2.7-1.7-.4-.7 2.8-2.8-.7-.5 1.8s1.3.3 1.2.3c.7.2.8.7.8 1.1l-1.9 7.7c-.1.2-.3.5-.8.4 0 0-1.2-.3-1.2-.3l-.8 2 2.6.7-.7 2.8 1.7.4.7-2.8 1.4.4-.7 2.7 1.7.4.7-2.8c2.9.5 5 .3 5.9-2.3.7-2-.03-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.6zm-3.7 5.2c-.5 2-3.9.9-5 .6l.9-3.5c1.1.3 4.6.8 4.1 2.9zm.5-5.2c-.5 1.8-3.3.9-4.2.7l.8-3.2c.9.2 3.8.7 3.4 2.5z"
        fill="white"
      />
    </svg>
  );
}

export function EthIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <path d="M16 5v8.2l7 3.1L16 5z" fill="white" fillOpacity=".6" />
      <path d="M16 5L9 16.3l7-3.1V5z" fill="white" />
      <path d="M16 22v5l7-9.7L16 22z" fill="white" fillOpacity=".6" />
      <path d="M16 27v-5l-7-4.7 7 9.7z" fill="white" />
      <path d="M16 20.7l7-4.4-7-3.1v7.5z" fill="white" fillOpacity=".2" />
      <path d="M9 16.3l7 4.4v-7.5l-7 3.1z" fill="white" fillOpacity=".6" />
    </svg>
  );
}

export function SolIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="16" fill="#9945FF" />
      <path d="M9 20.5h11.3c.2 0 .4.1.5.2l1.7 1.8c.3.3.1.8-.4.8H9.6c-.2 0-.4-.1-.5-.2l-1-1.8c-.2-.4.1-.8.9-.8zM9 14.6h11.3c.2 0 .4.1.5.2l1.7 1.8c.3.3.1.8-.4.8H9.6c-.2 0-.4-.1-.5-.2l-1-1.8c-.2-.4.1-.8.9-.8zM22.4 9l-1.7 1.8c-.1.1-.3.2-.5.2H9c-.8 0-1.1-.5-.9-.8l1-1.8c.1-.1.3-.2.5-.2h12c.5 0 .7.5.8.8z" fill="white" />
    </svg>
  );
}

export function BnbIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
      <path d="M12.1 14l3.9-3.9 3.9 3.9 2.3-2.3L16 7.5 9.8 11.7 12.1 14zm-4.6 2l2.3-2.3 2.3 2.3-2.3 2.3L7.5 16zm4.6 2l3.9 3.9 3.9-3.9 2.3 2.3L16 24.5l-6.2-4.2 2.3-2.3zm9.1-4.3l2.3-2.3 2.3 2.3-2.3 2.3-2.3-2.3zm-4.5.3l-1.7-1.7-1.7 1.7 1.7 1.7 1.7-1.7z" fill="white" />
    </svg>
  );
}

export function LinkIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="16" fill="#2A5ADA" />
      <path d="M16 6l-2.5 1.4-6 3.5v7l6 3.5 2.5 1.4 2.5-1.4 6-3.5v-7l-6-3.5L16 6zm5 10.5l-5 2.9-5-2.9v-5.8l5-2.9 5 2.9v5.8z" fill="white" />
    </svg>
  );
}

export function AvaxIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="16" fill="#E84142" />
      <path d="M19.5 20h3.2c.3 0 .6-.2.7-.5l.5-.8c.2-.3 0-.7-.4-.7h-1.6l-2-3.5L16 20l-3.9-6.8-4.8 8.3c-.2.3.1.7.5.7h2.8c.3 0 .6-.2.8-.5l.7-1.2.8 1.4c.2.3.4.4.7.4h2.4l.5-.8.5.8h1.5v.5L19.5 20zm-3.5-9.5l2.5 4.3h-5l2.5-4.3z" fill="white" />
    </svg>
  );
}

export function DogeIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="16" fill="#C2A633" />
      <path d="M16 7c-5 0-9 4-9 9s4 9 9 9h2v-3.5h-2v-1.5h2v-3h-2v-1.5h2V12h-2V9h2c0 0 6 .5 6 7s-6 7-6 7" fill="white" />
    </svg>
  );
}

// ── Generic fallback hex icon ─────────────────────────────────────────────────

export function GenericTokenIcon({
  symbol,
  size = 24,
  className,
}: IconProps & { symbol: string }) {
  const token = symbol.split("/")[0];
  // Derive a consistent hue from the token letters
  const hue = Array.from(token).reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="16" fill={`hsl(${hue},65%,38%)`} />
      <text
        x="16" y="16"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={token.length > 3 ? "8" : "10"}
        fontWeight="700"
        fontFamily="monospace"
      >
        {token.slice(0, 4)}
      </text>
    </svg>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.FC<IconProps>> = {
  BTC:   BtcIcon,
  ETH:   EthIcon,
  SOL:   SolIcon,
  BNB:   BnbIcon,
  LINK:  LinkIcon,
  AVAX:  AvaxIcon,
  DOGE:  DogeIcon,
};

export function TokenIcon({
  symbol,
  size = 24,
  className,
}: { symbol: string; size?: number; className?: string }) {
  const base = symbol.split("/")[0];
  const Icon = ICON_MAP[base];
  if (Icon) return <Icon size={size} className={className} />;
  return <GenericTokenIcon symbol={symbol} size={size} className={className} />;
}
