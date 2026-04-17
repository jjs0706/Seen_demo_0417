import { useState, useEffect } from 'react'

export interface TimePhase {
  phase: 'morning' | 'afternoon' | 'evening' | 'night'
  greeting: string
  bgH: number
  bgS: number
  bgL: number
  isNight: boolean
}

export function useTimePhase(): TimePhase {
  const [timePhase, setTimePhase] = useState<TimePhase>(getTimePhase)

  // 每分钟检查时相变化
  useEffect(() => {
    const interval = setInterval(() => {
      setTimePhase(getTimePhase())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // 将时相写入 CSS 变量（背景色 + 文字色）
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--bg-h', String(timePhase.bgH))
    root.style.setProperty('--bg-s', timePhase.bgS + '%')
    root.style.setProperty('--bg-l', timePhase.bgL + '%')
    if (timePhase.isNight) {
      root.style.setProperty('--text-primary', 'rgba(220, 210, 200, 0.85)')
      root.style.setProperty('--text-secondary', 'rgba(200, 190, 180, 0.5)')
    } else {
      root.style.setProperty('--text-primary', 'rgba(60, 50, 40, 0.85)')
      root.style.setProperty('--text-secondary', 'rgba(60, 50, 40, 0.5)')
    }
  }, [timePhase])

  return timePhase
}

function getTimePhase(): TimePhase {
  const h = new Date().getHours()
  if (h >= 5 && h < 11)
    return { phase: 'morning',   greeting: '早安，今天也要好好的',     bgH: 210, bgS: 40, bgL: 95, isNight: false }
  if (h >= 11 && h < 17)
    return { phase: 'afternoon', greeting: '午安，此刻感觉怎么样？',   bgH: 35,  bgS: 60, bgL: 97, isNight: false }
  if (h >= 17 && h < 21)
    return { phase: 'evening',   greeting: '晚上好，今天辛苦了',       bgH: 15,  bgS: 50, bgL: 90, isNight: false }
  return   { phase: 'night',     greeting: '夜深了，陪你把今天收尾',   bgH: 230, bgS: 20, bgL: 15, isNight: true  }
}
