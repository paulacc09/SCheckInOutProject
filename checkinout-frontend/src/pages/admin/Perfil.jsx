import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";
import FlashBanner from "../../components/FlashBanner";
import * as perfilService from "../../services/perfilService";

export default function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [flash, setFlash] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [openPass, setOpenPass] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: "", apellido: "", documento: "", correo: "", telefono: "" });
  const [pwd, setPwd] = useState({ actual: "", nueva: "", confirmar: "" });
  const [pwdErr, setPwdErr] = useState({});
  const [showActual, setShowActual] = useState(false);
  const fotoInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      const r = await perfilService.getPerfil();
      if (r.ok) {
        const d = r.data;
        setPerfil(d);
        setEditForm({
          nombre: d.nombre,
          apellido: d.apellido,
          documento: d.documento ?? "",
          correo: d.correo ?? "",
          telefono: d.telefono ?? "",
        });
      }
    })();
  }, []);

  const iniciales = useMemo(() => {
    if (!perfil) return "AD";
    return `${perfil.nombre?.[0] || ""}${perfil.apellido?.[0] || ""}`.toUpperCase();
  }, [perfil]);

  const guardarPerfil = async () => {
    const r = await perfilService.updatePerfil(editForm);
    if (r.ok) {
      setPerfil((p) =>
        p
          ? {
              ...p,
              nombre: editForm.nombre,
              apellido: editForm.apellido,
              telefono: editForm.telefono,
            }
          : p
      );
      setOpenEdit(false);
      setFlash({ type: "ok", message: "Perfil actualizado" });
    } else {
      setFlash({ type: "error", message: r.message || "No se pudo actualizar" });
    }
  };

  const validarPassword = () => {
    const e = {};
    if (!pwd.actual) e.actual = "Ingresa tu contraseña actual";
    if (!pwd.nueva || pwd.nueva.length < 8) e.nueva = "Mínimo 8 caracteres";
    else if (!/[^a-zA-Z0-9]/.test(pwd.nueva)) e.nueva = "Incluye al menos 1 carácter especial";
    if (!pwd.confirmar) e.confirmar = "Confirma la nueva contraseña";
    else if (pwd.confirmar !== pwd.nueva) e.confirmar = "Las contraseñas no coinciden";
    setPwdErr(e);
    return Object.keys(e).length === 0;
  };

  const guardarPassword = async () => {
    if (!validarPassword()) return;
    const r = await perfilService.cambiarPassword({
      passwordActual: pwd.actual,
      passwordNueva: pwd.nueva,
    });
    if (!r.ok) {
      setPwdErr((x) => ({ ...x, nueva: r.message }));
      return;
    }
    setOpenPass(false);
    setPwd({ actual: "", nueva: "", confirmar: "" });
    setPwdErr({});
    setFlash({ type: "ok", message: "Contraseña actualizada" });
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const r = await perfilService.actualizarFoto(file);
    if (r.ok) {
      if (r.data?.foto_url != null) {
        setPerfil((p) => (p ? { ...p, foto_url: r.data.foto_url } : p));
      }
      setFlash({ type: "ok", message: "Foto actualizada" });
    } else {
      setFlash({ type: "error", message: r.message || "No se pudo subir la foto" });
    }
  };

  if (!perfil) return <><TopBar /><div className="p-6 text-slate-500">Cargando perfil…</div></>;

  return (
    <>
      <TopBar />
      <input
        ref={fotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFotoChange}
      />
      <div className="p-6 space-y-4">
        {flash && <FlashBanner type={flash.type} message={flash.message} onClose={() => setFlash(null)} />}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="flex items-center gap-4">
              {perfil.foto_url ? (
                <img src={perfil.foto_url} alt="" className="w-20 h-20 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-20 h-20 rounded-full text-white text-2xl font-bold flex items-center justify-center shrink-0" style={{ background: "#1e2a4a" }}>{iniciales}</div>
              )}
              <div>
                <h2 className="text-xl font-bold">{perfil.nombre} {perfil.apellido}</h2>
                <p className="text-sm text-slate-500">Administrador</p>
                <div className="flex gap-4 text-sm mt-1">
                  <button className="text-blue-700" onClick={() => setOpenEdit(true)}>Editar perfil</button>
                  <button className="text-blue-700" onClick={() => setOpenPass(true)}>Cambiar contraseña</button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 self-start">
              <span className="badge bg-blue-100 text-blue-700">Administrador</span>
              <span className="badge bg-sky-100 text-sky-700">Acceso total</span>
              <span className="badge bg-green-100 text-green-700">Activo</span>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            <h3 className="sm:col-span-2 font-semibold">Información personal</h3>
            <div><div className="text-xs uppercase text-slate-500">Nombre Completo</div><div className="font-medium">{perfil.nombre} {perfil.apellido}</div></div>
            <div><div className="text-xs uppercase text-slate-500">N° documento</div><input disabled className="input bg-slate-100 mt-1" value={perfil.documento} /></div>
            <div><div className="text-xs uppercase text-slate-500">Correo</div><div className="font-medium">{perfil.correo}</div></div>
            <div><div className="text-xs uppercase text-slate-500">Teléfono</div><div className="font-medium">{perfil.telefono}</div></div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3">
            <h3 className="font-semibold">Rol y acceso</h3>
            <div>Rol: <span className="badge bg-blue-100 text-blue-700">Administrador</span></div>
            <div>Permisos: <span className="text-blue-700">Acceso total</span></div>
            <div>Estado: <span className="badge bg-green-100 text-green-700">Activo</span></div>
          </div>
        </div>
      </div>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Editar Perfil" size="lg" footer={null}>
        <p className="text-sm text-slate-500 mb-3">Actualiza tu información personal</p>
        <div className="space-y-3">
          {perfil.foto_url ? (
            <img src={perfil.foto_url} alt="" className="w-16 h-16 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="w-16 h-16 rounded-full text-white flex items-center justify-center font-bold shrink-0" style={{ background: "#1e2a4a" }}>{iniciales}</div>
          )}
          <button
            type="button"
            className="text-blue-700 text-sm"
            onClick={() => fotoInputRef.current?.click()}
          >
            Cambiar foto de perfil
          </button>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label">Nombres</label><input className="input" value={editForm.nombre} onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))} /></div>
            <div><label className="label">Apellidos</label><input className="input" value={editForm.apellido} onChange={(e) => setEditForm((f) => ({ ...f, apellido: e.target.value }))} /></div>
            <div><label className="label">N° documento</label><input className="input bg-slate-100" value={editForm.documento} disabled /></div>
            <div><label className="label">Teléfono</label><input className="input" value={editForm.telefono} onChange={(e) => setEditForm((f) => ({ ...f, telefono: e.target.value }))} /></div>
            <div className="sm:col-span-2"><label className="label">Correo</label><input className="input bg-slate-100" value={editForm.correo} disabled /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn btn-outline" onClick={() => setOpenEdit(false)}>Cancelar</button>
            <button className="btn text-white" style={{ background: "#1e2a4a" }} onClick={guardarPerfil}>Guardar</button>
          </div>
        </div>
      </Modal>

      <Modal open={openPass} onClose={() => setOpenPass(false)} title="Cambiar contraseña" size="md" footer={null}>
        <p className="text-sm text-slate-500 mb-3">Por seguridad, ingresa tu contraseña actual</p>
        <div className="space-y-3">
          <div>
            <label className="label">Contraseña actual</label>
            <div className="relative">
              <input className="input w-full pr-10" type={showActual ? "text" : "password"} value={pwd.actual} onChange={(e) => setPwd((p) => ({ ...p, actual: e.target.value }))} />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" onClick={() => setShowActual((s) => !s)}>
                {showActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwdErr.actual && <p className="text-xs text-red-600 mt-1">{pwdErr.actual}</p>}
          </div>
          <div>
            <label className="label">Nueva contraseña</label>
            <input className="input w-full" type="password" value={pwd.nueva} onChange={(e) => setPwd((p) => ({ ...p, nueva: e.target.value }))} />
            <p className="text-xs text-slate-500 mt-1">Mínimo 8 caracteres · Al menos 1 carácter especial</p>
            {pwdErr.nueva && <p className="text-xs text-red-600 mt-1">{pwdErr.nueva}</p>}
          </div>
          <div>
            <label className="label">Confirmar nueva contraseña</label>
            <input className="input w-full" type="password" value={pwd.confirmar} onChange={(e) => setPwd((p) => ({ ...p, confirmar: e.target.value }))} />
            {pwdErr.confirmar && <p className="text-xs text-red-600 mt-1">{pwdErr.confirmar}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn btn-outline" onClick={() => setOpenPass(false)}>Cancelar</button>
            <button className="btn text-white" style={{ background: "#1e2a4a" }} onClick={guardarPassword}>Guardar</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
