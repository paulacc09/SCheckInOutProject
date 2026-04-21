import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";

export default function Dispositivos() {
  return (
    <>
      <TopBar title="Dispositivos" subtitle="Lectores biométricos y de cédula" />
      <div className="p-6">
        <div className="card">
          <EmptyState
            title="Módulo de dispositivos"
            message="Conecta tu endpoint /api/dispositivos para listar y registrar lectores."
          />
        </div>
      </div>
    </>
  );
}
