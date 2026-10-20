import { CtaLink, PhasePage, Shot, Tag } from "./DevPage"
import style from "./DevPages.module.css"
import { figma, figmaPage, progression } from "./phases"

const art = (path: string) => progression(`05-figma/${path}`)

const recommended = [
  {
    image: "r1-first-visit.png",
    alt: "A tour card beside the graph, reading: This is a function",
    title: "The first visit",
    text: "The curve draws itself, then a three-step tour starts. Each step moves on when you do the thing it describes.",
  },
  {
    image: "r2-pointer.png",
    alt: "A parabola with two labeled points, P pinned and Q under the pointer",
    title: "Pointing at the curve",
    text: "Q follows the pointer, with dashed lines to both axes. P stays where you pin it. Each point has its own name, shape and color, in the panel and on the plane.",
  },
  {
    image: "r3-transforms-set.png",
    alt: "A transformed parabola beside a dashed copy of the original",
    title: "Transforms set",
    text: "a, h and k are changed and b is still at its default. A dashed copy of the original curve shows what changed.",
  },
  {
    image: "r5-dragging-k.png",
    alt: "The k ruler lit up, and an arrow on the plane showing the curve moving up",
    title: "Dragging k",
    text: "The k ruler, its letter and its terms in the equation light up together, and the plane draws the shift. P keeps its x and moves up by exactly k.",
  },
  {
    image: "r7-explaining-a.png",
    alt: "A popover explaining the vertical scale, with a small before and after graph",
    title: "Explaining a",
    text: "Resting on the a chip opens its explainer: one sentence, a before and after picture, its place in the equation, and the gestures.",
  },
  {
    image: "r9-720p-dock.png",
    alt: "A wide graph with the controls in a row underneath",
    title: "A smaller window",
    text: "Below 860 pixels of window height, the panel becomes a dock under a full-width plane, in the same order: function, transform, points.",
  },
]

const rounds = [
  {
    image: "fv01-scrubbing-h.png",
    alt: "The first full design, with the h ruler being dragged",
    title: "First full design",
    tag: "FV 01",
    text: "The page as one instrument: pick a function, transform it, read the points. Dragging the h ruler lights its letter, its term in the equation and its move on the plane.",
  },
  {
    image: "fv02-explaining-h.png",
    alt: "An explainer for the horizontal shift beside the panel",
    title: "Help that teaches the math",
    tag: "FV 02",
    text: "An explainer for each transform, a first-visit hint, and equation terms that name themselves when you point at them.",
  },
  {
    image: "fv03-equation.png",
    alt: "A large equation across the top with a ruler open under one of its numbers",
    title: "The equation as the control",
    tag: "FV 03 · variation",
    text: "No side panel. You drag each number in the equation itself, and a ruler opens under it.",
  },
  {
    image: "fv04-dragging-a.png",
    alt: "A box drawn on the curve while the a ruler is dragged",
    title: "Everything in sync",
    tag: "FV 04",
    text: "Dragging a draws the step that a measures on the curve, and a ghost of P shows where it moved from.",
  },
  {
    image: "fv09-recipe.png",
    alt: "A panel of four steps, each with a small graph, beside the main graph",
    title: "Build f from g",
    tag: "FV 09 · variation",
    text: "The panel becomes a recipe of four moves in the order they act on the curve, each with a small before and after plane.",
  },
  {
    image: "fv11-anchor.png",
    alt: "A diamond handle on the curve being dragged, with h and k marked on the axes",
    title: "Shape it on the plane",
    tag: "FV 11 · variation",
    text: "Handles on the curve itself. Drag the diamond to move the curve, and h and k follow.",
  },
]

const boards = [
  {
    name: "choices",
    alt: "Three page layouts side by side, one marked recommended",
    title: "The choices behind the first design",
    text: "Each real design choice, drawn with its options side by side and the one the agent recommends, with the reason.",
  },
  {
    name: "six-themes",
    alt: "The Function Viewer in three dark and three light themes",
    title: "All six themes",
    text: "The same screen in every theme, to check that each color still works.",
  },
  {
    name: "components",
    alt: "A sheet of controls, readouts and markers in all their states",
    title: "Every part, every state",
    text: "Each component the design uses, in all its states, with the code file it changes.",
  },
  {
    name: "motion",
    alt: "Strips of frames showing a curve springing back, and a timing table",
    title: "Motion, frame by frame",
    text: "Frames computed from the animation timings, and a table of every event: what moves, for how long, and with which easing.",
  },
  {
    name: "specs",
    alt: "A table mapping each part of the screen to the code it changes",
    title: "The handoff",
    text: "Each part of the screen, the code it lives in today, and what changes.",
  },
  {
    name: "decisions",
    alt: "A table of 24 decisions with a recommendation for each",
    title: "Every decision in one place",
    text: "The 24 calls the agent flagged for me during the run, each with its recommendation.",
  },
]

