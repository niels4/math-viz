import { useId } from "react"

import fieldStyles from "./TextField.module.css"
import { useFieldId } from "./useFieldId.ts"

export function TextField({
  id,
  value,
  onChange,
  testId,
  type = "text",
  autoComplete,
}: {
  id?: string
  value: string
  onChange: (next: string) => void
  testId: string
  type?: string
  autoComplete?: string
}) {
  const fieldId = useFieldId()
  const autoId = useId()
  const resolvedId = id ?? fieldId ?? autoId
  return (
    <input
      id={resolvedId}
      type={type}
      autoComplete={autoComplete}
      data-testid={testId}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      className={fieldStyles.field}
    />
  )
}
