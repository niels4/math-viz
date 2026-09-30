import arcticStyles from "#src/style/themes/mathviz_arctic_ice.module.css"
import cleanTealStyles from "#src/style/themes/mathviz_clean_teal.module.css"
import educationalStyles from "#src/style/themes/mathviz_educational_warm.module.css"
import midnightStyles from "#src/style/themes/mathviz_midnight_violet.module.css"
import sageStyles from "#src/style/themes/mathviz_sage_editorial.module.css"
import tronStyles from "#src/style/themes/mathviz_tron_cyan.module.css"

export default function ThemeDemoPage() {
  return (
    <div style={{ display: "grid", gap: 24, padding: 24 }}>
      <a href="#" style={{ fontSize: 13, opacity: 0.7 }}>
        ← Back to home
      </a>
      <h1>Theme Demo — CSS Modules per page</h1>
      <p style={{ opacity: 0.7 }}>
        Each theme is a scoped CSS Module with <code>oklch()</code> colors. No global html/body pollution.
        Wrap a section with <code>styles.theme</code> (file name gives uniqueness via CSS Modules hashing) and
        use <code>styles.bg_background</code> etc inside. Six MathViz themes co-exist below — three dark
        (arctic-ice, tron-cyan, midnight-violet) and three light (clean-teal, educational-warm,
        sage-editorial).
      </p>

      {/* MathViz Arctic Ice — dark futuristic */}
      <div
        className={arcticStyles.theme}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}
      >
        <div style={{ padding: 16, background: "var(--background)", color: "var(--foreground)" }}>
          <h2 style={{ color: "var(--primary)" }}>MathViz Arctic Ice — dark futuristic</h2>
          <p style={{ color: "var(--foreground-muted)" }}>
            Achromatic ice precision + single mint signal · bg×fg 18.06:1 AAA
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button className={arcticStyles.btn_primary}>Primary</button>
            <button className={arcticStyles.btn_secondary}>Secondary</button>
            <span className={arcticStyles.badge_accent}>Accent</span>
            <span className={arcticStyles.badge_success}>Success</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div className={arcticStyles.card} style={{ padding: 12 }}>
              <div style={{ fontWeight: 700 }}>Card</div>
              <div className={arcticStyles.text_muted} style={{ fontSize: 12 }}>
                Dark dashboard shell, mint chart line
              </div>
            </div>
            <input className={arcticStyles.input} placeholder="Input" defaultValue="arctic input" />
          </div>
          <svg
            viewBox="0 0 320 80"
            width="100%"
            height={80}
            style={{ marginTop: 16, background: "var(--card)", borderRadius: 8 }}
          >
            <line x1={10} y1={60} x2={310} y2={20} className={arcticStyles.chart_line} strokeWidth={2} />
            <circle cx={310} cy={20} r={6} className={arcticStyles.chart_accent} />
          </svg>
        </div>
      </div>

      {/* MathViz Tron Cyan — dark energy */}
      <div
        className={tronStyles.theme}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}
      >
        <div style={{ padding: 16, background: "var(--background)", color: "var(--foreground)" }}>
          <h2 style={{ color: "var(--primary)" }}>MathViz Tron Cyan — dark energy</h2>
          <p style={{ color: "var(--foreground-muted)" }}>
            Tron-lineage neon cyan on near-black void · glow chart accents
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button className={tronStyles.btn_primary}>Primary</button>
            <button className={tronStyles.btn_secondary}>Secondary</button>
            <span className={tronStyles.badge_accent}>Accent</span>
            <span className={tronStyles.badge_success}>Success</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div className={tronStyles.card} style={{ padding: 12 }}>
              <div style={{ fontWeight: 700 }}>Card</div>
              <div className={tronStyles.text_muted} style={{ fontSize: 12 }}>
                High-voltage dark shell for live canvases
              </div>
            </div>
            <input className={tronStyles.input} placeholder="Input" defaultValue="tron input" />
          </div>
          <svg
            viewBox="0 0 320 80"
            width="100%"
            height={80}
            style={{ marginTop: 16, background: "var(--card)", borderRadius: 8 }}
          >
            <line x1={10} y1={60} x2={310} y2={20} className={tronStyles.chart_line} strokeWidth={2} />
            <circle cx={310} cy={20} r={6} className={tronStyles.chart_accent} />
          </svg>
        </div>
      </div>

      {/* MathViz Midnight Violet — dark depth */}
      <div
        className={midnightStyles.theme}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}
      >
        <div style={{ padding: 16, background: "var(--background)", color: "var(--foreground)" }}>
          <h2 style={{ color: "var(--primary)" }}>MathViz Midnight Violet — dark depth</h2>
          <p style={{ color: "var(--foreground-muted)" }}>
            Violet-depth dark shell · primary just under 4.5, large-use accents
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button className={midnightStyles.btn_primary}>Primary</button>
            <button className={midnightStyles.btn_secondary}>Secondary</button>
            <span className={midnightStyles.badge_accent}>Accent</span>
            <span className={midnightStyles.badge_success}>Success</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div className={midnightStyles.card} style={{ padding: 12 }}>
              <div style={{ fontWeight: 700 }}>Card</div>
              <div className={midnightStyles.text_muted} style={{ fontSize: 12 }}>
                Violet primary line, warm supporting accents
              </div>
            </div>
            <input className={midnightStyles.input} placeholder="Input" defaultValue="violet input" />
          </div>
          <svg
            viewBox="0 0 320 80"
            width="100%"
            height={80}
            style={{ marginTop: 16, background: "var(--card)", borderRadius: 8 }}
          >
            <line x1={10} y1={60} x2={310} y2={20} className={midnightStyles.chart_line} strokeWidth={2} />
            <circle cx={310} cy={20} r={6} className={midnightStyles.chart_accent} />
          </svg>
        </div>
      </div>

      {/* MathViz Clean Teal — light education */}
      <div
        className={cleanTealStyles.theme}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}
      >
        <div style={{ padding: 16, background: "var(--background)", color: "var(--foreground)" }}>
          <h2 style={{ color: "var(--primary)" }}>MathViz Clean Teal — light education</h2>
          <p style={{ color: "var(--foreground-muted)" }}>
            Chips + layer toggles on clean paper · teal signal, navy ink
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button className={cleanTealStyles.btn_primary}>Primary</button>
            <button className={cleanTealStyles.btn_secondary}>Secondary</button>
            <span className={cleanTealStyles.badge_accent}>Accent</span>
            <span className={cleanTealStyles.badge_success}>Success</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div className={cleanTealStyles.card} style={{ padding: 12 }}>
              <div style={{ fontWeight: 700 }}>Card</div>
              <div className={cleanTealStyles.text_muted} style={{ fontSize: 12 }}>
                Light classroom shell, teal chart line
              </div>
            </div>
            <input className={cleanTealStyles.input} placeholder="Input" defaultValue="teal input" />
          </div>
          <svg
            viewBox="0 0 320 80"
            width="100%"
            height={80}
            style={{ marginTop: 16, background: "var(--card)", borderRadius: 8 }}
          >
            <line x1={10} y1={60} x2={310} y2={20} className={cleanTealStyles.chart_line} strokeWidth={2} />
            <circle cx={310} cy={20} r={6} className={cleanTealStyles.chart_accent} />
          </svg>
        </div>
      </div>

      {/* MathViz Educational Warm — light friendly */}
      <div
        className={educationalStyles.theme}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}
      >
        <div style={{ padding: 16, background: "var(--background)", color: "var(--foreground)" }}>
          <h2 style={{ color: "var(--primary)" }}>MathViz Educational Warm — light friendly</h2>
          <p style={{ color: "var(--foreground-muted)" }}>
            Warm paper educator voice · indigo parabola, coral tangent
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button className={educationalStyles.btn_primary}>Primary</button>
            <button className={educationalStyles.btn_secondary}>Secondary</button>
            <span className={educationalStyles.badge_accent}>Accent</span>
            <span className={educationalStyles.badge_success}>Success</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div className={educationalStyles.card} style={{ padding: 12 }}>
              <div style={{ fontWeight: 700 }}>Card</div>
              <div className={educationalStyles.text_muted} style={{ fontSize: 12 }}>
                Friendly warm shell for lesson pages
              </div>
            </div>
            <input className={educationalStyles.input} placeholder="Input" defaultValue="warm input" />
          </div>
          <svg
            viewBox="0 0 320 80"
            width="100%"
            height={80}
            style={{ marginTop: 16, background: "var(--card)", borderRadius: 8 }}
          >
            <line x1={10} y1={60} x2={310} y2={20} className={educationalStyles.chart_line} strokeWidth={2} />
            <circle cx={310} cy={20} r={6} className={educationalStyles.chart_accent} />
          </svg>
        </div>
      </div>

      {/* MathViz Sage Editorial — light serif */}
      <div
        className={sageStyles.theme}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}
      >
        <div style={{ padding: 16, background: "var(--background)", color: "var(--foreground)" }}>
          <h2 style={{ color: "var(--primary)" }}>MathViz Sage Editorial — light serif</h2>
          <p style={{ color: "var(--foreground-muted)" }}>
            Muted-by-design sage · serif function labels, calm cards
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button className={sageStyles.btn_primary}>Primary</button>
            <button className={sageStyles.btn_secondary}>Secondary</button>
            <span className={sageStyles.badge_accent}>Accent</span>
            <span className={sageStyles.badge_success}>Success</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div className={sageStyles.card} style={{ padding: 12 }}>
              <div style={{ fontWeight: 700 }}>Card</div>
              <div className={sageStyles.text_muted} style={{ fontSize: 12 }}>
                Editorial calm for reading-heavy pages
              </div>
            </div>
            <input className={sageStyles.input} placeholder="Input" defaultValue="sage input" />
          </div>
          <svg
            viewBox="0 0 320 80"
            width="100%"
            height={80}
            style={{ marginTop: 16, background: "var(--card)", borderRadius: 8 }}
          >
            <line x1={10} y1={60} x2={310} y2={20} className={sageStyles.chart_line} strokeWidth={2} />
            <circle cx={310} cy={20} r={6} className={sageStyles.chart_accent} />
          </svg>
        </div>
      </div>
    </div>
  )
}
