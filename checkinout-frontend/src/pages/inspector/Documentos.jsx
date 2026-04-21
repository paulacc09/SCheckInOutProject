import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";
export default function Documentos() {
  return (<><TopBar title="Documentos" subtitle="Documentos del inspector" /><div className="p-6"><div className="card"><EmptyState title="Sin documentos" message="Conecta /api/documentos." /></div></div></>);
}
