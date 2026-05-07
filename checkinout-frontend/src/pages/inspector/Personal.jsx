import { useEffect, useState } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import api from "../../api/axios";
import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";

export default function Personal() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");

  useEffect(() => {
    let alive = true;

    const cargar = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/trabajadores");
        const rows = data?.trabajadores || data?.data || data || [];
        if (!alive) return;
        setTrabajadores(Array.isArray(rows) ? rows : []);
      } catch (err) {
        if (!alive) return;
        setError(err.response?.data?.mensaje || "No se pudo cargar el personal");
        setTrabajadores([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    cargar();

    return () => {
      alive = false;
    };
  }, []);

  const filtrados = trabajadores.filter((t) => {
    const txt = q.trim().toLowerCase();
    const fullName = `${t?.nombre || ""} ${t?.apellido || ""}`.trim().toLowerCase();
    const cedula = String(t?.cedula || "").toLowerCase();
    const okQ = !txt || fullName.includes(txt) || cedula.includes(txt);

    const estadoTrabajador = String(t?.estado || "").toLowerCase();
    const okEstado = !estado || estadoTrabajador === estado;

    return okQ && okEstado;
  });

  return (
    <>
      <TopBar title="Personal en Obra" subtitle="Trabajadores asignados a tu obra" />

      <div className="p-6 space-y-4">
        <div className="card card-body flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input pl-9"
              placeholder="Buscar por nombre o cédula…"
            />
          </div>
          <select className="select sm:w-40" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="activo">activo</option>
            <option value="inactivo">inactivo</option>
          </select>
        </div>

        {loading ? (
          <div className="card card-body flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="card card-body flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="card">
            <EmptyState
              title="Sin personal"
              message="No hay trabajadores asignados a esta obra."
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Cargo</th>
                  <th>Obra</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((t) => {
                  const estadoTrabajador = String(t?.estado || "").toLowerCase();
                  return (
                    <tr key={t.id}>
                      <td className="font-medium text-slate-800">
                        {t?.nombre || ""} {t?.apellido || ""}
                      </td>
                      <td className="font-mono text-xs">{t?.cedula || "—"}</td>
                      <td className="text-slate-600">{t?.subcargo || "—"}</td>
                      <td className="text-slate-600">{t?.obra_nombre || "—"}</td>
                      <td>
                        <span className={estadoTrabajador === "activo" ? "badge badge-success" : "badge badge-muted"}>
                          {estadoTrabajador || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
