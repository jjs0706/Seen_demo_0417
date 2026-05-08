import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../store/appStore'
import EmotionWheel, { type WheelValue } from './EmotionWheel'

// 情绪分数 → 表情 + 文字
const SCORE_DISPLAY: Record<number, { emoji: string; label: string }> = {
  1:  { emoji: '😢', label: '很低落' },
  2:  { emoji: '😢', label: '很低落' },
  3:  { emoji: '😔', label: '有些不舒服' },
  4:  { emoji: '😔', label: '有些不舒服' },
  5:  { emoji: '😐', label: '还好' },
  6:  { emoji: '😐', label: '还好' },
  7:  { emoji: '🙂', label: '不错' },
  8:  { emoji: '🙂', label: '不错' },
  9:  { emoji: '😄', label: '很棒！' },
  10: { emoji: '😄', label: '很棒！' },
}

// 情绪色谱插值（直接用 Token 对应的色值）
function scoreToHsl(score: number): string {
  if (score <= 2) return 'hsl(210, 20%, 70%)'
  if (score <= 4) return 'hsl(30, 15%, 65%)'
  if (score <= 6) return 'hsl(35, 50%, 60%)'
  if (score <= 8) return 'hsl(35, 80%, 60%)'
  return 'hsl(15, 70%, 60%)'
}

// 预设标签
const TAG_CATEGORIES = [
  { key: '工作', tags: ['压力大', '成就感', '疲惫', '焦虑'] },
  { key: '人际', tags: ['开心', '孤独', '被理解', '冲突'] },
  { key: '健康', tags: ['精力充沛', '身体不适', '睡眠好', '失眠'] },
  { key: '情感', tags: ['平静', '兴奋', '低落', '期待'] },
  { key: '生活', tags: ['充实', '无聊', '惊喜', '失望'] },
]

