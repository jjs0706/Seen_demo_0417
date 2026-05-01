import { useState, Suspense, useRef, createContext, useCallback, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useNavigate } from 'react-router-dom'
import SandSprite from './SandSprite'
import { CELL, COLS, ROWS, OX, OZ, footprintCenter, worldToTopLeft } from './gridConfig'

export const OrbitCtx = createContext<React.RefObject<OrbitControlsImpl | null>>({ current: null })

const ALL_URLS = [
  '/sandbox/base.png',
  '/sandbox/house.png', '/sandbox/tent.png', '/sandbox/lighthouse.png', '/sandbox/fence.png', '/sandbox/sign.png',
  '/sandbox/cherry.png', '/sandbox/oak.png', '/sandbox/daisy.png', '/sandbox/silver.png', '/sandbox/foxtail.png', '/sandbox/crystal.png', '/sandbox/kite.png',
  '/sandbox/cat.png', '/sandbox/bird.png',
]
ALL_URLS.forEach(u => useTexture.preload(u))

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

// ── 相机捕获（供屏幕坐标转世界坐标用）────────────────────────
function CameraCapture({ camRef }: { camRef: React.MutableRefObject<THREE.Camera | null> }) {
  const { camera } = useThree()
  useEffect(() => { camRef.current = camera }, [camera, camRef])
  return null
}

// ── 放大后才能平移的平面 ──────────────────────────────────────
const ZOOM_THRESHOLD = 6.8
const PAN_LIMIT = 1.2

