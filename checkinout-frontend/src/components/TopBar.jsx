import { Bell, Settings, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function TopBar({ right, title }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const esAdmin = usuario?.rol === "administrador";
  const notifPath =
    usuario?.rol === "inspector_sst"
      ? "/sst/novedades"
      : usuario?.rol === "encargado"
        ? "/encargado/novedades"
        : "/admin/notificaciones";
  const perfilPath =
    usuario?.rol === "administrador"
      ? "/admin/perfil"
      : usuario?.rol === "inspector_sst"
        ? "/sst/personal"
        : "/encargado/personal";
  const rolTitulo =
    usuario?.rol === "inspector_sst"
      ? "Inspector SST"
      : usuario?.rol === "encargado"
        ? "Encargado"
        : "Administrador";

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
      <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800">
        {title || "CheckInOut"}
      </div>
      <div className="flex items-center gap-2">
        {right}
        <button
          className="relative p-2 rounded-lg hover:bg-slate-100"
          title="Notificaciones"
          onClick={() => navigate(notifPath)}
        >
          <Bell className="w-5 h-5 text-slate-600" />
        </button>
        {esAdmin && (
          <button
            className="relative p-2 rounded-lg hover:bg-slate-100"
            title="Configuración"
            onClick={() => navigate("/admin/configuracion")}
          >
            <Settings className="w-5 h-5 text-slate-600" />
          </button>
        )}
        <button className="p-1 rounded-full hover:bg-slate-100" title="Perfil" onClick={() => navigate(perfilPath)}>
          <div className="flex items-center gap-2">
            <UserCircle2 className="w-8 h-8 text-slate-600" />
            <div className="hidden md:block text-left">
              <div className="text-sm text-slate-700 leading-tight">{usuario?.nombre || "Usuario"}</div>
              <div className="text-xs text-slate-500 leading-tight">{rolTitulo}</div>
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}
