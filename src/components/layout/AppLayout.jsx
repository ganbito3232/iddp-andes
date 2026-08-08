import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNavbar from "./MobileNavbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <main className="min-h-screen lg:ml-64 pb-20 lg:pb-0">
        <Outlet />
      </main>

      <MobileNavbar />
    </div>
  );
}
