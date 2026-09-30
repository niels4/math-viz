---
name: r3f-viz-stack
description: R3F + Drei + Visx-math + GSAP stack for data visualizations. Use when building animated charts, wedge/radial geometry, 3D chart panels, or any page that mixes declarative TSX with JS-driven animation. Covers role split, install, wedge geometry, R3F/GSAP integration, and performance rules.
---

# R3F + Drei + Visx-math + GSAP — stack roles and patterns

Four libraries, four jobs. Do not let them overlap.

| Library                                    | Job              | Owns                                                                                                     |
| ------------------------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------- |
| d3 math (`d3-scale`/`d3-shape`/`d3-array`) | Data to geometry | Scales, curve factories, ticks, extents. Numbers only, never touches DOM.                                |
| React TSX                                  | Declaration      | Scene and mesh skeleton, one mesh per wedge, initial props from data.                                    |
| GSAP (`gsap` + `@gsap/react`)              | Motion over time | Tweens numbers on its own ticker, writes DOM/attributes directly.                                        |
| R3F + Drei                                 | 3D rendering     | `<Canvas>` scenes, camera controls, labels, instancing. Only for panels where depth encodes information. |

## Install

Installed exact per template convention (`--save-exact`):

```bash
npm install --save-exact gsap @gsap/react @react-three/fiber @react-three/drei d3-scale d3-shape d3-array
npm install --save-dev --save-exact @types/d3-scale @types/d3-shape @types/d3-array
```

This is the project's rendering stack — there is no other 3D track. Raw `three`
arrives only as an R3F peer; never import it directly. New R3F pages live under
`src/pages/r3f/`, one page per route, and must run `npm run generate` after adding.

## Core rule — React owns what exists, GSAP owns how it moves

- TSX declares initial state. GSAP tweens after mount via `useGSAP` with `scope`
  set to the panel ref, so `.wedge` selectors never leak across panels.
- Never `setState` per frame. Tween a plain object and write attributes via ref
  (`setAttribute`, direct property). Per-frame renders destroy the 60fps goal.
- GSAP bypasses the reconciler by design: one RAF ticker, batched reads/writes,
  cleanup via `gsap.context()` on unmount.
- `useFrame` is R3F's per-frame hook for continuous motion (spin, float, damping).
  GSAP is for authored motion (entrances, timelines, dataset transitions). Compose:
  GSAP tweens a proxy object, `useFrame` reads it.

## Wedge geometry (radial panels)

Wedges are defined by `{startAngle, endAngle, innerR, outerR}`. Angles follow the
project convention (turns, CCW positive — see AGENTS.md Visualization Conventions).

1. **Animate the four numbers, not rendered output.** Tween
   `{startAngle, endAngle, innerR, outerR}` with GSAP, rebuild the sector geometry
   each tick (ring-sector mesh, extruded shape, or instanced params), and write via
   ref. Never interpolate rendered strings or attributes.
2. **One mesh per wedge.** Shared geometry across wedges couples color, radii,
   transitions, and hit-testing. Independent panels want independent meshes; share
   materials where possible.

## Rebuild patterns (visx-gallery training, verified on area-3d/axis-3d/bargroup-3d)

- **Module-level scale configs.** Build every d3 scale and derived target table
  (`Record<Kind, { ticks, bars }>`) at module scope from seeded data. Keeps
  components free of `useMemo` (which trips
  `react(preserve-manual-memoization)` when scales are constructed inside) and
  makes dataset switches pure retargeting.
- **Dataset morph = one tween, function targets, shared layout.**
  `gsap.to(proxies, { h: (i: number) => targets[i] ?? fallback, ...,
onUpdate: layout })` where `layout` rewrites all ref-held geometry from the
  proxies. Annotate the index param (`(i: number)`), it infers as implicit
  `any` otherwise. Never read refs during render (lint `react(refs)`); snapshot
  anything render needs (e.g. hover height) into state at event time.
