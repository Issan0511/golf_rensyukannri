"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "./components/calendar"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { useSearchParams } from "next/navigation"
import { StatusSelectionModal } from "./components/status-selection-modal"

// Google Apps Script URL
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbyJxavQ4xaLmGDurl_pNMJXswAFXj_PcxlDj7V2zw2cAg8h_7N4MiKhuTcLtamncd-x/exec"

// ステータスリスト
const statusList = ["", "練習", "ラウンド", "キャディ"] // 0: なし, 1: 練習, ...

// 参加回数の型定義
type ParticipationCounts = {
  total: number;
  byStatus: Record<string, number>;
}

export default function GolfClubTracker() {
  const [memberName, setMemberName] = useState("")
  const [targetMonth, setTargetMonth] = useState("")
  const [calendarData, setCalendarData] = useState<Record<string, string[]>>({})
  const [participationCount, setParticipationCount] = useState<ParticipationCounts>({
    total: 0,
    byStatus: {}
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isCalendarGenerated, setIsCalendarGenerated] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const { toast } = useToast()
  const isMobile = useMobile()
  const searchParams = useSearchParams()

  // 初期化時に当月をセットし、URLパラメータをチェック
  useEffect(() => {
    // URLパラメータから部員名と対象月を取得
    const nameParam = searchParams?.get("部員名")
    const monthParam = searchParams?.get("対象月")
    
    // 部員名がURLに指定されていれば設定
    if (nameParam) {
      setMemberName(nameParam)
    }
    
    // 対象月がURLに指定されていれば設定、なければ当月を設定
    if (monthParam) {
      setTargetMonth(monthParam)
    } else {
      const thisMonth = new Date().toISOString().slice(0, 7)
      setTargetMonth(thisMonth)
    }
  }, [searchParams])

  // 部員名と対象月が設定されたら自動的にカレンダーを生成
  useEffect(() => {
    // 両方の値があり、対象月のフォーマットが正しい場合にのみ実行
    if (memberName.trim() && targetMonth && /^\d{4}-\d{2}$/.test(targetMonth)) {
      generateCalendar();
    }
  }, [memberName, targetMonth]); // memberNameとtargetMonthが変更されたときに実行

  // 参加回数を計算
  const calculateParticipation = (data: Record<string, string[]>) => {
    // ステータス別のカウント初期化
    const counts: Record<string, number> = {}
    statusList.filter(s => s !== "").forEach(status => {
      counts[status] = 0
    })
    
    // 全ての日のステータスをカウント
    let totalDays = 0
    Object.values(data).forEach((statuses) => {
      if (statuses && statuses.length > 0) {
        totalDays++
        // 各ステータスの出現回数を集計
        statuses.forEach(status => {
          if (status && counts[status] !== undefined) {
            counts[status]++
          }
        })
      }
    })
    
    // 全ステータスの合計回数
    const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0)
    
    setParticipationCount({
      total: totalCount,
      byStatus: counts
    })
  }

  // カレンダー生成
  const generateCalendar = async () => {
    if (!memberName.trim()) {
      toast({
        title: "エラー",
        description: "部員名を入力してください。",
        variant: "destructive",
      })
      return
    }

    if (!targetMonth) {
      toast({
        title: "エラー",
        description: "対象月を選択してください。",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setIsCalendarGenerated(true)

    try {
      // 既存データの読み込み
      await loadExistingData()
    } catch (error) {
      console.error("カレンダー生成エラー:", error)
      toast({
        title: "エラー",
        description: "カレンダーの生成中にエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 既存データの読み込み
  const loadExistingData = () => {
    return new Promise<void>((resolve, reject) => {
      if (!memberName.trim() || !targetMonth) {
        resolve()
        return
      }

      // 月が有効な形式かチェック
      if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
        toast({
          title: "エラー",
          description: "月の形式が不正です。YYYY-MM形式が必要です。",
          variant: "destructive",
        })
        reject(new Error("Invalid month format"))
        return
      }

      // JSONP方式でデータを取得するためのコールバック名
      const callbackName = "handleDataCallback_" + Date.now()

      // コールバック関数を定義
      window[callbackName as keyof Window] = (data: any) => {
        if (data && data.found) {
          try {
            // データがJSON文字列で返ってくる場合はパース
            const dailyStatuses =
              typeof data.dailyStatuses === "string" ? JSON.parse(data.dailyStatuses) : data.dailyStatuses

            // カレンダーに反映（古いフォーマットの互換性処理）
            const convertedData: Record<string, string[]> = {}
            
            // 既存データの変換（string -> string[]）
            Object.entries(dailyStatuses).forEach(([day, status]) => {
              if (typeof status === 'string') {
                convertedData[day] = status ? [status] : []
              } else {
                convertedData[day] = status as string[]
              }
            })
            
            setCalendarData(convertedData)
            calculateParticipation(convertedData)
            toast({
              title: "成功",
              description: "既存データを読み込みました。",
            })
          } catch (error) {
            console.error("データ反映エラー:", error)
            toast({
              title: "エラー",
              description: "データの反映中にエラーが発生しました。",
              variant: "destructive",
            })
            reject(error)
          }
        } else {
          // 既存データなし
          setCalendarData({})
          setParticipationCount({
            total: 0,
            byStatus: {}
          })
          toast({
            title: "情報",
            description: "データがありません。新規作成します。",
          })
        }

        // コールバック関数をクリーンアップ
        delete window[callbackName as keyof Window]
        resolve()
      }

      // GASのウェブアプリURLにJSONPパラメータを追加
      const url = `${GAS_URL}?callback=${callbackName}&month=${encodeURIComponent(targetMonth)}&name=${encodeURIComponent(memberName)}&action=load&t=${Date.now()}`

      // スクリプトタグを作成して追加
      const script = document.createElement("script")
      script.src = url
      script.onerror = (e) => {
        delete window[callbackName as keyof Window]
        document.body.removeChild(script)
        reject(e)
      }
      document.body.appendChild(script)
    })
  }

  // 月次データ送信
  const submitMonthlyData = async () => {
    if (!memberName.trim()) {
      toast({
        title: "エラー",
        description: "部員名を入力してください。",
        variant: "destructive",
      })
      return
    }

    if (!targetMonth) {
      toast({
        title: "エラー",
        description: "対象月を選択してください。",
        variant: "destructive",
      })
      return
    }

    if (!isCalendarGenerated) {
      toast({
        title: "エラー",
        description: "先にカレンダーを生成してください。",
        variant: "destructive",
      })
      return
    }

    // 月が有効な形式かチェック
    if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
      toast({
        title: "エラー",
        description: "月の形式が不正です。YYYY-MM形式が必要です。",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // 送信するペイロードを作成
      const payload = {
        month: targetMonth,
        name: memberName,
        dailyStatuses: JSON.stringify(calendarData),
        statusCounts: JSON.stringify(participationCount.byStatus), // ステータス別回数を追加
        totalCount: participationCount.total, // 合計回数も追加
        action: "save",
      }

      // Google Apps ScriptにデータをPOST送信
      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      })

      toast({
        title: "成功",
        description: "データを送信しました",
      })
    } catch (err) {
      console.error("送信エラー:", err)
      toast({
        title: "エラー",
        description: `送信エラーが発生しました: ${err instanceof Error ? err.message : "不明なエラー"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 日付のステータス更新（単一選択用 - バックワードコンパティビリティのため残す）
  const updateDayStatus = (day: number, newStatus: string) => {
    setCalendarData((prev) => {
      // 既存のステータスを配列として取得または新規作成
      const prevStatuses = prev[day] || []
      // 選択されたステータスだけを含む新しい配列
      const newData = { ...prev, [day]: newStatus ? [newStatus] : [] }
      calculateParticipation(newData)
      return newData
    })
  }

  // モーダルを開く
  const openStatusModal = (day: number) => {
    setSelectedDay(day)
    setModalOpen(true)
  }

  // 複数ステータス選択時の更新
  const updateMultipleStatuses = (day: number, selectedStatuses: string[]) => {
    setCalendarData((prev) => {
      const newData = { ...prev, [day]: selectedStatuses }
      calculateParticipation(newData)
      return newData
    })
    setModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-green-700">ゴルフ部練習記録管理</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="memberName">部員名</Label>
                <Input
                  id="memberName"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="名前を入力"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetMonth">対象月</Label>
                <Input
                  id="targetMonth"
                  type="month"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
              <Button onClick={generateCalendar} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? "処理中..." : "カレンダー生成"}
              </Button>
              <Button
                onClick={submitMonthlyData}
                disabled={isLoading || !isCalendarGenerated}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "送信中..." : "月次データを送信"}
              </Button>
            </div>

            {isCalendarGenerated && (
              <>
                <Calendar
                  targetMonth={targetMonth}
                  calendarData={calendarData}
                  statusList={statusList}
                  updateDayStatus={updateDayStatus}
                  onDayLongPress={openStatusModal}
                  onDayRightClick={openStatusModal}
                  onMultipleEventsClick={openStatusModal} // 複数イベントがある日のクリック時もモーダルを表示
                />

                {memberName && (
                  <div className="mt-4 text-center">
                    <p className="font-bold text-lg text-green-700">
                      {memberName} さんの参加回数: {participationCount.total} 回
                    </p>
                    <div className="mt-2 text-sm text-gray-600 flex flex-wrap justify-center gap-3">
                      {Object.entries(participationCount.byStatus).map(([status, count]) => (
                        <span key={status} className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                          {status}: {count}回
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ステータス選択モーダル */}
      {modalOpen && selectedDay !== null && (
        <StatusSelectionModal
          day={selectedDay}
          selectedStatuses={calendarData[selectedDay] || []}
          statusList={statusList.filter(s => s !== "")} // 空文字を除外
          onClose={() => setModalOpen(false)}
          onSave={(selectedStatuses) => updateMultipleStatuses(selectedDay, selectedStatuses)}
        />
      )}
    </div>
  )
}

