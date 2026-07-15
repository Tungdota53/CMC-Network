'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
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
    <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center">
      <h3 className="text-lg font-bold text-foreground mb-6">Flashcard Ôn Tập (AI Generated)</h3>
      
      <div 
        className="w-full max-w-lg aspect-[3/2] perspective-1000 mb-6 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-hover border-2 border-border rounded-2xl flex items-center justify-center p-8 text-center shadow-sm">
            <p className="text-xl font-bold text-foreground">{card?.front || card?.question || 'Mặt trước'}</p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-card border-2 border-primary rounded-2xl flex items-center justify-center p-8 text-center shadow-md">
            <p className="text-lg text-foreground font-medium">{card?.back || card?.answer || 'Mặt sau'}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button onClick={handlePrev} className="p-3 bg-hover text-foreground/80 rounded-full hover:bg-border transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-foreground/60">
          {currentIndex + 1} / {flashcards.length}
        </span>
        <button onClick={handleNext} className="p-3 bg-hover text-foreground/80 rounded-full hover:bg-border transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
