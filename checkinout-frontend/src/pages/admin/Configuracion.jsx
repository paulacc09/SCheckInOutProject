import TopBar from "../../components/TopBar";
export default function Configuracion() {
  return (
    <>
      <TopBar />
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Configuración</h2>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="card card-body space-y-3">
              <h3 className="font-semibold text-slate-800">Información de la empresa</h3>
              <div><label className="label">Nombre de la empresa</label><input className="input" defaultValue="Mega Construcciones Jiménez SAS" /></div>
              <div><label className="label">NIT</label><input className="input" defaultValue="980173-173-0" /></div>
              <div><label className="label">Correo</label><input className="input" defaultValue="admin@megaconstrucciones.com" /></div>
              <div><label className="label">Teléfono</label><input className="input" defaultValue="+57 313 1234567" /></div>
              <button className="btn text-white self-end" style={{ background: "#1565C0" }}>Guardar Cambios</button>
            </div>
            <div className="card card-body">
              <h3 className="font-semibold text-slate-800 mb-3">Horario jornada laboral</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="label">Hora inicio</label><input className="input" defaultValue="06:00 AM" /></div>
                <div><label className="label">Hora cierre</label><input className="input" defaultValue="18:00 PM" /></div>
              </div>
            </div>
          </div>
          <div className="card card-body space-y-3">
            <h3 className="font-semibold text-slate-800">Notificaciones y alertas</h3>
            {[
              ["Notificar ausencias", "Alerta al admin si un trabajador no asiste", true],
              ["Notificar nuevos dispositivos", "Alerta cuando se conecta un dispositivo nuevo", true],
              ["Reportes automáticos", "Generar reporte semanal al correo", false],
              ["Novedades pendientes", "Recordar novedades sin revisar", true],
              ["Autenticación biométrica", "Habilitar registro en biomarca la", true],
            ].map(([label, sub, on]) => (
              <div key={label} className="flex items-center justify-between border rounded-lg px-3 py-2">
                <div><div className="font-medium text-sm">{label}</div><div className="text-xs text-slate-500">{sub}</div></div>
                <div className={`w-11 h-6 rounded-full ${on ? "bg-blue-600" : "bg-slate-300"} relative`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white ${on ? "right-0.5" : "left-0.5"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
