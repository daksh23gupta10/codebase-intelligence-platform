"use client";
// @ts-nocheck

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ElectricBorder from '@/components/ElectricBorder';
import TypewriterText from '@/components/TypewriterText';
import TiltedCard from '@/components/TiltedCard';
import Ferrofluid from '@/components/Ferrofluid';
import ClickSpark from '@/components/ClickSpark';
import BorderGlow from '@/components/BorderGlow';
import CountUp from '@/components/CountUp';
import TextPressure from '@/components/TextPressure';
import NavBar from '@/components/NavBar';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'dark' });

const MermaidViewer = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart).then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      }).catch(err => {
        console.error("Mermaid parsing error:", err);
        if (ref.current) ref.current.innerHTML = `<pre class="text-red-400 text-xs">Error parsing diagram: ${err.message}</pre>`;
      });
    }
  }, [chart]);

  return <div ref={ref} className="mermaid flex justify-center w-full my-4 p-4 bg-black/40 border border-white/10 rounded-xl overflow-x-auto overflow-y-hidden custom-scrollbar" />;
};

const MarkdownMessage = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-invert max-w-none text-sm leading-relaxed text-gray-200">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          if (!inline && match && match[1] === 'mermaid') {
            return <MermaidViewer chart={String(children).replace(/\n$/, '')} />;
          }
          return !inline ? (
             <div className="bg-black/60 rounded-md border border-white/10 p-4 my-2 overflow-x-auto custom-scrollbar">
               <code className={className} {...props}>{children}</code>
             </div>
          ) : (
            <code className="bg-white/10 px-1 py-0.5 rounded text-cyan-300 font-mono text-[13px]" {...props}>
              {children}
            </code>
          );
        },
        p({ children }) {
           return <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>;
        },
        ul({ children }) {
           return <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>;
        },
        ol({ children }) {
           return <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>;
        },
        strong({ children }) {
           return <strong className="font-bold text-white">{children}</strong>;
        }
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
};

