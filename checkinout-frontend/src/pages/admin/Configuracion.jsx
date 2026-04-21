import TopBar from "../../components/TopBar";
export default function Configuracion() {
  return (
    <>
      <TopBar title="Configuración" subtitle="Preferencias generales del sistema" />
      <div className="p-6 space-y-4">
        <div className="card card-body">
          <h3 className="font-semibold text-slate-800">Empresa</h3>
          <p className="text-sm text-slate-500 mt-1">Datos de tu empresa registrada.</p>
        </div>
        <div className="card card-body">
          <h3 className="font-semibold text-slate-800">Seguridad</h3>
          <p className="text-sm text-slate-500 mt-1">Cambiar contraseña, sesiones activas.</p>
        </div>
      </div>
    </>
  );
}
