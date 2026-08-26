"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { getTimeline, getSignatureYear, type TimelineYear } from "@/lib/timeline";

const COUNTRY_NAMES: Record<string, string> = {
  MY: "Malaysia", SG: "Singapore", PH: "Philippines",
  US: "United States", GB: "United Kingdom", AU: "Australia",
};

type EraDef = {
  label: string;
  device: string;
  deviceWidth: number;
  deviceRotate: number;
  acc: string;
  bd: string;
  glow: string;
  minYear: number;
  maxYear: number;
};

const ERA_DEFS: EraDef[] = [
  { label: "EARLY DIGITAL ERA",   device: "/samantha/discman.png",    deviceWidth: 90,  deviceRotate: 6,  acc: "#a259ff", bd: "#2a2140", glow: "162,89,255",  minYear: 0,    maxYear: 1999 },
  { label: "PC & WINAMP ERA",     device: "/samantha/crt.png",        deviceWidth: 104, deviceRotate: 6,  acc: "#a259ff", bd: "#2a2140", glow: "162,89,255",  minYear: 2000, maxYear: 2005 },
  { label: "WALKMAN PHONE ERA",   device: "/samantha/walkman.png",    deviceWidth: 78,  deviceRotate: 8,  acc: "#c2f02e", bd: "#2e3a14", glow: "194,240,46",  minYear: 2006, maxYear: 2009 },
  { label: "iPOD & iTUNES ERA",   device: "/samantha/ipod.png",       deviceWidth: 78,  deviceRotate: 8,  acc: "#4da6ff", bd: "#16314a", glow: "77,166,255",  minYear: 2010, maxYear: 2012 },
  { label: "STREAMING ERA",       device: "/samantha/blackberry.png", deviceWidth: 96,  deviceRotate: -7, acc: "#ff5cb8", bd: "#45203a", glow: "255,92,184",  minYear: 2013, maxYear: 9999 },
];

function getEraForYear(year: number): EraDef {
  return ERA_DEFS.find((e) => year >= e.minYear && year <= e.maxYear) ?? ERA_DEFS[1];
}

function groupByEra(timeline: TimelineYear[]): { era: EraDef; years: TimelineYear[] }[] {
  const groups: { era: EraDef; years: TimelineYear[] }[] = [];
  for (const entry of timeline) {
    const era = getEraForYear(entry.year);
    const last = groups[groups.length - 1];
    if (last && last.era.label === era.label) {
      last.years.push(entry);
    } else {
      groups.push({ era, years: [entry] });
    }
  }
  return groups;
}

