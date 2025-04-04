"use client"

import { useState, useEffect } from "react"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface CalendarProps {
  targetMonth: string
  calendarData: Record<string, string>
  statusList: string[]
  updateDayStatus: (day: number, status: string) => void
}

export function Calendar({ targetMonth, calendarData, statusList, updateDayStatus }: CalendarProps) {
  const [daysInMonth, setDaysInMonth] = useState(0)
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(0)
  const isMobile = useMobile()

  // 曜日ヘッダー
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"]

  // 月が変わったらカレンダーデータを更新
  useEffect(() => {
    if (targetMonth) {
      const [year, month] = targetMonth.split("-").map((num) => Number.parseInt(num, 10))

      // 月の最初の日の曜日（0:日曜, 1:月曜, ...）
      const firstDay = new Date(year, month - 1, 1).getDay()
      setFirstDayOfWeek(firstDay)

      // 月の日数
      const lastDay = new Date(year, month, 0).getDate()
      setDaysInMonth(lastDay)
    }
  }, [targetMonth])

  // 日付をクリックしたときの処理
  const handleDayClick = (day: number) => {
    const currentStatusIndex = statusList.indexOf(calendarData[day] || "")
    const nextStatusIndex = (currentStatusIndex + 1) % statusList.length
    updateDayStatus(day, statusList[nextStatusIndex])
  }

  // カレンダーのグリッドサイズを調整
  const gridCols = isMobile ? "grid-cols-7" : "grid-cols-7"
  const daySizeClass = isMobile ? "h-12 text-sm" : "h-16"

  return (
    <div className="mt-6">
      <div className={`grid ${gridCols} gap-1 sm:gap-2`}>
        {/* 曜日ヘッダー */}
        {weekdays.map((day, index) => (
          <div
            key={`header-${index}`}
            className={cn([
              "flex items-center justify-center font-bold rounded-md",
              "bg-blue-600 text-white",
              daySizeClass,
            ])}
          >
            {day}
          </div>
        ))}

        {/* 1日の前の空セル */}
        {Array.from({ length: firstDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="invisible"></div>
        ))}

        {/* 日付セル */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1
          const status = calendarData[day] || ""
          const hasStatus = !!status

          return (
            <button
              key={`day-${day}`}
              onClick={() => handleDayClick(day)}
              className={cn([
                "flex flex-col items-center justify-center rounded-md transition-all",
                "hover:bg-green-100 hover:scale-105 active:scale-95",
                "border border-gray-200 shadow-sm",
                hasStatus ? "bg-green-50" : "bg-gray-50",
                daySizeClass,
              ])}
            >
              <span className="font-medium">{day}</span>
              {hasStatus && <span className="text-xs text-green-700 font-medium">{status}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

