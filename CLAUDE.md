# zudo-css-playground

AI-driven CSS Playground app for generating and previewing UI component variations with strict design token enforcement.

## Tech Stack

- **Astro 5** — Static/hybrid SSR (with @astrojs/node for API routes)
- **React 19** — Interactive islands (chat, color panel, sidebar)
- **Tailwind CSS v4** — Styling via @tailwindcss/vite
- **TypeScript** — Strict mode
- **Tauri v2** — Optional desktop wrapper (src-tauri/)

## Development

Package manager: **pnpm** (Node.js >= 20)

```bash
pnpm install
pnpm dev              # Dev server → http://localhost:4321
pnpm dev:net          # Dev server on LAN (0.0.0.0)
pnpm build            # Production build
pnpm preview          # Preview production build
```

## Architecture

### Token System (`src/styles/tokens.css`)

Three-tier color + tight spacing tokens. All pattern CSS must use token variables — no arbitrary values.

- Spacing: `hsp-2xs..2xl` (horizontal), `vsp-2xs..2xl` (vertical)
- Colors: 16-color palette (`--cssp-0..15`) + semantic (`--cssp-bg`, `--cssp-accent`, etc.)
- Typography: `text-caption..display`, `font-weight-normal..bold`

### Components

| Component | Purpose |
|-----------|---------|
| `html-preview.tsx` | Iframe-based live CSS demos with viewport switching |
| `sidebar-nav.tsx` | Category navigation |
| `color-tweak-panel.tsx` | Floating color palette editor (3 presets) |
| `ai-chat-modal.tsx` | AI chat that creates pattern files via Claude CLI |

### AI Chat (`src/pages/api/ai-chat.ts`)

- Spawns local `claude` CLI with token-aware system prompt
- AI outputs structured JSON with file content
- Server writes `.astro` pages and updates sidebar-nav.tsx
- Chat modal shows loading phases and reload button

### Pattern Pages (`src/pages/*.astro`)

Each category is an Astro page with multiple HtmlPreview demos. Patterns use strict token-only CSS.

### Tauri Wrapper (`src-tauri/`)

Optional desktop app. Bundled Node.js sidecar, loading screen, process management.

```bash
bash scripts/download-node.sh   # Download Node binary
cargo tauri dev                 # Dev mode
cargo tauri build               # Build .app
```

## Safety Rules

- `rm -rf`: relative paths only
- No force push, no `--amend` unless explicitly permitted
