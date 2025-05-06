"use client"

import { format, setHours, setMinutes } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState } from "react"

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

export function DatePicker({ date, setDate }: DatePickerProps) {
  const [localTime, setLocalTime] = useState(
    date ? `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}` : "12:00"
  )

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":").map(Number)
    if (date) {
      const updated = setMinutes(setHours(date, hours), minutes)
      setDate(updated)
    }
    setLocalTime(e.target.value)
  }

  const handleDateSelect = (selected: Date | undefined) => {
    if (!selected) return
    const [hours, minutes] = localTime.split(":").map(Number)
    const updated = setMinutes(setHours(selected, hours), minutes)
    setDate(updated)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal bg-slate-900 border-slate-700 text-white hover:bg-slate-800 hover:text-white",
            !date && "text-slate-400",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP p") : <span>Pick a date & time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 space-y-4 bg-slate-800 border-slate-700">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          className="bg-slate-800 text-white"
        />
        <div className="flex items-center justify-between text-white">
          <label htmlFor="time" className="mr-2">
            Time:
          </label>
          <input
            id="time"
            type="time"
            value={localTime}
            onChange={handleTimeChange}
            className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
