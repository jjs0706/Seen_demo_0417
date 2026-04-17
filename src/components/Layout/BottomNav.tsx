import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/',        label: '首页', icon: '🏠' },
  { to: '/record',  label: '记录', icon: '✏️' },
  { to: '/stories', label: '疗愈', icon: '✨' },
  { to: '/cabin',   label: '小屋', icon: '🏡' },
  { to: '/me',      label: '我的', icon: '👤' },
]

export default function BottomNav() {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'var(--nav-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(0,0,0,0.06)',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            textDecoration: 'none',
            padding: '6px 16px',
            opacity: isActive ? 1 : 0.45,
            transition: 'opacity var(--transition-fast)',
          })}
        >
          <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.icon}</span>
          <span style={{
            fontSize: '10px',
            color: 'var(--color-text)',
            letterSpacing: '0.04em',
          }}>
            {tab.label}
          </span>
        </NavLink>
      ))}
    </nav>
  )
}
