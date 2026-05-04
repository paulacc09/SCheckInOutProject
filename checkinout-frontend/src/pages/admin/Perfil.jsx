import { useState } from "react";
import TopBar from "../../components/TopBar";
import Modal from "../../components/Modal";

export default function Perfil() {
  const [openEdit, setOpenEdit] = useState(false);
  const [openPass, setOpenPass] = useState(false);
  return (
    <>
      <TopBar />
      <div className="p-6 space-y-4">
        <div className="card card-body">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 text-2xl font-bold flex items-center justify-center">CF</div>
              <div>
                <h2 className="text-xl font-bold">Claudia Yulieth Faca</h2>
                <p className="text-sm text-slate-500">Administrador</p>
                <div className="flex gap-4 text-sm mt-1">
                  <button className="text-blue-700" onClick={() => setOpenEdit(true)}>Editar perfil</button>
                  <button className="text-blue-700" onClick={() => setOpenPass(true)}>Cambiar contraseña</button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 self-start">
              <span className="badge bg-blue-100 text-blue-700">Administrador</span>
              <span className="badge bg-slate-100 text-slate-700">Acceso total</span>
              <span className="badge bg-slate-100 text-slate-700">Hoy 8:30 AM</span>
              <span className="badge bg-[#4CAF50] text-white">Activo</span>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            <h3 className="sm:col-span-2 font-semibold">Información personal</h3>
            <div><div className="text-xs uppercase text-slate-500">Nombre Completo</div><div className="font-medium">Claudia Yulieth Faca</div></div>
            <div><div className="text-xs uppercase text-slate-500">Número de documento</div><div className="font-medium">1020195123</div></div>
            <div><div className="text-xs uppercase text-slate-500">Correo</div><div className="font-medium">claudia@megaconstrucciones.com</div></div>
            <div><div className="text-xs uppercase text-slate-500">Teléfono</div><div className="font-medium">+57 313 1234567</div></div>
          </div>
          <div className="card card-body grid gap-3">
            <h3 className="font-semibold">Rol y acceso</h3>
            <div>Rol: <span className="badge bg-blue-100 text-blue-700">Administrador</span></div>
            <div>Permisos: <span className="text-blue-700">Acceso total</span></div>
            <div>Último acceso: Hoy 8:30 AM</div>
            <div>Estado: <span className="badge bg-[#4CAF50] text-white">Activo</span></div>
          </div>
        </div>
        <div className="card card-body">
          <h3 className="font-semibold mb-2">Actividad reciente</h3>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div>Obras gestionadas: <b>30</b></div><div>Reportes generados: <b>20</b></div><div>Usuarios creados: <b>15</b></div>
          </div>
        </div>
      </div>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Editar Perfil" size="lg" footer={null}>
        <p className="text-sm text-slate-500 mb-3">Actualiza tu información personal</p>
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">CF</div>
          <button className="text-blue-700 text-sm">Cambiar foto de perfil</button>
          <div className="grid sm:grid-cols-2 gap-3"><input className="input" defaultValue="Claudia Yulieth" /><input className="input" defaultValue="Faca" /></div>
          <input className="input" value="157895482" disabled />
          <input className="input" defaultValue="+57.313.5789413" />
          <input className="input" defaultValue="claudia@megaconstrucciones.com" />
          <div className="flex justify-end"><button className="btn text-white" style={{ background: "#1565C0" }}>Guardar</button></div>
        </div>
      </Modal>

      <Modal open={openPass} onClose={() => setOpenPass(false)} title="Cambiar contraseña" size="md" footer={null}>
        <p className="text-sm text-slate-500 mb-3">Por seguridad, ingresa tu contraseña actual</p>
        <div className="space-y-3">
          <input className="input" type="password" placeholder="Contraseña actual" />
          <input className="input" type="password" placeholder="Nueva contraseña" />
          <p className="text-xs text-slate-500">Mínimo 8 caracteres - Al menos 1 carácter especial</p>
          <input className="input" type="password" placeholder="Confirmar nueva contraseña" />
          <div className="flex justify-end"><button className="btn text-white" style={{ background: "#1565C0" }}>Guardar</button></div>
        </div>
      </Modal>
    </>
  );
}
