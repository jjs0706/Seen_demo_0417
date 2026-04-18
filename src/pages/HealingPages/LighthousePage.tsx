// 灯塔守护者 — AI 情绪陪伴聊天，流式输出
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatStream, type Message } from '../../services/deepseek'

const SYSTEM_PROMPT = `你是「灯塔守护者」，一个温暖、有智慧的情绪陪伴者。
你的风格：
- 像一位老朋友，不评判，不说教
- 先共情感受，再温柔引导
- 语言简洁自然，不过度使用心理学术语
- 适时提问，帮助用户探索自己的内心
- 每次回复控制在80-120字

记住：你是陪伴者，不是心理医生。如果用户提到自伤倾向，温柔地建议寻求专业帮助。`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export default function LighthousePage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '你好，我在这里。今天想聊聊什么？无论是大事还是小事，都可以。🗼',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // 构造历史消息（发给 API）
    const history: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: text },
    ]

    // 先插入一条空的 assistant 消息，流式追加
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }])

    await chatStream(
      history,
      (chunk) => {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + chunk }
          }
          return updated
        })
      },
      () => {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, streaming: false }
          }
          return updated
        })
        setLoading(false)
      },
      () => {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant' && last.content === '') {
            updated[updated.length - 1] = {
              ...last,
              content: '网络有些波动，但我还在这里。可以再说一遍吗？',
              streaming: false,
            }
          }
          return updated
        })
        setLoading(false)
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg)',
    }}>
      {/* 顶部 */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '16px 16px 12px', gap: 8,
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: 'var(--color-card)',
      }}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>←</button>
        <div style={{ fontSize: 20 }}>🗼</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text)' }}>灯塔守护者</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-sub)' }}>
            {loading ? '正在回应...' : '随时陪伴你'}
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 12,
            }}
          >
            <div style={{
              maxWidth: '78%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user'
                ? '18px 18px 4px 18px'
                : '18px 18px 18px 4px',
              background: msg.role === 'user'
                ? 'var(--color-primary)'
                : 'var(--color-card)',
              color: msg.role === 'user' ? '#fff' : 'var(--color-text)',
              fontSize: 14,
              lineHeight: 1.6,
              boxShadow: 'var(--shadow-sm)',
            }}>
              {msg.content}
              {msg.streaming && <span style={{ opacity: 0.5 }}>▌</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 输入框 */}
      <div style={{
        padding: '10px 12px calc(10px + var(--nav-height))',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        background: 'var(--color-card)',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="说点什么..."
          rows={1}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 20,
            border: '1px solid rgba(0,0,0,0.1)',
            background: 'var(--color-bg)',
            fontSize: 14,
            color: 'var(--color-text)',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.5,
            fontFamily: 'inherit',
            maxHeight: 100,
            overflowY: 'auto',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{
            width: 40, height: 40,
            borderRadius: '50%',
            background: input.trim() && !loading ? 'var(--color-primary)' : 'rgba(0,0,0,0.08)',
            border: 'none', cursor: 'pointer',
            fontSize: 18, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}

const backBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: 20,
  cursor: 'pointer', color: 'var(--color-text)', padding: '4px 8px 4px 0', lineHeight: 1,
}
