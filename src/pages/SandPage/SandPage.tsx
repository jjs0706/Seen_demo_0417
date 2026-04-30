import { useState, Suspense, useRef, createContext } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useNavigate } from 'react-router-dom'
import SandSprite from './SandSprite'

// OrbitControls ref 共享给子组件
export const OrbitCtx = createContext<React.RefObject<OrbitControlsImpl | null>>({ current: null })

// 预加载所有贴图，防止添加时闪烁
useTexture.preload('/sandbox/base.png')
useTexture.preload('/sandbox/cherry.png')
useTexture.preload('/sandbox/oak.png')
useTexture.preload('/sandbox/daisy.png')
useTexture.preload('/sandbox/silver.png')

// ── 底座 ──────────────────────────────────────────────────────
function Base() {
  const texture = useTexture('/sandbox/base.png')
  const img = texture.image as HTMLImageElement | undefined
  const aspect = img ? img.naturalWidth / img.naturalHeight : 1
  const w = 3.8
  const d = w / aspect
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.05} />
    </mesh>
  )
}

// ── 素材目录 ──────────────────────────────────────────────────
const CATALOG = [
  { id: 'cherry', label: '樱花树', url: '/sandbox/cherry.png', height: 0.75 },
  { id: 'oak',    label: '橡树',   url: '/sandbox/oak.png',    height: 0.70 },
  { id: 'daisy',  label: '小雏菊', url: '/sandbox/daisy.png',  height: 0.40 },
  { id: 'silver', label: '银叶菊', url: '/sandbox/silver.png', height: 0.28 },
]

interface PlacedItem {
  uid: string
  url: string
  height: number
  position: [number, number, number]
}

let uid = 0

export default function SandPage() {
  const navigate = useNavigate()
  const orbitRef = useRef<OrbitControlsImpl>(null)
  const [items, setItems] = useState<PlacedItem[]>([])

  const addItem = (c: typeof CATALOG[0]) => {
    const x = (Math.random() - 0.5) * 1.6
    const z = (Math.random() - 0.5) * 1.0
    setItems(prev => [...prev, {
      uid: `i${uid++}`,
      url: c.url,
      height: c.height,
      position: [x, 0, z],
    }])
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(170deg, #cddcea 0%, #dde8dd 100%)',
    }}>
      {/* 关闭按钮 */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute', top: 20, left: 20, zIndex: 10,
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(8px)',
          border: 'none', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}
      >✕</button>

      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 5, 5], fov: 38 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <ambientLight intensity={1.8} />
        <directionalLight position={[5, 8, 5]} intensity={0.5} />

        <OrbitControls
          ref={orbitRef}
          enableRotate={false}
          enablePan={false}
          minDistance={4}
          maxDistance={10}
          target={[0, 0, 0]}
        />

        {/* 底座单独 Suspense，不受元素加载影响 */}
        <Suspense fallback={null}>
          <Base />
        </Suspense>

        {/* 每个元素单独 Suspense，互不影响 */}
        <OrbitCtx.Provider value={orbitRef}>
          {items.map(item => (
            <Suspense key={item.uid} fallback={null}>
              <SandSprite
                textureUrl={item.url}
                height={item.height}
                initialPosition={item.position}
              />
            </Suspense>
          ))}
        </OrbitCtx.Provider>
      </Canvas>

      {/* 底部抽屉 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 16px 36px',
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', marginBottom: 10, letterSpacing: '0.06em' }}>
          点击添加 · 拖拽移动
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {CATALOG.map(item => (
            <button
              key={item.id}
              onClick={() => addItem(item)}
              style={{
                flex: 1, height: 80,
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.8)',
                borderRadius: 14,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4, cursor: 'pointer', padding: '6px 4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <img src={item.url} alt={item.label}
                style={{ width: 42, height: 42, objectFit: 'contain' }} />
              <span style={{ fontSize: 10, color: '#555', fontWeight: 500 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
