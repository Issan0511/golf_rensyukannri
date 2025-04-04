"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

interface UrlParamsHandlerProps {
  onParamsChange: (params: { name?: string; month?: string }) => void
}

export function UrlParamsHandler({ onParamsChange }: UrlParamsHandlerProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    // URLパラメータから部員名と対象月を取得
    const nameParam = searchParams?.get("部員名")
    const monthParam = searchParams?.get("対象月")
    
    // 親コンポーネントに変更を通知
    onParamsChange({
      name: nameParam || undefined,
      month: monthParam || undefined
    })
    
    // デバッグ用のログ
    if (nameParam) console.log("部員名:", nameParam)
    if (monthParam) console.log("対象月:", monthParam)
    
  }, [searchParams, onParamsChange])

  return null // UIはレンダリングしない
}
