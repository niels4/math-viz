export type NumberFormatter = (n: number) => string

export const formatTime: NumberFormatter = (timeMs: number): string => {
  const now = new Date(timeMs)
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
}

/** Format with constant decimal precision: formatFixed(2, 1.5) -> "1.50". */
export const formatFixed = (precision: number, n: number): string => n.toFixed(precision)

/** Dashed slug to title label: "arctic-ice" -> "Arctic Ice". */
export const slugToLabel = (slug: string): string => {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
