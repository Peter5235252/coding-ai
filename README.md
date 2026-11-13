# Zenith Code

A minimalist, adaptive programming studio with real code execution, gamified skill tracking,
and a Socratic Gemini mentor. Built from the Google AI Studio React + Express template.

## Quick start

```bash
bun install
bun run dev
```

Open <http://127.0.0.1:3000>. On first launch the app asks you to:

1. **Pick a Gemini model** — Gemini 4 Hydrogen, Argon, or Carbon.
2. **Paste your own Gemini API key** — or choose *Explore offline* to use the built-in
   fallbacks. No key is bundled, read from `.env`, or pre-baked into the build.

Get a key at <https://aistudio.google.com/api-keys>.

### Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Express + Vite dev server (`tsx server.ts`) |
| `bun run build` | Production client bundle in `dist/` |
| `bun run start` | Serve the app (set `NODE_ENV=production` for `dist/`) |
| `bun run lint` | TypeScript typecheck (`tsc --noEmit`) |

The repository ships a `bun.lock`. `npm install` currently fails on an `esbuild`
peer-dependency conflict between the pinned `esbuild@0.25` and Vite 8.

## Gemini model selection

The picker appears on first launch and can be reopened any time from the
**Gemini / Connect AI** button in the navigation bar or the model chip in the
mentor panel.

| Model | Best for | Free tier | Paid price |
| --- | --- | --- | --- |
| **Gemini 4 Hydrogen** | Everyday coding, prototypes, high-volume tutoring | Yes, rate-limited | $1.50 / $7.50 per 1M tokens |
| **Gemini 4 Argon** | Long-horizon reasoning with lower token spend | No | $2.00 / $10.00 per 1M tokens |
| **Gemini 4 Carbon** | Hardest architecture, science, and security work | No | $2.00 / $10.00 per 1M tokens |

Prices are the standard rates shown in Google's pricing page on November 13, 2026.
Carbon and Argon move to $4.00 / $20.00 per 1M tokens on December 1, 2026.
Hydrogen's free tier is rate-limited; paid usage is flat across its 1M context window.

Hydrogen is the default. At its default `high` thinking level it scores **51 vs 50**
against Argon on the Artificial Analysis Intelligence Index, reaching **54 at `xhigh`**.
Google also reports it is **2.5× faster than Gemini 3.8 Flash** and raises
Terminal-Bench 4.1 from 18.2% to 57.0%. Sources:

- [Introducing Gemini 4 Hydrogen](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/)
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-4-hydrogen)
- [Gemini 4 Hydrogen model card](https://deepmind.google/models/model-cards/gemini-4-hydrogen/)
- [Artificial Analysis](https://artificialanalysis.ai/)

## API key security

The key is **never** placed in the client bundle, `localStorage`, or a source file.

- The browser sends the key once, over a same-origin request, to the local Express server.
- The server encrypts it with **AES-256-GCM** and writes `api-key.vault` with mode `0600`.
- The 32-byte master key lives in `master.key` (mode `0600`) or can be supplied through
  `ZENITH_MASTER_KEY` so it never touches disk.
- `/api/config` only ever returns `hasKey`, the selected model, and a masked hint such as
  `••••••••1a2b`.
- Submitted Python/JavaScript runs with a minimal environment, so student code cannot read
  server credentials from `process.env`.
- The server binds to `127.0.0.1` by default and rejects unexpected `Host` headers
  (DNS-rebinding protection). Set `HOST=0.0.0.0` only behind a trusted reverse proxy with
  TLS, and add hostnames through `ZENITH_ALLOWED_HOSTS` if needed.
- A key is never accepted over an unencrypted remote connection.

Threat model: this protects the key at rest and from accidental sharing. It does not defend
against malware running as the same OS user — no local secret store can.

## Architecture

```
server.ts                  Express API, Gemini calls, native Python/JS runners
server/configVault.ts      AES-256-GCM key vault + model preference
shared/geminiModels.ts     Model catalog shared by API and UI
src/App.tsx                Workspace shell, layout engine, setup gate
src/components/            Editor, terminal, mentor, modals
src/utils/codeRunner.ts    Server-first execution + browser fallback engine
src/data/curriculumData.ts 20 lessons across 11 languages
```

### Execution reality

- **Python** and **JavaScript** execute natively inside a bubblewrap sandbox (6 s limit,
  128 KB output cap, no network, no home directory).
- **Rust, C, C++, Go, Java, C#, Lua, Luau, GDScript** use Gemini to emulate a compiler
  and runtime. They are not executed by a real toolchain.
- Without a key, the browser fallback uses lightweight pattern matching and should be
  treated as illustrative, not authoritative.

## Notes

- API: `GET /api/config`, `POST /api/config/key`, `DELETE /api/config/key`,
  `POST /api/config/model`.
- Progress, code, and theme preferences are local to the browser.
- Native Python and JavaScript snippets run inside **bubblewrap** when it is installed:
  no network, no home directory, a read-only `/usr`, and an ephemeral `/tmp`. That keeps
  student code away from the encrypted key vault. Without `bubblewrap`, the server logs a
  warning and runs snippets with the server user's filesystem access.
- There is no authentication layer. This is a single-user local studio; do not expose it
  publicly as-is.
