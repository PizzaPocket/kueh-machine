// Song search and playback via YouTube — we embed the real video/audio
// rather than hosting any music ourselves.

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

function parseIsoDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function searchVideos(query) {
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("videoCategoryId", "10"); // Music
  searchUrl.searchParams.set("maxResults", "6");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("key", API_KEY);

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    if (searchResponse.status === 429) {
      throw new Error(
        "YouTube's free daily search limit (100/day) is used up for today — it resets automatically, try again later or tomorrow."
      );
    }
    throw new Error("YouTube search failed. Check the API key in .env.local.");
  }
  const searchData = await searchResponse.json();
  if (searchData.items.length === 0) return [];

  // A second call to get each video's exact runtime — this is what lets
  // us later pick lyrics from a recording that's actually the same
  // length, instead of just matching on title text.
  const videoIds = searchData.items.map((item) => item.id.videoId).join(",");
  const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailsUrl.searchParams.set("part", "contentDetails");
  detailsUrl.searchParams.set("id", videoIds);
  detailsUrl.searchParams.set("key", API_KEY);

  const detailsResponse = await fetch(detailsUrl);
  const detailsData = detailsResponse.ok ? await detailsResponse.json() : { items: [] };
  const durationById = new Map(
    detailsData.items.map((item) => [item.id, parseIsoDuration(item.contentDetails.duration)])
  );

  return searchData.items.map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default.url,
    durationSeconds: durationById.get(item.id.videoId) ?? null,
    // "Topic" channels are YouTube's auto-generated official-audio-only
    // uploads — just the studio track, no intro dialogue or video edits —
    // so they're the most likely to actually line up with timed lyrics.
    // "Official Video" uploads often open with non-musical footage that
    // throws off any lyric sync, even when the total runtime matches.
    syncFriendly: /-\s*topic$/i.test(item.snippet.channelTitle) || /official audio|lyric video/i.test(item.snippet.title),
  }));
}

let apiReadyPromise = null;

function loadIframeApi() {
  if (apiReadyPromise) return apiReadyPromise;
  apiReadyPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiReadyPromise;
}

export async function createPlayer(elementId, videoId, { onReady, onStateChange }) {
  const YT = await loadIframeApi();
  return new YT.Player(elementId, {
    videoId,
    playerVars: { autoplay: 1, rel: 0 },
    events: { onReady, onStateChange },
  });
}

export const PlayerState = {
  ENDED: 0,
};
