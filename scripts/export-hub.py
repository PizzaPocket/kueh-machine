#!/usr/bin/env python3
"""Export the Godot Hub and restore its account/character browser bridge."""

from pathlib import Path
import subprocess


ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "godot" / "hub"
HTML = ROOT / "machines" / "hub" / "index.html"
GODOT = Path("/Applications/Godot.app/Contents/MacOS/Godot")

SCRIPT_TAG = '\t\t<script src="index.js"></script>'
SCRIPT_TAGS = """\t\t<script src="/shared/account-widget.js" data-anchor="top-right"></script>
\t\t<script src="/shared/character-system.js"></script>
\t\t<script src="index.js"></script>"""

HEAD_END = "\t</head>"
# The account-widget badge and the root landing page's wordmark both need
# Syne (Kueh-verse's own Label3D text uses a bundled .ttf, not a web font --
# this page never had a reason to load Syne before the wordmark below
# needed it).
FONT_LINKS = """\t<link rel="preconnect" href="https://fonts.googleapis.com">
\t<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
\t<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&display=swap" rel="stylesheet">
\t<link rel="stylesheet" href="/styles/fonts.css">
"""

STYLE_END = "\t\t</style>"
LOADER_CSS = """

/* Godot's non-scrolling shell otherwise fills Safari's larger layout
   viewport, while the actually visible viewport can begin tens of pixels
   lower beneath the browser chrome. These variables are synchronized from
   visualViewport below so both the game and its loader occupy exactly the
   visible rectangle, with no clipped top or compensating black gap below. */
:root {
	--kueh-vv-left: 0px;
	--kueh-vv-top: 0px;
	--kueh-vv-width: 100vw;
	--kueh-vv-height: 100vh;
}

#canvas,
#status {
	position: fixed !important;
	left: var(--kueh-vv-left) !important;
	top: var(--kueh-vv-top) !important;
	right: auto !important;
	bottom: auto !important;
	width: var(--kueh-vv-width) !important;
	height: var(--kueh-vv-height) !important;
}

/* Kueh-verse's only loading surface: the real Godot download progress. */
#status {
	background: #ffffff;
	gap: 24px;
	/* Just below account-widget.js's own hardcoded badge z-index (2147483000,
	   not something this page controls) rather than the previous
	   2147483646 -- per direct instruction, the account button should show
	   through the loading screen the same way it does on the landing page,
	   which a higher z-index here was silently hiding it behind. Still far
	   above the canvas/everything else on the page. */
	z-index: 2147482999;
}

/* Same wordmark markup/look as the root landing page's own .landing-header
   .wordmark, per direct instruction -- a child of #status rather than a
   separate persistent header, so it shares #status's own show/hide
   lifecycle (setStatusMode('hidden') below) instead of lingering once
   loading finishes and gameplay starts. */
.wordmark {
	position: absolute;
	top: 24px;
	left: 32px;
	color: #B72E68;
	font-family: Syne, Arial, sans-serif;
	font-size: 16px;
	letter-spacing: -0.025em;
	line-height: 1;
	text-decoration: none;
}

.wordmark-kueh { font-weight: 800; }
.wordmark-machine { font-weight: 600; }

#status-progress {
	appearance: none;
	-webkit-appearance: none;
	position: absolute;
	bottom: 10%;
	/* Absolute positioning takes this out of #status's own centered flex
	   flow, so it needs its own explicit horizontal centering -- without
	   it the bar fell back to its flex static position, which read as
	   weighted toward the left instead of centered. */
	left: 50%;
	transform: translateX(-50%);
	width: min(420px, calc(100vw - 64px));
	height: 4px;
	margin: 0;
	border: 0;
	border-radius: 2px;
	background: #dedbd4;
	overflow: hidden;
}

#status-progress::-webkit-progress-bar {
	background: #dedbd4;
}

#status-progress::-webkit-progress-value {
	background: #171311;
}

#status-progress::-moz-progress-bar {
	background: #171311;
}

#status-phase {
	position: absolute;
	bottom: calc(10% + 16px);
	left: 50%;
	transform: translateX(-50%);
	color: #5c564e;
	font-family: "Instrument Sans", Arial, sans-serif;
	font-size: 13px;
	font-weight: 600;
	white-space: nowrap;
}

#loading-controls {
	display: none;
	position: absolute;
	top: 50%;
	left: 50%;
	width: min(760px, calc(100vw - 64px));
	transform: translate(-50%, -50%);
	color: #5c564e;
	font-family: Syne, Arial, sans-serif;
	font-size: 16px;
	font-weight: 600;
	line-height: 1.4;
	text-align: center;
}

.loader-desktop {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 54px;
}

.loader-control {
	display: flex;
	min-width: 150px;
	flex-direction: column;
	align-items: center;
	gap: 14px;
}

.loader-wasd {
	display: grid;
	grid-template-columns: repeat(3, 38px);
	grid-template-rows: repeat(2, 38px);
	gap: 5px;
}

.loader-wasd .key:first-child {
	grid-column: 2;
	grid-row: 1;
}

.loader-wasd .key:nth-child(2) { grid-column: 1; grid-row: 2; }
.loader-wasd .key:nth-child(3) { grid-column: 2; grid-row: 2; }
.loader-wasd .key:nth-child(4) { grid-column: 3; grid-row: 2; }

.key,
.mouse-control {
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	border: 1px solid #aaa59c;
	background: #f4f2ed;
	color: #171311;
	font: inherit;
}

.key {
	width: 38px;
	height: 38px;
	border-radius: 26.3158%;
	corner-shape: squircle;
	font-family: "Instrument Sans", Arial, sans-serif;
	font-weight: 400;
}

.space-key {
	width: 142px;
	height: 38px;
	border-radius: 10px;
	font-size: 12px;
	letter-spacing: 0.08em;
}

.mouse-control {
	width: 52px;
	height: 70px;
	border-radius: 24px;
	/* Overrides the shared .key/.mouse-control center alignment above --
	   per direct correction, a vertically-centered line just reads as a
	   mouse cut in half, not a scroll wheel; shifted toward the top of the
	   shape (padding-top, not touching the border) reads more like one. */
	align-items: flex-start;
	padding-top: 16px;
}

.mouse-control::before {
	content: '';
	width: 2px;
	height: 14px;
	border-radius: 1px;
	background: #171311;
}

.loader-mobile {
	display: none;
	flex-direction: column;
	align-items: center;
	gap: 24px;
}

/* The loader and in-game joystick share one proportional construction:
   transparent outer, a 32%-opacity dark ring 5.13% of the control size,
   a 43.6%-sized light knob, and 34% circular corner curves on both layers. These
   ratios are mirrored by hub_ui.gd so phone/tablet scaling cannot change
   the relationship between stroke, knob, and corners. */
.loader-joystick {
	position: relative;
	width: 156px;
	height: 156px;
	box-sizing: border-box;
	border: 8px solid rgba(41, 28, 18, 0.32);
	border-radius: 34%;
	background: transparent;
}

.loader-joystick::after {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	width: 68px;
	height: 68px;
	border-radius: 34%;
	background: rgba(247, 237, 217, 0.90);
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.22);
	/* A gentle, looping drift within the outer ring -- per direct
	   instruction, hints the knob is draggable rather than sitting
	   perfectly still and reading as a fixed icon. The forward/back drift
	   itself still takes the original 2.6s (same keyframe shape, just
	   compressed into the first half of a longer cycle); the second half
	   holds at center as an explicit pause before the next cycle, per
	   direct follow-up instruction that the original loop's pause read as
	   too short. */
	animation: loader-joystick-nudge 5.2s ease-in-out infinite;
}

@keyframes loader-joystick-nudge {
	0%, 50%, 100% { transform: translate(-50%, -50%); }
	12.5% { transform: translate(calc(-50% - 15px), calc(-50% - 11px)); }
	25% { transform: translate(-50%, -50%); }
	37.5% { transform: translate(calc(-50% + 15px), calc(-50% + 11px)); }
}

/* Narrow width OR touch-primary/no-hover, not narrow width alone -- a
   tablet in landscape is comfortably wider than 700px but still has no
   keyboard/mouse, so a width-only query left it showing the WASD/mouse
   hint. (hover: none) and (pointer: coarse) reflects the actual input
   hardware regardless of window size, matching ui_kit.gd's own
   is_mobile_viewport() (DisplayServer.is_touchscreen_available()). */
@media (max-width: 700px), (hover: none) and (pointer: coarse) {
	.loader-desktop { display: none; }
	.loader-mobile { display: flex; }
}
"""

