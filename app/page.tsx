import { Suspense } from "react"
import { GolfTrackerClient } from "./components/golf-tracker-client"

export default function GolfClubTrackerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">読み込み中...</div>}>
      <GolfTrackerClient />
    </Suspense>
  )
}

