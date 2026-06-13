"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ArrowLeft, Brain, Target, FileText, Settings, Database, Activity, Plus, Minus } from "lucide-react";
import { motion, useAnimationControls } from "framer-motion";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Dynamically import the WebGL scene
const CinematicScene = dynamic(() => import("@/components/Scene"), {
  ssr: false,
});

/* ─── NAV ──────────────────────────────────────── */
function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#eeeeee] border-b border-[rgba(0,0,0,0.1)] h-24">
      <div className="w-full h-full grid grid-cols-12 max-w-[1920px] mx-auto border-x border-[rgba(0,0,0,0.1)]">
        {/* Logo Section */}
        <div className="col-span-3 flex items-center px-8 border-r border-[rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ff5500] rounded-[6px] flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-xl tracking-tighter text-[#111] leading-none">AURA</span>
              <span className="font-display font-black text-xl tracking-tighter text-[#111] leading-none">AGENT</span>
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="col-span-6 flex items-center justify-center gap-8 border-r border-[rgba(0,0,0,0.1)] px-8">
          {["Features", "Architecture", "Integrations", "Security", "Pricing", "FAQ", "Blog"].map((link) => (
            <Link key={link} href="#" className="font-mono text-xs font-bold tracking-widest text-[#111] hover:text-[#ff5500] transition-colors">
              {link}
            </Link>
          ))}
        </div>

        {/* Action Section */}
        <div className="col-span-3 flex items-center justify-between px-8">
          <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-[#111]">
            <span className="text-[#ff5500]">::</span> Ecosystem
          </div>
          <Link href="/new">
            <button 
              style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
              className="bg-[#ff5500] hover:bg-[#e64d00] text-white font-mono text-xs font-bold tracking-widest py-3 px-6 transition-colors uppercase"
            >
              Deploy Now
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── HERO SECTION ─────────────────────────────── */
function HeroSection() {
  const marqueeRef = useRef(null);

  useEffect(() => {
    gsap.to(marqueeRef.current, {
      xPercent: -50,
      ease: "none",
      duration: 20,
      repeat: -1,
    });
  }, []);

  return (
    <section id="hero-section" className="relative pt-24 z-10 border-b border-[rgba(0,0,0,0.1)] max-w-[1920px] mx-auto border-x border-[rgba(0,0,0,0.1)]">
      
      {/* Top Margin Grid Area */}
      <div className="h-16 grid grid-cols-12 border-b border-[rgba(0,0,0,0.1)]">
        <div className="col-span-3 border-r border-[rgba(0,0,0,0.1)] relative">
          <div className="absolute top-4 left-4 w-4 h-4 border-l border-t border-[rgba(0,0,0,0.2)]"></div>
          <div className="absolute top-4 right-4 w-4 h-4 border-r border-t border-[rgba(0,0,0,0.2)]"></div>
          <div className="absolute bottom-4 left-4 w-4 h-4 border-l border-b border-[rgba(0,0,0,0.2)]"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 border-r border-b border-[rgba(0,0,0,0.2)]"></div>
        </div>
        <div className="col-span-6 border-r border-[rgba(0,0,0,0.1)]"></div>
        <div className="col-span-3 relative">
           <div className="absolute top-4 right-4 bg-[#111] p-2 rounded-sm"><Settings className="w-4 h-4 text-[#ff5500]" /></div>
        </div>
      </div>

      {/* Massive Ticker Area */}
      <div className="relative border-b border-[rgba(0,0,0,0.1)] py-8 overflow-hidden bg-[rgba(255,255,255,0.5)]">
        <div className="absolute top-4 left-4 w-2 h-2 bg-[#ff5500]"></div>
        <div className="absolute top-4 right-4 w-2 h-2 bg-[#ff5500]"></div>
        <div className="absolute bottom-4 left-4 w-2 h-2 bg-[#ff5500]"></div>
        <div className="absolute bottom-4 right-4 w-2 h-2 bg-[#ff5500]"></div>
        
        <div className="flex whitespace-nowrap" ref={marqueeRef}>
          <h1 className="font-display font-black text-[14rem] leading-[0.8] tracking-tighter text-[#111] uppercase px-8 flex items-center gap-16">
            <span>AUTONOMOUS</span> <span className="opacity-20">AUTONOMOUS</span> <span>AUTONOMOUS</span>
          </h1>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-12 min-h-[600px]">
        {/* Left Panel */}
        <div className="col-span-3 border-r border-[rgba(0,0,0,0.1)] p-12 flex flex-col justify-center bg-[rgba(238,238,238,0.8)] backdrop-blur-sm">
          <p className="font-mono text-2xl font-normal text-[#111] leading-tight mb-8">
            Backing the very best product teams - transforming visionary ideas into real-world execution.
          </p>
          <Link href="/new">
            <button 
              style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
              className="bg-[#ff5500] hover:bg-[#e64d00] text-[#111] font-mono text-sm font-bold tracking-widest py-4 px-8 w-full transition-colors uppercase"
            >
              DEPLOY AURA AGENT
            </button>
          </Link>
        </div>

        {/* Center Panel (Transparent for 3D Scene) */}
        <div className="col-span-6 border-r border-[rgba(0,0,0,0.1)] pointer-events-none">
          {/* The WebGL scene renders under here */}
        </div>

        {/* Right Panel */}
        <div className="col-span-3 p-12 flex flex-col justify-between bg-[rgba(238,238,238,0.8)] backdrop-blur-sm">
          <div className="bg-[#111] aspect-square w-full rounded-sm relative flex items-center justify-center p-8 border border-[#333] shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
            <div className="absolute top-4 left-4 w-2 h-2 border-l border-t border-white/30"></div>
            <div className="absolute top-4 right-4 w-2 h-2 border-r border-t border-white/30"></div>
            <div className="absolute bottom-4 left-4 w-2 h-2 border-l border-b border-white/30"></div>
            <div className="absolute bottom-4 right-4 w-2 h-2 border-r border-b border-white/30"></div>
            
            <Database className="w-full h-full text-[#eeeeee]/20" />
            <Brain className="w-1/2 h-1/2 text-[#ff5500] absolute" />
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-[rgba(0,0,0,0.1)] pt-4">
            <span className="font-mono text-xs font-bold tracking-widest text-[#111] uppercase">Integrations:</span>
            <div className="flex gap-2">
              <button className="p-2 border border-[rgba(0,0,0,0.1)] hover:bg-[rgba(0,0,0,0.05)] transition-colors"><ArrowRight className="w-4 h-4 rotate-180" /></button>
              <button className="p-2 border border-[rgba(0,0,0,0.1)] hover:bg-[rgba(0,0,0,0.05)] transition-colors"><ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Partners Band */}
      <div className="grid grid-cols-4 border-t border-[rgba(0,0,0,0.1)] bg-white h-32">
        <div className="border-r border-[rgba(0,0,0,0.1)] flex items-center justify-center font-display font-black text-2xl tracking-tighter opacity-80">
          <div className="flex items-center gap-2"><div className="w-6 h-6 border-[3px] border-current rounded-full"></div> LINEAR</div>
        </div>
        <div className="border-r border-[rgba(0,0,0,0.1)] flex items-center justify-center font-display font-black text-2xl tracking-tighter opacity-80">
          <div className="flex items-center gap-2"><div className="w-6 h-6 border-[3px] border-current rotate-45"></div> GITHUB</div>
        </div>
        <div className="border-r border-[rgba(0,0,0,0.1)] flex items-center justify-center font-display font-black text-2xl tracking-tighter opacity-80">
          <div className="flex items-center gap-2"><div className="w-6 h-6 border-[3px] border-current rounded-sm"></div> JIRA</div>
        </div>
        <div className="flex items-center justify-center font-display font-black text-2xl tracking-tighter opacity-80">
          <div className="flex items-center gap-2"><div className="w-6 h-6 border-[3px] border-current rounded-tl-xl rounded-br-xl"></div> SLACK</div>
        </div>
      </div>

    </section>
  );
}

