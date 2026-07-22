'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, RotateCw, Layers3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const hasMaterialId = (id?: string | null) => Boolean(id && id !== 'undefined' && id !== 'null');

export const FlashcardViewer = ({ materialId }: { materialId: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['material-flashcards', materialId],
    queryFn: async () => {
      // Trying to fetch flashcards specifically, or material details if nested
      try {
        const res = await api.get(`/materials/${materialId}/flashcards`);
        return res.data?.data || res.data || [];
      } catch {
        // Fallback to fetch from material details if flashcards endpoint doesn't exist
        const res = await api.get(`/materials/${materialId}`);
        return res.data?.data?.aiFlashcards || res.data?.aiFlashcards || [];
      }
    },
    enabled: hasMaterialId(materialId),
    retry: false,
  });

  const flashcards = Array.isArray(data) ? data : [];

  if (!hasMaterialId(materialId)) return null;

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-foreground/60 font-medium">Đang tạo Flashcard bằng AI...</p>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return null; // Or show a button "Generate Flashcards"
  }

  const card = flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % flashcards.length), 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length), 150);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm" aria-labelledby="flashcard-title">
      <div className="mb-5 flex w-full items-center justify-between gap-3">
        <div>
          <h2 id="flashcard-title" className="flex items-center gap-2 text-lg font-bold text-foreground"><Layers3 className="h-5 w-5 text-primary" /> Flashcard từ tài liệu</h2>
          <p className="mt-1 text-sm text-foreground/60">Chạm vào thẻ để xem đáp án</p>
        </div>
        <span className="text-sm font-semibold text-primary">{currentIndex + 1}/{flashcards.length}</span>
      </div>
      
      <div 
        className="w-full max-w-lg aspect-[3/2] perspective-1000 mb-5 cursor-pointer mx-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
        onClick={() => setIsFlipped(!isFlipped)}
        onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && setIsFlipped(!isFlipped)}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? 'Xem câu hỏi' : 'Xem đáp án'}
      >
        <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-hover border border-border rounded-xl flex flex-col items-center justify-center p-8 text-center">
            <p className="text-xl font-bold text-foreground">{card?.front || card?.question || 'Mặt trước'}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/50"><RotateCw className="h-3.5 w-3.5" /> Xem đáp án</span>
          </div>
          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-primary/5 border border-primary rounded-xl flex items-center justify-center p-8 text-center">
            <p className="text-lg text-foreground font-medium">{card?.back || card?.answer || 'Mặt sau'}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button aria-label="Flashcard trước" onClick={handlePrev} className="p-3 bg-hover text-foreground/80 rounded-full hover:bg-border transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-foreground/60">
          {currentIndex + 1} / {flashcards.length}
        </span>
        <button aria-label="Flashcard tiếp theo" onClick={handleNext} className="p-3 bg-hover text-foreground/80 rounded-full hover:bg-border transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};
