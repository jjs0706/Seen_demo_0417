/**
 * CottageStage — 小屋场景
 * 油画花田图片背景 + 3D 小屋模型叠加
 */

import { Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls, Stage } from '@react-three/drei'

// 预加载
useGLTF.preload('/models/my_cottage.glb')

function CottageModel() {
  const { scene } = useGLTF('/models/my_cottage.glb')
  return <primitive object={scene} position={[0, -1, 0]} scale={1.5} />
}

function LoadingBox() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#FFF8F0" />
    </mesh>
  )
}

export default function CottageStage() {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'fixed', inset: 0 }}>

      {/* 油画背景 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/IMG_4472.JPG)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }} />

      {/* 3D Canvas（透明，叠在背景上）*/}
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        gl={{ alpha: true }}
        camera={{ position: [0, 2, 6], fov: 45 }}
        shadows
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />

        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate
          autoRotateSpeed={0.6}
        />

        <Suspense fallback={<LoadingBox />}>
          <CottageModel />
        </Suspense>
      </Canvas>

      {/* 返回按钮 */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 16px',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, transparent 100%)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ fontSize: '20px', color: 'rgba(60,50,40,0.75)', padding: '4px' }}
        >
          ←
        </button>
        <span style={{ fontSize: '16px', color: 'rgba(60,50,40,0.8)', fontWeight: 500 }}>
          我的小屋
        </span>
        <span style={{ fontSize: '11px', color: 'rgba(60,50,40,0.45)', marginLeft: 'auto' }}>
          拖动旋转
        </span>
      </div>
    </div>
  )
}
