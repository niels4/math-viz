import { PhasePage } from "./DevPage"
import style from "./DevPages.module.css"
import { FunctionViewerAlpha } from "./FunctionViewerAlpha/FunctionViewerAlpha"
import { prototype } from "./phases"

export const PrototypePhase = () => {
  return (
    <PhasePage
      phase={prototype}
      lede="Phase 4 started with AI tooling that automatically built out everything I needed to get started: a Vite app with the latest dependencies, my fonts converted to the right format and loaded, and CSS variables generated for each of my color themes."
    >
      <h2 className={style.heading}>Why a prototype</h2>
      <p className={style.sub}>
        I used that project to prototype behavior that is difficult to describe in a markdown file but fast
        and easy to build in React: how a value responds as you scrub it, how the plane pans and zooms, how a
        point tracks the cursor.
      </p>
      <h2 className={style.heading}>Where it went next</h2>
      <p className={style.sub}>
        This prototype, combined with the concept art from phase 1, is what I fed to the UX agent that drove
        Figma in phase 5.
      </p>
      <h2 className={style.heading}>Try it</h2>
      <figure className={`${style.feature} ${style.shot}`}>
        <div className={style.prototype}>
          <FunctionViewerAlpha />
        </div>
        <figcaption className={style.caption}>
          <b className={style.caption_title}>The first prototype</b>
          Pick a function, then scrub the strips in the sidebar to scale and offset it. Drag the plane to pan,
          scroll to zoom, and hover to place a second point.
        </figcaption>
      </figure>
    </PhasePage>
  )
}
