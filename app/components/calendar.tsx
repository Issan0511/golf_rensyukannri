"use client"

import { useState, useEffect } from "react"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface CalendarProps {
  targetMonth: string
  calendarData: Record<string, string[]>
  statusList: string[]
  updateDayStatus: (day: number, newStatus: string) => void
  onDayLongPress: (day: number) => void
  onDayRightClick: (day: number) => void
  onMultipleEventsClick?: (day: number) => void // 複数イベントがある日をクリックした時の処理
}

export function Calendar({
  targetMonth,
  calendarData,
  statusList,
  updateDayStatus,
  onDayLongPress,
  onDayRightClick,
  onMultipleEventsClick,
}: CalendarProps) {
  const [days, setDays] = useState<number[]>([])
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [touchedDay, setTouchedDay] = useState<number | null>(null)
  const isMobile = useMobile()
  const today = new Date()

  useEffect(() => {
    if (targetMonth) {
      const [year, month] = targetMonth.split("-").map(Number)
      const daysInMonth = new Date(year, month, 0).getDate()
      setDays(Array.from({ length: daysInMonth }, (_, i) => i + 1))
    }
  }, [targetMonth])

  // ステータスを切り替える（クリック時）
  const toggleStatus = (day: number) => {
    const currentStatuses = calendarData[day] || []
    
    console.log(`Day ${day} clicked, statuses:`, currentStatuses, `Length: ${currentStatuses.length}`);
    console.log(`onMultipleEventsClick exists: ${!!onMultipleEventsClick}`);
    
    // 2件以上のイベントがある場合
    if (currentStatuses.length >= 2) {
      if (onMultipleEventsClick) {
        // モーダル表示用の関数が渡されていればそれを使用
        console.log("Multiple events detected, showing modal.");
        onMultipleEventsClick(day);
      } else {
        // 渡されていなければデフォルトの処理（例: 最初のステータスを変更）
        console.log("Multiple events detected, but no handler provided. Toggling first status.");
        const currentIndex = statusList.indexOf(currentStatuses[0]);
        const nextIndex = (currentIndex + 1) % statusList.length;
        
        // 最初のステータスだけを更新（他は保持）
        const newStatuses = [statusList[nextIndex], ...currentStatuses.slice(1)];
        updateDayStatus(day, newStatuses[0]);
      }
      return;
    }
    
    // 単一または無ステータスの場合
    const currentMainStatus = currentStatuses.length > 0 ? currentStatuses[0] : "";
    const currentIndex = statusList.indexOf(currentMainStatus);
    const nextIndex = (currentIndex + 1) % statusList.length;
    updateDayStatus(day, statusList[nextIndex]);
  }

  // 長押し開始
  const handleTouchStart = (day: number) => {
    setTouchedDay(day)
    const timer = setTimeout(() => {
      onDayLongPress(day)
      setTouchedDay(null)
    }, 500) // 500ms長押しでモーダル表示
    setLongPressTimer(timer)
  }

  // タッチ終了
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    
    // 短いタップの場合は通常のトグル
    if (touchedDay !== null) {
      toggleStatus(touchedDay)
      setTouchedDay(null)
    }
  }

  // 右クリック処理
  const handleContextMenu = (e: React.MouseEvent, day: number) => {
    e.preventDefault()
    onDayRightClick(day)
  }

  // ステータスに応じてスタイルを返す
  const getStatusStyle = (statuses: string[]) => {
    if (!statuses || statuses.length === 0) return "bg-white"
    
    // 複数ステータスの場合の表示
    if (statuses.length > 1) {
      return "bg-white" // 背景は白に、下部でマルチステータス表示する
    }
    
    // 単一ステータスの場合
    const status = statuses[0]
    switch (status) {
      case "練習":
        return "bg-green-100 text-green-800"
      case "ラウンド":
        return "bg-yellow-100 text-yellow-800"
      case "キャディー":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-white"
    }
  }

  // 今日かどうかをチェック
  const isToday = (day: number) => {
    if (!targetMonth) return false
    const [year, month] = targetMonth.split("-").map(Number)
    return today.getDate() === day && 
           today.getMonth() === month - 1 && 
           today.getFullYear() === year
  }

  // ステータスの表示を改良
  const renderStatusIndicators = (statuses: string[]) => {
    if (!statuses || statuses.length === 0) return null

    if (statuses.length === 1) {
      return <div className="text-xs mt-1 font-medium">{statuses[0]}</div>
    }
    
    // 複数ステータスの場合はドットで表示
    return (
      <div className="flex justify-center gap-1 mt-1">
        {statuses.map((status, index) => {
          let dotColor = "bg-gray-400"
          if (status === "練習") dotColor = "bg-green-500"
          if (status === "ラウンド") dotColor = "bg-yellow-500"
          if (status === "キャディー") dotColor = "bg-blue-500"
          
          return (
            <div 
              key={index} 
              className={`${dotColor} w-2 h-2 rounded-full`} 
              title={status}
            ></div>
          )
        })}
      </div>
    )
  }

  // カレンダーのグリッドサイズを調整
  const gridCols = isMobile ? "grid-cols-7" : "grid-cols-7"
  const daySizeClass = isMobile ? "h-12 text-sm" : "h-16"

  return (
    <div className="mt-6">
      <div className={`grid ${gridCols} gap-1 sm:gap-2`}>
        {/* 曜日ヘッダー */}
        {["日", "月", "火", "水", "木", "金", "土"].map((day, i) => (
          <div
            key={`header-${i}`}
            className={cn([
              "flex items-center justify-center font-bold rounded-md",
              i === 0 ? "bg-red-500 text-white" : i === 6 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800",
              daySizeClass,
            ])}
          >
            {day}
          </div>
        ))}
        
        {/* 月の1日の曜日に合わせて空白セルを追加 */}
        {targetMonth && (() => {
          const [year, month] = targetMonth.split("-").map(Number)
          const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
          return Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} className="invisible"></div>
          ))
        })()}
        
        {days.map((day) => {
          const dayStatuses = calendarData[day] || []
          const isCurrentDay = isToday(day)
          
          return (
            <div
              key={`day-${day}`}
              onClick={() => toggleStatus(day)}
              onContextMenu={(e) => handleContextMenu(e, day)}
              onTouchStart={() => handleTouchStart(day)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={() => {
                if (longPressTimer) {
                  clearTimeout(longPressTimer)
                  setLongPressTimer(null)
                }
              }}
              className={cn([
                "text-center p-1 cursor-pointer transition-all",
                "hover:bg-gray-50 hover:shadow-md",
                "border rounded-lg shadow-sm",
                getStatusStyle(dayStatuses),
                isCurrentDay ? "ring-2 ring-blue-500 font-bold" : ""
              ])}
              style={{ userSelect: "none" }}
            >
              <div className={cn([
                "font-medium",
                isCurrentDay ? "bg-blue-500 text-white w-6 h-6 rounded-full mx-auto flex items-center justify-center" : ""
              ])}>
                {isCurrentDay ? <span>{day}</span> : day}
              </div>
              {renderStatusIndicators(dayStatuses)}
            </div>
          )
        })}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        * 日付をクリックしてステータスを変更、または右クリック/長押しで複数選択
      </div>
    </div>
  )
}

