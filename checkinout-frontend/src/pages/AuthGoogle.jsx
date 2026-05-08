import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function AuthGoogle() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginConToken } = useAuth();

  useEffect(() => {
    const error = searchParams.get("error");
    const token = searchParams.get("token");

    if (error) {
      navigate("/login?error=google", { replace: true });
      return;
    }

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    localStorage.setItem("checkinout_token", token);

    api.get("/auth/perfil")
      .then(({ data }) => {
        const usuario = data.data;
        loginConToken(token, usuario);
        const dest =
          usuario.rol === "administrador" ? "/admin/obras"
          : usuario.rol === "inspector_sst" ? "/sst/asistencia"
          : "/encargado/asistencia";
        navigate(dest, { replace: true });
      })
      .catch(() => {
        localStorage.removeItem("checkinout_token");
        localStorage.removeItem("checkinout_user");
        navigate("/login", { replace: true });
      });
  }, [searchParams, navigate, loginConToken]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}