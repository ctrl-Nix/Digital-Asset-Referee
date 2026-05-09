import { Routes, Route } from 'react-router-dom'
import DetectionPortal from './pages/DetectionPortal'
import DetectionResult from './pages/DetectionResult'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminRegister from './pages/AdminRegister'
import BatchMonitor from './pages/BatchMonitor'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DetectionPortal />} />
      <Route path="/batch" element={<BatchMonitor />} />
      <Route path="/result/:id" element={<DetectionResult />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/register" element={<AdminRegister />} />
    </Routes>
  )
}
