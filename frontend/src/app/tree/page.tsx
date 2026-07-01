"use client";

import React, { useState, useEffect } from 'react';
import RepoTreeGraph from '@/components/RepoTreeGraph';
import NavBar from '@/components/NavBar';

export default function RepoTreePage() {
  const [fileTree, setFileTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          setFileTree(data.files);
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
        ) : fileTree.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 grid place-items-center border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.15)] mb-4">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <p className="text-gray-400 text-sm">Your workspace is empty.</p>
            <p className="text-gray-500 text-xs mt-2">Go back to chat and ingest a repository first.</p>
          </div>
        ) : (
          <div className="w-full h-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden relative">
            {/* Control Instructions Overlay */}
            <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-3 text-xs text-gray-300 pointer-events-none">
              <p className="font-bold text-cyan-400 mb-1">Interactive Topology Map</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Scroll to zoom</li>
                <li>Drag background to pan</li>
                <li>Drag nodes to reposition</li>
              </ul>
            </div>
            <RepoTreeGraph fileTree={fileTree} />
          </div>
        )}
      </div>
    </main>
  );
}
