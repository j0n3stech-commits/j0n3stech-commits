# 03X IDE — Base44 Dev Environment

## Overview
Online ESP32 development environment with AI agents. Vite + React + TypeScript frontend, Express + SQLite backend.

## Architecture
- **Frontend** (`frontend/`): Vite dev server on port 5173 (mapped to host 3000). Monaco editor, SVG wiring canvas, AI chat, serial monitor.
- **Backend** (`backend/`): Express API on port 3001 (internal, proxied through Vite). SQLite via better-sqlite3. JWT auth.
- Single-origin: Vite proxies `/api/*` to the backend. No CORS needed.

## Running
```bash
docker compose -f docker-compose.base44.yml up -d
```
- Web: http://localhost:3000
- API: proxied at /api, direct at http://localhost:3001/api/health

## Key Details
- Vite 5.x requires `allowedHosts: true` in vite.config.ts (not the env var, which is Vite 6.1+).
- Monaco editor loaded via `@monaco-editor/react` (CDN loader, no local workers needed).
- AI agents use OpenAI API when `OPENAI_API_KEY` is set; otherwise return simulated responses for demo.
- Web Serial API requires Chrome/Edge. Works in the preview iframe for serial monitor.
- `diff` npm package used for code diffing in CODER/DEBUGGER Accept/Reject flow.
- JSZip used for project export (download as .zip).

## Keyboard Shortcuts
- Ctrl+S: Save project
- Ctrl+K: Focus AI chat input

## Secrets
- `OPENAI_API_KEY`: Required for real AI responses. Without it, agents return simulated responses. Get from https://platform.openai.com/api-keys.
