import { useState, Suspense, useRef, createContext, useCallback, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useNavigate } from 'react-router-dom'

// ── 网格配置（室内场景用稍小的格子）────────────────────────────
const CELL = 0.32
const COLS = 10
const ROWS = 8
const OX = -(COLS * CELL) / 2
const OZ = -(ROWS * CELL) / 2

function footprintCenter(col: number, row: number): [number, number] {
  return [OX + (col + 0.5) * CELL, OZ + (row + 0.5) * CELL]
}
function worldToTopLeft(wx: number, wz: number): [number, number] {
  return [
    Math.max(0, Math.min(COLS - 1, Math.round((wx - OX) / CELL - 0.5))),
    Math.max(0, Math.min(ROWS - 1, Math.round((wz - OZ) / CELL - 0.5))),
  ]
}
function isOutOfBounds(x: number, z: number) {
  const m = CELL * 0.5
  return x < OX - m || x > OX + COLS * CELL + m || z < OZ - m || z > OZ + ROWS * CELL + m
}

export const CabinOrbitCtx = createContext<React.RefObject<OrbitControlsImpl | null>>({ current: null })

// ── 底座（小屋外观图作底）───────────────────────────────────────
function CabinBase() {
  const texture = useTexture('/cabin-items/椰子小屋1remove.png')
  const img = texture.image as HTMLImageElement | undefined
  const aspect = img ? img.naturalWidth / img.naturalHeight : 1
  const w = COLS * CELL + 0.4
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[w, w / aspect]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.05} />
    </mesh>
  )
}

// ── 相机捕获 ────────────────────────────────────────────────────
function CameraCapture({ camRef }: { camRef: React.MutableRefObject<THREE.Camera | null> }) {
  const { camera } = useThree()
  useEffect(() => { camRef.current = camera }, [camera, camRef])
  return null
}

// ── 放大后平移平面 ───────────────────────────────────────────────
const ZOOM_THRESHOLD = 6.5
const PAN_LIMIT = 1.0

function PanPlane({ orbitRef }: { orbitRef: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree()
  const dragging = useRef(false)
  const lastClientX = useRef(0)

  const isZoomedIn = () => camera.position.distanceTo(
    orbitRef.current ? orbitRef.current.target : new THREE.Vector3()
  ) < ZOOM_THRESHOLD

  const onPD = (e: ThreeEvent<PointerEvent>) => {
    if (!isZoomedIn()) return
    e.stopPropagation()
    dragging.current = true
    lastClientX.current = e.nativeEvent.clientX
    if (orbitRef.current) orbitRef.current.enabled = false
  }
  const onPM = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || !orbitRef.current) return
    const ctrl = orbitRef.current
    const dx = (e.nativeEvent.clientX - lastClientX.current)
    lastClientX.current = e.nativeEvent.clientX
    const dist = camera.position.distanceTo(ctrl.target)
    const fov = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180
    const wpx = (2 * Math.tan(fov / 2) * dist) / window.innerHeight
    const newX = Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, ctrl.target.x - dx * wpx))
    const ddx = newX - ctrl.target.x
    ctrl.target.x += ddx; ctrl.object.position.x += ddx; ctrl.update()
  }
  const onPU = () => { dragging.current = false; if (orbitRef.current) orbitRef.current.enabled = true }

  useFrame(() => {
    const ctrl = orbitRef.current
    if (!ctrl) return
    ctrl.target.y = 0; ctrl.target.z = 0
    if (!isZoomedIn()) {
      const s = (0 - ctrl.target.x) * 0.1
      ctrl.target.x += s; ctrl.object.position.x += s; ctrl.update()
    }
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}
      onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU} onPointerLeave={onPU}>
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

// ── 家具精灵 ────────────────────────────────────────────────────
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

