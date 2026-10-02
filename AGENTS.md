# Base44 Dev Environment

## What this repo is
A GitHub **profile README** repository — the only content is `README.md` (markdown with badges, images, and embedded HTML). There is no application code, backend, or build step.

## How it runs in Base44
A `python:3.12-slim` container serves the repo root as static files on port 8000 (mapped to host 3000) via `python -m http.server`. An `index.html` at the repo root loads `marked.js` from CDN, fetches `README.md` at runtime, and renders it with GitHub-like styling.

- **No build step, no live-reload framework.** Edits to `README.md` appear on browser refresh (the client-side JS re-fetches it each load). Call `reload_preview` after edits to force the iframe to refresh.
- **No secrets required.**
- The repo directory has `700` permissions, so nginx (non-root workers) gets 403 — that's why we use Python's http.server which runs as root.

## Verify it works
```sh
docker compose -f docker-compose.base44.yml up -d
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/   # expect 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/README.md  # expect 200
```
