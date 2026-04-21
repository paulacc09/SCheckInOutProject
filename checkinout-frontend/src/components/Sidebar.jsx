import { NavLink } from "react-router-dom";
import {
  LayoutGrid, Users, Building2, MonitorSmartphone, ClipboardList,
  FileBarChart2, FileText, Settings, ShieldCheck, AlertTriangle,
  ArrowLeftRight, UserCircle2, LogOut
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = {
  administrador: [
    { to: "/admin/obras",          label: "Mis Obras",         icon: Building2 },
    { to: "/admin/personal",       label: "Gestión Personal",  icon: Users },
    { to: "/admin/dispositivos",   label: "Dispositivos",      icon: MonitorSmartphone },
    { to: "/admin/asistencias",    label: "Asistencias",       icon: ClipboardList },
    { to: "/admin/reportes",       label: "Reportes",          icon: FileBarChart2 },
    { to: "/admin/documentos",     label: "Documentos",        icon: FileText },
    { to: "/admin/configuracion",  label: "Configuración",     icon: Settings },
  ],
  inspector_sst: [
    { to: "/sst/asistencia",  label: "Asistencia",      icon: ClipboardList },
    { to: "/sst/personal",    label: "Personal en obra",icon: Users },
    { to: "/sst/novedades",   label: "Novedades",       icon: AlertTriangle },
    { to: "/sst/reportes",    label: "Reportes",        icon: FileBarChart2 },
    { to: "/sst/documentos",  label: "Documentos",      icon: FileText },
  ],
  encargado: [
    { to: "/encargado/asistencia", label: "Asistencia", icon: ClipboardList },
    { to: "/encargado/personal",   label: "Personal",   icon: Users },
    { to: "/encargado/novedades",  label: "Novedades",  icon: AlertTriangle },
    { to: "/encargado/traspasos",  label: "Traspasos",  icon: ArrowLeftRight },
  ],
};

const TITULO_ROL = {
  administrador: "ADMINISTRATIVO",
  inspector_sst: "INSPECTOR SST",
  encargado: "ENCARGADO",
};

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  if (!usuario) return null;
  const items = NAV[usuario.rol] || [];

  return (
    <aside
      className="flex flex-col w-64 min-h-screen text-slate-200"
      style={{ background: "var(--co-sidebar-bg)" }}
    >
      {/* Branding */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold leading-tight">CHECKINOUT</div>
            <div className="text-[10px] tracking-wider text-slate-400">
              {TITULO_ROL[usuario.rol] || ""}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer usuario */}
      <div className="px-3 py-3 border-t border-white/10">
        <NavLink
          to={
            usuario.rol === "administrador" ? "/admin/perfil"
            : usuario.rol === "inspector_sst" ? "/sst/perfil"
            : "/encargado/perfil"
          }
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5"
        >
          <UserCircle2 className="w-7 h-7 text-slate-300" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {usuario.nombre} {usuario.apellido}
            </div>
            <div className="text-[11px] text-slate-400 truncate">{usuario.email}</div>
          </div>
        </NavLink>
        <button
          onClick={logout}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
