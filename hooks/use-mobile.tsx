"use client"

import { useState, useEffect } from "react"

export function useMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // クライアントサイドでのみ実行
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // 初期チェック
    checkIfMobile()

    // リサイズイベントのリスナー
    window.addEventListener("resize", checkIfMobile)

    // クリーンアップ
    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [breakpoint])

  return isMobile
}

