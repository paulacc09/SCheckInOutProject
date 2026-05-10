import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Lock,
  Loader2,
  User,
  Hash,
} from "lucide-react";
import api from "../api/axios";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const initialForm = {
  nombre: "",
  nit: "",
  representante_legal: "",
  correo: "",
  telefono: "",
  direccion: "",
  clave: "",
  confirmar_clave: "",
};

export default function RegistroEmpresa() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(initialForm);
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState("");
  const [exito, setExito] = useState(false);
  const [loading, setLoading] = useState(false);

  const onFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrores((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev, [field]: "" };
      return next;
    });
    setErrorServidor("");
  };

  const validar = () => {
    const e = {};
    const nombre = form.nombre.trim();
    const nit = form.nit.trim();
    const rep = form.representante_legal.trim();
    const correo = form.correo.trim();
    const clave = form.clave;
    const confirmar = form.confirmar_clave;

    if (!nombre) e.nombre = "El nombre de la empresa es obligatorio.";
    if (!nit) e.nit = "El NIT es obligatorio.";
    if (!rep) e.representante_legal = "El representante legal es obligatorio.";
    if (!correo) e.correo = "El correo corporativo es obligatorio.";
    else if (!emailRegex.test(correo)) e.correo = "Ingresa un correo válido.";
    if (!clave) e.clave = "La clave es obligatoria.";
    else if (!passwordRegex.test(clave))
      e.clave = "La clave debe tener mínimo 8 caracteres e incluir al menos una letra y un número.";
    if (!confirmar) e.confirmar_clave = "Confirma tu clave.";
    else if (clave !== confirmar) e.confirmar_clave = "Las claves no coinciden.";

    return e;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setErrorServidor("");
    setExito(false);
    const e = validar();
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    const representante_legal = form.representante_legal.trim();
    const partes = representante_legal.split(/\s+/).filter(Boolean);
    const adminNombre = partes[0];
    const adminApellido = partes.slice(1).join(" ") || partes[0];

    const payload = {
      empresa: {
        nombre: form.nombre.trim(),
        nit: form.nit.trim(),
        telefono: form.telefono.trim() || undefined,
        email: form.correo.trim(),
        direccion: form.direccion.trim() || undefined,
        representante_legal,
      },
      admin: {
        nombre: adminNombre,
        apellido: adminApellido,
        email: form.correo.trim(),
        password: form.clave,
        telefono: form.telefono.trim() || undefined,
      },
    };

    setLoading(true);
    try {
      await api.post("/empresas", payload);
      setExito(true);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setErrorServidor(
        err.response?.data?.message ||
          err.response?.data?.mensaje ||
          "No se pudo completar el registro. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div
        className="hidden lg:flex flex-col items-center justify-center p-12 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f1f4d 0%, #1e3a8a 50%, #2563eb 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 text-center max-w-md">
          <div className="w-28 h-28 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-8 backdrop-blur">
            <Building2 className="w-14 h-14 text-white" />
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
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="font-bold text-xl text-slate-800">CheckInOut</div>
              <div className="text-xs text-slate-500">Control de obras</div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-slate-900">Registrar empresa</h2>
          <p className="mt-2 text-slate-500">Crea la cuenta de tu organización</p>
          {searchParams.get("error") === "google_not_found" && (
            <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800">
              Tu cuenta de Google no está registrada en CheckInOut. Registra tu empresa aquí para comenzar.
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre empresa</label>
                <input
                  className="input"
                  value={form.nombre}
                  onChange={(e) => onFieldChange("nombre", e.target.value)}
                  placeholder="Razón social"
                />
                {errores.nombre && (
                  <p className="text-xs text-red-600 mt-1">{errores.nombre}</p>
                )}
              </div>
              <div>
                <label className="label">NIT</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className="input pl-9"
                    value={form.nit}
                    onChange={(e) => onFieldChange("nit", e.target.value)}
                    placeholder="900.123.456-7"
                  />
                </div>
                {errores.nit && <p className="text-xs text-red-600 mt-1">{errores.nit}</p>}
              </div>
            </div>

            <div>
              <label className="label">Representante legal</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="input pl-9"
                  value={form.representante_legal}
                  onChange={(e) => onFieldChange("representante_legal", e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>
              {errores.representante_legal && (
                <p className="text-xs text-red-600 mt-1">{errores.representante_legal}</p>
              )}
            </div>

            <div>
              <label className="label">Correo corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  className="input pl-9"
                  value={form.correo}
                  onChange={(e) => onFieldChange("correo", e.target.value)}
                  placeholder="correo@empresa.com"
                />
              </div>
              {errores.correo && (
                <p className="text-xs text-red-600 mt-1">{errores.correo}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className="input pl-9"
                    value={form.telefono}
                    onChange={(e) => onFieldChange("telefono", e.target.value)}
                    placeholder="+57 123 4567890"
                  />
                </div>
              </div>
              <div>
                <label className="label">Dirección</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className="input pl-9"
                    value={form.direccion}
                    onChange={(e) => onFieldChange("direccion", e.target.value)}
                    placeholder="Dirección"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Clave administrador</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  className="input pl-9"
                  value={form.clave}
                  onChange={(e) => onFieldChange("clave", e.target.value)}
                  placeholder="●●●●●●●"
                />
              </div>
              {errores.clave && (
                <p className="text-xs text-red-600 mt-1">{errores.clave}</p>
              )}
            </div>

            <div>
              <label className="label">Confirmar clave</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  className="input pl-9"
                  value={form.confirmar_clave}
                  onChange={(e) => onFieldChange("confirmar_clave", e.target.value)}
                  placeholder="●●●●●●●"
                />
              </div>
              {errores.confirmar_clave && (
                <p className="text-xs text-red-600 mt-1">{errores.confirmar_clave}</p>
              )}
            </div>

            {exito && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800">
                ¡Registro exitoso! Redirigiendo…
              </div>
            )}

            {errorServidor && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {errorServidor}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || exito}
              className="btn btn-primary w-full py-2.5"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creando cuenta…" : "Crear Cuenta"}
            </button>

            <p className="text-center text-sm text-slate-500">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Inicia sesión
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
