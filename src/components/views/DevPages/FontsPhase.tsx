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
  why: string
  page: string
}

const Pick = ({ job, name, font, sample, why, page }: PickProps) => {
  return (
    <div className={style.pick}>
      <span className={style.label}>{job}</span>
      <b className={style.caption_title}>{name}</b>
      <div className={style.sample} style={{ fontFamily: font }}>
        {sample}
      </div>
      <p className={style.why}>{why}</p>
      <a href={lab(`lab/fonts/labs/${page}.html`)}>See its test page</a>
    </div>
  )
}

export const FontsPhase = () => {
  return (
    <PhasePage
      phase={fonts}
      lede="Next, the typefaces. A math app is mostly numbers and formulas, so its fonts have to keep look-alikes apart (0 and O; 1, l and I) and hold digits in place as values change. I used an AI agent to build test pages that set each candidate in the app's own strings, such as P(2, 4), y = x², f′(x) = 2x and X: 2.00 Y: 4.00, at sizes from 12 to 72 px. After comparing 15 fonts, I picked three, each with one job."
    >
      <h2 className={style.heading}>The three fonts</h2>
      <div className={style.grid}>
        <Pick
          job="Words and buttons"
          name="Work Sans"
          font="var(--font-sans)"
          sample={
            <>
              Function Viewer · <span style={{ fontWeight: 600 }}>Reset all</span>
            </>
          }
          why="Easy to read on a screen, even small, with clean, calm numbers."
          page="work-sans"
        />
        <Pick
          job="Numbers"
          name="Roboto Mono"
          font="var(--font-mono)"
          sample="X: 2.00 Y: 4.00 · 0O 1lI"
          why="Every digit is the same width, so numbers stay in place while they change."
          page="roboto-mono"
        />
        <Pick
          job="Math"
          name="STIX Two Text"
          font="var(--font-serif)"
          sample={
            <>
              <i>f</i>(<i>x</i>) = 2(<i>x</i> − 2)² + 1
            </>
          }
          why="Made for math, with real symbols like ∫, √ and ². I use it for equations only, never for the numbers along the graph."
          page="stix-two-text"
        />
      </div>
      <h2 className={style.heading}>The test pages</h2>
      <div className={style.grid}>
        <Shot
          image={lab("thumbs/mathviz-numerals.jpg")}
          href={lab("lab/fonts/galleries/mathviz-numerals.html")}
          alt="A page comparing fonts on numbers and formulas"
          title="Numbers and math · 15 fonts"
        >
          The test I picked from. Each font shows the app's own numbers and formulas at six sizes, and a
          slider changes the size.
        </Shot>
        <Shot
          image={lab("thumbs/font-gallery.jpg")}
          href={lab("lab/fonts/gallery.html")}
          alt="A page showing 23 fonts side by side"
          title="All the fonts · 23 fonts"
        >
          A wider mix, from bold headline fonts to fonts for code. You can type your own text into each one.
        </Shot>
        <Shot
          image={lab("thumbs/font-labs-index.jpg")}
          href={lab("lab/fonts/labs/index.html")}
          alt="A list of pages, one per font"
          title="One page per font · 32 pages"
        >
          A closer look at each font. The list links the first 23.
        </Shot>
      </div>
    </PhasePage>
  )
}
