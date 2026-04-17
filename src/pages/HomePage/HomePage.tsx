import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTimePhase } from '../../hooks/useTimePhase'
import { useAppStore } from '../../store/appStore'
import SpiritSphere from '../../components/SpiritSphere/SpiritSphere'

// 情绪分数 → CSS Token 颜色
function scoreToColor(score: number): string {
  if (score <= 2) return 'var(--emotion-1)'
  if (score <= 4) return 'var(--emotion-3)'
  if (score <= 6) return 'var(--emotion-5)'
  if (score <= 8) return 'var(--emotion-7)'
  return 'var(--emotion-9)'
}

// 日期显示：今天→"今", 其余→周几
function dayLabel(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  if (dateStr === today) return '今'
  const d = new Date(dateStr)
  return ['日','一','二','三','四','五','六'][d.getDay()]
}

export default function HomePage() {
  const navigate = useNavigate()
  const { greeting, isNight } = useTimePhase()
  const getRecentDays = useAppStore(s => s.getRecentDays)
  const recentDays = getRecentDays(7)

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 'var(--nav-height)',
      position: 'relative',
    }}>

      {/* 顶部问候语 */}
      <motion.p
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        style={{
          position: 'absolute',
          top: '14%',
          fontSize: '14px',
          letterSpacing: '0.08em',
          color: 'var(--text-secondary)',
        }}
      >
        {greeting}
      </motion.p>

      {/* 灵智球 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <SpiritSphere
          isNight={isNight}
          onTap={() => navigate('/record')}
          // 🔌 onLongPress → 未来可接入呼吸引导
        />
      </motion.div>

      {/* 底部 7 天日历浮层 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        style={{
          position: 'absolute',
          bottom: 'calc(var(--nav-height) + 20px)',
          left: '24px',
          right: '24px',
          background: isNight
            ? 'rgba(255,255,255,0.07)'
            : 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {recentDays.map(({ date, score }) => {
          const isToday = date === new Date().toISOString().split('T')[0]
          return (
            <div
              key={date}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/record')}
            >
              {/* 情绪色块 */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: score !== null
                  ? scoreToColor(score)
                  : isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                border: isToday ? '2px solid var(--color-primary)' : '2px solid transparent',
                transition: 'background var(--transition-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {score !== null && (
                  <span style={{ fontSize: '10px', color: 'white', fontWeight: 600 }}>
                    {score}
                  </span>
                )}
              </div>
              {/* 日期标签 */}
              <span style={{
                fontSize: '10px',
                color: isToday ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: isToday ? 600 : 400,
              }}>
                {dayLabel(date)}
              </span>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
