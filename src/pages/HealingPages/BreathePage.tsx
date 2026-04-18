// 呼吸练习 — 4-7-8 呼吸法，纯动画，无 AI
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale'

const PHASES: { phase: Phase; label: string; seconds: number; color: string }[] = [
  { phase: 'inhale', label: '吸气',  seconds: 4, color: 'hsl(200,60%,65%)' },
  { phase: 'hold',   label: '屏息',  seconds: 7, color: 'hsl(35,70%,65%)'  },
  { phase: 'exhale', label: '呼气',  seconds: 8, color: 'hsl(150,40%,60%)' },
]

export default function BreathePage() {
  const navigate = useNavigate()
  const [running, setRunning] = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [countdown, setCountdown] = useState(PHASES[0].seconds)
  const [cycles, setCycles] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const current = PHASES[phaseIdx]

  useEffect(() => {
    if (!running) return

    setCountdown(current.seconds)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // 进入下一阶段
          setPhaseIdx(idx => {
            const next = (idx + 1) % PHASES.length
            if (next === 0) setCycles(c => c + 1)
            return next
          })
          return PHASES[(phaseIdx + 1) % PHASES.length].seconds
        }
        return prev - 1
      })
    }, 1000)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running, phaseIdx])

  const toggle = () => {
    if (running) {
      setRunning(false)
      setPhaseIdx(0)
      setCountdown(PHASES[0].seconds)
      setCycles(0)
    } else {
      setRunning(true)
    }
  }

  // 呼吸球大小
  const scale = running
    ? current.phase === 'inhale' ? 1.35
    : current.phase === 'hold'   ? 1.35
    : 0.85
    : 1.0

  const duration = running ? current.seconds : 1

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'var(--color-bg)',
      paddingBottom: 'var(--nav-height)',
    }}>
      {/* 顶部 */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '16px 16px 0', gap: 8 }}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>←</button>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>呼吸练习</h1>
        {cycles > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--color-text-sub)' }}>
            {cycles} 次循环
          </span>
        )}
      </div>

      <p style={{ fontSize: 13, color: 'var(--color-text-sub)', marginTop: 8 }}>4-7-8 呼吸法，帮助平静神经系统</p>

      {/* 呼吸球 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
      }}>
        <div style={{
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: running ? current.color : 'var(--color-card)',
          boxShadow: running ? `0 0 60px ${current.color}88` : 'var(--shadow-card)',
          transform: `scale(${scale})`,
          transition: `transform ${duration}s ease-in-out, background 0.5s, box-shadow 0.5s`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: 28, fontWeight: 600, color: running ? '#fff' : 'var(--color-text-sub)' }}>
            {running ? countdown : '·'}
          </div>
          <div style={{ fontSize: 13, color: running ? 'rgba(255,255,255,0.85)' : 'var(--color-text-sub)', marginTop: 4 }}>
            {running ? current.label : '准备好了吗'}
          </div>
        </div>

        {/* 阶段指示 */}
        {running && (
          <div style={{ display: 'flex', gap: 8 }}>
            {PHASES.map((p, i) => (
              <div key={p.phase} style={{
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                background: i === phaseIdx ? p.color : 'rgba(0,0,0,0.06)',
                color: i === phaseIdx ? '#fff' : 'var(--color-text-sub)',
                transition: 'all 0.3s',
              }}>
                {p.label} {p.seconds}s
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 控制按钮 */}
      <div style={{ padding: '0 32px 32px', width: '100%', boxSizing: 'border-box' }}>
        <button onClick={toggle} style={{
          width: '100%', padding: '14px',
          background: running ? 'rgba(0,0,0,0.08)' : 'var(--color-primary)',
          color: running ? 'var(--color-text)' : '#fff',
          border: 'none', borderRadius: 'var(--radius-md)',
          fontSize: 15, fontWeight: 500, cursor: 'pointer',
          transition: 'all 0.3s',
        }}>
          {running ? '停止练习' : '开始练习'}
        </button>
      </div>
    </div>
  )
}

const backBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: 20,
  cursor: 'pointer', color: 'var(--color-text)', padding: '4px 8px 4px 0', lineHeight: 1,
}
