"use client";

import { Suspense } from "react";
import { getTimeline } from "@/lib/timeline";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SongPlayer from "./SongPlayer";

function EraContent() {
  const searchParams = useSearchParams();
  const year = parseInt(searchParams.get("year") ?? "");
  const birthYear = parseInt(searchParams.get("birthYear") ?? "1993");
  const country = searchParams.get("country") ?? "MY";
  const language = searchParams.get("language") ?? "en";

  const timeline = getTimeline(birthYear, country, language);
  const entry = timeline.find((e) => e.year === year) ?? timeline[0];
  if (!entry) return <div style={{ color: "#fff", padding: 40 }}>Era not found.</div>;

  const backHref = `/soundtrack?birthYear=${birthYear}&country=${country}&language=${language}`;
  const popularSongs = entry.popularSongs; // 3 per year
  const forgottenGems = entry.forgottenGems; // 1, distinct from popular songs
  const triggers = entry.memoryTriggers;

  // First trigger gets green highlight, rest are dark
  return (
    <div style={{ minHeight: "100dvh", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 390, minHeight: "100dvh", background: "#070707", position: "relative", overflow: "hidden", fontFamily: "'Helvetica Neue', Arial, sans-serif", border: "1px solid #232323", boxShadow: "inset 0 0 0 6px #0c0c0c", display: "flex", flexDirection: "column" }}>

        {/* Top safe-area spacer — see page.tsx's own comment on this same pattern. */}
        <div style={{ height: 30, flexShrink: 0 }} aria-hidden="true" />

        {/* Scrollable content */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "10px 26px 16px", position: "relative" }}>

          {/* Back button */}
          <div style={{ position: "sticky", top: 0, zIndex: 20 }}>
            <Link href={backHref} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: "50%", background: "rgba(20,20,20,.7)", backdropFilter: "blur(8px)", boxShadow: "0 2px 10px rgba(0,0,0,.5)", textDecoration: "none" }}>
              <svg width="22" height="18" viewBox="0 0 26 20"><path d="M11 2 L3 10 L11 18 M3 10 L25 10" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>

          {/* Header */}
          <div style={{ position: "relative", marginTop: 22 }}>
            {/* Spinning CD */}
            <div className="spin-slow" style={{ position: "absolute", right: 6, top: 14, width: 94, height: 94, borderRadius: "50%", background: "conic-gradient(from 200deg,#c9b6ff,#9fe2ff,#bff0a0,#fff0a8,#ffc6ef,#ff9ed6,#b89dff,#9fe2ff,#c9b6ff)", boxShadow: "0 0 0 1px rgba(255,255,255,.12),0 8px 22px rgba(0,0,0,.6)", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle,transparent 22%,rgba(0,0,0,.4) 60%)" }} />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 30, height: 30, borderRadius: "50%", background: "radial-gradient(circle,#3a3a3a,#161616)" }} />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 11, height: 11, borderRadius: "50%", background: "#050505" }} />
            </div>

            {/* Graffiti year — overlaps spinning CD on the right */}
            <div style={{ position: "absolute", top: -10, right: 22, fontFamily: "var(--font-lilita), sans-serif", fontSize: 54, color: "#ff4da6", transform: "rotate(-8deg)", WebkitTextStroke: "2px #2a0a1c", textShadow: "3px 4px 0 #b81e6e", lineHeight: 1, zIndex: 1 }}>
              {entry.year}
              <div style={{ position: "absolute", top: -1, left: 112, fontSize: 18, color: "#ff8fd0", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>✦</div>
            </div>

            <div style={{ position: "absolute", right: 120, top: 30, fontSize: 14, color: "#ff8fd0" }}>✦</div>
            <div style={{ position: "absolute", right: 8, top: 70, fontSize: 13, color: "#ff8fd0" }}>✦</div>

            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, color: "#f4f4f4", letterSpacing: -0.5, maxWidth: 230 }}>
              Age {entry.age}
            </h1>
            <div style={{ marginTop: 10, fontSize: 21, fontWeight: 600, color: "#c2f02e" }}>{entry.lifeStage}</div>
          </div>

          {/* Memory triggers */}
          <h2 style={{ margin: "34px 0 0", fontSize: 21, fontWeight: 700, color: "#fff" }}>You were there for</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, position: "relative" }}>
            {triggers.slice(0, 6).map((t, i) => (
              <span
                key={t.id}
                style={{
                  background: i === 0 ? "#c2f02e" : "#0c0c0c",
                  border: i === 0 ? "none" : "1px solid #333",
                  color: i === 0 ? "#0a0a0a" : "#eee",
                  fontWeight: i === 0 ? 700 : 600,
                  fontSize: 13,
                  borderRadius: 16,
                  padding: "7px 14px",
                }}
              >
                {t.name}
              </span>
            ))}
          </div>

          <SongPlayer popularSongs={popularSongs} forgottenGems={forgottenGems} />

        </div>
      </div>
    </div>
  );
}

export default function EraPage() {
  return (
    <Suspense fallback={null}>
      <EraContent />
    </Suspense>
  );
}
