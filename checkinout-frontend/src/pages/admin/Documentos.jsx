import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";
export default function Documentos() {
  return (
    <>
      <TopBar title="Documentos" subtitle="Gestión documental por trabajador y obra" />
      <div className="p-6"><div className="card"><EmptyState title="Sin documentos" message="Conecta /api/documentos para listar archivos." /></div></div>
    </>
  );
}
