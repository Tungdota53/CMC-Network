import React from 'react';

interface ReactionCount {
  icon: string;
  count: number;
}

export const ReactionBadge = ({ reactions }: { reactions: ReactionCount[] }) => {
  if (!reactions || reactions.length === 0) return null;
  
  const total = reactions.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="absolute -bottom-3 right-0 bg-white border border-gray-100 shadow-sm rounded-full px-1.5 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-gray-50 z-10 transition-transform hover:scale-110">
      <div className="flex -space-x-1">
        {reactions.slice(0, 3).map((r, i) => (
          <span key={i} className="text-[12px] bg-white rounded-full leading-none">{r.icon}</span>
        ))}
      </div>
      {total > 1 && <span className="text-[10px] font-bold text-gray-600 pl-0.5 pr-0.5">{total}</span>}
    </div>
  );
};
