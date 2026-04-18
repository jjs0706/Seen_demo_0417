import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, type EmotionRecord } from '../../store/appStore'

// 情绪分 → 颜色（与 RecordPage 保持一致）
function scoreToColor(score: number): string {
  if (score <= 2) return 'hsl(210,20%,70%)'
  if (score <= 4) return 'hsl(30,15%,65%)'
  if (score <= 6) return 'hsl(35,50%,60%)'
  if (score <= 8) return 'hsl(35,80%,60%)'
  return 'hsl(15,70%,60%)'
}

// 情绪分 → 文字标签
function scoreToLabel(score: number): string {
  if (score <= 2) return '很低落'
  if (score <= 4) return '有些难'
  if (score <= 6) return '还好'
  if (score <= 8) return '不错'
  return '很好'
}

// timestamp → 格式化时间
function formatTime(ts: number): string {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

// timestamp → 日期分组 key
function formatDateKey(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return '今天'
  if (d.toDateString() === yesterday.toDateString()) return '昨天'

  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// 按日期分组
function groupByDate(records: EmotionRecord[]): { label: string; items: EmotionRecord[] }[] {
  const map = new Map<string, EmotionRecord[]>()
  for (const r of records) {
    const key = formatDateKey(r.createdAt)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

// 展开的详情卡
function RecordDetail({ record }: { record: EmotionRecord }) {
  const color = scoreToColor(record.score)
  return (
    <div style={{
      marginTop: 8,
      padding: '12px 14px',
      background: 'rgba(0,0,0,0.03)',
      borderRadius: 'var(--radius-sm)',
      borderLeft: `3px solid ${color}`,
    }}>
      {record.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {record.tags.map(tag => (
            <span key={tag} style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 20,
              background: color + '33',
              color: 'var(--color-text)',
            }}>{tag}</span>
          ))}
        </div>
      )}
      {record.description ? (
        <p style={{
          fontSize: 13,
          color: 'var(--color-text)',
          lineHeight: 1.6,
          margin: 0,
          whiteSpace: 'pre-wrap',
        }}>{record.description}</p>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--color-text-sub)', margin: 0 }}>没有文字记录</p>
      )}
    </div>
  )
}

// 单条记录行
function RecordRow({ record }: { record: EmotionRecord }) {
  const [expanded, setExpanded] = useState(false)
  const color = scoreToColor(record.score)

  return (
    <div
      onClick={() => setExpanded(v => !v)}
      style={{
        padding: '12px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* 情绪色圆点 + 分数 */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontWeight: 700,
          fontSize: 14,
          color: '#fff',
        }}>
          {record.score}
        </div>

        {/* 主信息 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: 'var(--color-text)', fontWeight: 500 }}>
            {scoreToLabel(record.score)}
          </div>
          <div style={{
            fontSize: 12,
            color: 'var(--color-text-sub)',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {record.description || (record.tags.length > 0 ? record.tags.join('・') : '无备注')}
          </div>
        </div>

        {/* 时间 + 展开箭头 */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-sub)' }}>
            {formatTime(record.createdAt)}
          </div>
          <div style={{
            fontSize: 10,
            color: 'var(--color-text-sub)',
            marginTop: 2,
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}>▾</div>
        </div>
      </div>

      {expanded && <RecordDetail record={record} />}
    </div>
  )
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { records } = useAppStore()
  const groups = groupByDate(records)

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      paddingBottom: 'calc(var(--nav-height) + 16px)',
      background: 'var(--color-bg)',
    }}>
      {/* 顶部导航 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 16px 8px',
        gap: 8,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: 'var(--color-text)',
            padding: '4px 8px 4px 0',
            lineHeight: 1,
          }}
        >←</button>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>
          情绪记录
        </h1>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-sub)' }}>
          共 {records.length} 条
        </span>
      </div>

      {/* 空状态 */}
      {records.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 80,
          gap: 8,
        }}>
          <div style={{ fontSize: 40 }}>🌱</div>
          <div style={{ fontSize: 14, color: 'var(--color-text-sub)' }}>还没有记录</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-sub)' }}>回到首页，点击灵智球开始记录</div>
        </div>
      )}

      {/* 按日期分组列表 */}
      {groups.map(group => (
        <div key={group.label} style={{ marginTop: 16 }}>
          {/* 日期标题 */}
          <div style={{
            padding: '0 16px 8px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--color-text-sub)',
            letterSpacing: '0.05em',
          }}>
            {group.label}
          </div>

          {/* 记录卡片 */}
          <div style={{
            margin: '0 16px',
            background: 'var(--color-card)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
          }}>
            {group.items.map(record => (
              <RecordRow key={record.id} record={record} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
