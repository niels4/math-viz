import type { ReactNode } from "react"

import badgeStyles from "./Badge.module.css"

export type BadgeVariant = "accent" | "success" | "warning" | "destructive"

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  accent: badgeStyles.badge_accent,
  success: badgeStyles.badge_success,
  warning: badgeStyles.badge_warning,
  destructive: badgeStyles.badge_destructive,
}

export function Badge({
  tone = "accent",
  children,
  size = "default",
}: {
  tone?: BadgeVariant
  children: ReactNode
  size?: "default" | "pill"
}) {
  return (
    <span
      className={`${badgeStyles.badge} ${VARIANT_STYLES[tone]}${size === "pill" ? ` ${badgeStyles.pill}` : ""}`}
    >
      {children}
    </span>
  )
}
