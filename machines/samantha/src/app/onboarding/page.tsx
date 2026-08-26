"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const COUNTRIES = [
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapore" },
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "zh", name: "Mandarin (华语)" },
];

const currentYear = new Date().getFullYear();

export default function OnboardingPage() {
  const router = useRouter();
  const [birthYear, setBirthYear] = useState("1993");
  const [country, setCountry] = useState("MY");
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState("");

  function handleSubmit() {
    const year = parseInt(birthYear);
    if (!birthYear || isNaN(year) || year < 1988 || year > 2004) {
      setError("We cover birth years 1988 to 2004 (ages 22–38 today)");
      return;
    }
    setError("");
    router.push(`/soundtrack?birthYear=${year}&country=${country}&language=${language}`);
  }

  const selectStyle: React.CSSProperties = {
    width: "100%",
    height: 58,
    borderRadius: 16,
    background: "linear-gradient(180deg,#1d1d1d,#0e0e0e)",
    border: "1px solid #2c2c2c",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 21,
    padding: "0 20px",
    appearance: "none",
    cursor: "pointer",
    outline: "none",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 390, minHeight: "100dvh", background: "#070707", position: "relative", overflow: "hidden", fontFamily: "'Helvetica Neue', Arial, sans-serif", border: "1px solid #232323", boxShadow: "inset 0 0 0 6px #0c0c0c", display: "flex", flexDirection: "column", padding: "0 26px" }}>

        {/* Top safe-area spacer — see page.tsx's own comment on this same pattern. */}
        <div style={{ height: 30, flexShrink: 0 }} aria-hidden="true" />

        {/* Logo */}
        <div style={{ marginTop: 14, flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-pixelify), sans-serif", fontWeight: 600, fontSize: 26, color: "#c2f02e", letterSpacing: 1 }}>remember.fm</span>
        </div>

        {/* Sparkles */}
        <div style={{ position: "absolute", top: 118, right: 54, fontSize: 22, color: "#b67bff" }}>✦</div>
        <div style={{ position: "absolute", top: 104, right: 30, fontSize: 15, color: "#b67bff" }}>✦</div>
        <div style={{ position: "absolute", top: 140, right: 38, fontSize: 13, color: "#b67bff" }}>✦</div>

        {/* Heading */}
        <div style={{ marginTop: 40, flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontSize: 33, fontWeight: 700, lineHeight: 1.12, color: "#f2f2f2", letterSpacing: -0.5 }}>
            When were you<br />growing up?{" "}
            <svg width="44" height="33" viewBox="0 0 44 32" style={{ verticalAlign: -6, marginLeft: 5, transform: "rotate(-14deg)" }}>
              <path d="M13 5 L13 11" stroke="#d6ff3a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              <path d="M28 5 L28 11" stroke="#d6ff3a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              <path d="M7 16 C10 28 31 28 35 15" stroke="#d6ff3a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
            </svg>
          </h1>
          <p style={{ margin: "12px 0 0", color: "#8f8f8f", fontSize: 16, fontWeight: 400 }}>We&apos;ll build your personal soundtrack.</p>
        </div>

        {/* Form fields */}
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 20, flexShrink: 0 }}>
          {/* Birth year */}
          <div>
            <div style={{ color: "#c2f02e", fontWeight: 700, fontSize: 15, marginBottom: 9 }}>Birth year</div>
            <div style={{ position: "relative", height: 58, borderRadius: 16, background: "linear-gradient(180deg,#1d1d1d,#0e0e0e)", border: "1px solid #2c2c2c", boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)", display: "flex", alignItems: "center", padding: "0 20px" }}>
              <input
                type="number"
                value={birthYear}
                onChange={(e) => { setBirthYear(e.target.value); setError(""); }}
                min={1988}
                max={2004}
                style={{ background: "transparent", border: "none", color: "#fff", fontWeight: 700, fontSize: 22, width: "100%", outline: "none" }}
              />
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ position: "absolute", right: 20, pointerEvents: "none" }}>
                <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="#c2f02e" />
              </svg>
            </div>
            {error && <p style={{ margin: "6px 0 0", color: "#ff4d6a", fontSize: 13 }}>{error}</p>}
          </div>

          {/* Country */}
          <div>
            <div style={{ color: "#c2f02e", fontWeight: 700, fontSize: 15, marginBottom: 9 }}>Country</div>
            <div style={{ position: "relative" }}>
              <select value={country} onChange={(e) => setCountry(e.target.value)} style={selectStyle}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              <svg width="16" height="16" viewBox="0 0 16 16" style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <path d="M3 5 L8 11 L13 5 Z" fill="#a86bff" />
              </svg>
            </div>
          </div>

          {/* Language */}
          <div>
            <div style={{ color: "#c2f02e", fontWeight: 700, fontSize: 15, marginBottom: 9 }}>Language you listen to</div>
            <div style={{ position: "relative" }}>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} style={selectStyle}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
              <svg width="16" height="16" viewBox="0 0 16 16" style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <path d="M3 5 L8 11 L13 5 Z" fill="#a86bff" />
              </svg>
            </div>
          </div>
        </div>

        {/* Collage image */}
        <div style={{ flex: 1, minHeight: 120, display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative" }}>
          <Image
            src="/samantha/collage.png"
            alt="retro music collage"
            width={338}
            height={200}
            style={{ objectFit: "contain", objectPosition: "center bottom", width: "100%", height: "100%" }}
            priority
          />
        </div>

        {/* CTA button */}
        <div style={{ position: "relative", paddingBottom: 28, flexShrink: 0, marginTop: -4 }}>
          <button
            onClick={handleSubmit}
            style={{ width: "100%", border: "none", cursor: "pointer", background: "#c2f02e", borderRadius: 16, padding: 18, fontFamily: "var(--font-pixelify), sans-serif", fontWeight: 600, fontSize: 25, color: "#0a0a0a", boxShadow: "0 6px 0 #6f8a14, inset 0 0 0 2px rgba(0,0,0,.15)", letterSpacing: 1 }}
          >
            build my timeline
          </button>
          <svg width="28" height="34" viewBox="0 0 34 40" style={{ position: "absolute", right: 14, bottom: 8, filter: "drop-shadow(0 2px 3px rgba(0,0,0,.6))" }}>
            <path d="M4 2 L4 30 L11 23 L16 34 L21 32 L16 21 L26 21 Z" fill="#fff" stroke="#0a0a0a" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
