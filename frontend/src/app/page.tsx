"use client";

import React, { useState, useEffect } from 'react';
import Ferrofluid from '@/components/Ferrofluid';
import ClickSpark from '@/components/ClickSpark';
import BorderGlow from '@/components/BorderGlow';
import CountUp from '@/components/CountUp';
import TextPressure from '@/components/TextPressure';

const FileTreeNode = ({ node }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const isDir = node.type === 'directory';

  return (
    <div className="pl-2">
      <div 
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-white/5 cursor-pointer text-xs ${isDir ? 'text-indigo-300 font-semibold' : 'text-gray-300 hover:text-cyan-300 transition-colors'}`}
        onClick={() => isDir && setIsOpen(!isOpen)}
      >
        {isDir ? (
           isOpen ? <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg> 
                  : <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        ) : (
          <svg className="w-4 h-4 text-cyan-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {isDir && isOpen && node.children && (
        <div className="border-l border-white/10 ml-2">
          {node.children.map((child, idx) => <FileTreeNode key={idx} node={child} />)}
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [fileTree, setFileTree] = useState([]);
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: "Hello, I'm your Codebase AI. Add your repository file." }
  ]);
  const [loading, setLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState('unauthenticated'); // 'unauthenticated' | 'welcoming' | 'authenticated'
  const [authChecked, setAuthChecked] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState({ email: false, password: false });
  const [attachments, setAttachments] = useState([]);
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const fileInputRef = React.useRef(null);
  const passwordInputRef = React.useRef(null);
  const progressBarRef = React.useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);

  const fetchFiles = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/files');
      const data = await res.json();
      if (data.status === 'success') {
        setFileTree(data.files);
      }
    } catch (e) {
      console.error('Failed to fetch file tree:', e);
    }
  };

  useEffect(() => {
    if (loginStatus === 'authenticated') {
      fetchFiles();
    }
  }, [loginStatus]);

  // Keyboard shortcut to enter workspace
  useEffect(() => {
    if (loginStatus === 'welcoming' && loadingComplete) {
      const handleKeyDown = (e) => {
        if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          setLoginStatus('authenticated');
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [loginStatus, loadingComplete]);

  // Restore login state on page load
  useEffect(() => {
    setIsMounted(true);
    const savedStatus = localStorage.getItem('loginStatus');
    if (savedStatus === 'authenticated') {
      setLoginStatus('authenticated');
    }
  }, []);

  // Save login state on change
  useEffect(() => {
    if (loginStatus === 'authenticated') {
      localStorage.setItem('loginStatus', 'authenticated');
    } else if (loginStatus === 'unauthenticated') {
      localStorage.removeItem('loginStatus');
    }
  }, [loginStatus]);

  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated');
    if (isAuth === 'true') {
      setLoginStatus('authenticated');
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (loginStatus === 'welcoming') {
      const timer = setTimeout(() => setIsReady(true), 2500);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [loginStatus]);

  useEffect(() => {
    if (loginStatus === 'authenticated') {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();

        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.2;
        masterGain.connect(ctx.destination);

        const playTone = (freq, type, time, attackDur, sustainDur, releaseDur, vol) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          
          osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
          
          gain.gain.setValueAtTime(0, ctx.currentTime + time);
          gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + time + attackDur); // Smooth swell up
          gain.gain.setValueAtTime(vol, ctx.currentTime + time + attackDur + sustainDur); // Hold peak slightly
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + attackDur + sustainDur + releaseDur); // Smooth tail
          
          osc.connect(gain);
          gain.connect(masterGain);
          
          osc.start(ctx.currentTime + time);
          osc.stop(ctx.currentTime + time + attackDur + sustainDur + releaseDur + 0.1);
        };

        // Majestic OS Boot Sequence (Inspired by classic Windows startup sounds)
        // A staggered, warm Eb Major 9 chord swell
        const start = 0.0;
        playTone(311.13, 'sine', start + 0.0, 0.4, 1.0, 3.0, 0.4); // Eb4 (Root)
        playTone(392.00, 'sine', start + 0.1, 0.4, 0.8, 3.0, 0.3); // G4 (3rd)
        playTone(466.16, 'sine', start + 0.2, 0.4, 0.6, 2.5, 0.25); // Bb4 (5th)
        playTone(587.33, 'sine', start + 0.3, 0.5, 0.4, 2.5, 0.2); // D5 (Major 7th)
        playTone(698.46, 'sine', start + 0.4, 0.6, 0.2, 2.0, 0.15); // F5 (9th - for a glassy shimmer)
        
        // A tiny high-end chime to cap the swell
        playTone(932.33, 'sine', start + 0.5, 0.1, 0.1, 2.0, 0.05); // Bb5
      } catch (e) {
        console.log("Audio not supported or blocked");
      }
    }
  }, [loginStatus]);

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query;
    setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Calling the mock backend API
      const res = await fetch('http://localhost:8080/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Error communicating with backend.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <ClickSpark sparkColor='#06B6D4' sparkSize={12} sparkRadius={20} sparkCount={10} duration={600}>
      <main className="relative w-full h-screen bg-[#03010A] text-white overflow-hidden font-sans select-none">
        {/* Background Ferrofluid Animation */}
        <div className="absolute inset-0 z-0 opacity-70 mix-blend-screen">
        <Ferrofluid
          colors={["#00F0FF", "#FF007F", "#8A2BE2"]}
          speed={0.3}
          scale={1.2}
          turbulence={1.5}
          fluidity={0.2}
          rimWidth={0.25}
          sharpness={3}
          shimmer={1.5}
          glow={4.5}
          flowDirection="down"
          opacity={1}
          mouseInteraction={true}
          mouseStrength={1.5}
          mouseRadius={0.4}
        />
      </div>

      {/* Persistent Containers for Smooth Crossfades */}
      <div className={`absolute inset-0 z-10 flex items-center justify-center h-full w-full p-4 transition-all duration-1000 ease-in-out ${loginStatus === 'unauthenticated' ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-150'}`}>
          <BorderGlow
            className="w-full max-w-md mx-auto my-auto backdrop-blur-2xl animate-in fade-in zoom-in duration-500 transition-all ease-out hover:-translate-y-2 hover:shadow-[0_0_80px_rgba(6,182,212,0.3)] group"
            glowColor="190 90 60"
            backgroundColor="rgba(0,0,0,0.4)"
            edgeSensitivity={40}
            glowRadius={60}
            glowIntensity={1.2}
            animated={true}
          >
            <div className="p-8 flex flex-col w-full h-full">
              <div className="text-center mb-8">
              <div className="relative w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)] mb-5 group-hover:scale-110 transition-transform duration-500">
                <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="18" r="2.5"/>
                  <circle cx="6" cy="6" r="2.5"/>
                  <circle cx="18" cy="6" r="2.5"/>
                  <path d="M18 8.5v1.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8.5"/>
                  <path d="M12 12v3.5"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-100 to-cyan-100 uppercase">Codebase AI</h2>
              <p className="text-gray-400 text-sm mt-2">Sign in to access enterprise intelligence</p>
            </div>
            <form noValidate onSubmit={(e) => { 
              e.preventDefault(); 
              const newErrors = { 
                email: !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 
                password: !password.trim() 
              };
              setLoginErrors(newErrors);
              if (newErrors.email || newErrors.password) return;
              
              setLoadingComplete(false);
              setLoginStatus('welcoming');
            }} className="flex flex-col gap-5">
              <div className="relative">
                <label className="block text-[10px] text-cyan-300/80 mb-1.5 ml-1 uppercase tracking-[0.2em] font-semibold">User ID</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => { setEmail(e.target.value); if(loginErrors.email) setLoginErrors({...loginErrors, email: false}); }} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value);
                        if (!isValid) {
                          setLoginErrors(prev => ({ ...prev, email: true }));
                        } else {
                          passwordInputRef.current?.focus();
                        }
                      }
                    }}
                    placeholder="name@company.com" 
                    className={`w-full bg-black/40 backdrop-blur-md border ${loginErrors.email ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/10 focus:border-cyan-400/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)]'} rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none transition-all duration-300 hover:bg-white/10 focus:-translate-y-0.5 pr-10`} 
                  />
                  {loginErrors.email && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-in fade-in zoom-in duration-300" title="Valid email is required">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative">
                <label className="block text-[10px] text-cyan-300/80 mb-1.5 ml-1 uppercase tracking-[0.2em] font-semibold">Password</label>
                <div className="relative">
                  <input ref={passwordInputRef} type="password" value={password} onChange={(e) => { setPassword(e.target.value); if(loginErrors.password) setLoginErrors({...loginErrors, password: false}); }} placeholder="••••••••" className={`w-full bg-black/40 backdrop-blur-md border ${loginErrors.password ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/10 focus:border-cyan-400/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)]'} rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none transition-all duration-300 hover:bg-white/10 focus:-translate-y-0.5 pr-10`} />
                  {loginErrors.password && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-in fade-in zoom-in duration-300" title="Password is required">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold py-3.5 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:scale-[1.03] active:scale-95 transition-all duration-300">
                Authenticate
              </button>
            </form>
            </div>
          </BorderGlow>
      </div>

      <div 
        onClick={() => { if (loadingComplete) setLoginStatus('authenticated'); }}
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center h-full w-full p-4 transition-all duration-1000 ease-in-out ${loadingComplete ? 'cursor-pointer' : ''} ${loginStatus === 'welcoming' ? 'opacity-100 pointer-events-auto scale-100' : (loginStatus === 'unauthenticated' ? 'opacity-0 pointer-events-none scale-75' : 'opacity-0 pointer-events-none scale-150')}`}
      >
          <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.6)] mb-8 animate-pulse">
            <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="18" r="2.5"/>
              <circle cx="6" cy="6" r="2.5"/>
              <circle cx="18" cy="6" r="2.5"/>
              <path d="M18 8.5v1.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8.5"/>
              <path d="M12 12v3.5"/>
            </svg>
          </div>
          <div className="w-full max-w-3xl h-16 md:h-24 flex items-center justify-center mx-auto mb-6">
            <TextPressure
              text="Welcome, Developer"
              flex={false}
              alpha={false}
              stroke={false}
              width={true}
              weight={true}
              italic={true}
              textColor="#e0e7ff"
              minFontSize={36}
            />
          </div>
          <div className="mt-4 mb-6 text-center">
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <CountUp 
                from={0} 
                to={100} 
                duration={2.5} 
                className="text-5xl font-bold text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] tabular-nums" 
                startWhen={loginStatus === 'welcoming'}
                onEnd={() => setLoadingComplete(true)}
                onUpdate={(latest) => {
                  if (progressBarRef.current) {
                    progressBarRef.current.style.width = `${latest}%`;
                  }
                }}
              />
              <span className="text-5xl font-bold text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">%</span>
            </div>
          </div>

          <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden relative shadow-[0_0_10px_rgba(6,182,212,0.3)] mb-4 mx-auto">
            <div 
              ref={progressBarRef}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-indigo-500"
              style={{ width: '0%' }}
            ></div>
          </div>
          
          <div className="min-h-[6rem] flex flex-col items-center justify-start pt-2">
            {!loadingComplete ? (
              <p className="text-cyan-300/80 text-xs uppercase tracking-[0.3em] font-semibold animate-pulse">Initializing Interface...</p>
            ) : (
              <div 
                className="flex flex-col items-center animate-in fade-in zoom-in duration-500 cursor-pointer group gap-3"
                onClick={() => setLoginStatus('authenticated')}
              >
                <p className="text-emerald-400 text-xs uppercase tracking-[0.3em] font-semibold drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">Initialized successfully!</p>
                <p className="text-cyan-400 text-[10px] uppercase tracking-[0.3em] font-bold animate-pulse drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] group-hover:text-white transition-colors duration-300">PRESS SPACE OR CLICK TO ENTER</p>
              </div>
            )}
          </div>
        </div>

      <div className={`absolute inset-0 z-10 w-full h-full transition-all duration-1000 ease-in-out ${loginStatus === 'authenticated' ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-75'}`}>
          {/* Futuristic Nav Bar */}
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
            <div className="flex items-center gap-8 text-sm font-medium text-gray-400">
              <a href="#" className="hover:text-cyan-400 hover:scale-110 active:scale-90 active:text-cyan-300 transition-all duration-200 inline-block">Dashboard</a>
              <a href="#" className="hover:text-cyan-400 hover:scale-110 active:scale-90 active:text-cyan-300 transition-all duration-200 inline-block">Dependency Graph</a>
              <a href="#" className="hover:text-cyan-400 hover:scale-110 active:scale-90 active:text-cyan-300 transition-all duration-200 inline-block">Settings</a>
              <button onClick={() => { localStorage.removeItem('isAuthenticated'); setLoginStatus('unauthenticated'); }} className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 active:scale-95 active:translate-y-0">
                Sign Out
              </button>
            </div>
          </nav>

          {/* Dashboard Layout */}
          <div className="absolute inset-0 z-10 flex h-full w-full p-6 pt-24 gap-6 animate-in fade-in zoom-in duration-500 max-w-[1600px] mx-auto">
            
            {/* Sidebar File Explorer */}
            <div className="hidden md:flex w-72 lg:w-80 shrink-0 flex-col h-[85vh] max-h-[1000px] my-auto bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
              <header className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-white/90">Workspace Files</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Vector Indexed</p>
                </div>
                <button onClick={fetchFiles} className="text-gray-400 hover:text-cyan-400 transition-colors" title="Refresh">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </button>
              </header>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {fileTree.length === 0 ? (
                  <div className="text-center mt-10">
                    <p className="text-gray-500 text-xs italic">No workspace loaded.</p>
                    <button onClick={() => setShowIngestModal(true)} className="mt-4 text-xs text-cyan-400 hover:text-cyan-300 underline">Ingest Repository</button>
                  </div>
                ) : (
                  fileTree.map((node, idx) => <FileTreeNode key={idx} node={node} />)
                )}
              </div>
            </div>

            {/* Main Chat Window */}
            <div className="flex flex-col flex-1 mx-auto my-auto h-[85vh] max-h-[1000px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
              
              <header className="p-6 text-center border-b border-white/5 bg-white/5">
                <p className="text-cyan-300/80 text-[10px] uppercase tracking-[0.3em] font-semibold">GraphRAG Engine (Mock Mode)</p>
                <h2 className="text-xl font-medium text-white/90 mt-1">Repository Intelligence</h2>
              </header>

              <div className="flex-1 overflow-y-auto px-2 py-6 md:px-4 flex flex-col gap-4 custom-scrollbar">
                {chatHistory.map((msg, idx) => {
                  const isBot = msg.role === 'assistant';
                  
                  if (isBot) {
                    return (
                      <div key={idx} className="flex w-full justify-start mb-4">
                        <div className="flex items-start gap-2 max-w-[90%]">
                          {/* Bot Avatar */}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 grid place-items-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)] mt-1">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          </div>

                          {/* Bot Bubble */}
                          <div className="rounded-2xl p-4 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg relative group bg-indigo-600/30 border border-indigo-500/30 text-indigo-50 hover:shadow-indigo-500/20 rounded-tl-sm text-left">
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(msg.content);
                                setCopiedIndex(idx);
                                setTimeout(() => setCopiedIndex(null), 2000);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Copy to clipboard"
                            >
                              {copiedIndex === idx ? (
                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                              )}
                            </button>
                            <p className="whitespace-pre-wrap text-lg">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="flex w-full justify-end mb-4">
                      <div className="flex items-start gap-2 max-w-[90%] ml-auto">
                        {/* User Bubble */}
                        <div className="rounded-2xl p-4 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg relative group bg-white/5 border border-white/10 text-gray-200 hover:shadow-white/10 hover:bg-white/10 rounded-tr-sm text-left">
                          <p className="whitespace-pre-wrap text-lg">{msg.content}</p>
                        </div>

                        {/* User Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 grid place-items-center shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.3)] mt-1">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex w-full justify-start mb-4">
                    <div className="flex items-start gap-2 max-w-[90%]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)] mt-1">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div className="rounded-2xl rounded-tl-sm p-4 backdrop-blur-md bg-indigo-600/30 border border-indigo-500/30 flex items-center gap-1.5 h-[52px]">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-black/20 relative flex flex-col gap-2">
                
                {/* Attachment Preview Area */}
                {attachments.length > 0 && (
                  <div className="flex gap-2 flex-wrap px-2">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs text-indigo-100">
                        <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button type="button" onClick={() => removeAttachment(idx)} className="hover:text-red-400 transition-colors ml-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple 
                    accept=".txt,.pdf,.doc,.docx"
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:bg-white/5 transition-all duration-200 z-10"
                    title="Attach Document"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowIngestModal(true)}
                    className="absolute left-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-400 hover:bg-white/5 transition-all duration-200 z-10"
                    title="Ingest Repository"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                  </button>

                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about the codebase or upload docs..."
                    className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-full py-4 pl-28 pr-16 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 transition-colors shadow-[0_0_30px_rgba(6,182,212,0.1)]"
                  />
                  <button 
                    type="submit" 
                    disabled={loading || (!query.trim() && attachments.length === 0)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-full grid place-items-center transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none z-10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white translate-x-[2px]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

      {/* Ingest Modal */}
      {showIngestModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-white/10 p-8 rounded-2xl max-w-md w-full mx-auto my-auto shadow-[0_0_50px_rgba(99,102,241,0.2)]">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300 mb-2">Ingest Codebase</h2>
            <p className="text-gray-400 text-xs mb-6">Enter a public GitHub URL or absolute local path to parse and index the repository into the Knowledge Graph.</p>
            
            <input 
              type="text" 
              value={repoUrl} 
              onChange={(e) => setRepoUrl(e.target.value)} 
              placeholder="https://github.com/user/repo" 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 mb-4"
              disabled={ingesting}
            />
            
            {ingestStatus && (
              <p className={`text-xs mb-4 ${ingestStatus.includes('Error') ? 'text-red-400' : 'text-cyan-400'}`}>{ingestStatus}</p>
            )}
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setShowIngestModal(false); setIngestStatus(''); }} 
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
                disabled={ingesting}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!repoUrl.trim()) return;
                  setIngesting(true);
                  setIngestStatus('Cloning and parsing repository... This may take a minute.');
                  try {
                    const res = await fetch('http://localhost:8080/api/ingest', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ repo_url_or_path: repoUrl })
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                      setIngestStatus(`Success! Indexed ${data.files_processed} files. Nodes: ${data.graph_summary.nodes}`);
                      fetchFiles();
                      setTimeout(() => {
                        setShowIngestModal(false);
                        setIngestStatus('');
                      }, 3000);
                    } else {
                      setIngestStatus(`Error: ${data.message || 'Failed to process repository.'}`);
                    }
                  } catch (e) {
                    setIngestStatus('Error: Could not connect to backend server.');
                  } finally {
                    setIngesting(false);
                  }
                }}
                disabled={ingesting || !repoUrl.trim()}
                className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-lg text-sm text-white font-semibold hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all disabled:opacity-50"
              >
                {ingesting ? 'Ingesting...' : 'Start Ingestion'}
              </button>
            </div>
          </div>
        </div>
      )}

      </main>
    </ClickSpark>
  );
}
