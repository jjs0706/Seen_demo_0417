// ========================================
// 🔌 PLUGIN POINT — 疗愈中心
// 接入方式：将 MODULES 中的 placeholder 替换为实际页面路由
// 依赖数据：store.usageDays（渐进解锁判断）
// ========================================

import { useNavigate } from 'react-router-dom'

const MODULES = [
  { icon: '🐚', title: '三件好事',   subtitle: '晚潮的馈赠', to: '/healing/three-good', locked: false },
  { icon: '🫙', title: '漂流瓶',     subtitle: '倾诉释放',   to: '/healing/drift-bottle', locked: false },
  { icon: '🗼', title: '灯塔守护者', subtitle: '自悯回信',   to: '/healing/lighthouse',   locked: true,  unlockDay: 3 },
  { icon: '🌬️', title: '呼吸练习',  subtitle: '自然疗愈',   to: '/healing/breathe',      locked: false },
]

const DEEP_MODULES = [
  { icon: '⛰️', title: '沙盘创作', subtitle: '心理投射', locked: true, unlockDay: 7 },
  { icon: '🌙', title: '梦境分析', subtitle: '潜意识探索', locked: true, unlockDay: 7 },
]

export default function StoriesPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      paddingBottom: 'calc(var(--nav-height) + 16px)',
      background: 'var(--color-bg)',
    }}>
      <div style={{ padding: '20px 16px 8px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-text)' }}>疗愈中心</h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-sub)', marginTop: '4px' }}>
          循证心理干预，探索内心世界
        </p>
      </div>

      {/* 循证疗愈 2x2 */}
      <div style={{ padding: '8px 16px' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-text-sub)', marginBottom: '10px', letterSpacing: '0.06em' }}>
          循证疗愈
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {MODULES.map(m => (
            <button
              key={m.title}
              onClick={() => !m.locked && navigate(m.to)}
              style={{
                background: 'var(--color-card)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                textAlign: 'left',
                boxShadow: 'var(--shadow-sm)',
                opacity: m.locked ? 0.5 : 1,
                cursor: m.locked ? 'default' : 'pointer',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{m.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{m.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-sub)', marginTop: '2px' }}>{m.subtitle}</div>
              {m.locked && (
                <div style={{
                  position: 'absolute', top: '10px', right: '10px',
                  fontSize: '10px', color: 'var(--color-text-sub)',
                }}>
                  🔒 {m.unlockDay}天解锁
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 深度探索 */}
      <div style={{ padding: '8px 16px' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-text-sub)', marginBottom: '10px', letterSpacing: '0.06em' }}>
          深度探索
        </p>
        <div style={{
          background: 'var(--color-card)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {DEEP_MODULES.map((m, i) => (
            <div
              key={m.title}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                gap: '12px',
                borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                opacity: 0.5,
              }}
            >
              <span style={{ fontSize: '20px' }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>{m.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-sub)' }}>{m.subtitle}</div>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-sub)' }}>
                🔒 {m.unlockDay}天解锁
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 免责声明 */}
      <div style={{
        margin: '8px 16px',
        padding: '12px 14px',
        background: 'rgba(0,0,0,0.03)',
        borderRadius: 'var(--radius-md)',
        fontSize: '11px',
        color: 'var(--color-text-sub)',
        lineHeight: 1.6,
      }}>
        所有疗愈功能均基于循证心理学研究设计，仅供自我探索参考，不替代专业心理咨询。
      </div>
    </div>
  )
}
