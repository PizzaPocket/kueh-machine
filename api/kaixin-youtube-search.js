const CACHE_SECONDS = 60 * 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_REQUESTS = 20;
const requestWindows = new Map();

function parseIsoDuration(iso = "") {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function clientAddress(request) {
  const forwarded = request.headers["x-forwarded-for"];
  return String(Array.isArray(forwarded) ? forwarded[0] : forwarded || request.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function isRateLimited(address) {
  const now = Date.now();
  const active = (requestWindows.get(address) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  active.push(now);
  requestWindows.set(address, active);

  if (requestWindows.size > 1000) {
    for (const [key, timestamps] of requestWindows) {
      if (!timestamps.some((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)) requestWindows.delete(key);
    }
  }
  return active.length > RATE_LIMIT_REQUESTS;
}

async function youtubeRequest(path, parameters, apiKey) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, value));
  return fetch(url, { headers: { "X-Goog-Api-Key": apiKey } });
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed." });
  }

  if (isRateLimited(clientAddress(request))) {
    response.setHeader("Retry-After", "60");
    return response.status(429).json({ error: "Too many searches. Wait a moment and try again." });
  }

  const query = String(request.query.q || "").trim();
  if (!query || query.length > 100) return response.status(400).json({ error: "Enter a shorter song title." });

  const apiKey = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) return response.status(503).json({ error: "Song search is temporarily unavailable." });

  try {
    const searchResponse = await youtubeRequest("search", {
      part: "snippet",
      type: "video",
      videoCategoryId: "10",
      maxResults: "6",
      q: query,
    }, apiKey);
    if (!searchResponse.ok) {
      const status = searchResponse.status === 403 || searchResponse.status === 429 ? 429 : 502;
      return response.status(status).json({ error: status === 429 ? "YouTube's search limit is reached. Try again later." : "YouTube search failed." });
    }

    const searchData = await searchResponse.json();
    const items = searchData.items || [];
    if (items.length === 0) return response.status(200).json([]);

    const ids = items.map((item) => item.id.videoId).filter(Boolean).join(",");
    const detailsResponse = await youtubeRequest("videos", { part: "contentDetails", id: ids }, apiKey);
    const detailsData = detailsResponse.ok ? await detailsResponse.json() : { items: [] };
    const durationById = new Map(
      (detailsData.items || []).map((item) => [item.id, parseIsoDuration(item.contentDetails?.duration)])
    );

    const results = items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || "",
      durationSeconds: durationById.get(item.id.videoId) ?? null,
      syncFriendly: /-\s*topic$/i.test(item.snippet.channelTitle) || /official audio|lyric video/i.test(item.snippet.title),
    }));

    response.setHeader("Cache-Control", `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`);
    return response.status(200).json(results);
  } catch {
    return response.status(502).json({ error: "YouTube search failed. Try again in a moment." });
  }
};
