import { mostrarAviso } from "../../services/avisos";
import {
  Home,
  School,
  Church,
  Package,
  QrCode,
  Settings,
  LogOut,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";

const menu = [
  {
    name: "Inicio",
    path: "/",
    icon: Home,
  },
  {
    name: "Salas",
    path: "/salas",
    icon: School,
  },
  {
    name: "Iglesias",
    path: "/iglesias",
    icon: Church,
  },
  {
    name: "Inventario",
    path: "/inventario",
    icon: Package,
  },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const cerrarSesion = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error cerrando sesión:", error);
        mostrarAviso("No fue posible cerrar sesión.");
        return;
      }

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      mostrarAviso("No fue posible cerrar sesión.");
    }
  };

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      {/* =====================================================
          LOGO
      ===================================================== */}

      <div className="flex h-20 items-center border-b border-slate-100 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <QrCode size={21} />
          </div>

          <div>
            <h1 className="font-bold text-slate-900">IDDP Los Andes</h1>

            <p className="text-xs text-slate-500">Catastro de salas</p>
          </div>
        </div>
      </div>

      {/* =====================================================
          MENU
      ===================================================== */}

      <nav className="flex-1 space-y-1 p-4">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `
                flex items-center gap-3 rounded-xl px-4 py-3
                text-sm font-medium transition
                ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }
                `
              }
            >
              <Icon size={19} />

              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="space-y-2 border-t border-slate-100 p-4">
        {/* CONFIGURACIÓN */}

        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <Settings size={18} className="text-slate-500" />

          <span className="text-sm text-slate-600">Configuración</span>
        </div>

        {/* CERRAR SESIÓN */}

        <button
          type="button"
          onClick={cerrarSesion}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />

          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
