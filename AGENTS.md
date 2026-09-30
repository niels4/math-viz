# math-viz — Browser Math Visualization — Project Conventions

A browser math-visualization project: Vite 8 + React 19 + TypeScript 7, custom file-system routing, per-page CSS Module themes/fonts (offline), R3F + d3-math + GSAP stack ready. Scaffolded from the viz3d-factory template with `basics/` demo pages — new viz pages go under `src/pages/<area>/`.

## Commands

| Command                    | Purpose                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `npm test`                 | **Canonical verification**: oxlint + `tsc --noEmit` + vitest jsdom run. Must pass before work is done.            |
| `npm run test:run:browser` | Vitest in real Chromium (playwright). Also run this when changing the router or test harness.                     |
| `npm run generate`         | Regenerate `generated/routes.ts` after adding/removing/renaming pages (4 basics routes + `_root` + `_not_found`). |
| `npm run format`           | `oxfmt --write`. Run after editing code; do not hand-format.                                                      |
| `npm run dev`              | Vite dev server. Port varies by session — see Coexistence.                                                        |
| `npm run build`            | `tsc -b && vite build`.                                                                                           |

## Toolchain

- **TypeScript 7** (native compiler, tsgo). Typecheck: `npm run typecheck`. LSP: tsgo via globally-installed `tslsp-cli@0.6.0` (environment tool, never a project dependency; `npx --no-install @0xdeafcafe/tslsp-cli`, skill `.pi/skills/tslsp/SKILL.md` — REQUIRED for any TS/JS identifier work: `find-symbol`/`references`/`rename`/`rename-file` instead of `grep`/`edit`/`mv`). Also `pi-lsp-client` global config for diagnostics.
- **oxlint** (`.oxlintrc.json`): `react` + `typescript` + `oxc` + `import` + `jsx-a11y` + `vitest` plugins, `correctness: error` + `suspicious: error` (`pedantic`/`perf`/`restriction` off, `react-in-jsx-scope` etc off), `typeAware: true` via `oxlint-tsgolint@7` (`typescript/no-deprecated: error` mirrors `tsc --lsp` deprecated hints like `Clock` -> `Timer`). `typeCheck` stays off - `tsc -b` covers `tsc` diagnostics. See `.pi/skills/code-review/SKILL.md` for `readonly` guidance (suggest, do not enforce; imperative `for`/`push` can be faster than pure-functional).
- **oxfmt** (`.oxfmtrc.json`): no semicolons, printWidth 110, enforced import sorting, `sortPackageJson`. Match the style oxfmt produces.
- **esbuild pin + override** (`package.json`): direct `esbuild` devDep with `overrides.typed-scss-modules.esbuild: "$esbuild"` — `typed-scss-modules@8.1.1` (via `unplugin-typed-css-modules`, latest upstream) pins `esbuild ^0.17.0` with a moderate advisory and no upstream fix; the override dedups it to the clean tree version so `npm audit` stays at 0. Bump the direct pin with normal dep updates.
- **React 19 + React Compiler** via `oxc-transform-react@0.145` + `@vitejs/plugin-react@6` `react({ compiler: true })` (native Rust, 4x faster / 32% less RSS than Babel, no `@babel/core`/`@rolldown/plugin-babel`).
- **R3F stack** (skill `.pi/skills/r3f-viz-stack/SKILL.md`): `@react-three/fiber` + `@react-three/drei` (WebGL 3D chart panels where depth encodes information) + `d3-scale`/`d3-shape`/`d3-array` (data-to-geometry math, numbers only, never DOM; no d3 DOM packages, no visx — anything emitting SVG stays out) + `gsap` + `@gsap/react` (all motion via `useGSAP`, never `setState` per frame). Raw `three` arrives only as an R3F peer; never import it directly, no WebGPU/TSL track. New viz work starts from `basics/` + the skill (see Visualization Conventions).
- tsconfig strictness that shapes code: `strict: true` + `noUncheckedIndexedAccess: true` (`arr[i]` is `T | undefined` - use `?? 0` / `get(arr,i)` helper / `if (v===undefined) return`), `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature` (`process.env["FOO"]`, `routes["_not_found"]`), `verbatimModuleSyntax` (`import type`), `allowImportingTsExtensions` (relative carry `.ts`), `erasableSyntaxOnly` (no enums/namespaces), `forceConsistentCasingInFileNames`, `useUnknownInCatchVariables` (`catch(e: unknown)`), `isolatedModules`, `noUnusedLocals`/`noUnusedParameters`.

