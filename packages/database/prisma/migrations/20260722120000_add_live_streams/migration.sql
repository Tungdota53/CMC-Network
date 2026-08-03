CREATE TYPE "LiveStreamStatus" AS ENUM ('LIVE', 'ENDED');

CREATE TABLE "live_streams" (
    "id" UUID NOT NULL,
    "hostId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "roomName" TEXT NOT NULL,
    "status" "LiveStreamStatus" NOT NULL DEFAULT 'LIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "live_streams_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "live_streams_roomName_key" ON "live_streams"("roomName");
CREATE INDEX "live_streams_status_startedAt_idx" ON "live_streams"("status", "startedAt" DESC);
CREATE INDEX "live_streams_hostId_status_idx" ON "live_streams"("hostId", "status");
ALTER TABLE "live_streams" ADD CONSTRAINT "live_streams_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;