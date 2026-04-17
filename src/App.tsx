import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import HomePage from './pages/HomePage/HomePage'
import RecordPage from './pages/RecordPage/RecordPage'
import StoriesPage from './pages/StoriesPage/StoriesPage'
import CabinPage from './pages/CabinPage/CabinPage'
import MePage from './pages/MePage/MePage'
import SandboxPage from './pages/SandboxPage/SandboxPage'
import CottageStage from './pages/CabinPage/CottageStage'

// 🔌 疗愈中心子页面（目前为占位，后续替换为真实实现）
const ComingSoon = ({ title }: { title: string }) => (
  <div style={{
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 'var(--nav-height)',
    gap: '8px',
    color: 'var(--color-text-sub)',
  }}>
    <div style={{ fontSize: '32px' }}>🌱</div>
    <div style={{ fontSize: '15px' }}>{title}</div>
    <div style={{ fontSize: '12px' }}>即将上线</div>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="record" element={<RecordPage />} />
          <Route path="stories" element={<StoriesPage />} />
          <Route path="cabin" element={<CabinPage />} />
          <Route path="me" element={<MePage />} />

          {/* 🔌 疗愈子页面插口 */}
          <Route path="healing/three-good"   element={<ComingSoon title="三件好事" />} />
          <Route path="healing/drift-bottle" element={<ComingSoon title="漂流瓶" />} />
          <Route path="healing/breathe"      element={<ComingSoon title="呼吸练习" />} />
          <Route path="healing/lighthouse"   element={<ComingSoon title="灯塔守护者" />} />

          {/* 🔌 沙盘创作（Three.js 3D场景）*/}
          <Route path="sandbox" element={<SandboxPage />} />

          {/* 小屋花海场景（R3F）*/}
          <Route path="cabin/stage" element={<CottageStage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
