import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";
import { useNotificaciones } from "../../context/NotificacionesContext";

function formatFecha(valor) {
  if (!valor) return "—";
  try {
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return String(valor);
    return d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(valor);
  }
}

function esNoLeida(n) {
  return Number(n.leida) === 0;
}

export default function Notificaciones() {
  const {
    badge,
    notificaciones,
    loadingLista,
    fetchNotificaciones,
    marcarLeida,
    marcarTodasLeidas,
  } = useNotificaciones();

  useEffect(() => {
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  return (
    <>
      <TopBar title="Notificaciones" subtitle="Pendientes y avisos del sistema" />
      <div className="p-6 space-y-4">
        {badge > 0 && (
          <div className="card">
            <div className="card-header flex justify-end">
              <button type="button" className="btn btn-outline" onClick={marcarTodasLeidas}>
                Marcar todas como leídas
              </button>
            </div>
          </div>
        )}

        {loadingLista ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--co-primary-500)]" />
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="card">
            <EmptyState title="Sin notificaciones" message="No tienes notificaciones nuevas." />
          </div>
        ) : (
          <div className="space-y-3">
            {notificaciones.map((n) => {
              const noLeida = esNoLeida(n);
              return (
                <div
                  key={n.id}
                  className="card"
                  style={
                    noLeida
                      ? {
                          borderLeft: "4px solid var(--co-primary-500)",
                          background: "var(--co-info-bg)",
                        }
                      : undefined
                  }
                >
                  <div className="card-body">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-semibold">{n.titulo}</p>
                        <p className="text-sm">{n.mensaje}</p>
                        {n.origen_nombre ? (
                          <p className="text-sm" style={{ color: "var(--co-text-muted)" }}>
                            De: {n.origen_nombre}
                          </p>
                        ) : null}
                        <p className="text-sm" style={{ color: "var(--co-text-muted)" }}>
                          {formatFecha(n.created_at)}
                        </p>
                      </div>
                      {noLeida ? (
                        <button
                          type="button"
                          className="btn btn-primary shrink-0"
                          onClick={() => marcarLeida(n.id)}
                        >
                          Marcar como leída
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
