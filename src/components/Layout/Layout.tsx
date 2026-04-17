import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <Outlet />
      <BottomNav />
    </div>
  )
}
