"use client";

import { useEffect, useRef } from "react";
import { useTradingEngine } from "./useTradingState";

export default function TradingEngineProvider({ children }: { children: React.ReactNode }) {
  const { tick, initialize, initialized } = useTradingEngine();
  const tickRef = useRef(tick);
  
  tickRef.current = tick;

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!initialized) return;
    const id = setInterval(() => {
      tickRef.current();
    }, 500);
    return () => clearInterval(id);
  }, [initialized]);

  return <>{children}</>;
}