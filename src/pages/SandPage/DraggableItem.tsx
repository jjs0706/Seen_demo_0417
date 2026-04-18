import { useRef, useState, useCallback } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

const SAND_Y = 0.0   // 沙面 Y 坐标
const HOVER_Y = 0.5  // 拖拽时悬浮高度

interface DraggableItemProps {
  initialPosition: [number, number, number]
  color?: string
  size?: [number, number, number]
  modelPath?: string           // 🔌 PLUGIN POINT: 传入 GLB 路径替换占位 Box
  onDrop?: (pos: THREE.Vector3) => void
}

// 🔌 PLUGIN POINT: 替换此组件内部为 useGLTF 加载的真实模型
function ItemMesh({ color, size, modelPath }: { color: string; size: [number, number, number]; modelPath?: string }) {
  if (modelPath) {
    // GLB 加载框架（已预留，取消注释即可使用）
    // const { scene } = useGLTF(modelPath)
    // return <primitive object={scene} />
  }
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
    </mesh>
  )
}

export default function DraggableItem({
  initialPosition,
  color = '#f5f0e8',
  size = [0.3, 0.3, 0.3],
  modelPath,
  onDrop,
}: DraggableItemProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [isDragging, setIsDragging] = useState(false)
  const targetY = useRef(SAND_Y + size[1] / 2)
  const currentY = useRef(initialPosition[1])
  const positionXZ = useRef<[number, number]>([initialPosition[0], initialPosition[2]])

  // 弹性动画：useFrame 里插值逼近 targetY
  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    const diff = targetY.current - currentY.current
    currentY.current += diff * 0.15   // 弹性系数

    group.position.y = currentY.current

    // 拖拽时轻微倾斜
    if (isDragging) {
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0.08, 0.1)
    } else {
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, 0.1)
    }
  })

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    setIsDragging(true)
    targetY.current = HOVER_Y + size[1] / 2
  }, [size])

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return
    e.stopPropagation()
    // 将鼠标射线与 Y=HOVER_Y 平面求交，获得 XZ 坐标
    const group = groupRef.current
    if (!group) return
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -HOVER_Y)
    const intersection = new THREE.Vector3()
    e.ray.intersectPlane(plane, intersection)
    if (intersection) {
      group.position.x = intersection.x
      group.position.z = intersection.z
      positionXZ.current = [intersection.x, intersection.z]
    }
  }, [isDragging])

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsDragging(false)
    targetY.current = SAND_Y + size[1] / 2

    // 触发落地回调（传出落点坐标，用于生成 SandSplash）
    if (onDrop && groupRef.current) {
      const dropPos = new THREE.Vector3(
        positionXZ.current[0],
        SAND_Y,
        positionXZ.current[1]
      )
      onDrop(dropPos)
    }
  }, [size, onDrop])

  return (
    <group
      ref={groupRef}
      position={initialPosition}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <ItemMesh color={color} size={size} modelPath={modelPath} />
    </group>
  )
}
