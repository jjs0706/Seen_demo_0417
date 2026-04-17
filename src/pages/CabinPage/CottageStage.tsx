/**
 * CottageStage — 小屋花海 3D 场景
 *
 * 技术栈：@react-three/fiber + @react-three/drei + three.js
 * 功能：
 *   - 深邃森林绿背景 + 雾化
 *   - 环境光 + 温暖点光源
 *   - 2000 朵实例化花朵（春风摇曳动画）
 *   - 小屋占位立方体（预留 useGLTF 加载逻辑）
 *   - OrbitControls 交互
 */

import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useNavigate } from 'react-router-dom'

// ─── 花朵颜色：樱花粉 / 明菊黄 / 纯白 / 丁香紫 ───
const PETAL_COLORS = [
  new THREE.Color('#FFB7C5'),
  new THREE.Color('#FFD700'),
  new THREE.Color('#FFFFFF'),
  new THREE.Color('#C8A2C8'),
]

const FLOWER_COUNT = 2000
const FIELD_RADIUS = 16

// ─── 花海组件 ───────────────────────────────────────
function FlowerField() {
  const stemRef  = useRef<THREE.InstancedMesh>(null)
  const headRef  = useRef<THREE.InstancedMesh>(null)

  // 每朵花的随机静态数据（位置、相位、速度）
  const flowers = useMemo(() => (
    Array.from({ length: FLOWER_COUNT }, () => ({
      x:         (Math.random() - 0.5) * FIELD_RADIUS * 2,
      z:         (Math.random() - 0.5) * FIELD_RADIUS * 2,
      stemH:     0.12 + Math.random() * 0.18,
      phase:     Math.random() * Math.PI * 2,
      speed:     0.4 + Math.random() * 0.8,
      amplitude: 0.04 + Math.random() * 0.08,
      color:     PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    }))
  ), [])

  // 初始化颜色（只做一次）
  useEffect(() => {
    if (!headRef.current) return
    flowers.forEach((f, i) => {
      headRef.current!.setColorAt(i, f.color)
    })
    headRef.current.instanceColor!.needsUpdate = true
  }, [flowers])

  // 每帧更新矩阵 → 春风摇曳
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useFrame(({ clock }) => {
    if (!stemRef.current || !headRef.current) return
    const t = clock.getElapsedTime()

    flowers.forEach((f, i) => {
      const sway  = Math.sin(t * f.speed + f.phase)           * f.amplitude
      const swayZ = Math.cos(t * f.speed * 0.7 + f.phase + 1) * f.amplitude * 0.5

      // 茎：绕基部旋转
      dummy.position.set(f.x, f.stemH / 2, f.z)
      dummy.rotation.set(sway, 0, swayZ)
      dummy.updateMatrix()
      stemRef.current!.setMatrixAt(i, dummy.matrix)

      // 花头：跟随茎顶偏移
      dummy.position.set(
        f.x + Math.sin(sway)  * f.stemH,
        f.stemH * (1 - Math.abs(sway) * 0.1),
        f.z + Math.sin(swayZ) * f.stemH
      )
      dummy.updateMatrix()
      headRef.current!.setMatrixAt(i, dummy.matrix)
    })

    stemRef.current.instanceMatrix.needsUpdate = true
    headRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      {/* 花茎 */}
      <instancedMesh ref={stemRef} args={[undefined, undefined, FLOWER_COUNT]} castShadow>
        <cylinderGeometry args={[0.008, 0.012, 0.28, 4]} />
        <meshStandardMaterial color="#3a6b35" roughness={0.9} />
      </instancedMesh>

      {/* 花头 */}
      <instancedMesh ref={headRef} args={[undefined, undefined, FLOWER_COUNT]} castShadow>
        <sphereGeometry args={[0.045, 6, 4]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
    </>
  )
}

// ─── 地面 ────────────────────────────────────────────
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[36, 36]} />
      <meshStandardMaterial color="#0d2b0d" roughness={1} />
    </mesh>
  )
}

// ─── 小屋模型（含占位逻辑）────────────────────────────
//
// useGLTF 加载逻辑已写好，路径预留为 /models/my_cottage.glb
// 当模型文件就绪后：
//   1. 将 public/models/my_cottage.glb 放入项目
//   2. 取消下方 ExternalModel 组件的注释
//   3. 将 <CottagePlaceholder /> 替换为 <ExternalModel />
//
// function ExternalModel() {
//   const { scene } = useGLTF('/models/my_cottage.glb')
//   return <primitive object={scene} position={[0, 0, 0]} />
// }
// useGLTF.preload('/models/my_cottage.glb')

function CottagePlaceholder() {
  return (
    // 将来把这行代码替换为 <ExternalModel />
    <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial color="#FFF8F0" roughness={0.4} metalness={0.05} />
    </mesh>
  )
}

// ─── 场景内容 ─────────────────────────────────────────
function Scene() {
  return (
    <>
      {/* 雾化 */}
      <fog attach="fog" args={['#0A1A0A', 12, 38]} />

      {/* 灯光 */}
      <ambientLight intensity={0.35} />
      {/* 温暖林间点光源 */}
      <pointLight
        position={[4, 7, 4]}
        color="#FFD580"
        intensity={60}
        distance={28}
        castShadow
      />
      {/* 补光，让花海背面不完全黑 */}
      <pointLight position={[-6, 3, -6]} color="#a0c4ff" intensity={8} distance={20} />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={22}
        maxPolarAngle={Math.PI / 2.1}
      />

      <Ground />
      <FlowerField />
      <CottagePlaceholder />
    </>
  )
}

// ─── 页面组件 ─────────────────────────────────────────
export default function CottageStage() {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {/* 返回按钮 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '14px 16px',
        background: 'linear-gradient(to bottom, rgba(10,26,10,0.85) 60%, transparent)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ fontSize: '20px', color: 'rgba(200,220,200,0.8)', padding: '4px' }}
        >
          ←
        </button>
        <span style={{ fontSize: '16px', color: 'rgba(200,220,200,0.85)', fontWeight: 500 }}>
          我的小屋
        </span>
        <span style={{ fontSize: '12px', color: 'rgba(200,220,200,0.4)', marginLeft: 'auto' }}>
          拖动旋转 · 滚轮缩放
        </span>
      </div>

      <Canvas
        shadows
        camera={{ position: [0, 4, 10], fov: 50 }}
        style={{ background: '#0A1A0A' }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
