import catalogue from "@/data/catalogue.json";

export type LifeStage = "Childhood" | "Teenage years" | "Young adult";

export function getLifeStage(age: number): LifeStage {
  if (age <= 12) return "Childhood";
  if (age <= 18) return "Teenage years";
  return "Young adult";
}

type SongRegion = (typeof catalogue.songRegions)[number];

export function getTimeline(birthYear: number, countryCode: string, language: string = "en") {
  const startYear = birthYear + 12;
  const endYear = birthYear + 24;

  const songRegions = catalogue.songRegions.filter(
    (sr) =>
      sr.countryCode === countryCode &&
      sr.peakYearRegional >= startYear &&
      sr.peakYearRegional <= endYear &&
      sr.song.language === language
  );
  const triggers = catalogue.memoryTriggers.filter(
    (t) =>
      (t.countryCode === countryCode || t.countryCode === null) &&
      t.yearStart <= endYear &&
      t.yearEnd >= startYear
  );
  const devices = catalogue.deviceEras.filter(
    (d) =>
      (d.countryCode === countryCode || d.countryCode === null) &&
      d.yearStart <= endYear &&
      d.yearEnd >= startYear
  );

  // Group by year
  const yearMap = new Map<number, {
    year: number;
    age: number;
    lifeStage: LifeStage;
    popularSongs: SongRegion[];
    forgottenGems: SongRegion[];
    memoryTriggers: typeof triggers;
    device: (typeof devices)[number] | null;
  }>();

  for (let year = startYear; year <= endYear; year++) {
    const age = year - birthYear;
    const yearsongs = songRegions.filter((sr) => sr.peakYearRegional === year);
    const seen = new Set<string>();
    const byPopularity = [...yearsongs]
      .sort((a, b) => b.historicalPopularity - a.historicalPopularity)
      .filter((sr) => (seen.has(sr.songId) ? false : seen.add(sr.songId) && true));
    const popularSongs = byPopularity.slice(0, 3);
    const popularIds = new Set(popularSongs.map((sr) => sr.songId));

    // Forgotten Gem must be distinct from the 3 popular songs
    const forgottenGem = [...yearsongs]
      .filter((sr) => !popularIds.has(sr.songId))
      .sort((a, b) => b.forgottenGemScore - a.forgottenGemScore)
      .slice(0, 1);

    const yearTriggers = triggers.filter(
      (t) => t.yearStart <= year && t.yearEnd >= year
    );

    const activeDevices = devices.filter((d) => d.yearStart <= year && d.yearEnd >= year);
    const device = activeDevices[activeDevices.length - 1] ?? null;

    yearMap.set(year, {
      year,
      age,
      lifeStage: getLifeStage(age),
      popularSongs,
      forgottenGems: forgottenGem,
      memoryTriggers: yearTriggers,
      device,
    });
  }

  return Array.from(yearMap.values());
}

export type TimelineYear = ReturnType<typeof getTimeline>[number];

// Signature year = year user was 14 (most formative)
export function getSignatureYear(birthYear: number) {
  return birthYear + 14;
}
