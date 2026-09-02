#!/usr/bin/env python3
"""Static server + SSE live reload for the docs and examples. Stdlib only.

    python3 dev.py [port]     # default http://localhost:5173

Save any file in this directory and every open tab reloads.
"""
import os
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
POLL = 0.25
HEARTBEAT = 15

CLIENT = b"<script>new EventSource('/__reload').onmessage=()=>location.reload()</script>\n"

_version = 0
_cond = threading.Condition()


def snapshot():
    """Set of (path, mtime) for every non-hidden file under ROOT."""
    out = set()
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if not d.startswith(".")]
        for name in filenames:
            if name.startswith("."):
                continue
            p = os.path.join(dirpath, name)
            try:
                out.add((p, os.stat(p).st_mtime_ns))
            except OSError:
                pass
    return out


def watch():
    global _version
    last = snapshot()
    while True:
        time.sleep(POLL)
        now = snapshot()
        if now != last:
            last = now
            with _cond:
                _version += 1
                _cond.notify_all()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/__reload":
            return self.stream_reloads()
        if path.endswith("/"):
            path += "index.html"
        if path.endswith(".html"):
            return self.serve_html(path)
        return super().do_GET()

    def serve_html(self, path):
        """Serve HTML with the reload client injected, so index.html stays clean."""
        try:
            with open(os.path.join(ROOT, path.lstrip("/")), "rb") as f:
                body = f.read()
        except OSError:
            return self.send_error(404)
        body = body.replace(b"</body>", CLIENT + b"</body>") if b"</body>" in body else body + CLIENT
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def stream_reloads(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Connection", "keep-alive")
        self.end_headers()
        with _cond:
            seen = _version
        try:
            while True:
                with _cond:
                    changed = _cond.wait_for(lambda: _version != seen, timeout=HEARTBEAT)
                    seen = _version
                self.wfile.write(b"data: reload\n\n" if changed else b": ping\n\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, fmt, *args):
        if "__reload" not in (args[0] if args else ""):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    threading.Thread(target=watch, daemon=True).start()
    ThreadingHTTPServer.daemon_threads = True
    print(f"serving {ROOT} on http://localhost:{port}  (live reload on)")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
