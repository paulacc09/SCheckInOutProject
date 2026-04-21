import { Bell, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function TopBar({ title, subtitle, right }) {
  const { usuario } = useAuth();
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
      <div>
        {title && <h1 className="page-title">{title}</h1>}
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {right}
        <button className="relative p-2 rounded-lg hover:bg-slate-100" title="Notificaciones">
          <Bell className="w-5 h-5 text-slate-600" />
        </button>
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
            {(usuario?.nombre || "U").charAt(0)}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-slate-800">
              {usuario?.nombre} {usuario?.apellido}
            </div>
            <div className="text-xs text-slate-500 capitalize">
              {usuario?.rol?.replace("_", " ")}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
