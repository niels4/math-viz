import type { ReactNode } from "react"

import badgeStyles from "./Badge.module.css"

export type BadgeVariant = "accent" | "success" | "warning" | "destructive"

export function Badge({
  toneClass,
  children,
  size = "default",
}: {
  toneClass: string
  children: ReactNode
  size?: "default" | "pill"
}) {
  return (
    <span className={`${toneClass} ${size === "pill" ? badgeStyles.pill : badgeStyles.badge}`}>
      {children}
    </span>
  )
}
