import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500 text-sm">Cargando…</div>
      </div>
    );
  }
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) {
    // Redirige a su home según rol
    const home =
      usuario.rol === "administrador" ? "/admin/obras"
      : usuario.rol === "inspector_sst" ? "/sst/asistencia"
      : "/encargado/asistencia";
    return <Navigate to={home} replace />;
  }
  return children;
}