function FurnitureSprite({
  uid, textureUrl, height, initialPosition, onRemove,
  freeCells, occupyCells, findFreeCell,
}: {
  uid: string; textureUrl: string; height: number
  initialPosition: [number, number, number]
  onRemove?: () => void
  freeCells: (uid: string) => void
  occupyCells: (uid: string, col: number, row: number) => void
  findFreeCell: (col: number, row: number, excludeUid: string) => [number, number]
}) {
  const texture = useTexture(textureUrl)
  const { camera, gl } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const [dragging, setDragging] = useState(false)
  const orbitRef = useContext(CabinOrbitCtx)
  const dragOffset = useRef(new THREE.Vector3())
  const alphaCanvas = useRef<HTMLCanvasElement | null>(null)
  const alphaCtx2d = useRef<CanvasRenderingContext2D | null>(null)

  const img = texture.image as HTMLImageElement | undefined
  const aspect = img ? img.naturalWidth / img.naturalHeight : 1
  const w = height * aspect
  const GROUND_Y = 0.01
  const centerY = GROUND_Y + height / 2

  useEffect(() => {
    const image = texture.image as HTMLImageElement | null
    if (!image) return
    const c = document.createElement('canvas')
    c.width = image.naturalWidth || 64; c.height = image.naturalHeight || 64
    const ctx = c.getContext('2d'); if (!ctx) return
    ctx.drawImage(image, 0, 0, c.width, c.height)
    alphaCanvas.current = c; alphaCtx2d.current = ctx
  }, [texture])

  const isTransparent = useCallback((uv: THREE.Vector2) => {
    const ctx = alphaCtx2d.current, c = alphaCanvas.current
    if (!ctx || !c) return false
    const px = Math.floor(uv.x * c.width), py = Math.floor((1 - uv.y) * c.height)
    const d = ctx.getImageData(Math.max(0, Math.min(c.width-1, px)), Math.max(0, Math.min(c.height-1, py)), 1, 1).data
    return d[3] < 30
  }, [])

  const screenToGround = useCallback((cx: number, cy: number) => {
    const rect = gl.domElement.getBoundingClientRect()
    const ndx = ((cx - rect.left) / rect.width) * 2 - 1
    const ndy = -((cy - rect.top) / rect.height) * 2 + 1
    const ray = new THREE.Raycaster()
    ray.setFromCamera(new THREE.Vector2(ndx, ndy), camera)
    const pt = new THREE.Vector3()
    return ray.ray.intersectPlane(dragPlane, pt) ? pt : null
  }, [camera, gl])

  useFrame(({ camera: cam }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.atan2(
      cam.position.x - groupRef.current.position.x,
      cam.position.z - groupRef.current.position.z
    )
    const ty = dragging ? centerY + 0.12 : centerY
    groupRef.current.position.y += (ty - groupRef.current.position.y) * 0.18
  })

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.uv && isTransparent(e.uv)) return
    e.stopPropagation()
    if (!groupRef.current) return
    const pt = screenToGround(e.nativeEvent.clientX, e.nativeEvent.clientY)
    if (pt) dragOffset.current.set(groupRef.current.position.x - pt.x, 0, groupRef.current.position.z - pt.z)
    freeCells(uid)
    if (orbitRef.current) orbitRef.current.enabled = false
    setDragging(true)

    const onMove = (ev: PointerEvent) => {
      if (!groupRef.current) return
      const hit = screenToGround(ev.clientX, ev.clientY)
      if (hit) {
        groupRef.current.position.x = hit.x + dragOffset.current.x
        groupRef.current.position.z = hit.z + dragOffset.current.z
      }
    }
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (orbitRef.current) orbitRef.current.enabled = true
      setDragging(false)
      if (!groupRef.current) return
      const { x, z } = groupRef.current.position
      const rect = gl.domElement.getBoundingClientRect()
      const outside = ev.clientX < rect.left || ev.clientX > rect.right || ev.clientY < rect.top || ev.clientY > rect.bottom
      if (outside || isOutOfBounds(x, z)) { onRemove?.(); return }
      const [tc, tr] = worldToTopLeft(x, z)
      const [fc, fr] = findFreeCell(tc, tr, uid)
      const [cx2, cz2] = footprintCenter(fc, fr)
      groupRef.current.position.x = cx2; groupRef.current.position.z = cz2
      occupyCells(uid, fc, fr)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [isTransparent, screenToGround, freeCells, uid, orbitRef, gl, findFreeCell, occupyCells, onRemove])

  return (
    <group ref={groupRef} position={[initialPosition[0], centerY, initialPosition[2]]} onPointerDown={onPointerDown}>
      <mesh>
        <planeGeometry args={[w, height]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.05} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ── 素材目录 ────────────────────────────────────────────────────
const CABIN_ITEMS = [
  { id: 'house',   label: '小屋',  url: '/cabin-items/椰子小屋1remove.png', height: 1.10 },
  { id: 'chair',   label: '椅子',  url: '/cabin-items/椅子remove1.png',     height: 0.42 },
  { id: 'lamp',    label: '灯',    url: '/cabin-items/灯remove1.png',       height: 0.55 },
  { id: 'window1', label: '窗户1', url: '/cabin-items/窗户remove1.png',     height: 0.50 },
  { id: 'window2', label: '窗户2', url: '/cabin-items/窗户remove2.png',     height: 0.50 },
  { id: 'window3', label: '窗户3', url: '/cabin-items/窗户remove3.png',     height: 0.50 },
  { id: 'plant',   label: '绿植',  url: '/cabin-items/绿植remove1.png',     height: 0.48 },
  { id: 'teapot',  label: '茶壶',  url: '/cabin-items/茶壶remove2.png',     height: 0.28 },
  { id: 'teacup',  label: '茶杯',  url: '/cabin-items/茶杯remove1.png',     height: 0.22 },
]

CABIN_ITEMS.forEach(i => useTexture.preload(i.url))
useTexture.preload('/cabin-items/椰子小屋1remove.png')

interface PlacedItem {
  uid: string; url: string; height: number
  position: [number, number, number]
}

let uidCounter = 0

export default function CabinDecoPage() {
  const navigate = useNavigate()
  const orbitRef = useRef<OrbitControlsImpl>(null)
  const camRef = useRef<THREE.Camera | null>(null)
  const [items, setItems] = useState<PlacedItem[]>([])
  const occupiedMap = useRef<Map<string, string>>(new Map())

  // 抽屉拖拽
  const [dragItem, setDragItem] = useState<typeof CABIN_ITEMS[0] | null>(null)
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 })
  const dragItemRef = useRef<typeof CABIN_ITEMS[0] | null>(null)

  // ── 占用管理 ──
  const freeCells = useCallback((uid: string) => {
    for (const [k, v] of occupiedMap.current) if (v === uid) occupiedMap.current.delete(k)
  }, [])
  const occupyCells = useCallback((uid: string, col: number, row: number) => {
    occupiedMap.current.set(`${col},${row}`, uid)
  }, [])
  const findFreeCell = useCallback((tc: number, tr: number, excludeUid: string): [number, number] => {
    const isFree = (c: number, r: number) => {
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return false
      const o = occupiedMap.current.get(`${c},${r}`)
      return !o || o === excludeUid
    }
    if (isFree(tc, tr)) return [tc, tr]
    for (let rad = 1; rad <= Math.max(COLS, ROWS); rad++)
      for (let dc = -rad; dc <= rad; dc++)
        for (let dr = -rad; dr <= rad; dr++) {
          if (Math.abs(dc) !== rad && Math.abs(dr) !== rad) continue
          if (isFree(tc + dc, tr + dr)) return [tc + dc, tr + dr]
        }
    return [tc, tr]
  }, [])

  // ── 屏幕坐标放置 ──
  const placeAtScreen = useCallback((clientX: number, clientY: number) => {
    const cat = dragItemRef.current
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
    const rawCol = (pt.x - OX) / CELL, rawRow = (pt.z - OZ) / CELL
    if (rawCol < 0 || rawRow < 0 || rawCol >= COLS || rawRow >= ROWS) return
    const [tc, tr] = worldToTopLeft(pt.x, pt.z)
    const newUid = `c${uidCounter++}`
    const [fc, fr] = findFreeCell(tc, tr, newUid)
    const [wx, wz] = footprintCenter(fc, fr)
    occupyCells(newUid, fc, fr)
    setItems(prev => [...prev, { uid: newUid, url: cat.url, height: cat.height, position: [wx, 0, wz] }])
  }, [findFreeCell, occupyCells])

  useEffect(() => {
    if (!dragItem) return
    const onMove = (e: PointerEvent) => setGhostPos({ x: e.clientX, y: e.clientY })
    const onUp = (e: PointerEvent) => {
      placeAtScreen(e.clientX, e.clientY)
      setDragItem(null); dragItemRef.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [dragItem, placeAtScreen])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(160deg, #f5ede0 0%, #e8d5c0 100%)',
      userSelect: 'none',
    }}>
      {/* 关闭 */}
      <button onClick={() => navigate(-1)} style={{
        position: 'absolute', top: 20, left: 20, zIndex: 10,
        width: 40, height: 40, borderRadius: 12,
        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
        border: 'none', fontSize: 18, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}>✕</button>

      {/* 幽灵图 */}
      {dragItem && (
        <img src={dragItem.url} alt="" style={{
          position: 'fixed', left: ghostPos.x - 30, top: ghostPos.y - 44,
          width: 60, height: 60, objectFit: 'contain',
          pointerEvents: 'none', zIndex: 50, opacity: 0.85,
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
          transform: 'scale(1.15)',
        }} />
      )}

      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 5, 5], fov: 38 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <CameraCapture camRef={camRef} />
        <ambientLight intensity={2.0} />
        <directionalLight position={[4, 8, 4]} intensity={0.6} />

        <OrbitControls
          ref={orbitRef}
          enableRotate={false} enablePan={false} enableZoom
          minDistance={3} maxDistance={7.1} zoomSpeed={1.2}
          touches={{ ONE: THREE.TOUCH.DOLLY_PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
        />
        <PanPlane orbitRef={orbitRef} />

        <Suspense fallback={null}>
          <CabinBase />
        </Suspense>

        <CabinOrbitCtx.Provider value={orbitRef}>
          {items.map(item => (
            <Suspense key={item.uid} fallback={null}>
              <FurnitureSprite
                uid={item.uid} textureUrl={item.url} height={item.height}
                initialPosition={item.position}
                freeCells={freeCells} occupyCells={occupyCells} findFreeCell={findFreeCell}
                onRemove={() => { freeCells(item.uid); setItems(prev => prev.filter(i => i.uid !== item.uid)) }}
              />
            </Suspense>
          ))}
        </CabinOrbitCtx.Provider>
      </Canvas>

      {/* 底部抽屉 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '12px 0 32px',
        background: 'rgba(255,248,240,0.6)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,220,180,0.5)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', padding: '0 14px 8px', letterSpacing: '0.05em' }}>
          长按拖拽到小屋放置 · 拖出删除
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '0 14px', overflowX: 'auto' }}>
          {CABIN_ITEMS.map(item => (
            <button
              key={item.id}
              onPointerDown={e => {
                e.preventDefault()
                dragItemRef.current = item
                setDragItem(item)
                setGhostPos({ x: e.clientX, y: e.clientY })
              }}
              style={{
                flexShrink: 0, width: 72, height: 84,
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(200,160,100,0.2)',
                borderRadius: 14,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4, cursor: 'grab', padding: '6px 4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                touchAction: 'none',
              }}
            >
              <img src={item.url} alt={item.label}
                style={{ width: 44, height: 44, objectFit: 'contain', pointerEvents: 'none' }} />
              <span style={{ fontSize: 10, color: '#7a5c3a', fontWeight: 500, pointerEvents: 'none' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
