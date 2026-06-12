"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value:      string;   // pre-formatted string
  className?: string;
  flashUp?:   string;   // class applied briefly when value increases
  flashDown?: string;   // class applied briefly when value decreases
  /** numeric value used to determine direction; optional */
  rawValue?:  number;
}

export default function AnimatedNumber({
  value,
  className,
  flashUp   = "text-[#00FF88]",
  flashDown = "text-[#FF3366]",
  rawValue,
}: AnimatedNumberProps) {
  const prev       = useRef<number | undefined>(rawValue);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (rawValue === undefined || prev.current === undefined) {
      prev.current = rawValue;
      return;
    }
    if (rawValue > prev.current) setFlash("up");
    else if (rawValue < prev.current) setFlash("down");
    prev.current = rawValue;

    const t = setTimeout(() => setFlash(null), 400);
    return () => clearTimeout(t);
  }, [rawValue]);

  const flashClass = flash === "up" ? flashUp : flash === "down" ? flashDown : "";

  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0  }}
        exit   ={{ opacity: 0, y:  5 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={cn(className, flashClass, "inline-block tabular-nums")}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}
