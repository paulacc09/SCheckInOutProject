import { Bell, Settings, UserCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { countPendientes } from "../services/novedadesService";

export default function TopBar({ right, title }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [pendientes, setPendientes] = useState(countPendientes());
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
  useEffect(() => {
    const refresh = () => setPendientes(countPendientes());
    refresh();
    window.addEventListener("checkinout-novedades-changed", refresh);
    return () => window.removeEventListener("checkinout-novedades-changed", refresh);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
      <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800">
        {title || ""}
      </div>
      <div className="flex items-center gap-2">
        {right}
        <button
          className="relative p-2 rounded-lg hover:bg-slate-100"
          title="Notificaciones"
          onClick={() => navigate(notifPath)}
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {pendientes > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] leading-[18px] font-semibold text-center">
              {pendientes}
            </span>
          )}
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
