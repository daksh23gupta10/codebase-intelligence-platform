"use client";

import React, { useState, useEffect, useRef } from 'react';
import RepoTreeGraph from '@/components/RepoTreeGraph';
import NavBar from '@/components/NavBar';
import { motion, AnimatePresence } from 'motion/react';

export default function RepoTreePage() {
  const [allRepos, setAllRepos] = useState<any[]>([]);
  const [selectedRepoName, setSelectedRepoName] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute the file tree to display based on selected repository
  const displayTree = React.useMemo(() => {
    if (selectedRepoName === 'All') return allRepos;
    const repo = allRepos.find((r: any) => r.name === selectedRepoName);
    return repo ? [repo] : [];
  }, [allRepos, selectedRepoName]);

  useEffect(() => {
    // Check auth
    const savedStatus = localStorage.getItem('loginStatus');
    if (savedStatus !== 'authenticated') {
      window.location.href = '/';
      return;
    }

    const fetchFiles = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/files');
        const data = await res.json();
        if (data.status === 'success') {
          setAllRepos(data.files);
        }
      } catch (e) {
        console.error('Failed to fetch file tree:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  return (
    <main className="relative w-full h-screen bg-[#03010A] text-white overflow-hidden font-sans">
      {/* Top Nav */}
      <NavBar />

      {/* Main Graph Container */}
      <div className="absolute inset-0 z-10 flex h-full w-full p-6 pt-24 pb-10">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <div className="w-10 h-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mb-4"></div>
            <p className="text-cyan-300/80 text-xs uppercase tracking-[0.3em] font-semibold animate-pulse">Building Graph Topology...</p>
          </div>
        ) : allRepos.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.2)] mb-2 relative group">
              <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse" />
              <svg className="w-8 h-8 text-cyan-300 relative z-10 transition-transform duration-500 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
              </svg>
            </div>
            <p className="text-gray-300 text-[14px] text-center px-4 font-medium">Your workspace is empty.</p>
            <p className="text-gray-500 text-xs text-center px-4 mb-4">Go back to chat and add a codebase first.</p>
          </div>
        ) : displayTree.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <p className="text-gray-400 text-sm">No data available for this repository.</p>
          </div>
        ) : (
          <div className="w-full h-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden relative">
            
            {/* Repository Selector Dropdown (Moved inside graph container) */}
            <div className="absolute top-4 left-6 z-30" ref={dropdownRef}>
              <div 
                className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-pointer hover:bg-black/80 transition-colors"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Workspace:</span>
                <span className="text-white text-sm font-bold min-w-[120px]">
                  {selectedRepoName === 'All' ? 'All Repositories' : selectedRepoName}
                </span>
                <svg className={`w-4 h-4 text-cyan-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col z-50"
                  >
                    <button
                      className={`px-4 py-3 text-sm text-left transition-colors ${selectedRepoName === 'All' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-gray-300 hover:bg-white/5'}`}
                      onClick={() => {
                        setSelectedRepoName('All');
                        setIsDropdownOpen(false);
                      }}
                    >
                      All Repositories
                    </button>
                    {allRepos.map(repo => (
                      <button
                        key={repo.name}
                        className={`px-4 py-3 text-sm text-left transition-colors ${selectedRepoName === repo.name ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-gray-300 hover:bg-white/5'}`}
                        onClick={() => {
                          setSelectedRepoName(repo.name);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {repo.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Control Instructions Overlay */}
            <div className="absolute top-[72px] left-6 z-20 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-3 text-xs text-gray-300 pointer-events-none">
              <p className="font-bold text-cyan-400 mb-1">Interactive Topology Map</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Scroll to zoom</li>
                <li>Drag background to pan</li>
                <li>Drag nodes to reposition</li>
              </ul>
            </div>
            
            <RepoTreeGraph fileTree={displayTree} />
          </div>
        )}
      </div>
    </main>
  );
}
