'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, BrainCircuit } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const hasMaterialId = (id?: string | null) => Boolean(id && id !== 'undefined' && id !== 'null');

export const QuizViewer = ({ materialId }: { materialId: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['material-quiz', materialId],
    queryFn: async () => {
      try {
        const res = await api.get(`/materials/${materialId}/quiz`);
        return res.data?.data || res.data || [];
      } catch {
        const res = await api.get(`/materials/${materialId}`);
        return res.data?.data?.aiQuizQuestions || res.data?.aiQuizQuestions || [];
      }
    },
    enabled: hasMaterialId(materialId),
    retry: false,
  });

  const questions = Array.isArray(data) ? data : [];

  if (!hasMaterialId(materialId)) return null;

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-foreground/60 font-medium">Đang khởi tạo bài thi AI...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  const q = questions[currentIndex];

  const handleSelect = (idx: number) => {
    if (!isSubmitted) setSelected(idx);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsSubmitted(false);
      setSelected(null);
    }
  };

  return (
    <section className="bg-card rounded-xl border border-border p-5 shadow-sm" aria-labelledby="quiz-title">
      <div className="flex items-center justify-between mb-4">
        <h2 id="quiz-title" className="flex items-center gap-2 text-[17px] font-bold text-foreground"><BrainCircuit className="h-5 w-5 text-primary" /> Kiểm tra kiến thức</h2>
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <p className="text-[15px] font-semibold text-foreground mb-6 leading-relaxed">{q?.question}</p>

      <div className="space-y-3 mb-6">
        {q?.options?.map((opt: string, idx: number) => {
          let statusClass = 'border-border hover:bg-hover';
          if (selected === idx) statusClass = 'border-primary bg-primary/5';
          if (isSubmitted) {
            if (idx === q.answer) statusClass = 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400';
            else if (selected === idx) statusClass = 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400';
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isSubmitted}
              className={`w-full border rounded-lg p-4 cursor-pointer transition-all flex items-center justify-between text-left ${statusClass}`}
            >
              <span className="flex items-center gap-3 font-medium text-[15px]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground/5 text-xs font-bold">{String.fromCharCode(65 + idx)}</span>{opt}</span>
              {isSubmitted && idx === q.answer && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {isSubmitted && selected === idx && idx !== q.answer && <XCircle className="w-5 h-5 text-red-500" />}
            </button>
          );
        })}
      </div>

      {!isSubmitted ? (
        <button 
          onClick={() => setIsSubmitted(true)} 
          disabled={selected === null}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          Kiểm tra đáp án
        </button>
      ) : (
        <div>
          {q?.explanation && (
            <div role="status" className="mb-4 rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm leading-6 text-foreground/80">
              <strong className="text-foreground">Giải thích:</strong> {q.explanation}
            </div>
          )}
        <button 
          onClick={handleNext}
          disabled={currentIndex >= questions.length - 1}
          className="w-full py-3 bg-hover text-foreground rounded-xl font-bold hover:bg-border transition-colors disabled:opacity-50"
        >
          {currentIndex >= questions.length - 1 ? 'Hoàn thành' : 'Câu tiếp theo'}
        </button>
        </div>
      )}
    </section>
  );
};
