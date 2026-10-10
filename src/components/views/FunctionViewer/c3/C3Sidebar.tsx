import type { SidebarProps } from "../sidebar.ts"

import { SECTIONS } from "../copy.ts"
import { FunctionPicker } from "../panel/FunctionPicker.tsx"
import { SubCard } from "./SubCard.tsx"

// figma0's SB3 · C3 · Ordinal correlations (the user's "ordinal color
// coordination"): B's number rows on B2's sub cards, each of a, k, b and h
// in one colour wherever it appears. Three sections, each on its own card:
// the function and its equation, the transforms, the points.
export function C3Sidebar({ state, dispatch }: SidebarProps) {
  const { fn } = state
  return (
    <>
      <SubCard title={SECTIONS.function.title} testId="fv-section-function">
        <FunctionPicker value={fn} onChange={(next) => dispatch({ type: "setFunction", fn: next })} />
      </SubCard>
      <SubCard title={SECTIONS.transform.title} testId="fv-section-transform">
        {null}
      </SubCard>
      <SubCard title={SECTIONS.points.title} testId="fv-section-points">
        {null}
      </SubCard>
    </>
  )
}
