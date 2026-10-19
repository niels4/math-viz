export type NumberFormatter = (n: number) => string

export const formatTime: NumberFormatter = (timeMs: number): string => {
  const now = new Date(timeMs)
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
}

export const formatFixed = (precision: number, n: number): string => n.toFixed(precision)

export const slugToLabel = (slug: string): string => {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
