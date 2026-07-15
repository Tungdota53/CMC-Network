import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend: number;
  icon: LucideIcon;
  color: 'indigo' | 'green' | 'amber' | 'red' | 'purple';
}

const colorMaps = {
  indigo: 'bg-indigo-100 text-indigo-600',
  green: 'bg-green-100 text-green-600',
  amber: 'bg-amber-100 text-amber-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
};

export const StatsCard = ({ title, value, subtitle, trend, icon: Icon, color }: StatsCardProps) => {
  const isPositive = trend > 0;
  
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMaps[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${isPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div>
        <h3 className="text-gray-500 font-medium text-sm mb-1">{title}</h3>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-black text-gray-900 leading-none">{value}</span>
          <span className="text-xs text-gray-400 font-medium mb-1">{subtitle}</span>
        </div>
      </div>
    </div>
  );
};
