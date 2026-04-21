import TopBar from "../../components/TopBar";
import EmptyState from "../../components/EmptyState";
export default function Notificaciones() {
  return (
    <>
      <TopBar title="Notificaciones" subtitle="Pendientes y avisos del sistema" />
      <div className="p-6"><div className="card"><EmptyState title="Sin notificaciones" message="No tienes notificaciones nuevas." /></div></div>
    </>
  );
}
