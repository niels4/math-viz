import type { ReactNode } from "react"

import buttonStyles from "./Button.module.css"

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "disabled"

const VARIANT_STYLES: Record<Exclude<ButtonVariant, "disabled">, string> = {
  primary: buttonStyles.btn_primary,
  secondary: buttonStyles.btn_secondary,
  ghost: buttonStyles.btn_ghost,
  destructive: buttonStyles.btn_destructive,
}

export function Button({
  variant,
  children,
  testId,
  onClick,
}: {
  variant: ButtonVariant
  children: ReactNode
  testId?: string
  onClick?: () => void
}) {
  if (variant === "disabled") {
    return (
      <button
        type="button"
        disabled
        data-testid={testId}
        className={`${buttonStyles.btn_secondary} ${buttonStyles.btn_disabled}`}
      >
        {children}
      </button>
    )
  }
  return (
    <button type="button" data-testid={testId} className={VARIANT_STYLES[variant]} onClick={onClick}>
      {children}
    </button>
  )
}
