import { useState, Suspense, useRef, createContext } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useNavigate } from 'react-router-dom'
import SandSprite from './SandSprite'

// OrbitControls ref 共享给子组件
export const OrbitCtx = createContext<React.RefObject<OrbitControlsImpl | null>>({ current: null })

// 预加载所有贴图，防止添加时闪烁
const ALL_URLS = [
  '/sandbox/base03.png',
  '/sandbox/house.png','/sandbox/tent.png','/sandbox/lighthouse.png','/sandbox/fence.png','/sandbox/sign.png',
  '/sandbox/cherry.png','/sandbox/oak.png','/sandbox/daisy.png','/sandbox/silver.png','/sandbox/foxtail.png','/sandbox/crystal.png','/sandbox/kite.png',
  '/sandbox/cat.png','/sandbox/bird.png',
]
ALL_URLS.forEach(u => useTexture.preload(u))

// ── 底座 ──────────────────────────────────────────────────────
function Base() {
  const texture = useTexture('/sandbox/base03.png')
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

// ── 素材目录（分类）─────────────────────────────────────────
const CATEGORIES = [
  {
    label: '全部', id: 'all',
    items: [] as { id: string; label: string; url: string; height: number }[],
  },
  {
    label: '建筑', id: 'building',
    items: [
      { id: 'house',      label: '小屋',   url: '/sandbox/house.png',      height: 0.85 },
      { id: 'tent',       label: '帐篷',   url: '/sandbox/tent.png',       height: 0.75 },
      { id: 'lighthouse', label: '灯塔',   url: '/sandbox/lighthouse.png', height: 1.10 },
      { id: 'fence',      label: '栅栏',   url: '/sandbox/fence.png',      height: 0.35 },
      { id: 'sign',       label: '路牌',   url: '/sandbox/sign.png',       height: 0.45 },
    ],
  },
  {
    label: '自然', id: 'nature',
    items: [
      { id: 'cherry',   label: '樱花树', url: '/sandbox/cherry.png',   height: 0.75 },
      { id: 'oak',      label: '橡树',   url: '/sandbox/oak.png',      height: 0.70 },
      { id: 'daisy',    label: '小雏菊', url: '/sandbox/daisy.png',    height: 0.40 },
      { id: 'silver',   label: '银叶菊', url: '/sandbox/silver.png',   height: 0.28 },
      { id: 'foxtail',  label: '狗尾草', url: '/sandbox/foxtail.png',  height: 0.45 },
      { id: 'crystal',  label: '水晶石', url: '/sandbox/crystal.png',  height: 0.38 },
      { id: 'kite',     label: '风筝',   url: '/sandbox/kite.png',     height: 0.40 },
    ],
  },
  {
    label: '生物', id: 'creature',
    items: [
      { id: 'cat',  label: '猫咪', url: '/sandbox/cat.png',  height: 0.30 },
      { id: 'bird', label: '白鸟', url: '/sandbox/bird.png', height: 0.28 },
    ],
  },
]

// 补全「全部」分类
CATEGORIES[0].items = CATEGORIES.slice(1).flatMap(c => c.items)

type CatalogItem = typeof CATEGORIES[0]['items'][0]

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
  const [activeTab, setActiveTab] = useState('all')

  const currentItems = CATEGORIES.find(c => c.id === activeTab)?.items ?? []

  const addItem = (c: CatalogItem) => {
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
      backgroundImage: 'url(/sandbox/bg01.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
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
          enablePan={true}
          panSpeed={0.8}
          screenSpacePanning={true}
          enableZoom={true}
          minDistance={3}
          maxDistance={14}
          zoomSpeed={1.2}
          target={[0, 0, 0]}
          mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
          touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
          onChange={() => {
            const ctrl = orbitRef.current
            if (!ctrl) return
            // 锁死 Y/Z，只允许 X 轴在 [-2, 2] 内平移
            ctrl.target.y = 0
            ctrl.target.z = 0
            ctrl.target.x = Math.max(-2, Math.min(2, ctrl.target.x))
          }}
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
                onRemove={() => setItems(prev => prev.filter(i => i.uid !== item.uid))}
              />
            </Suspense>
          ))}
        </OrbitCtx.Provider>
      </Canvas>

      {/* 底部抽屉 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '12px 0 32px',
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
      }}>
        {/* 分类 Tab */}
        <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px', overflowX: 'auto' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              style={{
                flexShrink: 0,
                padding: '4px 12px',
                borderRadius: 20,
                border: 'none',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                background: activeTab === cat.id ? 'rgba(80,120,80,0.85)' : 'rgba(255,255,255,0.7)',
                color: activeTab === cat.id ? '#fff' : 'rgba(0,0,0,0.55)',
                boxShadow: activeTab === cat.id ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 素材列表 */}
        <div style={{ display: 'flex', gap: 8, padding: '0 14px', overflowX: 'auto' }}>
          {currentItems.map(item => (
            <button
              key={item.id}
              onClick={() => addItem(item)}
              style={{
                flexShrink: 0,
                width: 68, height: 80,
                background: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.85)',
                borderRadius: 14,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4, cursor: 'pointer', padding: '6px 4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <img src={item.url} alt={item.label}
                style={{ width: 40, height: 40, objectFit: 'contain' }} />
              <span style={{ fontSize: 10, color: '#555', fontWeight: 500 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
