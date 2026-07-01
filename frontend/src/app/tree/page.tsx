"use client";

import React, { useState, useEffect } from 'react';
import RepoTreeGraph from '@/components/RepoTreeGraph';
import NavBar from '@/components/NavBar';

export default function RepoTreePage() {
  const [allRepos, setAllRepos] = useState<any[]>([]);
  const [selectedRepoName, setSelectedRepoName] = useState<string>('All');
  const [loading, setLoading] = useState(true);

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
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 grid place-items-center border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.15)] mb-4">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <p className="text-gray-400 text-sm">Your workspace is empty.</p>
            <p className="text-gray-500 text-xs mt-2">Go back to chat and ingest a repository first.</p>
          </div>
        ) : displayTree.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <p className="text-gray-400 text-sm">No data available for this repository.</p>
          </div>
        ) : (
          <div className="w-full h-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden relative">
            
            {/* Repository Selector Dropdown (Moved inside graph container) */}
            <div className="absolute top-4 left-6 z-30 flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Workspace:</span>
              <select 
                value={selectedRepoName}
                onChange={(e) => setSelectedRepoName(e.target.value)}
                className="bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer appearance-none pr-6"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2306b6d4%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.2em top 50%', backgroundSize: '0.65em auto' }}
              >
                <option value="All" className="bg-gray-900">All Repositories</option>
                {allRepos.map(repo => (
                  <option key={repo.name} value={repo.name} className="bg-gray-900">{repo.name}</option>
                ))}
              </select>
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
