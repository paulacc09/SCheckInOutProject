import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hidrata desde localStorage
  useEffect(() => {
    const t = localStorage.getItem("checkinout_token");
    const u = localStorage.getItem("checkinout_user");
    if (t && u) {
      setToken(t);
      try { setUsuario(JSON.parse(u)); } catch { /* noop */ }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    // Esperado: { token, usuario: { id, nombre, apellido, email, rol, ... } }
    const t = data.token;
    const u = data.usuario || data.user;
    if (!t || !u) throw new Error("Respuesta de login inválida");

    localStorage.setItem("checkinout_token", t);
    localStorage.setItem("checkinout_user", JSON.stringify(u));
    setToken(t);
    setUsuario(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem("checkinout_token");
    localStorage.removeItem("checkinout_user");
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