function SoundtrackContent() {
  const searchParams = useSearchParams();
  const birthYear = parseInt(searchParams.get("birthYear") ?? "1993");
  const country = searchParams.get("country") ?? "MY";
  const language = searchParams.get("language") ?? "en";

  const timeline = getTimeline(birthYear, country, language);
  const signatureYear = getSignatureYear(birthYear);
  const countryName = COUNTRY_NAMES[country] ?? country;
  const groups = groupByEra(timeline);

  return (
    <div style={{ minHeight: "100dvh", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 390, minHeight: "100dvh", background: "#070707", position: "relative", overflow: "hidden", fontFamily: "'Helvetica Neue', Arial, sans-serif", border: "1px solid #232323", boxShadow: "inset 0 0 0 6px #0c0c0c", display: "flex", flexDirection: "column" }}>

        {/* Top safe-area spacer — see page.tsx's own comment on this same pattern. */}
        <div style={{ height: 30, flexShrink: 0 }} aria-hidden="true" />

        {/* Header */}
        <div style={{ padding: "10px 26px 12px", flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-pixelify), sans-serif", fontWeight: 600, fontSize: 26, color: "#c2f02e", letterSpacing: 1 }}>remember.fm</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "#f2f2f2", letterSpacing: -0.5 }}>Your soundtrack</h1>
            <div className="spin" style={{ width: 62, height: 62, borderRadius: "50%", background: "conic-gradient(from 200deg,#c9b6ff,#9fe2ff,#bff0a0,#fff0a8,#ffc6ef,#ff9ed6,#b89dff,#9fe2ff,#c9b6ff)", position: "relative", flexShrink: 0, boxShadow: "0 0 0 1px rgba(255,255,255,.12)", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle,transparent 26%,rgba(0,0,0,.45) 60%)" }} />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 19, height: 19, borderRadius: "50%", background: "#0a0a0a", boxShadow: "inset 0 0 0 4px rgba(120,120,120,.4)" }} />
            </div>
          </div>
          <p style={{ margin: "5px 0 0", color: "#8f8f8f", fontSize: 16 }}>
            {countryName} · {birthYear} · Ages 12–24
          </p>
        </div>

        {/* Timeline scroll */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", position: "relative", padding: "6px 22px 30px" }}>
          <div style={{ position: "relative" }}>
            {/* Vertical dotted line */}
            <div style={{ position: "absolute", left: 18, top: 10, bottom: 0, width: 2, background: "repeating-linear-gradient(180deg,#3b3b3b 0 4px,transparent 4px 11px)" }} />

            {groups.map(({ era, years }) => {
              const { acc, bd, glow } = era;
              const firstYear = years[0].year;
              const lastYear = years[years.length - 1].year;
              const rangeLabel = firstYear === lastYear ? String(firstYear) : `${firstYear} – ${lastYear}`;

              return (
                <div key={era.label + firstYear}>
                  {/* Era banner */}
                  <div style={{ position: "relative", paddingLeft: 44, marginBottom: 14 }}>
                    {/* Large era dot */}
                    <div style={{ position: "absolute", left: 11, top: 30, width: 15, height: 15, borderRadius: "50%", background: acc, boxShadow: `0 0 0 4px #070707,0 0 12px 2px rgba(${glow},.55)` }} />
                    {/* Era banner card */}
                    <div style={{ position: "relative", overflow: "hidden", border: `1px solid ${bd}`, borderRadius: 18, background: `linear-gradient(115deg,rgba(${glow},.20),rgba(11,11,13,.3) 60%)`, padding: "15px 14px 16px 18px", boxShadow: `inset 0 0 30px rgba(${glow},.10)` }}>
                      {/* Device image */}
                      <Image
                        src={era.device}
                        alt={era.label}
                        width={era.deviceWidth}
                        height={era.deviceWidth}
                        style={{ position: "absolute", top: -8, right: 0, width: era.deviceWidth, height: "auto", transform: `rotate(${era.deviceRotate}deg)`, pointerEvents: "none", WebkitMaskImage: "linear-gradient(210deg,#000 45%,transparent 82%)", maskImage: "linear-gradient(210deg,#000 45%,transparent 82%)" }}
                      />
                      <span style={{ display: "inline-block", border: `1px solid ${acc}`, color: acc, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, borderRadius: 20, padding: "3px 11px" }}>{rangeLabel}</span>
                      <div style={{ fontFamily: "var(--font-pixelify), sans-serif", fontSize: 21, fontWeight: 600, color: acc, letterSpacing: 0.5, marginTop: 10, textShadow: `0 0 14px rgba(${glow},.4)` }}>{era.label}</div>
                    </div>
                  </div>

                  {/* Year cards in this era */}
                  {years.map((entry) => {
                    const isSignature = entry.year === signatureYear;
                    const topSongs = entry.popularSongs.slice(0, 3);

                    return (
                      <Link
                        key={entry.year}
                        href={`/era?year=${entry.year}&birthYear=${birthYear}&country=${country}&language=${language}`}
                        style={{ textDecoration: "none", display: "block" }}
                      >
                        <div style={{ position: "relative", paddingLeft: 44, marginBottom: 14 }}>
                          {/* Year dot */}
                          <div style={{ position: "absolute", left: 14, top: 24, width: 11, height: 11, borderRadius: "50%", background: isSignature ? "#c2f02e" : acc, boxShadow: `0 0 0 4px #070707${isSignature ? ",0 0 10px 2px rgba(194,240,46,.5)" : ""}` }} />
                          {/* Card */}
                          <div style={{ position: "relative", border: isSignature ? "2px solid #c2f02e" : "1px solid #1a1a1a", borderRadius: 18, background: "#0c0c0e", padding: "16px 18px 18px", boxShadow: isSignature ? "0 0 20px rgba(194,240,46,.18)" : "none" }}>
                            <svg width="9" height="16" viewBox="0 0 9 16" style={{ position: "absolute", top: "50%", right: 18, transform: "translateY(-50%)" }}>
                              <path d="M1 1 L8 8 L1 15" stroke="#555" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                              <div style={{ fontSize: 26, fontWeight: 800, color: isSignature ? "#c2f02e" : acc, letterSpacing: -0.5 }}>{entry.year}</div>
                              <div style={{ fontSize: 16, color: "#7a7a7a" }}>Age {entry.age}</div>
                            </div>
                            {topSongs.length > 0 && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
                                {topSongs.map((sr) => (
                                  <div key={sr.song.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: "50%", border: `1.5px solid ${isSignature ? "#c2f02e" : acc}`, color: isSignature ? "#c2f02e" : acc, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <svg width="9" height="11" viewBox="0 0 9 11"><path d="M0 0 L9 5.5 L0 11 Z" fill="currentColor" /></svg>
                                    </span>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sr.song.title}</div>
                                      <div style={{ fontSize: 13, color: "#7d7d7d", marginTop: 1 }}>{sr.song.artist}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SoundtrackPage() {
  return (
    <Suspense fallback={null}>
      <SoundtrackContent />
    </Suspense>
  );
}
