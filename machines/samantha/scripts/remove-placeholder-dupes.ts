import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const songs = await prisma.song.findMany({
    select: { id: true, title: true, artist: true, itunesId: true, previewUrl: true },
    orderBy: { id: "asc" },
  });

  // Keep the enriched copy (has previewUrl); if neither enriched, keep the first
  const keepIds = new Set<string>();
  const deleteIds: string[] = [];

  // Group by title+artist
  const groups = new Map<string, (typeof songs)>();
  for (const s of songs) {
    const key = `${s.title}||${s.artist}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  for (const group of groups.values()) {
    if (group.length === 1) {
      keepIds.add(group[0].id);
      continue;
    }
    // Prefer the one with a real previewUrl (enriched)
    const enriched = group.find((s) => s.previewUrl);
    const keep = enriched ?? group[0];
    keepIds.add(keep.id);
    for (const s of group) {
      if (s.id !== keep.id) deleteIds.push(s.id);
    }
  }

  console.log(`Songs to delete: ${deleteIds.length}`);
  if (deleteIds.length === 0) { console.log("No duplicates."); return; }

  const { count: srCount } = await prisma.songRegion.deleteMany({
    where: { songId: { in: deleteIds } },
  });
  const { count: songCount } = await prisma.song.deleteMany({
    where: { id: { in: deleteIds } },
  });

  console.log(`Deleted ${srCount} SongRegion rows, ${songCount} Song rows`);

  const remaining = await prisma.song.count();
  const srRemaining = await prisma.songRegion.count();
  console.log(`\n✅ Done. ${remaining} songs, ${srRemaining} song regions remain.`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
