import { PhasePage } from "./DevPage"
import style from "./DevPages.module.css"
import { development, progression } from "./phases"

const jank = [
  {
    title: "A drag that glided after it stopped",
    text: "Dragging the plane, holding still, then letting go with a 1 pixel twitch still sent the plane gliding. The tests missed it. Now the speed on release comes from the last 80 ms of movement.",
  },
  {
    title: "A highlight that stuck",
    text: "Clicking a flip button left its row lit after the pointer moved away.",
  },
  {
    title: "A plane that panned under a handle",
    text: "Dragging a handle on the curve also panned the plane under it.",
  },
  {
    title: "A readout that changed height",
    text: "The equation grew taller when a horizontal scale stacked a fraction, and pushed the rest of the sidebar down. It now keeps its height.",
  },
  {
    title: "A screen reader that talked over itself",
    text: "Scrubbing a value made a screen reader read out every step. It now reads the equation as plain text and no longer announces each change.",
  },
  {
    title: "A page that opened halfway down",
    text: "Opening a phase from a card low on the contents page kept the scroll position, so the phase opened partway down. It now opens at the top.",
  },
]

export const DevelopmentPhase = () => {
  return (
    <PhasePage
      phase={development}
      lede="The recommended design from phase 5 set what to build. To build it, I split the work with an AI coding agent: I own the architecture and how the app feels in the hand, and the agent does the tedious work of matching the design. That kept the pace of development rapid, and I still understand how every part of the app works, which keeps it bug free and maintainable long term."
    >
      <h2 className={style.heading}>I own the architecture</h2>
      <p className={style.sub}>
        I decide how the project is organized and where each file goes, and I make sure data and state flow
        through the app in a way that is simple to reason about. Each view has its own directory, with its
        components, hooks and tests side by side. A view keeps its state in two places: what you can share or
        bookmark lives in the URL, and the rest lives in a few shared values next to it.
      </p>
      <p className={style.sub}>
        The canvas draws only from React state. An animation sets state on every frame and the plane redraws
        from it, so what you see always comes from one value in one place. When a file grows, I split it: the
        sidebar's sections and the plane's hooks each moved into their own directory as they grew.
      </p>
      <h2 className={style.heading}>The agent matches the design</h2>
      <p className={style.sub}>
        Matching a design by hand is slow, careful work: a padding here, a font weight there, a color that
        differs only in the dark themes. I hand that to the agent. It reads each value straight from the Figma
        file, through the same bridge the UX agent used to draw it, builds the part, and compares screenshots
        of the app with the design in a light and a dark theme. When I decide the app should differ from the
        design, the agent writes down the change and why, so a later session doesn't change it back.
      </p>
      <p className={style.sub}>
        The welcome screen is one example. The agent built it in five sessions, checked it against the
        design's pictures in all six themes, and matched its opening animation to the Figma video frame by
        frame.
      </p>
      <h2 className={style.heading}>I look for jank</h2>
      <p className={style.sub}>
        An LLM judges a UI from screenshots, numbers and test results. It misses what you only feel with a
        mouse in your hand: a glide that shouldn't happen, a highlight that stays on, a layout that jumps. As
        we build, I use every feature myself and look for anything that feels wrong.
      </p>
      <p className={style.sub}>
        Each fix comes with a test that fails without it, and the lesson goes into the agent's instructions.
        Its tests now move the pointer the way a hand does: a 1 pixel twitch after a rest, and flicks that let
        go while still moving. Some of what I found:
      </p>
      <div className={style.grid}>
        {jank.map((item) => (
          <div key={item.title} className={style.pick}>
            <b className={style.caption_title}>{item.title}</b>
            <span className={style.muted}>{item.text}</span>
          </div>
        ))}
      </div>
      <h2 className={style.heading}>Why it works</h2>
      <p className={style.sub}>
        The agent takes the slow, repetitive work, so features land quickly. I still know where every value
        lives and why, because I decided where it goes, and I have used every interaction myself. That keeps a
        rapid pace of development and a deep understanding of how the app works.
      </p>
      <h2 className={style.heading}>Try it</h2>
      <figure className={`${style.feature} ${style.shot}`}>
        <a href="#function-viewer">
          <img
            src={progression("06-development/function-viewer.jpg")}
            alt="The Function Viewer with a transformed parabola and a pinned point"
            loading="lazy"
          />
        </a>
        <figcaption className={style.caption}>
          <b className={style.caption_title}>The Function Viewer</b>
          Pick a function, drag the transforms in the sidebar or the handles on the curve, and move P along
          the curve. <a href="#function-viewer">Open the Function Viewer</a>
        </figcaption>
      </figure>
    </PhasePage>
  )
}