export const FigmaPhase = () => {
  return (
    <PhasePage
      phase={figma}
      lede="The prototype from phase 4 worked, but it had no UX design yet. I gave it and the concept art from phase 1 to a UX agent that designs in Figma, and asked it to rework the Function Viewer from the ground up so a first-time visitor understands it without help. In one run of a few hours, the agent built 13 rounds of designs, then merged the ideas worth keeping into one recommended design with the specs to build it."
    >
      <h2 className={style.heading}>Why Figma</h2>
      <p className={style.sub}>
        Figma works much better than a markdown file or unit tests for visual specs and for checking a design.
        A markdown file describes a screen in words, and unit tests check numbers. In Figma the agent draws
        every state of the screen side by side, in all six themes, so I can check a design at a glance and
        point at what is wrong.
      </p>
      <p className={style.sub}>
        It also lets us try many design ideas quickly, before committing any of them to code. The agent built
        13 rounds with no code to write, review or throw away, and the recommended design takes the best parts
        of each.
      </p>
      <h2 className={style.heading}>How the agent works in Figma</h2>
      <p className={style.sub}>
        I run a plugin in the Figma file that connects to a small server on my machine. The agent sends it
        programs that use Figma's plugin API to build frames, components and variables. Every color in the
        file is a variable named after the app's CSS variable, and every text layer uses one of the three
        fonts, so the same design can be shown in any of the six themes. After each round the agent exports
        pictures of its boards, judges them against a written checklist, and runs an audit that finds any
        color not tied to a variable.
      </p>
      <h2 className={style.heading}>The recommended design</h2>
      <p className={style.sub}>
        The ideas worth keeping from all 13 rounds, merged into one design. Click a picture to see it full
        size.
      </p>
      <div className={style.grid}>
        {recommended.map((shot) => (
          <Shot key={shot.image} image={art(`recommended/${shot.image}`)} alt={shot.alt} title={shot.title}>
            {shot.text}
          </Shot>
        ))}
      </div>
      <h2 className={style.heading}>Thirteen rounds of ideas</h2>
      <p className={style.sub}>
        Each round has its own boards on the same Figma page. Some rounds improve the first design; the
        variations try a different answer to the same screen. Nothing was overwritten, so every round is still
        in the file.
      </p>
      <div className={style.grid}>
        {rounds.map((shot) => (
          <Shot
            key={shot.image}
            image={art(`rounds/${shot.image}`)}
            alt={shot.alt}
            title={
              <>
                {shot.title} <Tag>{shot.tag}</Tag>
              </>
            }
          >
            {shot.text}
          </Shot>
        ))}
      </div>
      <h2 className={style.heading}>Visual specs</h2>
      <p className={style.sub}>
        These boards hold what a markdown file can only describe: every state drawn, every theme checked, and
        motion timed frame by frame. The agent makes them so a developer can build from them without asking
        questions. Click a picture to see the whole board.
      </p>
      <div className={style.grid}>
        {boards.map((board) => (
          <Shot
            key={board.name}
            image={art(`thumbs/${board.name}.jpg`)}
            href={art(`boards/${board.name}.png`)}
            alt={board.alt}
            title={board.title}
          >
            {board.text}
          </Shot>
        ))}
      </div>
      <h2 className={style.heading}>See it in Figma</h2>
      <figure className={`${style.feature} ${style.shot}`}>
        <a href={figmaPage} target="_blank" rel="noreferrer">
          <img
            src={art("thumbs/index.jpg")}
            alt="The index board of the Function Viewer v2 page in Figma"
            loading="lazy"
          />
        </a>
        <figcaption className={style.caption}>
          <b className={style.caption_title}>Function Viewer v2</b>
          The whole Figma page. Start with the first column, the recommended design. Each round then has its
          own column, oldest on the left.
          <CtaLink phase={figma} href={figmaPage}>
            Open Function Viewer v2 in Figma
          </CtaLink>
        </figcaption>
      </figure>
    </PhasePage>
  )
}
