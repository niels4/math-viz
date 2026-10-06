# math-viz

Interactive math visualizations for the browser, built with React, TypeScript and Vite.

**Live:** https://niels4.github.io/math-viz/

## Demos

- **Function Viewer** (`#demos/function-viewer`): pick a base function (x, x², x³, sin x) and transform it as a·f((x − h)/b) + k with rulers, handles on the curve or draggable equation terms. Pin a point P, probe a second point Q with the pointer, and read both as `f(x) = y`. Six themes, full keyboard support, reduced motion respected.

## Dev pages

Developer-facing pages under `#dev/...`: the theme and font demos, the component library, the bare Cartesian plane, and Function Viewer Alpha, the first prototype of the Function Viewer, kept as a record.

## Run it

```bash
npm install
npm run dev                # Vite dev server
npm test                   # lint, typecheck and unit tests (jsdom)
npm run test:run:browser   # the same tests in headless Chromium
npm run build              # typecheck, then build into docs/
```

## Deploy

GitHub Pages serves the committed `docs/` folder of `main`. Run `npm run build` and commit `docs/` together with the change it builds.

## Stack

- Vite 8, React 19 with the React Compiler, TypeScript 7
- Canvas 2D for the Cartesian plane and GSAP for motion; R3F and d3 are set up for 3D panels and scales
- Six themes as CSS Modules with oklch colours, and self-hosted fonts (Work Sans, STIX Two Text, Roboto Mono), so the app works offline
- oxlint, oxfmt, and Vitest in jsdom and Chromium

## Layout

| Path                    | What                                                      |
| ----------------------- | --------------------------------------------------------- |
| `src/pages/`            | file-system routes with hash routing: `demos/` and `dev/` |
| `src/components/views/` | views such as the Function Viewer and the Cartesian plane |
| `src/components/ui/`    | shared UI components                                      |
| `src/style/`            | themes, fonts and global CSS                              |
| `docs/`                 | the built site for GitHub Pages (generated)               |

Project conventions for contributors and coding agents are in `AGENTS.md`.

## License

MIT, see `LICENSE`.
