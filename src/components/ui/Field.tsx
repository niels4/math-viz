import type { ReactNode } from "react"

import { useId } from "react"

import fieldStyles from "./Field.module.css"
import { FieldIdContext } from "./useFieldId.ts"

export function Field({
  label,
  htmlFor,
  children,
  className,
  layout = "stacked",
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  className?: string
  layout?: "stacked" | "inline"
}) {
  const autoId = useId()
  const id = htmlFor ?? autoId
  return (
    <div className={layout === "inline" ? fieldStyles.field_row_inline : fieldStyles.field_row}>
      <label
        className={className === undefined ? fieldStyles.label : `${fieldStyles.label} ${className}`}
        htmlFor={id}
      >
        {label}
      </label>
      <FieldIdContext.Provider value={id}>{children}</FieldIdContext.Provider>
    </div>
  )
}
