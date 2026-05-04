import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--co-bg)" }}>
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 p-4 md:p-6">
        <div className="flex flex-1 flex-col min-h-0 min-w-0 rounded-3xl bg-white shadow-sm overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
