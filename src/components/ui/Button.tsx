import type { ReactNode } from "react"

import buttonStyles from "./Button.module.css"

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "disabled"

export function Button({
  variant,
  children,
  primaryClass,
  secondaryClass,
  testId,
  onClick,
}: {
  variant: ButtonVariant
  children: ReactNode
  primaryClass: string
  secondaryClass: string
  testId?: string
  onClick?: () => void
}) {
  if (variant === "ghost") {
    return (
      <button type="button" data-testid={testId} className={buttonStyles.btn_ghost} onClick={onClick}>
        {children}
      </button>
    )
  }
  if (variant === "destructive") {
    return (
      <button type="button" data-testid={testId} className={buttonStyles.btn_destructive} onClick={onClick}>
        {children}
      </button>
    )
  }
  if (variant === "disabled") {
    return (
      <button
        type="button"
        disabled
        data-testid={testId}
        className={`${secondaryClass} ${buttonStyles.btn_disabled}`}
      >
        {children}
      </button>
    )
  }
  return (
    <button
      type="button"
      data-testid={testId}
      className={variant === "primary" ? primaryClass : secondaryClass}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
