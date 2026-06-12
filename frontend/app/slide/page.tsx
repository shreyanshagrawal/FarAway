"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Slide() {
  const router = useRouter();

  useEffect(() => {
    const handleKeydown = () => router.push("/");
    const handleClick = () => router.push("/");
    
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("click", handleClick);
    
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("click", handleClick);
    };
  }, [router]);

  return (
    <div className="flex h-screen w-screen bg-[#0F0F11] text-white font-sans overflow-hidden cursor-pointer select-none">
      {/* Left Half */}
      <div className="w-1/2 flex flex-col justify-center items-start pl-24 border-r border-gray-800">
        <div className="mb-16">
          <h1 className="text-[96px] leading-none font-bold text-[#7C3AED]">22 hrs</h1>
          <p className="text-[18px] text-gray-400 mt-2">per week — PM processing tasks</p>
        </div>
        
        <div>
          <h1 className="text-[96px] leading-none font-bold text-[#059669]">90 sec</h1>
          <p className="text-[18px] text-gray-400 mt-2">with UAPA</p>
        </div>
      </div>
      
      {/* Right Half */}
      <div className="w-1/2 flex flex-col justify-center items-start pl-24 relative">
        <h1 className="text-6xl font-bold tracking-tight mb-8">UAPA</h1>
        <ul className="text-xl text-gray-300 space-y-4">
          <li className="flex items-center"><span className="mr-3 text-[#7C3AED]">•</span> Multi-agent</li>
          <li className="flex items-center"><span className="mr-3 text-[#7C3AED]">•</span> 6 industries</li>
          <li className="flex items-center"><span className="mr-3 text-[#7C3AED]">•</span> Linear integration</li>
          <li className="flex items-center"><span className="mr-3 text-[#7C3AED]">•</span> Zero config</li>
        </ul>
        
        <div className="absolute bottom-12 left-24">
          <p className="text-[20px] italic text-gray-500">You describe the goal. It builds the roadmap.</p>
        </div>
      </div>
    </div>
  );
}
