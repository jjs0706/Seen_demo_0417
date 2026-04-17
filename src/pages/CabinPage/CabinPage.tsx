// ========================================
// 🔌 PLUGIN POINT — 小屋
// 接入方式：替换静态场景为真实 SVG 小屋编辑器
// 依赖数据：store.shells / store.paintings（AI挂画列表）
// ========================================

import { useAppStore } from '../../store/appStore'

export default function CabinPage() {
  const shells = useAppStore(s => s.shells)

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

      {/* 挂画墙占位 */}
      <div style={{
        margin: '8px 16px',
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <p style={{ fontSize: '12px', color: 'var(--color-text-sub)', marginBottom: '12px' }}>心灵挂画</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '80px',
                height: '96px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              🖼
            </div>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: 'var(--color-text-sub)', textAlign: 'center', marginTop: '10px' }}>
          完成沙盘或梦境记录后，AI 挂画将在这里展示
        </p>
      </div>

      {/* 小屋场景占位 */}
      <div style={{
        margin: '8px 16px',
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px 16px',
        boxShadow: 'var(--shadow-card)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🪴 🛋️ 💡</div>
        <p style={{ fontSize: '13px', color: 'var(--color-text-sub)' }}>
          小屋里的每一件物品，都是你与自己的约定。
        </p>
      </div>

      {/* 即将推出 */}
      <div style={{
        margin: '8px 16px',
        padding: '14px',
        background: 'rgba(0,0,0,0.03)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        gap: '10px',
      }}>
        {['⛰️ 沙盘创作', '🌙 梦境记录'].map(item => (
          <div
            key={item}
            style={{
              flex: 1,
              padding: '10px',
              background: 'var(--color-card)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--color-text-sub)',
              opacity: 0.6,
            }}
          >
            {item}
            <div style={{ fontSize: '10px', marginTop: '2px' }}>即将推出</div>
          </div>
        ))}
      </div>
    </div>
  )
}
