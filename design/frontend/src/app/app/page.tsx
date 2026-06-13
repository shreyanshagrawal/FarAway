"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThreeBackground from "@/components/ThreeBackground";
import AgentStepCard from "@/components/AgentStepCard";
import { Database, Binary, BarChart2, FileText, CheckSquare, Layers, Sparkles } from "lucide-react";

export default function AppCanvas() {
  const [activeTab, setActiveTab] = useState("insights");

  return (
    <main className="min-h-screen bg-[#f8f9fa] relative flex p-6 gap-6 overflow-hidden text-gray-900 font-sans">
      <ThreeBackground />

      {/* LEFT PANEL: Reasoning Trace */}
      <aside className="w-[420px] flex flex-col gap-6 h-[calc(100vh-48px)] relative z-10">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
              <Database className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold tracking-widest text-gray-800 uppercase">Reasoning Trace</h2>
          </div>
          <span className="text-xs font-mono text-gray-500 bg-white border border-gray-200 shadow-sm px-2 py-1 rounded-md">ID: UAPA_8829</span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide pb-12 relative">
          <div className="absolute left-10 top-0 bottom-12 w-0.5 bg-gradient-to-b from-blue-200 via-teal-100 to-transparent z-0" />

          <AgentStepCard agent="Orchestrator" time="14:02:01" text="Analyzing input stream. Initializing domain inference and clustering sub-agents..." color="blue" delay={0.1} />
          <AgentStepCard agent="Domain Inference" time="14:02:14" text="Linguistic analysis complete. Detected Software / SaaS domain." color="emerald" delay={0.3} />
          <AgentStepCard agent="Insight Agent" time="14:02:45" text="Clustering 428 feedback tokens via K-Means... Identifying UI themes." color="teal" delay={0.5} isLoading />
        </div>
      </aside>

      {/* RIGHT PANEL: Outputs */}
      <section className="flex-1 flex flex-col h-[calc(100vh-48px)] bg-white/80 backdrop-blur-md border border-gray-200 rounded-3xl shadow-lg overflow-hidden relative z-10">
        <div className="p-8 pb-0">
          {/* Domain Inference */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, type: "spring" }}
            className="relative bg-white border border-gray-200 shadow-sm rounded-2xl p-6 px-8 flex items-center justify-between mb-8 overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-50 blur-3xl rounded-full" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-50 border border-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <Binary className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-mono tracking-widest uppercase mb-1">Inferred Context</div>
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-display font-black text-gray-900">Software / SaaS</h1>
                  <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-bold text-emerald-600 uppercase tracking-widest shadow-sm">94% Confidence</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tab Strip */}
          <nav className="flex mb-8 border-b border-gray-200">
            {[
              { id: "insights", label: "Insights", icon: BarChart2 },
              { id: "priorities", label: "Priorities", icon: Layers },
              { id: "spec", label: "Spec", icon: FileText },
              { id: "tasks", label: "Tasks", icon: CheckSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-8 py-4 text-sm font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "text-[#ff5500]"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff5500]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-32 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full flex items-center justify-center"
            >
              <p className="text-gray-400 font-bold tracking-widest uppercase text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> {activeTab} Module Loading
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
