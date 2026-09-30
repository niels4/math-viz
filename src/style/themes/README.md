# Theme Format Rules — math-viz

Reference implementations: `mathviz_arctic_ice.module.css` (dark futuristic, AAA contrasts) and `mathviz_educational_warm.module.css` (light friendly), plus clean-teal, midnight-violet, sage-editorial, tron-cyan.

## 1. File location and naming

- Path: `src/style/themes/<theme_name>.module.css`
- Filename uses **snake_case**, lowercase, `a-z0-9` + `_` only. Example: `mathviz_arctic_ice.module.css`
- Theme id is the filename without extension: `mathviz_arctic_ice`
- Export wrapper class is always `.theme` — one file = one wrapper class. File name distinguishes themes; CSS Modules hashes `.theme` per file, so no global collision.

## 2. Module, not global

- File **must** be a CSS Module (`.module.css`). Import as `import styles from "#src/style/themes/mathviz_arctic_ice.module.css"` and apply via `className={styles.theme}` on a wrapper div/page.
- Do **not** emit `html {}` or `body {}` selectors. Those are anti-patterns — themes are scoped, not global. The wrapper owns the vars.
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

  /* utilities nested one level deep — see §4 */
}
```

- Variables use **kebab-case** with `--` prefix: `--background`, `--background-muted`, `--primary-foreground`, etc. Keep hyphen for vars (native CSS).
- Required vars: `background`, `background-muted`, `card`, `foreground`, `foreground-muted`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `border`, `accent`, `accent-foreground`, `success`, `warning`, `destructive`, `radius` plus chart tokens `chart-grid`, `chart-line`, `chart-accent`, `chart-glow` and gradients `gradient-primary`, `gradient-accent`, `gradient-muted`, `gradient-glow`, `gradient-text`, `gradient-mesh`.
- Color values are **`oklch(L C H)` or `oklch(L C H / A)`** — perceptually uniform, better for coherent palettes than hex. `L` 0–1, `C` 0–0.4, `H` 0–360. Alpha via slash, e.g. `oklch(0.8442 0.1457 209.29 / 0.4)` for 40%.
- Never use hex `#rrggbb` in theme outputs — always oklch.

## 4. Utilities and components — one level deep, snake_case

- All classes are **nested exactly one level** inside the wrapper. Example:

```css
.theme {
  .bg_background {
    background: var(--background);
  }
  .bg_muted {
    background: var(--background-muted);
  }
  .bg_card {
    background: var(--card);
  }
  .bg_primary {
    background: var(--primary);
    color: var(--primary-foreground);
  }
  .bg_secondary {
    background: var(--secondary);
    color: var(--secondary-foreground);
  }
  .bg_accent {
    background: var(--accent);
    color: var(--accent-foreground);
  }
  .text_foreground {
    color: var(--foreground);
  }
  .text_muted {
    color: var(--foreground-muted);
  }
  .text_primary {
    color: var(--primary);
  }
  .text_accent {
    color: var(--accent);
  }
  .border {
    border-color: var(--border);
  }
  .border_border {
    border-color: var(--border);
  }
  .btn_primary {
    /* ... */
  }
  .btn_secondary {
    /* ... */
  }
  .card {
    /* ... */
  }
  .input {
    /* ... */
  }
  .badge_accent {
    /* ... */
  }
  .badge_success {
    /* ... */
  }
  .badge_warning {
    /* ... */
  }
  .badge_destructive {
    /* ... */
  }
  .chart_grid line,
  .chart_grid path {
    stroke: var(--chart-grid);
  }
  .chart_line {
    stroke: var(--chart-line);
  }
  .chart_accent {
    stroke: var(--chart-accent);
    fill: var(--chart-accent);
  }
}
```

- **Class names use `_` not `-`.** Never `bg-primary`, `text-foreground`, `btn-primary`, `chart-grid`. Always `bg_primary`, `text_foreground`, `btn_primary`, `chart_grid`.
- Keep `.card`, `.input`, `.border` as single-word exceptions (no underscore needed). For disambiguation use `.border_border` for explicit border color.
- No deeper nesting, no combined selectors beyond one level. Chart helpers may combine `line, path` as shown.

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
import styles from "#src/style/themes/mathviz_arctic_ice.module.css"

export default function Page() {
  return (
    <div className={styles.theme}>
      <div className={styles.bg_background}>...</div>
      <button className={styles.btn_primary}>Primary</button>
      <div className={styles.card}>Card</div>
      <svg>
        <path className={styles.chart_line} d="..." />
      </svg>
    </div>
  )
}
```

## 8. Math-viz themes

- The six `mathviz_*` themes are the project set: arctic-ice, tron-cyan, midnight-violet (dark) + clean-teal, educational-warm, sage-editorial (light).
- They follow **all** rules above — wrapper `.theme`, oklch values; use `mathviz_arctic_ice.module.css` as the canonical example when generating new themes via the sommelier `theme-export` tool.

## 9. Tooling

- `theme-export` tool must emit this exact format: `src/style/themes/<slug>.module.css` with wrapper `.theme` containing oklch vars and one-level-deep `_` classes. No global file. File name provides uniqueness via CSS Modules hashing.
- `color-lab` preview should render the same CSS vars (oklch) for live iteration before export.
- `color-gallery` shows swatches in oklch (with hex fallback) and previews in oklch.
