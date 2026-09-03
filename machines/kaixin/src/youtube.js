// Song search and playback via YouTube — we embed the real video/audio
// rather than hosting any music ourselves.

export async function searchVideos(query) {
  const searchUrl = new URL("/api/kaixin-youtube-search", window.location.origin);
  searchUrl.searchParams.set("q", query);
  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    if (searchResponse.status === 429) {
      throw new Error(
        "Search is busy right now — wait a moment and try again."
      );
    }
    const error = await searchResponse.json().catch(() => null);
    throw new Error(error?.error ?? "YouTube search failed. Try again in a moment.");
  }
  return searchResponse.json();
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
