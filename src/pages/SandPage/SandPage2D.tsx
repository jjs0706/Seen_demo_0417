import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// ── 网格配置 ─────────────────────────────────────────────────
const COLS = 14
const ROWS = 12
const CELL = 24       // px / 格
const PAD  = 20       // 底座图和网格边缘的留白

const GRID_W = COLS * CELL          // 336
const GRID_H = ROWS * CELL          // 288
const BASE_W = GRID_W + PAD * 2     // 376
const BASE_H = GRID_H + PAD * 2     // 328

// 格子中心 → 底座坐标
function cellCenter(col: number, row: number): [number, number] {
  return [PAD + (col + 0.5) * CELL, PAD + (row + 0.5) * CELL]
}

// 底座坐标 → 最近格子
function coordToCell(bx: number, by: number): [number, number] {
  const col = Math.round((bx - PAD) / CELL - 0.5)
  const row = Math.round((by - PAD) / CELL - 0.5)
  return [
    Math.max(0, Math.min(COLS - 1, col)),
    Math.max(0, Math.min(ROWS - 1, row)),
  ]
}

// 是否在底座范围内（margin = 允许多伸出多少 px）
function isOnBase(bx: number, by: number, margin = 0): boolean {
  return bx >= -margin && bx <= BASE_W + margin &&
         by >= -margin && by <= BASE_H + margin
}

// 3D world unit → 像素高度（延用原始 height 数值）
const WORLD_TO_PX = CELL / 0.30   // ≈ 80 px / unit

