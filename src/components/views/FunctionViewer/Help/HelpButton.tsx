import cn from "classnames"
import { useAtom } from "jotai"
import { useEffect, useRef } from "react"

import { QuestionIcon } from "#src/components/icons/icons.tsx"

import actionsStyle from "../../TopBar/TopBarActions.module.css"
import { helpShownAtom } from "../state"

const dismissEvents = ["pointerdown", "wheel", "keydown"] as const

export const HelpButton = () => {
  const [shown, setShown] = useAtom(helpShownAtom)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!shown) {
      return
    }
    const hide = (event: Event) => {
      if (!(event.target instanceof Node && button.current?.contains(event.target))) {
        setShown(false)
      }
    }
    for (const type of dismissEvents) {
      window.addEventListener(type, hide, true)
    }
    return () => {
      for (const type of dismissEvents) {
        window.removeEventListener(type, hide, true)
      }
    }
  }, [shown, setShown])

  return (
    <button
      ref={button}
      type="button"
      className={cn(actionsStyle.round_button, actionsStyle.help_button)}
      aria-pressed={shown}
      onClick={() => setShown(!shown)}
    >
      <QuestionIcon />
      Show Help
    </button>
  )
}
