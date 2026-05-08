import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Loader2 } from "lucide-react";
import api from "../api/axios";

export default function RecuperarPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const response = await api.post("/auth/recuperar-password", { email });
      if (response.data.success === true) {
        setEnviado(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || "No se pudo enviar el correo de recuperación.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-100">
      <div
        className="hidden lg:flex flex-col items-center justify-center p-12 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f1f4d 0%, #1e3a8a 50%, #2563eb 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 text-center max-w-md">
          <div className="w-28 h-28 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-8 backdrop-blur">
            <ShieldCheck className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">CheckInOut</h1>
          <p className="mt-4 text-blue-100 text-lg leading-relaxed">
            Control de Asistencia y Personal en Obras de Construcción
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="font-bold text-xl text-slate-800">CheckInOut</div>
              <div className="text-xs text-slate-500">Control de obras</div>
            </div>
          </div>

          {enviado ? (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900">CheckInOut</h2>
              <p className="text-slate-600">
                Revisa tu correo, te enviamos un enlace para restablecer tu contraseña.
              </p>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => navigate("/login")}
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <h2 className="text-3xl font-bold text-slate-900">¿Olvidaste tu contraseña?</h2>
              <p className="text-slate-500">
                Ingresa tu correo y te enviaremos un enlace para restablecerla
              </p>

              <div>
                <label className="label">Correo corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    className="input pl-9"
                    placeholder="correo@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="btn btn-primary w-full py-2.5"
              >
                {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
                {cargando ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>

              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => navigate("/login")}
              >
                ← Volver al inicio de sesión
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
