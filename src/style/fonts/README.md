# Font Format Rules — viz1

Reference implementations: `inter/inter.module.css` (workhorse sans, variable 100-900), `fraunces/fraunces.module.css` (display serif, variable opsz/SOFT/WONK), `bebas_neue/bebas_neue.module.css` (brutalist display, derived from time-series 08). All use generic wrapper `.font` (file-hashed via CSS Modules, like themes use `.theme`).

## 1. File location and naming

- Path: `src/style/fonts/<collection>/<collection>.module.css`
- Directory name = collection slug, **snake_case**, lowercase, `a-z0-9` + `_` only. Example: `inter`, `fraunces`, `bebas_neue`
- Filename matches directory: `<collection>.module.css` — e.g. `src/style/fonts/inter/inter.module.css`
- Collection id is directory name: `inter`, `fraunces`, `bebas_neue`
- Each directory contains **local `*.woff2` files (e.g. `Inter-Variable.woff2`, `Fraunces-Variable.woff2`, `BebasNeue-Regular.woff2`)**. All font files are **vendored in the repo** — no CDN fetch at runtime, works offline with no internet. No companion `.ts` — CSS + woff2 only.

## 2. Module, not global

- File **must** be a CSS Module (`.module.css`). Import as `import fontStyles from "#src/style/fonts/inter/inter.module.css"` and apply via `className={fontStyles.font}` on a wrapper div/section/page. Wrapper is generic `.font` — file name (`inter.module.css`) provides uniqueness via CSS Modules hashing; no per-font class name needed.
- Do **not** emit `html {}`, `body {}`, `*`, or `:root {}` selectors. Font is scoped — wrapper owns `font-family`.
- **Local `@font-face` at top level is required** — `src: url("./<File>.woff2") format("woff2")` with `font-display: swap`. The woff2 file is vendored alongside the CSS (e.g. `./Inter-Variable.woff2`). Only loads when the module is imported per-page — no global pollution, **no CDN, works offline**. The module is the import gate.
- **No `@import` from `fonts.googleapis.com`** — offline-first. All fonts must be self-hosted woff2. `importUrl` in `font-catalog.json` is metadata only, not used at runtime.

## 3. Wrapper owns font-family — local woff2, no CDN

```css
/* Font: Inter — sans-serif · Rasmus Andersson · weights 100-900 · normal, italic · variable
 * File: ./Inter-Variable.woff2 (woff2, 225KB, OFL) — local, no CDN, works offline
 */
@font-face {
  font-family: "Inter";
  src: url("./Inter-Variable.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

.font {
  font-family:
    "Inter",
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}
```

- One collection = one family. Wrapper class is generic `.font` (hashed per file via CSS Modules, so `inter` and `fraunces` `.font` do not collide). File name (`inter.module.css`) distinguishes fonts.
- All text inside the wrapper inherits `font-family`. No extra utilities needed — font applies to all children.
- **Always local `@font-face`** — woff2 file is vendored in the same directory (e.g. `Fraunces-Variable.woff2`, `BebasNeue-Regular.woff2`). No `@import`.
- Keep `@font-face` at file top, before class block, so `oxfmt` is stable. Build (Vite) will copy the woff2 to `dist/assets` via `url("./…")` — verify `dist/assets/*woff2` exists after `npm run build`.

## 4. Class names — generic wrapper

- Collection slug uses `_` not `-` for directory/file: `bebas_neue`, never `bebas-neue`.
- Wrapper class is always `.font` — generic, file-hashed (like themes use `.theme`). Never `.inter`, `.fraunces`, `.bebas_neue`, `.bebas_neue_theme`.
- No deeper nesting, no `!important`, no global side effects.

## 5. No global side effects — offline

- No `html`, `body`, `*`, `:root`.
- No `!important`.
- **No external `@import` or CDN fetch** — all fonts are local woff2 via `src: url("./…woff2")`. The app works with no internet connection (verified: `npm run build` emits `dist/assets/*.woff2` and no `fonts.googleapis` in CSS).
- No `fetch` to `fonts.googleapis.com` / `fonts.gstatic.com` at runtime.

## 6. Catalog → font mapping — local files

