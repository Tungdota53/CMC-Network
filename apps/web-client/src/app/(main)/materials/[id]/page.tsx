import React from 'react';
import { MaterialDetail } from '@/components/materials/MaterialDetail';
import { SubjectQuizCTA } from '@/components/materials/SubjectQuizCTA';
import { AISummary } from '@/components/materials/AISummary';
import { FlashcardViewer } from '@/components/materials/FlashcardViewer';
import { QuizViewer } from '@/components/materials/QuizViewer';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PdfTranslationStudio } from '@/components/materials/PdfTranslationStudio';

type MaterialDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MaterialDetailPage({ params }: MaterialDetailPageProps) {
  const { id } = await params;

  return (
    <div className="max-w-[1120px] w-full pb-20 pt-6 px-4">
      <Link href="/materials" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 font-medium transition-colors">
        <ChevronLeft className="w-5 h-5 mr-1" />
        Quay lại kho tài liệu
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="min-w-0 space-y-6">
          <MaterialDetail id={id} />
          <PdfTranslationStudio />
          <AISummary materialId={id} />
          <FlashcardViewer materialId={id} />
        </div>
        <aside className="space-y-6 xl:sticky xl:top-24">
          <QuizViewer materialId={id} />
          <SubjectQuizCTA />
        </aside>
      </div>
    </div>
  );
}
