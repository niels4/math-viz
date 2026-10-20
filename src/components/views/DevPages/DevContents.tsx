import { ArrowRightIcon } from "#src/components/icons/icons.tsx"

import { CtaLink, DevPage } from "./DevPage"
import style from "./DevPages.module.css"
import heroPlane from "./hero_plane.png"
import { phaseColour, phases } from "./phases"

export const DevContents = () => {
  return (
    <DevPage subtitle="Contents">
      <header className={style.hero}>
        <div className={style.intro}>
          <h1 className={style.title}>How I built MathViz</h1>
          <p className={style.lede}>
            I built MathViz by combining my prototyping skills with AI tools to accelerate both design and
            development. These pages walk through each phase, from the first concept art to the deployed
            application.
          </p>
        </div>
        <img className={style.hero_image} src={heroPlane} alt="" width={512} height={236} />
      </header>
      <ol className={style.sections}>
        {phases.map((phase, i) => (
          <li key={phase.route} className={style.section} style={phaseColour(phase)}>
            <div className={style.section_heading}>
              <span className={style.number} aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h2 className={style.section_title}>{phase.name}</h2>
                <p className={style.muted}>{phase.story}</p>
                {phase.cta !== undefined && (
                  <CtaLink phase={phase} href={phase.cta.href}>
                    {phase.cta.label}
                  </CtaLink>
                )}
              </div>
            </div>
            <a href={`#${phase.route}`} className={style.card}>
              <img className={style.card_image} src={phase.card.image} alt="" />
              <span className={style.card_text}>
                <span className={style.card_title}>
                  {phase.card.title}
                  <ArrowRightIcon />
                </span>
                <span className={style.card_body}>{phase.card.text}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </DevPage>
  )
}
