import { useRef, useState, useCallback, useContext, useEffect } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { OrbitCtx } from './SandPage'

interface SandSpriteProps {
  textureUrl: string
  height?: number
  initialPosition?: [number, number, number]
  onRemove?: () => void
}

const GROUND_Y = 0.01
const BOUNDS = { minX: -1.4, maxX: 1.4, minZ: -1.0, maxZ: 1.0 }
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const hitPoint = new THREE.Vector3()

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}


export default function SandSprite({
  textureUrl,
  height = 1.0,
  initialPosition = [0, 0, 0],
  onRemove,
}: SandSpriteProps) {
  const texture = useTexture(textureUrl)
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const [dragging, setDragging] = useState(false)
  const orbitRef = useContext(OrbitCtx)
  const dragOffset = useRef(new THREE.Vector3())
  // 缓存 canvas 避免每次点击重新绘制
  const alphaCanvas = useRef<HTMLCanvasElement | null>(null)
  const alphaCtx = useRef<CanvasRenderingContext2D | null>(null)

  const img = texture.image as HTMLImageElement | undefined
  const aspect = img ? img.naturalWidth / img.naturalHeight : 1
  const w = height * aspect
  const centerY = GROUND_Y + height / 2

  // 初始化 alpha 采样 canvas（只做一次）
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

  // 检查 UV 对应的像素是否透明
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
    return data[3] < 30  // alpha < 30/255 视为透明
  }, [])

  useFrame(({ camera }) => {
    if (!groupRef.current) return
    const angle = Math.atan2(
      camera.position.x - groupRef.current.position.x,
      camera.position.z - groupRef.current.position.z
    )
    groupRef.current.rotation.y = angle
    const ty = dragging ? centerY + 0.12 : centerY
    groupRef.current.position.y += (ty - groupRef.current.position.y) * 0.2
  })

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    // 如果点到透明区域，不处理（让事件穿透给后面的元素）
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
    if (orbitRef.current) orbitRef.current.enabled = false
    setDragging(true)
  }, [orbitRef, isTransparent])

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragging || !groupRef.current) return
    e.stopPropagation()
    if (e.ray.intersectPlane(dragPlane, hitPoint)) {
      // 拖拽时不 clamp，允许移出底座
      groupRef.current.position.x = hitPoint.x + dragOffset.current.x
      groupRef.current.position.z = hitPoint.z + dragOffset.current.z
    }
  }, [dragging])

  const onPointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragging) return
    e.stopPropagation()
    if (orbitRef.current) orbitRef.current.enabled = true
    setDragging(false)
    // 松手时检查是否在底座外，若在外则删除
    if (groupRef.current) {
      const { x, z } = groupRef.current.position
      const outside = x < BOUNDS.minX || x > BOUNDS.maxX || z < BOUNDS.minZ || z > BOUNDS.maxZ
      if (outside) onRemove?.()
    }
  }, [dragging, orbitRef, onRemove])

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
