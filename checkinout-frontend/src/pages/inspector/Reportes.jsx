import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";
export default function Reportes() {
  return (<><TopBar title="Reportes" subtitle="Reportes del inspector SST" /><div className="p-6"><div className="card"><EmptyState title="Sin reportes" message="Conecta /api/reportes." /></div></div></>);
}
