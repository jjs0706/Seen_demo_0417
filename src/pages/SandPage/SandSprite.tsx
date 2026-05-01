import { useRef, useState, useCallback, useContext, useEffect } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
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
const hitPoint = new THREE.Vector3()

// 是否超出网格范围（带一点容差）
function isOutOfBounds(x: number, z: number) {
  const margin = CELL * 1.5
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

  useFrame(({ camera }) => {
    if (!groupRef.current) return
    const angle = Math.atan2(
      camera.position.x - groupRef.current.position.x,
      camera.position.z - groupRef.current.position.z
    )
    groupRef.current.rotation.y = angle
    const ty = dragging ? centerY + 0.14 : centerY
    groupRef.current.position.y += (ty - groupRef.current.position.y) * 0.18

    // 拖动中：超出底座就删除
    if (dragging) {
      const { x, z } = groupRef.current.position
      if (isOutOfBounds(x, z)) {
        freeCells(uid)
        onRemove?.()
      }
    }
  })

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.uv && isTransparent(e.uv)) return
    e.stopPropagation()
    if (!groupRef.current) return
    if (e.ray.intersectPlane(dragPlane, hitPoint)) {
      dragOffset.current.set(
        groupRef.current.position.x - hitPoint.x,
        0,
        groupRef.current.position.z - hitPoint.z
      )
    }
    freeCells(uid)
    if (orbitRef.current) orbitRef.current.enabled = false
    setDragging(true)
  }, [orbitRef, isTransparent, freeCells, uid])

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragging || !groupRef.current) return
    e.stopPropagation()
    if (e.ray.intersectPlane(dragPlane, hitPoint)) {
      groupRef.current.position.x = hitPoint.x + dragOffset.current.x
      groupRef.current.position.z = hitPoint.z + dragOffset.current.z
    }
  }, [dragging])

  const onPointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragging) return
    e.stopPropagation()
    if (orbitRef.current) orbitRef.current.enabled = true
    setDragging(false)

    if (!groupRef.current) return
    const { x, z } = groupRef.current.position

    if (isOutOfBounds(x, z)) {
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
  }, [dragging, orbitRef, gridW, gridH, findFreeCell, occupyCells, uid, onRemove])

  return (
    <group
      ref={groupRef}
      position={[initialPosition[0], centerY, initialPosition[2]]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
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
