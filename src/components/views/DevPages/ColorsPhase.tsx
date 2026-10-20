import { PhasePage, Shot, Tag } from "./DevPage"
import style from "./DevPages.module.css"
import { colors, progression } from "./phases"

const lab = (path: string) => progression(`03-colors/${path}`)

const themes = [
  { name: "Educational Warm", scheme: "light", image: "math-viz-v2/01-light-educational-warm.png" },
  { name: "Clean Teal", scheme: "light", image: "math-viz-v2/02-light-clean-teal.png" },
  { name: "Sage Editorial", scheme: "light", image: "math-viz-v2/03-light-sage-editorial.png" },
  { name: "Tron Cyan", scheme: "dark", image: "math-viz-v2/04-dark-tron-cyan.png" },
  { name: "Midnight Violet", scheme: "dark", image: "math-viz-v2/05-dark-midnight-violet.png" },
  {
    name: "Arctic Ice",
    scheme: "dark",
    image: "math-viz-v3/01-arctic-ice.png",
    note: "Made to replace Carbon Amber: icy white with one mint green, instead of a third bright neon theme next to Tron Cyan and Midnight Violet.",
  },
]

const labPage = (name: string) =>
  lab(`lab/colors/labs/mathviz-${name.toLowerCase().replaceAll(" ", "-")}.html`)

export const ColorsPhase = () => {
  return (
    <PhasePage
      phase={colors}
      lede="Then the colors. I had AI build complete color themes, with every color the app needs, and check that text stays easy to read on each background. It started from ten general color sets, then made six themes for MathViz, three light and three dark, all shown on the same screen. I dropped one dark theme, Carbon Amber, and had Arctic Ice made to replace it. Last, each theme got 12 extra colors for drawing many lines on one graph. These are the six themes the app uses today."
    >
      <h2 className={style.heading}>The six themes</h2>
      <p className={style.sub}>The same screen in each theme. Click a picture to see it full size.</p>
      <div className={style.grid}>
        {themes.map((theme) => (
          <Shot
            key={theme.name}
            image={lab(`lab/media/galleries/${theme.image}`)}
            alt={`The ${theme.name} theme`}
            title={
              <>
                {theme.name} <Tag>{theme.scheme}</Tag>
              </>
            }
          >
            {theme.note} <a href={labPage(theme.name)}>See its test page</a>
          </Shot>
        ))}
      </div>
      <h2 className={style.heading}>The one I dropped</h2>
      <div className={style.grid}>
        <Shot
          image={lab("lab/media/galleries/math-viz-v2/06-dark-carbon-amber.png")}
          alt="The Carbon Amber theme, which I dropped"
          title={
            <>
              Carbon Amber <Tag>dark · dropped</Tag>
            </>
          }
          retired
        >
          Near-black with amber, like an old computer screen. I dropped it, and Arctic Ice took its place.{" "}
          <a href={labPage("Carbon Amber")}>See its test page</a>
        </Shot>
      </div>
      <h2 className={style.heading}>The test pages</h2>
      <div className={style.grid}>
        <Shot
          image={lab("thumbs/math-viz-themes.jpg")}
          href={lab("lab/colors/galleries/math-viz.html")}
          alt="A page showing the six MathViz themes on the same screen"
          title="The MathViz themes · 6 themes"
        >
          Each theme on the same sample screen, with a score for how easy its text is to read.
        </Shot>
        <Shot
          image={lab("thumbs/math-viz-ordinals.jpg")}
          href={lab("lab/colors/galleries/math-viz-ordinals.html")}
          alt="A page showing 12 line colors for each theme"
          title="Colors for many lines · 6 themes × 12"
        >
          Twelve colors per theme for drawing several lines on one graph, each easy to tell apart: darker in
          the light themes, brighter in the dark ones.
        </Shot>
        <Shot
          image={lab("thumbs/color-gallery.jpg")}
          href={lab("lab/colors/galleries/gallery.html")}
          alt="A page showing ten general color sets"
          title="Where it started · 10 color sets"
        >
          The ten general color sets the themes grew from.{" "}
          <a href={lab("lab/colors/gallery.html")}>An earlier version</a> has nine.
        </Shot>
        <Shot
          image={lab("thumbs/color-labs-index.jpg")}
          href={lab("lab/colors/labs/index.html")}
          alt="A list of pages, one per color set"
          title="One page per color set · 17 pages"
        >
          A closer look at each one: the ten general sets and the seven MathViz themes, including the one I
          dropped. The list links the first nine; the theme cards above link the rest.
        </Shot>
      </div>
    </PhasePage>
  )
}
