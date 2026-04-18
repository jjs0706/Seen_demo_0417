// ========================================
// 🔌 PLUGIN POINT — 我的
// 接入方式：添加个人资料编辑、通知设置、数据导出等
// 依赖数据：store.records / store.shells
// ========================================

import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'

export default function MePage() {
  const navigate = useNavigate()
  const { shells, records } = useAppStore()

  const usageDays = (() => {
    if (records.length === 0) return 0
    const first = records[records.length - 1].createdAt
    return Math.floor((Date.now() - first) / (1000 * 60 * 60 * 24)) + 1
  })()

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      paddingBottom: 'calc(var(--nav-height) + 16px)',
      background: 'var(--color-bg)',
    }}>
      <div style={{ padding: '20px 16px 8px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-text)' }}>我的</h1>
      </div>

      {/* 统计卡片 */}
      <div style={{
        margin: '8px 16px',
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-around',
        boxShadow: 'var(--shadow-card)',
      }}>
        {[
          { value: records.length, label: '记录次数' },
          { value: usageDays,       label: '使用天数' },
          { value: shells,          label: '🐚 贝壳' },
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-primary)' }}>
              {item.value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-sub)', marginTop: '2px' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* 功能入口 */}
      <div style={{
        margin: '8px 16px',
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div
          onClick={() => navigate('/history')}
          style={{
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>📋 情绪记录</span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-sub)' }}>查看全部 →</span>
        </div>
      </div>

      {/* 🔌 设置项占位 */}
      <div style={{
        margin: '8px 16px',
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {['通知提醒', '数据导出', '清除数据'].map((item, i) => (
          <div
            key={item}
            style={{
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none',
              opacity: 0.45,
            }}
          >
            <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>{item}</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-sub)' }}>即将推出 →</span>
          </div>
        ))}
      </div>

      {/* 免责声明 */}
      <p style={{
        margin: '16px',
        fontSize: '11px',
        color: 'var(--color-text-sub)',
        lineHeight: 1.6,
        textAlign: 'center',
      }}>
        Healer 是情绪管理辅助工具，不替代专业心理咨询。
        <br />如你正在经历严重困扰，请寻求专业帮助。
      </p>
    </div>
  )
}