## Layout

```
src/
  main.tsx                 # entry: renders <Router routes={routes} />
  style/                   # project-level styles (sibling dirs, not parent/child)
    global.css             # sensible defaults + app shell (html/body/#root)
    themes/                # CSS Module themes per page (6 mathviz_*: arctic-ice, clean-teal, educational-warm, midnight-violet, sage-editorial, tron-cyan)
    fonts/                 # CSS Module fonts per page (work_sans, stix_two_text, roboto_mono) — local woff2, offline
  pages/                   # file-system routes (see Routing) — 6 routes: 4 basics + _root + _not_found
    basics/                # theme-demo, font-demo, counter, search-params
  components/router/       # Router + route state hooks
  test/                    # test harness (includes.tsx + per-env setup)
  util/
scripts/                   # node scripts; *.script.ts are entry points, *.test.ts run in node
generated/routes.ts        # generated artifact, committed; never hand-edit
.local/                    # gitignored agent scratch: one-off scripts, screenshots, test data — never committed (generateRoutes tests also write fixtures here)
```

Import aliases (package.json `imports`): `#src/*` → `./src/*`, `#generated/*` → `./generated/*`, `#test` → `./src/test/includes.tsx`.

## Imports — project vs relative

- **Project-level imports** (styles, fonts, themes, utils, cross-feature code) **must use `#src/`** — e.g. `import styles from "#src/style/themes/mathviz_arctic_ice.module.css"`, `import fontStyles from "#src/style/fonts/work_sans/work_sans.module.css"`, `import "#src/style/global.css"`, `import { foo } from "#src/util/bar.ts"`. This keeps moves cheap and paths stable.
- **Nearby/relative imports** (same dir or sibling, `*.module.css` next to its `.page.tsx`, `*.test.tsx` next to source) **use relative** — e.g. `import style from "./_root.page.module.css"` in `_root.page.tsx`, `import { helper } from "./helper.ts"`.
- Do not use relative `../../style/...` for project-level styles — use `#src/style/...`.

## Style — layout, offline & galleries

- **Canonical layout**: see `Layout` above — `src/style/{themes,fonts}` are **siblings** under `src/style` (not parent/child), `src/style/global.css` via `#src/style/global.css`. Do not nest `fonts` inside `themes`. No `html`/`body`/`:root` in modules, `_` not `-`, generic wrappers `.theme`/`.font` (file-hashed, import path switches theme/font — `styles.theme`/`fontStyles.font` uniform), oklch colors, `oxfmt` multi-line. Offline: fonts vendored woff2 (`WorkSans-Variable` 50KB, `STIXTwoText-Variable` 28KB, `RobotoMono-Variable` 33KB + italics) — verify `grep -r fonts.googleapis src/style/fonts` empty and `dist/assets/*.woff2` after build. See `src/style/themes/README.md` + `src/style/fonts/README.md` (authoritative).
- **Import alias**: project-level `→ #src/style/...` (e.g. `#src/style/themes/mathviz_arctic_ice.module.css`), nearby `→ ./_root.page.module.css` (see `Imports` above).
- **Galleries & workspace** (static `python -m http.server 8787` main / `8788` worktree, headed `mastra0-collab`):

| Gallery                                               | Catalog                                     | Labs                                         | Tools                                                                                |
| ----------------------------------------------------- | ------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `time-series` 12 images `1536*1024` + `manifest.json` | `workspace/media/galleries/time-series/`    | `time-series-gallery.html`                   | `qwen-image-3.0`                                                                     |
| `color` 9 palettes ×15 roles                          | `color-catalog.json` + `color-gallery.html` | `color-lab.html` (15 swatches + UI + viz)    | `color-extract`→`color-catalog`→`color-lab`→`theme-export`                           |
| `font` 10 fonts                                       | `font-catalog.json` + `font-gallery.html`   | `font-lab.html` (12/16/24/36/48/72 + UI/viz) | `font-extract`→`font-catalog`→`font-lab`→`font-export` (local woff2, `emitTs:false`) |

Studio chat sanitizes `style`/`video`, so galleries are the true preview surface (both `http://localhost:8787/...` + `file://`).

