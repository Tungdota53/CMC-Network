'use client';

import React, { useEffect, useRef } from 'react';

// Giả lập expose một hàm để gọi play sound ở mọi nơi (trong thực tế dùng store/context)
export const ChatNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Expose cho demo
    (window as any).playChatSound = () => {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

      if (!AudioContextClass) return;

      const audioContext = audioContextRef.current ?? new AudioContextClass();
      audioContextRef.current = audioContext;

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.12);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
    };

    return () => {
      delete (window as any).playChatSound;
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return null;
};
