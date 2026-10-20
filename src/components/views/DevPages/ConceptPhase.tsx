import { PhasePage, Shot } from "./DevPage"
import style from "./DevPages.module.css"
import { concept, progression } from "./phases"

const still = (file: string) => progression(`01-concept/${file}`)

export const ConceptPhase = () => {
  return (
    <PhasePage
      phase={concept}
      lede="I set out to build a demo with many synchronized interactive elements, to demonstrate that I can build UIs that feel fluid and responsive, with no jank. To explore the look, I worked with a UX agent that drove an image model to generate galleries of concept art, and picked these six images, made on 2026-09-30, as the visual direction. Each scheme, light and dark, shows the same three screens: an overview of y = x² with a tangent at P(2, 4), a close-up of that tangent, and a view with shapes and points. The image model drew the plots rather than computing them, so some curves and readouts are wrong; the images set the look, not the math. Click an image for full size."
    >
      <h2 className={style.heading}>Light</h2>
      <div className={style.grid}>
        <Shot
          image={still("01-light-overview.jpg")}
          alt="A light math app with a list of equations beside a graph"
          title="The whole screen"
        >
          White cards on warm paper. A list of equations on the left, and the graph on the right.
        </Shot>
        <Shot
          image={still("02-light-tangent-detail.jpg")}
          alt="A light math app working out a slope step by step beside a zoomed-in graph"
          title="A close-up of one point"
        >
          The steps to find how steep the curve is at one point, next to a zoomed-in graph.
        </Shot>
        <Shot
          image={still("03-light-shapes-points.jpg")}
          alt="A light math app with a curve, a circle and a triangle on a graph"
          title="Shapes and points"
        >
          A curve, a circle and a triangle, each listed in its own color, with a menu across the top.
        </Shot>
      </div>
      <h2 className={style.heading}>Dark</h2>
      <div className={style.grid}>
        <Shot
          image={still("04-dark-overview.jpg")}
          alt="A dark math app in glowing cyan, with panels around a graph"
          title="The whole screen"
        >
          Glowing cyan lines on black, like a control screen in a sci-fi film, with panels for the equation
          and its points.
        </Shot>
        <Shot
          image={still("05-dark-tangent-detail.jpg")}
          alt="A dark math app with a glowing curve and an orange line touching it"
          title="A close-up of one point"
        >
          A glowing curve and an orange line touching it, with the math worked out in large orange text.
        </Shot>
        <Shot
          image={still("06-dark-shapes-points.jpg")}
          alt="A dark math app with switches beside a graph of shapes and points"
          title="Shapes and points"
        >
          Switches to show or hide the grid and the curve, with points drawn as small diamonds.
        </Shot>
      </div>
    </PhasePage>
  )
}
