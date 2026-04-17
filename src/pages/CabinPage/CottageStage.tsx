/**
 * CottageStage — 小屋场景
 * 以油画风花田图片为全屏背景
 */

import { useNavigate } from 'react-router-dom'

export default function CottageStage() {
  const navigate = useNavigate()

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundImage: 'url(/IMG_4472.JPG)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* 返回按钮 */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 16px',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.45) 0%, transparent 100%)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            fontSize: '20px',
            color: 'rgba(60,50,40,0.75)',
            padding: '4px',
          }}
        >
          ←
        </button>
        <span style={{
          fontSize: '16px',
          color: 'rgba(60,50,40,0.8)',
          fontWeight: 500,
        }}>
          我的小屋
        </span>
      </div>
    </div>
  )
}
