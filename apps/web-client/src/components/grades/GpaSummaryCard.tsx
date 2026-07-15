'use client';
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const GRADE_TABLE = [
  { min: 8.5, max: 10, gpa4: 4.0, letter: 'A', color: 'bg-green-500' },
  { min: 8.0, max: 8.49, gpa4: 3.5, letter: 'B+', color: 'bg-green-400' },
  { min: 7.0, max: 7.99, gpa4: 3.0, letter: 'B', color: 'bg-blue-500' },
  { min: 6.5, max: 6.99, gpa4: 2.5, letter: 'C+', color: 'bg-yellow-500' },
  { min: 5.5, max: 6.49, gpa4: 2.0, letter: 'C', color: 'bg-orange-500' },
  { min: 5.0, max: 5.49, gpa4: 1.5, letter: 'D+', color: 'bg-orange-600' },
  { min: 4.0, max: 4.99, gpa4: 1.0, letter: 'D', color: 'bg-red-500' },
  { min: 0, max: 3.99, gpa4: 0.0, letter: 'F', color: 'bg-red-700' },
];

function getGradeInfo(grade: number) {
  return GRADE_TABLE.find((t) => grade >= t.min && grade <= t.max) ?? GRADE_TABLE[GRADE_TABLE.length - 1];
}

interface GpaCardProps {
  gpa4: number;
  gpa10: number;
  totalCredits: number;
  prevGpa4?: number;
}

export const GpaSummaryCard = ({ gpa4, gpa10, totalCredits, prevGpa4 }: GpaCardProps) => {
  const diff = prevGpa4 !== undefined ? gpa4 - prevGpa4 : null;
  const pct = (gpa4 / 4.0) * 100;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 text-white p-8 shadow-xl">
      {/* decorative blobs */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5 blur-2xl" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center gap-8">
        {/* Circular progress */}
        <div className="relative w-36 h-36 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - pct / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black">{gpa4.toFixed(2)}</span>
            <span className="text-xs text-white/60 font-semibold">/ 4.0</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1">
          <p className="text-white/60 text-sm font-semibold mb-1">GPA Tích lũy</p>
          <div className="flex items-end gap-3 mb-4">
            <span className="text-5xl font-black">{gpa10.toFixed(2)}</span>
            <span className="text-white/50 text-lg font-bold pb-1">/ 10.0</span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <span className="text-white/60">Tín chỉ tích lũy</span>
              <p className="font-bold text-lg">{totalCredits} TC</p>
            </div>
            {diff !== null && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                <span className="text-white/60">So với kỳ trước</span>
                <p className={`font-bold text-lg flex items-center gap-1 ${diff > 0 ? 'text-green-300' : diff < 0 ? 'text-red-300' : 'text-white'}`}>
                  {diff > 0 ? <TrendingUp className="w-4 h-4" /> : diff < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
