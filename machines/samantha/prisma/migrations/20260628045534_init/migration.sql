-- CreateEnum
CREATE TYPE "TriggerCategory" AS ENUM ('TECHNOLOGY', 'INTERNET_CULTURE', 'GAMING', 'ENTERTAINMENT', 'FASHION', 'OTHER');

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "languages" TEXT[],

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "releaseYear" INTEGER NOT NULL,
    "peakYear" INTEGER NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "previewUrl" TEXT,
    "albumArtUrl" TEXT,
    "isForgottenGem" BOOLEAN NOT NULL DEFAULT false,
    "forgottenGemScore" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongRegion" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "peakYearRegional" INTEGER NOT NULL,
    "historicalPopularity" DOUBLE PRECISION NOT NULL,
    "currentPopularity" DOUBLE PRECISION NOT NULL,
    "ageRelevance" DOUBLE PRECISION NOT NULL,
    "memoryTriggerScore" DOUBLE PRECISION NOT NULL,
    "forgottenGemScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SongRegion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryTrigger" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TriggerCategory" NOT NULL,
    "yearStart" INTEGER NOT NULL,
    "yearEnd" INTEGER NOT NULL,
    "countryCode" TEXT,
    "description" TEXT,

    CONSTRAINT "MemoryTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Song_spotifyId_key" ON "Song"("spotifyId");

-- CreateIndex
CREATE UNIQUE INDEX "SongRegion_songId_countryCode_key" ON "SongRegion"("songId", "countryCode");

-- AddForeignKey
ALTER TABLE "SongRegion" ADD CONSTRAINT "SongRegion_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongRegion" ADD CONSTRAINT "SongRegion_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryTrigger" ADD CONSTRAINT "MemoryTrigger_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE SET NULL ON UPDATE CASCADE;
