import type { ClassValue } from "class-variance-authority"

export function cn(...inputs: ClassValue[] | [ClassValue[]]) {
  // 最初の引数が配列の場合（新しい形式）
  if (Array.isArray(inputs[0]) && inputs.length === 1) {
    return inputs[0].filter(Boolean).join(" ")
  }

  // 従来の形式（複数の引数）
  return inputs.filter(Boolean).join(" ")
}

