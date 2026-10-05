import type { ReactNode } from "react"

import fieldStyles from "./Field.module.css"

export function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={fieldStyles.field_row}>
      <label
        className={className === undefined ? fieldStyles.label : `${fieldStyles.label} ${className}`}
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
