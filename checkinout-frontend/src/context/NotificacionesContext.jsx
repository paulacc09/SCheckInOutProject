import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

const NotificacionesContext = createContext(null);

export function NotificacionesProvider({ children }) {
  const { usuario } = useAuth();
  const [badge, setBadge] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);

  const fetchBadge = useCallback(async () => {
    if (!usuario) return;
    try {
      const { data } = await api.get("/notificaciones/badge");
      setBadge(data.data?.total ?? data.total ?? 0);
    } catch {
      // silencioso
    }
  }, [usuario]);

  const fetchNotificaciones = useCallback(async () => {
    if (!usuario) return;
    setLoadingLista(true);
    try {
      const { data } = await api.get("/notificaciones");
      setNotificaciones(data.data ?? data ?? []);
    } catch {
      // silencioso
    } finally {
      setLoadingLista(false);
    }
  }, [usuario]);

  const marcarLeida = useCallback(
    async (id) => {
      try {
        await api.patch(`/notificaciones/${id}/leer`);
        await fetchBadge();
        setNotificaciones((prev) =>
          prev.map((n) => (n.id === id || String(n.id) === String(id) ? { ...n, leida: 1 } : n))
        );
      } catch {
        // silencioso
      }
    },
    [fetchBadge]
  );

  const marcarTodasLeidas = useCallback(async () => {
    try {
      await api.patch("/notificaciones/todas/leer");
      setBadge(0);
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: 1 })));
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    if (!usuario) return;
    fetchBadge();
    const interval = setInterval(fetchBadge, 30000);
    return () => clearInterval(interval);
  }, [usuario, fetchBadge]);

  return (
    <NotificacionesContext.Provider
      value={{
        badge,
        notificaciones,
        loadingLista,
        fetchNotificaciones,
        marcarLeida,
        marcarTodasLeidas,
      }}
    >
      {children}
    </NotificacionesContext.Provider>
  );
}

export const useNotificaciones = () => {
  const ctx = useContext(NotificacionesContext);
  if (!ctx) {
    throw new Error("useNotificaciones debe usarse dentro de <NotificacionesProvider>");
  }
  return ctx;
};