## Sommelier Workflow — repeatable (image → lab → per-page module)

Deterministic-first + offline-first. Repeat for any new gallery image; labs are the iteration surface before export.

| Step                  | Color (theme)                                                                                                                                     | Font (type)                                                                                                                                                                 | Input → Output                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1. Image → hint       | `color-extract` validates `gallery`+`file`, returns `manifestEntry` + `heuristic` 15-role palette                                                 | `font-extract` validates, returns `manifestEntry` + `heuristics` 1-3 `FontEntry` (e.g. `08→Bebas Neue 400 + Archivo Black + JetBrains Mono`; `05→Inter 100-900`)            | `time-series/08-brutalist-editorial.png` → heuristic (extrapolates) |
| 2. Catalog            | `color-catalog list → add/update` 15 roles, `contrastRatios`, `professional`/`designerFriendly` 1-10                                              | `font-catalog list → add/update` Google Fonts URLs, weights, `variable`, OFL cost                                                                                           | Full spec persisted                                                 |
| 3. Lab                | `color-lab paletteId + sourceFile → workspace/color-lab.html` (source image, 15 swatches, editable type, UI/viz)                                  | `font-lab fontId + sourceFile → workspace/font-lab.html` (source image, `12/16/24/36/48/72` editable, weights, UI **in that font**, viz text, snippet)                      | `workspace/*-lab.html` (dialogue refine rebuilds)                   |
| 4. Export             | `theme-export paletteId + vizProject:"math-viz" → src/style/themes/<slug>.module.css` (wrapper `.theme` generic file-hashed, oklch vars, `oxfmt`) | `font-export fontId + vizProject:"math-viz" → src/style/fonts/<col>/<col>.module.css` (wrapper `.font` generic file-hashed, `@font-face` local woff2, `oxfmt`)              | `src/style/...` + `workspace/...` (+ woff2 copy)                    |
| 5. Gallery + template | rebuild `color-gallery` (9), update `create-viz-project` verifies `src/style/themes/README.md` etc                                                | rebuild `font-gallery` (10), ships `inter`+`fraunces` (defaults) + `bebas_neue` (from 08) + `atkinson_hyperlegible`, `basics/font-demo`, verify `src/style/fonts/README.md` | `basics/*` demos co-existing per-section                            |

### Project scope — scaffolded from the viz3d-factory template

- This project was scaffolded from the viz3d-factory template (`basics/{theme-demo,font-demo,counter,search-params}` + `src/style/{themes,fonts}` + R3F/d3/GSAP stack). It is a project and will diverge — new viz pages go under `src/pages/<area>/` (one page per route).

## Architecture: Pages, Views, Data

`.page.tsx` files are the entry points into the app; the URL determines which page runs.

- **Simple pages are self-contained**: everything for the page lives in its `.page.tsx` file, optionally with a sibling `<name>.module.css` (see `search-params.page.tsx` + `search-params.module.css`).
- **As the app grows**, reusable pieces split into **views** (presentational components) and **data components** (fetching/shaping data). The page's job then is to read the URL and its parameters and connect the correct data to the correct views — pages orchestrate, they don't accumulate implementation.
- Don't extract views/data layers prematurely; split when a second consumer exists or the page file stops being scannable.

## Routing

File-system based: `scripts/generateRoutes.ts` scans pages, `src/components/router/` renders.

- Any `src/pages/**/*.page.tsx` with a default-exported component becomes a route: `src/pages/basics/counter.page.tsx` → `#basics/counter`.
- `_root.page.tsx` → `""` (index) and `_not_found.page.tsx` → fallback; both only at the pages root.
- Route and directory names: lowercase letters/numbers/dashes, no leading/trailing/double dashes (`isValidRoute`). Anything else fails route generation.
- Hash-based: route is `location.hash` minus `#`; search params follow `?` (`#basics/search-params?count=7`).
- **After adding/removing/renaming a page**: run `npm run generate`, and add a TOC link in `src/pages/_root.page.tsx`.
- Route state hooks (from `src/components/router/router-hooks.ts`): `useRoute()`, `useSearchParams()`, `useSetSearchParams()` (merge semantics; `null` value deletes a param).

## Testing

Vitest 5, two projects (vite.config.ts), coverage via `@vitest/coverage-v8` (text + html + lcov → `coverage/`):

