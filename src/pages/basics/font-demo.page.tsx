import atkinsonStyles from "#src/style/fonts/atkinson_hyperlegible/atkinson_hyperlegible.module.css"
import bebasStyles from "#src/style/fonts/bebas_neue/bebas_neue.module.css"
import frauncesStyles from "#src/style/fonts/fraunces/fraunces.module.css"
import interStyles from "#src/style/fonts/inter/inter.module.css"
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
        <code>import interStyles from "#src/style/fonts/inter/inter.module.css"</code> then{" "}
        <code>className={interStyles.font}</code>) and all text inherits that family. Seven fonts co-exist
        below — Inter is the workhorse, Fraunces is editorial display, Bebas Neue is brutalist headline (from
        time-series 08), Atkinson Hyperlegible is the low-vision legible numbers font (distinct 0/O, 1/l/I).
        Math-viz roles: Work Sans owns UI text, STIX Two Text owns equations only, Roboto Mono owns live
        metric readouts.
      </p>

      {/* Inter — workhorse */}
      <div
        className={interStyles.font}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}
      >
        <div style={{ padding: 16, background: "#fff", color: "#0f172a" }}>
          <h2>Inter — workhorse sans (variable 100-900)</h2>
          <p style={{ color: "#64748b" }}>Rasmus Andersson · OFL free · 9 weights + italic · #inter</p>

          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {[12, 16, 24, 36, 48, 72].map((sz) => (
              <div key={sz} style={{ display: "grid", gap: 2 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.08em", opacity: 0.6 }}>{sz}px</span>
                <span style={{ fontSize: sz, lineHeight: 1.25 }}>
                  Aa Bb Cc — The quick brown fox 0123456789
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <span style={{ fontWeight: 100 }}>100 Thin</span>
            <span style={{ fontWeight: 400 }}>400</span>
            <span style={{ fontWeight: 700 }}>700 Bold</span>
            <span style={{ fontWeight: 900 }}>900 Black</span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <button
              style={{
                background: "#0284c7",
                color: "#fff",
                border: "1px solid #0284c7",
                borderRadius: 6,
                padding: "0.45rem 0.9rem",
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              Primary (Inter)
            </button>
            <input
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                padding: "0.45rem 0.7rem",
                fontFamily: "inherit",
              }}
              placeholder="Input inherits Inter"
              defaultValue="Inter input — 0123456789"
            />
            <span
              style={{
                background: "#0891b2",
                color: "#fff",
                borderRadius: 999,
                padding: "0.15rem 0.5rem",
                fontSize: 12,
              }}
            >
              Badge
            </span>
          </div>

          <svg
            viewBox="0 0 320 80"
            width="100%"
            height={80}
            style={{ marginTop: 16, background: "#f8fafc", borderRadius: 8 }}
          >
            <text x={12} y={24} fontSize={10} fill="#64748b" fontFamily="inherit">
              Axis — Jan · Jun · Dec — in Inter 10px
            </text>
            <line x1={10} y1={40} x2={310} y2={20} stroke="#0284c7" strokeWidth={2} />
            <circle cx={310} cy={20} r={6} fill="#0891b2" />
            <text x={10} y={70} fontSize={8} fill="#0f172a" fontFamily="inherit">
              $42,391 — tabular numerals 0123456789
            </text>
          </svg>
        </div>
      </div>

      {/* Fraunces — editorial */}
      <div
        className={frauncesStyles.font}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}
      >
        <div style={{ padding: 16, background: "#fff", color: "#0f172a" }}>
          <h2>Fraunces — editorial display (variable opsz/SOFT/WONK)</h2>
          <p style={{ color: "#64748b" }}>Pangram Pangram / Underware · OFL free · soft & wonky axes</p>

          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {[16, 24, 36, 48].map((sz) => (
              <div key={sz} style={{ display: "grid", gap: 2 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.08em", opacity: 0.6 }}>{sz}px — Fraunces</span>
                <span style={{ fontSize: sz, lineHeight: 1.2 }}>
                  Elegant display serif — 0123456789 — Soft
                </span>
              </div>
            ))}
          </div>

          <p style={{ fontStyle: "italic", marginTop: 12 }}>
            Italic — Fraunces supports italic at every weight, perfect for pull-quotes.
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button
              style={{
                background: "#0f172a",
                color: "#fff",
                border: "1px solid #0f172a",
                borderRadius: 6,
                padding: "0.45rem 0.9rem",
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              Fraunces CTA
            </button>
            <span
              style={{
                border: "1px solid #e2e8f0",
                background: "#fff",
                borderRadius: 999,
                padding: "0.15rem 0.5rem",
                fontSize: 12,
                fontFamily: "inherit",
              }}
            >
              Soft badge
            </span>
          </div>
        </div>
      </div>

      {/* Atkinson Hyperlegible — legible numbers */}
      <div
        className={atkinsonStyles.font}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}
      >
        <div style={{ padding: 16, background: "#fff", color: "#0f172a" }}>
          <h2>Atkinson Hyperlegible — legible numbers (Braille Institute)</h2>
          <p style={{ color: "#64748b" }}>
            Braille Institute / Applied Design Works · OFL free · 400/700 + italics · distinct 0/O, 1/l/I ·
            low-vision optimized
          </p>

          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {[12, 16, 24, 36, 48, 72].map((sz) => (
              <div key={sz} style={{ display: "grid", gap: 2 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.08em", opacity: 0.6 }}>{sz}px</span>
                <span style={{ fontSize: sz, lineHeight: 1.25 }}>0O 1lI — 0123456789 — $42,391</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <span style={{ fontWeight: 400 }}>400 Regular</span>
            <span style={{ fontWeight: 700 }}>700 Bold</span>
            <span style={{ fontStyle: "italic" }}>400 Italic</span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <button
              style={{
                background: "#0f172a",
                color: "#fff",
                border: "1px solid #0f172a",
                borderRadius: 6,
                padding: "0.45rem 0.9rem",
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              Atkinson CTA — $42,391
            </button>
            <input
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                padding: "0.45rem 0.7rem",
                fontFamily: "inherit",
              }}
              placeholder="Input inherits Atkinson"
              defaultValue="Atkinson input — 0O 1lI 42,391"
            />
          </div>

          <svg
            viewBox="0 0 320 80"
            width="100%"
            height={80}
            style={{ marginTop: 16, background: "#f8fafc", borderRadius: 8 }}
          >
            <text x={12} y={24} fontSize={10} fill="#64748b" fontFamily="inherit">
              Axis — 0O vs O — 1lI — in Atkinson 10px
            </text>
            <line x1={10} y1={40} x2={310} y2={20} stroke="#0f172a" strokeWidth={2} />
            <circle cx={310} cy={20} r={6} fill="#0284c7" />
            <text x={10} y={70} fontSize={8} fill="#0f172a" fontFamily="inherit">
              $42,391 — unambiguous numerals 0O 1lI 0123456789
            </text>
          </svg>
        </div>
      </div>

      {/* Bebas Neue — brutalist */}
      <div
        className={bebasStyles.font}
        style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}
      >
        <div style={{ padding: 16, background: "#fff", color: "#0f172a" }}>
          <h2>BEBAS NEUE — BRUTALIST HEADLINE (FROM 08)</h2>
          <p style={{ color: "#64748b", fontSize: 12, letterSpacing: "0.04em" }}>
            Dharma Type · OFL free · single weight 400 · ALLCAPS CONDENSED · pair with Inter for body
          </p>

          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {[16, 24, 36, 72].map((sz) => (
              <div key={sz} style={{ display: "grid", gap: 2 }}>
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    opacity: 0.6,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {sz}px — Bebas Neue (all-caps)
                </span>
                <span style={{ fontSize: sz, lineHeight: 1, letterSpacing: "0.02em" }}>
                  HUGE AXIS 0123456789 — BRUTALIST
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <span
              style={{ fontSize: 11, letterSpacing: "0.08em", opacity: 0.7, fontFamily: "Inter, sans-serif" }}
            >
              Pair with mono for numerals:
            </span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>$42,391 · tabular</span>
          </div>

          <svg
            viewBox="0 0 320 80"
            width="100%"
            height={80}
            style={{ marginTop: 16, background: "#0f172a", borderRadius: 8 }}
          >
            <text x={12} y={24} fontSize={14} fill="#fff" letterSpacing="0.04em" fontFamily="inherit">
              REVENUE — BRUTALIST TICKS
            </text>
            <line x1={10} y1={40} x2={310} y2={32} stroke="#FF3B30" strokeWidth={6} />
            <text x={10} y={70} fontSize={10} fill="#94a3b8" fontFamily="Inter, sans-serif">
              Jan · Jun · Dec — ticks in Inter, headline in Bebas
            </text>
          </svg>
        </div>
      </div>

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
