// SandBed.tsx — 木质托盘 + 沙面平面
import * as THREE from 'three'

const TRAY_W = 3.2    // 托盘宽
const TRAY_D = 2.4    // 托盘深
const TRAY_H = 0.18   // 边框高度
const WALL_T = 0.12   // 边框厚度
const SAND_Y = -TRAY_H / 2 + 0.02  // 沙面稍高于底板

// 木质颜色
const WOOD_COLOR = '#8B6343'
const WOOD_DARK  = '#6B4B2F'
const SAND_COLOR = '#c8a96e'

export default function SandBed() {
  return (
    <group>
      {/* ── 底板 ── */}
      <mesh position={[0, -TRAY_H / 2, 0]} receiveShadow>
        <boxGeometry args={[TRAY_W, 0.06, TRAY_D]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.9} metalness={0} />
      </mesh>

      {/* ── 四面木框 ── */}
      {/* 前 */}
      <mesh position={[0, 0, TRAY_D / 2 - WALL_T / 2]} receiveShadow castShadow>
        <boxGeometry args={[TRAY_W, TRAY_H, WALL_T]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.85} metalness={0} />
      </mesh>
      {/* 后 */}
      <mesh position={[0, 0, -(TRAY_D / 2 - WALL_T / 2)]} receiveShadow castShadow>
        <boxGeometry args={[TRAY_W, TRAY_H, WALL_T]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.85} metalness={0} />
      </mesh>
      {/* 左 */}
      <mesh position={[-(TRAY_W / 2 - WALL_T / 2), 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[WALL_T, TRAY_H, TRAY_D]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.85} metalness={0} />
      </mesh>
      {/* 右 */}
      <mesh position={[TRAY_W / 2 - WALL_T / 2, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[WALL_T, TRAY_H, TRAY_D]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.85} metalness={0} />
      </mesh>

      {/* ── 沙面 ── */}
      <mesh
        position={[0, SAND_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        name="sand-surface"
      >
        <planeGeometry args={[TRAY_W - WALL_T * 2, TRAY_D - WALL_T * 2, 64, 64]} />
        <meshStandardMaterial
          color={SAND_COLOR}
          roughness={0.95}
          metalness={0}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  )
}

// 导出常量供其他组件使用
export { SAND_Y }
