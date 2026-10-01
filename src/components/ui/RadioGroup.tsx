import checkboxStyles from "./Checkbox.module.css"
import fieldLabelStyles from "./Field.module.css"
import radioStyles from "./RadioGroup.module.css"

export function RadioGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  testIdPrefix,
}: {
  legend: string
  name: string
  options: ReadonlyArray<T>
  value: T
  onChange: (next: T) => void
  testIdPrefix: string
}) {
  return (
    <fieldset className={radioStyles.fieldset}>
      <legend className={fieldLabelStyles.label}>{legend}</legend>
      {options.map((option) => (
        <label key={option} className={checkboxStyles.check_label}>
          <input
            type="radio"
            name={name}
            value={option}
            data-testid={`${testIdPrefix}${option.toLowerCase()}`}
            checked={value === option}
            onChange={() => onChange(option)}
            className={radioStyles.radio}
          />
          {option}
        </label>
      ))}
    </fieldset>
  )
}
