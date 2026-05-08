import { useRef, useCallback } from 'react'

// Russell 情绪环 —— 坐标系：x=愉悦度(-1~1), y=唤醒度(-1~1)
const EMOTIONS = [
  { label: '兴奋', x:  0.50, y:  0.80 },
  { label: '开心', x:  0.82, y:  0.40 },
  { label: '愉悦', x:  0.88, y: -0.10 },
  { label: '平静', x:  0.65, y: -0.62 },
  { label: '放松', x:  0.22, y: -0.88 },
  { label: '满足', x: -0.12, y: -0.82 },
  { label: '疲惫', x: -0.48, y: -0.72 },
  { label: '低落', x: -0.78, y: -0.42 },
  { label: '无聊', x: -0.85, y:  0.05 },
  { label: '焦虑', x: -0.62, y:  0.58 },
  { label: '紧张', x: -0.18, y:  0.88 },
  { label: '期待', x:  0.28, y:  0.85 },
]

function nearest(x: number, y: number) {
  return EMOTIONS.reduce((best, e) => {
    const d = (e.x - x) ** 2 + (e.y - y) ** 2
    return d < (best.d ?? Infinity) ? { ...e, d } : best
  }, {} as typeof EMOTIONS[0] & { d?: number })
}

export interface WheelValue {
  x: number   // 愉悦度 -1~1
  y: number   // 唤醒度 -1~1
  emotion: string
}

interface Props {
  value: WheelValue
  onChange: (v: WheelValue) => void
}

const SIZE = 240

export default function EmotionWheel({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const handle = useCallback((e: React.PointerEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const r = rect.width / 2
    let nx = (e.clientX - rect.left - r) / r
    let ny = -(e.clientY - rect.top - r) / r  // flip Y轴
    const len = Math.sqrt(nx * nx + ny * ny)
    if (len > 1) { nx /= len; ny /= len }
    const em = nearest(nx, ny)
    onChange({ x: nx, y: ny, emotion: em.label })
  }, [onChange])

  // dot 位置（百分比）
  const dotLeft = (value.x + 1) / 2 * 100
  const dotTop  = (1 - (value.y + 1) / 2) * 100

  // 当前情绪颜色
  const hue = value.x > 0
    ? (value.y > 0 ? '35' : '160')   // 愉快：兴奋=暖橙 / 平静=绿
    : (value.y > 0 ? '280' : '220')  // 不愉快：焦虑=紫 / 低落=蓝
  const dotColor = `hsl(${hue}, 70%, 55%)`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>

      {/* 当前情绪标签 */}
      <div style={{
        fontSize: 20, fontWeight: 600,
        color: dotColor,
        minHeight: 28,
        transition: 'color 0.25s',
        letterSpacing: '0.04em',
      }}>
        {value.emotion || '点击圆盘选择'}
      </div>

      {/* 顶部轴标签 */}
      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)' }}>激活 ↑</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* 左侧轴标签 */}
        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          不愉快
        </div>

        {/* 圆盘 */}
        <div
          ref={ref}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); handle(e) }}
          onPointerMove={e => { if (e.buttons) handle(e) }}
          style={{
            width: SIZE, height: SIZE,
            borderRadius: '50%',
            position: 'relative',
            touchAction: 'none',
            cursor: 'crosshair',
            flexShrink: 0,
            background: [
              'radial-gradient(circle at 75% 25%, rgba(255,190,80,0.55)  0%, transparent 55%)',
              'radial-gradient(circle at 25% 25%, rgba(180,80,220,0.35)  0%, transparent 55%)',
              'radial-gradient(circle at 75% 75%, rgba(80,200,170,0.45)  0%, transparent 55%)',
              'radial-gradient(circle at 25% 75%, rgba(80,110,200,0.38)  0%, transparent 55%)',
              'rgba(245,243,240,1)',
            ].join(', '),
            boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,0.07), 0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* 十字轴线 */}
          <div style={{ position: 'absolute', top: '50%', left: '8%', right: '8%', height: 1, background: 'rgba(0,0,0,0.07)', transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', left: '50%', top: '8%', bottom: '8%', width: 1, background: 'rgba(0,0,0,0.07)', transform: 'translateX(-50%)' }} />

          {/* 情绪标签 */}
          {EMOTIONS.map(em => {
            const lx = (em.x + 1) / 2 * 100
            const ly = (1 - (em.y + 1) / 2) * 100
            const isSelected = em.label === value.emotion
            return (
              <div
                key={em.label}
                style={{
                  position: 'absolute',
                  left: `${lx}%`, top: `${ly}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: isSelected ? 12 : 10,
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? dotColor : 'rgba(0,0,0,0.38)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  transition: 'all 0.2s',
                  textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                }}
              >
                {em.label}
              </div>
            )
          })}

          {/* 拖拽点 */}
          <div style={{
            position: 'absolute',
            left: `${dotLeft}%`, top: `${dotTop}%`,
            transform: 'translate(-50%, -50%)',
            width: 22, height: 22,
            borderRadius: '50%',
            background: dotColor,
            border: '3px solid white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            transition: 'background 0.25s',
            pointerEvents: 'none',
            zIndex: 2,
          }} />
        </div>

        {/* 右侧轴标签 */}
        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', writingMode: 'vertical-rl' }}>
          愉快
        </div>
      </div>

      {/* 底部轴标签 */}
      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)' }}>↓ 平静</div>
    </div>
  )
}
