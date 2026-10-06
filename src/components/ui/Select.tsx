import { useId } from "react"

import selectStyles from "./Select.module.css"
import fieldStyles from "./TextField.module.css"
import { useFieldId } from "./useFieldId.ts"

export type SelectOption = string | { value: string; label: string }

const toValue = (option: SelectOption): string => (typeof option === "string" ? option : option.value)
const toLabel = (option: SelectOption): string => (typeof option === "string" ? option : option.label)

export function Select({
  id,
  value,
  onChange,
  options,
  testId,
  className,
}: {
  id?: string
  value: string
  onChange: (next: string) => void
  options: ReadonlyArray<SelectOption>
  testId: string
  className?: string
}) {
  const fieldId = useFieldId()
  const autoId = useId()
  const resolvedId = id ?? fieldId ?? autoId
  return (
    <div className={selectStyles.select_wrap}>
      <select
        id={resolvedId}
        data-testid={testId}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className={
          className === undefined
            ? `${fieldStyles.field} ${selectStyles.select}`
            : `${fieldStyles.field} ${selectStyles.select} ${className}`
        }
      >
        {options.map((option) => (
          <option key={toValue(option)} value={toValue(option)}>
            {toLabel(option)}
          </option>
        ))}
      </select>
      <span className={selectStyles.select_chevron} aria-hidden="true">
        ⌄
      </span>
    </div>
  )
}
