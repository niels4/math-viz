export type NumberFormatter = (n: number) => string

export const formatTime: NumberFormatter = (timeMs: number): string => {
  const now = new Date(timeMs)
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
}
