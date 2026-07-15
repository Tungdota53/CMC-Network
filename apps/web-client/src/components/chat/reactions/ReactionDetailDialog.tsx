import React from 'react';
import { X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface Reaction {
  userId: string;
  userName: string;
  reaction: string;
}

export const ReactionDetailDialog = ({ reactions, onClose }: { reactions: Reaction[], onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="h-14 flex items-center justify-between px-4 border-b">
          <h3 className="font-semibold text-lg text-gray-900">Cảm xúc</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 max-h-[300px]">
          {reactions.map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
              <Avatar size="md" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900">{r.userName}</h4>
              </div>
              <span className="text-2xl">{r.reaction}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
