import { useId, useState } from "react"

import fieldStyles from "#src/components/ui/TextField.module.css"
import { useFieldId } from "#src/components/ui/useFieldId.ts"

type Buffer = {
  text: string
  base: number
}

// A numeric input that never leaks NaN into state. Typed text is buffered:
// complete numbers propagate live, while incomplete input ("-", "", "1e")
// stays in the buffer so negatives are typeable and the field is clearable.
// The buffer is honored only while it was based on the current value, so a
// programmatic change discards stale text. Blur reverts to the last valid
// value (and normalizes cosmetic forms like "1." to "1").
export function NumberField({
  id,
  value,
  onChange,
  testId,
}: {
  id?: string
  value: number
  onChange: (next: number) => void
  testId: string
}) {
  const fieldId = useFieldId()
  const autoId = useId()
  const resolvedId = id ?? fieldId ?? autoId
  const [buffer, setBuffer] = useState<Buffer | null>(null)
  const shown = buffer !== null && buffer.base === value ? buffer.text : String(value)

  const handleChange = (next: string) => {
    const parsed = next.trim() === "" ? Number.NaN : Number(next)
    if (Number.isFinite(parsed)) {
      setBuffer({ text: next, base: parsed })
      onChange(parsed)
    } else {
      setBuffer({ text: next, base: value })
    }
  }

  return (
    <input
      id={resolvedId}
      inputMode="decimal"
      autoComplete="off"
      data-testid={testId}
      value={shown}
      onChange={(event) => handleChange(event.currentTarget.value)}
      onBlur={() => setBuffer(null)}
      className={fieldStyles.field}
    />
  )
}
