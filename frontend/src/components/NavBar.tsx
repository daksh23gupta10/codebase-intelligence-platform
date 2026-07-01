"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import ElectricBorder from './ElectricBorder';

interface NavBarProps {
  onSignOut?: () => void;
}

export default function NavBar({ onSignOut }: NavBarProps) {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    const baseClass = "px-6 py-2 rounded-full border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 inline-block w-full h-full relative z-10 font-medium whitespace-nowrap";
    if (isActive) {
      return `${baseClass} bg-white/10 border-cyan-400/50 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] shadow-[0_0_15px_rgba(6,182,212,0.3)]`;
    } else {
      return `${baseClass} bg-black/40 hover:bg-white/10 border-white/10 text-white hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]`;
    }
  };

  return (
    <nav className="absolute top-0 w-full z-20 px-8 py-4 flex items-center justify-between backdrop-blur-md border-b border-white/5 bg-black/20 animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-3 cursor-pointer group">
        <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.8)] transition-shadow duration-300">
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="18" r="2.5"/>
            <circle cx="6" cy="6" r="2.5"/>
            <circle cx="18" cy="6" r="2.5"/>
            <path d="M18 8.5v1.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8.5"/>
            <path d="M12 12v3.5"/>
          </svg>
        </div>
        <span className="text-lg font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-100 to-cyan-100 uppercase group-hover:from-indigo-300 group-hover:to-cyan-300 transition-all duration-300">
          Codebase AI
        </span>
      </div>
      <div className="flex items-center gap-8 text-sm font-medium">
        <ElectricBorder color="#06b6d4" borderRadius={999} chaos={0.06} displacement={8} style={{ display: 'inline-block' }}>
          <a href="/" className={getLinkClass('/')}>Home</a>
        </ElectricBorder>
        <ElectricBorder color="#06b6d4" borderRadius={999} chaos={0.06} displacement={8} style={{ display: 'inline-block' }}>
          <a href="/tree" className={getLinkClass('/tree')}>Repo Tree</a>
        </ElectricBorder>
        <ElectricBorder color="#06b6d4" borderRadius={999} chaos={0.06} displacement={8} style={{ display: 'inline-block' }}>
          <a href="/about" className={getLinkClass('/about')}>About Us</a>
        </ElectricBorder>
        <div className="w-px h-8 bg-cyan-400 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
        <ElectricBorder color="#06b6d4" borderRadius={999} chaos={0.06} displacement={8} style={{ display: 'inline-block' }}>
          <button 
            onClick={() => {
              if (onSignOut) {
                onSignOut();
              } else {
                localStorage.removeItem('loginStatus');
                window.location.href = '/';
              }
            }} 
            className="px-6 py-2 rounded-full bg-black/40 hover:bg-white/10 border border-white/10 text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 active:scale-95 active:translate-y-0 relative z-10 font-medium whitespace-nowrap"
          >
            Sign Out
          </button>
        </ElectricBorder>
      </div>
    </nav>
  );
}