- Source catalog is `workspace/fonts/catalog.json` via `font-catalog` tool: `name`, `family`, `foundry`, `category`, `googleFontsUrl`, `importUrl` (metadata only, not used at runtime), `weights[]`, `styles[]`, `variable`, `professionalism`, `designerFriendly`, `licensing`, `cost`, `tags`, `notes`, `specimen`.
- **Local file** → `@font-face { src: url("./<File>.woff2") }` line. Known mappings: `inter → Inter-Variable.woff2 (100 900)`, `fraunces → Fraunces-Variable.woff2 (100 900)`, `bebas_neue → BebasNeue-Regular.woff2 (400)`, `atkinson_hyperlegible → AtkinsonHyperlegible-*.woff2 (400/700 + italic)` . Future fonts: vendor woff2 alongside CSS and update `font-export` mapping.
- `family` → `font-family: "Family", …` in wrapper (fallback: sans `system-ui, -apple-system…`, serif `ui-serif, Georgia…`, mono `ui-monospace…`).
- Weights/styles inform which axes are available (e.g. `100..900` variable, `[400]` single-weight display). Document in file header comment (`File: ./…woff2 … works offline`).

## 7. Usage in React — per-page, co-existing

```tsx
import interStyles from "#src/style/fonts/inter/inter.module.css"
import frauncesStyles from "#src/style/fonts/fraunces/fraunces.module.css"

export default function Page() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section className={interStyles.font}>
        <h2>Inter — body & UI</h2>
        <p>The quick brown fox — 0123456789 — UI text in Inter.</p>
        <button>Primary CTA</button>
      </section>

      <section className={frauncesStyles.font}>
        <h2 style={{ fontFamily: '"Fraunces", serif' }}>Fraunces — display</h2>
        <p>Soft wonky editorial — pair with Inter for body.</p>
      </section>
    </div>
  )
}
```

- Fonts co-exist per-section, like themes (`default` + `neon_noir` + `fintech_dashes` in `theme-demo`). Import only the fonts you use on that page — tree-shaken per-page.
- Combine with color themes: `<div className={`${colorStyles.theme} ${fontStyles.font}`}>` — color vars + font-family both inherited.

## 8. Default fonts

- `inter` (workhorse sans, variable 100-900, OFL free) and `fraunces` (editorial display, variable opsz/SOFT/WONK) ship with the template as defaults. New projects copy `src/style/fonts/*` as examples (see `create-viz-project` workflow).
- `bebas_neue` (brutalist display, single 400) is derived from `time-series/08-brutalist-editorial.png` as an example of image → font(s) detection via `font-extract` → `font-lab` → `font-export`.

## 9. Tooling — offline

- `font-extract` — point to `gallery="time-series" file="media/galleries/time-series/08-brutalist-editorial.png"` and get heuristic font family spec(s) (Google Fonts URLs, weights, foundry, licensing). Heuristic extrapolates full range. `importUrl` is metadata — runtime is local.
- `font-lab` — builds `workspace/fonts/labs/<slug>.html` centered on ONE font: source image, specimen at 12/16/24/36/48/72px editable, weights/styles grid, pangram/alphabet, UI preview (buttons/card/input rendered in that font), data-viz text (axis/tick/legend SVG in that font). Iteration surface before export — dialogue refine (“make it more condensed”, “add 700 weight”) rebuilds the lab. Lab may use CDN for preview, but exported viz is offline.
- `font-export` — emits `src/style/fonts/<slug>/<slug>.module.css` as scoped wrapper `.font` (generic, file-hashed) with **local `@font-face` (`src: url("./<File>.woff2")`)** + `font-family` and copies vendored woff2 (e.g. `Inter-Variable.woff2`) to viz project. Also writes `workspace/themes/fonts/<slug>/` reference (CSS + woff2 only, no `.ts`). No CDN. Optionally `vizProject: "alpha/viz1"` to copy to viz template. Run `oxfmt` after export — no diff expected. Verify offline: `grep -r fonts.googleapis src/style/fonts` should be empty; `npm run build` should emit `dist/assets/*.woff2`.
- `font-catalog` — `workspace/fonts/catalog.json` is source of truth; `font-gallery` builds `workspace/fonts/galleries/gallery.html` multi-font overview (gallery currently uses CDN for preview — viz remains offline via vendored woff2). No font `.ts` companions — CSS + woff2 is the source of truth.

## 10. Oxfmt + offline verification

- Font CSS follows same `oxfmt` rules as themes: flat `@font-face` then `.font { font-family: … }`, hex not needed, lowercase where applicable. `@font-face` block is 2-space indent for props, like theme vars.
- Run `npm run format` (`oxfmt --write`) after adding a new font — `git diff` on new `*.module.css` should be empty.
- Run `npm run build` — verify `dist/assets/*.woff2` exists (e.g. `Inter-Variable-*.woff2`, `Fraunces-*.woff2`, `BebasNeue-*.woff2`) and `grep -r fonts.googleapis dist` is empty. Open `dist/index.html` with no network (Chrome offline) — fonts still render.
