import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Building2, HardHat, Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { id: "administrador", label: "Administrador", icon: ShieldCheck },
  { id: "inspector_sst", label: "Inspector SST", icon: Building2 },
  { id: "encargado",     label: "Encargado",     icon: HardHat },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [rol, setRol] = useState("administrador");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      // Validar que el rol seleccionado coincida con el rol real del usuario
      if (u.rol !== rol) {
        setError(`Tu cuenta es de tipo "${u.rol.replace("_", " ")}". Selecciona el rol correcto.`);
        setLoading(false);
        return;
      }
      const dest =
        u.rol === "administrador" ? "/admin/obras"
        : u.rol === "inspector_sst" ? "/sst/asistencia"
        : "/encargado/asistencia";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.message || "Credenciales inválidas");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel izquierdo - branding */}
      <div
        className="hidden lg:flex flex-col items-center justify-center p-12 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f1f4d 0%, #1e3a8a 50%, #2563eb 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
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

      {/* Panel derecho - formulario */}
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

          <h2 className="text-3xl font-bold text-slate-900">Iniciar Sesión</h2>
          <p className="mt-2 text-slate-500">Selecciona tu rol para continuar</p>

          {/* Selector de rol */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            {ROLES.map(({ id, label, icon: Icon }) => {
              const active = rol === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRol(id)}
                  className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl border text-xs font-medium transition-all ${
                    active
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-center leading-tight">{label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="input pl-9"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Ingresando…" : "Iniciar Sesión"}
            </button>

            <div className="text-center text-sm">
              <Link to="/recuperar" className="text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-400">o</span>
              </div>
            </div>

            <button type="button" className="btn btn-outline w-full py-2.5" disabled>
              Continuar con Google
            </button>

            <p className="text-center text-sm text-slate-500">
              ¿No tienes cuenta?{" "}
              <Link to="/registro" className="text-primary font-medium hover:underline">
                Registrar Empresa
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
