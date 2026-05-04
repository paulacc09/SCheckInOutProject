import { useMemo, useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import TopBar from "../../components/TopBar";

const USERS = [
  { id: "U1", nombre: "Sofía Beltrán Hoyuela", correo: "sofia@gmail.com", rol: "Administrador", obra: "Mandarino", estado: "Activo" },
  { id: "U2", nombre: "Sandra Milena García", correo: "sandra@gmail.com", rol: "Inspector SST", obra: "H. Peñalisa", estado: "Activo" },
  { id: "U3", nombre: "Mauricio Javier Torres", correo: "mauricio@gmail.com", rol: "Encargado", obra: "H. Nakare", estado: "Activo" },
  { id: "U4", nombre: "Edwin Fernando Castro", correo: "edwin@gmail.com", rol: "Administrador", obra: "H. Nakare", estado: "Inactivo" },
];

const ROLE_BADGE = {
  "Inspector SST": "bg-emerald-100 text-emerald-700",
  Encargado: "bg-amber-100 text-amber-700",
  Administrador: "bg-blue-100 text-blue-700",
};

const STATUS_BADGE = {
  Activo: "bg-[#4CAF50] text-white",
  Inactivo: "bg-[#F44336] text-white",
};

export default function Roles() {
  const [q, setQ] = useState("");
  const [rol, setRol] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 5;

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    return USERS.filter((u) => {
      const okQ = !t || `${u.nombre} ${u.correo} ${u.obra}`.toLowerCase().includes(t);
      const okRol = !rol || u.rol === rol;
      return okQ && okRol;
    });
  }, [q, rol]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / perPage));
  const safePage = Math.min(page, totalPages);
  const data = filtrados.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <>
      <TopBar
        right={(
          <button className="btn text-white rounded-lg" style={{ background: "#1565C0" }}>
            <Plus className="w-4 h-4" /> Crear Usuario
          </button>
        )}
      />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Gestión Roles</h2>
        </div>

        <div className="card card-body flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} placeholder="Buscar..." />
          </div>
          <select className="select sm:w-52" value={rol} onChange={(e) => { setPage(1); setRol(e.target.value); }}>
            <option value="">Rol</option>
            <option>Inspector SST</option>
            <option>Encargado</option>
            <option>Administrador</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Obra</th><th>Estado</th><th>Editar</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id + u.correo}>
                  <td>{u.id}</td>
                  <td className="font-medium">{u.nombre}</td>
                  <td>{u.correo}</td>
                  <td><span className={`badge ${ROLE_BADGE[u.rol]}`}>{u.rol}</span></td>
                  <td>{u.obra}</td>
                  <td><span className={`badge ${STATUS_BADGE[u.estado]}`}>{u.estado}</span></td>
                  <td><Pencil className="w-4 h-4 text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-sm text-slate-600">
          Roles disponibles:{" "}
          <span className="badge bg-emerald-100 text-emerald-700">Inspector SST</span>{" "}
          <span className="badge bg-amber-100 text-amber-700">Encargado</span>{" "}
          <span className="badge bg-blue-100 text-blue-700">Administrador</span>
        </div>

        <div className="flex justify-center text-sm text-slate-600 gap-3">
          <button disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>« Previous</button>
          <span>{safePage}</span>
          <span>2</span>
          <span>3</span>
          <span>...</span>
          <span>67</span>
          <span>68</span>
          <button disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next »</button>
        </div>
      </div>
    </>
  );
}
