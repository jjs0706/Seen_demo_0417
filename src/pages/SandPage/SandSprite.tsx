import { useRef, useState, useCallback, useContext, useEffect } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { OrbitCtx } from './SandPage'
import { CELL, COLS, ROWS, OX, OZ, footprintCenter, worldToTopLeft } from './gridConfig'

interface SandSpriteProps {
  uid: string
  textureUrl: string
  height?: number
  gridW?: number
  gridH?: number
  initialPosition?: [number, number, number]
  onRemove?: () => void
  freeCells: (uid: string) => void
  occupyCells: (uid: string, col: number, row: number, gw: number, gh: number) => void
  findFreeCell: (col: number, row: number, gw: number, gh: number, excludeUid: string) => [number, number]
}

const GROUND_Y = 0.01
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

function isOutOfBounds(x: number, z: number) {
  // 给一点点正容差，避免边缘精度抖动，但稍微超出就删
  const margin = CELL * 0.5
  return (
    x < OX - margin || x > OX + COLS * CELL + margin ||
    z < OZ - margin || z > OZ + ROWS * CELL + margin
  )
}

export default function SandSprite({
  uid,
  textureUrl,
  height = 1.0,
  gridW = 1,
  gridH = 1,
  initialPosition = [0, 0, 0],
  onRemove,
  freeCells,
  occupyCells,
  findFreeCell,
}: SandSpriteProps) {
  const texture = useTexture(textureUrl)
  const { camera, gl } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const [dragging, setDragging] = useState(false)
  const orbitRef = useContext(OrbitCtx)
  const dragOffset = useRef(new THREE.Vector3())
  const alphaCanvas = useRef<HTMLCanvasElement | null>(null)
  const alphaCtx = useRef<CanvasRenderingContext2D | null>(null)

  const img = texture.image as HTMLImageElement | undefined
  const aspect = img ? img.naturalWidth / img.naturalHeight : 1
  const w = height * aspect
  const centerY = GROUND_Y + height / 2

  useEffect(() => {
    const image = texture.image as HTMLImageElement | null
    if (!image) return
    const c = document.createElement('canvas')
    c.width = image.naturalWidth || image.width || 64
    c.height = image.naturalHeight || image.height || 64
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.drawImage(image, 0, 0, c.width, c.height)
    alphaCanvas.current = c
    alphaCtx.current = ctx
  }, [texture])

  const isTransparent = useCallback((uv: THREE.Vector2): boolean => {
    const ctx = alphaCtx.current
    const c = alphaCanvas.current
    if (!ctx || !c) return false
    const px = Math.floor(uv.x * c.width)
    const py = Math.floor((1 - uv.y) * c.height)
    const data = ctx.getImageData(
      Math.max(0, Math.min(c.width - 1, px)),
      Math.max(0, Math.min(c.height - 1, py)),
      1, 1
    ).data
    return data[3] < 30
  }, [])

  // 屏幕坐标 → 地面交点
  const screenToGround = useCallback((clientX: number, clientY: number): THREE.Vector3 | null => {
    const rect = gl.domElement.getBoundingClientRect()
    const ndx = ((clientX - rect.left) / rect.width) * 2 - 1
    const ndy = -((clientY - rect.top) / rect.height) * 2 + 1
    const ray = new THREE.Raycaster()
    ray.setFromCamera(new THREE.Vector2(ndx, ndy), camera)
    const pt = new THREE.Vector3()
    return ray.ray.intersectPlane(dragPlane, pt) ? pt : null
  }, [camera, gl])

  useFrame(({ camera: cam }) => {
    if (!groupRef.current) return
    const angle = Math.atan2(
      cam.position.x - groupRef.current.position.x,
      cam.position.z - groupRef.current.position.z
    )
    groupRef.current.rotation.y = angle
    const ty = dragging ? centerY + 0.14 : centerY
    groupRef.current.position.y += (ty - groupRef.current.position.y) * 0.18
  })

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.uv && isTransparent(e.uv)) return
    e.stopPropagation()
    if (!groupRef.current) return

    // 计算拖拽偏移
    const pt = screenToGround(e.nativeEvent.clientX, e.nativeEvent.clientY)
    if (pt) {
      dragOffset.current.set(
        groupRef.current.position.x - pt.x,
        0,
        groupRef.current.position.z - pt.z
      )
    }

    freeCells(uid)
    if (orbitRef.current) orbitRef.current.enabled = false
    setDragging(true)

    // 用 window 级别事件，保证拖到画面外也能追踪
    const onWindowMove = (ev: PointerEvent) => {
      if (!groupRef.current) return
      const hit = screenToGround(ev.clientX, ev.clientY)
      if (hit) {
        groupRef.current.position.x = hit.x + dragOffset.current.x
        groupRef.current.position.z = hit.z + dragOffset.current.z
      }
    }

    const onWindowUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onWindowMove)
      window.removeEventListener('pointerup', onWindowUp)
      if (orbitRef.current) orbitRef.current.enabled = true
      setDragging(false)

      if (!groupRef.current) return
      const { x, z } = groupRef.current.position

      // 松手在画面外，或超出底座范围 → 删除
      const rect = gl.domElement.getBoundingClientRect()
      const outsideScreen = (
        ev.clientX < rect.left || ev.clientX > rect.right ||
        ev.clientY < rect.top  || ev.clientY > rect.bottom
      )
      if (outsideScreen || isOutOfBounds(x, z)) {
        onRemove?.()
        return
      }

      // 吸附到最近空格
      const [tc, tr] = worldToTopLeft(x, z, gridW, gridH)
      const [fc, fr] = findFreeCell(tc, tr, gridW, gridH, uid)
      const [cx, cz] = footprintCenter(fc, fr, gridW, gridH)
      groupRef.current.position.x = cx
      groupRef.current.position.z = cz
      occupyCells(uid, fc, fr, gridW, gridH)
    }

    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
  }, [isTransparent, screenToGround, freeCells, uid, orbitRef, gl, gridW, gridH, findFreeCell, occupyCells, onRemove])

  return (
    <group
      ref={groupRef}
      position={[initialPosition[0], centerY, initialPosition[2]]}
      onPointerDown={onPointerDown}
    >
      <mesh ref={meshRef}>
        <planeGeometry args={[w, height]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