| Project   | Environment       | Test files                                             | Setup                       |
| --------- | ----------------- | ------------------------------------------------------ | --------------------------- |
| `jsdom`   | node + jsdom      | `src/**/*.test.{ts,tsx}`, `scripts/**/*.test.{ts,tsx}` | `src/test/jsdom-setup.ts`   |
| `browser` | headless Chromium | `src/**/*.test.{ts,tsx}`                               | `src/test/browser-setup.ts` |

- **Tests import from `#test`** (`src/test/includes.tsx`), never directly from `@testing-library/react` or `vitest-browser-react`. The harness smooths the env differences: `render`, `renderHook`, `updateLocationHash`, `isBrowser()`, `defaultElementLocatorTimeout`.
- `render` wraps in `<StrictMode>`; effects double-run in both envs, write code accordingly.
- jsdom setup shims the browser API surface: `expect.element` → `expect.poll`, `render` returns `screen`, `<a href="#...">` clicks update `location.hash`.
- Tests must reset hash state between cases with `updateLocationHash(...)` in `beforeEach` (router state is module-level, see Gotchas).

## Visual Verification

No `agent-browser`: every browser check (page render, screenshots, animation frames, DOM reads) goes through a Playwright `.mjs` script in `.local/` against the session dev-server port.

To actually see a page (or animation) rendered in a browser:

- Playwright + Chromium ship via `@vitest/browser-playwright` (chromium lives in `~/Library/Caches/ms-playwright`). Put a small `.mjs` script in `.local/` (gitignored, excluded from coverage) so `import { chromium } from "playwright"` resolves against the project's `node_modules`.
- Find the dev server port with `ps aux | grep vite` + `lsof -nP -iTCP -sTCP:LISTEN`, matching the process whose cwd is this checkout. Never assume 5173. Navigate to `http://127.0.0.1:<port>/#<route>` (hash routing).
- For animation, capture frames a couple seconds apart: `await page.waitForTimeout(2000)` between `page.screenshot()` calls.
- You can view images: `read` on a screenshot PNG shows it to you. After capturing, look at the shot yourself and iterate on the scene (colors, layout, glow) before reporting done — visual review is part of every page task.

Reference script: `.local/capture.mjs`.

- If `capture.mjs` fails with `browserType.launch: Executable doesn't exist at .../ms-playwright/chromium_headless_shell-NNNN/...`, the `playwright` npm package wants a newer headless shell than the cached one: run `npx playwright install chromium` and retry.
- Drei `Text` (troika) keeps a `blob:` worker request open for the page lifetime, so `networkidle` never fires on Text pages: screenshot those with `CAPTURE_UNTIL=load node .local/capture.mjs ...`.

## Live Editing (user workflow)

