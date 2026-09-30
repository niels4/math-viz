---
name: style-match
description: Match web app colors and styles to a reference image using python color tools + screenshots. Use when user says "match colors", "match style", "reference image", or wants to replicate a gallery/mockup palette in a viz page.
---

# style-match — reference image to SVG/CSS matching

Consistent workflow to match a reference PNG to the running app. Uses `tools/color-compare` (Pillow),
Playwright screenshot scripts in `.local/playwright/`, and `oklch` theme variables. Deterministic, offline-first: measure, encode,
re-measure. Never tune by eyeballing alone.

## When to use

- User provides a reference image path (often `~/dev/tmp/*.png` or `workspace/media/galleries/...`) and a
  route (e.g. `#svg/time-series1`)
- The component to match is identified (line glow, tooltip marker, gradient, background)
- Goal: pick `oklch` colors + SVG geometry (radii, stroke widths, dash pattern, gradient stops) that survive
  Pillow sampling within a few RGB units

## Tools

### `tools/color-compare` — python Pillow toolkit

```
cd tools/color-compare && uv venv .venv --python 3.12 && source .venv/bin/activate && uv pip install -e ".[dev]"
source tools/color-compare/.venv/bin/activate      # from the project root, before any python call below
python tools/color-compare/src/oklch.py '#FF26B6' 'rgb(254,140,219)' 'oklch(0.65 0.25 0)'
python tools/color-compare/src/sample_marker.py REF SHOT --scale 0.6667 --shot-box x0 y0 x1 y1
python tools/color-compare/src/compare.py          # legacy fixed-point sampler (bg/line/gradient)
./check   # pyright strict + ruff; black --target-version py312 + isort for formatting
```

- `oklch.py`: sRGB <-> OKLCH both ways (Ottosson), flags out-of-gamut, importable (`srgb_to_oklch`,
  `oklch_to_srgb`). Use it to turn measured pixels into `oklch(L C H)` literals and to express derived colors
  as offsets from `--chart-accent` (`dl/dc/dh`).
- `sample_marker.py`: locates a glowing marker in both images (centroid of saturated disc pixels inside a
  search box), prints the median radial RGB profile side by side (shot radius mapped by `--scale`, `<<`
  flags deltas > 25), the drop line's dash/gap runs + stroke coverage width, and writes 6x nearest-neighbour
  crops (`/tmp/ref_marker_crop.png`, `/tmp/shot_marker_crop.png`). Median over angles ignores the chart
  line / drop line / tooltip box crossing the circle; skip sectors are hardcoded for the neon reference.
- Ad-hoc scans are fine too: a horizontal/vertical pixel scan through the center (`im.getpixel`) is the
  fastest way to read ring radius, ring width and transitions. Print `r_ref = dx / scale` next to each px.

### Browser screenshot — Playwright script in `.local/playwright/`

No `agent-browser`: screenshots and DOM reads go through a Playwright `.mjs` script in `.local/playwright/`
(see AGENTS.md Visual Verification), e.g. `.local/playwright/shot.mjs`:

```js
import { chromium } from "playwright";
const port = process.argv[2] ?? "<port>"; // ask the user / lsof for the port
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://localhost:${port}/#svg/time-series1`);
await page.waitForLoadState("load");
await page.waitForTimeout(1000);
await page.screenshot({ path: ".local/playwright/shot.png" });
console.log(await page.evaluate(() =>
  Array.from(document.querySelectorAll("circle")).map((c) => c.getAttribute("r")).join(" ")));
