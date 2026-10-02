# Theme Format Rules — math-viz

Reference implementations: `mathviz_arctic_ice.module.css` (dark futuristic, AAA contrasts) and `mathviz_educational_warm.module.css` (light friendly), plus clean-teal, midnight-violet, sage-editorial, tron-cyan.

## 1. File location and naming

- Path: `src/style/themes/<theme_name>.module.css`
- Filename uses **snake_case**, lowercase, `a-z0-9` + `_` only. Example: `mathviz_arctic_ice.module.css`
- Theme id is the filename without extension: `mathviz_arctic_ice`
- Export wrapper class is always `.theme` — one file = one wrapper class. File name distinguishes themes; CSS Modules hashes `.theme` per file, so no global collision.

## 2. Module, not global

- File **must** be a CSS Module (`.module.css`). Each page applies one theme class at its root element (e.g. `import arcticTheme from "#src/style/themes/mathviz_arctic_ice.module.css"` then `<div className={arcticTheme.theme}>`) which sets the vars; component CSS below consumes them via `var(--*)`.
- Do **not** emit `html {}` or `body {}` selectors. Those are anti-patterns — themes are scoped, not global. The page root owns the vars.
- Do **not** emit `:root {}`. Vars live inside the wrapper class so multiple themes can coexist.

## 3. Wrapper class owns all vars — in oklch

```css
.theme {
  --background: oklch(0.1706 0.0284 267.36);
  --background-muted: oklch(0.2101 0.0318 264.66);
  --card: oklch(0.2212 0.0411 266.55);
  --foreground: oklch(0.9288 0.0126 255.51);
  --foreground-muted: oklch(0.7107 0.0351 256.79);
  --primary: oklch(0.8442 0.1457 209.29);
  --primary-foreground: oklch(0.1656 0.0242 268.41);
  --secondary: oklch(0.2795 0.0368 260.03);
  --secondary-foreground: oklch(0.9288 0.0126 255.51);
  --border: oklch(0.3489 0.0712 259.52);
  --accent: oklch(0.7234 0.1854 1.78);
  --accent-foreground: oklch(0.1656 0.0242 268.41);
  --success: oklch(0.7227 0.192 149.58);
  --warning: oklch(0.8606 0.1731 91.94);
  --destructive: oklch(0.7106 0.1661 22.22);
  --radius: 0.6rem;
  --chart-grid: oklch(0.3489 0.0712 259.52);
  --chart-line: oklch(0.8442 0.1457 209.29);
  --chart-accent: oklch(0.7234 0.1854 1.78);
  --chart-glow: oklch(0.8442 0.1457 209.29 / 0.4);

  /* vars only — component CSS consumes these via var(--*) */
}
```

- Variables use **kebab-case** with `--` prefix: `--background`, `--background-muted`, `--primary-foreground`, etc. Keep hyphen for vars (native CSS).
- Required vars: `background`, `background-muted`, `card`, `foreground`, `foreground-muted`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `border`, `accent`, `accent-foreground`, `success`, `warning`, `destructive`, `radius` plus chart tokens `chart-grid`, `chart-line`, `chart-accent`, `chart-glow` and gradients `gradient-primary`, `gradient-accent`, `gradient-muted`, `gradient-glow`, `gradient-text`, `gradient-mesh`.
- Color values are **`oklch(L C H)` or `oklch(L C H / A)`** — perceptually uniform, better for coherent palettes than hex. `L` 0–1, `C` 0–0.4, `H` 0–360. Alpha via slash, e.g. `oklch(0.8442 0.1457 209.29 / 0.4)` for 40%.
- Never use hex `#rrggbb` in theme outputs — always oklch.

## 4. No utility or component classes — vars only

- The `.theme` block contains **only var declarations**. No nested classes of any kind: no `bg_*` / `text_*` / `border` utilities, no `btn_*` / `card` / `input` / `badge_*` components, no `chart_*` / `gradient_*` helpers.
- Component styles live in the component's own CSS Module and consume the vars (e.g. `Badge.module.css` uses `var(--accent)` / `var(--success)`; `Button.module.css` uses `var(--primary)`; page CSS uses `var(--background)`). The theme never knows its consumers.
- **Class names use `_` not `-`** for component CSS (e.g. `btn_primary`, `badge_accent`). Never `bg-primary`, `text-foreground`.

## 5. No global side effects

- No `html`, `body`, `*`, `:root`, or tag selectors.
- No `!important`.
- No external `@import`.

## 6. Palette to theme mapping

- Source palette is 15 roles from `color-catalog.json` (stored as hex but exported as oklch): `background`, `backgroundMuted`, `card`, `foreground`, `foregroundMuted`, `primary`, `primaryForeground`, `secondary`, `secondaryForeground`, `border`, `accent`, `accentForeground`, `success`, `warning`, `destructive`.
- Map directly to vars: `background` → `--background`, `backgroundMuted` → `--background-muted`, `primaryForeground` → `--primary-foreground`, etc., converting each hex to oklch via `hexToOklchString`.
- Compute contrast beforehand; accent should be ≥4.5:1 against its foreground (use dark foreground for light accents as needed).

## 7. Usage in React

```tsx
import arcticTheme from "#src/style/themes/mathviz_arctic_ice.module.css"

export default function Page() {
  return (
    <div className={arcticTheme.theme}>
      {/* component CSS consumes var(--background), var(--primary), etc */}
      <div className={cardStyles.card}>Card</div>
      <svg>
        <path className={chartStyles.chart_line} d="..." />
      </svg>
    </div>
  )
}
```

Do not pass theme classes down as props (`cardClass`, `primaryClass`, `toneClass`, `inputClass`). Components style themselves from the vars.

## 8. Math-viz themes

- The six `mathviz_*` themes are the project set: arctic-ice, tron-cyan, midnight-violet (dark) + clean-teal, educational-warm, sage-editorial (light).
- They follow **all** rules above — wrapper `.theme`, oklch values; use `mathviz_arctic_ice.module.css` as the canonical example when generating new themes via the sommelier `theme-export` tool.

## 9. Tooling

- `theme-export` tool must emit this exact format: `src/style/themes/<slug>.module.css` with wrapper `.theme` containing oklch vars only — no nested classes. No global file. File name provides uniqueness via CSS Modules hashing.
- `color-lab` preview should render the same CSS vars (oklch) for live iteration before export.
- `color-gallery` shows swatches in oklch (with hex fallback) and previews in oklch.
