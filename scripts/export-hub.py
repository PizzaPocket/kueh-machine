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
\t\t\tsetStatusMode('hidden');"""


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
    html = replace_once(html, SCRIPT_TAG, SCRIPT_TAGS, "script")
    html = replace_once(html, START, BRIDGE, "engine start")
    html = replace_once(html, END, BRIDGED_END, "engine completion")
    HTML.write_text(html)
    print(f"Exported Hub with character bridge: {HTML}")


if __name__ == "__main__":
    main()
