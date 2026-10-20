import { PhasePage, Shot } from "./DevPage"
import style from "./DevPages.module.css"
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
      <div className={style.feature}>
        <Shot
          image={prototype.card.image}
          href="#dev/function-viewer-alpha"
          alt="The first prototype: controls on the left and a graph of a curve on the right"
          title="The first prototype"
        >
          Pick a function, then scrub the strips in the sidebar to scale and offset it. Drag the plane to pan,
          scroll to zoom, and hover to place a second point.{" "}
          <a href="#dev/function-viewer-alpha">Open the prototype</a>
        </Shot>
      </div>
    </PhasePage>
  )
}
