import { Home, School, Church, Package, QrCode, Settings } from "lucide-react";

import { NavLink } from "react-router-dom";

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
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      {/* Logo */}
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

      {/* Menu */}
      <nav className="flex-1 space-y-1 p-4">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
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

      {/* Footer */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <Settings size={18} className="text-slate-500" />

          <span className="text-sm text-slate-600">Configuración</span>
        </div>
      </div>
    </aside>
  );
}
