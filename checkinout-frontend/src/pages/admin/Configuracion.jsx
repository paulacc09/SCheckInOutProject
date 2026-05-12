import { useEffect, useState } from "react";
import TopBar from "../../components/TopBar";
import FlashBanner from "../../components/FlashBanner";
import * as configService from "../../services/configService";

const TOGGLES = [
  ["ausencias", "Notificar ausencias", "Alerta al admin si un trabajador no asiste"],
  ["dispositivos", "Notificar nuevos dispositivos", "Alerta cuando se conecta un dispositivo nuevo"],
  ["reportes", "Reportes automáticos", "Generar reporte semanal al correo"],
  ["novedades", "Novedades pendientes", "Recordar novedades sin revisar"],
  ["biometria", "Autenticación biométrica", "Habilitar registro por biometría"],
];

export default function Configuracion() {
  const [flash, setFlash] = useState(null);
  const [form, setForm] = useState({
    empresa: { nombre: "", nit: "", correo: "", telefono: "" },
    horario: { inicio: "", cierre: "" },
    notificaciones: {
      ausencias: true,
      dispositivos: true,
      reportes: false,
      novedades: true,
      biometria: true,
    },
  });

  useEffect(() => {
    (async () => {
      const r = await configService.getConfig();
      if (r.ok) setForm(r.data);
    })();
  }, []);

  const guardar = async () => {
    const r = await configService.saveConfig(form);
    if (r.ok) {
      setForm(r.data);
      setFlash({ type: "ok", message: "Cambios guardados" });
    }
  };

  return (
    <>
      <TopBar title="Configuración del Sistema" />
      <div className="p-6 space-y-4">
        {flash && <FlashBanner type={flash.type} message={flash.message} onClose={() => setFlash(null)} />}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <h3 className="font-semibold text-slate-800">Información de la empresa</h3>
              <div>
                <label className="label">Nombre de la empresa</label>
                <input className="input w-full bg-slate-100" value={form.empresa.nombre} onChange={(e) => setForm((f) => ({ ...f, empresa: { ...f.empresa, nombre: e.target.value } }))} />
              </div>
              <div>
                <label className="label">NIT</label>
                <input className="input w-full bg-slate-100" value={form.empresa.nit} onChange={(e) => setForm((f) => ({ ...f, empresa: { ...f.empresa, nit: e.target.value } }))} />
              </div>
              <div>
                <label className="label">Correo</label>
                <input className="input w-full bg-slate-100" value={form.empresa.correo} onChange={(e) => setForm((f) => ({ ...f, empresa: { ...f.empresa, correo: e.target.value } }))} />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input className="input w-full bg-slate-100" value={form.empresa.telefono} onChange={(e) => setForm((f) => ({ ...f, empresa: { ...f.empresa, telefono: e.target.value } }))} />
              </div>
              <button className="btn text-white self-end" style={{ background: "#f472b6" }} onClick={guardar}>Guardar Cambios</button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-3">Horario jornada laboral</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Hora inicio</label>
                  <input type="time" className="input w-full bg-slate-100" value={form.horario.inicio} onChange={(e) => setForm((f) => ({ ...f, horario: { ...f.horario, inicio: e.target.value } }))} />
                </div>
                <div>
                  <label className="label">Hora cierre</label>
                  <input type="time" className="input w-full bg-slate-100" value={form.horario.cierre} onChange={(e) => setForm((f) => ({ ...f, horario: { ...f.horario, cierre: e.target.value } }))} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-800">Notificaciones y alertas</h3>
            {TOGGLES.map(([key, label, sub]) => {
              const on = !!form.notificaciones[key];
              return (
                <div key={key} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                  <div>
                    <div className="font-semibold text-sm text-slate-800">{label}</div>
                    <div className="text-xs text-slate-500">{sub}</div>
                  </div>
                  <button
                    type="button"
                    className={`w-11 h-6 rounded-full ${on ? "bg-blue-600" : "bg-slate-300"} relative`}
                    onClick={() => setForm((f) => ({ ...f, notificaciones: { ...f.notificaciones, [key]: !on } }))}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
