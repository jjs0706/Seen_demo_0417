// 三件好事 — 用户记录今天3件好事，AI 给予温暖回应
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { chat } from '../../services/deepseek'
import { useAppStore } from '../../store/appStore'

const SYSTEM_PROMPT = `你是一位温暖的心理陪伴者。用户会告诉你今天发生的三件好事。
请用真诚、温暖的语气回应，肯定他们的感受，引导他们感受生活中的美好。
回应要自然亲切，不要过度煽情，100字以内，用中文。`

export default function ThreeGoodPage() {
  const navigate = useNavigate()
  const addThreeGood = useAppStore(s => s.addThreeGood)
  const [goods, setGoods] = useState(['', '', ''])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const filled = goods.filter(g => g.trim()).length

  const handleSubmit = async () => {
    if (filled === 0) return
    setLoading(true)
    setReply('')
    try {
      const content = goods
        .filter(g => g.trim())
        .map((g, i) => `第${i + 1}件：${g}`)
        .join('\n')
      const res = await chat([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `今天的三件好事：\n${content}` },
      ])
      setReply(res)
      // 保存到 store
      addThreeGood({ goods: goods.filter(g => g.trim()), aiReply: res })
      setSaved(true)
    } catch {
      const fallback = '网络有些波动，但你记录的这些美好已经存在了 🌿'
      setReply(fallback)
      addThreeGood({ goods: goods.filter(g => g.trim()), aiReply: fallback })
      setSaved(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      paddingBottom: 'calc(var(--nav-height) + 24px)',
      background: 'var(--color-bg)',
    }}>
      {/* 顶部 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 0', gap: 8 }}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>←</button>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>三件好事</h1>
      </div>

      <p style={{ padding: '8px 20px 0', fontSize: 13, color: 'var(--color-text-sub)', lineHeight: 1.6 }}>
        回想今天，写下三件让你感到还不错的事，不需要多大，一杯好喝的咖啡也算。
      </p>

      {/* 输入区 */}
      <div style={{ padding: '16px' }}>
        {['第一件', '第二件', '第三件'].map((label, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-sub)', marginBottom: 4 }}>{label}</div>
            <textarea
              value={goods[i]}
              onChange={e => {
                const next = [...goods]
                next[i] = e.target.value
                setGoods(next)
              }}
              placeholder="写下这件事..."
              rows={2}
              style={textareaStyle}
            />
          </div>
        ))}
      </div>

      {/* 提交按钮 */}
      {!reply && (
        <div style={{ padding: '0 16px' }}>
          <button
            onClick={handleSubmit}
            disabled={filled === 0 || loading}
            style={{
              ...primaryBtnStyle,
              opacity: filled === 0 ? 0.45 : 1,
            }}
          >
            {loading ? '思考中...' : '完成记录 🐚'}
          </button>
        </div>
      )}

      {/* AI 回应 */}
      {reply && (
        <div style={{
          margin: '8px 16px 0',
          padding: '16px',
          background: 'var(--color-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          borderLeft: '3px solid var(--color-primary)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-sub)', marginBottom: 8 }}>来自 Healer 的回应</div>
          <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.7, margin: 0 }}>{reply}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => { setGoods(['', '', '']); setReply(''); setSaved(false) }}
              style={ghostBtnStyle}
            >
              再记一次
            </button>
            {saved && (
              <span style={{ fontSize: 12, color: 'var(--color-text-sub)', alignSelf: 'center' }}>
                ✓ 已保存
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const backBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: 20,
  cursor: 'pointer', color: 'var(--color-text)', padding: '4px 8px 4px 0', lineHeight: 1,
}
const textareaStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', borderRadius: 'var(--radius-md)',
  border: '1px solid rgba(0,0,0,0.08)',
  background: 'var(--color-card)',
  fontSize: 14, color: 'var(--color-text)',
  resize: 'none', outline: 'none', lineHeight: 1.6,
  fontFamily: 'inherit',
}
const primaryBtnStyle: React.CSSProperties = {
  width: '100%', padding: '14px',
  background: 'var(--color-primary)', color: '#fff',
  border: 'none', borderRadius: 'var(--radius-md)',
  fontSize: 15, fontWeight: 500, cursor: 'pointer',
}
const ghostBtnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 'var(--radius-sm)', padding: '6px 14px',
  fontSize: 12, color: 'var(--color-text-sub)', cursor: 'pointer',
}
