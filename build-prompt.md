# Prompt for Claude Code — kuehmachine.com holding page

Paste this into a Claude Code session from an empty project folder.

---

Build a single-page website to live at kuehmachine.com as a temporary holding page while the real site is being assembled. This is an internal reference page for a design team. It should feel intentional, not provisional. The machine is already running. We're waiting for the parts to arrive.

## What the page needs to do

1. **Countdown clock at the top, big and prominent** — counting down to the showcase meeting: **August 26, 2026 at 2:00 PM Singapore Time (SGT, UTC+8)**. The clock should show days only. It's a meeting time, not a midnight deadline. Label it clearly as days remaining. The clock should update at midnight SGT so the number ticks down once per day. Make it feel like something is being built. Consider framing the count as "X days remaining" or similar.

2. **Key dates displayed clearly** — labelled as monthly team meetings, not just abstract milestones:
   - 🚀 June 24, 2026 — Kick-off meeting
   - 🔍 July 29, 2026 — Check-in meeting
   - 🏁 August 26, 2026 — Showcase & submission. Come ready to present and hand off.

   All meetings are at **2:00 PM Singapore Time**.

3. **A file card for the starter file** — the file is called `CLAUDE.md` and should be downloadable directly from the page. Render it as a compact clickable strip (described in detail in the instructions section below). Create a placeholder version of the file in the project. I'll replace it with the real one before launch.

4. **Visual, illustrated getting-started guide** — not a plain numbered list. Design this as a proper step-by-step experience with real visual weight:

   - Each step is a distinct visual card or block, not a list item
   - Where a step involves a specific app or tool, show its actual logo or icon inline. Fetch the VS Code logo SVG from Microsoft's CDN (`https://code.visualstudio.com/favicon.ico` or inline the recognizable icon), and use Anthropic's Claude spark icon (✦ character, styled prominently) for Claude-related steps
   - **The `CLAUDE.md` download should be a file card** — a compact clickable strip, not a button. Think of how Slack or Notion render a file attachment: a small file-type icon on the left, the filename `CLAUDE.md` and a subtle detail like "Text file · 4 KB" beside it, a faint download icon on the right, the whole row has a light border and background, and the entire strip is the click target. It should feel like a real file sitting on the page, not a UI element asking you to do something.
   - Steps that involve UI actions inside VS Code (clicking the Extensions icon, clicking the Spark icon) should show a small inline illustration or icon representing what they'll see — the four-squares Extensions icon, the ✦ Spark icon — so they can visually match it to what's on their screen
   - The Mac/Windows home folder paths should be shown as styled code pills (`~/CLAUDE.md` and `C:\Users\yourname\CLAUDE.md`) not inline text
   - The overall feel should be closer to a beautifully designed onboarding screen than a help article. Think Notion's getting started page, or Linear's empty states: clear, calm, confident, visual

   Steps to cover:
   1. Download VS Code → branded download link
   2. Open the Extensions panel in VS Code → show the four-squares icon
   3. Search "Claude Code" and install the Anthropic extension → "Install Extension" link to the Marketplace
   4. Sign in with Claude account when prompted
   5. Download `CLAUDE.md` and save it to the home folder → file card (as described above) + styled path pills for Mac and Windows showing where to save it
   6. Create a new folder for the project, open it in VS Code via File → Open Folder
   7. Click the Spark icon (✦) in the sidebar → show the icon
   8. Start talking — Claude already has the instructions

   No emojis anywhere on the page. Use iconography, illustration, and typographic treatment instead.

5. **A statement of what this is** — not a wall of copy. Enough to set the scene for a team member visiting for the first time. Cover:
   - This is a side project and part of the team's learning and development plan for the year
   - The idea: each person builds one small web app, Leonard assembles them all here
   - Why: because the best way to learn new tools is to make something real with them — designers who can build are designers who are ready for what's coming
   - The tone should be warm, light, and a little exciting. Not corporate. Not a mission statement. Something that makes someone want to participate.

## Design direction

The visual anchor is **kueh lapis** — the layered Southeast Asian steamed cake, built color by color, each stratum pressed and set before the next one goes on. It's the perfect analogy for what this site will become: distinct pieces, each from a different person, stacked into a single whole.

Use that literally and structurally. The page itself should feel like it's built in layers — whether that's the layout, the color system, the way sections stack, or some kind of motion that reveals or accumulates. The palette should draw from real kueh lapis: those specific pandan greens, rose pinks, egg yellows, coconut whites — but handled with precision, not decoration. Think of the colors as a system, not an accent.

The signature element should make someone immediately understand the analogy without being told. If they have to read copy to get it, the design hasn't done its job.

Make deliberate choices throughout. No safe defaults. These are designers. They will feel it if the output is templated. Take a specific risk and be able to justify every color, every layer, every decision in terms of the kueh lapis idea.

## Technical requirements

- Single HTML file with CSS and JS inline — no build step, no dependencies, no framework
- The countdown must work correctly in the browser with no server required
- The `CLAUDE.md` download should work via an `<a>` tag with `download` attribute pointing to the file
- Fully responsive down to mobile
- Respects `prefers-reduced-motion` for any animations

## Deliverables

- `index.html` — the page
- `CLAUDE.md` — placeholder version (just needs to exist so the download link works; I'll replace the contents)

Once it's built, open it in the browser and show me. Then we'll iterate.
