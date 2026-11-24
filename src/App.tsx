import { Route, Routes, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Agents from './pages/Agents'
import AgentDetail from './pages/AgentDetail'
import Chat from './pages/Chat'
import Infra from './pages/Infra'

export default function App() {
  const { pathname } = useLocation()
  const hideNav = pathname.startsWith('/agents/')
  return (
    <div className="app">
      <main className="main">
        <Routes>
          <Route path="/" element={<Agents />} />
          <Route path="/agents/:id" element={<AgentDetail />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/infra" element={<Infra />} />
          <Route path="*" element={<Agents />} />
        </Routes>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
