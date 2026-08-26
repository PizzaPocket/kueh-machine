"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100dvh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 390, minHeight: "100dvh", background: "#050505", position: "relative", overflow: "hidden", fontFamily: "'Helvetica Neue', Arial, sans-serif", display: "flex", flexDirection: "column" }}>

        {/* Faint grid */}
        <div style={{ position: "absolute", top: 120, left: 70, width: 300, height: 330, backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)", backgroundSize: "24px 24px", transform: "rotate(-4deg)", pointerEvents: "none" }} />

        {/* Top safe-area spacer — same height the status bar used to reserve
            (14px + 2px padding around its 16px/12px content row), kept so
            removing the fake clock/signal icons didn't also pull the logo
            up and throw off the phone frame's proportions. */}
        <div style={{ height: 35, flexShrink: 0 }} aria-hidden="true" />

        {/* Logo */}
        <div style={{ position: "relative", textAlign: "center", marginTop: 6, flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-pixelify), sans-serif", fontWeight: 600, fontSize: 28, color: "#c2f02e", letterSpacing: 1 }}>remember.fm</span>
        </div>

        {/* Sparkles */}
        <div style={{ position: "absolute", top: 150, left: 26, fontSize: 18, color: "#fff" }}>✦</div>
        <div style={{ position: "absolute", top: 130, left: 62, fontSize: 12, color: "#b9a8ff" }}>✦</div>
        <div style={{ position: "absolute", top: 162, left: 78, fontSize: 13, color: "#7fb0ff", transform: "rotate(15deg)" }}>✦</div>
        <div style={{ position: "absolute", top: 144, left: 40, width: 15, height: 15, border: "2px solid #b9a8ff", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: 142, right: 48, fontSize: 21, color: "#fff" }}>✦</div>
        <div style={{ position: "absolute", top: 166, right: 26, fontSize: 13, color: "#fff" }}>✦</div>

        {/* CD disc */}
        <div style={{ position: "relative", display: "flex", justifyContent: "center", marginTop: 12, height: 212, flexShrink: 0 }}>
          <div className="spin" style={{ position: "relative", width: 204, height: 204, borderRadius: "50%", background: "conic-gradient(from 200deg,#c9b6ff,#9fe2ff,#bff0a0,#fff0a8,#ffc6ef,#ff9ed6,#b89dff,#9fe2ff,#c9b6ff)", boxShadow: "0 0 0 1px rgba(255,255,255,.15),0 10px 30px rgba(0,0,0,.6)", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg,transparent 20%,rgba(255,90,90,.35) 35%,rgba(255,210,90,.3) 45%,rgba(120,255,160,.3) 55%,rgba(120,180,255,.3) 65%,transparent 80%)", mixBlendMode: "screen" }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%,transparent 30%,rgba(0,0,0,.25) 60%,rgba(0,0,0,.55) 100%)" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 68, height: 68, borderRadius: "50%", background: "radial-gradient(circle,#3a3a3a,#1a1a1a)", boxShadow: "inset 0 0 0 6px rgba(0,0,0,.35),inset 0 0 0 7px rgba(255,255,255,.12)" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 24, height: 24, borderRadius: "50%", background: "#050505" }} />
          </div>

          {/* Smiley sticker */}
          <div style={{ position: "absolute", left: 111, top: 21, width: 56, height: 56, zIndex: 4, transform: "rotate(-12deg)", filter: "drop-shadow(0 2px 5px rgba(0,0,0,.45))" }}>
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="27" fill="#ffffff" />
              <circle cx="28" cy="28" r="22.5" fill="#c2f02e" stroke="#0a0a0a" strokeWidth="3" />
              <ellipse cx="21" cy="22" rx="3" ry="5" fill="#0a0a0a" />
              <ellipse cx="35" cy="22" rx="3" ry="5" fill="#0a0a0a" />
              <path d="M16 34 Q28 47 40 34" stroke="#0a0a0a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
            </svg>
          </div>

          {/* Press Play badge */}
          <div style={{ position: "absolute", right: 34, top: 104, transform: "rotate(-7deg)", display: "flex", alignItems: "center", gap: 8, background: "#ff7be0", border: "2px solid #d94fc0", borderRadius: 34, padding: "8px 9px 8px 16px", boxShadow: "0 5px 14px rgba(0,0,0,.5)" }}>
            <span style={{ fontFamily: "var(--font-pixelify), sans-serif", fontWeight: 700, fontSize: 16, lineHeight: 0.95, color: "#1a0a18" }}>PRESS<br />PLAY</span>
            <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a0a18", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="14" viewBox="0 0 16 18"><path d="M2 1.5 14 9 2 16.5Z" fill="#ff7be0" /></svg>
            </span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ position: "relative", padding: "0 26px", marginTop: 14, flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-pixelify), sans-serif", fontWeight: 700, fontSize: 40, lineHeight: 1.02, color: "#fff", letterSpacing: 1, textShadow: "-1.5px 0 #ff2d6a,1.5px 0 #2fd9ff" }}>
            <span style={{ display: "block" }}>Rediscover</span>
            <span style={{ display: "block" }}>the songs</span>
            <span style={{ display: "block" }}>that shaped</span>
            <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "#c2f02e" }}>you</span>
              <svg width="130" height="28" viewBox="0 0 170 36" style={{ flexShrink: 0 }}>
                <path d="M6 26 L40 10 L24 26 L70 8 L48 26 L96 8 L74 26 L120 10 L100 26 L148 12 L164 20" stroke="#c2f02e" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </h1>
        </div>

        {/* Subtext */}
        <p style={{ position: "relative", padding: "0 26px", margin: "18px 0 0", color: "#cfcfcf", fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>
          The songs you&apos;ve forgotten.<br />The moments they carried.
        </p>

        {/* CTA */}
        <div style={{ position: "relative", padding: "0 26px", marginTop: 24, flexShrink: 0 }}>
          <button
            onClick={() => router.push("/onboarding")}
            style={{ width: "100%", border: "none", cursor: "pointer", background: "#c2f02e", borderRadius: 16, padding: 18, fontFamily: "var(--font-pixelify), sans-serif", fontWeight: 600, fontSize: 25, color: "#0a0a0a", boxShadow: "0 6px 0 #6f8a14, inset 0 0 0 2px rgba(0,0,0,.15)", letterSpacing: 1 }}
          >
            take me back
          </button>
          <svg width="28" height="34" viewBox="0 0 34 40" style={{ position: "absolute", right: 18, bottom: -18, filter: "drop-shadow(0 2px 3px rgba(0,0,0,.6))" }}>
            <path d="M4 2 L4 30 L11 23 L16 34 L21 32 L16 21 L26 21 Z" fill="#fff" stroke="#0a0a0a" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Footer */}
        <div style={{ position: "relative", padding: "0 26px 28px", marginTop: "auto", flexShrink: 0 }}>
          <p style={{ margin: 0, color: "#9a9a9a", fontSize: 16, lineHeight: 1.4 }}>
            No account. No saving.<br />Just memories.
          </p>
          <div style={{ position: "absolute", right: 30, bottom: 44, fontSize: 18, color: "#fff" }}>✦</div>
          <div style={{ position: "absolute", right: 58, bottom: 60, fontSize: 13, color: "#c98fff" }}>✦</div>
          <div style={{ position: "absolute", right: 86, bottom: 48, fontSize: 11, color: "#fff" }}>✦</div>
        </div>
      </div>
    </div>
  );
}
