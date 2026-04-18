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

// 三件好事记录
export interface ThreeGoodRecord {
  id: string
  goods: string[]        // 三件好事内容
  aiReply: string        // AI 回应
  createdAt: number
}

// 小屋挂画
export interface Painting {
  id: string
  imageUrl: string       // Pollinations 图片 URL
  dreamText: string      // 原始梦境描述
  analysis: string       // AI 分析文字
  createdAt: number
}

interface AppState {
  records: EmotionRecord[]
  threeGoods: ThreeGoodRecord[]
  paintings: Painting[]
  shells: number

  // Actions
  addRecord: (r: Omit<EmotionRecord, 'id' | 'createdAt'>) => void
  addThreeGood: (r: Omit<ThreeGoodRecord, 'id' | 'createdAt'>) => void
  addPainting: (p: Omit<Painting, 'id' | 'createdAt'>) => void
  getRecentDays: (days: number) => { date: string; score: number | null }[]
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      records: [],
      threeGoods: [],
      paintings: [],
      shells: 0,

      addRecord: (r) => {
        const record: EmotionRecord = {
          ...r,
          id: Date.now().toString(),
          createdAt: Date.now(),
        }
        set((s) => ({
          records: [record, ...s.records],
          shells: s.shells + 1,
        }))
      },

      addThreeGood: (r) => {
        set((s) => ({
          threeGoods: [{ ...r, id: Date.now().toString(), createdAt: Date.now() }, ...s.threeGoods],
        }))
      },

      addPainting: (p) => {
        set((s) => ({
          paintings: [{ ...p, id: Date.now().toString(), createdAt: Date.now() }, ...s.paintings],
          shells: s.shells + 2,  // 梦境挂画 +2 贝壳
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
