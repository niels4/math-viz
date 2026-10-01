import type { ReactNode } from "react"

import checkboxStyles from "./Checkbox.module.css"

export function Checkbox({
  checked,
  onChange,
  testId,
  children,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  testId: string
  children: ReactNode
}) {
  return (
    <label className={checkboxStyles.check_label}>
      <input
        type="checkbox"
        data-testid={testId}
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className={checkboxStyles.check}
      />
      {children}
    </label>
  )
}