/* ─── FEATURES GRID ────────────────────────────── */
function FeaturesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);

  const agents = [
    { 
      badge: "System Core", title: "Orchestrator Agent", icon: Settings,
      stats: [
        { label: "State Sync", value: "< 10ms" }, { label: "Protocol", value: "SSE Stream" },
        { label: "Engine", value: "LangGraph" }, { label: "Uptime", value: "99.9%" }
      ]
    },
    { 
      badge: "NLP Engine", title: "Domain Inference", icon: Brain,
      stats: [
        { label: "Confidence", value: "94%+" }, { label: "Config", value: "Zero Setup" },
        { label: "Domains", value: "6 Core" }, { label: "Input", value: "Unstructured" }
      ]
    },
    { 
      badge: "Vector Ops", title: "Insight Agent", icon: Database,
      stats: [
        { label: "Algorithm", value: "K-Means" }, { label: "Embeddings", value: "1536-dim" },
        { label: "Store", value: "Qdrant" }, { label: "Scale", value: "Infinite" }
      ]
    },
    { 
      badge: "Scoring Engine", title: "Priority Agent", icon: Target,
      stats: [
        { label: "Framework", value: "ICE / RICE" }, { label: "Weights", value: "Dynamic" },
        { label: "Multiplier", value: "1.5x" }, { label: "Accuracy", value: "98%" }
      ]
    },
    { 
      badge: "Generation", title: "Writer Agent", icon: FileText,
      stats: [
        { label: "Output", value: "Markdown" }, { label: "Format", value: "PRD / Brief" },
        { label: "Context", value: "128k" }, { label: "Model", value: "Sonnet 4" }
      ]
    },
    { 
      badge: "Integration", title: "Task Agent", icon: Activity,
      stats: [
        { label: "API", value: "GraphQL" }, { label: "Target", value: "Linear" },
        { label: "Latency", value: "90 sec" }, { label: "Success", value: "100%" }
      ]
    },
  ];

  // Auto-play interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % agents.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [agents.length]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % agents.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? agents.length - 1 : prev - 1));

  // Approx card width + gap
  const CARD_WIDTH = 400;
  const GAP = 32;

  return (
    <section id="features" ref={containerRef} className="relative z-20 py-32 bg-[#eeeeee] border-b border-[rgba(0,0,0,0.1)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 mb-20 flex justify-between items-end">
        <h2 className="font-display font-black text-4xl md:text-6xl uppercase tracking-tighter text-[#111]">
          Hardware <span className="text-[#ff5500]">Architecture</span>
        </h2>
        
        {/* Navigation Controls */}
        <div className="flex border border-[rgba(0,0,0,0.1)] bg-white/50 backdrop-blur-sm">
          <button onClick={handlePrev} className="p-4 border-r border-[rgba(0,0,0,0.1)] hover:bg-white transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#111]" />
          </button>
          <button onClick={handleNext} className="p-4 hover:bg-white transition-colors">
            <ArrowRight className="w-6 h-6 text-[#111]" />
          </button>
        </div>
      </div>
      
      <div className="relative w-full">
        <motion.div 
          className="flex px-8"
          style={{ gap: `${GAP}px` }}
          animate={{ x: `calc(-${currentIndex * (CARD_WIDTH + GAP)}px)` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        >
          {agents.map((agent, i) => (
            <div 
              key={i} 
              className="flex-shrink-0 flex flex-col bg-[#f9f9f9] border border-[rgba(0,0,0,0.1)]"
              style={{ width: `${CARD_WIDTH}px` }}
            >
              {/* Top Badge */}
              <div className="border-b border-[rgba(0,0,0,0.1)]">
                <span className="inline-block px-4 py-2 text-[10px] font-mono font-bold tracking-widest uppercase border-r border-[rgba(0,0,0,0.1)] text-[#111]/60">
                  {agent.badge}
                </span>
              </div>

              {/* Main Area */}
              <div className="flex-1 p-12 flex flex-col items-center justify-center min-h-[220px]">
                <agent.icon className="w-16 h-16 mb-6 text-[#111] group-hover:text-[#ff5500] transition-colors" />
                <h3 className="font-display font-black text-2xl text-[#111] uppercase tracking-tighter">{agent.title}</h3>
              </div>

              {/* Bottom Section: Stats + Arrow */}
              <div className="flex border-t border-[rgba(0,0,0,0.1)]">
                {/* Stats Grid */}
                <div className="flex-1 grid grid-cols-2 grid-rows-2">
                  {agent.stats.map((stat, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 flex flex-col justify-center ${idx === 0 || idx === 2 ? 'border-r' : ''} ${idx < 2 ? 'border-b' : ''} border-[rgba(0,0,0,0.1)]`}
                    >
                      <div className="font-display font-bold text-lg text-[#111] tracking-tight">{stat.value}</div>
                      <div className="font-mono text-[10px] text-[#111]/50 uppercase tracking-widest mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Right Arrow Button */}
                <Link href="/app" className="w-20 border-l border-[rgba(0,0,0,0.1)] flex items-center justify-center hover:bg-white transition-colors group">
                  <ArrowRight className="w-6 h-6 text-[#111]/50 group-hover:text-[#ff5500] group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── DATA GAP ─────────────────────────────────── */
function DataSection() {
  return (
    <section className="py-40 relative z-10 flex items-center justify-center bg-[#eeeeee] border-b border-[rgba(0,0,0,0.1)]">
      <div className="text-center w-full">
        <div className="flex items-center justify-between px-10 pb-10 max-w-7xl mx-auto border-b border-[rgba(0,0,0,0.1)]">
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-[#ff5500]">System Load</span>
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-[#111]">Nominal</span>
        </div>
        <h2 className="font-display font-black text-[12vw] tracking-tighter text-[#111] leading-none py-20 whitespace-nowrap overflow-hidden">
          AURA PROTOCOL
        </h2>
      </div>
    </section>
  );
}

/* ─── FAQ SECTION ──────────────────────────────── */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { q: "What is the Aura autonomous PM agent?", a: "Aura is a specialized AI designed to automate product management tasks such as roadmap generation, PRD writing, and ticket creation." },
    { q: "How does Aura integrate with our existing tools?", a: "Aura natively integrates with Linear, Jira, Slack, and GitHub to read context and push structured updates automatically." },
    { q: "Is our proprietary company data secure?", a: "Yes. Aura operates on a zero-retention policy with SOC2 compliance. Your data is used strictly for in-memory context and never trains global models." },
    { q: "What kind of teams benefit most from Aura?", a: "Fast-moving agile teams, startups, and enterprise software teams looking to eliminate administrative overhead." },
    { q: "How long does it take to deploy?", a: "Initial configuration takes approximately 90 seconds. Aura begins contributing to your product workflow immediately." }
  ];

  return (
    <section className="relative z-20 bg-[#eeeeee] border-b border-[rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto border-x border-[rgba(0,0,0,0.1)]">
        {/* Top Header Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[rgba(0,0,0,0.1)]">
          {/* FAQ Title Box */}
          <div className="p-16 flex items-center justify-center border-r border-[rgba(0,0,0,0.1)]">
            <h2 className="font-display font-black text-6xl md:text-8xl tracking-tighter text-[#111]">FAQ</h2>
          </div>
          {/* Middle Decorative Box */}
          <div className="hidden md:flex p-16 items-center justify-center border-r border-[rgba(0,0,0,0.1)] relative">
            <div className="absolute top-4 left-4 w-4 h-4 border-l border-t border-[rgba(0,0,0,0.2)]"></div>
            <div className="absolute top-4 right-4 w-4 h-4 border-r border-t border-[rgba(0,0,0,0.2)]"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 border-l border-b border-[rgba(0,0,0,0.2)]"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-r border-b border-[rgba(0,0,0,0.2)]"></div>
            <Settings className="w-24 h-24 text-[rgba(0,0,0,0.05)] animate-spin-slow" />
          </div>
          {/* Description Box */}
          <div className="p-12 flex flex-col justify-center">
            <h3 className="font-mono font-bold text-lg text-[#111] mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#111]"></span> Most Common Questions
            </h3>
            <p className="font-mono text-sm text-[#111]/50">
              No worries, here you can find all the answers regarding the Aura PM agent.
            </p>
          </div>
        </div>

        {/* Accordion Rows */}
        <div className="flex flex-col">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-[rgba(0,0,0,0.1)] last:border-b-0">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-8 flex items-center justify-between text-left hover:bg-[rgba(0,0,0,0.02)] transition-colors"
              >
                <span className="font-mono font-bold text-sm md:text-base text-[#111]">{faq.q}</span>
                <div className={`w-10 h-10 rounded-md bg-[#ff5500] flex items-center justify-center text-white transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}>
                  {openIndex === i ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
              </button>
              {openIndex === i && (
                <div className="px-8 pb-8">
                  <p className="font-mono text-sm text-[#111]/60 leading-relaxed max-w-3xl">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA SECTION ──────────────────────────────── */
function CTASection() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center z-20 px-4 py-32 bg-[#eeeeee]">
      <div className="grid-panel p-16 md:p-24 text-center max-w-5xl w-full border border-[#ff5500]/30 shadow-[0_20px_50px_rgba(255,85,0,0.1)]">
        <div className="corner-accent corner-accent-tl"></div>
        <div className="corner-accent corner-accent-tr"></div>
        <div className="corner-accent corner-accent-bl"></div>
        <div className="corner-accent corner-accent-br"></div>
        
        <Activity className="w-16 h-16 text-[#ff5500] mx-auto mb-8" />
        <h2 className="font-display font-black text-5xl md:text-7xl tracking-tighter uppercase leading-[0.9] mb-8 text-[#111]">
          Ready to <br/>
          <span className="text-[#ff5500]">Automate?</span>
        </h2>
        
        <p className="text-xl text-[#111]/60 font-mono mb-12 max-w-2xl mx-auto">
          Deploy the AURA agent and connect directly to your ecosystem.
        </p>
        
        <Link href="/app">
          <button className="btn-industrial py-5 px-16 text-lg">Initialize Node</button>
        </Link>
      </div>
    </section>
  );
}

/* ─── FOOTER ───────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-[#eeeeee] relative z-20 border-t border-[rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto border-x border-[rgba(0,0,0,0.1)]">
        {/* Top Grid Area */}
        <div className="grid grid-cols-1 md:grid-cols-4 border-b border-[rgba(0,0,0,0.1)]">
          {/* ECOSYSTEM */}
          <div className="p-12 border-r border-[rgba(0,0,0,0.1)]">
            <h4 className="font-mono text-xs font-bold tracking-widest text-[#111]/40 mb-8">ECOSYSTEM</h4>
            <ul className="flex flex-col gap-4 font-mono text-sm font-bold text-[#111]">
              <li><Link href="#" className="hover:text-[#ff5500] transition-colors">Aura Agent</Link></li>
              <li><Link href="#" className="hover:text-[#ff5500] transition-colors">Aura Pad</Link></li>
            </ul>
          </div>
          {/* QUICK LINKS */}
          <div className="p-12 border-r border-[rgba(0,0,0,0.1)]">
            <h4 className="font-mono text-xs font-bold tracking-widest text-[#111]/40 mb-8">QUICK LINKS</h4>
            <ul className="flex flex-col gap-4 font-mono text-sm font-bold text-[#111]">
              <li><Link href="#" className="hover:text-[#ff5500] transition-colors">Home</Link></li>
              <li><Link href="#" className="hover:text-[#ff5500] transition-colors">Apply Now</Link></li>
              <li><Link href="#" className="hover:text-[#ff5500] transition-colors">Help Center</Link></li>
            </ul>
          </div>
          {/* LEGAL */}
          <div className="p-12 border-r border-[rgba(0,0,0,0.1)]">
            <h4 className="font-mono text-xs font-bold tracking-widest text-[#111]/40 mb-8">LEGAL</h4>
            <ul className="flex flex-col gap-4 font-mono text-sm font-bold text-[#111]">
              <li><Link href="#" className="hover:text-[#ff5500] transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-[#ff5500] transition-colors">Cookie Policy</Link></li>
              <li><Link href="#" className="hover:text-[#ff5500] transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          {/* SOCIALS */}
          <div className="p-12 flex flex-col items-end text-right">
            <ul className="flex flex-col gap-4 font-mono text-sm font-bold text-[#111] uppercase tracking-widest">
              <li><Link href="#" className="hover:text-[#ff5500] transition-colors flex items-center gap-2">TELEGRAM ↗</Link></li>
              <li><Link href="#" className="hover:text-[#ff5500] transition-colors flex items-center gap-2">X/TWITTER ↗</Link></li>
              <li><Link href="#" className="hover:text-[#ff5500] transition-colors flex items-center gap-2">LINKEDIN ↗</Link></li>
              <li><Link href="#" className="hover:text-[#ff5500] transition-colors flex items-center gap-2">MEDIUM ↗</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright Line */}
        <div className="p-8 border-b border-[rgba(0,0,0,0.1)] flex justify-between items-center font-mono text-xs text-[#111]/50 tracking-widest">
          <span>© 2026</span>
          <span className="uppercase">ALL RIGHTS RESERVED BY AURA SYSTEMS.</span>
        </div>

        {/* Huge AURA text */}
        <div className="p-8 pb-0 overflow-hidden relative group">
          <div className="corner-accent corner-accent-tl"></div>
          <div className="corner-accent corner-accent-tr"></div>
          <div className="corner-accent corner-accent-bl"></div>
          <div className="corner-accent corner-accent-br"></div>
          
          <h1 className="font-display font-black text-[22vw] leading-[0.7] text-[#111] tracking-tighter text-center transition-colors duration-500 group-hover:text-[#ff5500]">
            AURA
          </h1>
        </div>
      </div>
    </footer>
  );
}

/* ─── ROOT PAGE ────────────────────────────────── */
export default function LandingPage() {
  return (
    <main className="relative text-[#111] selection:bg-[#ff5500] selection:text-white">
      {/* Static Background Grid Layer (Behind WebGL) */}
      <div className="theme-light-grid fixed inset-0 z-[-2] pointer-events-none" />

      {/* Background WebGL Scene (z-[-1]) */}
      <CinematicScene />

      {/* DOM Content Layer */}
      <Nav />
      <HeroSection />
      <FeaturesSection />
      <DataSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
