import { Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Agents from './pages/Agents'
import AgentDetail from './pages/AgentDetail'
import Chat from './pages/Chat'
import Infra from './pages/Infra'
import Tasks from './pages/Tasks'
import TaskDetail from './pages/TaskDetail'

export default function App() {
  return (
    <div className="app">
      <main className="main">
        <Routes>
          <Route path="/" element={<Agents />} />
          <Route path="/agents/:id" element={<AgentDetail />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/infra" element={<Infra />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="*" element={<Agents />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
