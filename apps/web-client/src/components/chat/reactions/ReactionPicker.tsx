import React from 'react';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export const ReactionPicker = ({ onSelect }: { onSelect: (r: string) => void }) => {
  return (
    <div className="bg-white border rounded-full shadow-lg p-1 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
      {REACTIONS.map((r, i) => (
        <button 
          key={i}
          onClick={() => onSelect(r)}
          className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 rounded-full transition-transform hover:scale-125 focus:outline-none"
        >
          {r}
        </button>
      ))}
    </div>
  );
};
