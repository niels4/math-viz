import { CtaLink, PhasePage } from "./DevPage"
import style from "./DevPages.module.css"
import { progression, rust, rustApp, rustRepo } from "./phases"

const stack = [
  { library: "SDL3", text: "The window, input, GPU context and main loop." },
  { library: "Clay", text: "Layout." },
  { library: "NanoVG", text: "Vector drawing." },
  { library: "kb_text_shape", text: "Text shaping." },
  { library: "Emscripten", text: "The web build." },
]

export const RustPhase = () => {
  return (
    <PhasePage
      phase={rust}
      lede="The obligatory AI port to Rust. I had been building native apps in Odin, with Clay for layout and SDL3 for the window, input and GPU, and liked how little stood between the code and the screen. Rust seems to be the popular language for automated app building, so I combined the two: the same native stack, written in Rust by AI agents. One codebase builds a native app for macOS, Windows and Linux and a WebAssembly app for the browser."
    >
      <h2 className={style.heading}>The stack</h2>
      <p className={style.sub}>
        The C libraries are vendored and wrapped in thin Rust bindings. Everything above them is plain Rust.
      </p>
      <div className={style.grid}>
        {stack.map((item) => (
          <div key={item.library} className={style.pick}>
            <b className={style.caption_title}>{item.library}</b>
            <span className={style.muted}>{item.text}</span>
          </div>
        ))}
      </div>
      <h2 className={style.heading}>Built in the original's order</h2>
      <p className={style.sub}>
        The original is a React app that grew commit by commit. Rather than hand the agents a spec, a driver
        agent read the original's git history, cut it into milestones and built the port in the same order, so
        the Rust app passed through the same states the original did. Porters ported the pure modules test for
        test, coders wired each milestone into the running app, and three reviewers checked each one.
      </p>
      <h2 className={style.heading}>The original as the oracle</h2>
      <p className={style.sub}>
        One script drives the original, the web build and the native build to the same state in three browser
        engines and compares the screenshots pixel for pixel. The original's unit tests were ported one for
        one, so the Rust could change shape but never behavior.
      </p>
      <p className={style.sub}>
        The Function Viewer reached parity with the original in under nine hours, and the welcome screen
        followed the same morning: about 230 commits, 600 unit tests and 190 scripted states. I answered a
        handful of questions and merged to main when I wanted to deploy.
      </p>
      <h2 className={style.heading}>Try it</h2>
      <figure className={`${style.feature} ${style.shot}`}>
        <a href={`${rustApp}#function-viewer`} target="_blank" rel="noreferrer">
          <img
            src={progression("07-rust/function-viewer.jpg")}
            alt="The Rust Function Viewer with a stretched parabola, its handles and the P marker"
            loading="lazy"
          />
        </a>
        <figcaption className={style.caption}>
          <b className={style.caption_title}>math-viz-rust</b>
          The web build of the Rust app, compiled to WebAssembly.{" "}
          <a href={rustApp} target="_blank" rel="noreferrer">
            Open the live app
          </a>
          <CtaLink phase={rust} href={rustRepo}>
            Open math-viz-rust on GitHub
          </CtaLink>
        </figcaption>
      </figure>
    </PhasePage>
  )
}
