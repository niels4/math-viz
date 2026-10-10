// The C3 sidebar's strings where they differ from today's sidebar (copy.ts):
// its rows name a point's role in plain lowercase (figma0 SB3 · C3), and
// Q's role says how to place it or what it does, in place of today's note.

/** Each point's role beside its letter (SB3 · C3 › Points). */
export const C3_POINT_ROLES = {
  p: "pinned",
  /** While the pointer is on the plane, and while it isn't. */
  q: { live: "follows your pointer", empty: "point at the plane" },
} as const

/** P's role while f(P) lies outside the plane's visible y-range. */
export const C3_OFF_VIEW_ROLES = { above: "above the view", below: "below the view" } as const
