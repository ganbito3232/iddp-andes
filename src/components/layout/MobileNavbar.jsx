import { mostrarAviso } from "../../services/avisos";
import { Home, School, Church, Package, LogOut, X } from "lucide-react";

import { NavLink } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { useState } from "react";

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

export default function MobileNavbar() {
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const confirmarCerrarSesion = async () => {
    try {
      setCerrandoSesion(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error cerrando sesión:", error);

        mostrarAviso("No fue posible cerrar sesión.");

        setCerrandoSesion(false);
        return;
      }

      window.location.replace("/login");
    } catch (error) {
      console.error("Error cerrando sesión:", error);

      mostrarAviso("No fue posible cerrar sesión.");

      setCerrandoSesion(false);
    }
  };

  return (
    <>
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white lg:hidden">
        <div className="grid grid-cols-5">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `
                  flex flex-col items-center justify-center
                  gap-1 py-3 text-xs transition
                  ${isActive ? "text-slate-900" : "text-slate-400"}
                  `
                }
              >
                <Icon size={20} />

                <span>{item.name}</span>
              </NavLink>
            );
          })}

          {/* =================================================
              SALIR
          ================================================= */}

          <button
            type="button"
            onClick={() => setMostrarConfirmacion(true)}
            className="flex flex-col items-center justify-center gap-1 py-3 text-xs text-slate-400 transition hover:text-red-600"
          >
            <LogOut size={20} />

            <span>Salir</span>
          </button>
        </div>
      </nav>

      {/* =====================================================
          CONFIRMACIÓN
      ===================================================== */}

      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            {/* HEADER */}

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  ¿Cerrar sesión?
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Se cerrará tu sesión actual.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMostrarConfirmacion(false)}
                disabled={cerrandoSesion}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* BOTONES */}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMostrarConfirmacion(false)}
                disabled={cerrandoSesion}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarCerrarSesion}
                disabled={cerrandoSesion}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cerrandoSesion ? "Cerrando..." : "Sí, cerrar sesión"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
