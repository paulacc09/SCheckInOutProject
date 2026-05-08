import { NavLink } from "react-router-dom";
import {
  LayoutGrid, Users, Building2, MonitorSmartphone, ClipboardList,
  FileBarChart2, FileText, ShieldCheck, AlertTriangle,
  ArrowLeftRight, UserCircle2, LogOut, UserCog2, Settings
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = {
  administrador: [
    { to: "/admin/obras",          label: "Mis Obras",         icon: Building2 },
    { to: "/admin/personal",       label: "Gestión Personal",  icon: Users },
    { to: "/admin/roles",          label: "Gestión Roles",     icon: UserCog2 },
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
    <aside className="flex flex-col w-[108px] min-h-screen text-slate-200" style={{ background: "#1e2a4a" }}>
      {/* Branding */}
      <div className="px-2 py-5 border-b border-white/10">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[10px] text-white font-bold leading-tight">CHECKINOUT</div>
            <div className="text-[9px] tracking-wider text-slate-400">
              {TITULO_ROL[usuario.rol] || ""}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-1 py-2 rounded-lg text-[10px] text-center transition-colors ${
                isActive
                  ? "bg-[#2a4f88] text-white shadow-sm"
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
      <div className="px-2 py-3 border-t border-white/10">
        <NavLink
          to={
            usuario.rol === "administrador" ? "/admin/perfil"
            : usuario.rol === "inspector_sst" ? "/sst/perfil"
            : "/encargado/perfil"
          }
          className="flex flex-col items-center gap-2 px-1 py-2 rounded-lg hover:bg-white/5"
        >
          <UserCircle2 className="w-7 h-7 text-slate-300" />
          <div className="min-w-0 text-center">
            <div className="text-[10px] font-medium text-white truncate">
              {usuario.nombre}
            </div>
          </div>
        </NavLink>
        <button
          onClick={logout}
          className="mt-2 w-full flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-[10px] text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
