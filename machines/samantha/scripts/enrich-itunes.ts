import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ItunesResult {
  previewUrl: string | null;
  albumArtUrl: string | null;
  itunesId: string;
}

async function searchItunes(
  title: string,
  artist: string
): Promise<ItunesResult | null> {
  const query = encodeURIComponent(`${title} ${artist}`);
  const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=5&media=music`;

  const retryDelays = [5000, 15000, 45000];
  let res: Response | null = null;

  for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
    try {
      res = await fetch(url);
      if (res.status !== 429 && res.status !== 403) break;
      const delay = retryDelays[attempt] ?? 45000;
      console.log(`\n  Throttled (${res.status}) — waiting ${delay / 1000}s...`);
      await sleep(delay);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ECONNRESET" || code === "ECONNREFUSED") {
        const delay = retryDelays[attempt] ?? 45000;
        console.log(`\n  Connection error — waiting ${delay / 1000}s before retry...`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }

  if (!res || !res.ok) {
    throw new Error(`iTunes search failed: ${res?.status ?? "no response"}`);
  }

  const data = (await res.json()) as {
    results: Array<{
      trackId: number;
      trackName: string;
      artistName: string;
      previewUrl?: string;
      artworkUrl100?: string;
    }>;
  };

  if (data.results.length === 0) return null;

  // Pick the best match: prefer exact title match, otherwise take top result
  const titleLower = title.toLowerCase();
  const artistLower = artist.toLowerCase();
  const exact = data.results.find(
    (r) =>
      r.trackName.toLowerCase().includes(titleLower) &&
      r.artistName.toLowerCase().includes(artistLower)
  );
  const track = exact ?? data.results[0];

  // iTunes artwork comes as 100x100 — swap to 600x600 for better quality
  const albumArtUrl = track.artworkUrl100
    ? track.artworkUrl100.replace("100x100bb", "600x600bb")
    : null;

  return {
    itunesId: String(track.trackId),
    previewUrl: track.previewUrl ?? null,
    albumArtUrl,
  };
}

async function main() {
  console.log("🎵 Starting iTunes enrichment...\n");

  const songs = await prisma.song.findMany({
    select: { id: true, title: true, artist: true, previewUrl: true, albumArtUrl: true },
  });

  const remaining = songs.filter((s) => !s.previewUrl && !s.albumArtUrl);
  const alreadyDone = songs.length - remaining.length;
  if (alreadyDone > 0) {
    console.log(`Skipping ${alreadyDone} already-enriched songs.\n`);
  }

  console.log(`Processing ${remaining.length} songs...\n`);

  let matched = 0;
  let unmatched = 0;
  const unmatchedSongs: string[] = [];

  for (const song of remaining) {
    const result = await searchItunes(song.title, song.artist);
    await sleep(1000);

    if (result) {
      try {
        await prisma.song.update({
          where: { id: song.id },
          data: {
            itunesId: result.itunesId,
            previewUrl: result.previewUrl,
            albumArtUrl: result.albumArtUrl,
          },
        });
        matched++;
        process.stdout.write(`✓ ${song.artist} — ${song.title}\n`);
      } catch (err: unknown) {
        const code = (err as { code?: string }).code;
        if (code === "P2002") {
          // Another song already claimed this iTunes ID — copy its URLs without setting itunesId
          const existing = await prisma.song.findFirst({
            where: { itunesId: result.itunesId },
            select: { previewUrl: true, albumArtUrl: true },
          });
          if (existing?.previewUrl) {
            await prisma.song.update({
              where: { id: song.id },
              data: { previewUrl: existing.previewUrl, albumArtUrl: existing.albumArtUrl },
            });
            matched++;
            process.stdout.write(`✓ ${song.artist} — ${song.title} (shared iTunes track)\n`);
          } else {
            unmatched++;
            unmatchedSongs.push(`  • ${song.artist} — ${song.title} (duplicate iTunes ID)`);
            process.stdout.write(`✗ ${song.artist} — ${song.title} (duplicate iTunes ID, skipped)\n`);
          }
        } else {
          throw err;
        }
      }
    } else {
      unmatched++;
      unmatchedSongs.push(`  • ${song.artist} — ${song.title}`);
      process.stdout.write(`✗ ${song.artist} — ${song.title} (no match)\n`);
    }
  }

  console.log("\n─────────────────────────────────────");
  console.log("Enrichment complete");
  console.log(`  Total:     ${remaining.length}`);
  console.log(`  Matched:   ${matched}`);
  console.log(`  Unmatched: ${unmatched}`);

  if (unmatchedSongs.length > 0) {
    console.log("\nUnmatched songs:");
    unmatchedSongs.forEach((s) => console.log(s));
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
