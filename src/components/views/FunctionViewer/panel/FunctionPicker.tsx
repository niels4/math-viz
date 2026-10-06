import { MathText } from "#src/components/ui/MathText.tsx"
import { SegmentedControl, type SegmentedOption } from "#src/components/ui/SegmentedControl.tsx"

import { PICKER_LABEL } from "../copy.ts"
import { BASE_FUNCTION_SLUGS, BASE_FUNCTIONS, type BaseFunctionSlug } from "../math/baseFunctions.ts"
import style from "./FunctionPicker.module.css"

const OPTIONS: readonly SegmentedOption<BaseFunctionSlug>[] = BASE_FUNCTION_SLUGS.map((slug) => ({
  value: slug,
  label: <MathText text={BASE_FUNCTIONS[slug].label} />,
  ariaLabel: BASE_FUNCTIONS[slug].spoken,
}))

// Decision D5: the four base functions as one segmented control, all in view.
export function FunctionPicker({
  value,
  onChange,
}: {
  value: BaseFunctionSlug
  onChange: (next: BaseFunctionSlug) => void
}) {
  return (
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={onChange}
      label={PICKER_LABEL}
      testId="fv-fn"
      className={style.picker}
    />
  )
}
