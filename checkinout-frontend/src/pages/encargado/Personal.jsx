import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";

export default function Personal() {
  return (
    <>
      <TopBar title="Personal" subtitle="Vista para el rol encargado" />
      <div className="p-6">
        <div className="card">
          <EmptyState
            title="Personal"
            message="Conecta el endpoint correspondiente del backend para mostrar datos reales."
          />
        </div>
      </div>
    </>
  );
}
