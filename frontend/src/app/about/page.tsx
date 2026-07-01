"use client";

import React, { useState } from 'react';
import ProfileCard from '@/components/ProfileCard';
import ElectricBorder from '@/components/ElectricBorder';
import Ferrofluid from '@/components/Ferrofluid';
import TiltedCard from '@/components/TiltedCard';
import Shuffle from '@/components/Shuffle';
import NavBar from '@/components/NavBar';

const teamMembers = [
  {
    name: "Pratham Jain",
    title: (
      <>
        AI / ML Engineer<br/>
        <span className="text-sm">+</span><br/>
        Frontend Developer
      </>
    ),
    handle: "prathamjain",
    status: "Lead Developer",
    avatarUrl: "/pratham2.jpg",
    isFullImage: true,
    contactText: "GitHub",
    contactUrl: "https://github.com/TeamDDPratham",
    innerGradient: "linear-gradient(145deg, #1a0a2e8c 0%, #06b6d444 100%)",
    behindGlowColor: "rgba(6, 182, 212, 0.5)",
  },
  {
    name: "Daksh Gupta",
    title: (
      <>
        AI / ML Engineer<br/>
        <span className="text-sm">+</span><br/>
        Backend Developer
      </>
    ),
    handle: "dakshgupta",
    status: "Core Contributor",
    avatarUrl: "/member2_photo2.jpg",
    isFullImage: true,
    imageAlignment: "object-top",
    contactText: "GitHub",
    contactUrl: "https://github.com/daksh23gupta10",
    innerGradient: "linear-gradient(145deg, #0a1e2e8c 0%, #6366f144 100%)",
    behindGlowColor: "rgba(99, 102, 241, 0.5)",
  },
  {
    name: "Navya Vermani",
    title: (
      <>
        AI / ML Engineer<br/>
        <span className="text-sm">+</span><br/>
        Research Expert
      </>
    ),
    handle: "navyavermani",
    status: "Core Contributor",
    avatarUrl: "/member3_photo.jpg",
    isFullImage: true,
    contactText: "GitHub",
    innerGradient: "linear-gradient(145deg, #1e0a2e8c 0%, #a855f744 100%)",
    behindGlowColor: "rgba(168, 85, 247, 0.5)",
  }
];

export default function AboutPage() {
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#03010A] text-white font-sans select-none">
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

      {/* Futuristic Nav Bar */}
      <NavBar onSignOut={() => setIsSignOutConfirmOpen(true)} />

      {/* Scrollable content area */}
      <div className="absolute inset-0 z-10 w-full h-full overflow-y-auto pt-[80px] custom-scrollbar">
        {/* Hero section */}
        <div className="flex flex-col items-center pt-16 pb-10 px-8">
          <p className="text-cyan-300/80 text-[10px] uppercase tracking-[0.3em] font-semibold mb-3">The Team Behind</p>
          <Shuffle
            text="Codebase Intelligence"
            tag="h1"
            shuffleDirection="right"
            duration={0.35}
            animationMode="evenodd"
            shuffleTimes={1}
            ease="power3.out"
            stagger={0.03}
            threshold={0.1}
            triggerOnce={true}
            triggerOnHover={true}
            loop={true}
            loopDelay={3}
            respectReducedMotion={true}
            colorFrom="#d946ef"
            colorTo="#22d3ee"
            className="text-3xl md:text-5xl font-black tracking-tighter text-cyan-400 mb-4 pb-2"
          />
          <p className="text-gray-400 text-lg max-w-2xl text-center leading-relaxed">
            We are a team of passionate developers building the next generation of AI-powered code analysis tools. 
            Our mission is to make understanding complex codebases effortless through intelligent graph-based reasoning.
          </p>

          {/* Decorative line */}
          <div className="mt-10 w-48 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
        </div>

        {/* Profile Cards */}
        <div className="flex flex-wrap justify-center gap-12 px-8 py-16 max-w-7xl mx-auto">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="flex flex-col items-center gap-6">
              <ProfileCard
                name={member.name}
                title={member.title}
                handle={member.handle}
                status={member.status}
                avatarUrl={member.avatarUrl}
                isFullImage={member.isFullImage}
                imageAlignment={member.imageAlignment}
                contactText={member.contactText}
                onContactClick={() => {
                  if (member.contactUrl) {
                    window.open(member.contactUrl, '_blank');
                  }
                }}
                showUserInfo={true}
                enableTilt={true}
                enableMobileTilt={false}
                behindGlowEnabled
                behindGlowColor={member.behindGlowColor}
                innerGradient={member.innerGradient}
              />
            </div>
          ))}
        </div>

        {/* Footer section */}
        <div className="flex flex-col items-center pb-20 px-8">
          <div className="w-48 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_12px_rgba(99,102,241,0.6)] mb-10" />
          <p className="text-gray-500 text-sm text-center max-w-lg">
            Built with Next.js, GraphRAG, and a passion for making code intelligence accessible to everyone.
          </p>
        </div>
      </div>

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
                    onClick={() => { localStorage.removeItem('isAuthenticated'); window.location.href = '/'; }}
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
  );
}
