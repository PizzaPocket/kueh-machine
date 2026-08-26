-- Rename Song.spotifyId to Song.itunesId (data was always iTunes track IDs; column name was never updated after the Spotify -> iTunes switch)
ALTER TABLE "Song" RENAME COLUMN "spotifyId" TO "itunesId";
ALTER INDEX "Song_spotifyId_key" RENAME TO "Song_itunesId_key";