SPLASH_IMAGE = '\t\t\t<img id="status-splash" class="show-image--false fullsize--true use-filter--true" src="index.png" alt="">\n'
PROGRESS_ELEMENT = '\t\t\t<progress id="status-progress"></progress>'
WORDMARK_HTML = '\t\t\t<a class="wordmark" href="/" aria-label="Kueh Machine home"><span class="wordmark-kueh">Kueh</span> <span class="wordmark-machine">Machine</span></a>\n'
PROGRESS_WITH_TIP = WORDMARK_HTML + """\t\t\t<div id="status-phase" role="status">Getting things ready…</div>
\t\t\t<progress id="status-progress"></progress>
\t\t\t<div id="loading-controls">
\t\t\t\t<div class="loader-desktop">
\t\t\t\t\t<div class="loader-control">
\t\t\t\t\t\t<div class="loader-wasd" aria-hidden="true"><span class="key">W</span><span class="key">A</span><span class="key">S</span><span class="key">D</span></div>
\t\t\t\t\t\t<span>Use WASD to move</span>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="loader-control">
\t\t\t\t\t\t<div class="mouse-control" aria-hidden="true"></div>
\t\t\t\t\t\t<span>Click to control the camera with the mouse</span>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="loader-control">
\t\t\t\t\t\t<div class="key space-key" aria-hidden="true">SPACE</div>
\t\t\t\t\t\t<span>Press Spacebar to jump</span>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<div class="loader-mobile">
\t\t\t\t\t<div class="loader-joystick" aria-hidden="true"></div>
\t\t\t\t\t<span>Drag the joystick to move</span>
\t\t\t\t</div>
\t\t\t</div>"""

