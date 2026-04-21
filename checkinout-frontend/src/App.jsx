import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";

// Admin
import Obras from "./pages/admin/Obras";
import Personal from "./pages/admin/Personal";
import Dispositivos from "./pages/admin/Dispositivos";
import Asistencias from "./pages/admin/Asistencias";
import Reportes from "./pages/admin/Reportes";
import Documentos from "./pages/admin/Documentos";
import Configuracion from "./pages/admin/Configuracion";
import Perfil from "./pages/admin/Perfil";
import Notificaciones from "./pages/admin/Notificaciones";

// Inspector SST
import SstAsistencia from "./pages/inspector/Asistencia";
import SstPersonal from "./pages/inspector/Personal";
import SstNovedades from "./pages/inspector/Novedades";
import SstReportes from "./pages/inspector/Reportes";
import SstDocumentos from "./pages/inspector/Documentos";

// Encargado
import EncAsistencia from "./pages/encargado/Asistencia";
import EncPersonal from "./pages/encargado/Personal";
import EncNovedades from "./pages/encargado/Novedades";
import EncTraspasos from "./pages/encargado/Traspasos";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ADMIN */}
          <Route
            element={
              <ProtectedRoute roles={["administrador"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/obras" element={<Obras />} />
            <Route path="/admin/personal" element={<Personal />} />
            <Route path="/admin/dispositivos" element={<Dispositivos />} />
            <Route path="/admin/asistencias" element={<Asistencias />} />
            <Route path="/admin/reportes" element={<Reportes />} />
            <Route path="/admin/documentos" element={<Documentos />} />
            <Route path="/admin/configuracion" element={<Configuracion />} />
            <Route path="/admin/perfil" element={<Perfil />} />
            <Route path="/admin/notificaciones" element={<Notificaciones />} />
          </Route>

          {/* INSPECTOR SST */}
          <Route
            element={
              <ProtectedRoute roles={["inspector_sst"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/sst/asistencia" element={<SstAsistencia />} />
            <Route path="/sst/personal" element={<SstPersonal />} />
            <Route path="/sst/novedades" element={<SstNovedades />} />
            <Route path="/sst/reportes" element={<SstReportes />} />
            <Route path="/sst/documentos" element={<SstDocumentos />} />
          </Route>

          {/* ENCARGADO */}
          <Route
            element={
              <ProtectedRoute roles={["encargado"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/encargado/asistencia" element={<EncAsistencia />} />
            <Route path="/encargado/personal" element={<EncPersonal />} />
            <Route path="/encargado/novedades" element={<EncNovedades />} />
            <Route path="/encargado/traspasos" element={<EncTraspasos />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