// ── 素材目录 ────────────────────────────────────────────────
const CATEGORIES = [
  { label: '全部', id: 'all', items: [] as CatalogItem[] },
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

type CatalogItem = { id: string; label: string; url: string; height: number }

interface PlacedItem {
  uid: string; url: string; height: number
  bx: number; by: number   // 底座坐标中心
  col: number; row: number
}

let uidCounter = 0

// ── 单个物品 ─────────────────────────────────────────────────
function SandItem({
  item, baseRef,
  freeCells, occupyCell, findFreeCell,
  onRemove, onSnap,
}: {
  item: PlacedItem
  baseRef: React.RefObject<HTMLDivElement | null>
  freeCells: (uid: string) => void
  occupyCell: (uid: string, col: number, row: number) => void
  findFreeCell: (col: number, row: number, uid: string) => [number, number]
  onRemove: () => void
  onSnap: (bx: number, by: number, col: number, row: number) => void
}) {
  const divRef = useRef<HTMLDivElement>(null)
  const [snapping, setSnapping] = useState(false)
  const ph = Math.max(18, Math.round(item.height * WORLD_TO_PX))

  const toBase = (sx: number, sy: number): [number, number] => {
    const el = baseRef.current
    if (!el) return [0, 0]
    const r = el.getBoundingClientRect()
    return [(sx - r.left) * (BASE_W / r.width), (sy - r.top) * (BASE_H / r.height)]
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    freeCells(item.uid)
    setSnapping(false)

    const onMove = (ev: PointerEvent) => {
      const [bx, by] = toBase(ev.clientX, ev.clientY)
      if (divRef.current) {
        divRef.current.style.left = `${bx}px`
        divRef.current.style.top  = `${by}px`
        divRef.current.style.transition = 'none'
        divRef.current.style.zIndex = '50'
        divRef.current.style.filter = 'drop-shadow(0 10px 24px rgba(0,0,0,0.35))'
      }
    }

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)

      const [bx, by] = toBase(ev.clientX, ev.clientY)
      if (!isOnBase(bx, by, CELL * 1.5)) { onRemove(); return }

      const [col, row] = coordToCell(bx, by)
      const [fc, fr]   = findFreeCell(col, row, item.uid)
      const [fx, fy]   = cellCenter(fc, fr)
      occupyCell(item.uid, fc, fr)
      onSnap(fx, fy, fc, fr)
      setSnapping(true)
      if (divRef.current) {
        divRef.current.style.zIndex = '1'
        divRef.current.style.filter = 'drop-shadow(0 3px 8px rgba(0,0,0,0.22))'
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // 吸附后把 div 位置对齐 state（带动画）
  useEffect(() => {
    if (divRef.current) {
      divRef.current.style.transition = snapping ? 'left 0.18s ease, top 0.18s ease' : 'none'
      divRef.current.style.left = `${item.bx}px`
      divRef.current.style.top  = `${item.by}px`
    }
  }, [item.bx, item.by, snapping])

  return (
    <div
      ref={divRef}
      onPointerDown={onPointerDown}
      style={{
        position: 'absolute',
        left: item.bx,
        top: item.by,
        transform: 'translate(-50%, -100%)',
        cursor: 'grab',
        zIndex: 1,
        filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.22))',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <img
        src={item.url}
        draggable={false}
        style={{ height: ph, width: 'auto', display: 'block', pointerEvents: 'none' }}
      />
    </div>
  )
}

// ── 主页面 ───────────────────────────────────────────────────
export default function SandPage2D() {
  const navigate = useNavigate()
  const baseRef   = useRef<HTMLDivElement>(null)
  const sceneRef  = useRef<HTMLDivElement>(null)
  const [items, setItems]       = useState<PlacedItem[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [zoom, setZoom]         = useState(1)
  const [pan,  setPan]          = useState({ x: 0, y: 0 })
  const isPanning   = useRef(false)
  const lastPanPos  = useRef({ x: 0, y: 0 })
  const pinchDist   = useRef(0)
  const occupiedMap = useRef<Map<string, string>>(new Map())

  // 抽屉拖拽
  const [dragCatalog, setDragCatalog]   = useState<CatalogItem | null>(null)
  const [ghostPos,    setGhostPos]      = useState({ x: 0, y: 0 })
  const dragCatalogRef = useRef<CatalogItem | null>(null)

  // ── 格子管理 ──
  const freeCells = useCallback((uid: string) => {
    for (const [k, v] of occupiedMap.current) if (v === uid) occupiedMap.current.delete(k)
  }, [])
  const occupyCell = useCallback((uid: string, col: number, row: number) => {
    occupiedMap.current.set(`${col},${row}`, uid)
  }, [])
  const findFreeCell = useCallback((col: number, row: number, excludeUid: string): [number, number] => {
    const ok = (c: number, r: number) => {
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return false
      const o = occupiedMap.current.get(`${c},${r}`)
      return !o || o === excludeUid
    }
    if (ok(col, row)) return [col, row]
    for (let rad = 1; rad <= Math.max(COLS, ROWS); rad++)
      for (let dc = -rad; dc <= rad; dc++)
        for (let dr = -rad; dr <= rad; dr++) {
          if (Math.abs(dc) !== rad && Math.abs(dr) !== rad) continue
          if (ok(col + dc, row + dr)) return [col + dc, row + dr]
        }
    return [col, row]
  }, [])

  // ── 从抽屉放置 ──
  const toBase = useCallback((sx: number, sy: number): [number, number] | null => {
    const el = baseRef.current; if (!el) return null
    const r = el.getBoundingClientRect()
    return [(sx - r.left) * (BASE_W / r.width), (sy - r.top) * (BASE_H / r.height)]
  }, [])

  const placeAtScreen = useCallback((sx: number, sy: number) => {
    const cat = dragCatalogRef.current; if (!cat) return
    const coords = toBase(sx, sy); if (!coords) return
    const [bx, by] = coords
    if (!isOnBase(bx, by, 0)) return
    const [col, row] = coordToCell(bx, by)
    const newUid = `i${uidCounter++}`
    const [fc, fr] = findFreeCell(col, row, newUid)
    const [fx, fy] = cellCenter(fc, fr)
    occupyCell(newUid, fc, fr)
    setItems(p => [...p, { uid: newUid, url: cat.url, height: cat.height, bx: fx, by: fy, col: fc, row: fr }])
  }, [toBase, findFreeCell, occupyCell])

  useEffect(() => {
    if (!dragCatalog) return
    const onMove = (e: PointerEvent) => setGhostPos({ x: e.clientX, y: e.clientY })
    const onUp   = (e: PointerEvent) => {
      placeAtScreen(e.clientX, e.clientY)
      setDragCatalog(null); dragCatalogRef.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [dragCatalog, placeAtScreen])

  // ── 滚轮缩放 ──
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    setZoom(z => Math.max(0.85, Math.min(4.0, z * (1 - e.deltaY * 0.001))))
  }, [])
  useEffect(() => {
    const el = sceneRef.current; if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  // 缩小回 1x 时重置 pan
  useEffect(() => { if (zoom <= 1.01) setPan({ x: 0, y: 0 }) }, [zoom])

  // ── 双指捏合缩放（移动端）──
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchDist.current = Math.hypot(dx, dy)
    }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const scale = dist / pinchDist.current
      pinchDist.current = dist
      setZoom(z => Math.max(0.85, Math.min(4.0, z * scale)))
    }
  }

  // ── 背景拖拽平移（放大后）──
  const onBgDown = (e: React.PointerEvent) => {
    if (zoom <= 1.01) return
    isPanning.current = true
    lastPanPos.current = { x: e.clientX, y: e.clientY }
  }
  const onBgMove = (e: React.PointerEvent) => {
    if (!isPanning.current) return
    const dx = e.clientX - lastPanPos.current.x
    const dy = e.clientY - lastPanPos.current.y
    lastPanPos.current = { x: e.clientX, y: e.clientY }
    const limit = BASE_W * (zoom - 1) / 2
    setPan(p => ({
      x: Math.max(-limit, Math.min(limit, p.x + dx)),
      y: Math.max(-limit, Math.min(limit, p.y + dy)),
    }))
  }
  const onBgUp = () => { isPanning.current = false }

  const currentItems = CATEGORIES.find(c => c.id === activeTab)?.items ?? []
  const DRAWER_H = 148

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'url(/sandbox/bg01.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        userSelect: 'none', overflow: 'hidden',
      }}
      onPointerDown={onBgDown}
      onPointerMove={onBgMove}
      onPointerUp={onBgUp}
      onPointerLeave={onBgUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      {/* 关闭 */}
      <button onClick={() => navigate(-1)} style={{
        position: 'absolute', top: 20, left: 20, zIndex: 20,
        width: 40, height: 40, borderRadius: 12,
        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
        border: 'none', fontSize: 18, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}>✕</button>

      {/* 标签 */}
      <div style={{
        position: 'absolute', top: 20, right: 20, zIndex: 20,
        background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)',
        borderRadius: 8, padding: '4px 8px',
        fontSize: 10, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.04em',
      }}>2D 版</div>

      {/* 拖拽幽灵图 */}
      {dragCatalog && (
        <img src={dragCatalog.url} alt="" style={{
          position: 'fixed', left: ghostPos.x - 30, top: ghostPos.y - 50,
          width: 60, height: 60, objectFit: 'contain',
          pointerEvents: 'none', zIndex: 60, opacity: 0.85,
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))',
        }} />
      )}

      {/* 场景（缩放 + 平移） */}
      <div
        ref={sceneRef}
        style={{
          position: 'absolute',
          left: 0, right: 0, top: 0,
          bottom: DRAWER_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: zoom > 1.01 ? 'grab' : 'default',
        }}
      >
        <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}>
          {/* 底座容器 */}
          <div
            ref={baseRef}
            style={{
              position: 'relative',
              width: BASE_W, height: BASE_H,
              flexShrink: 0,
            }}
          >
            {/* 底座图片 */}
            <img
              src="/sandbox/base.png"
              draggable={false}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'fill',
                pointerEvents: 'none',
              }}
            />
            {/* 物品 */}
            {items.map(item => (
              <SandItem
                key={item.uid}
                item={item}
                baseRef={baseRef}
                freeCells={freeCells}
                occupyCell={occupyCell}
                findFreeCell={findFreeCell}
                onRemove={() => { freeCells(item.uid); setItems(p => p.filter(i => i.uid !== item.uid)) }}
                onSnap={(bx, by, col, row) => setItems(p => p.map(i => i.uid === item.uid ? { ...i, bx, by, col, row } : i))}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 底部抽屉 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: DRAWER_H,
        padding: '10px 0 28px',
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
        zIndex: 10,
      }}>
        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', padding: '0 14px 8px', letterSpacing: '0.05em' }}>
          拖拽到底座放置 · 拖出底座删除
        </div>
        {/* 分类 Tab */}
        <div style={{ display: 'flex', gap: 6, padding: '0 14px 8px', overflowX: 'auto' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)} style={{
              flexShrink: 0, padding: '4px 12px', borderRadius: 20,
              border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: activeTab === cat.id ? 'rgba(80,120,80,0.85)' : 'rgba(255,255,255,0.7)',
              color: activeTab === cat.id ? '#fff' : 'rgba(0,0,0,0.55)',
              transition: 'all 0.15s',
            }}>{cat.label}</button>
          ))}
        </div>
        {/* 素材 */}
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
                flexShrink: 0, width: 68, height: 72,
                background: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.85)',
                borderRadius: 14,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4, cursor: 'grab', padding: '6px 4px',
                touchAction: 'none',
              }}
            >
              <img src={item.url} alt={item.label}
                style={{ width: 38, height: 38, objectFit: 'contain', pointerEvents: 'none' }} />
              <span style={{ fontSize: 10, color: '#555', fontWeight: 500, pointerEvents: 'none' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
