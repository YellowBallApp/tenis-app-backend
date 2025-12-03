import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { HiChevronLeft, HiChevronRight } from "react-icons/hi"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-bold text-soft-white",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 glass rounded-lg hover:glass-strong transition-all"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-soft-white/60 rounded-md w-9 font-medium text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-soft-purple/20 rounded-lg",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-lg [&:has(>.day-range-start)]:rounded-l-lg first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg"
            : "[&:has([aria-selected])]:rounded-lg"
        ),
        day: cn(
          "h-9 w-9 p-0 font-medium text-soft-white aria-selected:opacity-100 hover:glass rounded-lg transition-all"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-gradient-to-r from-soft-purple to-soft-purple-light text-soft-navy hover:bg-soft-purple hover:text-soft-navy focus:bg-soft-purple focus:text-soft-navy font-bold shadow-lg"
        ),
        day_today: "bg-soft-green/20 text-soft-green font-bold border border-soft-green/30",
        day_outside: cn(
          "day-outside text-soft-white/30 opacity-50 aria-selected:bg-soft-purple/20 aria-selected:text-soft-white aria-selected:opacity-30"
        ),
        day_disabled: "text-soft-white/20 opacity-50",
        day_range_middle: cn(
          "aria-selected:bg-soft-purple/10 aria-selected:text-soft-white"
        ),
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <HiChevronLeft className="h-4 w-4 text-soft-white" />,
        IconRight: () => <HiChevronRight className="h-4 w-4 text-soft-white" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

