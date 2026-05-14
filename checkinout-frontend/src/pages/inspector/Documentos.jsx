import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";

export default function Documentos() {
  return (
    <>
      <TopBar
        title="Documentos"
        subtitle="Documentos de trabajadores en obra"
      />
      <div className="p-6">
        <div className="card">
          <EmptyState
            title="Módulo en desarrollo"
            message="La gestión de documentos estará disponible próximamente."
          />
        </div>
      </div>
    </>
  );
}
