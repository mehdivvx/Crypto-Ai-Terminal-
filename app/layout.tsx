import type { Metadata } from "next";
import { Space_Mono, Rajdhani, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import TradingEngineProvider from "../TradingEngineProvider";

const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-mono" });
const rajdhani = Rajdhani({ weight: ["300", "400", "500", "600", "700"], subsets: ["latin"], variable: "--font-ui" });
const jetbrains = JetBrains_Mono({ weight: ["300", "400", "500", "700"], subsets: ["latin"], variable: "--font-num" });

export const metadata: Metadata = {
  title: "QUANTUM | Terminal",
  description: "Advanced Paper Trading Engine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${rajdhani.variable} ${jetbrains.variable} dark`}>
      <body className="bg-[#030407] font-ui text-slate-200 antialiased overflow-hidden">
        {/* Subtle grid background from your HTML */}
        <div className="fixed inset-0 pointer-events-none -z-10" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <TradingEngineProvider>
          {children}
        </TradingEngineProvider>
      </body>
    </html>
  );
}