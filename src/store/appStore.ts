import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 情绪记录结构
export interface EmotionRecord {
  id: string
  score: number          // 1-10
  tags: string[]
  description: string
  createdAt: number      // timestamp
}

interface AppState {
  records: EmotionRecord[]
  shells: number

  // Actions
  addRecord: (r: Omit<EmotionRecord, 'id' | 'createdAt'>) => void
  getRecentDays: (days: number) => { date: string; score: number | null }[]
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      records: [],
      shells: 0,

      addRecord: (r) => {
        const record: EmotionRecord = {
          ...r,
          id: Date.now().toString(),
          createdAt: Date.now(),
        }
        set((s) => ({
          records: [record, ...s.records],
          shells: s.shells + 1,  // 每次记录 +1 贝壳
        }))
      },

      // 返回最近 N 天每天的情绪分（用于首页日历）
      getRecentDays: (days) => {
        const result: { date: string; score: number | null }[] = []
        const records = get().records
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const dateStr = d.toISOString().split('T')[0]
          const dayRecords = records.filter(r => {
            const rd = new Date(r.createdAt).toISOString().split('T')[0]
            return rd === dateStr
          })
          // 取当天最新一条
          const score = dayRecords.length > 0 ? dayRecords[0].score : null
          result.push({ date: dateStr, score })
        }
        return result
      },
    }),
    { name: '__healer_demo' }
  )
)
