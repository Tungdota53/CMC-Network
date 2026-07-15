import React from 'react';
import { Play } from 'lucide-react';

const waveformHeights = Array.from({ length: 20 }, (_, i) => 20 + ((i * 37) % 80));

export const VoiceMessage = ({ url }: { url: string }) => {
  return (
    <div className="flex items-center gap-3 bg-primary text-white p-3 rounded-3xl min-w-[200px]">
      <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
        <Play className="w-4 h-4 fill-current" />
      </button>
      
      {/* Placeholder Waveform */}
      <div className="flex-1 h-6 flex items-center gap-0.5">
        {waveformHeights.map((height, i) => (
          <div key={i} className="w-1 bg-white/60 rounded-full" style={{ height: `${height}%` }} />
        ))}
      </div>
      
      <span className="text-xs font-medium">0:12</span>
    </div>
  );
};
