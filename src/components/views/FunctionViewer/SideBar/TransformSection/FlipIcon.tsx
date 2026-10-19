export const FlipIcon = ({ axis }: { axis: "vertical" | "horizontal" }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    {axis === "vertical" ? (
      <>
        <path d="M7 2V12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M3.5 5L7 0.5L10.5 5ZM3.5 9L7 13.5L10.5 9Z" />
      </>
    ) : (
      <>
        <path d="M2 7H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M5 3.5L0.5 7L5 10.5ZM9 3.5L13.5 7L9 10.5Z" />
      </>
    )}
  </svg>
)
