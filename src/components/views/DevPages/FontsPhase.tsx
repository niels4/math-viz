import type { ReactNode } from "react"

import { PhasePage, Shot } from "./DevPage"
import style from "./DevPages.module.css"
import { fonts, progression } from "./phases"

const lab = (path: string) => progression(`02-fonts/${path}`)

type PickProps = {
  job: string
  name: string
  font: string
  sample: ReactNode
  quote: string
  page: string
}

const Pick = ({ job, name, font, sample, quote, page }: PickProps) => {
  return (
    <div className={style.pick}>
      <span className={style.label}>{job}</span>
      <b className={style.caption_title}>{name}</b>
      <div className={style.sample} style={{ fontFamily: font }}>
        {sample}
      </div>
      <blockquote className={style.quote}>“{quote}”</blockquote>
      <a href={lab(`lab/fonts/labs/${page}.html`)}>Lab page</a>
    </div>
  )
}

export const FontsPhase = () => {
  return (
    <PhasePage
      phase={fonts}
      lede="After the concept art came the typefaces. The font lab sets each candidate in live, editable specimens. Its MathViz gallery tests 15 of them on the app's own strings: P(2,4), m = 4, y = x², f′(x) = 2x, ∫x² dx and X: 2.00 Y: 4.00, the look-alikes 0O and 1lI, and digits that hold their place on a live counter, at sizes from 12 to 72 px. Three fonts came out of it, one job each, and the app uses them today."
    >
      <h2 className={style.heading}>The picks</h2>
      <div className={style.grid}>
        <Pick
          job="UI"
          name="Work Sans"
          font="var(--font-sans)"
          sample={
            <>
              Function Viewer · <span style={{ fontWeight: 600 }}>Reset all</span>
            </>
          }
          quote="Optimized for on-screen body at card/table sizes; clean low-contrast editorial numerals."
          page="work-sans"
        />
        <Pick
          job="Numbers and readouts"
          name="Roboto Mono"
          font="var(--font-mono)"
          sample="X: 2.00 Y: 4.00 · 0O 1lI"
          quote="Hero-metric mono: fixed-width digits hold position on live counters (X: 2.00 Y: 4.00, CURSOR: (2,4))."
          page="roboto-mono"
        />
        <Pick
          job="Maths only"
          name="STIX Two Text"
          font="var(--font-serif)"
          sample={
            <>
              <i>f</i>(<i>x</i>) = 2(<i>x</i> − 2)² + 1
            </>
          }
          quote="Equations face: proper ∫ √ ² ¹ ³ glyphs drawn by type designers (not scaled-down 2). Use ONLY for y=x², f'(x)=2x, ∫x² dx panel — never axis ticks."
          page="stix-two-text"
        />
      </div>
      <h2 className={style.heading}>The lab</h2>
      <div className={style.grid}>
        <Shot
          image={lab("thumbs/mathviz-numerals.jpg")}
          href={lab("lab/fonts/galleries/mathviz-numerals.html")}
          alt="Numerals and maths legibility gallery"
          title="Numerals and maths legibility · 15 fonts"
        >
          The MathViz test: nine sans, five monos and one serif, each with the app's strings at six sizes,
          colour and background chips, and a size slider.
        </Shot>
        <Shot
          image={lab("thumbs/font-gallery.jpg")}
          href={lab("lab/fonts/gallery.html")}
          alt="Font gallery of 23 fonts"
          title="Font gallery · 23 fonts"
        >
          The general catalogue, display faces to monos, with editable specimens and shared text, size and
          colour controls.
        </Shot>
        <Shot
          image={lab("thumbs/font-labs-index.jpg")}
          href={lab("lab/fonts/labs/index.html")}
          alt="Index of per-font lab pages"
          title="Font labs · 32 pages"
        >
          One page per font. The index lists the first 23.
        </Shot>
      </div>
    </PhasePage>
  )
}
