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

function isOutOfBounds(x: number, z: number) {
  const margin = CELL * 0.3   // 紧贴底座边缘，只留极小容差
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
  const [dragging, setDragging] = useState(false)
  const orbitRef = useContext(OrbitCtx)
  const dragOffset = useRef(new THREE.Vector3())
  const dragTarget = useRef(new THREE.Vector3())
  const isDraggingRef = useRef(false)
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

  const screenToPlane = useCallback((clientX: number, clientY: number, planeY: number): THREE.Vector3 | null => {
    const rect = gl.domElement.getBoundingClientRect()
    const ndx = ((clientX - rect.left) / rect.width) * 2 - 1
    const ndy = -((clientY - rect.top) / rect.height) * 2 + 1
    const ray = new THREE.Raycaster()
    ray.setFromCamera(new THREE.Vector2(ndx, ndy), camera)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY)
    const pt = new THREE.Vector3()
    return ray.ray.intersectPlane(plane, pt) ? pt : null
  }, [camera, gl])

  // 格子高亮 mesh ref
  const cellHighlightRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = 0

    if (isDraggingRef.current) {
      groupRef.current.position.x += (dragTarget.current.x - groupRef.current.position.x) * 0.30
      groupRef.current.position.z += (dragTarget.current.z - groupRef.current.position.z) * 0.30
    }
    const ty = isDraggingRef.current ? centerY + 0.14 : centerY
    groupRef.current.position.y += (ty - groupRef.current.position.y) * 0.18

    // 格子高亮：跟随 dragTarget snap 到最近格子
    if (cellHighlightRef.current) {
      if (isDraggingRef.current && !isOutOfBounds(dragTarget.current.x, dragTarget.current.z)) {
        const [tc, tr] = worldToTopLeft(dragTarget.current.x, dragTarget.current.z, gridW, gridH)
        const [cx, cz] = footprintCenter(tc, tr, gridW, gridH)
        cellHighlightRef.current.position.set(cx, 0.005, cz)
        cellHighlightRef.current.visible = true
      } else {
        cellHighlightRef.current.visible = false
      }
    }
  })

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.uv && isTransparent(e.uv)) return
    e.stopPropagation()
    if (!groupRef.current) return

    const pt = screenToPlane(e.nativeEvent.clientX, e.nativeEvent.clientY, centerY)
    if (pt) {
      dragOffset.current.set(
        groupRef.current.position.x - pt.x,
        0,
        groupRef.current.position.z - pt.z
      )
    }
    dragTarget.current.set(groupRef.current.position.x, 0, groupRef.current.position.z)

    freeCells(uid)
    if (orbitRef.current) orbitRef.current.enabled = false
    isDraggingRef.current = true
    setDragging(true)

    const onWindowMove = (ev: PointerEvent) => {
      const hit = screenToPlane(ev.clientX, ev.clientY, centerY)
      if (hit) {
        dragTarget.current.x = hit.x + dragOffset.current.x
        dragTarget.current.z = hit.z + dragOffset.current.z
      }
    }

    const onWindowUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onWindowMove)
      window.removeEventListener('pointerup', onWindowUp)
      if (orbitRef.current) orbitRef.current.enabled = true
      isDraggingRef.current = false
      setDragging(false)

      if (!groupRef.current) return
      const x = dragTarget.current.x
      const z = dragTarget.current.z

      const rect = gl.domElement.getBoundingClientRect()
      const outsideScreen = (
        ev.clientX < rect.left - 40 || ev.clientX > rect.right + 40 ||
        ev.clientY < rect.top - 40  || ev.clientY > rect.bottom + 40
      )
      if (outsideScreen || isOutOfBounds(x, z)) {
        onRemove?.()
        return
      }

      const [tc, tr] = worldToTopLeft(x, z, gridW, gridH)
      const [fc, fr] = findFreeCell(tc, tr, gridW, gridH, uid)
      const [cx, cz] = footprintCenter(fc, fr, gridW, gridH)
      groupRef.current.position.x = cx
      groupRef.current.position.z = cz
      dragTarget.current.set(cx, 0, cz)
      occupyCells(uid, fc, fr, gridW, gridH)
    }

    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
  }, [isTransparent, screenToPlane, centerY, freeCells, uid, orbitRef, gl, gridW, gridH, findFreeCell, occupyCells, onRemove])

  return (
    <>
      {/* 格子高亮（拖动时显示落点） */}
      <mesh
        ref={cellHighlightRef}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <planeGeometry args={[CELL * 0.88, CELL * 0.88]} />
        <meshBasicMaterial color="#4caf50" transparent opacity={0.45} depthWrite={false} />
      </mesh>

      <group
        ref={groupRef}
        position={[initialPosition[0], centerY, initialPosition[2]]}
        onPointerDown={onPointerDown}
      >
        <mesh>
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
    </>
  )
}
