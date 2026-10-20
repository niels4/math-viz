import { PhasePage, Shot } from "./DevPage"
import style from "./DevPages.module.css"
import { concept, progression } from "./phases"

const still = (file: string) => progression(`01-concept/${file}`)

export const ConceptPhase = () => {
  return (
    <PhasePage
      phase={concept}
      lede="The six concept stills the first MathViz designs grew from, made on 2026-09-30. Each scheme, light and dark, shows the same three screens: an overview of y = x² with a tangent at P(2, 4), a close-up of that tangent, and a view with shapes and points. The plots are the image model's drawing, not computed, so some curves and readouts are wrong. Click an image for full size."
    >
      <h2 className={style.heading}>Light</h2>
      <div className={style.grid}>
        <Shot
          image={still("01-light-overview.jpg")}
          alt="Light overview: MathViz with an equations sidebar and a Cartesian plane"
          title="01 Overview"
        >
          White cards on warm paper, indigo and orange. An equations sidebar lists y = x², the tangent and
          points A and B; the plane sits in a card with zoom, grid and settings controls and a legend.
        </Shot>
        <Shot
          image={still("02-light-tangent-detail.jpg")}
          alt="Light tangent detail: the derivative worked step by step beside the plot"
          title="02 Tangent detail"
        >
          The sidebar works the slope step by step (f′(x) = 2x, f′(2) = 4, the tangent's equation); the plot
          marks rise and run with a slope triangle at P.
        </Shot>
        <Shot
          image={still("03-light-shapes-points.jpg")}
          alt="Light shapes and points: parabola, circle and triangle on the plane"
          title="03 Shapes and points"
        >
          A top navigation (Explore, Shapes, Graph, Quiz, Learn); objects listed as cards in their own colours
          (indigo parabola, teal circle, amber triangle) and a readout bar along the bottom.
        </Shot>
      </div>
      <h2 className={style.heading}>Dark</h2>
      <div className={style.grid}>
        <Shot
          image={still("04-dark-overview.jpg")}
          alt="Dark overview: cyan HUD with equations panel and canvas"
          title="04 Overview"
        >
          A cyan HUD on near-black: monospace caps, corner brackets on the canvas, panels for the active
          equation, parameters and points, and a cursor and tangent readout strip.
        </Shot>
        <Shot
          image={still("05-dark-tangent-detail.jpg")}
          alt="Dark tangent detail: glowing curve with a targeting reticle at P"
          title="05 Tangent detail"
        >
          A glowing cyan curve and an amber tangent, with a targeting reticle on P(2, 4) and the derivative
          analysis in large amber type on the left.
        </Shot>
        <Shot
          image={still("06-dark-shapes-points.jpg")}
          alt="Dark shapes and points: controls and layers panel with toggles"
          title="06 Shapes and points"
        >
          A controls and layers panel with toggles for grid, axes and parabola; points as diamonds with
          bracketed labels; measurements and a two-line readout below.
        </Shot>
      </div>
    </PhasePage>
  )
}
