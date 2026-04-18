// 梦境分析 — DeepSeek 分析梦境 + Pollinations 生成图画 → 挂到小屋
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { chat, generateImage } from '../../services/deepseek'
import { useAppStore } from '../../store/appStore'

type Stage = 'write' | 'analyzing' | 'result'

const ANALYSIS_PROMPT = `你是一位温和的梦境解析者，融合荣格心理学与东方意象诗学。
用户会描述他们的梦境，请你：
1. 用诗意温暖的语言，分析梦境的心理象征和情感意义（100字以内）
2. 在最后一行，单独输出一句英文图像描述，格式为：
[IMAGE: dreamy oil painting of ...]
这句英文将用于生成一幅梦境插画，要富有画面感，风格为油画或水彩。`

function extractImagePrompt(text: string): { analysis: string; prompt: string } {
  const match = text.match(/\[IMAGE:\s*(.+?)\]/i)
  if (match) {
    return {
      analysis: text.replace(/\[IMAGE:.*?\]/i, '').trim(),
      prompt: match[1].trim(),
    }
  }
  // 如果没有匹配到，用默认提示词
  return {
    analysis: text,
    prompt: 'dreamy watercolor painting of a surreal landscape with soft warm colors',
  }
}


export default function DreamPage() {
  const navigate = useNavigate()
  const addPainting = useAppStore(s => s.addPainting)
  const paintings = useAppStore(s => s.paintings)

  const [stage, setStage] = useState<Stage>('write')
  const [dreamText, setDreamText] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleAnalyze = async () => {
    if (!dreamText.trim()) return
    setStage('analyzing')
    setImageLoaded(false)
    setSaved(false)

    try {
      // Step 1: DeepSeek 分析梦境，生成图像描述
      const res = await chat([
        { role: 'system', content: ANALYSIS_PROMPT },
        { role: 'user', content: `我的梦境：${dreamText}` },
      ])
      const { analysis: analysisText, prompt } = extractImagePrompt(res)
      setAnalysis(analysisText)

      // Step 2: Gemini Imagen 生成图画
      const imagePrompt = prompt + ', oil painting, soft warm colors, dreamy, impressionist style'
      const url = await generateImage(imagePrompt)
      setImageUrl(url)
    } catch (e) {
      console.error(e)
      setAnalysis('梦境是内心深处的诗，即使无法完全解读，它也在用意象轻轻诉说着什么。')
      setImageUrl('')
    }
    setStage('result')
  }

  const handleSave = () => {
    if (saved) return
    addPainting({ imageUrl, dreamText, analysis })
    setSaved(true)
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
        <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>梦境分析</h1>
        {paintings.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-sub)' }}>
            已挂 {paintings.length} 幅画
          </span>
        )}
      </div>

      {/* 写梦境阶段 */}
      {stage === 'write' && (
        <div style={{ padding: '12px 16px 0' }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-sub)', lineHeight: 1.6, margin: '0 0 14px' }}>
            描述你记得的梦境片段，哪怕很模糊。AI 会为你解析意象，并生成一幅专属梦境画挂在小屋里。
          </p>
          <textarea
            value={dreamText}
            onChange={e => setDreamText(e.target.value)}
            placeholder="我梦见了..."
            rows={6}
            style={textareaStyle}
          />
          <button
            onClick={handleAnalyze}
            disabled={!dreamText.trim()}
            style={{ ...primaryBtnStyle, marginTop: 14, opacity: dreamText.trim() ? 1 : 0.45 }}
          >
            🌙 解析梦境
          </button>
        </div>
      )}

      {/* 分析中 */}
      {stage === 'analyzing' && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '60px 20px', gap: 16,
        }}>
          <div style={{ fontSize: 48, animation: 'spin 3s linear infinite' }}>🌙</div>
          <p style={{ fontSize: 14, color: 'var(--color-text-sub)' }}>正在解析梦境...</p>
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      )}

      {/* 结果阶段 */}
      {stage === 'result' && (
        <div style={{ padding: '16px' }}>
          {/* 梦境画 */}
          <div style={{
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
            background: 'var(--color-card)',
            marginBottom: 12,
            position: 'relative',
          }}>
            {!imageLoaded && imageUrl && (
              <div style={{
                height: 260,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8,
                color: 'var(--color-text-sub)', fontSize: 13,
              }}>
                <div style={{ fontSize: 32 }}>🎨</div>
                正在生成画作...
              </div>
            )}
            {!imageUrl && (
              <div style={{
                height: 120,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-text-sub)', fontSize: 13,
              }}>
                画作生成失败，但分析已保存
              </div>
            )}
            {imageUrl && (
              <img
                src={imageUrl}
                alt="梦境画"
                onLoad={() => setImageLoaded(true)}
                style={{
                  width: '100%',
                  display: imageLoaded ? 'block' : 'none',
                  borderRadius: 'var(--radius-lg)',
                }}
              />
            )}
          </div>

          {/* AI 分析 */}
          <div style={{
            background: 'var(--color-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            boxShadow: 'var(--shadow-card)',
            borderLeft: '3px solid hsl(230,50%,70%)',
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-sub)', marginBottom: 8 }}>梦境解析</div>
            <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.75, margin: 0 }}>
              {analysis}
            </p>
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saved || !imageLoaded}
              style={{
                ...primaryBtnStyle,
                flex: 1,
                opacity: saved || !imageLoaded ? 0.5 : 1,
              }}
            >
              {saved ? '✓ 已挂到小屋' : '🖼 挂到小屋'}
            </button>
            <button
              onClick={() => { setStage('write'); setDreamText(''); setImageUrl(''); setAnalysis('') }}
              style={{ ...ghostBtnStyle, padding: '14px 16px' }}
            >
              重新记录
            </button>
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
const ghostBtnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 'var(--radius-sm)', padding: '6px 14px',
  fontSize: 12, color: 'var(--color-text-sub)', cursor: 'pointer',
}
