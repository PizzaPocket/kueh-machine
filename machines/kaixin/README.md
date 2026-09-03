# Kara-o-kueh

By Kaixin — part of [kuehmachine.com](https://kuehmachine.com)

## YouTube search configuration

Production song searches go through `/api/kaixin-youtube-search` so the
YouTube API key is not shipped in the browser bundle. Set `YOUTUBE_API_KEY`
in the Vercel project environment. The server also accepts the former
`VITE_YOUTUBE_API_KEY` name during migration.

## Concept

Kara-o-kueh is a karaoke app with a Singapore/Malaysian twist. Search for
any song — Taylor Swift, jazz standards, 80s classics, doesn't matter —
and it swaps the lyrics for like-sounding local food words ("Crazy for
You" becomes "Kuehzy for You"), then displays them karaoke-style, timed
to the song, so you can actually sing along and laugh at the puns as
they scroll by. Built to be used live, at a real demo night, with a real
mic in someone's hand.

## Look & feel

Bold, saturated, pop-art karaoke-screen energy — in the spirit of the
Bruno Mars & Rosé "APT" music video. Loud color-blocking, chunky
typography that pops on beat, made to be read from across a room.

## Feature checklist

- [ ] Search for a song by title
- [ ] Pull real audio/video for the song (YouTube embed)
- [ ] Pull time-stamped lyrics for the song (lrclib.net)
- [ ] Swap lyrics for Singapore/Malaysian food-pun words
- [ ] Display lyrics karaoke-style, synced to playback
- [ ] Queue: add songs to a running queue on one shared screen
- [ ] Bold, APT-inspired visual design
- [ ] Works reliably live, on one device, at a demo night