The user edits in neovim with the `websocket-text-relay` language server (npm global, wired in the user's lazy.nvim config). It streams unsaved buffer text over a websocket to `vite-plugin-websocket-text-relay` (vite.config.ts), which swaps the module in memory and hot-reloads the page: 30-60 updates/sec, no file save. Status UI: http://localhost:38378. This is the user's primary loop for tuning visualizations (tweak a number, see it instantly).

Agent implications:

- The agent writes to disk; the user's live loop works on unsaved buffers. If the user is live-editing a file, disk edits to that same file can collide with their buffer — coordinate before touching it.
- When a dev server runs, agent disk edits hot-reload immediately, so the user sees agent changes live in the browser without any extra step.
- `vite.config.ts` disables `vite-plugin-websocket-text-relay` when `DISABLE_WTR=1` (`process.env.DISABLE_WTR === "1" || "true"`). Agent starts its isolated server as `DISABLE_WTR=1 npm run dev -- --port <free-port> --strictPort` so it only sees disk edits.

## Coexistence (multiple sessions)

The user runs their own long-lived tmux session (`math-viz`) for manual work, and pi0 may drive additional agent sessions (`math-viz-<branch>`) at the same time. This is the normal state, not a conflict.

- **Never assume port 5173.** Each session's dev server picks its own port — pick a free one (`lsof -nP -iTCP:<port> -sTCP:LISTEN`) and run vite with `--strictPort`; the chosen port prints in vite's `Local:` line. If you start a dev server yourself, pick a free port the same way.
- **Agent/user split:** user live-edits via `websocket-text-relay` on their dev server port (unsaved buffers → vite memory, 30–60fps). Agent runs its own vite with `DISABLE_WTR=1` (disk-only) on a free session port and drives Playwright `.mjs` scripts in `.local/` against `http://localhost:<session-port>/#<route>` (no `agent-browser`, see Visual Verification). Disk edits stay on the agent port, live buffers stay on the user's — no collision.
- **Never kill tmux sessions, dev servers, or processes you did not start.** The user's session is their workspace.
- Work in your own worktree/branch unless the user says otherwise; the user's checkout is often dirty with their in-progress work.

## Self-Improvement

This project is young and grows by experimentation. The user teaches conventions as you work together; when you learn something durable (a convention, a gotcha, a workflow fact), persist it into this AGENTS.md in the same session — don't leave it in chat. Keep entries short and factual. The global `debrief` skill handles bigger cleanups when the user asks.

## Visualization Conventions

- R3F/d3-math/GSAP/Drei stack for animated charts and 3D panels: skill `.pi/skills/r3f-viz-stack/SKILL.md` (roles, wedge geometry, install, perf rules). Load it for any wedge/radial, R3F, or GSAP task.
- New viz work is pages under `src/pages/<area>/` (one page per route): d3 scales turn data into geometry numbers, TSX declares the scene, GSAP moves it. Pages orchestrate (see Architecture); split views/data layers only when a second consumer exists.

## Gotchas

- **Router state is module-level singletons** in `router-hooks.ts` (`currentRoute`, `currentSearchParams`). `onHashChange()` runs at import time. Tests leak route state into each other unless reset via `updateLocationHash`.
- `npm test` runs only the jsdom project. The browser project is separate (`test:run:browser`); run both when touching `src/test/` or the router.
- `generated/routes.ts` is committed and must be regenerated (`npm run generate`) after page changes, or new pages 404 to `_not_found`.
- `npm run format` (oxfmt --write) formats the whole repo, not just the files you edited: it also reformats markdown tables (including this AGENTS.md) and CSS. Check `git status` after formatting; unrelated files may change.
- **The user's checkout is often dirty with in-progress work.** Before running repo-wide commands like `npm run format`, run `git status` (and `git diff` if needed) to see what the user already has in flight. If formatting would touch files you did not edit, prefer `npx oxfmt --write <your-files>` instead. Never discard working-tree changes with `git checkout --` or similar without asking.
- jsdom has no `requestAnimationFrame` (it exists only with `pretendToBeVisual: true`). Animated pages must guard their rAF effect with `if (typeof requestAnimationFrame !== "function") return`, or jsdom tests throw.
- **Vite HMR vs `page.reload()` race**: right after a disk edit, `reload` can still serve the old module; identical pixel samples across two edits mean stale content. Read back a DOM attribute (`circle r`, `stroke-width`) via `page.evaluate` to confirm the change landed, or sleep 2s and reload again.
- **Thin strokes at DPR 1 depend on sub-pixel placement**: a 1.5px vertical line centered at x=789.15 renders as one ~100% pixel plus one 65% pixel; widths below ~2px read thinner and darker than intended. Compare pixel rows against the reference, and design with DPR 2 in mind (check `devicePixelRatio` via `page.evaluate`).
- **Refactoring**: use `tslsp-cli` (skill `.pi/skills/tslsp/`) for any identifier/file move — `npx --no-install @0xdeafcafe/tslsp-cli rename-file OLD NEW --dry-run` then without, `rename --symbol OLD --new-name NEW`. Deterministic import rewrites via `tsgo` `workspace/willRenameFiles`. No manual `grep`/`edit`/`mv` for TS symbols.
- `screen.getByTestId`/`getByText` are typed as `Locator` (from `vitest-browser-react`). To introspect DOM internals in jsdom tests, cast first, e.g. `screen.getByTestId("x") as unknown as SVGSVGElement`, then `querySelector`.
- `noUncheckedIndexedAccess` shapes code: `arr[i]` is `T | undefined` — prefer `?? 0` / explicit `if (v===undefined) return` over `!`; `!` is banned by `no-non-null-assertion`.
- `console.log` calls in `router-hooks.ts` and the test setups are intentional debugging output from early development; remove only if the user asks.
- The `README.md` is the stock vite template readme; this AGENTS.md is the real documentation.
