import cn from "classnames"

import { GitHubIcon } from "#src/components/icons/icons.tsx"
import { Tip } from "#src/components/ui/Tip.tsx"

import { SettingsMenu } from "./SettingsMenu"
import style from "./TopBarActions.module.css"

export const TopBarActions = () => {
  return (
    <div className={style.actions}>
      <a
        href="https://github.com/niels4/math-viz"
        className={cn(style.round_button, style.github_link)}
        aria-label="GitHub repository"
        target="_blank"
        rel="noreferrer"
      >
        <GitHubIcon />
        <Tip className={style.tip}>GitHub repository</Tip>
      </a>
      <SettingsMenu />
    </div>
  )
}
