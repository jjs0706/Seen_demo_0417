import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
}

interface SandSplashProps {
  origin: THREE.Vector3
  onDone: () => void
}

const PARTICLE_COUNT = 20

// 深浅褐色沙粒颜色池
const SAND_COLORS = [
  new THREE.Color('#c8a96e'),
  new THREE.Color('#b8935a'),
  new THREE.Color('#d4b483'),
  new THREE.Color('#a07848'),
  new THREE.Color('#c49a5e'),
]

export default function SandSplash({ origin, onDone }: SandSplashProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const doneRef = useRef(false)

  // 初始化粒子状态
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.02 + Math.random() * 0.05
      const upward = 0.04 + Math.random() * 0.06
      return {
        position: origin.clone(),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          upward,
          Math.sin(angle) * speed
        ),
        life: 1.0,
        maxLife: 0.6 + Math.random() * 0.4,
      }
    })
  }, [origin])

  // 颜色随机分配
  const colors = useMemo(
    () => particles.map(() => SAND_COLORS[Math.floor(Math.random() * SAND_COLORS.length)]),
    [particles]
  )

  // 初始化颜色
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    colors.forEach((color, i) => mesh.setColorAt(i, color))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [colors])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh || doneRef.current) return

    let allDead = true

    particles.forEach((p, i) => {
      if (p.life <= 0) {
        // 隐藏已死亡粒子
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
        return
      }

      allDead = false

      // 更新物理：重力 + 位置
      p.velocity.y -= 0.003          // 重力
      p.velocity.x *= 0.97           // 空气阻力
      p.velocity.z *= 0.97
      p.position.addScaledVector(p.velocity, 1)

      // 落地检测：Y 贴近沙面就停
      if (p.position.y < origin.y + 0.01) {
        p.position.y = origin.y + 0.01
        p.velocity.set(0, 0, 0)
      }

      p.life -= delta / p.maxLife

      // 大小随生命周期缩小
      const scale = Math.max(0, p.life) * 0.025
      dummy.position.copy(p.position)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })

    mesh.instanceMatrix.needsUpdate = true

    if (allDead && !doneRef.current) {
      doneRef.current = true
      onDone()
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]} castShadow>
      <sphereGeometry args={[1, 4, 4]} />
      <meshStandardMaterial roughness={1} metalness={0} />
    </instancedMesh>
  )
}
