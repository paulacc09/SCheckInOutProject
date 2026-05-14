import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="flex min-h-screen" style={{ background: "#f5f6fa" }}>
      <div className="sticky top-0 h-screen flex-shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto p-4 md:p-6">
        <div className="flex flex-1 flex-col min-h-0 min-w-0 rounded-2xl bg-white shadow-sm overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
