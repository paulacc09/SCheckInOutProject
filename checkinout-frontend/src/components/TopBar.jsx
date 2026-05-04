import { Bell, Settings, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function TopBar({ right }) {
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
  const seccionTitulo =
    usuario?.rol === "inspector_sst"
      ? "INSPECTOR SST"
      : usuario?.rol === "encargado"
        ? "ENCARGADO"
        : "ADMINISTRATIVO";

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
      <div className="text-base sm:text-lg font-semibold tracking-wide text-slate-800">
        CHECKINOUT - {seccionTitulo}
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
        <button
          className="p-1 rounded-full hover:bg-slate-100"
          title="Perfil"
          onClick={() => navigate(perfilPath)}
        >
          <UserCircle2 className="w-8 h-8 text-slate-600" />
        </button>
      </div>
    </header>
  );
}
