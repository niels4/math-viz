import type { ReactNode } from "react"

import fieldStyles from "./Field.module.css"

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className={fieldStyles.field_row}>
      <label className={fieldStyles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}