STATUS_VARIABLES = """\tconst statusProgress = document.getElementById('status-progress');
\tconst statusNotice = document.getElementById('status-notice');"""
STATUS_VARIABLES_WITH_TIPS = """\tconst statusProgress = document.getElementById('status-progress');
\tconst statusNotice = document.getElementById('status-notice');
\tconst statusPhase = document.getElementById('status-phase');
\tconst loadingControls = document.getElementById('loading-controls');

\tfunction syncVisibleViewport(notifyGodot) {
\t\tconst viewport = window.visualViewport;
\t\t// Safari generally exposes browser-chrome displacement through
\t\t// offsetTop. Chrome on iOS can instead retain it as document scroll,
\t\t// making offsetTop zero even though the visible page begins lower.
\t\t// pageLeft/pageTop include both components, which is the coordinate
\t\t// this locked, non-scrolling Godot document needs.
\t\tconst left = viewport ? viewport.pageLeft : (window.scrollX || 0);
\t\tconst top = viewport ? viewport.pageTop : (window.scrollY || 0);
\t\tconst width = viewport ? viewport.width : window.innerWidth;
\t\tconst height = viewport ? viewport.height : window.innerHeight;
\t\tconst rootStyle = document.documentElement.style;
\t\trootStyle.setProperty('--kueh-vv-left', left + 'px');
\t\trootStyle.setProperty('--kueh-vv-top', top + 'px');
\t\trootStyle.setProperty('--kueh-vv-width', width + 'px');
\t\trootStyle.setProperty('--kueh-vv-height', height + 'px');
\t\tif (notifyGodot) {
\t\t\trequestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
\t\t}
\t}

\tsyncVisibleViewport(false);
\twindow.addEventListener('resize', () => syncVisibleViewport(false));
\tif (window.visualViewport) {
\t\twindow.visualViewport.addEventListener('resize', () => syncVisibleViewport(true));
\t\twindow.visualViewport.addEventListener('scroll', () => syncVisibleViewport(false));
\t}"""

HIDE_STATUS = """\t\tif (mode === 'hidden') {
\t\t\tstatusOverlay.remove();"""
HIDE_STATUS_WITH_TIP_CLEANUP = """\t\tif (mode === 'hidden') {
\t\t\tstatusOverlay.remove();"""

PROGRESS_VISIBILITY = "\t\tstatusProgress.style.display = mode === 'progress' ? 'block' : 'none';"
PROGRESS_AND_TIP_VISIBILITY = """\t\tstatusProgress.style.display = mode === 'progress' ? 'block' : 'none';
		statusPhase.style.display = mode === 'progress' ? 'block' : 'none';
\t\tloadingControls.style.display = mode === 'progress' ? 'block' : 'none';"""

PROGRESS_CALLBACK = """\t\t\t'onProgress': function (current, total) {
\t\t\t\tif (current > 0 && total > 0) {
\t\t\t\t\tstatusProgress.value = current;
\t\t\t\t\tstatusProgress.max = total;
\t\t\t\t} else {
\t\t\t\t\tstatusProgress.removeAttribute('value');
\t\t\t\t\tstatusProgress.removeAttribute('max');
\t\t\t\t}
\t\t\t},"""

WHOLE_LAUNCH_PROGRESS = """\t\t\t'onProgress': function (current, total) {
\t\t\t\tif (current > 0 && total > 0) {
\t\t\t\t\tconst downloadRatio = Math.min(current / total, 1);
\t\t\t\t\tstatusProgress.max = 1;
\t\t\t\t\tstatusProgress.value = downloadRatio * 0.9;
\t\t\t\t\tstatusPhase.textContent = downloadRatio >= 1 ? 'Starting Kuehverse…' : 'Loading Kuehverse…';
\t\t\t\t} else {
\t\t\t\t\tstatusProgress.removeAttribute('value');
\t\t\t\t\tstatusProgress.removeAttribute('max');
\t\t\t\t\tstatusPhase.textContent = 'Getting things ready…';
\t\t\t\t}
\t\t\t},"""

