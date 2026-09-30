import defaultStyles from "#src/style/themes/default.module.css"
import fintechStyles from "#src/style/themes/fintech_dashes.module.css"
import neonStyles from "#src/style/themes/neon_noir.module.css"

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
        use <code>styles.bg_background</code> etc inside. Three themes co-exist below — Fintech Dashes is the
        new light multi-series theme (navy/teal/amber) in oklch.
      </p>

      {/* Neon Noir — dark */}
      <div
        className={neonStyles.theme}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}
      >
        <div style={{ padding: 16, background: "var(--background)", color: "var(--foreground)" }}>
          <h2 style={{ color: "var(--primary)" }}>Neon Noir — dark (from time-series 03)</h2>
          <p style={{ color: "var(--foreground-muted)" }}>
            Deep charcoal oklch(0.17 0.028 267) · cyan oklch(0.84 0.14 209) · rose oklch(0.72 0.18 2)
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button className={neonStyles.btn_primary}>Primary</button>
            <button className={neonStyles.btn_secondary}>Secondary</button>
            <span className={neonStyles.badge_accent}>Accent</span>
            <span className={neonStyles.badge_success}>Success</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div className={neonStyles.card} style={{ padding: 12 }}>
              <div style={{ fontWeight: 700 }}>Card</div>
              <div className={neonStyles.text_muted} style={{ fontSize: 12 }}>
                Scoped via .card inside wrapper
              </div>
            </div>
            <input className={neonStyles.input} placeholder="Input" defaultValue="neon_noir input" />
          </div>
          <svg
            viewBox="0 0 320 80"
            width="100%"
            height={80}
            style={{ marginTop: 16, background: "var(--card)", borderRadius: 8 }}
          >
            <line x1={10} y1={60} x2={310} y2={20} className={neonStyles.chart_line} strokeWidth={2} />
            <circle cx={310} cy={20} r={6} className={neonStyles.chart_accent} />
          </svg>
        </div>
      </div>

      {/* Default — light */}
      <div
        className={defaultStyles.theme}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}
      >
        <div style={{ padding: 16, background: "var(--background)", color: "var(--foreground)" }}>
          <h2 style={{ color: "var(--primary)" }}>Default — light (reference template)</h2>
          <p style={{ color: "var(--foreground-muted)" }}>
            White oklch(1 0 0) · slate oklch(0.21 0.04 266) · blue oklch(0.59 0.14 242) · accent oklch(0.61
            0.11 222)
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button className={defaultStyles.btn_primary}>Primary</button>
            <button className={defaultStyles.btn_secondary}>Secondary</button>
            <span className={defaultStyles.badge_accent}>Accent</span>
            <span className={defaultStyles.badge_success}>Success</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div className={defaultStyles.card} style={{ padding: 12 }}>
              <div style={{ fontWeight: 700 }}>Card</div>
              <div className={defaultStyles.text_muted} style={{ fontSize: 12 }}>
                Light reference, same class names _, scoped
              </div>
            </div>
            <input className={defaultStyles.input} placeholder="Input" defaultValue="default input" />
          </div>
        </div>
      </div>

      {/* Fintech Dashes — light multi-series */}
      <div
        className={fintechStyles.theme}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}
      >
        <div style={{ padding: 16, background: "var(--background)", color: "var(--foreground)" }}>
          <h2 style={{ color: "var(--primary)" }}>Fintech Dashes — light (from time-series 10)</h2>
          <p style={{ color: "var(--foreground-muted)" }}>
            White oklch(1 0 0) · navy oklch(0.24 0.06 258) · teal oklch(0.73 0.13 178) · amber oklch(0.77 0.16
            70) — 3 dash styles for Revenue/Profit/Amber
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button className={fintechStyles.btn_primary}>Primary (navy)</button>
            <button className={fintechStyles.btn_secondary}>Secondary</button>
            <span className={fintechStyles.badge_accent}>Accent (teal)</span>
            <span className={fintechStyles.badge_warning}>Amber</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div className={fintechStyles.card} style={{ padding: 12 }}>
              <div style={{ fontWeight: 700 }}>Card — Fintech Dashes</div>
              <div className={fintechStyles.text_muted} style={{ fontSize: 12 }}>
                Light card on muted oklch(0.98 0.003 248), border oklch(0.93 0.013 256) — extrapolated to
                complete 15 roles
              </div>
            </div>
            <input className={fintechStyles.input} placeholder="Input" defaultValue="fintech input" />
          </div>
          <svg
            viewBox="0 0 320 80"
            width="100%"
            height={80}
            style={{ marginTop: 16, background: "var(--card)", borderRadius: 8 }}
          >
            <line x1={10} y1={60} x2={310} y2={20} className={fintechStyles.chart_line} strokeWidth={2} />
            <line
              x1={10}
              y1={45}
              x2={310}
              y2={35}
              className={fintechStyles.chart_accent}
              strokeWidth={2}
              strokeDasharray="8 6"
            />
            <line
              x1={10}
              y1={30}
              x2={310}
              y2={50}
              stroke="var(--warning)"
              strokeWidth={2}
              strokeDasharray="2 4"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
