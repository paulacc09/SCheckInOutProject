import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";

export default function Asistencia() {
  return (
    <>
      <TopBar title="Asistencia" subtitle="Vista para el rol inspector" />
      <div className="p-6">
        <div className="card">
          <EmptyState
            title="Asistencia"
            message="Conecta el endpoint correspondiente del backend para mostrar datos reales."
          />
        </div>
      </div>
    </>
  );
}
