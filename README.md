# math-viz

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules, plus **per-page CSS Module themes** as examples to get started.

## Themes & Fonts — CSS Modules per page (no global pollution, offline)

- Styles live in `src/style/` as siblings: `src/style/themes/` (CSS Module themes) and `src/style/fonts/` (CSS Module fonts with local woff2, no CDN), plus `src/style/global.css`. See `src/style/themes/README.md` and `src/style/fonts/README.md` for full rules (vars, naming, usage, `oxfmt` format, offline woff2).
- Themes: `default.module.css` (neutral light reference), `neon_noir.module.css` (dark futuristic from time-series 03), `fintech_dashes.module.css` (light fintech from time-series 10). Each is a scoped wrapper `.<name>_theme` containing vars + one-level-deep `_` utilities.
- Fonts: `inter` (variable 100-900), `fraunces` (variable opsz/SOFT/WONK), `bebas_neue` (brutalist 400) — each `src/style/fonts/<name>/<name>.module.css` is a scoped wrapper `.<name>` / `.<name>_theme` with local `@font-face` (`./<File>.woff2`, works offline). No `html`/`body`/`:root` globals, no CDN.
- **Import rule (project-level)**: use `#src/style/...` — e.g. `import styles from "#src/style/themes/neon_noir.module.css"`, `import fontStyles from "#src/style/fonts/work_sans/work_sans.module.css"`, `import "#src/style/global.css"`. Nearby/sibling files (e.g. `./_root.page.module.css`) stay relative.
- Demo pages: `src/pages/basics/theme-demo.page.tsx` (`#basics/theme-demo`) shows all three themes co-existing per-section; `src/pages/basics/font-demo.page.tsx` (`#basics/font-demo`) shows all three fonts co-existing. New pages theme via `#src/style/...` imports and a `className={styles.<name>_theme}` wrapper.
- Sommelier workflows: `color-extract` → `color-catalog` → `color-lab` (single-theme lab at `http://localhost:8788/color-lab.html`) → `theme-export` → `src/style/themes/<name>.module.css`; `font-extract` → `font-catalog` → `font-lab` (`http://localhost:8788/font-lab.html`) → `font-export` → `src/style/fonts/<name>/<name>.module.css` (CSS + woff2, offline). Galleries at `http://localhost:8788/color-gallery.html` and `font-gallery.html`.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
