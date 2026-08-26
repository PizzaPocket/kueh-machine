import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const songs = await prisma.song.findMany({
    select: { id: true, title: true, artist: true, itunesId: true },
  });
  const seen = new Map<string, (typeof songs)[0]>();
  const dupes: (typeof songs)[0][] = [];
  for (const s of songs) {
    const key = `${s.title}||${s.artist}`;
    if (seen.has(key)) dupes.push(s);
    else seen.set(key, s);
  }
  console.log(`Total songs: ${songs.length}`);
  console.log(`Duplicate songs (same title+artist): ${dupes.length}`);
  dupes.forEach((s) =>
    console.log(` - ${s.artist} — ${s.title} (itunesId: ${s.itunesId})`)
  );
  if (dupes.length === 0) console.log("No duplicates found — database is clean!");
  await prisma.$disconnect();
}
main().catch(console.error);
