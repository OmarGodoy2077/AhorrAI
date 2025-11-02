import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DataTableColumn<T> {
  header: string
  accessorKey?: keyof T
  render?: (item: T) => React.ReactNode
  className?: string
  hiddenOn?: 'mobile' | 'tablet' | 'desktop'
}

interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  loading?: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    onPageChange: (page: number) => void
  }
  onRowClick?: (item: T) => void
}

export function DataTable<T extends { id?: string }>({
  data,
  columns,
  loading = false,
  pagination,
  onRowClick,
}: DataTableProps<T>) {
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0

  // Get visible columns based on screen size (simplified - desktop shows all)
  const visibleColumns = columns.filter(col => {
    if (col.hiddenOn === 'mobile' || col.hiddenOn === 'tablet') return true
    return true
  })

  return (
    <div className="space-y-4 overflow-x-auto">
      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {visibleColumns.map((column, i) => (
                <th
                  key={i}
                  className={cn(
                    "text-left px-3 sm:px-4 py-3 font-semibold text-xs sm:text-sm text-foreground",
                    column.className,
                    "whitespace-nowrap"
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length} className="px-3 sm:px-4 py-8 text-center text-muted-foreground">
                  Cargando...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="px-3 sm:px-4 py-8 text-center text-muted-foreground">
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                  onClick={() => onRowClick?.(item)}
                  style={{ cursor: onRowClick ? "pointer" : "default" }}
                >
                  {visibleColumns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={cn(
                        "px-3 sm:px-4 py-3 text-xs sm:text-sm text-foreground",
                        column.className,
                        "max-w-xs sm:max-w-none truncate sm:truncate-none"
                      )}
                    >
                      {column.render ? column.render(item) : String(column.accessorKey ? item[column.accessorKey] : "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Página {pagination.page} de {totalPages} ({pagination.total})
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(Math.min(totalPages, pagination.page + 1))}
              disabled={pagination.page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