export default function RecordPage() {
  const navigate = useNavigate()
  const addRecord = useAppStore(s => s.addRecord)

  const [mode, setMode] = useState<'slider' | 'wheel'>('slider')
  const [score, setScore] = useState(5)
  const [wheelVal, setWheelVal] = useState<WheelValue>({ x: 0.5, y: 0, emotion: '愉悦' })
  const [activeCat, setActiveCat] = useState('工作')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [saved, setSaved] = useState(false)

  // 圆盘模式下将愉悦度映射到 1-10 分数
  const wheelScore = Math.round((wheelVal.x + 1) / 2 * 9) + 1
  const activeScore = mode === 'slider' ? score : Math.max(1, Math.min(10, wheelScore))
  const currentColor = scoreToHsl(activeScore)
  const { emoji, label } = SCORE_DISPLAY[activeScore]

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSave = () => {
    const finalScore = mode === 'slider' ? score : activeScore
    const finalTags = mode === 'wheel'
      ? [...new Set([wheelVal.emotion, ...selectedTags])]
      : selectedTags
    addRecord({ score: finalScore, tags: finalTags, description })
    setSaved(true)
    setTimeout(() => navigate('/'), 800)
  }

  const currentTags = TAG_CATEGORIES.find(c => c.key === activeCat)?.tags ?? []

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      paddingBottom: 'calc(var(--nav-height) + 24px)',
      background: 'var(--color-bg)',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px 8px',
        gap: '12px',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ fontSize: '20px', color: 'var(--color-text-sub)', padding: '4px' }}
        >
          ←
        </button>
        <h2 style={{ fontSize: '17px', color: 'var(--color-text)', fontWeight: 500 }}>
          记录当下
        </h2>
      </div>

      {/* 情绪卡片 */}
      <div style={{
        margin: '8px 16px',
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        boxShadow: 'var(--shadow-card)',
      }}>
        {/* 标题行 + 模式切换 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.span key={emoji} initial={{ scale: 0.6 }} animate={{ scale: 1 }} style={{ fontSize: 28 }}>
              {emoji}
            </motion.span>
            <motion.span key={activeScore} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              style={{ fontSize: 24, fontWeight: 600, color: currentColor }}>
              {activeScore}
            </motion.span>
            <span style={{ fontSize: 13, color: 'var(--color-text-sub)' }}>{label}</span>
          </div>
          {/* 模式切换按钮 */}
          <button
            onClick={() => setMode(m => m === 'slider' ? 'wheel' : 'slider')}
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              border: '1px solid rgba(0,0,0,0.1)',
              fontSize: 11,
              cursor: 'pointer',
              background: mode === 'wheel' ? 'var(--color-primary)' : 'rgba(0,0,0,0.04)',
              color: mode === 'wheel' ? 'white' : 'var(--color-text-sub)',
              transition: 'all 0.2s',
            }}
          >
            {mode === 'slider' ? '⭕ 情绪环' : '— 滑块'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'slider' ? (
            <motion.div key="slider"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}>
              <input
                type="range" min={1} max={10} value={score}
                onChange={e => setScore(Number(e.target.value))}
                style={{
                  width: '100%', height: '4px', borderRadius: '999px',
                  outline: 'none', cursor: 'pointer',
                  background: `linear-gradient(to right, ${currentColor} ${(score - 1) / 9 * 100}%, rgba(0,0,0,0.1) ${(score - 1) / 9 * 100}%)`,
                  WebkitAppearance: 'none', appearance: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--color-text-sub)' }}>
                <span>低落</span><span>很棒</span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="wheel"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}>
              <EmotionWheel value={wheelVal} onChange={setWheelVal} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 标签选择卡片 */}
      <div style={{
        margin: '8px 16px',
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <p style={{ fontSize: '13px', color: 'var(--color-text-sub)', marginBottom: '10px' }}>
          今天的感受
        </p>

        {/* 分类 Tab */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {TAG_CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setActiveCat(c.key)}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12px',
                background: activeCat === c.key ? 'var(--color-primary)' : 'rgba(0,0,0,0.06)',
                color: activeCat === c.key ? 'white' : 'var(--color-text-sub)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {c.key}
            </button>
          ))}
        </div>

        {/* 标签列表 */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <AnimatePresence mode="popLayout">
            {currentTags.map(tag => {
              const active = selectedTags.includes(tag)
              return (
                <motion.button
                  key={tag}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '13px',
                    background: active ? currentColor : 'rgba(0,0,0,0.06)',
                    color: active ? 'white' : 'var(--color-text)',
                    border: active ? 'none' : '1px solid rgba(0,0,0,0.06)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {tag}
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* 文字描述卡片 */}
      <div style={{
        margin: '8px 16px',
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <p style={{ fontSize: '13px', color: 'var(--color-text-sub)', marginBottom: '8px' }}>
          说点什么（可选）
        </p>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="今天发生了什么..."
          rows={3}
          style={{
            width: '100%',
            resize: 'none',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '14px',
            color: 'var(--color-text)',
            lineHeight: 1.6,
          }}
        />

        {/* 🔌 PLUGIN POINT — 多媒体
            接入方式：替换以下占位为 <VoiceRecorder> / <ImageUploader>
            依赖：MediaRecorder API / FileReader API
        */}
        <div style={{
          marginTop: '8px',
          display: 'flex',
          gap: '8px',
          opacity: 0.35,
        }}>
          <span style={{ fontSize: '18px' }}>🎤</span>
          <span style={{ fontSize: '18px' }}>📷</span>
        </div>
      </div>

      {/* 保存按钮 */}
      <div style={{ padding: '8px 16px 0' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saved}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: 'var(--radius-md)',
            background: saved ? 'var(--color-success)' : 'var(--color-primary)',
            color: 'white',
            fontSize: '15px',
            fontWeight: 500,
            letterSpacing: '0.04em',
            transition: 'background var(--transition-base)',
          }}
        >
          {saved ? '✓ 已保存' : '保存记录'}
        </motion.button>
      </div>
    </div>
  )
}
