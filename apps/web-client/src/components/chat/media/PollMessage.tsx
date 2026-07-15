import React from 'react';

interface PollOption {
  id: string;
  text: string;
  votes: string[]; // user ids
}

interface PollProps {
  question: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted?: string; // optionId
}

export const PollMessage = ({ question, options, totalVotes, hasVoted }: PollProps) => {
  return (
    <div className="bg-white border rounded-2xl shadow-sm max-w-[320px] w-full p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600 font-bold text-lg">
          Q
        </div>
        <h4 className="font-semibold text-[15px] text-gray-900 leading-tight">{question}</h4>
      </div>

      <div className="space-y-2">
        {options.map((opt) => {
          const percentage = totalVotes > 0 ? (opt.votes.length / totalVotes) * 100 : 0;
          const isSelected = hasVoted === opt.id;
          
          return (
            <button key={opt.id} className="w-full relative h-10 border rounded-xl overflow-hidden group text-left">
              <div 
                className={`absolute inset-y-0 left-0 transition-all duration-500 ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`} 
                style={{ width: `${percentage}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-3">
                <span className={`text-[14px] truncate flex-1 pr-2 ${isSelected ? 'font-semibold text-blue-700' : 'font-medium text-gray-700'}`}>
                  {opt.text}
                </span>
                {opt.votes.length > 0 && (
                  <div className="flex -space-x-1 mr-1">
                    {opt.votes.slice(0, 3).map((v, i) => (
                      <div key={i} className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white shrink-0" />
                    ))}
                  </div>
                )}
                <span className={`text-xs font-semibold shrink-0 ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                  {opt.votes.length}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      
      <p className="text-xs text-gray-500 mt-3 text-center">{totalVotes} lượt bình chọn</p>
    </div>
  );
};
