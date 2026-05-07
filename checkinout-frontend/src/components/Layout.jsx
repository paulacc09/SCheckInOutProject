import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--co-bg)" }}>
      <div className="sticky top-0 h-screen flex-shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
