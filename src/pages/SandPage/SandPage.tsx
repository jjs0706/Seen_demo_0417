import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import SandBed from './SandBed'
import DraggableItem from './DraggableItem'
import SandSplash from './SandSplash'

interface SplashEntry {
  id: number
  origin: THREE.Vector3
}

// 3 个占位物体的初始配置
const ITEMS = [
  { id: 1, position: [-0.7,  0.15,  0.3] as [number, number, number], color: '#f0ebe0', size: [0.28, 0.28, 0.28] as [number, number, number] },
  { id: 2, position: [ 0.2,  0.2,  -0.3] as [number, number, number], color: '#e8dcc8', size: [0.22, 0.35, 0.22] as [number, number, number] },
  { id: 3, position: [ 0.8,  0.15,  0.5] as [number, number, number], color: '#ede5d5', size: [0.32, 0.22, 0.26] as [number, number, number] },
]

let splashId = 0

export default function SandPage() {
  const [splashes, setSplashes] = useState<SplashEntry[]>([])

  const handleDrop = useCallback((pos: THREE.Vector3) => {
    setSplashes(prev => [...prev, { id: splashId++, origin: pos.clone() }])
  }, [])

  const removeSplash = useCallback((id: number) => {
    setSplashes(prev => prev.filter(s => s.id !== id))
  }, [])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'transparent',  // 接 healer-demo 时相背景
    }}>
      {/* 返回按钮 */}
      <button
        onClick={() => window.history.back()}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 12,
          padding: '8px 16px',
          color: 'var(--text-primary, #333)',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        ← 返回
      </button>

      <Canvas
        gl={{ alpha: true, antialias: true }}
        shadows
        camera={{
          position: [0, 4.5, 3.5],   // 俯视 + 轻微倾斜
          fov: 45,
          near: 0.1,
          far: 100,
        }}
      >
        {/* 灯光 */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[3, 6, 4]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
        />
        <pointLight position={[-3, 3, -2]} intensity={0.3} color="#ffe4b5" />

        {/* 沙盘托盘 + 沙面 */}
        <SandBed />

        {/* ContactShadows：物体在沙面上的柔和阴影 */}
        <ContactShadows
          position={[0, 0.02, 0]}
          opacity={0.4}
          scale={5}
          blur={1.5}
          far={1}
        />

        {/* 3 个可拖拽占位物体 */}
        {ITEMS.map(item => (
          <DraggableItem
            key={item.id}
            initialPosition={item.position}
            color={item.color}
            size={item.size}
            onDrop={handleDrop}
            // modelPath="/models/xxx.glb"  // 🔌 PLUGIN POINT: 替换为真实 GLB
          />
        ))}

        {/* 沙粒飞溅效果 */}
        {splashes.map(s => (
          <SandSplash
            key={s.id}
            origin={s.origin}
            onDone={() => removeSplash(s.id)}
          />
        ))}

        {/* 相机控制：以俯视为主，限制仰角 */}
        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 6}   // 最大仰起 30°
          maxPolarAngle={Math.PI / 2.2} // 最低接近水平
          minDistance={3}
          maxDistance={8}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  )
}
