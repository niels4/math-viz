import selectStyles from "./Select.module.css"
import fieldStyles from "./TextField.module.css"

export function Select({
  id,
  value,
  onChange,
  options,
  testId,
}: {
  id: string
  value: string
  onChange: (next: string) => void
  options: ReadonlyArray<string>
  testId: string
}) {
  return (
    <div className={selectStyles.select_wrap}>
      <select
        id={id}
        data-testid={testId}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className={`${fieldStyles.field} ${selectStyles.select}`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className={selectStyles.select_chevron} aria-hidden="true">
        ⌄
      </span>
    </div>
  )
}
