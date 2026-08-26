#!/usr/bin/env python3
"""Serve Kueh Machine locally with the same clean contributor URLs as Vercel."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
import argparse
import os


ROUTES = {
    "amanda": "/machines/amanda",
    "amy": "/machines/amy",
    "geraldine": "/machines/geraldine",
    "hub": "/machines/hub",
    "jesslyn": "/machines/jesslyn",
    "kaixin": "/machines/kaixin/dist",
    "ken": "/machines/ken",
    "kevin": "/machines/kevin",
    "liwei": "/machines/liwei",
    "meijun": "/machines/meijun",
    "natalia": "/machines/natalia",
    "nicole": "/machines/nicole",
    "ruth": "/machines/ruth",
    "samantha": "/machines/samantha/out",
    "sophia": "/machines/sophia",
    "viki": "/machines/viki",
}


class CleanRouteHandler(SimpleHTTPRequestHandler):
    def _rewrite_clean_route(self) -> bool:
        parsed = urlsplit(self.path)
        parts = parsed.path.lstrip("/").split("/", 1)
        slug = parts[0]
        if slug not in ROUTES:
            return True
        if parsed.path == f"/{slug}":
            self.send_response(308)
            self.send_header("Location", f"/{slug}/")
            self.end_headers()
            return False
        remainder = parts[1] if len(parts) > 1 else ""
        rewritten = f"{ROUTES[slug]}/{remainder}"
        self.path = urlunsplit(("", "", rewritten, parsed.query, parsed.fragment))
        return True

    def do_GET(self) -> None:
        if self._rewrite_clean_route():
            super().do_GET()

    def do_HEAD(self) -> None:
        if self._rewrite_clean_route():
            super().do_HEAD()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--directory", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    os.chdir(args.directory)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), CleanRouteHandler)
    print(f"Serving Kueh Machine at http://localhost:{args.port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
