import type { ReactNode } from "react"

import { TopBar } from "../TopBar/TopBar"
import style from "./DevPages.module.css"
import { phaseColour, phases, type Phase } from "./phases"

export const DevPage = ({ subtitle, children }: { subtitle: string; children: ReactNode }) => {
  return (
    <div className={style.page}>
      <TopBar title="Developer pages" subtitle={subtitle} href="#dev" />
      <main className={style.content}>{children}</main>
    </div>
  )
}

type PhasePageProps = {
  phase: Phase
  lede: ReactNode
  children: ReactNode
}

export const PhasePage = ({ phase, lede, children }: PhasePageProps) => {
  const index = phases.indexOf(phase)
  const previous = phases[index - 1]
  const next = phases[index + 1]
  const label = (p: Phase) => `Phase ${phases.indexOf(p) + 1} · ${p.name}`

  return (
    <DevPage subtitle={label(phase)}>
      <header className={style.intro} style={phaseColour(phase)}>
        <p className={style.label}>Phase {index + 1}</p>
        <h1 className={style.title}>{phase.name}</h1>
        <p className={style.lede}>{lede}</p>
      </header>
      {children}
      <nav className={style.phase_nav}>
        {previous === undefined ? <span /> : <a href={`#${previous.route}`}>← {label(previous)}</a>}
        <a href="#dev">All phases</a>
        {next === undefined ? <span /> : <a href={`#${next.route}`}>{label(next)} →</a>}
      </nav>
    </DevPage>
  )
}

type ShotProps = {
  image: string
  href?: string
  alt: string
  title: ReactNode
  retired?: boolean
  children?: ReactNode
}

export const Shot = ({ image, href = image, alt, title, retired = false, children }: ShotProps) => {
  return (
    <figure className={style.shot} data-retired={retired || undefined}>
      <a href={href}>
        <img src={image} alt={alt} loading="lazy" />
      </a>
      <figcaption className={style.caption}>
        <b className={style.caption_title}>{title}</b>
        {children}
      </figcaption>
    </figure>
  )
}

export const Tag = ({ children }: { children: ReactNode }) => <span className={style.tag}>{children}</span>
