import arcticTheme from "#src/style/themes/mathviz_arctic_ice.module.css"
import tealTheme from "#src/style/themes/mathviz_clean_teal.module.css"
import warmTheme from "#src/style/themes/mathviz_educational_warm.module.css"
import violetTheme from "#src/style/themes/mathviz_midnight_violet.module.css"
import sageTheme from "#src/style/themes/mathviz_sage_editorial.module.css"
import tronTheme from "#src/style/themes/mathviz_tron_cyan.module.css"

import demo from "./theme-demo.page.module.css"

const SECTIONS = [
  {
    theme: arcticTheme.theme,
    title: "MathViz Arctic Ice — dark futuristic",
    desc: "Achromatic ice precision + single mint signal · bg×fg 18.06:1 AAA",
    cardNote: "Dark dashboard shell, mint chart line",
    inputValue: "arctic input",
  },
  {
    theme: tronTheme.theme,
    title: "MathViz Tron Cyan — dark energy",
    desc: "Tron-lineage neon cyan on near-black void · glow chart accents",
    cardNote: "High-voltage dark shell for live canvases",
    inputValue: "tron input",
  },
  {
    theme: violetTheme.theme,
    title: "MathViz Midnight Violet — dark depth",
    desc: "Violet-depth dark shell · warm supporting accents",
    cardNote: "Violet primary line, warm supporting accents",
    inputValue: "violet input",
  },
  {
    theme: tealTheme.theme,
    title: "MathViz Clean Teal — light education",
    desc: "Chips + layer toggles on clean paper · teal signal, navy ink",
    cardNote: "Light classroom shell, teal chart line",
    inputValue: "teal input",
  },
  {
    theme: warmTheme.theme,
    title: "MathViz Educational Warm — light friendly",
    desc: "Warm paper educator voice · indigo parabola, coral tangent",
    cardNote: "Friendly warm shell for lesson pages",
    inputValue: "warm input",
  },
  {
    theme: sageTheme.theme,
    title: "MathViz Sage Editorial — light serif",
    desc: "Muted-by-design sage · serif function labels, calm cards",
    cardNote: "Editorial calm for reading-heavy pages",
    inputValue: "sage input",
  },
] as const

export default function ThemeDemoPage() {
  return (
    <div style={{ display: "grid", gap: 24, padding: 24 }}>
      <a href="#" style={{ fontSize: 13, opacity: 0.7 }}>
        ← Back to home
      </a>
      <h1>Theme Demo — CSS Modules per page</h1>
      <p style={{ opacity: 0.7 }}>
        Each theme is a scoped CSS Module that provides <code>var(--*)</code> tokens in <code>oklch()</code>.
        No global html/body pollution. Each section below applies one theme class at its root (which sets the
        vars) and component styles consume the vars. Six MathViz themes co-exist below — three dark
        (arctic-ice, tron-cyan, midnight-violet) and three light (clean-teal, educational-warm,
        sage-editorial).
      </p>

      {SECTIONS.map((section) => (
        <div key={section.title} className={`${section.theme} ${demo.section}`}>
          <div className={demo.body}>
            <h2 className={demo.title}>{section.title}</h2>
            <p className={demo.muted}>{section.desc}</p>
            <div className={demo.row}>
              <button className={demo.btn_primary}>Primary</button>
              <button className={demo.btn_secondary}>Secondary</button>
              <span className={demo.badge_accent}>Accent</span>
              <span className={demo.badge_success}>Success</span>
            </div>
            <div className={demo.grid}>
              <div className={demo.card}>
                <div style={{ fontWeight: 700 }}>Card</div>
                <div className={demo.card_muted}>{section.cardNote}</div>
              </div>
              <input className={demo.input} placeholder="Input" defaultValue={section.inputValue} />
            </div>
            <svg viewBox="0 0 320 80" width="100%" height={80} className={demo.chart}>
              <line x1={10} y1={60} x2={310} y2={20} className={demo.chart_line} strokeWidth={2} />
              <circle cx={310} cy={20} r={6} className={demo.chart_accent} />
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
}
