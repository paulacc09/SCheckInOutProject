import { Bell, Settings, User, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotificaciones } from "../context/NotificacionesContext";

export default function TopBar({ right, title }) {
  const { usuario } = useAuth();
  const { badge } = useNotificaciones();
  const esAdmin = usuario?.rol === "administrador";
  const homePath =
    usuario?.rol === "administrador"
      ? "/admin/obras"
      : usuario?.rol === "inspector_sst"
        ? "/sst/asistencia"
        : "/encargado/asistencia";
  const notifPath =
    usuario?.rol === "inspector_sst"
      ? "/sst/notificaciones"
      : usuario?.rol === "encargado"
        ? "/encargado/notificaciones"
        : "/admin/notificaciones";
  const perfilPath =
    usuario?.rol === "administrador"
      ? "/admin/perfil"
      : usuario?.rol === "inspector_sst"
        ? "/sst/perfil"
        : "/encargado/perfil";
  const rolTitulo =
    usuario?.rol === "inspector_sst"
      ? "Inspector SST"
      : usuario?.rol === "encargado"
        ? "Encargado"
        : "Administrador";

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to={homePath}
          className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-primary hover:bg-slate-100"
          title="Inicio"
        >
          <ShieldCheck className="w-6 h-6" />
        </Link>
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 truncate">{title || ""}</div>
      </div>
      <div className="flex items-center gap-2">
        {right}
        <Link
          to={notifPath}
          className="relative p-2 rounded-lg hover:bg-slate-100"
          title="Notificaciones"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {badge > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] leading-[18px] font-semibold text-center">
              {badge}
            </span>
          )}
        </Link>
        {esAdmin && (
          <Link
            to="/admin/configuracion"
            className="relative p-2 rounded-lg hover:bg-slate-100"
            title="Configuración"
          >
            <Settings className="w-5 h-5 text-slate-600" />
          </Link>
        )}
        <Link to={perfilPath} className="p-1 rounded-full hover:bg-slate-100" title="Perfil">
          <div className="flex items-center gap-2">
            <User className="w-8 h-8 text-slate-600" />
            <div className="hidden md:block text-left">
              <div className="text-sm text-slate-700 leading-tight">{usuario?.nombre || "Usuario"}</div>
              <div className="text-xs text-slate-500 leading-tight">{rolTitulo}</div>
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
