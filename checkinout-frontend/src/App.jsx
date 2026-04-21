import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'

// Admin
import AdminObras from './pages/admin/Obras'
import AdminPersonal from './pages/admin/Personal'
import AdminAsistencias from './pages/admin/Asistencias'
import AdminReportes from './pages/admin/Reportes'
import AdminDispositivos from './pages/admin/Dispositivos'
import AdminDocumentos from './pages/admin/Documentos'
import AdminNotificaciones from './pages/admin/Notificaciones'
import AdminConfiguracion from './pages/admin/Configuracion'
import AdminPerfil from './pages/admin/Perfil'

// Inspector SST
import InspectorAsistencia from './pages/inspector/Asistencia'
import InspectorPersonal from './pages/inspector/Personal'
import InspectorNovedades from './pages/inspector/Novedades'
import InspectorReportes from './pages/inspector/Reportes'
import InspectorDocumentos from './pages/inspector/Documentos'

// Encargado
import EncargadoAsistencia from './pages/encargado/Asistencia'
import EncargadoPersonal from './pages/encargado/Personal'
import EncargadoNovedades from './pages/encargado/Novedades'
import EncargadoTraspasos from './pages/encargado/Traspasos'

function RutaProtegida({ children, rolesPermitidos }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/login" replace />
  }
  return children
}

function RedirectPorRol() {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.rol === 'administrador') return <Navigate to="/admin/obras" replace />
  if (usuario.rol === 'inspector_sst') return <Navigate to="/inspector/asistencia" replace />
  if (usuario.rol === 'encargado') return <Navigate to="/encargado/asistencia" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RedirectPorRol />} />

        {/* ADMIN */}
        <Route path="/admin/obras" element={<RutaProtegida rolesPermitidos={['administrador']}><AdminObras /></RutaProtegida>} />
        <Route path="/admin/personal" element={<RutaProtegida rolesPermitidos={['administrador']}><AdminPersonal /></RutaProtegida>} />
        <Route path="/admin/asistencias" element={<RutaProtegida rolesPermitidos={['administrador']}><AdminAsistencias /></RutaProtegida>} />
        <Route path="/admin/reportes" element={<RutaProtegida rolesPermitidos={['administrador']}><AdminReportes /></RutaProtegida>} />
        <Route path="/admin/dispositivos" element={<RutaProtegida rolesPermitidos={['administrador']}><AdminDispositivos /></RutaProtegida>} />
        <Route path="/admin/documentos" element={<RutaProtegida rolesPermitidos={['administrador']}><AdminDocumentos /></RutaProtegida>} />
        <Route path="/admin/notificaciones" element={<RutaProtegida rolesPermitidos={['administrador']}><AdminNotificaciones /></RutaProtegida>} />
        <Route path="/admin/configuracion" element={<RutaProtegida rolesPermitidos={['administrador']}><AdminConfiguracion /></RutaProtegida>} />
        <Route path="/admin/perfil" element={<RutaProtegida rolesPermitidos={['administrador']}><AdminPerfil /></RutaProtegida>} />

        {/* INSPECTOR SST */}
        <Route path="/inspector/asistencia" element={<RutaProtegida rolesPermitidos={['inspector_sst']}><InspectorAsistencia /></RutaProtegida>} />
        <Route path="/inspector/personal" element={<RutaProtegida rolesPermitidos={['inspector_sst']}><InspectorPersonal /></RutaProtegida>} />
        <Route path="/inspector/novedades" element={<RutaProtegida rolesPermitidos={['inspector_sst']}><InspectorNovedades /></RutaProtegida>} />
        <Route path="/inspector/reportes" element={<RutaProtegida rolesPermitidos={['inspector_sst']}><InspectorReportes /></RutaProtegida>} />
        <Route path="/inspector/documentos" element={<RutaProtegida rolesPermitidos={['inspector_sst']}><InspectorDocumentos /></RutaProtegida>} />

        {/* ENCARGADO */}
        <Route path="/encargado/asistencia" element={<RutaProtegida rolesPermitidos={['encargado']}><EncargadoAsistencia /></RutaProtegida>} />
        <Route path="/encargado/personal" element={<RutaProtegida rolesPermitidos={['encargado']}><EncargadoPersonal /></RutaProtegida>} />
        <Route path="/encargado/novedades" element={<RutaProtegida rolesPermitidos={['encargado']}><EncargadoNovedades /></RutaProtegida>} />
        <Route path="/encargado/traspasos" element={<RutaProtegida rolesPermitidos={['encargado']}><EncargadoTraspasos /></RutaProtegida>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}