START = """\t\tsetStatusMode('progress');
\t\tengine.startGame({"""

BRIDGE = """\t\tsetStatusMode('progress');
\t\twindow.getKuehCharacterBootstrapJson = function () {
\t\t\tconst state = window.KuehCharacters ? window.KuehCharacters.getState() : {};
\t\t\treturn JSON.stringify({
\t\t\t\tuserId: state.userId || '',
\t\t\t\tappearance: state.appearance || {},
\t\t\t\townedContributorKey: state.contributor ? state.contributor.contributor_key : '',
\t\t\t\tcontributors: window.KuehCharacters ? window.KuehCharacters.getResolvedContributors() : [],
\t\t\t});
\t\t};
\t\twindow.kuehCharacterEditorRequested = false;
\t\twindow.consumeKuehCharacterEditorRequest = function () {
\t\t\tif (!window.kuehCharacterEditorRequested) return false;
\t\t\twindow.kuehCharacterEditorRequested = false;
\t\t\treturn true;
\t\t};
\t\twindow.saveKuehCharacterJson = function (json) {
\t\t\twindow.kuehCharacterSaveState = 'saving';
\t\t\twindow.kuehCharacterSaveError = '';
\t\t\ttry {
\t\t\t\tconst appearance = JSON.parse(json);
\t\t\t\twindow.KuehCharacters.saveAppearance(appearance).then(function () {
\t\t\t\t\twindow.kuehCharacterSaveState = 'saved';
\t\t\t\t}, function (error) {
\t\t\t\t\twindow.kuehCharacterSaveError = error && error.message ? error.message : String(error);
\t\t\t\t\twindow.kuehCharacterSaveState = 'error';
\t\t\t\t});
\t\t\t} catch (error) {
\t\t\t\twindow.kuehCharacterSaveError = error && error.message ? error.message : String(error);
\t\t\t\twindow.kuehCharacterSaveState = 'error';
\t\t\t}
\t\t};
\t\tif (window.KuehCharacters) window.KuehCharacters.enableEditorMenuAction();
\t\tconst characterReady = window.KuehCharacters
\t\t\t? window.KuehCharacters.refresh().catch((error) => console.warn('[Kueh-verse] using bundled character defaults:', error))
\t\t\t: Promise.resolve();
\t\tcharacterReady.then(() => engine.startGame({"""

END = """\t\t}).then(() => {
\t\t\tsetStatusMode('hidden');"""
BRIDGED_END = """\t\t})).then(() => {
\t\t\tstatusProgress.max = 1;
\t\t\tstatusProgress.value = 1;
\t\t\tstatusPhase.textContent = 'Ready';
\t\t\trequestAnimationFrame(() => requestAnimationFrame(() => setStatusMode('hidden')));"""


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if source.count(old) != 1:
        raise RuntimeError(f"Expected one {label} marker, found {source.count(old)}")
    return source.replace(old, new, 1)


def main() -> None:
    subprocess.run(
        [str(GODOT), "--headless", "--path", str(PROJECT), "--export-release", "Web"],
        cwd=ROOT,
        check=True,
    )
    html = HTML.read_text()
    html = replace_once(html, "<title>Kueh Machine Hub</title>", "<title>Kueh-verse — Kueh Machine</title>", "title")
    html = replace_once(html, HEAD_END, FONT_LINKS + HEAD_END, "font links")
    html = replace_once(html, STYLE_END, LOADER_CSS + STYLE_END, "loader styles")
    html = replace_once(html, SPLASH_IMAGE, "", "unused splash image")
    html = replace_once(html, PROGRESS_ELEMENT, PROGRESS_WITH_TIP, "progress tooltip")
    html = replace_once(html, SCRIPT_TAG, SCRIPT_TAGS, "script")
    html = replace_once(html, STATUS_VARIABLES, STATUS_VARIABLES_WITH_TIPS, "tooltip variables")
    html = replace_once(html, HIDE_STATUS, HIDE_STATUS_WITH_TIP_CLEANUP, "tooltip cleanup")
    html = replace_once(html, PROGRESS_VISIBILITY, PROGRESS_AND_TIP_VISIBILITY, "tooltip visibility")
    html = replace_once(html, START, BRIDGE, "engine start")
    html = replace_once(html, PROGRESS_CALLBACK, WHOLE_LAUNCH_PROGRESS, "whole-launch progress")
    html = replace_once(html, END, BRIDGED_END, "engine completion")
    HTML.write_text(html)
    print(f"Exported Hub with character bridge: {HTML}")


if __name__ == "__main__":
    main()
