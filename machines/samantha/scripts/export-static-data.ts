// Exports the read-only song/era catalogue from Postgres into
// src/data/catalogue.json, which the app reads at build time instead of
// querying Prisma at request time. Re-run after re-seeding or re-enriching
// the database (`npx tsx scripts/export-static-data.ts`).
import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
import path from "path";

loadEnvConfig(process.cwd());

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [songRegions, memoryTriggers, deviceEras] = await Promise.all([
    prisma.songRegion.findMany({
      include: { song: true },
      orderBy: { forgottenGemScore: "desc" },
    }),
    prisma.memoryTrigger.findMany(),
    prisma.deviceEra.findMany({ orderBy: { yearStart: "asc" } }),
  ]);

  const catalogue = {
    songRegions: songRegions.map((sr) => ({
      songId: sr.songId,
      countryCode: sr.countryCode,
      peakYearRegional: sr.peakYearRegional,
      historicalPopularity: sr.historicalPopularity,
      forgottenGemScore: sr.forgottenGemScore,
      song: {
        id: sr.song.id,
        title: sr.song.title,
        artist: sr.song.artist,
        language: sr.song.language,
        previewUrl: sr.song.previewUrl,
        albumArtUrl: sr.song.albumArtUrl,
      },
    })),
    memoryTriggers: memoryTriggers.map((t) => ({
      id: t.id,
      name: t.name,
      yearStart: t.yearStart,
      yearEnd: t.yearEnd,
      countryCode: t.countryCode,
    })),
    deviceEras: deviceEras.map((d) => ({
      id: d.id,
      name: d.name,
      yearStart: d.yearStart,
      yearEnd: d.yearEnd,
      countryCode: d.countryCode,
    })),
  };

  const outPath = path.join(process.cwd(), "src/data/catalogue.json");
  writeFileSync(outPath, JSON.stringify(catalogue));

  const sizeKb = (Buffer.byteLength(JSON.stringify(catalogue)) / 1024).toFixed(1);
  console.log(
    `Wrote ${outPath} (${sizeKb} KB): ${catalogue.songRegions.length} song regions, ` +
      `${catalogue.memoryTriggers.length} memory triggers, ${catalogue.deviceEras.length} device eras.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
