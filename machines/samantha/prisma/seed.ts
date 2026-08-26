import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, TriggerCategory } from "@prisma/client";
// DeviceEra is defined below

loadEnvConfig(process.cwd());

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Countries ────────────────────────────────────────────────────────────
  const countries = [
    { code: "MY", name: "Malaysia", region: "Southeast Asia", languages: ["en", "ms", "zh"] },
    { code: "SG", name: "Singapore", region: "Southeast Asia", languages: ["en", "ms", "zh", "ta"] },
    { code: "PH", name: "Philippines", region: "Southeast Asia", languages: ["en", "fil"] },
    { code: "US", name: "United States", region: "North America", languages: ["en"] },
    { code: "GB", name: "United Kingdom", region: "Europe", languages: ["en"] },
    { code: "AU", name: "Australia", region: "Oceania", languages: ["en"] },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country,
    });
  }
  console.log(`✓ ${countries.length} countries seeded`);

  // ─── Songs ────────────────────────────────────────────────────────────────
  // iTunes IDs to be populated via iTunes Search API enrichment.
  // Format: placeholder_{index} — replace with real IDs before launch.
  const songs = [
    // ── ENGLISH SONGS (2000–2015) ─────────────────────────────────────────────
    // 2000
    { title: "Breathe", artist: "Faith Hill", releaseYear: 1999, peakYear: 2000, itunesId: "placeholder_001", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "Hanging by a Moment", artist: "Lifehouse", releaseYear: 2000, peakYear: 2001, itunesId: "placeholder_002", language: "en", isForgottenGem: true, forgottenGemScore: 74 },
    { title: "All the Small Things", artist: "Blink-182", releaseYear: 1999, peakYear: 2000, itunesId: "placeholder_003", language: "en", isForgottenGem: false, forgottenGemScore: 35 },
    // 2001
    { title: "Drops of Jupiter", artist: "Train", releaseYear: 2001, peakYear: 2001, itunesId: "placeholder_004", language: "en", isForgottenGem: true, forgottenGemScore: 72 },
    { title: "Hanging", artist: "Active Child", releaseYear: 2001, peakYear: 2001, itunesId: "placeholder_005", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "Fallin'", artist: "Alicia Keys", releaseYear: 2001, peakYear: 2001, itunesId: "placeholder_006", language: "en", isForgottenGem: false, forgottenGemScore: 22 },
    // 2002
    { title: "Without Me", artist: "Eminem", releaseYear: 2002, peakYear: 2002, itunesId: "placeholder_007", language: "en", isForgottenGem: false, forgottenGemScore: 25 },
    { title: "Complicated", artist: "Avril Lavigne", releaseYear: 2002, peakYear: 2002, itunesId: "placeholder_008", language: "en", isForgottenGem: false, forgottenGemScore: 30 },
    { title: "In da Club", artist: "50 Cent", releaseYear: 2002, peakYear: 2003, itunesId: "placeholder_009", language: "en", isForgottenGem: false, forgottenGemScore: 28 },
    // 2003
    { title: "Crazy in Love", artist: "Beyoncé", releaseYear: 2003, peakYear: 2003, itunesId: "placeholder_010", language: "en", isForgottenGem: false, forgottenGemScore: 15 },
    { title: "Beautiful", artist: "Christina Aguilera", releaseYear: 2002, peakYear: 2003, itunesId: "placeholder_011", language: "en", isForgottenGem: true, forgottenGemScore: 68 },
    { title: "Bring Me to Life", artist: "Evanescence", releaseYear: 2003, peakYear: 2003, itunesId: "placeholder_012", language: "en", isForgottenGem: false, forgottenGemScore: 40 },
    // 2004
    { title: "Yeah!", artist: "Usher", releaseYear: 2004, peakYear: 2004, itunesId: "placeholder_013", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "Leave (Get Out)", artist: "JoJo", releaseYear: 2004, peakYear: 2004, itunesId: "placeholder_014", language: "en", isForgottenGem: true, forgottenGemScore: 88 },
    { title: "Beautiful Soul", artist: "Jesse McCartney", releaseYear: 2004, peakYear: 2004, itunesId: "placeholder_015", language: "en", isForgottenGem: true, forgottenGemScore: 85 },
    { title: "Toxic", artist: "Britney Spears", releaseYear: 2004, peakYear: 2004, itunesId: "placeholder_016", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    // 2005
    { title: "Hollaback Girl", artist: "Gwen Stefani", releaseYear: 2005, peakYear: 2005, itunesId: "placeholder_017", language: "en", isForgottenGem: true, forgottenGemScore: 76 },
    { title: "We Belong Together", artist: "Mariah Carey", releaseYear: 2005, peakYear: 2005, itunesId: "placeholder_018", language: "en", isForgottenGem: true, forgottenGemScore: 71 },
    { title: "Since U Been Gone", artist: "Kelly Clarkson", releaseYear: 2004, peakYear: 2005, itunesId: "placeholder_019", language: "en", isForgottenGem: false, forgottenGemScore: 42 },
    // 2006
    { title: "Unwritten", artist: "Natasha Bedingfield", releaseYear: 2004, peakYear: 2006, itunesId: "placeholder_020", language: "en", isForgottenGem: true, forgottenGemScore: 90 },
    { title: "SexyBack", artist: "Justin Timberlake", releaseYear: 2006, peakYear: 2006, itunesId: "placeholder_021", language: "en", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "Hips Don't Lie", artist: "Shakira", releaseYear: 2006, peakYear: 2006, itunesId: "placeholder_022", language: "en", isForgottenGem: false, forgottenGemScore: 25 },
    // 2007
    { title: "Umbrella", artist: "Rihanna", releaseYear: 2007, peakYear: 2007, itunesId: "placeholder_023", language: "en", isForgottenGem: false, forgottenGemScore: 12 },
    { title: "Bad Day", artist: "Daniel Powter", releaseYear: 2005, peakYear: 2007, itunesId: "placeholder_024", language: "en", isForgottenGem: true, forgottenGemScore: 87 },
    { title: "Beautiful Girls", artist: "Sean Kingston", releaseYear: 2007, peakYear: 2007, itunesId: "placeholder_025", language: "en", isForgottenGem: true, forgottenGemScore: 82 },
    { title: "Welcome to the Black Parade", artist: "My Chemical Romance", releaseYear: 2006, peakYear: 2007, itunesId: "placeholder_026", language: "en", isForgottenGem: false, forgottenGemScore: 38 },
    // 2008
    { title: "Bleeding Love", artist: "Leona Lewis", releaseYear: 2007, peakYear: 2008, itunesId: "placeholder_027", language: "en", isForgottenGem: true, forgottenGemScore: 79 },
    { title: "Love Story", artist: "Taylor Swift", releaseYear: 2008, peakYear: 2008, itunesId: "placeholder_028", language: "en", isForgottenGem: false, forgottenGemScore: 15 },
    { title: "Viva la Vida", artist: "Coldplay", releaseYear: 2008, peakYear: 2008, itunesId: "placeholder_029", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    // 2009
    { title: "Poker Face", artist: "Lady Gaga", releaseYear: 2008, peakYear: 2009, itunesId: "placeholder_030", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "I Gotta Feeling", artist: "Black Eyed Peas", releaseYear: 2009, peakYear: 2009, itunesId: "placeholder_031", language: "en", isForgottenGem: true, forgottenGemScore: 65 },
    { title: "Fireflies", artist: "Owl City", releaseYear: 2009, peakYear: 2009, itunesId: "placeholder_032", language: "en", isForgottenGem: true, forgottenGemScore: 92 },
    // 2010
    { title: "Dynamite", artist: "Taio Cruz", releaseYear: 2010, peakYear: 2010, itunesId: "placeholder_033", language: "en", isForgottenGem: true, forgottenGemScore: 78 },
    { title: "Teenage Dream", artist: "Katy Perry", releaseYear: 2010, peakYear: 2010, itunesId: "placeholder_034", language: "en", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "Just the Way You Are", artist: "Bruno Mars", releaseYear: 2010, peakYear: 2010, itunesId: "placeholder_035", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    // 2011
    { title: "Rolling in the Deep", artist: "Adele", releaseYear: 2010, peakYear: 2011, itunesId: "placeholder_036", language: "en", isForgottenGem: false, forgottenGemScore: 10 },
    { title: "Party Rock Anthem", artist: "LMFAO", releaseYear: 2011, peakYear: 2011, itunesId: "placeholder_037", language: "en", isForgottenGem: true, forgottenGemScore: 83 },
    { title: "Someone Like You", artist: "Adele", releaseYear: 2011, peakYear: 2011, itunesId: "placeholder_038", language: "en", isForgottenGem: false, forgottenGemScore: 12 },
    // 2012
    { title: "Somebody That I Used to Know", artist: "Gotye", releaseYear: 2011, peakYear: 2012, itunesId: "placeholder_039", language: "en", isForgottenGem: true, forgottenGemScore: 80 },
    { title: "Call Me Maybe", artist: "Carly Rae Jepsen", releaseYear: 2011, peakYear: 2012, itunesId: "placeholder_040", language: "en", isForgottenGem: true, forgottenGemScore: 77 },
    { title: "Gangnam Style", artist: "PSY", releaseYear: 2012, peakYear: 2012, itunesId: "placeholder_041", language: "en", isForgottenGem: false, forgottenGemScore: 30 },
    // 2013
    { title: "Blurred Lines", artist: "Robin Thicke", releaseYear: 2013, peakYear: 2013, itunesId: "placeholder_042", language: "en", isForgottenGem: false, forgottenGemScore: 28 },
    { title: "Royals", artist: "Lorde", releaseYear: 2013, peakYear: 2013, itunesId: "placeholder_043", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "Counting Stars", artist: "OneRepublic", releaseYear: 2013, peakYear: 2013, itunesId: "placeholder_044", language: "en", isForgottenGem: true, forgottenGemScore: 70 },
    // 2014
    { title: "Happy", artist: "Pharrell Williams", releaseYear: 2013, peakYear: 2014, itunesId: "placeholder_045", language: "en", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "All About That Bass", artist: "Meghan Trainor", releaseYear: 2014, peakYear: 2014, itunesId: "placeholder_046", language: "en", isForgottenGem: true, forgottenGemScore: 75 },
    { title: "Shake It Off", artist: "Taylor Swift", releaseYear: 2014, peakYear: 2014, itunesId: "placeholder_047", language: "en", isForgottenGem: false, forgottenGemScore: 15 },
    // 2015
    { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", releaseYear: 2014, peakYear: 2015, itunesId: "placeholder_048", language: "en", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "Cheerleader", artist: "OMI", releaseYear: 2012, peakYear: 2015, itunesId: "placeholder_049", language: "en", isForgottenGem: true, forgottenGemScore: 86 },
    { title: "See You Again", artist: "Wiz Khalifa", releaseYear: 2015, peakYear: 2015, itunesId: "placeholder_050", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    // Extra English songs to ensure ≥6 per year for MY (so forgotten gem slot is always fillable)
    // 2000
    { title: "Oops!... I Did It Again", artist: "Britney Spears", releaseYear: 2000, peakYear: 2000, itunesId: "placeholder_051", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "Say My Name", artist: "Destiny's Child", releaseYear: 1999, peakYear: 2000, itunesId: "placeholder_052", language: "en", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "Beautiful Day", artist: "U2", releaseYear: 2000, peakYear: 2000, itunesId: "placeholder_053", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "Sandstorm", artist: "Darude", releaseYear: 1999, peakYear: 2000, itunesId: "placeholder_054", language: "en", isForgottenGem: true, forgottenGemScore: 91 },
    // 2001
    { title: "Lady Marmalade", artist: "Christina Aguilera / Pink / Lil' Kim / Mýa", releaseYear: 2001, peakYear: 2001, itunesId: "placeholder_055", language: "en", isForgottenGem: false, forgottenGemScore: 25 },
    { title: "Ms. Jackson", artist: "OutKast", releaseYear: 2000, peakYear: 2001, itunesId: "placeholder_056", language: "en", isForgottenGem: true, forgottenGemScore: 84 },
    { title: "U Remind Me", artist: "Usher", releaseYear: 2001, peakYear: 2001, itunesId: "placeholder_057", language: "en", isForgottenGem: true, forgottenGemScore: 78 },
    // 2002
    { title: "Lose Yourself", artist: "Eminem", releaseYear: 2002, peakYear: 2002, itunesId: "placeholder_058", language: "en", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "A Thousand Miles", artist: "Vanessa Carlton", releaseYear: 2001, peakYear: 2002, itunesId: "placeholder_059", language: "en", isForgottenGem: true, forgottenGemScore: 89 },
    { title: "Sk8er Boi", artist: "Avril Lavigne", releaseYear: 2002, peakYear: 2002, itunesId: "placeholder_060", language: "en", isForgottenGem: false, forgottenGemScore: 30 },
    { title: "Cry Me a River", artist: "Justin Timberlake", releaseYear: 2002, peakYear: 2002, itunesId: "placeholder_061", language: "en", isForgottenGem: false, forgottenGemScore: 28 },
    // 2003
    { title: "Milkshake", artist: "Kelis", releaseYear: 2003, peakYear: 2003, itunesId: "placeholder_062", language: "en", isForgottenGem: true, forgottenGemScore: 82 },
    { title: "Get Busy", artist: "Sean Paul", releaseYear: 2003, peakYear: 2003, itunesId: "placeholder_063", language: "en", isForgottenGem: false, forgottenGemScore: 26 },
    { title: "Stacy's Mom", artist: "Fountains of Wayne", releaseYear: 2003, peakYear: 2003, itunesId: "placeholder_064", language: "en", isForgottenGem: true, forgottenGemScore: 86 },
    // 2004
    { title: "If I Ain't Got You", artist: "Alicia Keys", releaseYear: 2003, peakYear: 2004, itunesId: "placeholder_065", language: "en", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "Numb", artist: "Linkin Park", releaseYear: 2003, peakYear: 2004, itunesId: "placeholder_066", language: "en", isForgottenGem: false, forgottenGemScore: 24 },
    // 2005
    { title: "Gold Digger", artist: "Kanye West", releaseYear: 2005, peakYear: 2005, itunesId: "placeholder_067", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "1 Thing", artist: "Amerie", releaseYear: 2005, peakYear: 2005, itunesId: "placeholder_068", language: "en", isForgottenGem: true, forgottenGemScore: 88 },
    { title: "Sugar We're Goin Down", artist: "Fall Out Boy", releaseYear: 2005, peakYear: 2005, itunesId: "placeholder_069", language: "en", isForgottenGem: false, forgottenGemScore: 32 },
    // 2006
    { title: "Temperature", artist: "Sean Paul", releaseYear: 2005, peakYear: 2006, itunesId: "placeholder_070", language: "en", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "Crazy", artist: "Gnarls Barkley", releaseYear: 2006, peakYear: 2006, itunesId: "placeholder_071", language: "en", isForgottenGem: false, forgottenGemScore: 28 },
    { title: "Irreplaceable", artist: "Beyoncé", releaseYear: 2006, peakYear: 2006, itunesId: "placeholder_072", language: "en", isForgottenGem: false, forgottenGemScore: 16 },
    // 2007
    { title: "Big Girls Don't Cry", artist: "Fergie", releaseYear: 2007, peakYear: 2007, itunesId: "placeholder_073", language: "en", isForgottenGem: true, forgottenGemScore: 80 },
    { title: "Girlfriend", artist: "Avril Lavigne", releaseYear: 2007, peakYear: 2007, itunesId: "placeholder_074", language: "en", isForgottenGem: false, forgottenGemScore: 26 },
    // 2008
    { title: "Single Ladies", artist: "Beyoncé", releaseYear: 2008, peakYear: 2008, itunesId: "placeholder_075", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "I Kissed a Girl", artist: "Katy Perry", releaseYear: 2008, peakYear: 2008, itunesId: "placeholder_076", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "4 Minutes", artist: "Madonna ft. Justin Timberlake", releaseYear: 2008, peakYear: 2008, itunesId: "placeholder_077", language: "en", isForgottenGem: true, forgottenGemScore: 76 },
    // 2009
    { title: "You Belong with Me", artist: "Taylor Swift", releaseYear: 2008, peakYear: 2009, itunesId: "placeholder_078", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "Halo", artist: "Beyoncé", releaseYear: 2008, peakYear: 2009, itunesId: "placeholder_079", language: "en", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "Bad Romance", artist: "Lady Gaga", releaseYear: 2009, peakYear: 2009, itunesId: "placeholder_080", language: "en", isForgottenGem: false, forgottenGemScore: 16 },
    // 2010
    { title: "California Gurls", artist: "Katy Perry ft. Snoop Dogg", releaseYear: 2010, peakYear: 2010, itunesId: "placeholder_081", language: "en", isForgottenGem: true, forgottenGemScore: 74 },
    { title: "OMG", artist: "Usher ft. will.i.am", releaseYear: 2010, peakYear: 2010, itunesId: "placeholder_082", language: "en", isForgottenGem: false, forgottenGemScore: 26 },
    { title: "Love the Way You Lie", artist: "Eminem ft. Rihanna", releaseYear: 2010, peakYear: 2010, itunesId: "placeholder_083", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    // 2011
    { title: "What Makes You Beautiful", artist: "One Direction", releaseYear: 2011, peakYear: 2011, itunesId: "placeholder_084", language: "en", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "We Found Love", artist: "Rihanna ft. Calvin Harris", releaseYear: 2011, peakYear: 2011, itunesId: "placeholder_085", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "The Edge of Glory", artist: "Lady Gaga", releaseYear: 2011, peakYear: 2011, itunesId: "placeholder_086", language: "en", isForgottenGem: true, forgottenGemScore: 79 },
    // 2012
    { title: "Payphone", artist: "Maroon 5", releaseYear: 2012, peakYear: 2012, itunesId: "placeholder_087", language: "en", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "Starships", artist: "Nicki Minaj", releaseYear: 2012, peakYear: 2012, itunesId: "placeholder_088", language: "en", isForgottenGem: true, forgottenGemScore: 77 },
    { title: "Die Young", artist: "Ke$ha", releaseYear: 2012, peakYear: 2012, itunesId: "placeholder_089", language: "en", isForgottenGem: true, forgottenGemScore: 81 },
    // 2013
    { title: "Roar", artist: "Katy Perry", releaseYear: 2013, peakYear: 2013, itunesId: "placeholder_090", language: "en", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "Can't Hold Us", artist: "Macklemore & Ryan Lewis", releaseYear: 2012, peakYear: 2013, itunesId: "placeholder_091", language: "en", isForgottenGem: true, forgottenGemScore: 84 },
    { title: "Stay", artist: "Rihanna ft. Mikky Ekko", releaseYear: 2012, peakYear: 2013, itunesId: "placeholder_092", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    // 2014
    { title: "Fancy", artist: "Iggy Azalea ft. Charli XCX", releaseYear: 2014, peakYear: 2014, itunesId: "placeholder_093", language: "en", isForgottenGem: true, forgottenGemScore: 82 },
    { title: "Problem", artist: "Ariana Grande ft. Iggy Azalea", releaseYear: 2014, peakYear: 2014, itunesId: "placeholder_094", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "Take Me to Church", artist: "Hozier", releaseYear: 2014, peakYear: 2014, itunesId: "placeholder_095", language: "en", isForgottenGem: false, forgottenGemScore: 22 },
    // 2015
    { title: "Can't Feel My Face", artist: "The Weeknd", releaseYear: 2015, peakYear: 2015, itunesId: "placeholder_096", language: "en", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "Lean On", artist: "Major Lazer ft. MØ", releaseYear: 2015, peakYear: 2015, itunesId: "placeholder_097", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "Stressed Out", artist: "Twenty One Pilots", releaseYear: 2015, peakYear: 2015, itunesId: "placeholder_098", language: "en", isForgottenGem: true, forgottenGemScore: 78 },
    // ── ENGLISH SONGS (2016–2017) ─────────────────────────────────────────────
    // 2016
    { title: "One Dance", artist: "Drake", releaseYear: 2016, peakYear: 2016, itunesId: "placeholder_e16_01", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "Closer", artist: "The Chainsmokers ft. Halsey", releaseYear: 2016, peakYear: 2016, itunesId: "placeholder_e16_02", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "Love Yourself", artist: "Justin Bieber", releaseYear: 2015, peakYear: 2016, itunesId: "placeholder_e16_03", language: "en", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "Work", artist: "Rihanna ft. Drake", releaseYear: 2016, peakYear: 2016, itunesId: "placeholder_e16_04", language: "en", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "Don't Let Me Down", artist: "The Chainsmokers ft. Daya", releaseYear: 2016, peakYear: 2016, itunesId: "placeholder_e16_05", language: "en", isForgottenGem: true, forgottenGemScore: 80 },
    { title: "Sorry", artist: "Justin Bieber", releaseYear: 2015, peakYear: 2016, itunesId: "placeholder_e16_06", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "7 Years", artist: "Lukas Graham", releaseYear: 2015, peakYear: 2016, itunesId: "placeholder_e16_07", language: "en", isForgottenGem: true, forgottenGemScore: 75 },
    // 2017
    { title: "Shape of You", artist: "Ed Sheeran", releaseYear: 2017, peakYear: 2017, itunesId: "placeholder_e17_01", language: "en", isForgottenGem: false, forgottenGemScore: 12 },
    { title: "Despacito", artist: "Luis Fonsi ft. Daddy Yankee & Justin Bieber", releaseYear: 2017, peakYear: 2017, itunesId: "placeholder_e17_02", language: "en", isForgottenGem: false, forgottenGemScore: 15 },
    { title: "Something Just Like This", artist: "The Chainsmokers & Coldplay", releaseYear: 2017, peakYear: 2017, itunesId: "placeholder_e17_03", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "HUMBLE.", artist: "Kendrick Lamar", releaseYear: 2017, peakYear: 2017, itunesId: "placeholder_e17_04", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "That's What I Like", artist: "Bruno Mars", releaseYear: 2016, peakYear: 2017, itunesId: "placeholder_e17_05", language: "en", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "Issues", artist: "Julia Michaels", releaseYear: 2017, peakYear: 2017, itunesId: "placeholder_e17_06", language: "en", isForgottenGem: true, forgottenGemScore: 82 },
    { title: "Slow Hands", artist: "Niall Horan", releaseYear: 2017, peakYear: 2017, itunesId: "placeholder_e17_07", language: "en", isForgottenGem: true, forgottenGemScore: 78 },
    // ── ENGLISH SONGS (2018–2026) ─────────────────────────────────────────────
    // 2018
    { title: "God's Plan", artist: "Drake", releaseYear: 2018, peakYear: 2018, itunesId: "en_18_01", language: "en", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "In My Feelings", artist: "Drake", releaseYear: 2018, peakYear: 2018, itunesId: "en_18_02", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "Shallow", artist: "Lady Gaga & Bradley Cooper", releaseYear: 2018, peakYear: 2018, itunesId: "en_18_03", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "Better Now", artist: "Post Malone", releaseYear: 2018, peakYear: 2018, itunesId: "en_18_04", language: "en", isForgottenGem: true, forgottenGemScore: 72 },
    // 2019
    { title: "Old Town Road", artist: "Lil Nas X ft. Billy Ray Cyrus", releaseYear: 2019, peakYear: 2019, itunesId: "en_19_01", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "Bad Guy", artist: "Billie Eilish", releaseYear: 2019, peakYear: 2019, itunesId: "en_19_02", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "Sunflower", artist: "Post Malone & Swae Lee", releaseYear: 2018, peakYear: 2019, itunesId: "en_19_03", language: "en", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "Without Me", artist: "Halsey", releaseYear: 2018, peakYear: 2019, itunesId: "en_19_04", language: "en", isForgottenGem: true, forgottenGemScore: 68 },
    // 2020
    { title: "Blinding Lights", artist: "The Weeknd", releaseYear: 2019, peakYear: 2020, itunesId: "en_20_01", language: "en", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "Watermelon Sugar", artist: "Harry Styles", releaseYear: 2019, peakYear: 2020, itunesId: "en_20_02", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "Dynamite", artist: "BTS", releaseYear: 2020, peakYear: 2020, itunesId: "en_20_03", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "Positions", artist: "Ariana Grande", releaseYear: 2020, peakYear: 2020, itunesId: "en_20_04", language: "en", isForgottenGem: true, forgottenGemScore: 60 },
    // 2021
    { title: "drivers license", artist: "Olivia Rodrigo", releaseYear: 2021, peakYear: 2021, itunesId: "en_21_01", language: "en", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "Butter", artist: "BTS", releaseYear: 2021, peakYear: 2021, itunesId: "en_21_02", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "Levitating", artist: "Dua Lipa", releaseYear: 2020, peakYear: 2021, itunesId: "en_21_03", language: "en", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "good 4 u", artist: "Olivia Rodrigo", releaseYear: 2021, peakYear: 2021, itunesId: "en_21_04", language: "en", isForgottenGem: true, forgottenGemScore: 58 },
    // 2022
    { title: "As It Was", artist: "Harry Styles", releaseYear: 2022, peakYear: 2022, itunesId: "en_22_01", language: "en", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "Heat Waves", artist: "Glass Animals", releaseYear: 2020, peakYear: 2022, itunesId: "en_22_02", language: "en", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "About Damn Time", artist: "Lizzo", releaseYear: 2022, peakYear: 2022, itunesId: "en_22_03", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "Running Up That Hill", artist: "Kate Bush", releaseYear: 1985, peakYear: 2022, itunesId: "en_22_04", language: "en", isForgottenGem: true, forgottenGemScore: 75 },
    // 2023
    { title: "Flowers", artist: "Miley Cyrus", releaseYear: 2023, peakYear: 2023, itunesId: "en_23_01", language: "en", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "Cruel Summer", artist: "Taylor Swift", releaseYear: 2019, peakYear: 2023, itunesId: "en_23_02", language: "en", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "Calm Down", artist: "Rema & Selena Gomez", releaseYear: 2022, peakYear: 2023, itunesId: "en_23_03", language: "en", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "Escapism.", artist: "RAYE ft. 070 Shake", releaseYear: 2022, peakYear: 2023, itunesId: "en_23_04", language: "en", isForgottenGem: true, forgottenGemScore: 62 },
    // 2024
    { title: "Espresso", artist: "Sabrina Carpenter", releaseYear: 2024, peakYear: 2024, itunesId: "en_24_01", language: "en", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "Too Sweet", artist: "Hozier", releaseYear: 2024, peakYear: 2024, itunesId: "en_24_02", language: "en", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "Die With A Smile", artist: "Lady Gaga & Bruno Mars", releaseYear: 2024, peakYear: 2024, itunesId: "en_24_03", language: "en", isForgottenGem: false, forgottenGemScore: 15 },
    { title: "End of Beginning", artist: "Djo", releaseYear: 2022, peakYear: 2024, itunesId: "en_24_04", language: "en", isForgottenGem: true, forgottenGemScore: 65 },
    // 2025
    { title: "APT.", artist: "ROSÉ & Bruno Mars", releaseYear: 2024, peakYear: 2025, itunesId: "en_25_01", language: "en", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "Birds of a Feather", artist: "Billie Eilish", releaseYear: 2024, peakYear: 2025, itunesId: "en_25_02", language: "en", isForgottenGem: false, forgottenGemScore: 15 },
    { title: "Luther", artist: "Kendrick Lamar & SZA", releaseYear: 2024, peakYear: 2025, itunesId: "en_25_03", language: "en", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "Beautiful Things", artist: "Benson Boone", releaseYear: 2024, peakYear: 2025, itunesId: "en_25_04", language: "en", isForgottenGem: true, forgottenGemScore: 58 },
    // 2026
    { title: "Please Please Please", artist: "Sabrina Carpenter", releaseYear: 2024, peakYear: 2026, itunesId: "en_26_01", language: "en", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "Pink Pony Club", artist: "Chappell Roan", releaseYear: 2023, peakYear: 2026, itunesId: "en_26_02", language: "en", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "Lose Control", artist: "Teddy Swims", releaseYear: 2023, peakYear: 2026, itunesId: "en_26_03", language: "en", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "Stick Season", artist: "Noah Kahan", releaseYear: 2022, peakYear: 2026, itunesId: "en_26_04", language: "en", isForgottenGem: true, forgottenGemScore: 62 },
    // ── MANDARIN SONGS (2000–2017) ────────────────────────────────────────────
    // 2000
    { title: "爱你", artist: "孙燕姿", releaseYear: 2000, peakYear: 2000, itunesId: "zh_001", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "天黑黑", artist: "孙燕姿", releaseYear: 2000, peakYear: 2000, itunesId: "zh_002", language: "zh", isForgottenGem: true, forgottenGemScore: 80 },
    { title: "流星雨", artist: "F4", releaseYear: 2000, peakYear: 2001, itunesId: "zh_003", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "勇气", artist: "梁静茹", releaseYear: 2000, peakYear: 2001, itunesId: "zh_004", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "我的心里只有你没有他", artist: "张惠妹", releaseYear: 2000, peakYear: 2000, itunesId: "zh_005", language: "zh", isForgottenGem: true, forgottenGemScore: 75 },
    { title: "爱情转移", artist: "陈奕迅", releaseYear: 2000, peakYear: 2000, itunesId: "zh_006", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "明天我要嫁给你了", artist: "梁文音", releaseYear: 2000, peakYear: 2000, itunesId: "zh_007", language: "zh", isForgottenGem: true, forgottenGemScore: 72 },
    // 2001
    { title: "双截棍", artist: "周杰伦", releaseYear: 2001, peakYear: 2001, itunesId: "zh_008", language: "zh", isForgottenGem: false, forgottenGemScore: 15 },
    { title: "爱在西元前", artist: "周杰伦", releaseYear: 2001, peakYear: 2001, itunesId: "zh_009", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "Super Star", artist: "S.H.E", releaseYear: 2001, peakYear: 2002, itunesId: "zh_010", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "志明与春娇", artist: "五月天", releaseYear: 2001, peakYear: 2001, itunesId: "zh_011", language: "zh", isForgottenGem: true, forgottenGemScore: 84 },
    { title: "呼吸", artist: "孙燕姿", releaseYear: 2001, peakYear: 2001, itunesId: "zh_012", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "开始懂了", artist: "孙燕姿", releaseYear: 2001, peakYear: 2002, itunesId: "zh_013", language: "zh", isForgottenGem: true, forgottenGemScore: 77 },
    { title: "流星", artist: "飞轮海", releaseYear: 2001, peakYear: 2001, itunesId: "zh_014", language: "zh", isForgottenGem: false, forgottenGemScore: 14 },
    // 2002
    { title: "简单爱", artist: "周杰伦", releaseYear: 2001, peakYear: 2002, itunesId: "zh_015", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "你快乐所以我快乐", artist: "王力宏", releaseYear: 2002, peakYear: 2002, itunesId: "zh_016", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "恋人未满", artist: "S.H.E", releaseYear: 2002, peakYear: 2002, itunesId: "zh_017", language: "zh", isForgottenGem: true, forgottenGemScore: 88 },
    { title: "我不难过", artist: "梁静茹", releaseYear: 2002, peakYear: 2002, itunesId: "zh_018", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "算什么男人", artist: "周杰伦", releaseYear: 2002, peakYear: 2002, itunesId: "zh_019", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "波斯猫", artist: "S.H.E", releaseYear: 2002, peakYear: 2003, itunesId: "zh_020", language: "zh", isForgottenGem: true, forgottenGemScore: 82 },
    { title: "不想长大", artist: "S.H.E", releaseYear: 2002, peakYear: 2002, itunesId: "zh_021", language: "zh", isForgottenGem: false, forgottenGemScore: 24 },
    // 2003
    { title: "以父之名", artist: "周杰伦", releaseYear: 2003, peakYear: 2003, itunesId: "zh_022", language: "zh", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "你存在的意义", artist: "孙燕姿", releaseYear: 2003, peakYear: 2003, itunesId: "zh_023", language: "zh", isForgottenGem: true, forgottenGemScore: 85 },
    { title: "心中的日月", artist: "王力宏", releaseYear: 2003, peakYear: 2003, itunesId: "zh_024", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "爱情万岁", artist: "蔡依林", releaseYear: 2003, peakYear: 2003, itunesId: "zh_025", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "摩天大楼", artist: "陈奕迅", releaseYear: 2003, peakYear: 2003, itunesId: "zh_026", language: "zh", isForgottenGem: true, forgottenGemScore: 78 },
    { title: "第一天", artist: "孙燕姿", releaseYear: 2003, peakYear: 2003, itunesId: "zh_027", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "记得", artist: "张惠妹", releaseYear: 2003, peakYear: 2003, itunesId: "zh_028", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    // 2004
    { title: "七里香", artist: "周杰伦", releaseYear: 2004, peakYear: 2004, itunesId: "zh_029", language: "zh", isForgottenGem: false, forgottenGemScore: 12 },
    { title: "江南", artist: "林俊傑", releaseYear: 2004, peakYear: 2004, itunesId: "zh_030", language: "zh", isForgottenGem: false, forgottenGemScore: 15 },
    { title: "我呢", artist: "蔡依林", releaseYear: 2004, peakYear: 2004, itunesId: "zh_031", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "幸运星", artist: "S.H.E", releaseYear: 2004, peakYear: 2004, itunesId: "zh_032", language: "zh", isForgottenGem: true, forgottenGemScore: 83 },
    { title: "分开以后", artist: "王力宏", releaseYear: 2004, peakYear: 2004, itunesId: "zh_033", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "我记得", artist: "张韶涵", releaseYear: 2004, peakYear: 2004, itunesId: "zh_034", language: "zh", isForgottenGem: true, forgottenGemScore: 79 },
    { title: "星晴", artist: "周杰伦", releaseYear: 2004, peakYear: 2004, itunesId: "zh_035", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    // 2005
    { title: "夜曲", artist: "周杰伦", releaseYear: 2005, peakYear: 2005, itunesId: "zh_036", language: "zh", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "曹操", artist: "林俊傑", releaseYear: 2004, peakYear: 2005, itunesId: "zh_037", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "爱你没错", artist: "S.H.E", releaseYear: 2005, peakYear: 2005, itunesId: "zh_038", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "欧若拉", artist: "张韶涵", releaseYear: 2005, peakYear: 2005, itunesId: "zh_039", language: "zh", isForgottenGem: true, forgottenGemScore: 86 },
    { title: "痴心绝对", artist: "李圣杰", releaseYear: 2005, peakYear: 2005, itunesId: "zh_040", language: "zh", isForgottenGem: true, forgottenGemScore: 90 },
    { title: "说爱你", artist: "蔡依林", releaseYear: 2004, peakYear: 2005, itunesId: "zh_041", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "发如雪", artist: "周杰伦", releaseYear: 2005, peakYear: 2005, itunesId: "zh_042", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    // 2006
    { title: "千里之外", artist: "周杰伦 ft. 费玉清", releaseYear: 2006, peakYear: 2006, itunesId: "zh_043", language: "zh", isForgottenGem: false, forgottenGemScore: 13 },
    { title: "小酒窝", artist: "林俊傑 ft. 蔡卓妍", releaseYear: 2006, peakYear: 2006, itunesId: "zh_044", language: "zh", isForgottenGem: false, forgottenGemScore: 15 },
    { title: "我不配", artist: "周杰伦", releaseYear: 2006, peakYear: 2006, itunesId: "zh_045", language: "zh", isForgottenGem: true, forgottenGemScore: 82 },
    { title: "头发乱了", artist: "蔡健雅", releaseYear: 2006, peakYear: 2006, itunesId: "zh_046", language: "zh", isForgottenGem: true, forgottenGemScore: 87 },
    { title: "香水有毒", artist: "胡杨林", releaseYear: 2006, peakYear: 2006, itunesId: "zh_047", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "我不会唱歌", artist: "光良", releaseYear: 2006, peakYear: 2006, itunesId: "zh_048", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "幸福了 然后呢", artist: "弦子", releaseYear: 2006, peakYear: 2007, itunesId: "zh_049", language: "zh", isForgottenGem: true, forgottenGemScore: 76 },
    // 2007
    { title: "彩虹", artist: "周杰伦", releaseYear: 2007, peakYear: 2007, itunesId: "zh_050", language: "zh", isForgottenGem: false, forgottenGemScore: 15 },
    { title: "需要人陪", artist: "林俊傑", releaseYear: 2006, peakYear: 2007, itunesId: "zh_051", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "我们的爱", artist: "飞轮海", releaseYear: 2007, peakYear: 2007, itunesId: "zh_052", language: "zh", isForgottenGem: true, forgottenGemScore: 84 },
    { title: "爱你等于爱自己", artist: "王力宏", releaseYear: 2007, peakYear: 2007, itunesId: "zh_053", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "你快乐了 吗", artist: "蔡依林", releaseYear: 2007, peakYear: 2007, itunesId: "zh_054", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "爱不单行", artist: "S.H.E", releaseYear: 2007, peakYear: 2007, itunesId: "zh_055", language: "zh", isForgottenGem: true, forgottenGemScore: 80 },
    { title: "我的麦克风", artist: "梁静茹", releaseYear: 2007, peakYear: 2007, itunesId: "zh_056", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    // 2008
    { title: "稻香", artist: "周杰伦", releaseYear: 2008, peakYear: 2008, itunesId: "zh_057", language: "zh", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "我相信", artist: "杨培安", releaseYear: 2008, peakYear: 2008, itunesId: "zh_058", language: "zh", isForgottenGem: true, forgottenGemScore: 85 },
    { title: "给我一个理由忘记", artist: "A-Lin", releaseYear: 2008, peakYear: 2008, itunesId: "zh_059", language: "zh", isForgottenGem: true, forgottenGemScore: 88 },
    { title: "不该", artist: "林俊傑 ft. 曹格", releaseYear: 2008, peakYear: 2008, itunesId: "zh_060", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "回到过去", artist: "周杰伦", releaseYear: 2008, peakYear: 2008, itunesId: "zh_061", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "我不愿让你一个人", artist: "五月天", releaseYear: 2008, peakYear: 2008, itunesId: "zh_062", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "手心的蔷薇", artist: "王力宏", releaseYear: 2008, peakYear: 2008, itunesId: "zh_063", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    // 2009
    { title: "你不是真正的快乐", artist: "五月天", releaseYear: 2009, peakYear: 2009, itunesId: "zh_064", language: "zh", isForgottenGem: false, forgottenGemScore: 12 },
    { title: "被风吹过的夏天", artist: "林俊傑 ft. 丁当", releaseYear: 2009, peakYear: 2009, itunesId: "zh_065", language: "zh", isForgottenGem: true, forgottenGemScore: 82 },
    { title: "如果你也听说", artist: "梁静茹", releaseYear: 2009, peakYear: 2009, itunesId: "zh_066", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "说好的幸福呢", artist: "周杰伦", releaseYear: 2008, peakYear: 2009, itunesId: "zh_067", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "你啊你啊", artist: "韦礼安", releaseYear: 2009, peakYear: 2009, itunesId: "zh_068", language: "zh", isForgottenGem: true, forgottenGemScore: 86 },
    { title: "记得", artist: "林俊傑", releaseYear: 2009, peakYear: 2009, itunesId: "zh_069", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "想你的夜", artist: "关喆", releaseYear: 2009, peakYear: 2009, itunesId: "zh_070", language: "zh", isForgottenGem: true, forgottenGemScore: 78 },
    // 2010
    { title: "烟花易冷", artist: "周杰伦", releaseYear: 2010, peakYear: 2010, itunesId: "zh_071", language: "zh", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "如果雨之后", artist: "周杰伦", releaseYear: 2010, peakYear: 2010, itunesId: "zh_072", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "可惜不是你", artist: "梁静茹", releaseYear: 2010, peakYear: 2010, itunesId: "zh_073", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "给我一个吻", artist: "张含韵", releaseYear: 2010, peakYear: 2010, itunesId: "zh_074", language: "zh", isForgottenGem: true, forgottenGemScore: 80 },
    { title: "我的歌声里", artist: "曲婉婷", releaseYear: 2010, peakYear: 2011, itunesId: "zh_075", language: "zh", isForgottenGem: true, forgottenGemScore: 85 },
    { title: "不想睡", artist: "五月天", releaseYear: 2010, peakYear: 2010, itunesId: "zh_076", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "江南 Style", artist: "林俊傑", releaseYear: 2010, peakYear: 2010, itunesId: "zh_077", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    // 2011
    { title: "倔强", artist: "五月天", releaseYear: 2003, peakYear: 2011, itunesId: "zh_078", language: "zh", isForgottenGem: false, forgottenGemScore: 10 },
    { title: "你是我心内的一首歌", artist: "林俊傑 ft. 蔡健雅", releaseYear: 2011, peakYear: 2011, itunesId: "zh_079", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "花花世界", artist: "王力宏", releaseYear: 2011, peakYear: 2011, itunesId: "zh_080", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "如果当时", artist: "卢广仲", releaseYear: 2011, peakYear: 2011, itunesId: "zh_081", language: "zh", isForgottenGem: true, forgottenGemScore: 82 },
    { title: "你不来, 我不老", artist: "魏如昀", releaseYear: 2011, peakYear: 2011, itunesId: "zh_082", language: "zh", isForgottenGem: true, forgottenGemScore: 84 },
    { title: "末日之恋", artist: "蔡依林", releaseYear: 2011, peakYear: 2011, itunesId: "zh_083", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "圣所", artist: "五月天", releaseYear: 2011, peakYear: 2011, itunesId: "zh_084", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    // 2012
    { title: "泡沫", artist: "邓紫棋", releaseYear: 2012, peakYear: 2012, itunesId: "zh_085", language: "zh", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "温柔", artist: "五月天", releaseYear: 2001, peakYear: 2012, itunesId: "zh_086", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "你啊你啊 (新版)", artist: "韦礼安", releaseYear: 2012, peakYear: 2012, itunesId: "zh_087", language: "zh", isForgottenGem: true, forgottenGemScore: 80 },
    { title: "眼色", artist: "邓紫棋", releaseYear: 2012, peakYear: 2012, itunesId: "zh_088", language: "zh", isForgottenGem: true, forgottenGemScore: 78 },
    { title: "给我一个理由", artist: "林俊傑", releaseYear: 2012, peakYear: 2012, itunesId: "zh_089", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "痛哭的人", artist: "林忆莲", releaseYear: 2012, peakYear: 2012, itunesId: "zh_090", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "想爱你爱到底", artist: "萧亚轩", releaseYear: 2012, peakYear: 2012, itunesId: "zh_091", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    // 2013
    { title: "告白气球", artist: "周杰伦", releaseYear: 2013, peakYear: 2016, itunesId: "zh_092", language: "zh", isForgottenGem: false, forgottenGemScore: 12 },
    { title: "童话镇", artist: "陈一发儿", releaseYear: 2013, peakYear: 2014, itunesId: "zh_093", language: "zh", isForgottenGem: true, forgottenGemScore: 88 },
    { title: "算了吧", artist: "邓紫棋", releaseYear: 2013, peakYear: 2013, itunesId: "zh_094", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "喜欢你", artist: "四叶草", releaseYear: 2013, peakYear: 2013, itunesId: "zh_095", language: "zh", isForgottenGem: true, forgottenGemScore: 82 },
    { title: "那些年", artist: "胡夏", releaseYear: 2011, peakYear: 2013, itunesId: "zh_096", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "平凡之路", artist: "朴树", releaseYear: 2013, peakYear: 2014, itunesId: "zh_097", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "我好像在哪见过你", artist: "卢广仲", releaseYear: 2013, peakYear: 2013, itunesId: "zh_098", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    // 2014
    { title: "演员", artist: "薛之谦", releaseYear: 2014, peakYear: 2015, itunesId: "zh_099", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "小幸运", artist: "田馥甄 (Hebe)", releaseYear: 2014, peakYear: 2015, itunesId: "zh_100", language: "zh", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "不将就", artist: "李荣浩", releaseYear: 2014, peakYear: 2014, itunesId: "zh_101", language: "zh", isForgottenGem: true, forgottenGemScore: 80 },
    { title: "爱情没你不行", artist: "孙燕姿", releaseYear: 2014, peakYear: 2014, itunesId: "zh_102", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "时间都去哪儿了", artist: "王铮亮", releaseYear: 2014, peakYear: 2014, itunesId: "zh_103", language: "zh", isForgottenGem: true, forgottenGemScore: 84 },
    { title: "就是现在", artist: "邓紫棋", releaseYear: 2014, peakYear: 2014, itunesId: "zh_104", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "我好", artist: "林俊傑", releaseYear: 2014, peakYear: 2014, itunesId: "zh_105", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    // 2015
    { title: "光年之外", artist: "邓紫棋", releaseYear: 2015, peakYear: 2016, itunesId: "zh_106", language: "zh", isForgottenGem: false, forgottenGemScore: 13 },
    { title: "爱我还是他", artist: "刘若英", releaseYear: 2015, peakYear: 2015, itunesId: "zh_107", language: "zh", isForgottenGem: true, forgottenGemScore: 80 },
    { title: "修炼爱情", artist: "林俊傑", releaseYear: 2015, peakYear: 2015, itunesId: "zh_108", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "岁月神偷", artist: "羽泉", releaseYear: 2015, peakYear: 2015, itunesId: "zh_109", language: "zh", isForgottenGem: true, forgottenGemScore: 82 },
    { title: "倒数", artist: "蔡依林", releaseYear: 2015, peakYear: 2015, itunesId: "zh_110", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "可能否", artist: "米什卡", releaseYear: 2015, peakYear: 2015, itunesId: "zh_111", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "一次就好", artist: "杨宗纬 ft. 陈瑞", releaseYear: 2015, peakYear: 2015, itunesId: "zh_112", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    // 2016
    { title: "模特", artist: "李荣浩", releaseYear: 2016, peakYear: 2016, itunesId: "zh_113", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "说散就散", artist: "袁娅维", releaseYear: 2016, peakYear: 2016, itunesId: "zh_114", language: "zh", isForgottenGem: true, forgottenGemScore: 84 },
    { title: "好好 (超好)", artist: "五月天", releaseYear: 2016, peakYear: 2016, itunesId: "zh_115", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "怎么了", artist: "薛之谦", releaseYear: 2016, peakYear: 2016, itunesId: "zh_116", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "关键词", artist: "林俊傑", releaseYear: 2016, peakYear: 2016, itunesId: "zh_117", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "最近大家好吗", artist: "曲婉婷", releaseYear: 2016, peakYear: 2016, itunesId: "zh_118", language: "zh", isForgottenGem: true, forgottenGemScore: 78 },
    { title: "笑纳", artist: "毛不易", releaseYear: 2016, peakYear: 2017, itunesId: "zh_119", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    // 2017
    { title: "说好不哭", artist: "周杰伦 ft. 五月天阿信", releaseYear: 2017, peakYear: 2019, itunesId: "zh_120", language: "zh", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "玫瑰少年", artist: "蔡依林", releaseYear: 2017, peakYear: 2018, itunesId: "zh_121", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "那女孩对我说", artist: "五月天", releaseYear: 2017, peakYear: 2017, itunesId: "zh_122", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "一荤一素", artist: "毛不易", releaseYear: 2017, peakYear: 2017, itunesId: "zh_123", language: "zh", isForgottenGem: true, forgottenGemScore: 86 },
    { title: "成全", artist: "林俊傑", releaseYear: 2017, peakYear: 2017, itunesId: "zh_124", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "如果", artist: "邓紫棋", releaseYear: 2017, peakYear: 2017, itunesId: "zh_125", language: "zh", isForgottenGem: false, forgottenGemScore: 22 },
    { title: "童年", artist: "薛之谦", releaseYear: 2017, peakYear: 2017, itunesId: "zh_126", language: "zh", isForgottenGem: true, forgottenGemScore: 80 },
    // ── MANDARIN SONGS (2018–2026) ────────────────────────────────────────────
    // 2018
    { title: "等你下课", artist: "周杰伦", releaseYear: 2018, peakYear: 2018, itunesId: "zh_127", language: "zh", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "你,好不好?", artist: "周兴哲", releaseYear: 2016, peakYear: 2018, itunesId: "zh_128", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "残忍", artist: "邓紫棋", releaseYear: 2018, peakYear: 2018, itunesId: "zh_129", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "消愁", artist: "毛不易", releaseYear: 2017, peakYear: 2018, itunesId: "zh_130", language: "zh", isForgottenGem: true, forgottenGemScore: 78 },
    // 2019
    { title: "以后别做朋友", artist: "周兴哲", releaseYear: 2019, peakYear: 2019, itunesId: "zh_131", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "少年", artist: "梦然", releaseYear: 2019, peakYear: 2019, itunesId: "zh_132", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "倒过来爱", artist: "林俊傑", releaseYear: 2019, peakYear: 2019, itunesId: "zh_133", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "下一位前任", artist: "告五人", releaseYear: 2019, peakYear: 2019, itunesId: "zh_134", language: "zh", isForgottenGem: true, forgottenGemScore: 75 },
    // 2020
    { title: "mojito", artist: "周杰伦", releaseYear: 2020, peakYear: 2020, itunesId: "zh_135", language: "zh", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "怪美的", artist: "蔡依林", releaseYear: 2020, peakYear: 2020, itunesId: "zh_136", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "大风吹", artist: "林俊傑 ft. 派伟俊", releaseYear: 2020, peakYear: 2020, itunesId: "zh_137", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "漠河舞厅", artist: "柳爽", releaseYear: 2021, peakYear: 2020, itunesId: "zh_138", language: "zh", isForgottenGem: true, forgottenGemScore: 80 },
    // 2021
    { title: "可可托海的牧羊人", artist: "王琪", releaseYear: 2021, peakYear: 2021, itunesId: "zh_139", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "我是如此爱你", artist: "告五人", releaseYear: 2021, peakYear: 2021, itunesId: "zh_140", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "起风了", artist: "买辣椒也用券", releaseYear: 2017, peakYear: 2021, itunesId: "zh_141", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "如果当时", artist: "邓紫棋", releaseYear: 2021, peakYear: 2021, itunesId: "zh_142", language: "zh", isForgottenGem: true, forgottenGemScore: 72 },
    // 2022
    { title: "最伟大的作品", artist: "周杰伦", releaseYear: 2022, peakYear: 2022, itunesId: "zh_143", language: "zh", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "错位时空", artist: "艾辰", releaseYear: 2020, peakYear: 2022, itunesId: "zh_144", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "好想爱这个世界啊", artist: "华晨宇", releaseYear: 2018, peakYear: 2022, itunesId: "zh_145", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "给我一首歌的时间", artist: "林俊傑", releaseYear: 2022, peakYear: 2022, itunesId: "zh_146", language: "zh", isForgottenGem: true, forgottenGemScore: 70 },
    // 2023
    { title: "偷故事的人", artist: "告五人", releaseYear: 2022, peakYear: 2023, itunesId: "zh_147", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "我不愿让你一个人", artist: "五月天", releaseYear: 2023, peakYear: 2023, itunesId: "zh_148", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "Ugly Beauty", artist: "蔡依林", releaseYear: 2022, peakYear: 2023, itunesId: "zh_149", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "人间", artist: "李健", releaseYear: 2023, peakYear: 2023, itunesId: "zh_150", language: "zh", isForgottenGem: true, forgottenGemScore: 68 },
    // 2024
    { title: "不知道", artist: "林俊傑", releaseYear: 2024, peakYear: 2024, itunesId: "zh_151", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "大众情人", artist: "邓紫棋", releaseYear: 2023, peakYear: 2024, itunesId: "zh_152", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "成长不如你", artist: "告五人", releaseYear: 2023, peakYear: 2024, itunesId: "zh_153", language: "zh", isForgottenGem: false, forgottenGemScore: 20 },
    { title: "写给你的歌", artist: "魏如萱", releaseYear: 2024, peakYear: 2024, itunesId: "zh_154", language: "zh", isForgottenGem: true, forgottenGemScore: 65 },
    // 2025
    { title: "红颜如霜", artist: "周杰伦", releaseYear: 2024, peakYear: 2025, itunesId: "zh_155", language: "zh", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "晚风", artist: "邓紫棋", releaseYear: 2024, peakYear: 2025, itunesId: "zh_156", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "最近大家好吗", artist: "五月天", releaseYear: 2024, peakYear: 2025, itunesId: "zh_157", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "孤独的动物", artist: "告五人", releaseYear: 2024, peakYear: 2025, itunesId: "zh_158", language: "zh", isForgottenGem: true, forgottenGemScore: 62 },
    // 2026
    { title: "说走就走", artist: "林俊傑", releaseYear: 2025, peakYear: 2026, itunesId: "zh_159", language: "zh", isForgottenGem: false, forgottenGemScore: 14 },
    { title: "刚好遇见你", artist: "邓紫棋", releaseYear: 2025, peakYear: 2026, itunesId: "zh_160", language: "zh", isForgottenGem: false, forgottenGemScore: 16 },
    { title: "少年中国说", artist: "周兴哲", releaseYear: 2025, peakYear: 2026, itunesId: "zh_161", language: "zh", isForgottenGem: false, forgottenGemScore: 18 },
    { title: "陪你到最后", artist: "魏如萱", releaseYear: 2025, peakYear: 2026, itunesId: "zh_162", language: "zh", isForgottenGem: true, forgottenGemScore: 60 },
  ];

  for (const song of songs) {
    await prisma.song.upsert({
      where: { itunesId: song.itunesId },
      update: { language: song.language },
      create: {
        ...song,
        album: null,
        previewUrl: null,
        albumArtUrl: null,
      },
    });
  }
  console.log(`✓ ${songs.length} songs seeded`);

  // ─── Song Regions ─────────────────────────────────────────────────────────
  // Map each song to MY and US with approximate popularity scores.
  // These will be refined with real chart data before launch.
  const songRegionMappings = [
    // 2000–2002
    { itunesId: "placeholder_001", countryCode: "MY", peakYearRegional: 2000, historicalPopularity: 72, currentPopularity: 20, ageRelevance: 80, memoryTriggerScore: 55 },
    { itunesId: "placeholder_002", countryCode: "MY", peakYearRegional: 2001, historicalPopularity: 78, currentPopularity: 10, ageRelevance: 85, memoryTriggerScore: 70 },
    { itunesId: "placeholder_003", countryCode: "MY", peakYearRegional: 2000, historicalPopularity: 80, currentPopularity: 45, ageRelevance: 82, memoryTriggerScore: 75 },
    { itunesId: "placeholder_004", countryCode: "MY", peakYearRegional: 2001, historicalPopularity: 76, currentPopularity: 15, ageRelevance: 83, memoryTriggerScore: 68 },
    { itunesId: "placeholder_006", countryCode: "MY", peakYearRegional: 2001, historicalPopularity: 85, currentPopularity: 50, ageRelevance: 88, memoryTriggerScore: 72 },
    { itunesId: "placeholder_007", countryCode: "MY", peakYearRegional: 2002, historicalPopularity: 88, currentPopularity: 55, ageRelevance: 85, memoryTriggerScore: 70 },
    { itunesId: "placeholder_008", countryCode: "MY", peakYearRegional: 2002, historicalPopularity: 90, currentPopularity: 60, ageRelevance: 88, memoryTriggerScore: 80 },
    // 2003–2004
    { itunesId: "placeholder_010", countryCode: "MY", peakYearRegional: 2003, historicalPopularity: 88, currentPopularity: 65, ageRelevance: 85, memoryTriggerScore: 75 },
    { itunesId: "placeholder_011", countryCode: "MY", peakYearRegional: 2003, historicalPopularity: 82, currentPopularity: 20, ageRelevance: 86, memoryTriggerScore: 78 },
    { itunesId: "placeholder_012", countryCode: "MY", peakYearRegional: 2003, historicalPopularity: 85, currentPopularity: 50, ageRelevance: 84, memoryTriggerScore: 76 },
    { itunesId: "placeholder_013", countryCode: "MY", peakYearRegional: 2004, historicalPopularity: 90, currentPopularity: 60, ageRelevance: 85, memoryTriggerScore: 72 },
    { itunesId: "placeholder_014", countryCode: "MY", peakYearRegional: 2004, historicalPopularity: 85, currentPopularity: 8, ageRelevance: 88, memoryTriggerScore: 85 },
    { itunesId: "placeholder_015", countryCode: "MY", peakYearRegional: 2004, historicalPopularity: 80, currentPopularity: 5, ageRelevance: 87, memoryTriggerScore: 88 },
    { itunesId: "placeholder_016", countryCode: "MY", peakYearRegional: 2004, historicalPopularity: 88, currentPopularity: 70, ageRelevance: 85, memoryTriggerScore: 78 },
    // 2005–2006
    { itunesId: "placeholder_017", countryCode: "MY", peakYearRegional: 2005, historicalPopularity: 83, currentPopularity: 12, ageRelevance: 86, memoryTriggerScore: 82 },
    { itunesId: "placeholder_018", countryCode: "MY", peakYearRegional: 2005, historicalPopularity: 85, currentPopularity: 18, ageRelevance: 87, memoryTriggerScore: 80 },
    { itunesId: "placeholder_019", countryCode: "MY", peakYearRegional: 2005, historicalPopularity: 87, currentPopularity: 55, ageRelevance: 86, memoryTriggerScore: 75 },
    { itunesId: "placeholder_020", countryCode: "MY", peakYearRegional: 2006, historicalPopularity: 82, currentPopularity: 8, ageRelevance: 87, memoryTriggerScore: 88 },
    { itunesId: "placeholder_021", countryCode: "MY", peakYearRegional: 2006, historicalPopularity: 89, currentPopularity: 45, ageRelevance: 85, memoryTriggerScore: 72 },
    { itunesId: "placeholder_022", countryCode: "MY", peakYearRegional: 2006, historicalPopularity: 88, currentPopularity: 50, ageRelevance: 86, memoryTriggerScore: 75 },
    // 2007–2008
    { itunesId: "placeholder_023", countryCode: "MY", peakYearRegional: 2007, historicalPopularity: 92, currentPopularity: 72, ageRelevance: 87, memoryTriggerScore: 70 },
    { itunesId: "placeholder_024", countryCode: "MY", peakYearRegional: 2007, historicalPopularity: 88, currentPopularity: 10, ageRelevance: 88, memoryTriggerScore: 90 },
    { itunesId: "placeholder_025", countryCode: "MY", peakYearRegional: 2007, historicalPopularity: 84, currentPopularity: 12, ageRelevance: 87, memoryTriggerScore: 85 },
    { itunesId: "placeholder_026", countryCode: "MY", peakYearRegional: 2007, historicalPopularity: 85, currentPopularity: 60, ageRelevance: 86, memoryTriggerScore: 80 },
    { itunesId: "placeholder_027", countryCode: "MY", peakYearRegional: 2008, historicalPopularity: 86, currentPopularity: 15, ageRelevance: 87, memoryTriggerScore: 82 },
    { itunesId: "placeholder_028", countryCode: "MY", peakYearRegional: 2008, historicalPopularity: 88, currentPopularity: 75, ageRelevance: 86, memoryTriggerScore: 72 },
    { itunesId: "placeholder_029", countryCode: "MY", peakYearRegional: 2008, historicalPopularity: 87, currentPopularity: 65, ageRelevance: 85, memoryTriggerScore: 70 },
    // 2009–2010
    { itunesId: "placeholder_030", countryCode: "MY", peakYearRegional: 2009, historicalPopularity: 90, currentPopularity: 68, ageRelevance: 85, memoryTriggerScore: 70 },
    { itunesId: "placeholder_031", countryCode: "MY", peakYearRegional: 2009, historicalPopularity: 88, currentPopularity: 22, ageRelevance: 86, memoryTriggerScore: 78 },
    { itunesId: "placeholder_032", countryCode: "MY", peakYearRegional: 2009, historicalPopularity: 85, currentPopularity: 8, ageRelevance: 87, memoryTriggerScore: 92 },
    { itunesId: "placeholder_033", countryCode: "MY", peakYearRegional: 2010, historicalPopularity: 84, currentPopularity: 14, ageRelevance: 85, memoryTriggerScore: 80 },
    { itunesId: "placeholder_034", countryCode: "MY", peakYearRegional: 2010, historicalPopularity: 87, currentPopularity: 60, ageRelevance: 84, memoryTriggerScore: 72 },
    { itunesId: "placeholder_035", countryCode: "MY", peakYearRegional: 2010, historicalPopularity: 88, currentPopularity: 65, ageRelevance: 84, memoryTriggerScore: 70 },
    // 2011–2012
    { itunesId: "placeholder_036", countryCode: "MY", peakYearRegional: 2011, historicalPopularity: 90, currentPopularity: 78, ageRelevance: 83, memoryTriggerScore: 65 },
    { itunesId: "placeholder_037", countryCode: "MY", peakYearRegional: 2011, historicalPopularity: 86, currentPopularity: 10, ageRelevance: 85, memoryTriggerScore: 85 },
    { itunesId: "placeholder_038", countryCode: "MY", peakYearRegional: 2011, historicalPopularity: 90, currentPopularity: 80, ageRelevance: 83, memoryTriggerScore: 62 },
    { itunesId: "placeholder_039", countryCode: "MY", peakYearRegional: 2012, historicalPopularity: 87, currentPopularity: 20, ageRelevance: 84, memoryTriggerScore: 82 },
    { itunesId: "placeholder_040", countryCode: "MY", peakYearRegional: 2012, historicalPopularity: 88, currentPopularity: 18, ageRelevance: 85, memoryTriggerScore: 80 },
    { itunesId: "placeholder_041", countryCode: "MY", peakYearRegional: 2012, historicalPopularity: 92, currentPopularity: 55, ageRelevance: 84, memoryTriggerScore: 75 },
    // 2013–2015
    { itunesId: "placeholder_043", countryCode: "MY", peakYearRegional: 2013, historicalPopularity: 86, currentPopularity: 65, ageRelevance: 82, memoryTriggerScore: 68 },
    { itunesId: "placeholder_044", countryCode: "MY", peakYearRegional: 2013, historicalPopularity: 85, currentPopularity: 30, ageRelevance: 83, memoryTriggerScore: 75 },
    { itunesId: "placeholder_045", countryCode: "MY", peakYearRegional: 2014, historicalPopularity: 88, currentPopularity: 62, ageRelevance: 81, memoryTriggerScore: 68 },
    { itunesId: "placeholder_046", countryCode: "MY", peakYearRegional: 2014, historicalPopularity: 85, currentPopularity: 12, ageRelevance: 82, memoryTriggerScore: 78 },
    { itunesId: "placeholder_047", countryCode: "MY", peakYearRegional: 2014, historicalPopularity: 87, currentPopularity: 70, ageRelevance: 81, memoryTriggerScore: 65 },
    { itunesId: "placeholder_048", countryCode: "MY", peakYearRegional: 2015, historicalPopularity: 90, currentPopularity: 75, ageRelevance: 80, memoryTriggerScore: 65 },
    { itunesId: "placeholder_049", countryCode: "MY", peakYearRegional: 2015, historicalPopularity: 82, currentPopularity: 8, ageRelevance: 82, memoryTriggerScore: 88 },
    { itunesId: "placeholder_050", countryCode: "MY", peakYearRegional: 2015, historicalPopularity: 88, currentPopularity: 70, ageRelevance: 80, memoryTriggerScore: 68 },
    // Extra MY mappings — ensure ≥6 songs per year so forgotten gem is always available
    // 2000
    { itunesId: "placeholder_051", countryCode: "MY", peakYearRegional: 2000, historicalPopularity: 88, currentPopularity: 70, ageRelevance: 85, memoryTriggerScore: 72 },
    { itunesId: "placeholder_052", countryCode: "MY", peakYearRegional: 2000, historicalPopularity: 85, currentPopularity: 60, ageRelevance: 84, memoryTriggerScore: 75 },
    { itunesId: "placeholder_053", countryCode: "MY", peakYearRegional: 2000, historicalPopularity: 80, currentPopularity: 55, ageRelevance: 80, memoryTriggerScore: 65 },
    { itunesId: "placeholder_054", countryCode: "MY", peakYearRegional: 2000, historicalPopularity: 75, currentPopularity: 5, ageRelevance: 88, memoryTriggerScore: 95 },
    // 2001
    { itunesId: "placeholder_055", countryCode: "MY", peakYearRegional: 2001, historicalPopularity: 86, currentPopularity: 45, ageRelevance: 84, memoryTriggerScore: 70 },
    { itunesId: "placeholder_056", countryCode: "MY", peakYearRegional: 2001, historicalPopularity: 82, currentPopularity: 18, ageRelevance: 85, memoryTriggerScore: 80 },
    { itunesId: "placeholder_057", countryCode: "MY", peakYearRegional: 2001, historicalPopularity: 78, currentPopularity: 8, ageRelevance: 84, memoryTriggerScore: 82 },
    // 2002
    { itunesId: "placeholder_058", countryCode: "MY", peakYearRegional: 2002, historicalPopularity: 90, currentPopularity: 70, ageRelevance: 86, memoryTriggerScore: 75 },
    { itunesId: "placeholder_059", countryCode: "MY", peakYearRegional: 2002, historicalPopularity: 80, currentPopularity: 6, ageRelevance: 87, memoryTriggerScore: 90 },
    { itunesId: "placeholder_060", countryCode: "MY", peakYearRegional: 2002, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 85, memoryTriggerScore: 78 },
    { itunesId: "placeholder_061", countryCode: "MY", peakYearRegional: 2002, historicalPopularity: 82, currentPopularity: 30, ageRelevance: 84, memoryTriggerScore: 74 },
    // 2003
    { itunesId: "placeholder_062", countryCode: "MY", peakYearRegional: 2003, historicalPopularity: 80, currentPopularity: 10, ageRelevance: 85, memoryTriggerScore: 85 },
    { itunesId: "placeholder_063", countryCode: "MY", peakYearRegional: 2003, historicalPopularity: 84, currentPopularity: 35, ageRelevance: 86, memoryTriggerScore: 78 },
    { itunesId: "placeholder_064", countryCode: "MY", peakYearRegional: 2003, historicalPopularity: 76, currentPopularity: 5, ageRelevance: 84, memoryTriggerScore: 88 },
    // 2004
    { itunesId: "placeholder_065", countryCode: "MY", peakYearRegional: 2004, historicalPopularity: 86, currentPopularity: 55, ageRelevance: 85, memoryTriggerScore: 70 },
    { itunesId: "placeholder_066", countryCode: "MY", peakYearRegional: 2004, historicalPopularity: 87, currentPopularity: 65, ageRelevance: 86, memoryTriggerScore: 75 },
    // 2005
    { itunesId: "placeholder_067", countryCode: "MY", peakYearRegional: 2005, historicalPopularity: 88, currentPopularity: 55, ageRelevance: 84, memoryTriggerScore: 72 },
    { itunesId: "placeholder_068", countryCode: "MY", peakYearRegional: 2005, historicalPopularity: 79, currentPopularity: 6, ageRelevance: 86, memoryTriggerScore: 90 },
    { itunesId: "placeholder_069", countryCode: "MY", peakYearRegional: 2005, historicalPopularity: 83, currentPopularity: 40, ageRelevance: 84, memoryTriggerScore: 78 },
    // 2006
    { itunesId: "placeholder_070", countryCode: "MY", peakYearRegional: 2006, historicalPopularity: 86, currentPopularity: 30, ageRelevance: 85, memoryTriggerScore: 80 },
    { itunesId: "placeholder_071", countryCode: "MY", peakYearRegional: 2006, historicalPopularity: 85, currentPopularity: 50, ageRelevance: 84, memoryTriggerScore: 76 },
    { itunesId: "placeholder_072", countryCode: "MY", peakYearRegional: 2006, historicalPopularity: 87, currentPopularity: 60, ageRelevance: 83, memoryTriggerScore: 70 },
    // 2007
    { itunesId: "placeholder_073", countryCode: "MY", peakYearRegional: 2007, historicalPopularity: 83, currentPopularity: 12, ageRelevance: 86, memoryTriggerScore: 84 },
    { itunesId: "placeholder_074", countryCode: "MY", peakYearRegional: 2007, historicalPopularity: 85, currentPopularity: 40, ageRelevance: 85, memoryTriggerScore: 76 },
    // 2008
    { itunesId: "placeholder_075", countryCode: "MY", peakYearRegional: 2008, historicalPopularity: 88, currentPopularity: 65, ageRelevance: 84, memoryTriggerScore: 72 },
    { itunesId: "placeholder_076", countryCode: "MY", peakYearRegional: 2008, historicalPopularity: 86, currentPopularity: 50, ageRelevance: 84, memoryTriggerScore: 74 },
    { itunesId: "placeholder_077", countryCode: "MY", peakYearRegional: 2008, historicalPopularity: 81, currentPopularity: 14, ageRelevance: 84, memoryTriggerScore: 80 },
    // 2009
    { itunesId: "placeholder_078", countryCode: "MY", peakYearRegional: 2009, historicalPopularity: 87, currentPopularity: 65, ageRelevance: 84, memoryTriggerScore: 70 },
    { itunesId: "placeholder_079", countryCode: "MY", peakYearRegional: 2009, historicalPopularity: 86, currentPopularity: 60, ageRelevance: 83, memoryTriggerScore: 68 },
    { itunesId: "placeholder_080", countryCode: "MY", peakYearRegional: 2009, historicalPopularity: 89, currentPopularity: 62, ageRelevance: 84, memoryTriggerScore: 70 },
    // 2010
    { itunesId: "placeholder_081", countryCode: "MY", peakYearRegional: 2010, historicalPopularity: 85, currentPopularity: 20, ageRelevance: 83, memoryTriggerScore: 80 },
    { itunesId: "placeholder_082", countryCode: "MY", peakYearRegional: 2010, historicalPopularity: 86, currentPopularity: 30, ageRelevance: 82, memoryTriggerScore: 75 },
    { itunesId: "placeholder_083", countryCode: "MY", peakYearRegional: 2010, historicalPopularity: 87, currentPopularity: 55, ageRelevance: 82, memoryTriggerScore: 72 },
    // 2011
    { itunesId: "placeholder_084", countryCode: "MY", peakYearRegional: 2011, historicalPopularity: 88, currentPopularity: 60, ageRelevance: 82, memoryTriggerScore: 70 },
    { itunesId: "placeholder_085", countryCode: "MY", peakYearRegional: 2011, historicalPopularity: 87, currentPopularity: 65, ageRelevance: 82, memoryTriggerScore: 68 },
    { itunesId: "placeholder_086", countryCode: "MY", peakYearRegional: 2011, historicalPopularity: 82, currentPopularity: 10, ageRelevance: 83, memoryTriggerScore: 84 },
    // 2012
    { itunesId: "placeholder_087", countryCode: "MY", peakYearRegional: 2012, historicalPopularity: 86, currentPopularity: 45, ageRelevance: 82, memoryTriggerScore: 74 },
    { itunesId: "placeholder_088", countryCode: "MY", peakYearRegional: 2012, historicalPopularity: 84, currentPopularity: 15, ageRelevance: 83, memoryTriggerScore: 82 },
    { itunesId: "placeholder_089", countryCode: "MY", peakYearRegional: 2012, historicalPopularity: 83, currentPopularity: 12, ageRelevance: 82, memoryTriggerScore: 83 },
    // 2013
    { itunesId: "placeholder_042", countryCode: "MY", peakYearRegional: 2013, historicalPopularity: 90, currentPopularity: 55, ageRelevance: 81, memoryTriggerScore: 65 },
    { itunesId: "placeholder_090", countryCode: "MY", peakYearRegional: 2013, historicalPopularity: 88, currentPopularity: 60, ageRelevance: 81, memoryTriggerScore: 68 },
    { itunesId: "placeholder_091", countryCode: "MY", peakYearRegional: 2013, historicalPopularity: 84, currentPopularity: 20, ageRelevance: 82, memoryTriggerScore: 80 },
    { itunesId: "placeholder_092", countryCode: "MY", peakYearRegional: 2013, historicalPopularity: 85, currentPopularity: 40, ageRelevance: 81, memoryTriggerScore: 72 },
    // 2014
    { itunesId: "placeholder_093", countryCode: "MY", peakYearRegional: 2014, historicalPopularity: 83, currentPopularity: 10, ageRelevance: 81, memoryTriggerScore: 82 },
    { itunesId: "placeholder_094", countryCode: "MY", peakYearRegional: 2014, historicalPopularity: 85, currentPopularity: 45, ageRelevance: 80, memoryTriggerScore: 72 },
    { itunesId: "placeholder_095", countryCode: "MY", peakYearRegional: 2014, historicalPopularity: 84, currentPopularity: 50, ageRelevance: 80, memoryTriggerScore: 70 },
    // 2015
    { itunesId: "placeholder_096", countryCode: "MY", peakYearRegional: 2015, historicalPopularity: 87, currentPopularity: 60, ageRelevance: 79, memoryTriggerScore: 66 },
    { itunesId: "placeholder_097", countryCode: "MY", peakYearRegional: 2015, historicalPopularity: 86, currentPopularity: 55, ageRelevance: 79, memoryTriggerScore: 68 },
    { itunesId: "placeholder_098", countryCode: "MY", peakYearRegional: 2015, historicalPopularity: 83, currentPopularity: 18, ageRelevance: 80, memoryTriggerScore: 80 },
    // ── ENGLISH 2016–2017 — MY + SG ──────────────────────────────────────────
    { itunesId: "placeholder_e16_01", countryCode: "MY", peakYearRegional: 2016, historicalPopularity: 88, currentPopularity: 55, ageRelevance: 78, memoryTriggerScore: 68 },
    { itunesId: "placeholder_e16_02", countryCode: "MY", peakYearRegional: 2016, historicalPopularity: 86, currentPopularity: 40, ageRelevance: 79, memoryTriggerScore: 72 },
    { itunesId: "placeholder_e16_03", countryCode: "MY", peakYearRegional: 2016, historicalPopularity: 87, currentPopularity: 65, ageRelevance: 78, memoryTriggerScore: 65 },
    { itunesId: "placeholder_e16_04", countryCode: "MY", peakYearRegional: 2016, historicalPopularity: 85, currentPopularity: 50, ageRelevance: 78, memoryTriggerScore: 70 },
    { itunesId: "placeholder_e16_05", countryCode: "MY", peakYearRegional: 2016, historicalPopularity: 82, currentPopularity: 10, ageRelevance: 79, memoryTriggerScore: 84 },
    { itunesId: "placeholder_e16_06", countryCode: "MY", peakYearRegional: 2016, historicalPopularity: 86, currentPopularity: 55, ageRelevance: 78, memoryTriggerScore: 66 },
    { itunesId: "placeholder_e16_07", countryCode: "MY", peakYearRegional: 2016, historicalPopularity: 80, currentPopularity: 14, ageRelevance: 79, memoryTriggerScore: 80 },
    { itunesId: "placeholder_e17_01", countryCode: "MY", peakYearRegional: 2017, historicalPopularity: 90, currentPopularity: 72, ageRelevance: 77, memoryTriggerScore: 62 },
    { itunesId: "placeholder_e17_02", countryCode: "MY", peakYearRegional: 2017, historicalPopularity: 92, currentPopularity: 68, ageRelevance: 78, memoryTriggerScore: 65 },
    { itunesId: "placeholder_e17_03", countryCode: "MY", peakYearRegional: 2017, historicalPopularity: 84, currentPopularity: 45, ageRelevance: 77, memoryTriggerScore: 70 },
    { itunesId: "placeholder_e17_04", countryCode: "MY", peakYearRegional: 2017, historicalPopularity: 85, currentPopularity: 60, ageRelevance: 76, memoryTriggerScore: 65 },
    { itunesId: "placeholder_e17_05", countryCode: "MY", peakYearRegional: 2017, historicalPopularity: 87, currentPopularity: 65, ageRelevance: 77, memoryTriggerScore: 64 },
    { itunesId: "placeholder_e17_06", countryCode: "MY", peakYearRegional: 2017, historicalPopularity: 80, currentPopularity: 8, ageRelevance: 78, memoryTriggerScore: 86 },
    { itunesId: "placeholder_e17_07", countryCode: "MY", peakYearRegional: 2017, historicalPopularity: 78, currentPopularity: 6, ageRelevance: 78, memoryTriggerScore: 82 },
    { itunesId: "placeholder_e16_01", countryCode: "SG", peakYearRegional: 2016, historicalPopularity: 88, currentPopularity: 55, ageRelevance: 78, memoryTriggerScore: 68 },
    { itunesId: "placeholder_e16_02", countryCode: "SG", peakYearRegional: 2016, historicalPopularity: 86, currentPopularity: 40, ageRelevance: 79, memoryTriggerScore: 72 },
    { itunesId: "placeholder_e16_03", countryCode: "SG", peakYearRegional: 2016, historicalPopularity: 87, currentPopularity: 65, ageRelevance: 78, memoryTriggerScore: 65 },
    { itunesId: "placeholder_e16_04", countryCode: "SG", peakYearRegional: 2016, historicalPopularity: 85, currentPopularity: 50, ageRelevance: 78, memoryTriggerScore: 70 },
    { itunesId: "placeholder_e16_05", countryCode: "SG", peakYearRegional: 2016, historicalPopularity: 82, currentPopularity: 10, ageRelevance: 79, memoryTriggerScore: 84 },
    { itunesId: "placeholder_e16_06", countryCode: "SG", peakYearRegional: 2016, historicalPopularity: 86, currentPopularity: 55, ageRelevance: 78, memoryTriggerScore: 66 },
    { itunesId: "placeholder_e16_07", countryCode: "SG", peakYearRegional: 2016, historicalPopularity: 80, currentPopularity: 14, ageRelevance: 79, memoryTriggerScore: 80 },
    { itunesId: "placeholder_e17_01", countryCode: "SG", peakYearRegional: 2017, historicalPopularity: 90, currentPopularity: 72, ageRelevance: 77, memoryTriggerScore: 62 },
    { itunesId: "placeholder_e17_02", countryCode: "SG", peakYearRegional: 2017, historicalPopularity: 92, currentPopularity: 68, ageRelevance: 78, memoryTriggerScore: 65 },
    { itunesId: "placeholder_e17_03", countryCode: "SG", peakYearRegional: 2017, historicalPopularity: 84, currentPopularity: 45, ageRelevance: 77, memoryTriggerScore: 70 },
    { itunesId: "placeholder_e17_04", countryCode: "SG", peakYearRegional: 2017, historicalPopularity: 85, currentPopularity: 60, ageRelevance: 76, memoryTriggerScore: 65 },
    { itunesId: "placeholder_e17_05", countryCode: "SG", peakYearRegional: 2017, historicalPopularity: 87, currentPopularity: 65, ageRelevance: 77, memoryTriggerScore: 64 },
    { itunesId: "placeholder_e17_06", countryCode: "SG", peakYearRegional: 2017, historicalPopularity: 80, currentPopularity: 8, ageRelevance: 78, memoryTriggerScore: 86 },
    { itunesId: "placeholder_e17_07", countryCode: "SG", peakYearRegional: 2017, historicalPopularity: 78, currentPopularity: 6, ageRelevance: 78, memoryTriggerScore: 82 },
    // ── MANDARIN — MY + SG ───────────────────────────────────────────────────
    // 2000 — MY
    { itunesId: "zh_001", countryCode: "MY", peakYearRegional: 2000, historicalPopularity: 80, currentPopularity: 30, ageRelevance: 85, memoryTriggerScore: 72 },
    { itunesId: "zh_002", countryCode: "MY", peakYearRegional: 2000, historicalPopularity: 78, currentPopularity: 8, ageRelevance: 86, memoryTriggerScore: 88 },
    { itunesId: "zh_003", countryCode: "MY", peakYearRegional: 2001, historicalPopularity: 82, currentPopularity: 25, ageRelevance: 85, memoryTriggerScore: 75 },
    { itunesId: "zh_004", countryCode: "MY", peakYearRegional: 2001, historicalPopularity: 84, currentPopularity: 20, ageRelevance: 86, memoryTriggerScore: 78 },
    { itunesId: "zh_005", countryCode: "MY", peakYearRegional: 2000, historicalPopularity: 76, currentPopularity: 6, ageRelevance: 85, memoryTriggerScore: 85 },
    { itunesId: "zh_006", countryCode: "MY", peakYearRegional: 2000, historicalPopularity: 78, currentPopularity: 35, ageRelevance: 84, memoryTriggerScore: 70 },
    { itunesId: "zh_007", countryCode: "MY", peakYearRegional: 2000, historicalPopularity: 72, currentPopularity: 5, ageRelevance: 83, memoryTriggerScore: 80 },
    // 2001 — MY
    { itunesId: "zh_008", countryCode: "MY", peakYearRegional: 2001, historicalPopularity: 90, currentPopularity: 70, ageRelevance: 88, memoryTriggerScore: 72 },
    { itunesId: "zh_009", countryCode: "MY", peakYearRegional: 2001, historicalPopularity: 86, currentPopularity: 55, ageRelevance: 87, memoryTriggerScore: 75 },
    { itunesId: "zh_010", countryCode: "MY", peakYearRegional: 2002, historicalPopularity: 88, currentPopularity: 50, ageRelevance: 87, memoryTriggerScore: 78 },
    { itunesId: "zh_011", countryCode: "MY", peakYearRegional: 2001, historicalPopularity: 82, currentPopularity: 10, ageRelevance: 86, memoryTriggerScore: 88 },
    { itunesId: "zh_012", countryCode: "MY", peakYearRegional: 2001, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 86, memoryTriggerScore: 72 },
    { itunesId: "zh_013", countryCode: "MY", peakYearRegional: 2002, historicalPopularity: 80, currentPopularity: 8, ageRelevance: 85, memoryTriggerScore: 84 },
    { itunesId: "zh_014", countryCode: "MY", peakYearRegional: 2001, historicalPopularity: 76, currentPopularity: 12, ageRelevance: 84, memoryTriggerScore: 70 },
    // 2002 — MY
    { itunesId: "zh_015", countryCode: "MY", peakYearRegional: 2002, historicalPopularity: 88, currentPopularity: 55, ageRelevance: 87, memoryTriggerScore: 72 },
    { itunesId: "zh_016", countryCode: "MY", peakYearRegional: 2002, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 86, memoryTriggerScore: 74 },
    { itunesId: "zh_017", countryCode: "MY", peakYearRegional: 2002, historicalPopularity: 86, currentPopularity: 6, ageRelevance: 87, memoryTriggerScore: 92 },
    { itunesId: "zh_018", countryCode: "MY", peakYearRegional: 2002, historicalPopularity: 82, currentPopularity: 30, ageRelevance: 86, memoryTriggerScore: 78 },
    { itunesId: "zh_019", countryCode: "MY", peakYearRegional: 2002, historicalPopularity: 85, currentPopularity: 45, ageRelevance: 86, memoryTriggerScore: 70 },
    { itunesId: "zh_020", countryCode: "MY", peakYearRegional: 2003, historicalPopularity: 84, currentPopularity: 8, ageRelevance: 86, memoryTriggerScore: 86 },
    { itunesId: "zh_021", countryCode: "MY", peakYearRegional: 2002, historicalPopularity: 86, currentPopularity: 50, ageRelevance: 86, memoryTriggerScore: 72 },
    // 2003 — MY
    { itunesId: "zh_022", countryCode: "MY", peakYearRegional: 2003, historicalPopularity: 88, currentPopularity: 60, ageRelevance: 87, memoryTriggerScore: 70 },
    { itunesId: "zh_023", countryCode: "MY", peakYearRegional: 2003, historicalPopularity: 84, currentPopularity: 6, ageRelevance: 87, memoryTriggerScore: 90 },
    { itunesId: "zh_024", countryCode: "MY", peakYearRegional: 2003, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 86, memoryTriggerScore: 75 },
    { itunesId: "zh_025", countryCode: "MY", peakYearRegional: 2003, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 86, memoryTriggerScore: 72 },
    { itunesId: "zh_026", countryCode: "MY", peakYearRegional: 2003, historicalPopularity: 80, currentPopularity: 8, ageRelevance: 86, memoryTriggerScore: 84 },
    { itunesId: "zh_027", countryCode: "MY", peakYearRegional: 2003, historicalPopularity: 82, currentPopularity: 30, ageRelevance: 86, memoryTriggerScore: 75 },
    { itunesId: "zh_028", countryCode: "MY", peakYearRegional: 2003, historicalPopularity: 78, currentPopularity: 25, ageRelevance: 85, memoryTriggerScore: 72 },
    // 2004 — MY
    { itunesId: "zh_029", countryCode: "MY", peakYearRegional: 2004, historicalPopularity: 92, currentPopularity: 70, ageRelevance: 88, memoryTriggerScore: 70 },
    { itunesId: "zh_030", countryCode: "MY", peakYearRegional: 2004, historicalPopularity: 88, currentPopularity: 55, ageRelevance: 87, memoryTriggerScore: 74 },
    { itunesId: "zh_031", countryCode: "MY", peakYearRegional: 2004, historicalPopularity: 84, currentPopularity: 35, ageRelevance: 86, memoryTriggerScore: 72 },
    { itunesId: "zh_032", countryCode: "MY", peakYearRegional: 2004, historicalPopularity: 82, currentPopularity: 8, ageRelevance: 87, memoryTriggerScore: 88 },
    { itunesId: "zh_033", countryCode: "MY", peakYearRegional: 2004, historicalPopularity: 80, currentPopularity: 30, ageRelevance: 86, memoryTriggerScore: 76 },
    { itunesId: "zh_034", countryCode: "MY", peakYearRegional: 2004, historicalPopularity: 78, currentPopularity: 6, ageRelevance: 86, memoryTriggerScore: 84 },
    { itunesId: "zh_035", countryCode: "MY", peakYearRegional: 2004, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 86, memoryTriggerScore: 70 },
    // 2005 — MY
    { itunesId: "zh_036", countryCode: "MY", peakYearRegional: 2005, historicalPopularity: 90, currentPopularity: 60, ageRelevance: 87, memoryTriggerScore: 70 },
    { itunesId: "zh_037", countryCode: "MY", peakYearRegional: 2005, historicalPopularity: 86, currentPopularity: 45, ageRelevance: 86, memoryTriggerScore: 74 },
    { itunesId: "zh_038", countryCode: "MY", peakYearRegional: 2005, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 86, memoryTriggerScore: 72 },
    { itunesId: "zh_039", countryCode: "MY", peakYearRegional: 2005, historicalPopularity: 82, currentPopularity: 6, ageRelevance: 87, memoryTriggerScore: 92 },
    { itunesId: "zh_040", countryCode: "MY", peakYearRegional: 2005, historicalPopularity: 80, currentPopularity: 5, ageRelevance: 87, memoryTriggerScore: 94 },
    { itunesId: "zh_041", countryCode: "MY", peakYearRegional: 2005, historicalPopularity: 86, currentPopularity: 50, ageRelevance: 86, memoryTriggerScore: 72 },
    { itunesId: "zh_042", countryCode: "MY", peakYearRegional: 2005, historicalPopularity: 84, currentPopularity: 45, ageRelevance: 86, memoryTriggerScore: 70 },
    // 2006 — MY
    { itunesId: "zh_043", countryCode: "MY", peakYearRegional: 2006, historicalPopularity: 90, currentPopularity: 62, ageRelevance: 86, memoryTriggerScore: 68 },
    { itunesId: "zh_044", countryCode: "MY", peakYearRegional: 2006, historicalPopularity: 86, currentPopularity: 45, ageRelevance: 86, memoryTriggerScore: 74 },
    { itunesId: "zh_045", countryCode: "MY", peakYearRegional: 2006, historicalPopularity: 82, currentPopularity: 8, ageRelevance: 86, memoryTriggerScore: 88 },
    { itunesId: "zh_046", countryCode: "MY", peakYearRegional: 2006, historicalPopularity: 80, currentPopularity: 5, ageRelevance: 86, memoryTriggerScore: 92 },
    { itunesId: "zh_047", countryCode: "MY", peakYearRegional: 2006, historicalPopularity: 84, currentPopularity: 30, ageRelevance: 85, memoryTriggerScore: 75 },
    { itunesId: "zh_048", countryCode: "MY", peakYearRegional: 2006, historicalPopularity: 78, currentPopularity: 20, ageRelevance: 85, memoryTriggerScore: 72 },
    { itunesId: "zh_049", countryCode: "MY", peakYearRegional: 2007, historicalPopularity: 76, currentPopularity: 6, ageRelevance: 85, memoryTriggerScore: 82 },
    // 2007 — MY
    { itunesId: "zh_050", countryCode: "MY", peakYearRegional: 2007, historicalPopularity: 88, currentPopularity: 55, ageRelevance: 86, memoryTriggerScore: 72 },
    { itunesId: "zh_051", countryCode: "MY", peakYearRegional: 2007, historicalPopularity: 84, currentPopularity: 35, ageRelevance: 85, memoryTriggerScore: 75 },
    { itunesId: "zh_052", countryCode: "MY", peakYearRegional: 2007, historicalPopularity: 82, currentPopularity: 8, ageRelevance: 86, memoryTriggerScore: 88 },
    { itunesId: "zh_053", countryCode: "MY", peakYearRegional: 2007, historicalPopularity: 80, currentPopularity: 30, ageRelevance: 85, memoryTriggerScore: 74 },
    { itunesId: "zh_054", countryCode: "MY", peakYearRegional: 2007, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 85, memoryTriggerScore: 72 },
    { itunesId: "zh_055", countryCode: "MY", peakYearRegional: 2007, historicalPopularity: 80, currentPopularity: 6, ageRelevance: 86, memoryTriggerScore: 86 },
    { itunesId: "zh_056", countryCode: "MY", peakYearRegional: 2007, historicalPopularity: 78, currentPopularity: 25, ageRelevance: 85, memoryTriggerScore: 72 },
    // 2008 — MY
    { itunesId: "zh_057", countryCode: "MY", peakYearRegional: 2008, historicalPopularity: 90, currentPopularity: 62, ageRelevance: 86, memoryTriggerScore: 70 },
    { itunesId: "zh_058", countryCode: "MY", peakYearRegional: 2008, historicalPopularity: 84, currentPopularity: 6, ageRelevance: 86, memoryTriggerScore: 92 },
    { itunesId: "zh_059", countryCode: "MY", peakYearRegional: 2008, historicalPopularity: 82, currentPopularity: 5, ageRelevance: 86, memoryTriggerScore: 94 },
    { itunesId: "zh_060", countryCode: "MY", peakYearRegional: 2008, historicalPopularity: 84, currentPopularity: 35, ageRelevance: 86, memoryTriggerScore: 75 },
    { itunesId: "zh_061", countryCode: "MY", peakYearRegional: 2008, historicalPopularity: 86, currentPopularity: 50, ageRelevance: 85, memoryTriggerScore: 70 },
    { itunesId: "zh_062", countryCode: "MY", peakYearRegional: 2008, historicalPopularity: 82, currentPopularity: 40, ageRelevance: 85, memoryTriggerScore: 72 },
    { itunesId: "zh_063", countryCode: "MY", peakYearRegional: 2008, historicalPopularity: 80, currentPopularity: 35, ageRelevance: 85, memoryTriggerScore: 74 },
    // 2009 — MY
    { itunesId: "zh_064", countryCode: "MY", peakYearRegional: 2009, historicalPopularity: 88, currentPopularity: 55, ageRelevance: 85, memoryTriggerScore: 70 },
    { itunesId: "zh_065", countryCode: "MY", peakYearRegional: 2009, historicalPopularity: 82, currentPopularity: 8, ageRelevance: 85, memoryTriggerScore: 88 },
    { itunesId: "zh_066", countryCode: "MY", peakYearRegional: 2009, historicalPopularity: 82, currentPopularity: 30, ageRelevance: 85, memoryTriggerScore: 75 },
    { itunesId: "zh_067", countryCode: "MY", peakYearRegional: 2009, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 85, memoryTriggerScore: 72 },
    { itunesId: "zh_068", countryCode: "MY", peakYearRegional: 2009, historicalPopularity: 80, currentPopularity: 6, ageRelevance: 85, memoryTriggerScore: 90 },
    { itunesId: "zh_069", countryCode: "MY", peakYearRegional: 2009, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 85, memoryTriggerScore: 73 },
    { itunesId: "zh_070", countryCode: "MY", peakYearRegional: 2009, historicalPopularity: 78, currentPopularity: 5, ageRelevance: 85, memoryTriggerScore: 84 },
    // 2010 — MY
    { itunesId: "zh_071", countryCode: "MY", peakYearRegional: 2010, historicalPopularity: 86, currentPopularity: 50, ageRelevance: 84, memoryTriggerScore: 70 },
    { itunesId: "zh_072", countryCode: "MY", peakYearRegional: 2010, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 84, memoryTriggerScore: 72 },
    { itunesId: "zh_073", countryCode: "MY", peakYearRegional: 2010, historicalPopularity: 82, currentPopularity: 30, ageRelevance: 84, memoryTriggerScore: 74 },
    { itunesId: "zh_074", countryCode: "MY", peakYearRegional: 2010, historicalPopularity: 78, currentPopularity: 6, ageRelevance: 84, memoryTriggerScore: 86 },
    { itunesId: "zh_075", countryCode: "MY", peakYearRegional: 2011, historicalPopularity: 80, currentPopularity: 5, ageRelevance: 84, memoryTriggerScore: 90 },
    { itunesId: "zh_076", countryCode: "MY", peakYearRegional: 2010, historicalPopularity: 82, currentPopularity: 38, ageRelevance: 84, memoryTriggerScore: 72 },
    { itunesId: "zh_077", countryCode: "MY", peakYearRegional: 2010, historicalPopularity: 80, currentPopularity: 35, ageRelevance: 83, memoryTriggerScore: 70 },
    // 2011 — MY
    { itunesId: "zh_078", countryCode: "MY", peakYearRegional: 2011, historicalPopularity: 88, currentPopularity: 65, ageRelevance: 83, memoryTriggerScore: 66 },
    { itunesId: "zh_079", countryCode: "MY", peakYearRegional: 2011, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 83, memoryTriggerScore: 72 },
    { itunesId: "zh_080", countryCode: "MY", peakYearRegional: 2011, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 83, memoryTriggerScore: 72 },
    { itunesId: "zh_081", countryCode: "MY", peakYearRegional: 2011, historicalPopularity: 80, currentPopularity: 8, ageRelevance: 83, memoryTriggerScore: 86 },
    { itunesId: "zh_082", countryCode: "MY", peakYearRegional: 2011, historicalPopularity: 78, currentPopularity: 6, ageRelevance: 83, memoryTriggerScore: 88 },
    { itunesId: "zh_083", countryCode: "MY", peakYearRegional: 2011, historicalPopularity: 82, currentPopularity: 30, ageRelevance: 83, memoryTriggerScore: 73 },
    { itunesId: "zh_084", countryCode: "MY", peakYearRegional: 2011, historicalPopularity: 84, currentPopularity: 45, ageRelevance: 83, memoryTriggerScore: 70 },
    // 2012 — MY
    { itunesId: "zh_085", countryCode: "MY", peakYearRegional: 2012, historicalPopularity: 86, currentPopularity: 40, ageRelevance: 83, memoryTriggerScore: 72 },
    { itunesId: "zh_086", countryCode: "MY", peakYearRegional: 2012, historicalPopularity: 84, currentPopularity: 50, ageRelevance: 82, memoryTriggerScore: 68 },
    { itunesId: "zh_087", countryCode: "MY", peakYearRegional: 2012, historicalPopularity: 80, currentPopularity: 8, ageRelevance: 83, memoryTriggerScore: 86 },
    { itunesId: "zh_088", countryCode: "MY", peakYearRegional: 2012, historicalPopularity: 78, currentPopularity: 6, ageRelevance: 83, memoryTriggerScore: 84 },
    { itunesId: "zh_089", countryCode: "MY", peakYearRegional: 2012, historicalPopularity: 82, currentPopularity: 30, ageRelevance: 82, memoryTriggerScore: 74 },
    { itunesId: "zh_090", countryCode: "MY", peakYearRegional: 2012, historicalPopularity: 80, currentPopularity: 25, ageRelevance: 82, memoryTriggerScore: 72 },
    { itunesId: "zh_091", countryCode: "MY", peakYearRegional: 2012, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 82, memoryTriggerScore: 70 },
    // 2013 — MY
    { itunesId: "zh_092", countryCode: "MY", peakYearRegional: 2016, historicalPopularity: 90, currentPopularity: 75, ageRelevance: 82, memoryTriggerScore: 62 },
    { itunesId: "zh_093", countryCode: "MY", peakYearRegional: 2014, historicalPopularity: 80, currentPopularity: 5, ageRelevance: 82, memoryTriggerScore: 92 },
    { itunesId: "zh_094", countryCode: "MY", peakYearRegional: 2013, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 82, memoryTriggerScore: 72 },
    { itunesId: "zh_095", countryCode: "MY", peakYearRegional: 2013, historicalPopularity: 78, currentPopularity: 6, ageRelevance: 82, memoryTriggerScore: 86 },
    { itunesId: "zh_096", countryCode: "MY", peakYearRegional: 2013, historicalPopularity: 82, currentPopularity: 30, ageRelevance: 82, memoryTriggerScore: 74 },
    { itunesId: "zh_097", countryCode: "MY", peakYearRegional: 2014, historicalPopularity: 80, currentPopularity: 40, ageRelevance: 82, memoryTriggerScore: 70 },
    { itunesId: "zh_098", countryCode: "MY", peakYearRegional: 2013, historicalPopularity: 76, currentPopularity: 20, ageRelevance: 81, memoryTriggerScore: 72 },
    // 2014 — MY
    { itunesId: "zh_099", countryCode: "MY", peakYearRegional: 2015, historicalPopularity: 86, currentPopularity: 45, ageRelevance: 81, memoryTriggerScore: 70 },
    { itunesId: "zh_100", countryCode: "MY", peakYearRegional: 2015, historicalPopularity: 84, currentPopularity: 50, ageRelevance: 81, memoryTriggerScore: 68 },
    { itunesId: "zh_101", countryCode: "MY", peakYearRegional: 2014, historicalPopularity: 80, currentPopularity: 6, ageRelevance: 81, memoryTriggerScore: 86 },
    { itunesId: "zh_102", countryCode: "MY", peakYearRegional: 2014, historicalPopularity: 80, currentPopularity: 30, ageRelevance: 81, memoryTriggerScore: 72 },
    { itunesId: "zh_103", countryCode: "MY", peakYearRegional: 2014, historicalPopularity: 78, currentPopularity: 5, ageRelevance: 81, memoryTriggerScore: 88 },
    { itunesId: "zh_104", countryCode: "MY", peakYearRegional: 2014, historicalPopularity: 82, currentPopularity: 38, ageRelevance: 81, memoryTriggerScore: 72 },
    { itunesId: "zh_105", countryCode: "MY", peakYearRegional: 2014, historicalPopularity: 82, currentPopularity: 40, ageRelevance: 81, memoryTriggerScore: 70 },
    // 2015 — MY
    { itunesId: "zh_106", countryCode: "MY", peakYearRegional: 2016, historicalPopularity: 88, currentPopularity: 65, ageRelevance: 80, memoryTriggerScore: 65 },
    { itunesId: "zh_107", countryCode: "MY", peakYearRegional: 2015, historicalPopularity: 78, currentPopularity: 6, ageRelevance: 80, memoryTriggerScore: 86 },
    { itunesId: "zh_108", countryCode: "MY", peakYearRegional: 2015, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 80, memoryTriggerScore: 73 },
    { itunesId: "zh_109", countryCode: "MY", peakYearRegional: 2015, historicalPopularity: 76, currentPopularity: 5, ageRelevance: 80, memoryTriggerScore: 88 },
    { itunesId: "zh_110", countryCode: "MY", peakYearRegional: 2015, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 80, memoryTriggerScore: 73 },
    { itunesId: "zh_111", countryCode: "MY", peakYearRegional: 2015, historicalPopularity: 78, currentPopularity: 20, ageRelevance: 80, memoryTriggerScore: 74 },
    { itunesId: "zh_112", countryCode: "MY", peakYearRegional: 2015, historicalPopularity: 80, currentPopularity: 30, ageRelevance: 80, memoryTriggerScore: 72 },
    // 2016 — MY
    { itunesId: "zh_113", countryCode: "MY", peakYearRegional: 2016, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 79, memoryTriggerScore: 73 },
    { itunesId: "zh_114", countryCode: "MY", peakYearRegional: 2016, historicalPopularity: 78, currentPopularity: 5, ageRelevance: 79, memoryTriggerScore: 90 },
    { itunesId: "zh_115", countryCode: "MY", peakYearRegional: 2016, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 79, memoryTriggerScore: 72 },
    { itunesId: "zh_116", countryCode: "MY", peakYearRegional: 2016, historicalPopularity: 80, currentPopularity: 30, ageRelevance: 79, memoryTriggerScore: 74 },
    { itunesId: "zh_117", countryCode: "MY", peakYearRegional: 2016, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 79, memoryTriggerScore: 72 },
    { itunesId: "zh_118", countryCode: "MY", peakYearRegional: 2016, historicalPopularity: 76, currentPopularity: 6, ageRelevance: 79, memoryTriggerScore: 84 },
    { itunesId: "zh_119", countryCode: "MY", peakYearRegional: 2017, historicalPopularity: 78, currentPopularity: 20, ageRelevance: 79, memoryTriggerScore: 76 },
    // 2017 — MY
    { itunesId: "zh_120", countryCode: "MY", peakYearRegional: 2019, historicalPopularity: 88, currentPopularity: 70, ageRelevance: 78, memoryTriggerScore: 62 },
    { itunesId: "zh_121", countryCode: "MY", peakYearRegional: 2018, historicalPopularity: 86, currentPopularity: 60, ageRelevance: 78, memoryTriggerScore: 65 },
    { itunesId: "zh_122", countryCode: "MY", peakYearRegional: 2017, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 78, memoryTriggerScore: 72 },
    { itunesId: "zh_123", countryCode: "MY", peakYearRegional: 2017, historicalPopularity: 78, currentPopularity: 5, ageRelevance: 78, memoryTriggerScore: 90 },
    { itunesId: "zh_124", countryCode: "MY", peakYearRegional: 2017, historicalPopularity: 80, currentPopularity: 30, ageRelevance: 78, memoryTriggerScore: 74 },
    { itunesId: "zh_125", countryCode: "MY", peakYearRegional: 2017, historicalPopularity: 82, currentPopularity: 40, ageRelevance: 78, memoryTriggerScore: 72 },
    { itunesId: "zh_126", countryCode: "MY", peakYearRegional: 2017, historicalPopularity: 76, currentPopularity: 6, ageRelevance: 78, memoryTriggerScore: 86 },
    // ── MANDARIN — SG ────────────────────────────────────────────────────────
    // 2000 — SG
    { itunesId: "zh_001", countryCode: "SG", peakYearRegional: 2000, historicalPopularity: 80, currentPopularity: 30, ageRelevance: 85, memoryTriggerScore: 72 },
    { itunesId: "zh_002", countryCode: "SG", peakYearRegional: 2000, historicalPopularity: 78, currentPopularity: 8, ageRelevance: 86, memoryTriggerScore: 88 },
    { itunesId: "zh_003", countryCode: "SG", peakYearRegional: 2001, historicalPopularity: 82, currentPopularity: 25, ageRelevance: 85, memoryTriggerScore: 75 },
    { itunesId: "zh_004", countryCode: "SG", peakYearRegional: 2001, historicalPopularity: 84, currentPopularity: 20, ageRelevance: 86, memoryTriggerScore: 78 },
    { itunesId: "zh_005", countryCode: "SG", peakYearRegional: 2000, historicalPopularity: 76, currentPopularity: 6, ageRelevance: 85, memoryTriggerScore: 85 },
    { itunesId: "zh_006", countryCode: "SG", peakYearRegional: 2000, historicalPopularity: 78, currentPopularity: 35, ageRelevance: 84, memoryTriggerScore: 70 },
    { itunesId: "zh_007", countryCode: "SG", peakYearRegional: 2000, historicalPopularity: 72, currentPopularity: 5, ageRelevance: 83, memoryTriggerScore: 80 },
    { itunesId: "zh_008", countryCode: "SG", peakYearRegional: 2001, historicalPopularity: 90, currentPopularity: 70, ageRelevance: 88, memoryTriggerScore: 72 },
    { itunesId: "zh_009", countryCode: "SG", peakYearRegional: 2001, historicalPopularity: 86, currentPopularity: 55, ageRelevance: 87, memoryTriggerScore: 75 },
    { itunesId: "zh_010", countryCode: "SG", peakYearRegional: 2002, historicalPopularity: 88, currentPopularity: 50, ageRelevance: 87, memoryTriggerScore: 78 },
    { itunesId: "zh_011", countryCode: "SG", peakYearRegional: 2001, historicalPopularity: 82, currentPopularity: 10, ageRelevance: 86, memoryTriggerScore: 88 },
    { itunesId: "zh_012", countryCode: "SG", peakYearRegional: 2001, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 86, memoryTriggerScore: 72 },
    { itunesId: "zh_013", countryCode: "SG", peakYearRegional: 2002, historicalPopularity: 80, currentPopularity: 8, ageRelevance: 85, memoryTriggerScore: 84 },
    { itunesId: "zh_014", countryCode: "SG", peakYearRegional: 2001, historicalPopularity: 76, currentPopularity: 12, ageRelevance: 84, memoryTriggerScore: 70 },
    { itunesId: "zh_015", countryCode: "SG", peakYearRegional: 2002, historicalPopularity: 88, currentPopularity: 55, ageRelevance: 87, memoryTriggerScore: 72 },
    { itunesId: "zh_016", countryCode: "SG", peakYearRegional: 2002, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 86, memoryTriggerScore: 74 },
    { itunesId: "zh_017", countryCode: "SG", peakYearRegional: 2002, historicalPopularity: 86, currentPopularity: 6, ageRelevance: 87, memoryTriggerScore: 92 },
    { itunesId: "zh_018", countryCode: "SG", peakYearRegional: 2002, historicalPopularity: 82, currentPopularity: 30, ageRelevance: 86, memoryTriggerScore: 78 },
    { itunesId: "zh_019", countryCode: "SG", peakYearRegional: 2002, historicalPopularity: 85, currentPopularity: 45, ageRelevance: 86, memoryTriggerScore: 70 },
    { itunesId: "zh_020", countryCode: "SG", peakYearRegional: 2003, historicalPopularity: 84, currentPopularity: 8, ageRelevance: 86, memoryTriggerScore: 86 },
    { itunesId: "zh_021", countryCode: "SG", peakYearRegional: 2002, historicalPopularity: 86, currentPopularity: 50, ageRelevance: 86, memoryTriggerScore: 72 },
    { itunesId: "zh_022", countryCode: "SG", peakYearRegional: 2003, historicalPopularity: 88, currentPopularity: 60, ageRelevance: 87, memoryTriggerScore: 70 },
    { itunesId: "zh_023", countryCode: "SG", peakYearRegional: 2003, historicalPopularity: 84, currentPopularity: 6, ageRelevance: 87, memoryTriggerScore: 90 },
    { itunesId: "zh_024", countryCode: "SG", peakYearRegional: 2003, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 86, memoryTriggerScore: 75 },
    { itunesId: "zh_025", countryCode: "SG", peakYearRegional: 2003, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 86, memoryTriggerScore: 72 },
    { itunesId: "zh_026", countryCode: "SG", peakYearRegional: 2003, historicalPopularity: 80, currentPopularity: 8, ageRelevance: 86, memoryTriggerScore: 84 },
    { itunesId: "zh_027", countryCode: "SG", peakYearRegional: 2003, historicalPopularity: 82, currentPopularity: 30, ageRelevance: 86, memoryTriggerScore: 75 },
    { itunesId: "zh_028", countryCode: "SG", peakYearRegional: 2003, historicalPopularity: 78, currentPopularity: 25, ageRelevance: 85, memoryTriggerScore: 72 },
    { itunesId: "zh_029", countryCode: "SG", peakYearRegional: 2004, historicalPopularity: 92, currentPopularity: 70, ageRelevance: 88, memoryTriggerScore: 70 },
    { itunesId: "zh_030", countryCode: "SG", peakYearRegional: 2004, historicalPopularity: 88, currentPopularity: 55, ageRelevance: 87, memoryTriggerScore: 74 },
    { itunesId: "zh_031", countryCode: "SG", peakYearRegional: 2004, historicalPopularity: 84, currentPopularity: 35, ageRelevance: 86, memoryTriggerScore: 72 },
    { itunesId: "zh_032", countryCode: "SG", peakYearRegional: 2004, historicalPopularity: 82, currentPopularity: 8, ageRelevance: 87, memoryTriggerScore: 88 },
    { itunesId: "zh_033", countryCode: "SG", peakYearRegional: 2004, historicalPopularity: 80, currentPopularity: 30, ageRelevance: 86, memoryTriggerScore: 76 },
    { itunesId: "zh_034", countryCode: "SG", peakYearRegional: 2004, historicalPopularity: 78, currentPopularity: 6, ageRelevance: 86, memoryTriggerScore: 84 },
    { itunesId: "zh_035", countryCode: "SG", peakYearRegional: 2004, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 86, memoryTriggerScore: 70 },
    { itunesId: "zh_036", countryCode: "SG", peakYearRegional: 2005, historicalPopularity: 90, currentPopularity: 60, ageRelevance: 87, memoryTriggerScore: 70 },
    { itunesId: "zh_037", countryCode: "SG", peakYearRegional: 2005, historicalPopularity: 86, currentPopularity: 45, ageRelevance: 86, memoryTriggerScore: 74 },
    { itunesId: "zh_038", countryCode: "SG", peakYearRegional: 2005, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 86, memoryTriggerScore: 72 },
    { itunesId: "zh_039", countryCode: "SG", peakYearRegional: 2005, historicalPopularity: 82, currentPopularity: 6, ageRelevance: 87, memoryTriggerScore: 92 },
    { itunesId: "zh_040", countryCode: "SG", peakYearRegional: 2005, historicalPopularity: 80, currentPopularity: 5, ageRelevance: 87, memoryTriggerScore: 94 },
    { itunesId: "zh_041", countryCode: "SG", peakYearRegional: 2005, historicalPopularity: 86, currentPopularity: 50, ageRelevance: 86, memoryTriggerScore: 72 },
    { itunesId: "zh_042", countryCode: "SG", peakYearRegional: 2005, historicalPopularity: 84, currentPopularity: 45, ageRelevance: 86, memoryTriggerScore: 70 },
    { itunesId: "zh_043", countryCode: "SG", peakYearRegional: 2006, historicalPopularity: 90, currentPopularity: 62, ageRelevance: 86, memoryTriggerScore: 68 },
    { itunesId: "zh_044", countryCode: "SG", peakYearRegional: 2006, historicalPopularity: 86, currentPopularity: 45, ageRelevance: 86, memoryTriggerScore: 74 },
    { itunesId: "zh_045", countryCode: "SG", peakYearRegional: 2006, historicalPopularity: 82, currentPopularity: 8, ageRelevance: 86, memoryTriggerScore: 88 },
    { itunesId: "zh_046", countryCode: "SG", peakYearRegional: 2006, historicalPopularity: 80, currentPopularity: 5, ageRelevance: 86, memoryTriggerScore: 92 },
    { itunesId: "zh_047", countryCode: "SG", peakYearRegional: 2006, historicalPopularity: 84, currentPopularity: 30, ageRelevance: 85, memoryTriggerScore: 75 },
    { itunesId: "zh_048", countryCode: "SG", peakYearRegional: 2006, historicalPopularity: 78, currentPopularity: 20, ageRelevance: 85, memoryTriggerScore: 72 },
    { itunesId: "zh_049", countryCode: "SG", peakYearRegional: 2007, historicalPopularity: 76, currentPopularity: 6, ageRelevance: 85, memoryTriggerScore: 82 },
    { itunesId: "zh_050", countryCode: "SG", peakYearRegional: 2007, historicalPopularity: 88, currentPopularity: 55, ageRelevance: 86, memoryTriggerScore: 72 },
    { itunesId: "zh_051", countryCode: "SG", peakYearRegional: 2007, historicalPopularity: 84, currentPopularity: 35, ageRelevance: 85, memoryTriggerScore: 75 },
    { itunesId: "zh_052", countryCode: "SG", peakYearRegional: 2007, historicalPopularity: 82, currentPopularity: 8, ageRelevance: 86, memoryTriggerScore: 88 },
    { itunesId: "zh_053", countryCode: "SG", peakYearRegional: 2007, historicalPopularity: 80, currentPopularity: 30, ageRelevance: 85, memoryTriggerScore: 74 },
    { itunesId: "zh_054", countryCode: "SG", peakYearRegional: 2007, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 85, memoryTriggerScore: 72 },
    { itunesId: "zh_055", countryCode: "SG", peakYearRegional: 2007, historicalPopularity: 80, currentPopularity: 6, ageRelevance: 86, memoryTriggerScore: 86 },
    { itunesId: "zh_056", countryCode: "SG", peakYearRegional: 2007, historicalPopularity: 78, currentPopularity: 25, ageRelevance: 85, memoryTriggerScore: 72 },
    { itunesId: "zh_057", countryCode: "SG", peakYearRegional: 2008, historicalPopularity: 90, currentPopularity: 62, ageRelevance: 86, memoryTriggerScore: 70 },
    { itunesId: "zh_058", countryCode: "SG", peakYearRegional: 2008, historicalPopularity: 84, currentPopularity: 6, ageRelevance: 86, memoryTriggerScore: 92 },
    { itunesId: "zh_059", countryCode: "SG", peakYearRegional: 2008, historicalPopularity: 82, currentPopularity: 5, ageRelevance: 86, memoryTriggerScore: 94 },
    { itunesId: "zh_060", countryCode: "SG", peakYearRegional: 2008, historicalPopularity: 84, currentPopularity: 35, ageRelevance: 86, memoryTriggerScore: 75 },
    { itunesId: "zh_061", countryCode: "SG", peakYearRegional: 2008, historicalPopularity: 86, currentPopularity: 50, ageRelevance: 85, memoryTriggerScore: 70 },
    { itunesId: "zh_062", countryCode: "SG", peakYearRegional: 2008, historicalPopularity: 82, currentPopularity: 40, ageRelevance: 85, memoryTriggerScore: 72 },
    { itunesId: "zh_063", countryCode: "SG", peakYearRegional: 2008, historicalPopularity: 80, currentPopularity: 35, ageRelevance: 85, memoryTriggerScore: 74 },
    { itunesId: "zh_064", countryCode: "SG", peakYearRegional: 2009, historicalPopularity: 88, currentPopularity: 55, ageRelevance: 85, memoryTriggerScore: 70 },
    { itunesId: "zh_065", countryCode: "SG", peakYearRegional: 2009, historicalPopularity: 82, currentPopularity: 8, ageRelevance: 85, memoryTriggerScore: 88 },
    { itunesId: "zh_066", countryCode: "SG", peakYearRegional: 2009, historicalPopularity: 82, currentPopularity: 30, ageRelevance: 85, memoryTriggerScore: 75 },
    { itunesId: "zh_067", countryCode: "SG", peakYearRegional: 2009, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 85, memoryTriggerScore: 72 },
    { itunesId: "zh_068", countryCode: "SG", peakYearRegional: 2009, historicalPopularity: 80, currentPopularity: 6, ageRelevance: 85, memoryTriggerScore: 90 },
    { itunesId: "zh_069", countryCode: "SG", peakYearRegional: 2009, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 85, memoryTriggerScore: 73 },
    { itunesId: "zh_070", countryCode: "SG", peakYearRegional: 2009, historicalPopularity: 78, currentPopularity: 5, ageRelevance: 85, memoryTriggerScore: 84 },
    { itunesId: "zh_071", countryCode: "SG", peakYearRegional: 2010, historicalPopularity: 86, currentPopularity: 50, ageRelevance: 84, memoryTriggerScore: 70 },
    { itunesId: "zh_072", countryCode: "SG", peakYearRegional: 2010, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 84, memoryTriggerScore: 72 },
    { itunesId: "zh_073", countryCode: "SG", peakYearRegional: 2010, historicalPopularity: 82, currentPopularity: 30, ageRelevance: 84, memoryTriggerScore: 74 },
    { itunesId: "zh_074", countryCode: "SG", peakYearRegional: 2010, historicalPopularity: 78, currentPopularity: 6, ageRelevance: 84, memoryTriggerScore: 86 },
    { itunesId: "zh_075", countryCode: "SG", peakYearRegional: 2011, historicalPopularity: 80, currentPopularity: 5, ageRelevance: 84, memoryTriggerScore: 90 },
    { itunesId: "zh_076", countryCode: "SG", peakYearRegional: 2010, historicalPopularity: 82, currentPopularity: 38, ageRelevance: 84, memoryTriggerScore: 72 },
    { itunesId: "zh_077", countryCode: "SG", peakYearRegional: 2010, historicalPopularity: 80, currentPopularity: 35, ageRelevance: 83, memoryTriggerScore: 70 },
    { itunesId: "zh_078", countryCode: "SG", peakYearRegional: 2011, historicalPopularity: 88, currentPopularity: 65, ageRelevance: 83, memoryTriggerScore: 66 },
    { itunesId: "zh_079", countryCode: "SG", peakYearRegional: 2011, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 83, memoryTriggerScore: 72 },
    { itunesId: "zh_080", countryCode: "SG", peakYearRegional: 2011, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 83, memoryTriggerScore: 72 },
    { itunesId: "zh_081", countryCode: "SG", peakYearRegional: 2011, historicalPopularity: 80, currentPopularity: 8, ageRelevance: 83, memoryTriggerScore: 86 },
    { itunesId: "zh_082", countryCode: "SG", peakYearRegional: 2011, historicalPopularity: 78, currentPopularity: 6, ageRelevance: 83, memoryTriggerScore: 88 },
    { itunesId: "zh_083", countryCode: "SG", peakYearRegional: 2011, historicalPopularity: 82, currentPopularity: 30, ageRelevance: 83, memoryTriggerScore: 73 },
    { itunesId: "zh_084", countryCode: "SG", peakYearRegional: 2011, historicalPopularity: 84, currentPopularity: 45, ageRelevance: 83, memoryTriggerScore: 70 },
    { itunesId: "zh_085", countryCode: "SG", peakYearRegional: 2012, historicalPopularity: 86, currentPopularity: 40, ageRelevance: 83, memoryTriggerScore: 72 },
    { itunesId: "zh_086", countryCode: "SG", peakYearRegional: 2012, historicalPopularity: 84, currentPopularity: 50, ageRelevance: 82, memoryTriggerScore: 68 },
    { itunesId: "zh_087", countryCode: "SG", peakYearRegional: 2012, historicalPopularity: 80, currentPopularity: 8, ageRelevance: 83, memoryTriggerScore: 86 },
    { itunesId: "zh_088", countryCode: "SG", peakYearRegional: 2012, historicalPopularity: 78, currentPopularity: 6, ageRelevance: 83, memoryTriggerScore: 84 },
    { itunesId: "zh_089", countryCode: "SG", peakYearRegional: 2012, historicalPopularity: 82, currentPopularity: 30, ageRelevance: 82, memoryTriggerScore: 74 },
    { itunesId: "zh_090", countryCode: "SG", peakYearRegional: 2012, historicalPopularity: 80, currentPopularity: 25, ageRelevance: 82, memoryTriggerScore: 72 },
    { itunesId: "zh_091", countryCode: "SG", peakYearRegional: 2012, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 82, memoryTriggerScore: 70 },
    { itunesId: "zh_092", countryCode: "SG", peakYearRegional: 2016, historicalPopularity: 90, currentPopularity: 75, ageRelevance: 82, memoryTriggerScore: 62 },
    { itunesId: "zh_093", countryCode: "SG", peakYearRegional: 2014, historicalPopularity: 80, currentPopularity: 5, ageRelevance: 82, memoryTriggerScore: 92 },
    { itunesId: "zh_094", countryCode: "SG", peakYearRegional: 2013, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 82, memoryTriggerScore: 72 },
    { itunesId: "zh_095", countryCode: "SG", peakYearRegional: 2013, historicalPopularity: 78, currentPopularity: 6, ageRelevance: 82, memoryTriggerScore: 86 },
    { itunesId: "zh_096", countryCode: "SG", peakYearRegional: 2013, historicalPopularity: 82, currentPopularity: 30, ageRelevance: 82, memoryTriggerScore: 74 },
    { itunesId: "zh_097", countryCode: "SG", peakYearRegional: 2014, historicalPopularity: 80, currentPopularity: 40, ageRelevance: 82, memoryTriggerScore: 70 },
    { itunesId: "zh_098", countryCode: "SG", peakYearRegional: 2013, historicalPopularity: 76, currentPopularity: 20, ageRelevance: 81, memoryTriggerScore: 72 },
    { itunesId: "zh_099", countryCode: "SG", peakYearRegional: 2015, historicalPopularity: 86, currentPopularity: 45, ageRelevance: 81, memoryTriggerScore: 70 },
    { itunesId: "zh_100", countryCode: "SG", peakYearRegional: 2015, historicalPopularity: 84, currentPopularity: 50, ageRelevance: 81, memoryTriggerScore: 68 },
    { itunesId: "zh_101", countryCode: "SG", peakYearRegional: 2014, historicalPopularity: 80, currentPopularity: 6, ageRelevance: 81, memoryTriggerScore: 86 },
    { itunesId: "zh_102", countryCode: "SG", peakYearRegional: 2014, historicalPopularity: 80, currentPopularity: 30, ageRelevance: 81, memoryTriggerScore: 72 },
    { itunesId: "zh_103", countryCode: "SG", peakYearRegional: 2014, historicalPopularity: 78, currentPopularity: 5, ageRelevance: 81, memoryTriggerScore: 88 },
    { itunesId: "zh_104", countryCode: "SG", peakYearRegional: 2014, historicalPopularity: 82, currentPopularity: 38, ageRelevance: 81, memoryTriggerScore: 72 },
    { itunesId: "zh_105", countryCode: "SG", peakYearRegional: 2014, historicalPopularity: 82, currentPopularity: 40, ageRelevance: 81, memoryTriggerScore: 70 },
    { itunesId: "zh_106", countryCode: "SG", peakYearRegional: 2016, historicalPopularity: 88, currentPopularity: 65, ageRelevance: 80, memoryTriggerScore: 65 },
    { itunesId: "zh_107", countryCode: "SG", peakYearRegional: 2015, historicalPopularity: 78, currentPopularity: 6, ageRelevance: 80, memoryTriggerScore: 86 },
    { itunesId: "zh_108", countryCode: "SG", peakYearRegional: 2015, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 80, memoryTriggerScore: 73 },
    { itunesId: "zh_109", countryCode: "SG", peakYearRegional: 2015, historicalPopularity: 76, currentPopularity: 5, ageRelevance: 80, memoryTriggerScore: 88 },
    { itunesId: "zh_110", countryCode: "SG", peakYearRegional: 2015, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 80, memoryTriggerScore: 73 },
    { itunesId: "zh_111", countryCode: "SG", peakYearRegional: 2015, historicalPopularity: 78, currentPopularity: 20, ageRelevance: 80, memoryTriggerScore: 74 },
    { itunesId: "zh_112", countryCode: "SG", peakYearRegional: 2015, historicalPopularity: 80, currentPopularity: 30, ageRelevance: 80, memoryTriggerScore: 72 },
    { itunesId: "zh_113", countryCode: "SG", peakYearRegional: 2016, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 79, memoryTriggerScore: 73 },
    { itunesId: "zh_114", countryCode: "SG", peakYearRegional: 2016, historicalPopularity: 78, currentPopularity: 5, ageRelevance: 79, memoryTriggerScore: 90 },
    { itunesId: "zh_115", countryCode: "SG", peakYearRegional: 2016, historicalPopularity: 84, currentPopularity: 40, ageRelevance: 79, memoryTriggerScore: 72 },
    { itunesId: "zh_116", countryCode: "SG", peakYearRegional: 2016, historicalPopularity: 80, currentPopularity: 30, ageRelevance: 79, memoryTriggerScore: 74 },
    { itunesId: "zh_117", countryCode: "SG", peakYearRegional: 2016, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 79, memoryTriggerScore: 72 },
    { itunesId: "zh_118", countryCode: "SG", peakYearRegional: 2016, historicalPopularity: 76, currentPopularity: 6, ageRelevance: 79, memoryTriggerScore: 84 },
    { itunesId: "zh_119", countryCode: "SG", peakYearRegional: 2017, historicalPopularity: 78, currentPopularity: 20, ageRelevance: 79, memoryTriggerScore: 76 },
    { itunesId: "zh_120", countryCode: "SG", peakYearRegional: 2019, historicalPopularity: 88, currentPopularity: 70, ageRelevance: 78, memoryTriggerScore: 62 },
    { itunesId: "zh_121", countryCode: "SG", peakYearRegional: 2018, historicalPopularity: 86, currentPopularity: 60, ageRelevance: 78, memoryTriggerScore: 65 },
    { itunesId: "zh_122", countryCode: "SG", peakYearRegional: 2017, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 78, memoryTriggerScore: 72 },
    { itunesId: "zh_123", countryCode: "SG", peakYearRegional: 2017, historicalPopularity: 78, currentPopularity: 5, ageRelevance: 78, memoryTriggerScore: 90 },
    { itunesId: "zh_124", countryCode: "SG", peakYearRegional: 2017, historicalPopularity: 80, currentPopularity: 30, ageRelevance: 78, memoryTriggerScore: 74 },
    { itunesId: "zh_125", countryCode: "SG", peakYearRegional: 2017, historicalPopularity: 82, currentPopularity: 40, ageRelevance: 78, memoryTriggerScore: 72 },
    { itunesId: "zh_126", countryCode: "SG", peakYearRegional: 2017, historicalPopularity: 76, currentPopularity: 6, ageRelevance: 78, memoryTriggerScore: 86 },
    // ── ENGLISH 2018–2026 — MY + SG ──────────────────────────────────────────
    // 2018 — MY
    { itunesId: "en_18_01", countryCode: "MY", peakYearRegional: 2018, historicalPopularity: 90, currentPopularity: 55, ageRelevance: 76, memoryTriggerScore: 65 },
    { itunesId: "en_18_02", countryCode: "MY", peakYearRegional: 2018, historicalPopularity: 87, currentPopularity: 45, ageRelevance: 77, memoryTriggerScore: 68 },
    { itunesId: "en_18_03", countryCode: "MY", peakYearRegional: 2018, historicalPopularity: 85, currentPopularity: 60, ageRelevance: 76, memoryTriggerScore: 65 },
    { itunesId: "en_18_04", countryCode: "MY", peakYearRegional: 2018, historicalPopularity: 72, currentPopularity: 6, ageRelevance: 76, memoryTriggerScore: 82 },
    // 2018 — SG
    { itunesId: "en_18_01", countryCode: "SG", peakYearRegional: 2018, historicalPopularity: 90, currentPopularity: 55, ageRelevance: 76, memoryTriggerScore: 65 },
    { itunesId: "en_18_02", countryCode: "SG", peakYearRegional: 2018, historicalPopularity: 87, currentPopularity: 45, ageRelevance: 77, memoryTriggerScore: 68 },
    { itunesId: "en_18_03", countryCode: "SG", peakYearRegional: 2018, historicalPopularity: 85, currentPopularity: 60, ageRelevance: 76, memoryTriggerScore: 65 },
    { itunesId: "en_18_04", countryCode: "SG", peakYearRegional: 2018, historicalPopularity: 72, currentPopularity: 6, ageRelevance: 76, memoryTriggerScore: 82 },
    // 2019 — MY
    { itunesId: "en_19_01", countryCode: "MY", peakYearRegional: 2019, historicalPopularity: 92, currentPopularity: 50, ageRelevance: 75, memoryTriggerScore: 65 },
    { itunesId: "en_19_02", countryCode: "MY", peakYearRegional: 2019, historicalPopularity: 88, currentPopularity: 60, ageRelevance: 76, memoryTriggerScore: 66 },
    { itunesId: "en_19_03", countryCode: "MY", peakYearRegional: 2019, historicalPopularity: 87, currentPopularity: 62, ageRelevance: 75, memoryTriggerScore: 64 },
    { itunesId: "en_19_04", countryCode: "MY", peakYearRegional: 2019, historicalPopularity: 74, currentPopularity: 8, ageRelevance: 75, memoryTriggerScore: 78 },
    // 2019 — SG
    { itunesId: "en_19_01", countryCode: "SG", peakYearRegional: 2019, historicalPopularity: 92, currentPopularity: 50, ageRelevance: 75, memoryTriggerScore: 65 },
    { itunesId: "en_19_02", countryCode: "SG", peakYearRegional: 2019, historicalPopularity: 88, currentPopularity: 60, ageRelevance: 76, memoryTriggerScore: 66 },
    { itunesId: "en_19_03", countryCode: "SG", peakYearRegional: 2019, historicalPopularity: 87, currentPopularity: 62, ageRelevance: 75, memoryTriggerScore: 64 },
    { itunesId: "en_19_04", countryCode: "SG", peakYearRegional: 2019, historicalPopularity: 74, currentPopularity: 8, ageRelevance: 75, memoryTriggerScore: 78 },
    // 2020 — MY
    { itunesId: "en_20_01", countryCode: "MY", peakYearRegional: 2020, historicalPopularity: 93, currentPopularity: 70, ageRelevance: 74, memoryTriggerScore: 62 },
    { itunesId: "en_20_02", countryCode: "MY", peakYearRegional: 2020, historicalPopularity: 88, currentPopularity: 55, ageRelevance: 74, memoryTriggerScore: 65 },
    { itunesId: "en_20_03", countryCode: "MY", peakYearRegional: 2020, historicalPopularity: 88, currentPopularity: 50, ageRelevance: 74, memoryTriggerScore: 65 },
    { itunesId: "en_20_04", countryCode: "MY", peakYearRegional: 2020, historicalPopularity: 70, currentPopularity: 7, ageRelevance: 74, memoryTriggerScore: 75 },
    // 2020 — SG
    { itunesId: "en_20_01", countryCode: "SG", peakYearRegional: 2020, historicalPopularity: 93, currentPopularity: 70, ageRelevance: 74, memoryTriggerScore: 62 },
    { itunesId: "en_20_02", countryCode: "SG", peakYearRegional: 2020, historicalPopularity: 88, currentPopularity: 55, ageRelevance: 74, memoryTriggerScore: 65 },
    { itunesId: "en_20_03", countryCode: "SG", peakYearRegional: 2020, historicalPopularity: 88, currentPopularity: 50, ageRelevance: 74, memoryTriggerScore: 65 },
    { itunesId: "en_20_04", countryCode: "SG", peakYearRegional: 2020, historicalPopularity: 70, currentPopularity: 7, ageRelevance: 74, memoryTriggerScore: 75 },
    // 2021 — MY
    { itunesId: "en_21_01", countryCode: "MY", peakYearRegional: 2021, historicalPopularity: 90, currentPopularity: 55, ageRelevance: 73, memoryTriggerScore: 62 },
    { itunesId: "en_21_02", countryCode: "MY", peakYearRegional: 2021, historicalPopularity: 88, currentPopularity: 48, ageRelevance: 73, memoryTriggerScore: 64 },
    { itunesId: "en_21_03", countryCode: "MY", peakYearRegional: 2021, historicalPopularity: 87, currentPopularity: 58, ageRelevance: 73, memoryTriggerScore: 62 },
    { itunesId: "en_21_04", countryCode: "MY", peakYearRegional: 2021, historicalPopularity: 72, currentPopularity: 7, ageRelevance: 73, memoryTriggerScore: 72 },
    // 2021 — SG
    { itunesId: "en_21_01", countryCode: "SG", peakYearRegional: 2021, historicalPopularity: 90, currentPopularity: 55, ageRelevance: 73, memoryTriggerScore: 62 },
    { itunesId: "en_21_02", countryCode: "SG", peakYearRegional: 2021, historicalPopularity: 88, currentPopularity: 48, ageRelevance: 73, memoryTriggerScore: 64 },
    { itunesId: "en_21_03", countryCode: "SG", peakYearRegional: 2021, historicalPopularity: 87, currentPopularity: 58, ageRelevance: 73, memoryTriggerScore: 62 },
    { itunesId: "en_21_04", countryCode: "SG", peakYearRegional: 2021, historicalPopularity: 72, currentPopularity: 7, ageRelevance: 73, memoryTriggerScore: 72 },
    // 2022 — MY
    { itunesId: "en_22_01", countryCode: "MY", peakYearRegional: 2022, historicalPopularity: 91, currentPopularity: 62, ageRelevance: 72, memoryTriggerScore: 60 },
    { itunesId: "en_22_02", countryCode: "MY", peakYearRegional: 2022, historicalPopularity: 87, currentPopularity: 50, ageRelevance: 72, memoryTriggerScore: 63 },
    { itunesId: "en_22_03", countryCode: "MY", peakYearRegional: 2022, historicalPopularity: 86, currentPopularity: 45, ageRelevance: 72, memoryTriggerScore: 63 },
    { itunesId: "en_22_04", countryCode: "MY", peakYearRegional: 2022, historicalPopularity: 73, currentPopularity: 8, ageRelevance: 72, memoryTriggerScore: 78 },
    // 2022 — SG
    { itunesId: "en_22_01", countryCode: "SG", peakYearRegional: 2022, historicalPopularity: 91, currentPopularity: 62, ageRelevance: 72, memoryTriggerScore: 60 },
    { itunesId: "en_22_02", countryCode: "SG", peakYearRegional: 2022, historicalPopularity: 87, currentPopularity: 50, ageRelevance: 72, memoryTriggerScore: 63 },
    { itunesId: "en_22_03", countryCode: "SG", peakYearRegional: 2022, historicalPopularity: 86, currentPopularity: 45, ageRelevance: 72, memoryTriggerScore: 63 },
    { itunesId: "en_22_04", countryCode: "SG", peakYearRegional: 2022, historicalPopularity: 73, currentPopularity: 8, ageRelevance: 72, memoryTriggerScore: 78 },
    // 2023 — MY
    { itunesId: "en_23_01", countryCode: "MY", peakYearRegional: 2023, historicalPopularity: 90, currentPopularity: 58, ageRelevance: 71, memoryTriggerScore: 60 },
    { itunesId: "en_23_02", countryCode: "MY", peakYearRegional: 2023, historicalPopularity: 88, currentPopularity: 72, ageRelevance: 71, memoryTriggerScore: 58 },
    { itunesId: "en_23_03", countryCode: "MY", peakYearRegional: 2023, historicalPopularity: 86, currentPopularity: 52, ageRelevance: 71, memoryTriggerScore: 62 },
    { itunesId: "en_23_04", countryCode: "MY", peakYearRegional: 2023, historicalPopularity: 70, currentPopularity: 7, ageRelevance: 71, memoryTriggerScore: 74 },
    // 2023 — SG
    { itunesId: "en_23_01", countryCode: "SG", peakYearRegional: 2023, historicalPopularity: 90, currentPopularity: 58, ageRelevance: 71, memoryTriggerScore: 60 },
    { itunesId: "en_23_02", countryCode: "SG", peakYearRegional: 2023, historicalPopularity: 88, currentPopularity: 72, ageRelevance: 71, memoryTriggerScore: 58 },
    { itunesId: "en_23_03", countryCode: "SG", peakYearRegional: 2023, historicalPopularity: 86, currentPopularity: 52, ageRelevance: 71, memoryTriggerScore: 62 },
    { itunesId: "en_23_04", countryCode: "SG", peakYearRegional: 2023, historicalPopularity: 70, currentPopularity: 7, ageRelevance: 71, memoryTriggerScore: 74 },
    // 2024 — MY
    { itunesId: "en_24_01", countryCode: "MY", peakYearRegional: 2024, historicalPopularity: 89, currentPopularity: 65, ageRelevance: 70, memoryTriggerScore: 58 },
    { itunesId: "en_24_02", countryCode: "MY", peakYearRegional: 2024, historicalPopularity: 86, currentPopularity: 55, ageRelevance: 70, memoryTriggerScore: 60 },
    { itunesId: "en_24_03", countryCode: "MY", peakYearRegional: 2024, historicalPopularity: 88, currentPopularity: 62, ageRelevance: 70, memoryTriggerScore: 58 },
    { itunesId: "en_24_04", countryCode: "MY", peakYearRegional: 2024, historicalPopularity: 68, currentPopularity: 6, ageRelevance: 70, memoryTriggerScore: 75 },
    // 2024 — SG
    { itunesId: "en_24_01", countryCode: "SG", peakYearRegional: 2024, historicalPopularity: 89, currentPopularity: 65, ageRelevance: 70, memoryTriggerScore: 58 },
    { itunesId: "en_24_02", countryCode: "SG", peakYearRegional: 2024, historicalPopularity: 86, currentPopularity: 55, ageRelevance: 70, memoryTriggerScore: 60 },
    { itunesId: "en_24_03", countryCode: "SG", peakYearRegional: 2024, historicalPopularity: 88, currentPopularity: 62, ageRelevance: 70, memoryTriggerScore: 58 },
    { itunesId: "en_24_04", countryCode: "SG", peakYearRegional: 2024, historicalPopularity: 68, currentPopularity: 6, ageRelevance: 70, memoryTriggerScore: 75 },
    // 2025 — MY
    { itunesId: "en_25_01", countryCode: "MY", peakYearRegional: 2025, historicalPopularity: 88, currentPopularity: 68, ageRelevance: 69, memoryTriggerScore: 56 },
    { itunesId: "en_25_02", countryCode: "MY", peakYearRegional: 2025, historicalPopularity: 86, currentPopularity: 60, ageRelevance: 69, memoryTriggerScore: 57 },
    { itunesId: "en_25_03", countryCode: "MY", peakYearRegional: 2025, historicalPopularity: 87, currentPopularity: 62, ageRelevance: 69, memoryTriggerScore: 56 },
    { itunesId: "en_25_04", countryCode: "MY", peakYearRegional: 2025, historicalPopularity: 66, currentPopularity: 6, ageRelevance: 69, memoryTriggerScore: 70 },
    // 2025 — SG
    { itunesId: "en_25_01", countryCode: "SG", peakYearRegional: 2025, historicalPopularity: 88, currentPopularity: 68, ageRelevance: 69, memoryTriggerScore: 56 },
    { itunesId: "en_25_02", countryCode: "SG", peakYearRegional: 2025, historicalPopularity: 86, currentPopularity: 60, ageRelevance: 69, memoryTriggerScore: 57 },
    { itunesId: "en_25_03", countryCode: "SG", peakYearRegional: 2025, historicalPopularity: 87, currentPopularity: 62, ageRelevance: 69, memoryTriggerScore: 56 },
    { itunesId: "en_25_04", countryCode: "SG", peakYearRegional: 2025, historicalPopularity: 66, currentPopularity: 6, ageRelevance: 69, memoryTriggerScore: 70 },
    // 2026 — MY
    { itunesId: "en_26_01", countryCode: "MY", peakYearRegional: 2026, historicalPopularity: 87, currentPopularity: 70, ageRelevance: 68, memoryTriggerScore: 55 },
    { itunesId: "en_26_02", countryCode: "MY", peakYearRegional: 2026, historicalPopularity: 84, currentPopularity: 52, ageRelevance: 68, memoryTriggerScore: 58 },
    { itunesId: "en_26_03", countryCode: "MY", peakYearRegional: 2026, historicalPopularity: 85, currentPopularity: 60, ageRelevance: 68, memoryTriggerScore: 56 },
    { itunesId: "en_26_04", countryCode: "MY", peakYearRegional: 2026, historicalPopularity: 65, currentPopularity: 5, ageRelevance: 68, memoryTriggerScore: 72 },
    // 2026 — SG
    { itunesId: "en_26_01", countryCode: "SG", peakYearRegional: 2026, historicalPopularity: 87, currentPopularity: 70, ageRelevance: 68, memoryTriggerScore: 55 },
    { itunesId: "en_26_02", countryCode: "SG", peakYearRegional: 2026, historicalPopularity: 84, currentPopularity: 52, ageRelevance: 68, memoryTriggerScore: 58 },
    { itunesId: "en_26_03", countryCode: "SG", peakYearRegional: 2026, historicalPopularity: 85, currentPopularity: 60, ageRelevance: 68, memoryTriggerScore: 56 },
    { itunesId: "en_26_04", countryCode: "SG", peakYearRegional: 2026, historicalPopularity: 65, currentPopularity: 5, ageRelevance: 68, memoryTriggerScore: 72 },
    // ── MANDARIN 2018–2026 — MY + SG ─────────────────────────────────────────
    // 2018 — MY
    { itunesId: "zh_127", countryCode: "MY", peakYearRegional: 2018, historicalPopularity: 86, currentPopularity: 48, ageRelevance: 76, memoryTriggerScore: 65 },
    { itunesId: "zh_128", countryCode: "MY", peakYearRegional: 2018, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 76, memoryTriggerScore: 68 },
    { itunesId: "zh_129", countryCode: "MY", peakYearRegional: 2018, historicalPopularity: 80, currentPopularity: 40, ageRelevance: 76, memoryTriggerScore: 65 },
    { itunesId: "zh_130", countryCode: "MY", peakYearRegional: 2018, historicalPopularity: 68, currentPopularity: 6, ageRelevance: 76, memoryTriggerScore: 84 },
    // 2018 — SG
    { itunesId: "zh_127", countryCode: "SG", peakYearRegional: 2018, historicalPopularity: 86, currentPopularity: 48, ageRelevance: 76, memoryTriggerScore: 65 },
    { itunesId: "zh_128", countryCode: "SG", peakYearRegional: 2018, historicalPopularity: 82, currentPopularity: 35, ageRelevance: 76, memoryTriggerScore: 68 },
    { itunesId: "zh_129", countryCode: "SG", peakYearRegional: 2018, historicalPopularity: 80, currentPopularity: 40, ageRelevance: 76, memoryTriggerScore: 65 },
    { itunesId: "zh_130", countryCode: "SG", peakYearRegional: 2018, historicalPopularity: 68, currentPopularity: 6, ageRelevance: 76, memoryTriggerScore: 84 },
    // 2019 — MY
    { itunesId: "zh_131", countryCode: "MY", peakYearRegional: 2019, historicalPopularity: 84, currentPopularity: 38, ageRelevance: 75, memoryTriggerScore: 66 },
    { itunesId: "zh_132", countryCode: "MY", peakYearRegional: 2019, historicalPopularity: 82, currentPopularity: 42, ageRelevance: 75, memoryTriggerScore: 64 },
    { itunesId: "zh_133", countryCode: "MY", peakYearRegional: 2019, historicalPopularity: 80, currentPopularity: 35, ageRelevance: 75, memoryTriggerScore: 66 },
    { itunesId: "zh_134", countryCode: "MY", peakYearRegional: 2019, historicalPopularity: 66, currentPopularity: 5, ageRelevance: 75, memoryTriggerScore: 82 },
    // 2019 — SG
    { itunesId: "zh_131", countryCode: "SG", peakYearRegional: 2019, historicalPopularity: 84, currentPopularity: 38, ageRelevance: 75, memoryTriggerScore: 66 },
    { itunesId: "zh_132", countryCode: "SG", peakYearRegional: 2019, historicalPopularity: 82, currentPopularity: 42, ageRelevance: 75, memoryTriggerScore: 64 },
    { itunesId: "zh_133", countryCode: "SG", peakYearRegional: 2019, historicalPopularity: 80, currentPopularity: 35, ageRelevance: 75, memoryTriggerScore: 66 },
    { itunesId: "zh_134", countryCode: "SG", peakYearRegional: 2019, historicalPopularity: 66, currentPopularity: 5, ageRelevance: 75, memoryTriggerScore: 82 },
    // 2020 — MY
    { itunesId: "zh_135", countryCode: "MY", peakYearRegional: 2020, historicalPopularity: 86, currentPopularity: 50, ageRelevance: 74, memoryTriggerScore: 64 },
    { itunesId: "zh_136", countryCode: "MY", peakYearRegional: 2020, historicalPopularity: 82, currentPopularity: 40, ageRelevance: 74, memoryTriggerScore: 65 },
    { itunesId: "zh_137", countryCode: "MY", peakYearRegional: 2020, historicalPopularity: 80, currentPopularity: 38, ageRelevance: 74, memoryTriggerScore: 64 },
    { itunesId: "zh_138", countryCode: "MY", peakYearRegional: 2020, historicalPopularity: 65, currentPopularity: 5, ageRelevance: 74, memoryTriggerScore: 86 },
    // 2020 — SG
    { itunesId: "zh_135", countryCode: "SG", peakYearRegional: 2020, historicalPopularity: 86, currentPopularity: 50, ageRelevance: 74, memoryTriggerScore: 64 },
    { itunesId: "zh_136", countryCode: "SG", peakYearRegional: 2020, historicalPopularity: 82, currentPopularity: 40, ageRelevance: 74, memoryTriggerScore: 65 },
    { itunesId: "zh_137", countryCode: "SG", peakYearRegional: 2020, historicalPopularity: 80, currentPopularity: 38, ageRelevance: 74, memoryTriggerScore: 64 },
    { itunesId: "zh_138", countryCode: "SG", peakYearRegional: 2020, historicalPopularity: 65, currentPopularity: 5, ageRelevance: 74, memoryTriggerScore: 86 },
    // 2021 — MY
    { itunesId: "zh_139", countryCode: "MY", peakYearRegional: 2021, historicalPopularity: 84, currentPopularity: 45, ageRelevance: 73, memoryTriggerScore: 63 },
    { itunesId: "zh_140", countryCode: "MY", peakYearRegional: 2021, historicalPopularity: 82, currentPopularity: 40, ageRelevance: 73, memoryTriggerScore: 65 },
    { itunesId: "zh_141", countryCode: "MY", peakYearRegional: 2021, historicalPopularity: 80, currentPopularity: 55, ageRelevance: 73, memoryTriggerScore: 60 },
    { itunesId: "zh_142", countryCode: "MY", peakYearRegional: 2021, historicalPopularity: 64, currentPopularity: 6, ageRelevance: 73, memoryTriggerScore: 80 },
    // 2021 — SG
    { itunesId: "zh_139", countryCode: "SG", peakYearRegional: 2021, historicalPopularity: 84, currentPopularity: 45, ageRelevance: 73, memoryTriggerScore: 63 },
    { itunesId: "zh_140", countryCode: "SG", peakYearRegional: 2021, historicalPopularity: 82, currentPopularity: 40, ageRelevance: 73, memoryTriggerScore: 65 },
    { itunesId: "zh_141", countryCode: "SG", peakYearRegional: 2021, historicalPopularity: 80, currentPopularity: 55, ageRelevance: 73, memoryTriggerScore: 60 },
    { itunesId: "zh_142", countryCode: "SG", peakYearRegional: 2021, historicalPopularity: 64, currentPopularity: 6, ageRelevance: 73, memoryTriggerScore: 80 },
    // 2022 — MY
    { itunesId: "zh_143", countryCode: "MY", peakYearRegional: 2022, historicalPopularity: 85, currentPopularity: 50, ageRelevance: 72, memoryTriggerScore: 62 },
    { itunesId: "zh_144", countryCode: "MY", peakYearRegional: 2022, historicalPopularity: 80, currentPopularity: 38, ageRelevance: 72, memoryTriggerScore: 65 },
    { itunesId: "zh_145", countryCode: "MY", peakYearRegional: 2022, historicalPopularity: 78, currentPopularity: 40, ageRelevance: 72, memoryTriggerScore: 63 },
    { itunesId: "zh_146", countryCode: "MY", peakYearRegional: 2022, historicalPopularity: 62, currentPopularity: 5, ageRelevance: 72, memoryTriggerScore: 78 },
    // 2022 — SG
    { itunesId: "zh_143", countryCode: "SG", peakYearRegional: 2022, historicalPopularity: 85, currentPopularity: 50, ageRelevance: 72, memoryTriggerScore: 62 },
    { itunesId: "zh_144", countryCode: "SG", peakYearRegional: 2022, historicalPopularity: 80, currentPopularity: 38, ageRelevance: 72, memoryTriggerScore: 65 },
    { itunesId: "zh_145", countryCode: "SG", peakYearRegional: 2022, historicalPopularity: 78, currentPopularity: 40, ageRelevance: 72, memoryTriggerScore: 63 },
    { itunesId: "zh_146", countryCode: "SG", peakYearRegional: 2022, historicalPopularity: 62, currentPopularity: 5, ageRelevance: 72, memoryTriggerScore: 78 },
    // 2023 — MY
    { itunesId: "zh_147", countryCode: "MY", peakYearRegional: 2023, historicalPopularity: 83, currentPopularity: 48, ageRelevance: 71, memoryTriggerScore: 62 },
    { itunesId: "zh_148", countryCode: "MY", peakYearRegional: 2023, historicalPopularity: 80, currentPopularity: 45, ageRelevance: 71, memoryTriggerScore: 63 },
    { itunesId: "zh_149", countryCode: "MY", peakYearRegional: 2023, historicalPopularity: 78, currentPopularity: 38, ageRelevance: 71, memoryTriggerScore: 64 },
    { itunesId: "zh_150", countryCode: "MY", peakYearRegional: 2023, historicalPopularity: 60, currentPopularity: 5, ageRelevance: 71, memoryTriggerScore: 76 },
    // 2023 — SG
    { itunesId: "zh_147", countryCode: "SG", peakYearRegional: 2023, historicalPopularity: 83, currentPopularity: 48, ageRelevance: 71, memoryTriggerScore: 62 },
    { itunesId: "zh_148", countryCode: "SG", peakYearRegional: 2023, historicalPopularity: 80, currentPopularity: 45, ageRelevance: 71, memoryTriggerScore: 63 },
    { itunesId: "zh_149", countryCode: "SG", peakYearRegional: 2023, historicalPopularity: 78, currentPopularity: 38, ageRelevance: 71, memoryTriggerScore: 64 },
    { itunesId: "zh_150", countryCode: "SG", peakYearRegional: 2023, historicalPopularity: 60, currentPopularity: 5, ageRelevance: 71, memoryTriggerScore: 76 },
    // 2024 — MY
    { itunesId: "zh_151", countryCode: "MY", peakYearRegional: 2024, historicalPopularity: 82, currentPopularity: 50, ageRelevance: 70, memoryTriggerScore: 60 },
    { itunesId: "zh_152", countryCode: "MY", peakYearRegional: 2024, historicalPopularity: 80, currentPopularity: 45, ageRelevance: 70, memoryTriggerScore: 62 },
    { itunesId: "zh_153", countryCode: "MY", peakYearRegional: 2024, historicalPopularity: 78, currentPopularity: 42, ageRelevance: 70, memoryTriggerScore: 62 },
    { itunesId: "zh_154", countryCode: "MY", peakYearRegional: 2024, historicalPopularity: 58, currentPopularity: 5, ageRelevance: 70, memoryTriggerScore: 74 },
    // 2024 — SG
    { itunesId: "zh_151", countryCode: "SG", peakYearRegional: 2024, historicalPopularity: 82, currentPopularity: 50, ageRelevance: 70, memoryTriggerScore: 60 },
    { itunesId: "zh_152", countryCode: "SG", peakYearRegional: 2024, historicalPopularity: 80, currentPopularity: 45, ageRelevance: 70, memoryTriggerScore: 62 },
    { itunesId: "zh_153", countryCode: "SG", peakYearRegional: 2024, historicalPopularity: 78, currentPopularity: 42, ageRelevance: 70, memoryTriggerScore: 62 },
    { itunesId: "zh_154", countryCode: "SG", peakYearRegional: 2024, historicalPopularity: 58, currentPopularity: 5, ageRelevance: 70, memoryTriggerScore: 74 },
    // 2025 — MY
    { itunesId: "zh_155", countryCode: "MY", peakYearRegional: 2025, historicalPopularity: 80, currentPopularity: 55, ageRelevance: 69, memoryTriggerScore: 58 },
    { itunesId: "zh_156", countryCode: "MY", peakYearRegional: 2025, historicalPopularity: 78, currentPopularity: 48, ageRelevance: 69, memoryTriggerScore: 60 },
    { itunesId: "zh_157", countryCode: "MY", peakYearRegional: 2025, historicalPopularity: 78, currentPopularity: 45, ageRelevance: 69, memoryTriggerScore: 60 },
    { itunesId: "zh_158", countryCode: "MY", peakYearRegional: 2025, historicalPopularity: 56, currentPopularity: 5, ageRelevance: 69, memoryTriggerScore: 72 },
    // 2025 — SG
    { itunesId: "zh_155", countryCode: "SG", peakYearRegional: 2025, historicalPopularity: 80, currentPopularity: 55, ageRelevance: 69, memoryTriggerScore: 58 },
    { itunesId: "zh_156", countryCode: "SG", peakYearRegional: 2025, historicalPopularity: 78, currentPopularity: 48, ageRelevance: 69, memoryTriggerScore: 60 },
    { itunesId: "zh_157", countryCode: "SG", peakYearRegional: 2025, historicalPopularity: 78, currentPopularity: 45, ageRelevance: 69, memoryTriggerScore: 60 },
    { itunesId: "zh_158", countryCode: "SG", peakYearRegional: 2025, historicalPopularity: 56, currentPopularity: 5, ageRelevance: 69, memoryTriggerScore: 72 },
    // 2026 — MY
    { itunesId: "zh_159", countryCode: "MY", peakYearRegional: 2026, historicalPopularity: 78, currentPopularity: 58, ageRelevance: 68, memoryTriggerScore: 56 },
    { itunesId: "zh_160", countryCode: "MY", peakYearRegional: 2026, historicalPopularity: 76, currentPopularity: 50, ageRelevance: 68, memoryTriggerScore: 58 },
    { itunesId: "zh_161", countryCode: "MY", peakYearRegional: 2026, historicalPopularity: 75, currentPopularity: 48, ageRelevance: 68, memoryTriggerScore: 58 },
    { itunesId: "zh_162", countryCode: "MY", peakYearRegional: 2026, historicalPopularity: 55, currentPopularity: 5, ageRelevance: 68, memoryTriggerScore: 70 },
    // 2026 — SG
    { itunesId: "zh_159", countryCode: "SG", peakYearRegional: 2026, historicalPopularity: 78, currentPopularity: 58, ageRelevance: 68, memoryTriggerScore: 56 },
    { itunesId: "zh_160", countryCode: "SG", peakYearRegional: 2026, historicalPopularity: 76, currentPopularity: 50, ageRelevance: 68, memoryTriggerScore: 58 },
    { itunesId: "zh_161", countryCode: "SG", peakYearRegional: 2026, historicalPopularity: 75, currentPopularity: 48, ageRelevance: 68, memoryTriggerScore: 58 },
    { itunesId: "zh_162", countryCode: "SG", peakYearRegional: 2026, historicalPopularity: 55, currentPopularity: 5, ageRelevance: 68, memoryTriggerScore: 70 },
  ];

  for (const mapping of songRegionMappings) {
    const song = await prisma.song.findUnique({ where: { itunesId: mapping.itunesId } });
    if (!song) continue;

    const forgottenGemScore =
      (mapping.historicalPopularity * mapping.ageRelevance * mapping.memoryTriggerScore) /
      Math.max(mapping.currentPopularity, 1);

    await prisma.songRegion.upsert({
      where: { songId_countryCode: { songId: song.id, countryCode: mapping.countryCode } },
      update: {},
      create: {
        songId: song.id,
        countryCode: mapping.countryCode,
        peakYearRegional: mapping.peakYearRegional,
        historicalPopularity: mapping.historicalPopularity,
        currentPopularity: mapping.currentPopularity,
        ageRelevance: mapping.ageRelevance,
        memoryTriggerScore: mapping.memoryTriggerScore,
        forgottenGemScore,
      },
    });
  }
  console.log(`✓ ${songRegionMappings.length} song regions seeded`);

  // ─── Memory Triggers ──────────────────────────────────────────────────────
  // imageUrl: Wikipedia Commons images — stable public domain URLs.
  // null = no image available yet for this trigger.
  const memoryTriggers = [
    // ── TECHNOLOGY ────────────────────────────────────────────────────────
    {
      name: "Nokia 3310",
      category: TriggerCategory.TECHNOLOGY,
      yearStart: 2000, yearEnd: 2005,
      countryCode: null,
      description: "The indestructible phone everyone had.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Nokia_3310_blue.jpg/220px-Nokia_3310_blue.jpg",
    },
    {
      name: "Nokia N70 / N73",
      category: TriggerCategory.TECHNOLOGY,
      yearStart: 2005, yearEnd: 2008,
      countryCode: null,
      description: "The first Nokia phones that felt like a big deal.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Nokia_N73.jpg/220px-Nokia_N73.jpg",
    },
    {
      name: "Sony Ericsson Walkman Phone",
      category: TriggerCategory.TECHNOLOGY,
      yearStart: 2005, yearEnd: 2009,
      countryCode: null,
      description: "The phone that made you feel like a DJ.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/SonyEricssonW800i.jpg/220px-SonyEricssonW800i.jpg",
    },
    {
      name: "iPod nano",
      category: TriggerCategory.TECHNOLOGY,
      yearStart: 2005, yearEnd: 2012,
      countryCode: null,
      description: "1000 songs in your pocket.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Ipod-nano.jpg/220px-Ipod-nano.jpg",
    },
    {
      name: "iPod Classic",
      category: TriggerCategory.TECHNOLOGY,
      yearStart: 2001, yearEnd: 2014,
      countryCode: null,
      description: "The scroll wheel was the coolest thing ever invented.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/IPod_classic_6th_generation.jpg/220px-IPod_classic_6th_generation.jpg",
    },
    {
      name: "Windows XP",
      category: TriggerCategory.TECHNOLOGY,
      yearStart: 2001, yearEnd: 2008,
      countryCode: null,
      description: "The bliss wallpaper. The startup sound. Home.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Windows_XP_Desktop.png/320px-Windows_XP_Desktop.png",
    },
    {
      name: "Windows Vista",
      category: TriggerCategory.TECHNOLOGY,
      yearStart: 2007, yearEnd: 2010,
      countryCode: null,
      description: "Everyone complained about it but we all used it.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Windows_Vista_Home_Premium.png/320px-Windows_Vista_Home_Premium.png",
    },
    {
      name: "BlackBerry",
      category: TriggerCategory.TECHNOLOGY,
      yearStart: 2006, yearEnd: 2013,
      countryCode: null,
      description: "BBM was the WhatsApp before WhatsApp.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/BlackBerry_Bold_9000.jpg/220px-BlackBerry_Bold_9000.jpg",
    },
    {
      name: "iPhone (1st & 2nd Gen)",
      category: TriggerCategory.TECHNOLOGY,
      yearStart: 2007, yearEnd: 2010,
      countryCode: null,
      description: "The day everything changed.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/IPhone_1st_Gen.svg/220px-IPhone_1st_Gen.svg.png",
    },
    {
      name: "Samsung Galaxy S (early series)",
      category: TriggerCategory.TECHNOLOGY,
      yearStart: 2010, yearEnd: 2014,
      countryCode: null,
      description: "Android's answer to the iPhone.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Samsung_Galaxy_S.jpg/220px-Samsung_Galaxy_S.jpg",
    },
    {
      name: "CD Burner / Burned CDs",
      category: TriggerCategory.TECHNOLOGY,
      yearStart: 1999, yearEnd: 2006,
      countryCode: null,
      description: "Spending an hour making the perfect mix CD.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Maxell_CD-R.jpg/220px-Maxell_CD-R.jpg",
    },
    {
      name: "USB Flash Drive",
      category: TriggerCategory.TECHNOLOGY,
      yearStart: 2003, yearEnd: 2012,
      countryCode: null,
      description: "Passing songs to friends in school.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Kingston_DataTraveler_2.0_2GB_front.jpg/220px-Kingston_DataTraveler_2.0_2GB_front.jpg",
    },
    // ── INTERNET CULTURE ──────────────────────────────────────────────────
    {
      name: "MSN Messenger",
      category: TriggerCategory.INTERNET_CULTURE,
      yearStart: 2000, yearEnd: 2010,
      countryCode: null,
      description: "Your crush changed their status. Heart racing.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/MSN_Messenger_icon.png/220px-MSN_Messenger_icon.png",
    },
    {
      name: "Friendster",
      category: TriggerCategory.INTERNET_CULTURE,
      yearStart: 2003, yearEnd: 2009,
      countryCode: "MY",
      description: "Before Facebook, there was Friendster.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Friendster_Logo.png/220px-Friendster_Logo.png",
    },
    {
      name: "MySpace",
      category: TriggerCategory.INTERNET_CULTURE,
      yearStart: 2004, yearEnd: 2010,
      countryCode: null,
      description: "Picking your Top 8. Curating your profile song.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Myspace_logo.svg/220px-Myspace_logo.svg.png",
    },
    {
      name: "Early Facebook",
      category: TriggerCategory.INTERNET_CULTURE,
      yearStart: 2007, yearEnd: 2012,
      countryCode: null,
      description: "Before ads. Just friends and wall posts.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/220px-Facebook_Logo_%282019%29.png",
    },
    {
      name: "YouTube (early era)",
      category: TriggerCategory.INTERNET_CULTURE,
      yearStart: 2006, yearEnd: 2012,
      countryCode: null,
      description: "Buffering for 10 minutes to watch a 3-minute video.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/YouTube_Logo_2017.svg/220px-YouTube_Logo_2017.svg.png",
    },
    {
      name: "Limewire",
      category: TriggerCategory.INTERNET_CULTURE,
      yearStart: 2001, yearEnd: 2010,
      countryCode: null,
      description: "Free music. Also maybe a virus. Worth it.",
      imageUrl: null,
    },
    {
      name: "Bluetooth Song Sharing",
      category: TriggerCategory.INTERNET_CULTURE,
      yearStart: 2004, yearEnd: 2009,
      countryCode: "MY",
      description: "Sending songs to classmates via Bluetooth in class.",
      imageUrl: null,
    },
    // ── GAMING ────────────────────────────────────────────────────────────
    {
      name: "MapleStory",
      category: TriggerCategory.GAMING,
      yearStart: 2003, yearEnd: 2010,
      countryCode: "MY",
      description: "After-school ritual. Sleepover marathons.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/MapleStory_logo.svg/220px-MapleStory_logo.svg.png",
    },
    {
      name: "Ragnarok Online",
      category: TriggerCategory.GAMING,
      yearStart: 2002, yearEnd: 2008,
      countryCode: "MY",
      description: "The game that took over the cyber cafes.",
      imageUrl: null,
    },
    {
      name: "Counter-Strike 1.6",
      category: TriggerCategory.GAMING,
      yearStart: 2000, yearEnd: 2010,
      countryCode: null,
      description: "Cyber cafe. RM2 an hour. Rush B.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Counter-Strike_logo.svg/220px-Counter-Strike_logo.svg.png",
    },
    {
      name: "The Sims",
      category: TriggerCategory.GAMING,
      yearStart: 2000, yearEnd: 2008,
      countryCode: null,
      description: "Building dream houses and drowning sims in pools.",
      imageUrl: null,
    },
    {
      name: "Neopets",
      category: TriggerCategory.GAMING,
      yearStart: 2000, yearEnd: 2007,
      countryCode: null,
      description: "Your first virtual pet. First website you were obsessed with.",
      imageUrl: null,
    },
    {
      name: "Club Penguin",
      category: TriggerCategory.GAMING,
      yearStart: 2005, yearEnd: 2013,
      countryCode: null,
      description: "Waddling around. Igloo decorating. Peak childhood.",
      imageUrl: null,
    },
    {
      name: "Warcraft III / DotA",
      category: TriggerCategory.GAMING,
      yearStart: 2003, yearEnd: 2010,
      countryCode: "MY",
      description: "The origin of every competitive gaming addiction.",
      imageUrl: null,
    },
    // ── ENTERTAINMENT ─────────────────────────────────────────────────────
    {
      name: "American Idol",
      category: TriggerCategory.ENTERTAINMENT,
      yearStart: 2002, yearEnd: 2010,
      countryCode: null,
      description: "Watching people chase their dreams every week.",
      imageUrl: null,
    },
    {
      name: "High School Musical",
      category: TriggerCategory.ENTERTAINMENT,
      yearStart: 2006, yearEnd: 2009,
      countryCode: null,
      description: "We're all in this together.",
      imageUrl: null,
    },
    {
      name: "Twilight",
      category: TriggerCategory.ENTERTAINMENT,
      yearStart: 2008, yearEnd: 2012,
      countryCode: null,
      description: "Team Edward or Team Jacob. No middle ground.",
      imageUrl: null,
    },
    {
      name: "Hannah Montana",
      category: TriggerCategory.ENTERTAINMENT,
      yearStart: 2006, yearEnd: 2011,
      countryCode: null,
      description: "Best of both worlds.",
      imageUrl: null,
    },
    {
      name: "MTV TRL",
      category: TriggerCategory.ENTERTAINMENT,
      yearStart: 1998, yearEnd: 2008,
      countryCode: "US",
      description: "Racing home to vote for your favourite music video.",
      imageUrl: null,
    },
  ];

  for (const trigger of memoryTriggers) {
    await prisma.memoryTrigger.upsert({
      where: {
        id: (
          await prisma.memoryTrigger.findFirst({
            where: { name: trigger.name, countryCode: trigger.countryCode },
          })
        )?.id ?? "new",
      },
      update: {},
      create: trigger,
    });
  }
  console.log(`✓ ${memoryTriggers.length} memory triggers seeded`);

  // ─── Device Eras ──────────────────────────────────────────────────────────
  // Maps years to the dominant music-listening device of that period.
  // The ⭐ (signature) device for a user is computed at query time:
  // whichever device overlaps with their ages 13–16 wins.
  const deviceEras = [
    {
      name: "Portable CD Player",
      yearStart: 1997,
      yearEnd: 2004,
      countryCode: null,
      description: "Skipping on every bump. Still worth it.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/CD_Player_Sony.jpg/320px-CD_Player_Sony.jpg",
    },
    {
      name: "Burned CD Mix",
      yearStart: 2000,
      yearEnd: 2006,
      countryCode: null,
      description: "Spending an hour making the perfect mix. Writing the tracklist in marker.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Maxell_CD-R.jpg/320px-Maxell_CD-R.jpg",
    },
    {
      name: "Creative MuVo / Zen MP3 Player",
      yearStart: 2002,
      yearEnd: 2007,
      countryCode: null,
      description: "Before the iPod took over. The underdog music player.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Creative_MuVo_TX_FM.jpg/220px-Creative_MuVo_TX_FM.jpg",
    },
    {
      name: "iPod mini / nano (1st–3rd Gen)",
      yearStart: 2004,
      yearEnd: 2009,
      countryCode: null,
      description: "1,000 songs in your pocket. The scroll wheel was genius.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Ipod-nano.jpg/220px-Ipod-nano.jpg",
    },
    {
      name: "iPod Classic",
      yearStart: 2001,
      yearEnd: 2014,
      countryCode: null,
      description: "Your entire music library, always with you.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/IPod_classic_6th_generation.jpg/220px-IPod_classic_6th_generation.jpg",
    },
    {
      name: "Nokia Music Phone",
      yearStart: 2003,
      yearEnd: 2008,
      countryCode: null,
      description: "Side-loading MP3s over Bluetooth or data cable. The struggle.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Nokia_N73.jpg/220px-Nokia_N73.jpg",
    },
    {
      name: "Sony Ericsson Walkman Phone",
      yearStart: 2005,
      yearEnd: 2010,
      countryCode: null,
      description: "The W-series. Orange button. Dedicated music experience before smartphones.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/SonyEricssonW800i.jpg/220px-SonyEricssonW800i.jpg",
    },
    {
      name: "Motorola RAZR",
      yearStart: 2004,
      yearEnd: 2008,
      countryCode: null,
      description: "Ultra-thin. The coolest phone in the room.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Motorola_RAZR_V3i.jpg/220px-Motorola_RAZR_V3i.jpg",
    },
    {
      name: "BlackBerry with BBM",
      yearStart: 2007,
      yearEnd: 2013,
      countryCode: null,
      description: "BBM pins. QWERTY keyboard. The professional's phone.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/BlackBerry_Bold_9000.jpg/220px-BlackBerry_Bold_9000.jpg",
    },
    {
      name: "iPhone (1st–3rd Gen)",
      yearStart: 2007,
      yearEnd: 2011,
      countryCode: null,
      description: "The day everything changed. Multi-touch felt like magic.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/IPhone_1st_Gen.svg/220px-IPhone_1st_Gen.svg.png",
    },
    {
      name: "iPod touch",
      yearStart: 2007,
      yearEnd: 2013,
      countryCode: null,
      description: "An iPhone, minus the phone. The gateway to the App Store.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Ipod_touch_1g.jpg/220px-Ipod_touch_1g.jpg",
    },
    {
      name: "Android Smartphone (early era)",
      yearStart: 2010,
      yearEnd: 2014,
      countryCode: null,
      description: "HTC, Samsung Galaxy S. The other team.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Samsung_Galaxy_S.jpg/220px-Samsung_Galaxy_S.jpg",
    },
    {
      name: "iPhone 4 / 4S",
      yearStart: 2010,
      yearEnd: 2014,
      countryCode: null,
      description: "Retina display. Siri. The one everyone wanted.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/IPhone_4S_White.jpg/220px-IPhone_4S_White.jpg",
    },
    {
      name: "iPhone 5 / 5S",
      yearStart: 2012,
      yearEnd: 2016,
      countryCode: null,
      description: "Taller screen. Touch ID. Peak early smartphone era.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/IPhone_5s_in_hand.jpg/220px-IPhone_5s_in_hand.jpg",
    },
    {
      name: "Spotify on Smartphone",
      yearStart: 2013,
      yearEnd: 2020,
      countryCode: null,
      description: "Every song ever made. In your pocket. Free (with ads).",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/220px-Spotify_logo_without_text.svg.png",
    },
  ];

  for (const device of deviceEras) {
    const existing = await prisma.deviceEra.findFirst({
      where: { name: device.name, countryCode: device.countryCode },
    });
    if (!existing) {
      await prisma.deviceEra.create({ data: device });
    }
  }
  console.log(`✓ ${deviceEras.length} device eras seeded`);

  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
