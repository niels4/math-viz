import pageStyles from "./Pagination.module.css"

export function Pagination({
  page,
  pageCount,
  onChange,
  countLabel,
}: {
  page: number
  pageCount: number
  onChange: (next: number) => void
  countLabel: string
}) {
  return (
    <div className={pageStyles.table_foot}>
      <span className={pageStyles.table_count}>{countLabel}</span>
      <div className={pageStyles.pagination} role="navigation" aria-label="Pagination">
        <button type="button" className={pageStyles.page_btn}>
          ← Previous
        </button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((n) => (
          <button
            key={n}
            type="button"
            aria-current={n === page ? "page" : undefined}
            data-testid={`page-${n}`}
            className={
              n === page ? `${pageStyles.page_btn} ${pageStyles.page_btn_active}` : pageStyles.page_btn
            }
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
        <button type="button" className={pageStyles.page_btn}>
          Next →
        </button>
      </div>
    </div>
  )
}