await browser.close();
```

- Screenshots are device pixels; headless default is DPR 1, so 1 viewBox unit = 1 px on the 1000x500 chart.
  Check `devicePixelRatio` via `page.evaluate` before reasoning about pixel counts.
- After a disk edit, `page.reload()` can race Vite's HMR: verify the DOM (`page.evaluate` an attribute) before sampling, or
  sleep 2s and reload again. Identical sample output across two edits means the page did not update.
- Stabilize the fixture first: `src/data/time-series/time-series1.ts` uses a seeded PRNG (mulberry32, seed 189) so point 36 (the tooltip's default `useState`) sits on a local peak like the reference. Change the seed
  or the `useState(points[36])` index when a different spot is needed.

### Theme variables — `src/style/themes/*.module.css`

Per-page CSS Modules with a `.theme` wrapper and `oklch` colors. `neon_noir` is the dark neon theme:
`--chart-accent: oklch(0.674 0.268 346.8)` = #FF26B6 (the reference's disc pink, measured). Derive the other
marker colors from it with relative color syntax / `color-mix` (see `LineMouseHander.tsx`) so a theme swap
recolors coherently. Keep the `.theme` wrapper, use `oklch` not hex, run `oxfmt`.

## Workflow

1. **Locate** reference + route + component. Note the reference-to-viewBox scale: compare chart area widths
   or line core thickness (neon reference chart ~1386 px wide vs 900 viewBox units -> `REF_SCALE = 2/3`).
2. **Measure the reference** before touching code: center, radial profile (disc color and gradient, ring
   radius/width/whiteness, glow color and alpha falloff per radius), drop line color, width, dash/gap period,
   stem length. Read the far background too (glow alpha = (R - R_bg) / (R_glow - R_bg)).
3. **Encode the measurements as data** in the component (`GLOW_PROFILE` gradient stops, `DISC_PROFILE`,
   `RING_RADIUS = 12.7 * REF_SCALE`, ...) with the reference px in comments. Colors: `oklch.py` -> literal
   `oklch()` or offsets from `--chart-accent`.
4. **Re-capture and re-sample** with `sample_marker.py`; loop on the deltas. Also build a same-physical-scale
   composite (crop both around the marker, resize to the same size, paste side by side) and `read` it: the
   numbers catch color/alpha, the composite catches thickness and "hotness" the eye sees.
5. **Verify**: `npx oxfmt --write <files>`, `npm test` (oxlint + tsc + vitest), `tools/color-compare/check`.
6. **Persist**: measured values live in code comments, workflow facts here and in AGENTS.md.

## What the neon reference marker is (measured, ref px on 1536x1024)

- Disc r 0-11.5: #FF26B6 core brightening to ~#FF5FCF at the ring (inner glow of the ring).
- White ring centered r=12.7, 2.6-2.9 px wide, #FFF3FF (pink-tinted white), crisp.
- Glow: fully opaque #F31283 out to r=16 (right outside the ring), then alpha 0.89 @18, 0.75 @20, 0.51 @25,
  0.40 @28, 0.31 @32, 0.185 @40, 0.13 @45, 0.07 @55, 0.03 @65, 0 @72 — an exponential-ish tail, not a
  gaussian. Encode as `<radialGradient>` stops (deterministic, resolution independent); `feGaussianBlur` cannot
  produce this tail without stacking several blurs.
- Glow is additive light: the cyan line core turns white where it enters the halo and the stem stays its own
  color. `mix-blend-mode: screen` on the glow circle reproduces that; normal blending covers the line pink.
  Side effect: the chart line's own cyan glow shows through as +G/+B under the halo — expected, the reference
  has no cyan glow near its marker because its line ends there.
- Drop line: solid 15 px stem attached to the ring, 2.4 px gap, then dash 6.9 / gap 2.4. Width 2.9 px: a
  saturated accent tube with a light core (#FF8EDC = accent + 48% white), drawn as two strokes.

## Gotchas

- Sub-pixel placement decides what a thin stroke looks like at DPR 1: a 1.5 px core centered at x=789.15
  gives one ~100% pixel and one 65% pixel; the reference (2 full px) only matches after widening the core
  to 2.3 ref px. Compare pixel rows, not just widths.
- Pillow `getpixel` is typed `float | tuple | None`: `assert isinstance(p, tuple)` before indexing, and keep
  pyright strict green (`./check`).
- `pip install -e` rewrites the tracked `color_compare.egg-info/*` files; harmless, commit or discard.
- Reference PNG is sRGB 1536x1024; always locate the component by scanning for its color, never by fixed
  relative coordinates (`compare.py`'s `0.5,0.48` mixes chart and background).
- SVG gradient stops with `var()` / relative colors need `style={{ stopColor }}` (see AGENTS.md gotcha).
- Chrome resolves `oklch(from var(--x) calc(l - 0.046) ...)` and `color-mix()` in SVG `style` fine; verify
  with `getComputedStyle(el).stroke` via `page.evaluate` when in doubt.