- **Area ribbons without importing three.** Displace `planeGeometry` vertices via
  ref: front/back curtains are XY planes with top-row `setY(h)` / bottom-row
  `setY(0)`; the top surface is an XZ-rotated plane (`rotation=[-PI/2,0,0]`)
  with `setZ(h)` per column (local z maps to world y). Plane vertex order is
  row-major, top row first: indices `0..N-1` top, `N..2N-1` bottom. Call
  `computeVertexNormals()` after each rewrite. `getAttribute("position")` is a
  union type, so wrap it in a small `{ setY, setZ, needsUpdate }` facade instead
  of asserting.
- **drei Instances absorbs GSAP writes.** Parent re-uploads child matrices every
  frame (`frames = Infinity` default), so tween child `position`/`scale` via
  refs and never touch the `InstancedMesh` directly. Set
  `frustumCulled={false}` or spread-out instances vanish at some angles.
  Per-instance color comes from the child's `color` prop with a plain shared
  material. `Instance` ref types as `unknown`: assign with the repo-standard
  `as`-plus-disable-comment. One shared unit `boxGeometry`, 600 bars = one
  draw call.
- **Fixed pools + `visible`, never remount.** When tick counts differ across
  configs (log 8 vs band 12), render the max pool once and flip declarative
  `visible` per slot; GSAP only retargets positions.
- **Hover readout = `onPointerMove` + drei `Html`.** Raycast gives `e.point`;
  map x to the nearest index, `setHover` only on index change (event-driven,
  not per-frame). Marker + `Html` label follow the surface during orbit.
- **drei `Text` costs a runtime font fetch** (troika resolves + downloads SDF
  fonts over the network) and holds a `blob:` worker request open forever, so
  `networkidle` never fires on Text pages (see AGENTS.md Visual Verification
  `CAPTURE_UNTIL`). Prefer boxes/ticks for structure, reserve `Text` for real
  labels.
- **Lint shapes the code.** Named `import { gsap }` (`import/no-named-as-default`);
  `scaleOrdinal` callbacks take the domain literal union, not `string`;
  `timeScale.ticks()` already returns `Date[]` (no assertion); lazy `useState`
  initializers instead of `useRef(expensive())` (`react(refs)`).

## d3 math with R3F/Drei/GSAP

- d3 math modules (`d3-scale`, `d3-shape`, `d3-array`) are dimension-agnostic:
  domain-to-range mapping feeds x/y/z mesh positions, heights, colors; curve
  factories sample into point arrays via a collecting context. Numbers only, no DOM.
- No d3 DOM packages (`d3-selection`, `d3-transition`, `d3-axis`, `d3-zoom`, ...) and
  no visx: anything emitting SVG `d` strings or elements is wrong output for 3D
  geometry. Angle math (pie-style splits, arc spans) is hand-rolled from scale
  outputs and fractions — numbers in, numbers out.
- Drei helpers for 3D chart panels: `OrbitControls`/`MapControls`,
  `Text`/`Text3D`/`Html`/`Billboard` labels, `Line` variants for axes,
  `Instances` for bars (instancing covers thousands of elements), `Grid`/`Bounds`.
- No mature Visx-equivalent exists for 3D charts; build the narrow chart needed
  from scales + instanced meshes. Live data: update buffers in place, never full
  redraws.

## Performance ladder

1. Loops/hovers: CSS. 2. Scoped panel motion: GSAP + `useGSAP` per panel.
2. Continuous 3D: `useFrame`. Avoid spring-physics animation across large grids
   and many simultaneous springs at dashboard scale. Keep `transform`/`opacity`
   (or small uniform writes) in the hot path.

## Project wiring reminders

- Pages: `src/pages/**/*.page.tsx` default export becomes a route; regenerate,
  add TOC link in `_root.page.tsx`. Project imports via `#src/`, nearby via relative.
- Strictness: `noUncheckedIndexedAccess` (guard `arr[i]`), `verbatimModuleSyntax`
  (`import type`), no enums, no `any`. Format with `oxfmt`, verify with `npm test`
  (oxlint + `tsc --noEmit` + vitest jsdom).
