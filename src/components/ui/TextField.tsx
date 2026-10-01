import fieldStyles from "./TextField.module.css"

export function TextField({
  id,
  value,
  onChange,
  testId,
  inputClass,
  type = "text",
  autoComplete,
}: {
  id: string
  value: string
  onChange: (next: string) => void
  testId: string
  inputClass: string
  type?: string
  autoComplete?: string
}) {
  return (
    <input
      id={id}
      type={type}
      autoComplete={autoComplete}
      data-testid={testId}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      className={`${inputClass} ${fieldStyles.field}`}
    />
  )
}
