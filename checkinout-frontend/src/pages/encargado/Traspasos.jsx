import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";
export default function Traspasos() {
  return (<><TopBar title="Traspasos" subtitle="Movimientos entre obras" /><div className="p-6"><div className="card"><EmptyState title="Sin traspasos" message="Conecta el endpoint de traspasos." /></div></div></>);
}
