import { Badge, type BadgeVariant } from "./Badge.tsx"
import tableStyles from "./DataTable.module.css"

export type DataTableRow = {
  name: string
  status: string
  updated: string
}

export function DataTable({
  rows,
  statusTone,
}: {
  rows: ReadonlyArray<DataTableRow>
  statusTone: (status: string) => BadgeVariant
}) {
  return (
    <div className={tableStyles.table_wrap}>
      <table className={tableStyles.table}>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Status</th>
            <th scope="col">Updated</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td className={tableStyles.cell_name}>{row.name}</td>
              <td>
                <Badge size="pill" tone={statusTone(row.status)}>
                  {row.status}
                </Badge>
              </td>
              <td className={tableStyles.cell_muted}>{row.updated}</td>
              <td>
                <button type="button" className={tableStyles.view_link}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
