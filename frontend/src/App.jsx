import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import EmployeeDashboard from './pages/EmployeeDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import AdminDashboard from './pages/AdminDashboard'

const PrivateRoute = ({ children, roles }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  if (!user) return <Navigate to="/login" />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/employee" element={
          <PrivateRoute roles={['EMPLOYEE']}><EmployeeDashboard /></PrivateRoute>
        } />
        <Route path="/manager" element={
          <PrivateRoute roles={['MANAGER']}><ManagerDashboard /></PrivateRoute>
        } />
        <Route path="/admin" element={
          <PrivateRoute roles={['ADMIN']}><AdminDashboard /></PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}