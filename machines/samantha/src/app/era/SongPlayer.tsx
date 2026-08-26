"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Song = {
  id: string;
  title: string;
  artist: string;
  albumArtUrl: string | null;
  previewUrl: string | null;
};

type SongRegionEntry = {
  song: Song;
};

type Props = {
  popularSongs: SongRegionEntry[];
  forgottenGems: SongRegionEntry[];
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SongPlayer({ popularSongs, forgottenGems }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);   // 0–1
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  const allSongs = [...popularSongs, ...forgottenGems];
  const currentSong = allSongs.find((s) => s.song.id === currentId)?.song ?? null;

  const play = useCallback((song: Song) => {
    if (!song.previewUrl) return;

    if (currentId === song.id) {
      // Toggle play/pause
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    // New song
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = song.previewUrl;
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
    setCurrentId(song.id);
    setIsPlaying(true);
    setProgress(0);
    setElapsed(0);
  }, [currentId, isPlaying]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setElapsed(audio.currentTime);
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => { setIsPlaying(false); setProgress(0); setElapsed(0); };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  function renderSongRow(sr: SongRegionEntry, i: number, isGem: boolean) {
    const song = sr.song;
    const active = currentId === song.id;
    const playing = active && isPlaying;

    return (
      <div
        key={song.id}
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: "1px solid #1b1b1b", borderBottom: i === (isGem ? forgottenGems : popularSongs).length - 1 ? "1px solid #1b1b1b" : "none" }}
      >
        {song.albumArtUrl ? (
          <Image src={song.albumArtUrl} alt={song.title} width={54} height={54} style={{ borderRadius: 8, flexShrink: 0 }} />
        ) : (
          <div style={{ width: 54, height: 54, borderRadius: 8, background: `linear-gradient(135deg,${["#7a5c3a,#2a1f14", "#3a5a7a,#16202a", "#5a3a5a,#1c1024"][i % 3]})`, flexShrink: 0, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.07)" }} />
        )}

        <button
          onClick={() => play(song)}
          disabled={!song.previewUrl}
          style={{ width: 42, height: 42, borderRadius: "50%", border: `1.5px solid ${active ? "#c2f02e" : "#555"}`, background: active ? "rgba(194,240,46,.12)" : "none", flexShrink: 0, cursor: song.previewUrl ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: song.previewUrl ? 1 : 0.3, transition: "border-color .15s, background .15s" }}
        >
          {playing ? (
            <svg width="12" height="13" viewBox="0 0 12 13"><rect x="1" y="1" width="3.4" height="11" rx="1" fill="#c2f02e" /><rect x="7.6" y="1" width="3.4" height="11" rx="1" fill="#c2f02e" /></svg>
          ) : (
            <svg width="13" height="15" viewBox="0 0 13 15"><path d="M1 1 L12 7.5 L1 14 Z" fill={active ? "#c2f02e" : "#eee"} /></svg>
          )}
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: active ? "#c2f02e" : "#f2f2f2", transition: "color .15s" }}>{song.title}</div>
          <div style={{ fontSize: 15, color: "#8f8f8f", marginTop: 2 }}>{song.artist}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Popular songs */}
      <div style={{ marginTop: 54 }}>
        <span style={{ position: "relative", display: "inline-block" }}>
          <span style={{ position: "absolute", left: -5, right: -7, bottom: 1, height: 10, background: "#c2f02e", transform: "skewX(-12deg)", opacity: 0.85, borderRadius: 2 }} />
          <h2 style={{ position: "relative", margin: 0, fontSize: 23, fontWeight: 700, color: "#fff" }}>Popular songs</h2>
        </span>
      </div>
      {popularSongs.map((sr, i) => renderSongRow(sr, i, false))}

      {/* Forgotten Gems */}
      {forgottenGems.length > 0 && (
        <>
          <div style={{ marginTop: 48, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
            <span style={{ position: "relative", display: "inline-block" }}>
              <span style={{ position: "absolute", left: -5, right: -7, bottom: 1, height: 10, background: "#a259ff", transform: "skewX(-12deg)", opacity: 0.85, borderRadius: 2 }} />
              <h2 style={{ position: "relative", margin: 0, fontSize: 23, fontWeight: 700, color: "#fff" }}>Forgotten gems</h2>
            </span>
            <div style={{ position: "relative", background: "#7a4fc4", color: "#fff", fontSize: 12, fontWeight: 600, lineHeight: 1.2, borderRadius: 14, padding: "9px 13px", maxWidth: 118, flexShrink: 0, boxShadow: "0 4px 14px rgba(122,79,196,.4)" }}>
              How did I forget this?
              <div style={{ position: "absolute", bottom: -5, right: 16, width: 12, height: 12, background: "#7a4fc4", transform: "rotate(38deg)", borderRadius: "0 0 3px 0" }} />
            </div>
          </div>
          {forgottenGems.map((sr, i) => renderSongRow(sr, i, true))}
        </>
      )}

      {/* Media Player bar */}
      <div style={{ position: "sticky", bottom: 10, margin: "28px -18px 0", borderRadius: 14, background: "linear-gradient(180deg,#bd9bff,#7d4fd6 55%,#4f2aa0)", padding: 3, boxShadow: "0 -4px 24px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.5)" }}>
        {/* Title bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "3px 10px 4px" }}>
          <span style={{ fontFamily: "var(--font-pixelify), monospace", fontSize: 9, color: "rgba(255,255,255,.85)", letterSpacing: 1.5 }}>MEDIA PLAYER</span>
          <span style={{ display: "flex", gap: 4 }}>
            <span style={{ width: 13, height: 11, borderRadius: 2, background: "rgba(255,255,255,.35)" }} />
            <span style={{ width: 13, height: 11, borderRadius: 2, background: "rgba(255,255,255,.35)" }} />
            <span style={{ width: 13, height: 11, borderRadius: 2, background: "#e25b8a" }} />
          </span>
        </div>
        {/* Main panel */}
        <div style={{ background: "linear-gradient(180deg,#1c1c1c,#070707)", borderRadius: 9, margin: "0 3px", padding: "11px 13px", display: "flex", alignItems: "center", gap: 13, border: "1px solid rgba(255,255,255,.18)", boxShadow: "inset 0 0 14px rgba(0,0,0,.7)" }}>
          {/* Windows logo */}
          <div style={{ width: 46, height: 46, borderRadius: 8, background: "linear-gradient(180deg,#2a2a2a,#101010)", border: "1px solid rgba(255,255,255,.15)", boxShadow: "inset 0 1px 2px rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "11px 11px", gridTemplateRows: "11px 11px", gap: 2, transform: "perspective(40px) rotateY(-12deg)" }}>
              <div style={{ background: "#f25022", borderRadius: "2px 0 0 0" }} />
              <div style={{ background: "#7fba00", borderRadius: "0 2px 0 0" }} />
              <div style={{ background: "#00a4ef", borderRadius: "0 0 0 2px" }} />
              <div style={{ background: "#ffb900", borderRadius: "0 0 2px 0" }} />
            </div>
          </div>
          {/* Track info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {currentSong?.title ?? popularSongs[0]?.song.title ?? "—"}
            </div>
            <div style={{ fontSize: 13, color: "#c9b8ee", marginTop: 1 }}>
              {currentSong?.artist ?? popularSongs[0]?.song.artist ?? ""}
            </div>
            {/* Progress bar */}
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,.15)", marginTop: 9, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${progress * 100}%`, background: "#c2f02e", borderRadius: 2, transition: "width .1s linear" }} />
              <div style={{ position: "absolute", left: `${progress * 100}%`, top: "50%", transform: "translate(-50%,-50%)", width: 9, height: 9, borderRadius: "50%", background: "#fff", boxShadow: "0 0 4px rgba(255,255,255,.8)" }} />
            </div>
            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 9 }}>
              <span style={{ fontSize: 11, color: "#b9a8e6" }}>{formatTime(elapsed)}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <svg width="18" height="14" viewBox="0 0 18 14"><path d="M8 1 L1 7 L8 13 Z M17 1 L10 7 L17 13 Z" fill="#e8e0ff" /></svg>
                <button
                  onClick={() => currentSong && play(currentSong)}
                  style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(180deg,#f2eaff,#c9b8ee)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,.5)", border: "none", cursor: "pointer" }}
                >
                  {isPlaying ? (
                    <svg width="12" height="13" viewBox="0 0 12 13"><rect x="1" y="1" width="3.4" height="11" rx="1" fill="#3a1f70" /><rect x="7.6" y="1" width="3.4" height="11" rx="1" fill="#3a1f70" /></svg>
                  ) : (
                    <svg width="10" height="12" viewBox="0 0 10 12"><path d="M1 1 L9 6 L1 11 Z" fill="#3a1f70" /></svg>
                  )}
                </button>
                <svg width="18" height="14" viewBox="0 0 18 14"><path d="M10 1 L17 7 L10 13 Z M1 1 L8 7 L1 13 Z" fill="#e8e0ff" /></svg>
              </span>
              <span style={{ fontSize: 11, color: "#b9a8e6" }}>{duration ? formatTime(duration) : "0:30"}</span>
            </div>
          </div>
        </div>
        {/* Bottom strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 4px" }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 26, height: 13, borderRadius: 3, background: "linear-gradient(180deg,#d9c4ff,#9a72e0)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.5)" }} />
          ))}
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: "var(--font-pixelify), monospace", fontSize: 9, color: "rgba(255,255,255,.7)", letterSpacing: 1 }}>128kbps</span>
        </div>
      </div>
    </>
  );
}
