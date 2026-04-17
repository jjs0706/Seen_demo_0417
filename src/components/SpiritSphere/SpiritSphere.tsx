import { useState, useRef, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import './SpiritSphere.css'

interface SpiritSphereProps {
  isNight: boolean
  onTap?: () => void        // 🔌 单击回调（当前：跳转记录页）
  onLongPress?: () => void  // 🔌 长按回调（当前：呼吸引导，预留）
}

export default function SpiritSphere({ isNight, onTap, onLongPress }: SpiritSphereProps) {
  const [ripple, setRipple] = useState(false)
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)
  const controls = useAnimation()

  const startPress = () => {
    isLongPressRef.current = false
    controls.start({ scale: 0.95, transition: { duration: 0.15 } })

    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      setRipple(true)
      if (navigator.vibrate) navigator.vibrate([10, 50, 10])
      onLongPress?.()
    }, 800)
  }

  const endPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
    controls.start({ scale: 1, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } })

    if (ripple) {
      setTimeout(() => setRipple(false), 1500)
    } else if (!isLongPressRef.current) {
      onTap?.()
    }
  }

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current)
    }
  }, [])

  return (
    <div className="spirit-sphere-wrap">
      {/* 外环波纹（3层，错开延迟） */}
      {[0, 1.3, 2.6].map((delay, i) => (
        <motion.div
          key={i}
          className="sphere-ring"
          style={i === 2 ? { width: '190px', height: '190px' } : undefined}
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.35, 0.08, 0.35] }}
          transition={{ duration: 4, delay, ease: 'easeInOut', repeat: Infinity }}
        />
      ))}

      {/* 灵智球主体 */}
      <motion.div
        className="spirit-sphere"
        animate={controls}
        style={{ filter: isNight ? 'brightness(0.85)' : 'brightness(1)' }}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
      />

      {/* 长按涟漪 */}
      <div className="ripple-overlay">
        <motion.div
          className="ripple-circle"
          animate={ripple ? { scale: 8, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={ripple
            ? { duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }
            : { duration: 0.6 }}
        />
        <motion.div
          className="ripple-text"
          animate={ripple ? { opacity: 1 } : { opacity: 0 }}
          transition={ripple ? { delay: 0.6, duration: 0.8 } : { duration: 0.3 }}
        >
          看见自己
        </motion.div>
      </div>

      {/* 底部提示 */}
      <motion.div
        className="sphere-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1.5 }}
      >
        触碰，记录此刻
      </motion.div>
    </div>
  )
}
