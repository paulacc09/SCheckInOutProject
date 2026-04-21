import { useAuth } from "../../context/AuthContext";
import TopBar from "../../components/TopBar";
import { UserCircle2 } from "lucide-react";

export default function Perfil() {
  const { usuario } = useAuth();
  if (!usuario) return null;
  return (
    <>
      <TopBar title="Mi Perfil" subtitle="Información de tu cuenta" />
      <div className="p-6">
        <div className="card max-w-2xl">
          <div className="card-body flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle2 className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">{usuario.nombre} {usuario.apellido}</h2>
              <p className="text-sm text-slate-500">{usuario.email}</p>
              <span className="badge badge-info mt-2 capitalize">{usuario.rol?.replace("_", " ")}</span>
            </div>
          </div>
          <div className="card-body border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase text-slate-500">Cédula</div>
              <div className="font-medium">{usuario.cedula || "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500">Teléfono</div>
              <div className="font-medium">{usuario.telefono || "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500">Estado</div>
              <span className="badge badge-success">{usuario.estado || "activo"}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
