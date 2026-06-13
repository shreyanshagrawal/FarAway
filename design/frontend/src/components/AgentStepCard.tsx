"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Props {
  agent: string;
  time: string;
  text: string;
  color: "orange" | "emerald" | "teal" | "rose" | "amber" | "blue";
  delay: number;
  isLoading?: boolean;
}

const colorMap = {
  orange:  { border: "border-[#ff5500]/30", bg: "bg-[#ff5500]/10", text: "text-[#ff5500]", bar: "bg-[#ff5500]", glow: "shadow-[0_4px_20px_rgba(255,85,0,0.1)]" },
  emerald: { border: "border-[#10b981]/30", bg: "bg-[#10b981]/10", text: "text-[#10b981]", bar: "bg-[#10b981]", glow: "shadow-[0_4px_20px_rgba(16,185,129,0.1)]" },
  teal:    { border: "border-[#14b8a6]/30", bg: "bg-[#14b8a6]/10", text: "text-[#14b8a6]", bar: "bg-[#14b8a6]", glow: "shadow-[0_4px_20px_rgba(20,184,166,0.1)]" },
  rose:    { border: "border-[#f43f5e]/30", bg: "bg-[#f43f5e]/10", text: "text-[#f43f5e]", bar: "bg-[#f43f5e]", glow: "shadow-[0_4px_20px_rgba(244,63,94,0.1)]" },
  amber:   { border: "border-[#f59e0b]/30", bg: "bg-[#f59e0b]/10", text: "text-[#f59e0b]", bar: "bg-[#f59e0b]", glow: "shadow-[0_4px_20px_rgba(245,158,11,0.1)]" },
  blue:    { border: "border-[#3b82f6]/30", bg: "bg-[#3b82f6]/10", text: "text-[#3b82f6]", bar: "bg-[#3b82f6]", glow: "shadow-[0_4px_20px_rgba(59,130,246,0.1)]" },
};

export default function AgentStepCard({ agent, time, text, color, delay, isLoading }: Props) {
  const theme = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 100 }}
      className="relative z-10"
    >
      <div className={`relative bg-white p-5 rounded-2xl overflow-hidden transition-all hover:bg-gray-50 border-gray-200 border shadow-sm hover:${theme.glow} backdrop-blur-md`}>
        {/* Accent bar */}
        <div className={`absolute top-0 left-0 w-1 h-full ${theme.bar} ${isLoading ? "animate-pulse" : "opacity-80"}`} />

        <div className="flex justify-between items-start mb-3">
          <span className={`px-2 py-0.5 rounded-md ${theme.bg} ${theme.text} text-[10px] font-bold uppercase tracking-widest border ${theme.border}`}>
            {agent}
          </span>
          <span className="text-[10px] text-gray-400 font-mono">{time}</span>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed font-sans pl-2">{text}</p>

        <div className="mt-4 flex justify-end">
          {isLoading ? (
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mt-2">
              <div className={`h-full ${theme.bar} w-1/3 rounded-full animate-[shimmer_1.5s_infinite]`} />
            </div>
          ) : (
            <div className={`w-6 h-6 rounded-full ${theme.bg} flex items-center justify-center ${theme.text}`}>
              <Check className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
