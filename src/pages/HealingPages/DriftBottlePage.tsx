// 漂流瓶 — 用户倾诉，AI 扮演陌生人回信
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { chat } from '../../services/deepseek'

type Stage = 'write' | 'floating' | 'reply'

const SYSTEM_PROMPT = `你正在扮演一个在海边捡到漂流瓶的陌生人。
瓶子里有一张纸条，上面写着一个人的心情或困扰。
请以陌生人的身份，用温柔、真诚、有一点诗意的语气回信。
不要给建议，不要说教，只是陪伴和共鸣。
回信控制在120字以内，用中文，可以有一点点文学感。`

export default function DriftBottlePage() {
  const navigate = useNavigate()
  const [stage, setStage] = useState<Stage>('write')
  const [text, setText] = useState('')
  const [reply, setReply] = useState('')

  const handleThrow = async () => {
    if (!text.trim()) return
    setStage('floating')
    try {
      const res = await chat([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `漂流瓶里写着：${text}` },
      ])
      setReply(res)
    } catch {
      setReply('海风带来了一个陌生人的声音：你不是一个人在漂流，我也在这片海上。🌊')
    }
    setTimeout(() => setStage('reply'), 1200)
  }

  const handleAgain = () => {
    setText('')
    setReply('')
    setStage('write')
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg)',
      paddingBottom: 'var(--nav-height)',
    }}>
      {/* 顶部 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 0', gap: 8 }}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>←</button>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>漂流瓶</h1>
      </div>

      {/* 写信阶段 */}
      {stage === 'write' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-sub)', lineHeight: 1.6, margin: '0 0 16px' }}>
            把今天想说的话写进漂流瓶，投入海里，也许会有人捡到，给你回信。
          </p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="写下你想说的话..."
            style={{ ...textareaStyle, flex: 1, minHeight: 200 }}
          />
          <button
            onClick={handleThrow}
            disabled={!text.trim()}
            style={{
              ...primaryBtnStyle,
              marginTop: 16,
              opacity: text.trim() ? 1 : 0.45,
            }}
          >
            🫙 投入大海
          </button>
        </div>
      )}

      {/* 漂流动画阶段 */}
      {stage === 'floating' && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          <div style={{
            fontSize: 64,
            animation: 'float 2s ease-in-out infinite',
          }}>🫙</div>
          <p style={{ fontSize: 14, color: 'var(--color-text-sub)' }}>漂流瓶已投入大海...</p>
          <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }`}</style>
        </div>
      )}

      {/* 回信阶段 */}
      {stage === 'reply' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div style={{
            background: 'var(--color-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: 'var(--shadow-card)',
            borderTop: '3px solid hsl(200,60%,65%)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-sub)', marginBottom: 12 }}>
              🌊 来自大海另一端的回信
            </div>
            <p style={{
              fontSize: 15, color: 'var(--color-text)',
              lineHeight: 1.8, margin: 0,
              fontStyle: 'italic',
            }}>
              {reply}
            </p>
          </div>

          {/* 原文 */}
          <div style={{
            margin: '12px 0',
            padding: '14px',
            background: 'rgba(0,0,0,0.03)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-sub)', marginBottom: 6 }}>你写的</div>
            <p style={{ fontSize: 13, color: 'var(--color-text-sub)', lineHeight: 1.6, margin: 0 }}>{text}</p>
          </div>

          <button onClick={handleAgain} style={{ ...primaryBtnStyle, marginTop: 8 }}>
            再投一个漂流瓶
          </button>
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
  padding: '12px', borderRadius: 'var(--radius-md)',
  border: '1px solid rgba(0,0,0,0.08)',
  background: 'var(--color-card)',
  fontSize: 14, color: 'var(--color-text)',
  resize: 'none', outline: 'none', lineHeight: 1.7,
  fontFamily: 'inherit',
}
const primaryBtnStyle: React.CSSProperties = {
  width: '100%', padding: '14px',
  background: 'var(--color-primary)', color: '#fff',
  border: 'none', borderRadius: 'var(--radius-md)',
  fontSize: 15, fontWeight: 500, cursor: 'pointer',
}