const FileTreeNode = ({ node, depth = 0 }: { node: any, depth?: number }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const isDir = node.type === 'directory';
  const isRootRepo = isDir && depth === 0;
  const dirColor = isRootRepo ? 'text-pink-400 font-bold' : 'text-indigo-300 font-semibold';

  return (
    <div className="pl-2">
      <div 
        className={`flex items-center justify-start gap-2 py-1.5 px-2 rounded-md hover:bg-white/5 cursor-pointer text-xs ${isDir ? dirColor : 'text-gray-300 hover:text-cyan-300 transition-colors'}`}
        onClick={() => isDir && setIsOpen(!isOpen)}
      >
        {isDir ? (
           isOpen ? <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg> 
                  : <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        ) : (
          <svg className="w-4 h-4 text-cyan-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
        )}
        <span className="truncate mr-auto text-left">{node.name}</span>
      </div>
      {isDir && isOpen && node.children && (
        <div className="border-l border-white/10 ml-2">
          {node.children.map((child: any, idx: number) => <FileTreeNode key={idx} node={child} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [fileTree, setFileTree] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  
  // Chat Sessions State
  const [chatSessions, setChatSessions] = useState([
    {
      id: "init_session",
      name: "New Chat",
      history: [
        { id: "init_msg", role: 'assistant', content: "Hello, I'm your Codebase AI. Add your repository file." }
      ]
    }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState(chatSessions[0]?.id);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  
  // Computed current history
  const currentSession = chatSessions.find(s => s.id === currentSessionId) || chatSessions[0];
  const chatHistory = currentSession ? currentSession.history : [];

  // Helper to append a message to the active chat session
  const appendToChat = (msg: any) => {
    setChatSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        const newHistory = [...s.history, msg];
        let newName = s.name;
        // Auto-rename on first user message
        if (s.history.length === 1 && msg.role === 'user') {
          newName = msg.content.substring(0, 30) + (msg.content.length > 30 ? '...' : '');
        }
        return { ...s, history: newHistory, name: newName };
      }
      return s;
    }));
  };

  const startNewChat = () => {
    const newSessionId = Date.now().toString();
    const newMsgId = newSessionId + "_msg";
    const newSession = {
      id: newSessionId,
      name: "New Chat",
      history: [
        { id: newMsgId, role: 'assistant', content: "Hello, I'm your Codebase AI. Add your repository file." }
      ]
    };
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setIsHistoryDrawerOpen(false);
    setAnimatingMessageId(newMsgId);
    setBeginnerMode(false);
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (chatSessions.length <= 1) return; // Keep at least one chat
    setChatSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(chatSessions.find(s => s.id !== id)?.id || chatSessions[0].id);
    }
  };
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [loginStatus, setLoginStatus] = useState<'unauthenticated' | 'welcoming' | 'authenticated'>('unauthenticated');
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearRepoModal, setShowClearRepoModal] = useState(false);
  const [isDeletingRepo, setIsDeletingRepo] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [animatingMessageId, setAnimatingMessageId] = useState<string | null>("init_msg");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState({ email: false, password: false });
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState('');
  const [beginnerMode, setBeginnerMode] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const passwordInputRef = React.useRef<HTMLInputElement>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const progressBarRef = React.useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);


  const fetchFiles = async () => {
    setIsRefreshing(true);
    const startTime = Date.now();
    try {
      const res = await fetch('http://localhost:8080/api/files');
      const data = await res.json();
      if (data.status === 'success') {
        setFileTree(data.files);
      }
    } catch (e) {
      console.error('Failed to fetch file tree:', e);
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        setTimeout(() => setIsRefreshing(false), 1000 - elapsed);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  const handleDeleteRepo = async (repoName: string) => {
    setIsDeletingRepo(true);
    try {
      const res = await fetch(`http://localhost:8080/api/repos/${repoName}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'success') {
        fetchFiles();
        setShowClearRepoModal(false);
      } else {
        alert('Failed to delete repo: ' + data.message);
      }
    } catch (e) {
      alert('Error deleting repository.');
    } finally {
      setIsDeletingRepo(false);
    }
  };

  const handleDeleteAllRepos = async () => {
    if (fileTree.length === 0) return;
    setIsDeletingRepo(true);
    try {
      const promises = fileTree.map(repo => 
        fetch(`http://localhost:8080/api/repos/${repo.name}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
      fetchFiles();
      setShowClearRepoModal(false);
    } catch (e) {
      alert('Error deleting all repositories.');
    } finally {
      setIsDeletingRepo(false);
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
      const handleKeyDown = (e: any) => {
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
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();

        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.2;
        masterGain.connect(ctx.destination);

        const playTone = (freq: any, type: any, time: any, attackDur: any, sustainDur: any, releaseDur: any, vol: any) => {
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

  const handleFileSelect = (e: any) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query;
    setQuery('');
    appendToChat({ role: 'user', content: userMessage });
    setLoading(true);

    try {
      // Calling the mock backend API
      const res = await fetch('http://localhost:8080/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, beginner_mode: beginnerMode })
      });
      const data = await res.json();
      const newMsgId = Date.now().toString();
      appendToChat({ id: newMsgId, role: 'assistant', content: data.answer });
      setAnimatingMessageId(newMsgId);
    } catch (err) {
      console.error(err);
      const newMsgId = Date.now().toString();
      appendToChat({ id: newMsgId, role: 'assistant', content: 'Error communicating with backend.' });
      setAnimatingMessageId(newMsgId);
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
          className=""
          dpr={1}
          mixBlendMode="screen"
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
            <form noValidate onSubmit={(e: any) => { 
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
                    onChange={(e: any) => { setEmail(e.target.value); if(loginErrors.email) setLoginErrors({...loginErrors, email: false}); }} 
                    onKeyDown={(e: any) => {
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
                  <input ref={passwordInputRef} type="password" value={password} onChange={(e: any) => { setPassword(e.target.value); if(loginErrors.password) setLoginErrors({...loginErrors, password: false}); }} placeholder="••••••••" className={`w-full bg-black/40 backdrop-blur-md border ${loginErrors.password ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/10 focus:border-cyan-400/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)]'} rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none transition-all duration-300 hover:bg-white/10 focus:-translate-y-0.5 pr-10`} />
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
                onStart={() => {}}
                onEnd={() => setLoadingComplete(true)}
                onUpdate={(latest: any) => {
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
          <NavBar onSignOut={() => setIsSignOutConfirmOpen(true)} />

          {/* Dashboard Layout */}
          <div className="absolute inset-0 z-10 flex h-full w-full p-6 pt-24 gap-6 animate-in fade-in zoom-in duration-500 max-w-[1600px] mx-auto">
            
            {/* Sidebar File Explorer */}
            <div className="hidden md:flex w-72 lg:w-80 shrink-0 flex-col h-[85vh] max-h-[1000px] my-auto bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
              <header className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Workspace Files</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Vector Indexed</p>
                </div>
                <div className="flex items-center gap-2">
                    <ElectricBorder color="#06b6d4" borderRadius={4} chaos={0.03} displacement={4} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button onClick={() => setShowIngestModal(true)} className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400/50 text-cyan-400 hover:text-cyan-300 rounded px-2 py-1 transition-all duration-200 shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        <svg className="w-3.5 h-3.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Repo</span>
                      </button>
                    </ElectricBorder>
                  <button onClick={() => setShowClearRepoModal(true)} className="text-red-500/70 hover:text-red-400 hover:drop-shadow-[0_0_12px_rgba(248,113,113,1)] transition-all duration-200 ml-1" title="Clear Repository">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                  <button onClick={fetchFiles} className={`text-blue-500/80 hover:text-blue-400 hover:drop-shadow-[0_0_12px_rgba(96,165,250,1)] transition-all duration-200 ${isRefreshing ? 'animate-spin [animation-direction:reverse]' : ''}`} title="Refresh">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  </button>
                </div>
              </header>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col">
                {fileTree.length === 0 ? (
                  <div className="w-full flex-1 flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center gap-[24px]">
                      <div className="w-[64px] h-[64px] rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 relative group border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
                        <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse" />
                        <svg className="w-[32px] h-[32px] text-cyan-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transition-transform duration-500 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                        </svg>
                      </div>
                      
                      <div className="flex flex-col items-center gap-[8px] text-center">
                        <p className="text-gray-300 text-[15px] font-medium m-0 leading-none">Your workspace is empty.</p>
                        <p className="text-gray-500 text-[12px] m-0 leading-none">Add a codebase to begin analysis.</p>
                      </div>
                      
                      <ElectricBorder color="#06b6d4" borderRadius={9999} chaos={0.03} displacement={5} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button 
                          onClick={() => setShowIngestModal(true)} 
                          className="group relative overflow-hidden rounded-full font-bold text-[12px] bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-all duration-300 flex items-center justify-center px-[24px] py-[10px] border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] active:scale-[0.95]"
                        >
                          <span className="flex items-center gap-[8px] relative z-10">
                            <svg className="w-[14px] h-[14px] transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Repository
                          </span>
                          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                        </button>
                      </ElectricBorder>
                    </div>
                  </div>
                ) : (
                  <div className="pb-2">
                    {fileTree.map((node: any, idx: number) => <FileTreeNode key={idx} node={node} />)}
                  </div>
                )}
              </div>
            </div>

            {/* Main Chat Window */}
            <div className="flex flex-col flex-1 mx-auto my-auto h-[85vh] max-h-[1000px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
              
              <header className="p-6 text-center border-b border-white/5 bg-white/5 relative z-20">
                <motion.button 
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setIsHistoryDrawerOpen(!isHistoryDrawerOpen)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-colors"
                  title="Chat History"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isHistoryDrawerOpen ? (
                      <motion.svg key="close" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></motion.svg>
                    ) : (
                      <motion.svg key="menu" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></motion.svg>
                    )}
                  </AnimatePresence>
                </motion.button>
                <p className="text-cyan-300/80 text-[10px] uppercase tracking-[0.3em] font-semibold">GraphRAG Engine (Mock Mode)</p>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 mt-1">Repository Intelligence</h2>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end gap-2">
                    <ElectricBorder color="#6366f1" borderRadius={999} chaos={0.03} displacement={8} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button 
                        onClick={startNewChat}
                        className="px-4 py-2 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-100 transition-all duration-200 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] active:scale-95 flex items-center justify-center gap-2 text-sm font-medium relative z-10 whitespace-nowrap"
                        title="New Chat"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        <span className="hidden sm:inline">New Chat</span>
                      </button>
                    </ElectricBorder>

                    {/* Beginner Mode Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer group" title="Explain like I'm a beginner">
                      <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${beginnerMode ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-gray-500 group-hover:text-gray-400'}`}>Beginner Mode</span>
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={beginnerMode} onChange={(e: any) => {
                          const isEnabled = e.target.checked;
                          setBeginnerMode(isEnabled);
                          const msgId = Date.now().toString();
                          setAnimatingMessageId(msgId);
                          appendToChat({ id: msgId, role: 'assistant', content: isEnabled ? 'Beginner mode is now enabled! I will keep my explanations simple and easy to understand.' : 'Beginner mode is disabled. I will provide detailed, technical explanations.' });
                        }} />
                        <div className={`block w-9 h-5 rounded-full transition-colors duration-300 ${beginnerMode ? 'bg-cyan-500/20 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-white/5 border border-white/10'}`}></div>
                        <div className={`absolute left-[2px] top-[2px] w-4 h-4 rounded-full transition-transform duration-300 ${beginnerMode ? 'transform translate-x-4 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'bg-gray-400'}`}></div>
                      </div>
                    </label>
                  </div>                
              </header>

              {/* Chat History Dropdown Overlay */}
              <AnimatePresence>
                {isHistoryDrawerOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -15, scale: 0.95, transformOrigin: 'top left' }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-[85px] left-4 w-72 max-h-[60vh] bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl z-30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Chat History</h3>
                    <button onClick={() => setIsHistoryDrawerOpen(false)} className="text-gray-400 hover:text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {chatSessions.map(session => (
                      <div key={session.id} className="relative group flex items-center w-full mb-1">
                        <button
                          onClick={() => { setCurrentSessionId(session.id); setIsHistoryDrawerOpen(false); }}
                          className={`flex-1 text-left p-3 pr-10 rounded-lg transition-colors text-sm truncate ${currentSessionId === session.id ? 'bg-indigo-500/20 text-cyan-300 border border-indigo-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                        >
                          {session.name}
                        </button>
                        {chatSessions.length > 1 && (
                          <button
                            onClick={(e: any) => deleteChat(e, session.id)}
                            className="absolute right-2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete Chat"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 overflow-y-auto px-2 py-6 md:px-4 flex flex-col gap-3 custom-scrollbar">
                {chatHistory.map((msg: any, idx: number) => {
                  const isBot = msg.role === 'assistant';
                  
                  if (isBot) {
                    return (
                      <div key={idx} className="flex w-full justify-start">
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
                            {msg.id && msg.id === animatingMessageId ? (
                              <TypewriterText text={msg.content} speed={8} onComplete={() => setAnimatingMessageId(null)} />
                            ) : (
                              <MarkdownMessage content={msg.content} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="flex w-full justify-end">
                      <div className="flex items-start gap-2 max-w-[90%] ml-auto">
                        {/* User Bubble */}
                        <div className="rounded-2xl p-4 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg relative group bg-white/5 border border-white/10 text-gray-200 hover:shadow-white/10 hover:bg-white/10 rounded-tr-sm text-left">
                          <MarkdownMessage content={msg.content} />
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
                    {attachments.map((file: any, idx: number) => (
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
                  <input
                    type="text"
                    value={query}
                    onChange={(e: any) => setQuery(e.target.value)}
                    placeholder="Ask about the codebase..."
                    className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-full py-4 pl-6 pr-16 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 transition-colors shadow-[0_0_30px_rgba(6,182,212,0.1)]"
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
              onChange={(e: any) => setRepoUrl(e.target.value)} 
              placeholder="https://github.com/user/repo" 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 mb-4"
              disabled={ingesting}
            />
            
            {ingestStatus && (
              <p className={`text-xs mb-4 ${ingestStatus.includes('Error') ? 'text-red-400' : 'text-cyan-400'}`}>{ingestStatus}</p>
            )}
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { 
                  if (ingesting && abortControllerRef.current) {
                    abortControllerRef.current.abort();
                  } else {
                    setShowIngestModal(false); 
                    setIngestStatus(''); 
                  }
                }} 
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
              >
                {ingesting ? 'Cancel Ingestion' : 'Cancel'}
              </button>
              <button 
                onClick={async () => {
                  if (!repoUrl.trim()) return;
                  setIngesting(true);
                  setIngestStatus('Cloning and parsing repository... This may take a minute.');
                  abortControllerRef.current = new AbortController();
                  try {
                    const res = await fetch('http://localhost:8080/api/ingest', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ repo_url_or_path: repoUrl }),
                      signal: abortControllerRef.current.signal
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                      setIngestStatus(`Success! Indexed ${data.files_processed} files. Nodes: ${data.graph_summary.nodes}`);
                      fetchFiles();
                      appendToChat({ role: 'assistant', content: `Success! The repository ${repoUrl} has been ingested and indexed into the workspace. I'm ready to answer questions about it.` });
                      setTimeout(() => {
                        setShowIngestModal(false);
                        setIngestStatus('');
                      }, 3000);
                    } else {
                      setIngestStatus(`Error: ${data.message || 'Failed to process repository.'}`);
                    }
                  } catch (e: any) {
                    if (e.name === 'AbortError') {
                      setIngestStatus('Cancelling ingestion...');
                    } else {
                      setIngestStatus('Error: Could not connect to backend server.');
                    }
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

      {/* Clear Repo Modal */}
      {showClearRepoModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0a0f1c] border border-white/10 p-8 rounded-3xl max-w-md w-full mx-auto my-auto shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Delete Repository</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">Select a repository to permanently delete from the workspace and clear its vector data.</p>
            
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto mb-6 custom-scrollbar pr-2">
              {fileTree.filter(n => n.type === 'directory').length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-60">
                  <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                  <p className="text-sm text-gray-400 italic">No repositories found.</p>
                </div>
              ) : (
                fileTree.filter(n => n.type === 'directory').map((repo: any, idx: number) => (
                  <div key={repo.name} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-3 hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-200 group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-red-400 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                      <span className="text-sm text-gray-200 font-medium truncate group-hover:text-white transition-colors">{repo.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteRepo(repo.name)}
                      disabled={isDeletingRepo}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200 disabled:opacity-50 shrink-0 ml-3"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex w-full mt-4 justify-end gap-3">
              {fileTree.length > 0 && (
                <button 
                  onClick={handleDeleteAllRepos} 
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all duration-200 pointer-events-auto active:scale-95"
                  disabled={isDeletingRepo}
                >
                  {isDeletingRepo ? 'Deleting...' : 'Delete All'}
                </button>
              )}
              <button 
                onClick={() => setShowClearRepoModal(false)} 
                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-200 pointer-events-auto active:scale-95"
                disabled={isDeletingRepo}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {isSignOutConfirmOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <TiltedCard
            className="m-auto"
            containerHeight="400px"
            containerWidth="400px"
            imageHeight="320px"
            imageWidth="384px"
            rotateAmplitude={30}
            scaleOnHover={1.05}
            showMobileWarning={false}
            showTooltip={false}
            displayOverlayContent={true}
            overlayContent={
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-8 w-[384px] h-[320px] shadow-[0_0_50px_rgba(244,63,94,0.15)] transform transition-all animate-in zoom-in-95 duration-200 mx-auto flex flex-col items-center text-center">
                
                <div className="w-16 h-16 rounded-full bg-red-500/10 grid place-items-center mb-5 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)] shrink-0">
                  <svg className="w-8 h-8 text-red-400 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">Ready to leave?</h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">Are you sure you want to sign out? Your repository intelligence and chat history will be preserved securely.</p>
                
                <div className="flex justify-center gap-3 w-full mt-auto">
                  <button 
                    onClick={() => setIsSignOutConfirmOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-200 pointer-events-auto"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => { localStorage.removeItem('isAuthenticated'); setLoginStatus('unauthenticated'); setIsSignOutConfirmOpen(false); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-red-500/80 to-rose-600/80 hover:from-red-500 hover:to-rose-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-200 active:scale-95 pointer-events-auto"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            }
          />
        </div>
      )}

      </main>
    </ClickSpark>
  );
}

