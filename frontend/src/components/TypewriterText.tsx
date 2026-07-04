"use client";
import React, { useState, useEffect } from 'react';

export default function TypewriterText({ text, speed, onComplete }: { text: string, speed?: number, onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      // Calculate dynamic speed: aim for 3000ms total, cap between 1ms and 50ms per character
      const dynamicSpeed = Math.max(1, Math.min(50, 3000 / Math.max(1, text.length)));
      const activeSpeed = speed !== undefined ? speed : dynamicSpeed;
      
      const timeout = setTimeout(() => {
        setDisplayedText(text.substring(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
      }, activeSpeed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <p className="whitespace-pre-wrap text-sm">{displayedText}</p>;
}
