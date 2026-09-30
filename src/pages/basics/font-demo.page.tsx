import robotoMonoStyles from "#src/style/fonts/roboto_mono/roboto_mono.module.css"
import stixStyles from "#src/style/fonts/stix_two_text/stix_two_text.module.css"
import workSansStyles from "#src/style/fonts/work_sans/work_sans.module.css"

export default function FontDemoPage() {
  return (
    <div style={{ display: "grid", gap: 24, padding: 24 }}>
      <a href="#" style={{ fontSize: 13, opacity: 0.7 }}>
        ← Back to home
      </a>
      <h1>Font Demo — CSS Modules per page</h1>
      <p style={{ opacity: 0.7 }}>
        Each font is a scoped CSS Module with generic <code>.font</code> (file-hashed via CSS Modules). No
        global <code>@font-face</code> pollution. Wrap a section with <code>fontStyles.font</code> (e.g.{" "}
        <code>import workSansStyles from "#src/style/fonts/work_sans/work_sans.module.css"</code> then{" "}
        <code>className={workSansStyles.font}</code>) and all text inherits that family. Three fonts co-exist
        below — Work Sans owns UI text, STIX Two Text owns equations only, Roboto Mono owns live metric
        readouts.
      </p>

      {/* Work Sans — math-viz UI */}
      <div
        className={workSansStyles.font}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}
      >
        <div style={{ padding: 16, background: "#fff", color: "#0f172a" }}>
          <h2>Work Sans — math-viz UI workhorse (variable 100-900)</h2>
          <p style={{ color: "#64748b" }}>
            Wei Huang · OFL free · screen-optimized grotesque · crossbarred I over straight l
          </p>

          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {[12, 16, 24, 36, 48].map((sz) => (
              <div key={sz} style={{ display: "grid", gap: 2 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.08em", opacity: 0.6 }}>{sz}px</span>
                <span style={{ fontSize: sz, lineHeight: 1.25 }}>0O 1lI — 0123456789 — P(2,4) m=4</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <span style={{ fontWeight: 400 }}>400 Regular</span>
            <span style={{ fontWeight: 600 }}>600 Semibold</span>
            <span style={{ fontStyle: "italic" }}>400 Italic</span>
          </div>
        </div>
      </div>

      {/* STIX Two Text — equations only */}
      <div
        className={stixStyles.font}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}
      >
        <div style={{ padding: 16, background: "#fff", color: "#0f172a" }}>
          <h2>STIX Two Text — equations only (Tiro Typeworks)</h2>
          <p style={{ color: "#64748b" }}>
            OFL free · 400-700 + italics · proper ∫ √ ² glyphs — never UI text or ticks
          </p>

          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {[16, 24, 36, 48].map((sz) => (
              <div key={sz} style={{ display: "grid", gap: 2 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.08em", opacity: 0.6 }}>{sz}px</span>
                <span style={{ fontSize: sz, lineHeight: 1.3 }}>y=x² f&apos;(x)=2x ∫x² dx √2</span>
              </div>
            ))}
          </div>

          <p style={{ fontStyle: "italic", marginTop: 12 }}>Italic — math variables live here: P(2,4)</p>
        </div>
      </div>

      {/* Roboto Mono — metrics/HUD */}
      <div
        className={robotoMonoStyles.font}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}
      >
        <div style={{ padding: 16, background: "#0f172a", color: "#f1f5f9" }}>
          <h2>Roboto Mono — metrics/HUD (variable 100-700)</h2>
          <p style={{ color: "#94a3b8" }}>
            Christian Robertson / Google · OFL free · fixed-width digits hold live counters steady
          </p>

          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {[12, 16, 24, 36].map((sz) => (
              <div key={sz} style={{ display: "grid", gap: 2 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.08em", opacity: 0.6 }}>{sz}px</span>
                <span style={{ fontSize: sz, lineHeight: 1.3 }}>X: 2.00 Y: 4.00 — CURSOR: (2,4)</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <span>0O 1lI — 0123456789 — $42,391</span>
          </div>
        </div>
      </div>
    </div>
  )
}