function PanPlane({ orbitRef }: { orbitRef: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree()
  const dragging = useRef(false)
  const lastClientX = useRef(0)

  const isZoomedIn = () => camera.position.distanceTo(
    orbitRef.current ? orbitRef.current.target : new THREE.Vector3()
  ) < ZOOM_THRESHOLD

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!isZoomedIn()) return
    e.stopPropagation()
    dragging.current = true
    lastClientX.current = e.nativeEvent.clientX
    if (orbitRef.current) orbitRef.current.enabled = false
  }

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || !orbitRef.current) return
    const ctrl = orbitRef.current
    const clientDx = e.nativeEvent.clientX - lastClientX.current
    lastClientX.current = e.nativeEvent.clientX
    const dist = camera.position.distanceTo(ctrl.target)
    const fovRad = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180)
    const worldPerPixel = (2 * Math.tan(fovRad / 2) * dist) / window.innerHeight
    const dx = clientDx * worldPerPixel
    const newX = Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, ctrl.target.x - dx))
    const actualDx = newX - ctrl.target.x
    ctrl.target.x += actualDx
    ctrl.object.position.x += actualDx
    ctrl.update()
  }

  const onPointerUp = () => {
    dragging.current = false
    if (orbitRef.current) orbitRef.current.enabled = true
  }

  useFrame(() => {
    const ctrl = orbitRef.current
    if (!ctrl) return
    ctrl.target.y = 0
    ctrl.target.z = 0
    if (!isZoomedIn()) {
      const snap = (0 - ctrl.target.x) * 0.1
      ctrl.target.x += snap
      ctrl.object.position.x += snap
      ctrl.update()
    }
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

// ── 素材目录 ──────────────────────────────────────────────────
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
      { id: 'cherry',  label: '樱花树', url: '/sandbox/cherry.png',  height: 0.75 },
      { id: 'oak',     label: '橡树',   url: '/sandbox/oak.png',     height: 0.70 },
      { id: 'daisy',   label: '小雏菊', url: '/sandbox/daisy.png',   height: 0.40 },
      { id: 'silver',  label: '银叶菊', url: '/sandbox/silver.png',  height: 0.28 },
      { id: 'foxtail', label: '狗尾草', url: '/sandbox/foxtail.png', height: 0.45 },
      { id: 'crystal', label: '水晶石', url: '/sandbox/crystal.png', height: 0.38 },
      { id: 'kite',    label: '风筝',   url: '/sandbox/kite.png',    height: 0.40 },
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
CATEGORIES[0].items = CATEGORIES.slice(1).flatMap(c => c.items)

type CatalogItem = typeof CATEGORIES[0]['items'][0]

interface PlacedItem {
  uid: string; url: string; height: number
  position: [number, number, number]
}

let uidCounter = 0

export default function SandPage() {
  const navigate = useNavigate()
  const orbitRef = useRef<OrbitControlsImpl>(null)
  const camRef = useRef<THREE.Camera | null>(null)
  const [items, setItems] = useState<PlacedItem[]>([])
  const [activeTab, setActiveTab] = useState('all')

  // 抽屉拖拽状态
  const [dragCatalog, setDragCatalog] = useState<CatalogItem | null>(null)
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 })
  const dragCatalogRef = useRef<CatalogItem | null>(null)

  const occupiedMap = useRef<Map<string, string>>(new Map())
  const currentItems = CATEGORIES.find(c => c.id === activeTab)?.items ?? []

  // ── 占用管理 ────────────────────────────────────────────────
  const freeCells = useCallback((uid: string) => {
    for (const [key, val] of occupiedMap.current)
      if (val === uid) occupiedMap.current.delete(key)
  }, [])

  const occupyCells = useCallback((uid: string, col: number, row: number, gw: number, gh: number) => {
    for (let c = col; c < col + gw; c++)
      for (let r = row; r < row + gh; r++)
        occupiedMap.current.set(`${c},${r}`, uid)
  }, [])

  const findFreeCell = useCallback((
    tc: number, tr: number, gw: number, gh: number, excludeUid: string
  ): [number, number] => {
    const isFree = (c: number, r: number) => {
      if (c < 0 || r < 0 || c + gw > COLS || r + gh > ROWS) return false
      for (let dc = 0; dc < gw; dc++)
        for (let dr = 0; dr < gh; dr++) {
          const occ = occupiedMap.current.get(`${c + dc},${r + dr}`)
          if (occ && occ !== excludeUid) return false
        }
      return true
    }
    if (isFree(tc, tr)) return [tc, tr]
    for (let radius = 1; radius <= Math.max(COLS, ROWS); radius++)
      for (let dc = -radius; dc <= radius; dc++)
        for (let dr = -radius; dr <= radius; dr++) {
          if (Math.abs(dc) !== radius && Math.abs(dr) !== radius) continue
          if (isFree(tc + dc, tr + dr)) return [tc + dc, tr + dr]
        }
    return [tc, tr]
  }, [])

  // ── 屏幕坐标 → 世界坐标 → 放置 ────────────────────────────
  const placeAtScreen = useCallback((clientX: number, clientY: number) => {
    const cat = dragCatalogRef.current
    if (!cat || !camRef.current) return

    const canvas = document.querySelector('canvas')
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return

    const ndx = ((clientX - rect.left) / rect.width) * 2 - 1
    const ndy = -((clientY - rect.top) / rect.height) * 2 + 1
    const ray = new THREE.Raycaster()
    ray.setFromCamera(new THREE.Vector2(ndx, ndy), camRef.current)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const pt = new THREE.Vector3()
    if (!ray.ray.intersectPlane(plane, pt)) return

    // 判断是否落在底座范围内
    const rawCol = (pt.x - OX) / CELL
    const rawRow = (pt.z - OZ) / CELL
    if (rawCol < 0 || rawRow < 0 || rawCol >= COLS || rawRow >= ROWS) return

    const [tc, tr] = worldToTopLeft(pt.x, pt.z, 1, 1)
    const newUid = `i${uidCounter++}`
    const [fc, fr] = findFreeCell(tc, tr, 1, 1, newUid)
    const [wx, wz] = footprintCenter(fc, fr, 1, 1)
    occupyCells(newUid, fc, fr, 1, 1)
    setItems(prev => [...prev, {
      uid: newUid, url: cat.url, height: cat.height, position: [wx, 0, wz],
    }])
  }, [findFreeCell, occupyCells])

  // ── 抽屉拖拽事件监听 ────────────────────────────────────────
  useEffect(() => {
    if (!dragCatalog) return
    const onMove = (e: PointerEvent) => setGhostPos({ x: e.clientX, y: e.clientY })
    const onUp = (e: PointerEvent) => {
      placeAtScreen(e.clientX, e.clientY)
      setDragCatalog(null)
      dragCatalogRef.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragCatalog, placeAtScreen])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundImage: 'url(/sandbox/bg01.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      userSelect: 'none',
    }}>
      {/* 关闭按钮 */}
      <button onClick={() => navigate(-1)} style={{
        position: 'absolute', top: 20, left: 20, zIndex: 10,
        width: 40, height: 40, borderRadius: 12,
        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
        border: 'none', fontSize: 18, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}>✕</button>

      {/* 拖拽中的幽灵图片 */}
      {dragCatalog && (
        <img
          src={dragCatalog.url}
          alt=""
          style={{
            position: 'fixed',
            left: ghostPos.x - 30,
            top: ghostPos.y - 44,
            width: 60, height: 60,
            objectFit: 'contain',
            pointerEvents: 'none',
            zIndex: 50,
            opacity: 0.85,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            transform: 'scale(1.15)',
          }}
        />
      )}

      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 5, 5], fov: 38 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <CameraCapture camRef={camRef} />
        <ambientLight intensity={1.8} />
        <directionalLight position={[5, 8, 5]} intensity={0.5} />

        <OrbitControls
          ref={orbitRef}
          enableRotate={false}
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={7.1}
          zoomSpeed={1.2}
          touches={{ ONE: THREE.TOUCH.DOLLY_PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
        />

        <PanPlane orbitRef={orbitRef} />

        <Suspense fallback={null}>
          <Base />
        </Suspense>

        <OrbitCtx.Provider value={orbitRef}>
          {items.map(item => (
            <Suspense key={item.uid} fallback={null}>
              <SandSprite
                uid={item.uid}
                textureUrl={item.url}
                height={item.height}
                gridW={1}
                gridH={1}
                initialPosition={item.position}
                freeCells={freeCells}
                occupyCells={occupyCells}
                findFreeCell={findFreeCell}
                onRemove={() => {
                  freeCells(item.uid)
                  setItems(prev => prev.filter(i => i.uid !== item.uid))
                }}
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
        {/* 提示文字 */}
        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', padding: '0 14px 8px', letterSpacing: '0.05em' }}>
          长按拖拽到沙盘放置 · 拖出底座删除
        </div>

        {/* 分类 Tab */}
        <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px', overflowX: 'auto' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)} style={{
              flexShrink: 0, padding: '4px 12px', borderRadius: 20,
              border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: activeTab === cat.id ? 'rgba(80,120,80,0.85)' : 'rgba(255,255,255,0.7)',
              color: activeTab === cat.id ? '#fff' : 'rgba(0,0,0,0.55)',
              boxShadow: activeTab === cat.id ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.15s',
            }}>{cat.label}</button>
          ))}
        </div>

        {/* 素材列表 */}
        <div style={{ display: 'flex', gap: 8, padding: '0 14px', overflowX: 'auto' }}>
          {currentItems.map(item => (
            <button
              key={item.id}
              onPointerDown={e => {
                e.preventDefault()
                dragCatalogRef.current = item
                setDragCatalog(item)
                setGhostPos({ x: e.clientX, y: e.clientY })
              }}
              style={{
                flexShrink: 0, width: 68, height: 80,
                background: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.85)',
                borderRadius: 14,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4, cursor: 'grab', padding: '6px 4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                touchAction: 'none',
              }}
            >
              <img src={item.url} alt={item.label}
                style={{ width: 40, height: 40, objectFit: 'contain', pointerEvents: 'none' }} />
              <span style={{ fontSize: 10, color: '#555', fontWeight: 500, pointerEvents: 'none' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
