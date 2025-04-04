import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

interface StatusSelectionModalProps {
  day: number
  selectedStatuses: string[]
  statusList: string[]
  onClose: () => void
  onSave: (selectedStatuses: string[]) => void
}

export function StatusSelectionModal({
  day,
  selectedStatuses,
  statusList,
  onClose,
  onSave,
}: StatusSelectionModalProps) {
  const [selected, setSelected] = useState<string[]>(selectedStatuses)

  const handleStatusToggle = (status: string) => {
    setSelected((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status)
      } else {
        return [...prev, status]
      }
    })
  }

  const handleSave = () => {
    onSave(selected)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-center">
          {day}日のステータス選択
        </h2>
        
        <div className="space-y-4 mb-6">
          {statusList.map((status) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status}`}
                checked={selected.includes(status)}
                onCheckedChange={() => handleStatusToggle(status)}
              />
              <Label htmlFor={`status-${status}`} className="cursor-pointer">
                {status}
              </Label>
            </div>
          ))}
        </div>
        
        {selected.length > 0 && (
          <div className="mb-4 p-2 bg-gray-100 rounded">
            <div className="font-semibold mb-1">選択中のステータス ({selected.length}個):</div>
            <div className="flex flex-wrap gap-1">
              {selected.map(status => (
                <span key={status} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                  {status}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            保存 {selected.length > 0 ? `(${selected.length}個)` : ''}
          </Button>
        </div>
      </Card>
    </div>
  )
}
