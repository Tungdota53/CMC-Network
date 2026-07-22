ALTER TABLE "materials"
ADD COLUMN "aiFlashcards" JSONB,
ADD COLUMN "aiQuizQuestions" JSONB,
ADD COLUMN "aiGeneratedAt" TIMESTAMP(3);