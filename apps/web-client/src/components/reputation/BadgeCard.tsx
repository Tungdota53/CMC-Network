import React from 'react';
import * as Icons from 'lucide-react';

interface BadgeCardProps {
  id: string;
  name: string;
  description?: string;
  category: string;
  iconName: string;
  isUnlocked: boolean;
  earnedAt?: string;
  progress?: number;
  requiredPoints?: number;
}

export const BadgeCard = ({ name, description, category, iconName, isUnlocked, earnedAt, progress, requiredPoints }: BadgeCardProps) => {
  // @ts-expect-error lucide dynamic icon lookup is runtime-safe here
  const Icon = Icons[iconName] || Icons.Shield;
  
  const CAT_COLORS: Record<string, string> = {
    MENTOR: isUnlocked ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-400 border-gray-200',
    SKILL: isUnlocked ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-400 border-gray-200',
    CONTRIBUTION: isUnlocked ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-400 border-gray-200',
    SPECIAL: isUnlocked ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-400 border-gray-200',
  };

  const ICON_COLORS: Record<string, string> = {
    MENTOR: 'text-amber-500',
    SKILL: 'text-blue-500',
    CONTRIBUTION: 'text-green-500',
    SPECIAL: 'text-purple-500',
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isUnlocked 
        ? 'bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200' 
        : 'bg-gray-50 border-dashed border-gray-200 opacity-70 grayscale'
    }`}>
      <div className="flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isUnlocked ? CAT_COLORS[category] : 'bg-gray-200 text-gray-400'}`}>
          <Icon className={`w-8 h-8 ${isUnlocked ? ICON_COLORS[category] : 'text-gray-400'}`} />
        </div>
        
        <h4 className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>{name}</h4>
        
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8">{description}</p>
        )}

        {isUnlocked ? (
          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-wider">
            Đã đạt {earnedAt && new Date(earnedAt).toLocaleDateString('vi-VN')}
          </span>
        ) : (
          <div className="w-full mt-auto">
            {progress !== undefined && requiredPoints ? (
              <>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                  <span>{progress}</span>
                  <span>{requiredPoints}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-400 rounded-full" 
                    style={{ width: `${Math.min(100, (progress / requiredPoints) * 100)}%` }} 
                  />
                </div>
              </>
            ) : (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full uppercase tracking-wider">
                Chưa đạt
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
