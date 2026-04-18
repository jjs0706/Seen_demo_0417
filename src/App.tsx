import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import HomePage from './pages/HomePage/HomePage'
import RecordPage from './pages/RecordPage/RecordPage'
import StoriesPage from './pages/StoriesPage/StoriesPage'
import CabinPage from './pages/CabinPage/CabinPage'
import MePage from './pages/MePage/MePage'
import SandboxPage from './pages/SandboxPage/SandboxPage'
import CottageStage from './pages/CabinPage/CottageStage'
import SandPage from './pages/SandPage/SandPage'
import HistoryPage from './pages/HistoryPage/HistoryPage'
import ThreeGoodPage from './pages/HealingPages/ThreeGoodPage'
import BreathePage from './pages/HealingPages/BreathePage'
import DriftBottlePage from './pages/HealingPages/DriftBottlePage'
import LighthousePage from './pages/HealingPages/LighthousePage'
import DreamPage from './pages/HealingPages/DreamPage'


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

          {/* 疗愈子页面 */}
          <Route path="healing/three-good"   element={<ThreeGoodPage />} />
          <Route path="healing/drift-bottle" element={<DriftBottlePage />} />
          <Route path="healing/breathe"      element={<BreathePage />} />
          <Route path="healing/lighthouse"   element={<LighthousePage />} />
          <Route path="healing/dream"        element={<DreamPage />} />

          {/* 🔌 沙盘创作（Three.js 3D场景）*/}
          <Route path="sandbox" element={<SandboxPage />} />

          {/* 小屋花海场景（R3F）*/}
          <Route path="cabin/stage" element={<CottageStage />} />

          {/* 🔌 交互沙盘（独立设计，后续接入小屋/疗愈）*/}
          <Route path="sand" element={<SandPage />} />

          {/* 情绪记录历史 */}
          <Route path="history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
