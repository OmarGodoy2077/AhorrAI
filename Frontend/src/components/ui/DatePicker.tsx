import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { getTodayGuatemalaDate } from "@/lib/utils"

interface DatePickerProps {
  value?: Date | string
  onChange?: (date: string) => void
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
}: DatePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value)
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return getTodayGuatemalaDate()
    if (typeof date === "string") return date
    return date.toISOString().split("T")[0]
  }

  return (
    <div className="relative">
      <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        type="date"
        value={formatDate(value)}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-10 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />
    </div>
  )
}
