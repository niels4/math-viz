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
    note: "Made to replace Carbon Amber: ice white with a single mint signal colour, in place of a third neon beside Tron Cyan and Midnight Violet.",
  },
]

const labPage = (name: string) =>
  lab(`lab/colors/labs/mathviz-${name.toLowerCase().replaceAll(" ", "-")}.html`)

export const ColorsPhase = () => {
  return (
    <PhasePage
      phase={colors}
      lede="Then the colour themes. The color lab builds each palette as a full set of UI tokens, with a lab page per palette. It started from ten general palettes, then built six MathViz themes in parallel, three light and three dark, each checked for contrast and shown on the same calculus screen. Carbon Amber was dropped and Arctic Ice made to replace it. Last, each theme got 12 ordinal colours for plotting several series at once. The six themes below are the ones the app ships."
    >
      <h2 className={style.heading}>The six themes</h2>
      <p className={style.sub}>
        The same screen in each theme. Click an image for full size; the link goes to the theme's lab page.
      </p>
      <div className={style.grid}>
        {themes.map((theme) => (
          <Shot
            key={theme.name}
            image={lab(`lab/media/galleries/${theme.image}`)}
            alt={`${theme.name} theme`}
            title={
              <>
                {theme.name} <Tag>{theme.scheme}</Tag>
              </>
            }
          >
            {theme.note} <a href={labPage(theme.name)}>Lab page</a>
          </Shot>
        ))}
      </div>
      <h2 className={style.heading}>Retired</h2>
      <div className={style.grid}>
        <Shot
          image={lab("lab/media/galleries/math-viz-v2/06-dark-carbon-amber.png")}
          alt="Carbon Amber theme, retired"
          title={
            <>
              Carbon Amber <Tag>dark · retired</Tag>
            </>
          }
          retired
        >
          Near-black carbon with amber phosphor. Retired by my choice; Arctic Ice took its place.{" "}
          <a href={labPage("Carbon Amber")}>Lab page</a>
        </Shot>
      </div>
      <h2 className={style.heading}>The lab</h2>
      <div className={style.grid}>
        <Shot
          image={lab("thumbs/math-viz-themes.jpg")}
          href={lab("lab/colors/galleries/math-viz.html")}
          alt="MathViz theme labs gallery"
          title="MathViz theme labs · 6 themes"
        >
          Each theme on the same skeleton (sidebar, status strip, minimap, tangent with its slope badge), with
          its background, foreground, primary and accent contrast ratios and links to its lab page and CSS
          module.
        </Shot>
        <Shot
          image={lab("thumbs/math-viz-ordinals.jpg")}
          href={lab("lab/colors/galleries/math-viz-ordinals.html")}
          alt="Ordinal colours gallery"
          title="Ordinal colours · 6 themes × 12"
        >
          Twelve distinct series colours per theme, starting from its primary and accent: deeper hues in the
          light themes, luminous ones in the dark, with lines cycling solid, dashed and dotted.
        </Shot>
        <Shot
          image={lab("thumbs/color-gallery.jpg")}
          href={lab("lab/colors/galleries/gallery.html")}
          alt="Palette gallery of ten palettes"
          title="Palette gallery · 10 palettes"
        >
          The general palettes the lab started from, corporate light to neon noir.{" "}
          <a href={lab("lab/colors/gallery.html")}>An earlier nine-palette version</a>.
        </Shot>
        <Shot
          image={lab("thumbs/color-labs-index.jpg")}
          href={lab("lab/colors/labs/index.html")}
          alt="Index of per-palette lab pages"
          title="Color labs · 17 pages"
        >
          One page per palette: the ten general ones and the seven MathViz themes, Carbon Amber included. The
          index lists the first nine; the theme cards above link the rest of the MathViz ones.
        </Shot>
      </div>
    </PhasePage>
  )
}
