// ========================================
// 🔌 PLUGIN POINT — 小屋
// 接入方式：替换静态场景为真实 SVG 小屋编辑器
// 依赖数据：store.shells / store.paintings（AI挂画列表）
// ========================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, type Painting } from '../../store/appStore'

// 挂画墙组件
function PaintingWall() {
  const paintings = useAppStore(s => s.paintings)
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Painting | null>(null)

  const slots = [paintings[0], paintings[1], paintings[2]]

  return (
    <div style={{
      margin: '8px 16px',
      background: 'var(--color-card)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px 20px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-sub)', margin: 0 }}>心灵挂画</p>
        <button
          onClick={() => navigate('/healing/dream')}
          style={{
            fontSize: 11, color: 'var(--color-primary)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          + 记录梦境
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {slots.map((p, i) => (
          <div
            key={i}
            onClick={() => p && setSelected(p)}
            style={{
              width: 88, height: 104,
              borderRadius: 8,
              overflow: 'hidden',
              background: 'rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
              cursor: p ? 'pointer' : 'default',
              boxShadow: p ? 'var(--shadow-sm)' : 'none',
              transition: 'transform 0.15s',
            }}
          >
            {p ? (
              <img src={p.imageUrl} alt="梦境画" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : '🖼'}
          </div>
        ))}
      </div>

      {paintings.length === 0 && (
        <p style={{ fontSize: 11, color: 'var(--color-text-sub)', textAlign: 'center', marginTop: 10 }}>
          完成梦境分析后，AI 画作将展示在这里
        </p>
      )}

      {/* 画作详情浮层 */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-card)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              maxWidth: 360, width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <img src={selected.imageUrl} alt="梦境画" style={{ width: '100%', display: 'block' }} />
            <div style={{ padding: '14px 16px 20px' }}>
              <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.7, margin: '0 0 10px' }}>
                {selected.analysis}
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-text-sub)', margin: 0, fontStyle: 'italic' }}>
                "{selected.dreamText.slice(0, 40)}{selected.dreamText.length > 40 ? '...' : ''}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CabinPage() {
  const shells = useAppStore(s => s.shells)
  const navigate = useNavigate()

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      paddingBottom: 'calc(var(--nav-height) + 16px)',
      background: 'var(--color-bg)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 16px 8px',
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-text)' }}>我的小屋</h1>
        <span style={{ fontSize: '13px', color: 'var(--color-text-sub)' }}>🐚 {shells}</span>
      </div>

      {/* 挂画墙 */}
      <PaintingWall />

      {/* 小屋背景图 */}
      <div
        onClick={() => navigate('/cabin/stage')}
        style={{
          margin: '8px 16px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
          cursor: 'pointer',
          position: 'relative',
          aspectRatio: '16/9',
        }}
      >
        <img
          src="/cabin-bg.png"
          alt="我的小屋"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 50%)',
          display: 'flex', alignItems: 'flex-end',
          padding: '14px 16px',
        }}>
          <div>
            <p style={{ fontSize: 15, color: '#fff', fontWeight: 500, margin: 0 }}>进入我的小屋</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>花海 · 春风 · 静谧空间</p>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 18, color: 'rgba(255,255,255,0.7)' }}>→</span>
        </div>
      </div>

      {/* 快捷入口 */}
      <div style={{ margin: '8px 16px', display: 'flex', gap: 10 }}>
        {[
          { icon: '⛰️', label: '沙盘创作', to: '/sand' },
          { icon: '🌙', label: '梦境分析', to: '/healing/dream' },
        ].map(item => (
          <div
            key={item.label}
            onClick={() => navigate(item.to)}
            style={{
              flex: 1, padding: '12px 10px',
              background: 'var(--color-card)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              fontSize: 12, color: 'var(--color-text)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
