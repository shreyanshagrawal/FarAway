"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const [text, setText] = useState("");
  const [tokens, setTokens] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const router = useRouter();

  // Simple token/time estimation
  useEffect(() => {
    const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    const estimatedTokens = Math.floor(wordCount * 1.3);
    setTokens(estimatedTokens);
    
    // Estimate: base 10 seconds + 1 sec per 100 tokens
    if (estimatedTokens === 0) {
      setEstimatedTime(0);
    } else {
      setEstimatedTime(Math.max(15, 10 + Math.floor(estimatedTokens / 100)));
    }
  }, [text]);

  const handleRun = () => {
    if (tokens === 0) return;
    setIsRunning(true);
    // Simulate pipeline initialization delay before routing to the main dashboard
    setTimeout(() => {
      router.push("/app");
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#eeeeee] flex flex-col relative text-[#111] selection:bg-[#ff5500] selection:text-white">
      
      {/* Ultra Minimal Header just to return home */}
      <div className="absolute top-8 left-8 z-10">
        <Link href="/" className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 bg-[#ff5500] flex items-center justify-center" style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}>
            <Settings className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-black text-sm tracking-tighter text-[#111] leading-none">AURA AGENT</span>
        </Link>
      </div>

      <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center p-8 mt-16 sm:mt-0">
        
        {/* The Blank Canvas Input */}
        <div className="w-full flex flex-col gap-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste feedback, upload files, or describe your project."
            className="w-full h-[50vh] sm:h-[60vh] bg-transparent border-none outline-none resize-none font-display font-medium tracking-tight text-3xl md:text-5xl lg:text-6xl text-[#111] placeholder:text-[#111]/15 leading-tight"
            autoFocus
          />

          <div className="flex flex-col gap-4">
            {/* Meta Information Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-t border-[rgba(0,0,0,0.1)]">
              <div className="font-mono text-xs font-bold tracking-widest text-[#111]/40 uppercase">
                Accepted: plain text, .txt, .pdf, .md, .csv, URL
              </div>
              <div className="flex items-center gap-8 font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[#111]/40 uppercase text-xs tracking-widest">Tokens</span>
                  <span className="font-bold text-[#111]">{tokens.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#111]/40 uppercase text-xs tracking-widest">Est. Time</span>
                  <span className="font-bold text-[#ff5500]">~{estimatedTime}s</span>
                </div>
              </div>
            </div>

            {/* Full Width CTA */}
            <button 
              onClick={handleRun}
              disabled={tokens === 0 || isRunning}
              style={{ clipPath: "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)" }}
              className={`w-full py-6 font-mono text-xl font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-4 ${
                tokens === 0 
                  ? "bg-[rgba(0,0,0,0.05)] text-[#111]/20 cursor-not-allowed" 
                  : isRunning
                    ? "bg-[#111] text-white"
                    : "bg-[#ff5500] hover:bg-[#e64d00] text-[#111] hover:text-white shadow-xl shadow-[#ff5500]/20 hover:shadow-[#ff5500]/40"
              }`}
            >
              {isRunning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Initializing Pipeline...
                </>
              ) : (
                "Run Agent"
              )}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
